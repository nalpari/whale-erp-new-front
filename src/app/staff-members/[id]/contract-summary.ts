// 직원 상세의 근로계약 칸(WHALEERP-184). 가장 최근 계약 1건(GET /staff-members/:id/summary/contracts, api #183)을
// 목업 docs/mockup/staff/detail.html 의 다섯 줄로 바꾼다.
// 테스트는 pnpm test 로 함께 돈다. 이 파일만: node --test "src/**/contract-summary.test.ts" — 경로의 [id] 를 node 가 glob 으로 읽어 그대로 적으면 찾지 못한다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "../../../lib/api-types.generated.ts";
import type { EnumValue } from "../../../lib/enums.ts";
import { formatDate } from "../../../lib/format.ts";

/** 근로계약 영역의 계약 한 건 */
export type ContractSummaryItem = components["schemas"]["StaffMemberContractSummaryDto"];

/**
 * 계약 유형 · 계약 기간 · 최근 발송일 · 갱신 예정일 칸의 글자. 계약 상태는 배지라 화면이 그린다.
 * employmentTypeLabel 은 고용 형태 한글이다. enum 을 받지 못했으면 null 이고 계약 유형은 「-」다 — 영문 값을 보이지 않는다.
 * 최근 발송일(contracts.sent_at, 발송 · 재발송 때 덮어쓴다)은 한국 날짜로 보인다. 갱신 예정일은 api 가 정한다 — 체결 완료이고 종료일이
 * 오늘 이후일 때 종료일 30일 전이라 목록의 갱신 예정 배지(RENEWAL_NOTICE_DAYS)와 같은 기준이다.
 */
export function contractSummaryTexts(
  c: Pick<ContractSummaryItem, "startDate" | "endDate" | "lastSentAt" | "renewalDate">,
  employmentTypeLabel: string | null,
): { type: string; period: string; lastSent: string; renewal: string } {
  return {
    type: employmentTypeLabel ? `${employmentTypeLabel} 근로계약` : "-",
    period: c.startDate ? `${c.startDate} ~ ${c.endDate ?? "무기한"}` : "-",
    lastSent: formatDate(c.lastSentAt) || "-",
    renewal: c.renewalDate ?? "-",
  };
}

/**
 * 「급여 계좌」 줄 글자 — 「은행이름 계좌번호」(예 KB국민은행 123456789012). 번호는 api 가 준 전체 숫자 그대로이고 하이픈을 넣거나 가리지 않는다.
 * 신고 정보가 없으면(null) 「-」.
 */
export function payrollAccountText(account: { bankName: string; accountNumber: string } | null | undefined): string {
  return account ? `${account.bankName} ${account.accountNumber}` : "-";
}

/**
 * 받은 enum 목록. 비었으면 받지 못한 것과 같이 null 이다 — getEnum 은 응답에 그 enum 이 빠지면 throw 하지 않고 [] 를 주는데,
 * 그대로 쓰면 labelOf 가 영문 값을 돌려준다(PR #47 리뷰).
 */
export function labelsOrNull(values: EnumValue[]): EnumValue[] | null {
  return values.length ? values : null;
}
