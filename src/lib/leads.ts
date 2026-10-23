import type { components } from "./api-types.generated";
import { isEmailFormat } from "./email-format.ts";

// 비로그인 도입문의(#297 · #298) 폼 값 → api POST /leads 본문, 실패 → 화면 문구. 폼(design/guest/inquiry)과 서버 액션((site)/leads)이 같이 쓴다.

export type CreateLead = components["schemas"]["CreateLeadDto"];
export type LeadResult = { ok: true } | { ok: false; error: string };

/** 업종이 이 값(공통코드 INDUSTRY 기타)일 때만 「업종 직접 입력」칸이 열리고 api 가 industryDetail 을 저장한다(LEAD-1). */
export const INDUSTRY_OTHER = "ETC";

/** api 에 닿았는데 접수하지 못했다. 적은 내용은 폼에 남아 있다. */
export const LEAD_FAILED = "문의를 접수하지 못했습니다. 적은 내용은 그대로 있으니 잠시 후 다시 [문의 접수하기]를 눌러 주세요.";
/** 응답을 받기 전에 끊겼다(시간 초과 · 서버 액션 전송 실패). api 는 이미 접수했을 수 있다 — 다시 보내면 10분 안에는 중복(429) 문구가 온다. */
export const LEAD_UNKNOWN = "접수 결과를 확인하지 못했습니다. 이미 접수되었을 수 있으니 영업일 기준 1~2일 안에 연락이 없으면 다시 남겨 주세요.";
/** api 검증(400)이 영문 기본 문구로 거절했을 때. 한글 문구(전화번호 · 동의 등)는 그대로 보인다. */
export const LEAD_INVALID = "입력한 내용을 확인해 주세요. 이메일 형식이 맞는지, 빈칸만 적은 칸이 없는지 봐 주세요.";

// api CreateLeadDto 와 같은 규칙 — 하이픈 · 공백을 지우고 0으로 시작하는 9~11자리, 또는 대표번호(15xx · 16xx · 18xx) 8자리.
const PHONE = /^(0[0-9]{8,10}|1[568][0-9]{6})$/;
const HANGUL = /[가-힣]/;

const textOf = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

export function leadBodyOf(form: FormData): CreateLead {
  const industryCode = textOf(form, "industryCode");
  return {
    contactName: textOf(form, "contactName"),
    industryCode,
    ...(industryCode === INDUSTRY_OTHER ? { industryDetail: textOf(form, "industryDetail") } : {}),
    phone: textOf(form, "phone"),
    email: textOf(form, "email"),
    interests: form.getAll("interests").map(String) as CreateLead["interests"],
    // 고르지 않으면 null — 빈 문자열은 api 가 400 으로 거절한다.
    planPeriodCode: textOf(form, "planPeriodCode") || null,
    // 폼을 보내면 브라우저가 줄바꿈을 CRLF(2자)로 바꾼다. 화면(maxLength)은 1자로 세어, 줄을 많이 바꾼 2000자 가까운 글을
    // api 가 길이 초과(영문 400)로 거절하므로 1자(LF)로 되돌린다(front #100 재영 참고, 2026-10-22 재현).
    body: textOf(form, "body").replace(/\r\n?/g, "\n"),
    privacyAgreed: form.get("privacyAgreed") === "on",
    marketingAgreed: form.get("marketingAgreed") === "on",
  };
}

/**
 * 브라우저 검사(required · type=email)가 놓치는 것 — 빈칸만 적은 칸, 전화번호 형식, api @IsEmail 이 막는 이메일(브라우저는 a@b 를 통과시킨다) — 을 접수 확인 창을 띄우기 전에 본다.
 * 걸린 칸 이름과 문구를 돌려주면 폼이 그 칸에 검사 오류를 건다. 없으면 null.
 */
export function leadInputProblem(form: FormData): { name: string; message: string } | null {
  if (!textOf(form, "contactName")) return { name: "contactName", message: "이름을 입력해 주세요." };
  if (!PHONE.test(textOf(form, "phone").replace(/[\s-]/g, ""))) return { name: "phone", message: "전화번호 형식이 올바르지 않습니다. 예) 02-1234-5678, 1588-1234" };
  if (!isEmailFormat(textOf(form, "email"))) return { name: "email", message: "이메일 형식이 올바르지 않습니다." };
  if (textOf(form, "industryCode") === INDUSTRY_OTHER && !textOf(form, "industryDetail")) return { name: "industryDetail", message: "업종을 입력해 주세요." };
  if (!textOf(form, "body")) return { name: "body", message: "문의 내용을 입력해 주세요." };
  return null;
}

// 429(10분 안 중복 접수 「이미 접수된 문의가 있습니다…」 · IP 시간당 한도 「잠시 후 다시 시도해 주세요」)는 api 문구가 안내라 그대로 보인다.
// 400 은 문장(api 검증은 칸마다 하나)이 모두 한글일 때만 그대로 보인다. 하나라도 영문 기본 문구(이메일 · 길이 · 관심 서비스 값)면
// 섞어 보이지 않고 정해진 문구로 바꾸며 로그에 남긴다 — front · api 규칙이 어긋났을 수 있다.
// 그 밖은 정해진 문구를 보이고 로그에 남긴다. status 가 null 이면 응답을 받기 전에 끊겨 결과를 모른다.
export function leadFailureOf(status: number | null, messages: string[]): { message: string; log: boolean } {
  const message = messages.join(" ");
  if (status === 429) return { message, log: false };
  if (status === 400) return messages.every((m) => HANGUL.test(m)) ? { message, log: false } : { message: LEAD_INVALID, log: true };
  if (status === null) return { message: LEAD_UNKNOWN, log: true };
  return { message: LEAD_FAILED, log: true };
}
