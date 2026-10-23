// BP 마스터 계정 목록 조건과 쪽 건수. 클라이언트 컴포넌트도 이 값을 써야 해서 서버 전용(next/headers)을 부르는
// bp-masters.ts 와 떼어 둔다(platform-admin-paging.ts 와 같은 이유).

export const BP_MASTER_STATUSES = ["ACTIVE", "INACTIVE", "WITHDRAWN"] as const;
export type BpMasterStatusValue = (typeof BP_MASTER_STATUSES)[number];

export const BP_MASTER_PAGE_SIZES = [20, 50, 100] as const;
export type BpMasterPageSize = (typeof BP_MASTER_PAGE_SIZES)[number];
export const BP_MASTER_HISTORY_PAGE_SIZE = 10;

/** 검색 기준 — 검색어 하나를 어느 칸에서 찾을지(S-ALHCJS) */
export const BP_MASTER_SEARCH_TYPES = [
  { value: "BP_CODE", label: "BP 코드" },
  { value: "LOGIN_ID_NAME", label: "아이디 · 이름" },
  { value: "TRADE_NAME", label: "상호명" },
  { value: "BIZ_REGISTRATION_NUMBER", label: "사업자등록번호" },
] as const;
export type BpMasterSearchType = (typeof BP_MASTER_SEARCH_TYPES)[number]["value"];

/** 사업자정보 인증 — 없으면 전체(BP-2) */
export type BpMasterVerification = "VERIFIED" | "UNVERIFIED";

export type BpMasterListQuery = {
  page: number;
  pageSize: BpMasterPageSize;
  searchType: BpMasterSearchType;
  keyword?: string;
  /** 비면 전체(사용 · 미사용 · 탈퇴) */
  statuses: BpMasterStatusValue[];
  verification?: BpMasterVerification;
};
