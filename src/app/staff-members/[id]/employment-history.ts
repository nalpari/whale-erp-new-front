import type { StaffMember } from "../../../lib/staff-members.ts";
import { weekParam } from "./summary-view.ts";

type Period = StaffMember["previousRecords"][number];

/** 재직 이력 한 줄 — 칸 이름, 기간 뒤에 흐리게 붙는 말(목업 「· 이전 재직」), 그 기간들(누르면 그 레코드의 상세) */
export type EmploymentHistoryLine = { label: string; note: string | null; links: { href: string; text: string }[] };

/** 「입사일 ~ 퇴직일」. 입사일이 비면 「-」(입사일 채우기 WHALEERP-613 전 레코드), 퇴직일을 정하지 않았으면 재직 중이다 */
export function periodText(period: Period): string {
  return `${period.hiredDate ?? "-"} ~ ${period.retiredDate ?? "재직 중"}`;
}

/**
 * 직원 상세 기본 정보의 재직 이력 줄(WHALEERP-615, 목업 staff/detail.html · 운영 정책 CTR-30). 재입사로 이은 이전 재직 기간은
 * 「재직 이력」, 옛 레코드에서 이후 재입사한 기간은 「이후 재입사」 줄이다. 기간마다 그 레코드의 상세로 가고, 조건(search —
 * historySearch 가 만든 「?…」 또는 빈 문자열)을 이어 달아 거기서도 같은 목록으로 돌아가고 같은 주를 본다. 이은 레코드가 없으면 줄을 두지 않는다. 순서 · 가림 · 체결 완료 거르기는 api 가 정한다.
 */
export function employmentHistoryLines(
  staff: Pick<StaffMember, "previousRecords" | "laterRecords">,
  search: string,
): EmploymentHistoryLine[] {
  const line = (label: string, note: string | null, periods: Period[]): EmploymentHistoryLine[] =>
    periods.length === 0
      ? []
      : [{ label, note, links: periods.map((p) => ({ href: `/staff-members/${p.staffMemberId}${search}`, text: periodText(p) })) }];
  return [...line("재직 이력", "이전 재직", staff.previousRecords), ...line("이후 재입사", null, staff.laterRecords)];
}

/**
 * 재직 이력 링크에 붙일 조건 — 상세의 [목록] 주소(listHref, detailListHrefOf)를 ?back= 으로 싣고(기본 목록이면 싣지 않는다 — 목록의 withBack 과
 * 같다), 근무스케줄이 보던 주(주소 week)를 더한다. 다른 재직 기간으로 가도 [목록]이 같은 조건 · 쪽으로 돌아가고 같은 주를 견줘 볼 수 있게.
 * 주는 근무스케줄 칸과 같은 규칙(weekParam — 여럿이면 앞의 것, 그 주 월요일)으로 읽고, 날짜가 아니면 버린다 — 상세가 어차피 이번 주로 본다.
 */
export function historySearch(listHref: string, week: string | string[] | undefined): string {
  const params = new URLSearchParams();
  if (listHref !== "/staff-members") params.set("back", listHref);
  const monday = weekParam(week);
  if (monday) params.set("week", monday);
  const search = params.toString();
  return search ? `?${search}` : "";
}
