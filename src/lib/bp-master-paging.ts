// BP 마스터 계정 목록 조건과 쪽 건수. 클라이언트 컴포넌트도 이 값을 써야 해서 서버 전용(next/headers)을 부르는
// bp-masters.ts 와 떼어 둔다(platform-admin-paging.ts 와 같은 이유).
// 값 목록은 api 목록 조회 쿼리의 생성 타입에 맞춰 둔다(satisfies) — api 가 값을 바꾸면 여기서 컴파일이 깨진다.
import type { operations } from "./api-types.generated.ts";

type ApiListQuery = operations["BpMastersController_list"]["parameters"]["query"];

export const BP_MASTER_STATUSES = ["ACTIVE", "INACTIVE", "WITHDRAWN"] as const satisfies readonly NonNullable<ApiListQuery["statuses"]>[number][];
export type BpMasterStatusValue = (typeof BP_MASTER_STATUSES)[number];

export const BP_MASTER_PAGE_SIZES = [20, 50, 100] as const satisfies readonly ApiListQuery["pageSize"][];
export type BpMasterPageSize = (typeof BP_MASTER_PAGE_SIZES)[number];
export const BP_MASTER_HISTORY_PAGE_SIZE = 10;

/** 검색 기준 — 검색어 하나를 어느 칸에서 찾을지(S-ALHCJS) */
export const BP_MASTER_SEARCH_TYPES = [
  { value: "BP_CODE", label: "BP 코드" },
  { value: "LOGIN_ID_NAME", label: "아이디 · 이름" },
  { value: "TRADE_NAME", label: "상호명" },
  { value: "BIZ_REGISTRATION_NUMBER", label: "사업자등록번호" },
] as const satisfies readonly { value: NonNullable<ApiListQuery["searchType"]>; label: string }[];
export type BpMasterSearchType = (typeof BP_MASTER_SEARCH_TYPES)[number]["value"];

/** 사업자정보 인증 — 없으면 전체(BP-2) */
export type BpMasterVerification = NonNullable<ApiListQuery["verification"]>;

export type BpMasterListQuery = {
  page: number;
  pageSize: BpMasterPageSize;
  searchType: BpMasterSearchType;
  keyword?: string;
  /** 비면 전체(사용 · 미사용 · 탈퇴) */
  statuses: BpMasterStatusValue[];
  verification?: BpMasterVerification;
};
