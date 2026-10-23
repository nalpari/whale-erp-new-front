import type { StaffMember } from "../../../lib/staff-members.ts";

type Period = StaffMember["previousRecords"][number];

/** 재직 이력 한 줄 — 칸 이름, 기간 뒤에 흐리게 붙는 말(목업 「· 이전 재직」), 그 기간들(누르면 그 레코드의 상세) */
export type EmploymentHistoryLine = { label: string; note: string | null; links: { href: string; text: string }[] };

/** 「입사일 ~ 퇴직일」. 입사일이 비면 「-」(입사일 채우기 WHALEERP-613 전 레코드), 퇴직일을 정하지 않았으면 재직 중이다 */
export function periodText(period: Period): string {
  return `${period.hiredDate ?? "-"} ~ ${period.retiredDate ?? "재직 중"}`;
}

/**
 * 직원 상세 기본 정보의 재직 이력 줄(WHALEERP-615, 목업 staff/detail.html · 운영 정책 CTR-30). 재입사로 이은 이전 재직 기간은
 * 「재직 이력」, 옛 레코드에서 이후 재입사한 기간은 「이후 재입사」 줄이다. 기간마다 그 레코드의 상세로 가고, 목록 조건(listSearch)을
 * 이어 달아 거기서도 목록으로 돌아갈 수 있다. 이은 레코드가 없으면 줄을 두지 않는다. 순서 · 가림 · 체결 완료 거르기는 api 가 정한다.
 */
export function employmentHistoryLines(
  staff: Pick<StaffMember, "previousRecords" | "laterRecords">,
  listSearch: string,
): EmploymentHistoryLine[] {
  const line = (label: string, note: string | null, periods: Period[]): EmploymentHistoryLine[] =>
    periods.length === 0
      ? []
      : [{ label, note, links: periods.map((p) => ({ href: `/staff-members/${p.staffMemberId}${listSearch}`, text: periodText(p) })) }];
  return [...line("재직 이력", "이전 재직", staff.previousRecords), ...line("이후 재입사", null, staff.laterRecords)];
}
