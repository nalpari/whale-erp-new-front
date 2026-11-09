// 급여명세서 목록 · 상세 · 작성 대상 api. 초안 작성(POST)은 server action(app/payslips/actions.ts)이 부른다. 토큰은 authHeaders() 가 로그인 세션에서 붙인다.
// 메뉴 권한(MN000009 조회) · 관리 범위 · 본사 제공 동의(가림)는 api 가 요청마다 본다 — 이 파일은 그대로 전한다.
import { ApiError, authHeaders, request } from "./api";
import {
  payslipListApiSearch,
  type PayslipCandidates,
  type PayslipDetail,
  type PayslipListQuery,
  type PayslipListResponse,
} from "./payslips";

const MAX_ID = 2_147_483_647;

/** 경로의 id. 숫자가 아니거나 1..2147483647 밖이면 null — api 에 보내면 400 이라 화면이 먼저 404 로 받는다(직원 상세와 같다). */
function payslipIdOf(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return id <= MAX_ID ? id : null;
}

const init = async (): Promise<RequestInit> => ({ method: "GET", headers: await authHeaders() });

/** GET /payslips. 점포명에 맞는 점포가 없으면 부르지 않고 0건. 상태를 하나도 고르지 않았으면 0건이다 — 상태 건수는 상태 필터와 상관없어 api 에서 그대로 받는다. */
export async function getPayslips(query: PayslipListQuery): Promise<PayslipListResponse> {
  const search = payslipListApiSearch(query);
  const response = await request<PayslipListResponse>(`/payslips?${search}`, await init());
  return query.statuses.length === 0 ? { ...response, items: [], total: 0 } : response;
}

/** GET /payslips/:id — :id 는 목록의 payslipId 다. 없거나 · 관리 범위 밖 · 가린 명세서는 404 라 null 이다 — 화면은 notFound(). */
export async function getPayslip(rawId: string): Promise<PayslipDetail | null> {
  const id = payslipIdOf(rawId);
  if (id === null) return null;
  try {
    return await request<PayslipDetail>(`/payslips/${id}`, await init());
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** GET /payslips/candidates — 그 달 작성 대상(급여명세서 관리 등록 권한). 권한 없음 403 등은 error.tsx 가 받는다. */
export async function getPayslipCandidates(month: string): Promise<PayslipCandidates> {
  return request<PayslipCandidates>(`/payslips/candidates?${new URLSearchParams({ month })}`, await init());
}
