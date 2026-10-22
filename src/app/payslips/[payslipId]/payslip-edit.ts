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
