// 내 정보(MY PAGE) 사업자정보 — manyfast F-AMTDCK > S-UOJVUR 「BP 사업자정보 관리」. BP 마스터에게만 보인다.
// api(whale-erp-api auth/admin-auth.controller.ts)에 경로가 있지만 아직 openapi.json 에 실리지 않아
// 타입을 손으로 적었다(my-profile.ts 와 같다 — api가 openapi:export 에 포함하면 api-types.generated.ts 로 바꾼다).
import { authHeaders, request } from "./api";

export type BpProfile = {
  tradeName: string;
  /** 하이픈 없는 숫자 10자리. 인증한 적 없으면 빈 문자열. */
  bizRegistrationNumber: string;
  /** 인증한 적 없으면 빈 문자열. */
  bizCeoName: string;
  /** YYYY-MM-DD. 인증한 적 없으면 null. */
  bizOpenDate: string | null;
  /** 하이픈 없는 숫자. */
  bizCeoPhone: string;
  bizCeoEmail: string;
  bizZipCode: string;
  bizAddress: string;
  bizAddressDetail: string;
  bizCategory: string;
  bizItem: string;
  /** 최종 인증일시 — 인증한 적 없으면 null. */
  bizVerifiedAt: string | null;
  /** 저장 · 재인증할 때 그대로 돌려준다 — 그사이 다른 저장이 있었으면 api 409. */
  updatedAt: string;
};

export type UpdateBpProfileInput = {
  tradeName: string;
  bizCeoPhone?: string;
  bizCeoEmail?: string;
  bizZipCode?: string;
  bizAddress?: string;
  bizAddressDetail?: string;
  bizCategory?: string;
  bizItem?: string;
  updatedAt: string;
  /** POST .../business-verification 이 돌려준 10분짜리 토큰. 실으면 그 안의 사업자등록번호 · 대표자명 ·
   * 개업일자와 인증일시를 이 저장과 같은 트랜잭션에서 반영한다 — 점포 사업자정보와 같은 패턴(2026-10-22
   * 사용자 결정). 비우면 세 값은 그대로 둔다. */
  businessVerificationToken?: string;
};

export type VerifyBpBusinessInput = {
  bizRegistrationNumber: string;
  bizCeoName: string;
  bizOpenDate: string;
};

const json = async (method: "GET" | "PATCH" | "POST", body?: unknown): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** GET /auth/admin/me/bp. */
export async function getBpProfile(): Promise<BpProfile> {
  return request("/auth/admin/me/bp", await json("GET"));
}

/** PATCH /auth/admin/me/bp. 상호명 · 대표자 연락처 · 대표자 이메일 · 사업장 주소 · 업태 · 종목 — 인증 여부와 관계없이 저장한다. */
export async function updateBpProfile(input: UpdateBpProfileInput): Promise<void> {
  return request("/auth/admin/me/bp", await json("PATCH", input));
}

/** POST /auth/admin/me/bp/business-verification. 재인증도 세 값을 모두 다시 보낸다. 검사만 하고 저장은
 * 하지 않는다 — 받은 토큰을 updateBpProfile 의 businessVerificationToken 으로 실어야 실제로 반영된다
 * (점포 사업자정보와 같은 패턴, 2026-10-22 사용자 결정). */
export async function verifyBpBusiness(input: VerifyBpBusinessInput): Promise<{ verificationToken: string }> {
  return request("/auth/admin/me/bp/business-verification", await json("POST", input));
}
