import type { components } from "./api-types.generated";

// 비로그인 도입문의(#297 · #298) 폼 값 → api POST /leads 본문, 실패 → 화면 문구. 폼(design/guest/inquiry)과 서버 액션((site)/leads)이 같이 쓴다.

export type CreateLead = components["schemas"]["CreateLeadDto"];
export type LeadResult = { ok: true } | { ok: false; error: string };

/** 업종이 이 값(공통코드 INDUSTRY 기타)일 때만 「업종 직접 입력」칸이 열리고 api 가 industryDetail 을 저장한다(LEAD-1). */
export const INDUSTRY_OTHER = "ETC";

/** 응답이 없거나 뜻밖의 실패. 적은 내용은 폼에 남아 있다. */
export const LEAD_FAILED = "문의를 접수하지 못했습니다. 적은 내용은 그대로 있으니 잠시 후 다시 [문의 접수하기]를 눌러 주세요.";

export function leadBodyOf(form: FormData): CreateLead {
  const text = (name: string) => String(form.get(name) ?? "").trim();
  const industryCode = text("industryCode");
  return {
    contactName: text("contactName"),
    industryCode,
    ...(industryCode === INDUSTRY_OTHER ? { industryDetail: text("industryDetail") } : {}),
    phone: text("phone"),
    email: text("email"),
    interests: form.getAll("interests").map(String) as CreateLead["interests"],
    // 고르지 않으면 null — 빈 문자열은 api 가 400 으로 거절한다.
    planPeriodCode: text("planPeriodCode") || null,
    body: text("body"),
    privacyAgreed: form.get("privacyAgreed") === "on",
    marketingAgreed: form.get("marketingAgreed") === "on",
  };
}

// 400(검증) · 429(10분 안 중복 접수 「이미 접수된 문의가 있습니다…」 · IP 시간당 한도 「잠시 후 다시 시도해 주세요」)는 api 문구가 안내라 그대로 보인다.
// 그 밖은 정해진 문구를 보이고 서버 로그에 남긴다. status 가 null 이면 api 에 닿지 못했거나 시간이 지났다.
export function leadFailureOf(status: number | null, message: string): { message: string; log: boolean } {
  if (status === 400 || status === 429) return { message, log: false };
  return { message: LEAD_FAILED, log: true };
}
