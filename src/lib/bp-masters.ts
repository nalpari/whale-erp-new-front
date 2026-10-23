// BP 마스터 계정 데이터 접근(/bp-masters). api 는 whale-erp-api `/bp-masters` 다(메뉴 MN000203, 플랫폼 계정만).
// 메뉴 권한(조회 · 등록 · 수정 · 삭제)과 삭제 조건 · 탈퇴 BP 보호는 api 가 동작마다 판정한다 — 화면은 미리 숨기거나 흐리게만 한다.
// 계약은 docs/plans/2026-10-22-bp-masters.md 「API 작업 지시서」다.
import { authHeaders, request, requestRaw } from "./api";
import type { components } from "./api-types.generated";
import { BP_MASTER_HISTORY_PAGE_SIZE, type BpMasterListQuery } from "./bp-master-paging";

// 타입은 손으로 짓지 않고 api 의 openapi.json 에서 만든 것(api-types.generated.ts)을 쓴다.
type Schemas = components["schemas"];
export type BpMaster = Schemas["BpMasterSummaryResponseDto"];
export type BpMasterList = Schemas["BpMasterListResponseDto"];
export type BpMasterDetail = Schemas["BpMasterDetailResponseDto"];
export type BpMasterHistory = Schemas["BpMasterHistoryResponseDto"];
export type BpMasterHistoryList = Schemas["BpMasterHistoryListResponseDto"];
export type CreateBpMasterInput = Schemas["CreateBpMasterDto"];
export type UpdateBpMasterInput = Schemas["UpdateBpMasterDto"];
export type CreateBpMasterResult = Schemas["CreateBpMasterResponseDto"];
export type BpBusinessVerificationInput = Schemas["VerifyBpMasterBusinessDto"];
export type BpMasterStatus = BpMaster["accountStatus"];

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
  return (await request<Schemas["LoginIdAvailabilityResponseDto"]>(`/bp-masters/login-id-availability?${params}`, await json("GET"))).available;
}

/** POST /bp-masters/business-verifications — 번호 중복을 먼저 보고 국세청 진위확인. 수정은 bpCodeId 로 자기 BP 를 중복에서 뺀다. 토큰은 10분. */
export async function verifyBpBusiness(input: BpBusinessVerificationInput): Promise<Schemas["BpMasterBusinessVerificationResponseDto"]> {
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
export async function changeBpMasterStatus(bpCodeId: number, status: Schemas["ChangeBpMasterStatusDto"]["status"]): Promise<void> {
  await request(`/bp-masters/${bpCodeId}/status`, await json("POST", { status }));
}

/** POST /bp-masters/{bpCodeId}/password-reset — 새 초기 비밀번호를 계정 이메일로만 보낸다. */
export async function resetBpMasterPassword(bpCodeId: number): Promise<Schemas["ResetBpMasterPasswordResponseDto"]> {
  return request(`/bp-masters/${bpCodeId}/password-reset`, await json("POST"));
}

/** DELETE /bp-masters/{bpCodeId} — 조건을 못 채우면 409 와 이유. 계정과 BP 를 함께 지운다. */
export async function deleteBpMaster(bpCodeId: number): Promise<void> {
  await request(`/bp-masters/${bpCodeId}`, await json("DELETE"));
}
