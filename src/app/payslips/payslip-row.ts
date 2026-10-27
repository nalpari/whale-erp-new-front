// 급여명세서 목록 · 상세의 표시 규칙. 문구와 색은 데모(docs/demo/src/staff-sections.mjs · pages/staff/payrolls-detail.mjs)를 따른다.
// 상태 · 사유 한글은 화면이 getEnum 으로 받아 label 로 넘긴다 — 여기는 색과 숫자 모양만 정한다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import { formatAmount, type PayslipItem, type PayslipListItem, type PayslipReviewReason, type PayslipStatus } from "../../lib/payslips.ts";
import { sentText } from "../contracts/contract-list.ts";
import type { Cell, CellStyle } from "../staff-members/staff-row.ts";

/** 상태 배지 색. 데모 tag — 작성 중 quiet · 검토 중 warn · 발송 완료 ok. 확정은 데모에 없어 발송 완료와 같은 on 으로 둔다. */
export const STATUS_STYLE: Record<PayslipStatus, CellStyle> = {
  DRAFTING: "badge-neutral",
  REVIEWING: "badge-off",
  CONFIRMED: "badge-on",
  SENT: "badge-on",
};

/** 목록 상태 칸의 분류 배지 — 확인하지 않은 검토 사유가 남은 명세서(WHALEERP-234, 데모 「검토 대기」) */
export const REVIEW_PENDING_TEXT = "검토 대기";

/** 가린 줄(본사 제공 동의 없는 가맹 점포 직원)의 직원명 칸. 직원 목록과 같은 글자다(ATT-30). */
export const MASKED_TEXT = "본사 제공 동의 없음";

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
    return "가산 대상 아님 · 넣어도 가산하지 않는다";
  if (item.isTaxFree) return "비과세";
  if (item.calculatedAmount === null) return "직접 입력";
  // 계산값을 고쳤으면 계산값을 함께 보인다(okf/staff.md 급여). 계산 근거 글자(데모 「8.0h × 1.5배」)는 api 에 칸이 없다.
  const calculated =
    item.adjustedAmount !== null && item.adjustedAmount !== item.calculatedAmount
      ? `계산값 ${formatAmount(item.calculatedAmount)} 을 ${formatAmount(item.adjustedAmount)} 으로 고침`
      : "계산값";
  return !isPremiumApplied && item.itemCode === "OVERTIME_PAY" ? `가산 미적용 · 1배로 계산 · ${calculated}` : calculated;
}

/**
 * 출·퇴근 현황 조회를 그 명세서의 점포 · 직원 · 급여 기간으로 연다 — 「출퇴근 보정」 · 「출퇴근 기록 보기」. 기간은 보정이 필요한 기록의 기간이다.
 * 직원은 레코드 id 로 좁히고(이름이 비슷한 다른 직원이 섞이지 않게), 퇴직자 명세서도 보이게 재직 상태는 전체로 연다.
 */
export function attendanceHref(p: { storeId: number; staffMemberId: number; staffName: string; periodStartDate: string; periodEndDate: string }): string {
  const q = new URLSearchParams({
    storeIds: String(p.storeId),
    staff: p.staffName,
    staffMemberId: String(p.staffMemberId),
    employment: "ALL",
    fixFrom: p.periodStartDate,
    fixTo: p.periodEndDate,
  });
  return `/attendance-records?${q.toString()}`;
}

/** 위쪽 경고 띠. 공제 미입력은 금액 칸 아래 빨간 띠가 따로 말하므로 뺀다. 이미 확인한 사유(확정 때 확인됨)도 뺀다. 띠가 없으면 null. */
export function reviewBand(reasons: readonly PayslipReviewReason[], labelOf: (reason: string) => string): { title: string; desc: string } | null {
  const shown = reasons.filter((r) => r.reviewReason !== "DEDUCTION_MISSING" && r.acknowledgedAt === null);
  if (!shown.length) return null;
  const [head] = shown;
  const title =
    head.reviewReason === "MISSING_ATTENDANCE" ? "출퇴근 기록이 누락되어 검토 대기로 분류되었습니다" : `${labelOf(head.reviewReason)} 사유로 검토 대기로 분류되었습니다`;
  const details = shown.map((r) => r.detail ?? labelOf(r.reviewReason));
  return { title, desc: `${details.join(". ")}. 확인한 뒤에는 경고가 있어도 확정할 수 있습니다.` };
}
