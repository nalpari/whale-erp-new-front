// 급여명세서 목록 · 상세의 표시 규칙. 문구와 색은 데모(docs/demo/src/staff-sections.mjs · pages/staff/payrolls-detail.mjs)를 따른다.
// 상태 · 사유 한글은 화면이 getEnum 으로 받아 label 로 넘긴다 — 여기는 색과 숫자 모양만 정한다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import {
  formatAmount,
  isItemShown,
  type PayslipDetail,
  type PayslipItem,
  type PayslipListItem,
  type PayslipReviewReason,
  type PayslipStatus,
} from "../../lib/payslips.ts";
import { mondayOf } from "../attendance-records/attendance-query.ts";
import { sentText } from "../contracts/contract-list.ts";
import type { Cell, CellStyle } from "../staff-members/staff-row.ts";
import { isSettledNow } from "../../lib/retirement.ts";

/**
 * 퇴직 꼬리표(WHALEERP-764) — 퇴직한 달 마지막 급여(퇴직 후 14일 안 청산, 근로기준법 제36조)를 쓰는 직원인지 작성 팝업 · 상세에서 가른다.
 * 글자 · 색은 직원 정보 관리 재직 칸(staff-row statusCells)과 같다 — 지난 퇴직일은 회색 「퇴직 YYYY-MM-DD」, 오늘 · 앞으로면 빨간 꼬리표
 * 「퇴직 예정 YYYY-MM-DD」. 오늘은 아직 일하는 날이라 퇴직 예정이다(퇴직 처리와 같은 isSettledNow). 퇴직일이 없으면 null. today 는 kstToday() 값.
 * short 는 작성 팝업의 좁은 직원 칸(데모 94px)용 — 「퇴직 M/D」 · 「예정 M/D」(앞 0 없이, 2026-11-24 사용자 지정). 가장 넓은 「예정 10/30」도
 * 14px 꼬리표 72.8px 로 칸 안쪽 74px 에 한 줄로 든다. 화면 낭독기에는 전체 표기를 따로 읽힌다(작성 팝업). 상세는 전체 날짜다.
 */
export function retirementCell(retiredDate: string | null, today: string, { short = false } = {}): Cell | null {
  if (!retiredDate) return null;
  const settled = isSettledNow(retiredDate, today);
  if (short) {
    const date = `${Number(retiredDate.slice(5, 7))}/${Number(retiredDate.slice(8, 10))}`;
    return settled ? { text: `퇴직 ${date}`, style: "muted" } : { text: `예정 ${date}`, style: "badge-off" };
  }
  return settled ? { text: `퇴직 ${retiredDate}`, style: "muted" } : { text: `퇴직 예정 ${retiredDate}`, style: "badge-off" };
}

/** 상태 배지 색. 데모 tag — 작성 중 quiet · 검토 중 warn · 발송 완료 ok. 확정은 데모에 없어 발송 완료와 같은 on 으로 둔다. */
export const STATUS_STYLE: Record<PayslipStatus, CellStyle> = {
  DRAFTING: "badge-neutral",
  REVIEWING: "badge-off",
  CONFIRMED: "badge-on",
  SENT: "badge-on",
};

/** 목록 상태 칸의 분류 꼬리표 — 확인하지 않은 검토 사유가 남았거나 공제가 빈 명세서(WHALEERP-234 · 운영 정책 v221 PAY-06, 데모 「검토 대기」) */
export const REVIEW_PENDING_TEXT = "검토 대기";

/** 가린 줄(본사 제공 동의 없는 가맹 점포 직원)의 직원명 칸. 직원 목록과 같은 글자다(ATT-30). */
export const MASKED_TEXT = "본사에 정보제공 미동의";

/** 「급여 기간」 칸 — 2026-09-01 ~ 2026-09-30 */
export const periodText = (item: Pick<PayslipListItem, "periodStartDate" | "periodEndDate">) => `${item.periodStartDate} ~ ${item.periodEndDate}`;

/**
 * 「출퇴근 확인 여부」 칸. 검토 사유 출퇴근 누락(MISSING_ATTENDANCE)이 없거나 모두 확인했으면 「확인」, 확인 전이면 「누락」.
 * api 에 누락 일수 칸이 없어 일수는 보이지 않는다(사유 상세 글자는 상세 화면에 있다). 누락은 확인한 뒤에도 확정할 수 있어
 * (검토 사유는 경고) 상태와 따로 보인다. 가린 줄은 null(「-」).
 */
export function attendanceCell(item: Pick<PayslipListItem, "isAttendanceConfirmed">): Cell | null {
  if (item.isAttendanceConfirmed === null) return null;
  return item.isAttendanceConfirmed ? { text: "확인", style: "mark-on" } : { text: "누락", style: "mark-off" };
}

/** 「발송일」 칸 — 마지막 발송 MM-DD(근로계약 목록 발송일과 같은 모양), 발송 전이면 「-」. */
export const sentDateText = (item: Pick<PayslipListItem, "lastSentAt">) => sentText(item.lastSentAt);

/** 지급 칸 아래 도움말. 데모 payrolls-detail 의 help 글자와 같다. */
export function earningHelp(item: Pick<PayslipItem, "itemCode" | "isTaxFree" | "calculatedAmount" | "adjustedAmount">, isPremiumApplied: boolean): string {
  // 가산을 끄면 연장수당을 가산 없이 1배로 계산하고, 관리자가 넣는 야간 · 휴일근무수당은 가산 대상이 아니다(PAY-05, 2026-10-26 재영).
  if (!isPremiumApplied && (item.itemCode === "NIGHT_WORK_PAY" || item.itemCode === "HOLIDAY_WORK_PAY"))
    return "가산 대상 아님 · 넣어도 가산하지 않는다.";
  if (item.isTaxFree) return "비과세";
  if (item.calculatedAmount === null) return "직접 입력";
  // 계산값을 고쳤으면 계산값을 함께 보인다(okf/staff.md 급여). 계산 근거 글자(데모 「8.0h × 1.5배」)는 api 에 칸이 없다.
  const calculated =
    item.adjustedAmount !== null && item.adjustedAmount !== item.calculatedAmount
      ? `계산값 ${formatAmount(item.calculatedAmount)} 을 ${formatAmount(item.adjustedAmount)} 으로 고침`
      : "계산값";
  return !isPremiumApplied && item.itemCode === "OVERTIME_PAY" ? `가산수당 미적용 · 1배로 계산 · ${calculated}` : calculated;
}

/**
 * 출·퇴근 현황 조회를 그 명세서의 점포 · 직원 · 급여 기간으로 연다 — 「출퇴근 기록 확인」 · 「출퇴근 기록 보기」. 기간은 아래 목록의 기간이고, 목록은
 * 그 직원의 기간 기록 전체(`fixAll`)다 — 경고 띠의 날짜(계약 종료 뒤 정상 기록 · 결근 · 휴무 · 첫 주의 지난달 날짜)를 찾을 수 있게(WHALEERP-664).
 * 직원은 레코드 id 로 좁히고(이름이 비슷한 다른 직원이 섞이지 않게), 퇴직자 명세서도 보이게 재직 상태는 전체로 연다.
 */
export function attendanceHref(p: { storeId: number; staffMemberId: number; staffName: string; periodStartDate: string; periodEndDate: string }): string {
  const q = new URLSearchParams({
    storeIds: String(p.storeId),
    staff: p.staffName,
    staffMemberId: String(p.staffMemberId),
    employment: "ALL",
    // 첫 주에 포함된 지난달 날짜도 경고 띠에 나오므로 그 주 월요일부터, 보정 대상이 아닌 기록도 보이게 기간 기록 전체로(WHALEERP-664)
    fixFrom: mondayOf(p.periodStartDate),
    fixTo: p.periodEndDate,
    fixAll: "1",
  });
  return `/attendance-records?${q.toString()}`;
}

// 공제(4대보험 · 세금) 보이는 순서 — 일반 급여명세서처럼 4대보험(국민연금 · 건강보험 · 장기요양보험 · 고용보험)을 먼저 모으고 세금(소득세 · 지방소득세), 3.3% 는 끝
// (2026-11-19 사용자 지정, api 는 고용보험을 장기요양보험 앞에 준다). 공제 칸과 「공제 미입력」 사유 글자가 같이 쓴다
const DEDUCTION_ORDER = [
  "NATIONAL_PENSION",
  "HEALTH_INSURANCE",
  "LONG_TERM_CARE_INSURANCE",
  "EMPLOYMENT_INSURANCE",
  "INCOME_TAX",
  "LOCAL_INCOME_TAX",
  "BUSINESS_INCOME_TAX",
  "BUSINESS_LOCAL_INCOME_TAX",
];

/** 공제 줄을 위 순서로 — 모르는 코드는 받은 순서대로 뒤에 */
export function sortDeductions<T extends Pick<PayslipItem, "itemCode">>(items: readonly T[]): T[] {
  const rank = (code: string) => {
    const i = DEDUCTION_ORDER.indexOf(code);
    return i < 0 ? DEDUCTION_ORDER.length : i;
  };
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => rank(a.item.itemCode) - rank(b.item.itemCode) || a.index - b.index)
    .map((x) => x.item);
}

/**
 * 상세 「검토 사유」 줄 — api 가 준 사유 줄에, 저장된 공제 칸이 비었으면 「공제 미입력」 줄을 더한다(운영 정책 v221 PAY-06,
 * 재영 2026-10-28). 공제 미입력은 사유 줄로 저장되지 않고 공제 칸으로 판정한다 — 목록의 검토 대기 사유와 같은 기준(작성 중 ·
 * 검토 중, 보이는 지급 밖 칸 가운데 넣지 않은 것)이다. 저장한 값 기준이라 임시저장 전 고친 칸은 반영되지 않는다(금액 칸 아래
 * 빨간 띠는 입력 중인 값을 따른다). 더한 줄의 id 는 0 이다(api 사유 id 는 1 부터).
 */
export function detailReviewReasons(
  payslip: Pick<PayslipDetail, "status" | "isWithholdingApplied" | "reviewReasons" | "items">,
): PayslipReviewReason[] {
  // 공제 미입력은 저장된 사유 줄이 아니라 공제 칸으로만 판정한다 — 예전 데이터에 줄이 남아 있어도 두 번 보이지 않게 뺀다
  const stored = payslip.reviewReasons.filter((r) => r.reviewReason !== "DEDUCTION_MISSING");
  if (payslip.status !== "DRAFTING" && payslip.status !== "REVIEWING") return stored;
  const blank = payslip.items.filter(
    (i) => i.itemCategory !== "EARNING" && !i.isEntered && isItemShown(i, payslip.isWithholdingApplied),
  );
  if (!blank.length) return stored;
  return [
    ...stored,
    { payslipReviewReasonId: 0, reviewReason: "DEDUCTION_MISSING", detail: sortDeductions(blank).map((i) => i.itemName).join(", "), acknowledgedAt: null },
  ];
}

/**
 * 검토 사유 상세 글자(api 가 준 문장)를 화면 말투로 다듬는다 — 경고 띠와 「검토 대상 항목」 표가 같이 쓴다(2026-11-19 사용자 지정).
 * 「확인 필요로 표시된 출퇴근 기록이 N건 있습니다(근무지 반경 밖 퇴근, 위치 조작 감지 등).」 →
 * 「근무지 반경 밖 퇴근, 위치 조작 감지 등의 사유로 확인이 필요한 출퇴근 기록이 N건 있습니다.」. api 문장(payslip-attendance-reasons.ts)이 바뀌면
 * 그대로 보인다 — 근본적으로는 api 문장을 고치는 게 맞다(3팀 확인).
 *
 * 날짜 목록이 붙은 문장(출퇴근 누락 「…날이 2일 있습니다(11월 5일 퇴근 미등록, 11월 3일 출근·퇴근 미등록).」 · 계약 만료 후 기록
 * 「…2일 있습니다(11월 21일, 11월 22일).」)은 「…있습니다.」 아래로 유형마다 한 줄 — 「· 출근 · 퇴근 기록 없음: 11월 3일(화), 11월 7일(토)」
 * · 「· 퇴근 기록 없음: 11월 5일(목)」(날짜 순, 요일, 「미등록」은 「기록 없음」, 유형이 없는 계약 만료 후 기록은 「· 11월 21일(토), …」 한 줄,
 * api 의 「외 N일」은 마지막 줄 「· 외 N일」). 요일은 급여 기간 시작일의 연도로 셈하고, 기간 시작 달보다 뒤 달의 날짜는 앞 해다(1월 명세서의
 * 첫 주에 걸친 12월). 날짜로 읽지 못하면 괄호째 다음 줄에 둔다. 이어지는 문장도 줄을 바꾼다 — 화면은 whitespace-pre-line(2026-11-23 사용자 지정).
 */
export function reviewDetailText(text: string, periodStartDate?: string): string {
  return text
    .replace(/^확인 필요로 표시된 출퇴근 기록이 (\d+)건 있습니다\(근무지 반경 밖 퇴근, 위치 조작 감지 등\)\.$/, "근무지 반경 밖 퇴근, 위치 조작 감지 등의 사유로 확인이 필요한 출퇴근 기록이 $1건 있습니다.")
    .replace("확인 필요로 표시된 출퇴근 기록이", "확인이 필요한 출퇴근 기록이")
    .replace(/^(.*있습니다)\((.*)\)\.$/, (_, head: string, list: string) => `${head}.\n${dayLines(list, periodStartDate) ?? `(${list})`}`)
    .replace(/\. (?=\S)/g, ".\n");
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_ITEM = /^(\d{1,2})월 (\d{1,2})일(?: (출근·퇴근|퇴근) 미등록)?$/;

/** month 월이 기준(startYear 년 startMonth 월)에서 가장 가까운 해 — 앞뒤 6달 안 */
function nearestYear(startYear: number, startMonth: number, month: number): number {
  const diff = month - (startMonth || month);
  return diff > 6 ? startYear - 1 : diff < -6 ? startYear + 1 : startYear;
}

/** 「11월 5일 퇴근 미등록, 11월 3일 출근·퇴근 미등록 외 2일」 → 유형별 줄 「· 출근 · 퇴근 기록 없음: 11월 3일(화)」. 한 항목이라도 못 읽으면 null */
function dayLines(list: string, periodStartDate?: string): string | null {
  const more = list.match(/ 외 (\d+)일$/);
  const items = (more ? list.slice(0, -more[0].length) : list).split(", ");
  const [startYear, startMonth] = (periodStartDate ?? "").split("-").map(Number);
  const groups = new Map<string, { key: number; text: string }[]>([["출근·퇴근", []], ["퇴근", []], ["", []]]);
  for (const item of items) {
    const m = item.match(DAY_ITEM);
    if (!m) return null;
    const month = Number(m[1]);
    const day = Number(m[2]);
    // 날짜엔 연도가 없다 — 기준일(출퇴근 참조 기간 시작)에 가장 가까운 해로 잡는다(12월 명세서의 1월 날짜 · 첫 주의 지난해 12월 날짜)
    const year = startYear ? nearestYear(startYear, startMonth, month) : null;
    const weekday = year ? `(${WEEKDAY_KO[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]})` : "";
    groups.get(m[3] ?? "")!.push({ key: (year ?? 0) * 10000 + month * 100 + day, text: `${month}월 ${day}일${weekday}` });
  }
  const label: Record<string, string> = { "출근·퇴근": "출근 · 퇴근 기록 없음: ", 퇴근: "퇴근 기록 없음: ", "": "" };
  const lines = [...groups]
    .filter(([, days]) => days.length > 0)
    .map(([kind, days]) => `· ${label[kind]}${days.sort((x, y) => x.key - y.key).map((d) => d.text).join(", ")}`);
  if (more) lines.push(`· 외 ${more[1]}일`);
  return lines.join("\n");
}

/**
 * 위쪽 경고 띠 — 한 줄로 「⚠ 검토가 필요한 사유가 N건 있습니다. 오른쪽 검토 사유를 확인하고, 문제가 없으면 [확정]해 주세요.」. 사유 내용은 오른쪽
 * 「검토 사유」 표에만 둔다 — 띠와 표에 같은 문장이 두 번 나왔다(2026-11-19 사용자 지정). 건수는 표와 같게 공제 미입력까지 센다. 이미 확인한
 * 사유(확정 때 확인됨)는 빼고, 남은 것이 공제 미입력뿐이면 띠를 두지 않는다 — 공제 칸 아래 빨간 띠가 따로 말한다. 띠가 없으면 null.
 */
export function reviewBand(
  reasons: readonly PayslipReviewReason[],
  /** 아직 확정할 수 없으면 확정할 수 있는 첫날(confirmBlockedUntil) — 그때는 [확정]하라고 하지 않고 그날을 알린다(2026-11-23 사용자 지정) */
  blockedUntil: string | null = null,
): { title: string; desc: string; inline: boolean } | null {
  const open = reasons.filter((r) => r.acknowledgedAt === null);
  if (!open.some((r) => r.reviewReason !== "DEDUCTION_MISSING")) return null;
  const desc = blockedUntil
    ? `오른쪽 검토 사유를 확인해 주세요. ${blockedUntil}부터 확정할 수 있습니다.`
    : "오른쪽 검토 사유를 확인하고, 문제가 없으면 [확정]해 주세요.";
  return { title: `검토가 필요한 사유가 ${open.length}건 있습니다.`, desc, inline: true };
}

/**
 * 「공제 미입력」의 [공제 칸으로 이동]이 갈 상자 — 비어 있는 기본 공제(3.3% 포함)가 있으면 「공제 항목(4대보험 · 세금)」, 추가 공제만 비었으면
 * 「공제 항목(추가)」. 늘 기본 공제 상자로 가면 빈 칸이 추가 공제에만 있을 때 다 채운 상자로 갔다(ip-code-review)
 */
export function deductionAnchor(payslip: Pick<PayslipDetail, "isWithholdingApplied" | "items">): "#deduction-basic" | "#deduction-additional" {
  const blank = payslip.items.filter((i) => i.itemCategory !== "EARNING" && !i.isEntered && isItemShown(i, payslip.isWithholdingApplied));
  return blank.length > 0 && blank.every((i) => i.itemCategory === "ADDITIONAL") ? "#deduction-additional" : "#deduction-basic";
}
