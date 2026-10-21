// 내 정보(MY PAGE) 데이터 접근 — manyfast F-AMTDCK > S-JXKHCM 「내 기본정보 조회 및 수정」.
// api(whale-erp-api auth/admin-auth.controller.ts)에 경로가 있지만 아직 openapi.json 에 실리지 않아
// 타입을 손으로 적었다(api가 openapi:export 에 포함하면 api-types.generated.ts 로 바꾼다).
// GET /auth/admin/login-info 에는 연락처 · 가입일 · 최근 로그인 일시가 없어 이 기능은 새 경로를 쓴다.
import { authHeaders, request } from "./api";

export type MyProfile = {
  loginId: string;
  name: string;
  /** 하이픈 없는 숫자. */
  phone: string;
  email: string;
  /** 공통코드 ROLE_TYPE 값 — 한글은 화면이 useCodeLabel("ROLE_TYPE") 로 받는다(네이밍 규칙). */
  roleTypeCode: string;
  createdAt: string;
  lastLoginAt: string | null;
};

export type UpdateMyProfileInput = {
  name: string;
  phone: string;
  email: string;
};

const json = async (method: "GET" | "PATCH", body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** GET /auth/admin/me. */
export async function getMyProfile(): Promise<MyProfile> {
  return request("/auth/admin/me", await json("GET"));
}

/** PATCH /auth/admin/me. 이름 · 연락처 · 이메일만 받는다. */
export async function updateMyProfile(input: UpdateMyProfileInput): Promise<void> {
  return request("/auth/admin/me", await json("PATCH", input));
}

/** GET /auth/admin/me/email-availability. 원래 이메일 그대로면 화면이 묻지 않는다. */
export async function checkMyEmailAvailable(email: string): Promise<boolean> {
  const params = new URLSearchParams({ email });
  return (await request<{ available: boolean }>(`/auth/admin/me/email-availability?${params}`, await json("GET"))).available;
}
