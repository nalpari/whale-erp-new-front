// 급여명세서 검토 화면의 고칠 거리(WHALEERP-228): 임시저장 본문 · 추가 공제 붙이기 · 떼기 · 지난 명세서 불러오기.
// 화면 줄은 상세의 items 그대로이고, 새로 붙인 추가 공제는 저장 전이라 payslipItemId 를 급여 항목 id 의 음수로 둔다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import { formatAmount, parseAmount, type PayslipAdditionalItem, type PayslipItem, type PayslipPrevious } from "../../../lib/payslips.ts";

/** PUT /payslips/:id 의 items — 줄마다 급여 항목 id 와 금액(빈 칸 null). 숫자가 아닌 칸은 invalid 에 이름을 모은다. */
export function saveItems(
  lines: readonly PayslipItem[],
  texts: ReadonlyMap<number, string>,
): { items: { payslipItemMasterId: number; amount: number | null }[]; invalid: string[] } {
  const invalid: string[] = [];
  const items = lines.map((l) => {
    const amount = parseAmount(texts.get(l.payslipItemId) ?? "");
    if (Number.isNaN(amount)) invalid.push(l.itemName);
    return { payslipItemMasterId: l.payslipItemMasterId, amount };
  });
  return { items, invalid };
}

/** 「항목 추가」 — 추가 공제 한 줄을 빈 칸으로 붙인다. 이미 붙은 항목이면 그대로. */
export function addAdditionalLine(lines: readonly PayslipItem[], master: PayslipAdditionalItem): PayslipItem[] {
  if (lines.some((l) => l.payslipItemMasterId === master.payslipItemMasterId)) return [...lines];
  return [
    ...lines,
    {
      payslipItemId: -master.payslipItemMasterId,
      itemCategory: "ADDITIONAL",
      payslipItemMasterId: master.payslipItemMasterId,
      itemCode: master.itemCode,
      itemName: master.name,
      isTaxFree: false,
      calculatedAmount: null,
      adjustedAmount: null,
      isEntered: false,
    },
  ];
}

export const removeLine = (lines: readonly PayslipItem[], payslipItemId: number) => lines.filter((l) => l.payslipItemId !== payslipItemId);

/**
 * 지난 명세서 값으로 칸을 채운다(저장은 임시저장 때). 같은 급여 항목 줄은 값을 바꾸고, 이 명세서에 없는 추가 공제는 붙인다.
 * 이 명세서에 없는 지급 · 기본 공제 · 원천징수 줄(예: 지난번은 파트타이머였음)은 버린다. filled 는 채운 칸 수.
 */
export function applyPrevious(
  lines: readonly PayslipItem[],
  texts: ReadonlyMap<number, string>,
  previous: PayslipPrevious,
): { lines: PayslipItem[]; texts: Map<number, string>; filled: number } {
  let next = [...lines];
  const nextTexts = new Map(texts);
  let filled = 0;
  for (const p of previous.items) {
    let line = next.find((l) => l.payslipItemMasterId === p.payslipItemMasterId);
    if (!line && p.itemCategory === "ADDITIONAL") {
      next = addAdditionalLine(next, { payslipItemMasterId: p.payslipItemMasterId, itemCode: p.itemCode, name: p.itemName });
      line = next[next.length - 1];
    }
    if (!line) continue;
    nextTexts.set(line.payslipItemId, formatAmount(p.amount));
    filled += 1;
  }
  return { lines: next, texts: nextTexts, filled };
}

/**
 * 아직 확정할 수 없으면 확정할 수 있는 첫날(YYYY-MM-DD), 아니면 null(WHALEERP-690). 그날은 api 상세의 `confirmableFrom` — 확정의
 * 422 PERIOD_NOT_ENDED 와 같은 판정이다. 오늘은 한국 날짜로 받는다. 막는 것은 화면 안내일 뿐이고 최종 판정은 api 가 한다.
 */
export function confirmBlockedUntil(confirmableFrom: string | null, today: string): string | null {
  return confirmableFrom !== null && today < confirmableFrom ? confirmableFrom : null;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 지금부터 다음 한국 자정까지 남은 밀리초 — 막힌 [확정]을 날이 바뀌면 다시 판정하려고 쓴다(한국은 서머타임이 없다) */
export function msUntilNextKstDay(now: Date): number {
  return DAY_MS - ((now.getTime() + KST_OFFSET_MS) % DAY_MS);
}

/** 막힌 [확정]을 다시 볼 간격 — 확정 가능일이 되어 새로 받았는데 서버 날짜가 아직 그 전이면(PC 시계가 빠름) 1분에서 두 배씩 늘려 30분까지 */
export const RECHECK_FIRST_MS = 60_000;
export const RECHECK_MAX_MS = 30 * 60_000;

/**
 * 막힌 [확정]을 지금 다시 받을지와 다음에 볼 때까지의 시간. 브라우저의 한국 날짜가 확정 가능일에 닿았으면 새로 받고 `retryMs` 뒤 다시
 * 본다. 아직 그 전이면 받지 않고 다음 한국 자정(+1초)에 본다 — 확정 가능일이 먼 명세서는 그날 전에는 받지 않는다(WHALEERP-690).
 */
export function blockedRecheck(blockedUntil: string, now: Date, retryMs: number): { refresh: boolean; delayMs: number } {
  const today = new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
  return today >= blockedUntil ? { refresh: true, delayMs: retryMs } : { refresh: false, delayMs: msUntilNextKstDay(now) + 1000 };
}

/** 다음 재시도 간격 — 두 배, 30분까지 */
export const nextRecheckMs = (retryMs: number) => Math.min(retryMs * 2, RECHECK_MAX_MS);
