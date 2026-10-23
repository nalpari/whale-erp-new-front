// BP 마스터 계정 데이터 접근(/bp-masters). api 는 whale-erp-api `/bp-masters` 다(메뉴 MN000203, 플랫폼 계정만).
// 메뉴 권한(조회 · 등록 · 수정 · 삭제)과 삭제 조건 · 탈퇴 BP 보호는 api 가 동작마다 판정한다 — 화면은 미리 숨기거나 흐리게만 한다.
// 계약은 docs/plans/2026-10-22-bp-masters.md 「API 작업 지시서」다.
import { authHeaders, request, requestRaw } from "./api";
import { BP_MASTER_HISTORY_PAGE_SIZE, type BpMasterListQuery, type BpMasterStatusValue } from "./bp-master-paging";

// shortcut: api 의 openapi 가 아직 없어 지시서대로 손으로 적은 타입이다. api /bp-masters 가 main 에 들어오면
// `pnpm openapi:types` 로 api-types.generated.ts 를 다시 만들고 아래를 생성 타입 별칭으로 바꾼다(머지 전에).
export type BpMasterStatus = BpMasterStatusValue;
export type BpJoinPath = "SIGNUP" | "PLATFORM_REGISTERED";

export type BpMaster = {
  bpCodeId: number;
  bpCode: string;
  loginId: string;
  /** 탈퇴 BP 는 null — 화면이 「탈퇴로 삭제됨」으로 보인다 */
  name: string | null;
  phone: string | null;
  email: string | null;
  accountStatus: BpMasterStatus;
  tradeName: string;
  /** 미인증이면 null */
  bizRegistrationNumber: string | null;
  joinPath: BpJoinPath;
  createdAt: string;
  createdByName: string | null;
};

export type BpMasterList = { items: BpMaster[]; total: number };

export type BpMasterDetail = BpMaster & {
  adminAccountId: number;
  statusChangedAt: string | null;
  bizCeoName: string | null;
  /** YYYY-MM-DD */
  bizOpenDate: string | null;
  bizCeoPhone: string | null;
  bizCeoEmail: string | null;
  bizZipCode: string | null;
  bizAddress: string | null;
  bizAddressDetail: string | null;
  bizCategory: string | null;
  bizItem: string | null;
  bizVerifiedAt: string | null;
  /** 폐점 · 삭제 제외 */
  storeCount: number;
  /** 이 BP 의 BP 관리자 · 가맹 마스터 · 가맹 관리자 중 지우지 않은 계정 수 */
  subAdminCount: number;
  lastLoginAt: string | null;
  termsAgreedAt: string | null;
  isPasswordChangeRequired: boolean;
  /** BP 정보와 BP 마스터 계정 중 나중에 고친 쪽 */
  updatedAt: string;
  updatedByName: string | null;
  /** reasons 는 화면 말풍선 문구 그대로 */
  deletion: { isDeletable: boolean; reasons: string[] };
};

export type BpMasterHistory = {
  changeId: number;
  changedAt: string;
  /** 한글 항목 이름 */
  field: string;
  beforeValue: string | null;
  afterValue: string | null;
  changedByName: string | null;
  /** 탈퇴 줄의 탈퇴 사유만 */
  note: string | null;
};
export type BpMasterHistoryList = { items: BpMasterHistory[]; total: number };

/** 등록 · 수정이 같이 쓰는 칸. 사업자등록번호 · 대표자명 · 개업일자는 진위확인 토큰에서만 꺼낸다. */
type BpMasterProfileInput = {
  name: string;
  phone: string;
  email: string;
  tradeName: string;
  bizCeoPhone: string | null;
  bizCeoEmail: string | null;
  bizZipCode: string | null;
  bizAddress: string | null;
  bizAddressDetail: string | null;
  bizCategory: string | null;
  bizItem: string | null;
  verificationToken?: string;
};
export type CreateBpMasterInput = BpMasterProfileInput & { loginId: string };
export type UpdateBpMasterInput = BpMasterProfileInput;
export type CreateBpMasterResult = { bpCodeId: number; bpCode: string; email: string; isMailSent: boolean };
export type BpBusinessVerificationInput = { bizRegistrationNumber: string; bizCeoName: string; bizOpenDate: string; bpCodeId?: number };

const json = async (method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** 목록 · 엑셀이 같이 쓰는 조건 쿼리 */
function conditionParams({ searchType, keyword, statuses, verification }: Omit<BpMasterListQuery, "page" | "pageSize">): URLSearchParams {
  const params = new URLSearchParams();
  if (keyword) {
    params.set("searchType", searchType);
    params.set("keyword", keyword);
  }
  if (statuses.length) params.set("statuses", statuses.join(","));
  if (verification) params.set("verification", verification);
  return params;
}

/** GET /bp-masters — 지우지 않은 고객 BP, 등록 일시 최신순. */
export async function getBpMasters(query: BpMasterListQuery): Promise<BpMasterList> {
  const params = conditionParams(query);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return request(`/bp-masters?${params}`, await json("GET"));
}

/** GET /bp-masters/excel — 파일을 그대로 흘려보내도록 Response 를 돌려준다(엑셀 중계 경로가 쓴다). */
export async function getBpMastersExcel(query: Omit<BpMasterListQuery, "page" | "pageSize">): Promise<Response> {
  return requestRaw(`/bp-masters/excel?${conditionParams(query)}`, await json("GET"));
}

/** GET /bp-masters/{bpCodeId} — 지웠거나 플랫폼 BP 면 404. */
export async function getBpMaster(bpCodeId: number): Promise<BpMasterDetail> {
  return request(`/bp-masters/${bpCodeId}`, await json("GET"));
}

/** GET /bp-masters/{bpCodeId}/histories — BP 정보와 BP 마스터 계정 이력을 합친 것, 최신순. */
export async function getBpMasterHistories(bpCodeId: number, page = 1): Promise<BpMasterHistoryList> {
  return request(`/bp-masters/${bpCodeId}/histories?page=${page}&pageSize=${BP_MASTER_HISTORY_PAGE_SIZE}`, await json("GET"));
}

/** GET /bp-masters/login-id-availability — 탈퇴 · 삭제한 계정의 아이디도 쓸 수 없다. */
export async function checkBpMasterLoginIdAvailable(loginId: string): Promise<boolean> {
  const params = new URLSearchParams({ loginId });
  return (await request<{ available: boolean }>(`/bp-masters/login-id-availability?${params}`, await json("GET"))).available;
}

/** POST /bp-masters/business-verifications — 번호 중복을 먼저 보고 국세청 진위확인. 수정은 bpCodeId 로 자기 BP 를 중복에서 뺀다. 토큰은 10분. */
export async function verifyBpBusiness(input: BpBusinessVerificationInput): Promise<{ verificationToken: string }> {
  return request("/bp-masters/business-verifications", await json("POST", input));
}

/** POST /bp-masters — BP 와 BP 마스터 계정을 한 번에 만든다. 초기 비밀번호 메일이 실패해도 등록은 남는다. */
export async function createBpMaster(input: CreateBpMasterInput): Promise<CreateBpMasterResult> {
  return request("/bp-masters", await json("POST", input));
}

/** PUT /bp-masters/{bpCodeId} — 동시 수정 검사 없이 마지막 저장이 남는다(S-CQGGZS). 탈퇴 BP 는 409. */
export async function updateBpMaster(bpCodeId: number, input: UpdateBpMasterInput): Promise<void> {
  await request(`/bp-masters/${bpCodeId}`, await json("PUT", input));
}

/** POST /bp-masters/{bpCodeId}/status — 미사용이면 이 BP 의 관리자 계정 모두, 사용이면 BP 와 BP 마스터만. */
export async function changeBpMasterStatus(bpCodeId: number, status: Exclude<BpMasterStatus, "WITHDRAWN">): Promise<void> {
  await request(`/bp-masters/${bpCodeId}/status`, await json("POST", { status }));
}

/** POST /bp-masters/{bpCodeId}/password-reset — 새 초기 비밀번호를 계정 이메일로만 보낸다. */
export async function resetBpMasterPassword(bpCodeId: number): Promise<{ isMailSent: boolean }> {
  return request(`/bp-masters/${bpCodeId}/password-reset`, await json("POST"));
}

/** DELETE /bp-masters/{bpCodeId} — 조건을 못 채우면 409 와 이유. 계정과 BP 를 함께 지운다. */
export async function deleteBpMaster(bpCodeId: number): Promise<void> {
  await request(`/bp-masters/${bpCodeId}`, await json("DELETE"));
}
