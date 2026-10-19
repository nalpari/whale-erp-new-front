// 직원 상세의 근로계약 칸(WHALEERP-184). 가장 최근 계약 1건을 목업 docs/mockup/staff/detail.html 의 다섯 줄로 바꾼다.
// 테스트는 pnpm test 로 함께 돈다. 이 파일만: node --test "src/**/contract-summary.test.ts" — 경로의 [id] 를 node 가 glob 으로 읽어 그대로 적으면 찾지 못한다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "../../../lib/api-types.generated.ts";
import type { EnumValue } from "../../../lib/enums.ts";
import { RENEWAL_NOTICE_DAYS } from "../staff-row.ts";

/** 계약 상세(GET /contracts/:id) 응답 */
export type ContractDetail = components["schemas"]["ContractDetailDto"];
type ContractStatus = components["schemas"]["ContractStatus"];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 갱신 예정일 — 체결 완료이면서 종료일이 있을 때 종료일 RENEWAL_NOTICE_DAYS(30일) 전. 갱신 예정 알림과 같은 기준이다(okf/notify.md, S-JUWPXF).
 * 종료일이 지난 체결 완료는 종료 배치 전의 잠깐이라 갱신 예정이 아니다 — 목록 contractCell 과 같다. today 는 kstToday() 값.
 */
export function renewalDateOf(status: ContractStatus | null, endDate: string | null, today: string): string | null {
  if (status !== "SIGNED" || !endDate || endDate < today) return null;
  return new Date(Date.parse(`${endDate}T00:00:00Z`) - RENEWAL_NOTICE_DAYS * DAY_MS).toISOString().slice(0, 10);
}

/**
 * 계약 유형 · 계약 기간 · 최근 발송일 · 갱신 예정일 칸의 글자. 계약 상태는 배지라 화면이 그린다.
 * employmentTypeLabel 은 고용 형태 한글이다. enum 을 받지 못했으면 null 이고 계약 유형은 「-」다 — 영문 값을 보이지 않는다.
 * 최근 발송일은 계약 상세 응답(ContractDetailDto)에 없다. 값은 contracts.sent_at 에 있고 발송 · 재발송 때 덮어쓰며 근로계약
 * 목록 응답에는 나오지만, 발송 이력을 로그 테이블로 따로 두기로 해 그때 채운다(2026-10-19 노영주).
 */
export function contractSummaryTexts(
  c: Pick<ContractDetail, "status" | "employmentType" | "startDate" | "endDate">,
  employmentTypeLabel: string | null,
  today: string,
): { type: string; period: string; lastSent: string; renewal: string } {
  return {
    type: employmentTypeLabel ? `${employmentTypeLabel} 근로계약` : "-",
    period: c.startDate ? `${c.startDate} ~ ${c.endDate ?? "무기한"}` : "-",
    lastSent: "-",
    renewal: renewalDateOf(c.status, c.endDate, today) ?? "-",
  };
}

/**
 * 받은 enum 목록. 비었으면 받지 못한 것과 같이 null 이다 — getEnum 은 응답에 그 enum 이 빠지면 throw 하지 않고 [] 를 주는데,
 * 그대로 쓰면 labelOf 가 영문 값을 돌려준다(PR #47 리뷰).
 */
export function labelsOrNull(values: EnumValue[]): EnumValue[] | null {
  return values.length ? values : null;
}

/**
 * 계약 상세를 못 받았을 때. 403 은 근로계약 메뉴 조회 권한이 없을 때를 위한 것이고 다시 해도 같아 안내만, 나머지는 「다시 하기」다.
 * 지금 근로계약 api 에는 메뉴 권한 검사가 없어 403 은 다른 까닭(직원 앱 토큰 등)으로만 온다. status 는 api 에 닿지 못했으면 null.
 */
export function contractFailureOf(status: number | null): "forbidden" | "retry" {
  return status === 403 ? "forbidden" : "retry";
}
