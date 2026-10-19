"use server";

import { ApiError, request } from "@/lib/api";
import { apiHeaders } from "@/lib/forwarded-headers";

// 입력값은 실패해도 폼에 남긴다 — 서버 액션이 끝나면 React 가 비제어 폼을 defaultValue 로 되돌린다.
export type FindLoginIdState = { error?: string; name?: string; email?: string; maskedLoginId?: string };
export type TemporaryPasswordState = { error?: string; name?: string; loginId?: string; email?: string; sent?: boolean };

const CONNECT_FAILED = "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요";
const THROTTLED = "요청이 많습니다. 잠시 뒤 다시 시도해 주세요";
// 임시 비밀번호는 api 가 메일 발송을 기다린 뒤 답한다. 멈춘 api 에 폼이 수 분 동안 「처리 중」으로 잠기지 않게 끊는다.
const TIMEOUT_MS = 10_000;

const isTimeout = (e: unknown) => e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");

// 4xx 는 api 문구 그대로(일치 없음 · 1시간 5회 초과). 스로틀러 429 는 영어 기본값이라 여기서만 바꾼다(login/actions.ts 와 같다).
// 라우트가 없는 404(「Cannot POST …」)는 api 가 아직 배포되지 않은 것이라 일치 없음이 아니라 연결 실패로 보인다.
function failureOf(e: unknown): string {
  if (e instanceof ApiError && e.status === 429 && e.message.startsWith("ThrottlerException")) return THROTTLED;
  if (e instanceof ApiError && e.status === 404 && e.message.startsWith("Cannot ")) return CONNECT_FAILED;
  if (e instanceof ApiError && e.status < 500) return e.message;
  console.error("[find]", e);
  return CONNECT_FAILED;
}

/** 아이디 찾기(S-PHOPWY). 이름 · 이메일이 맞는 사용 중 계정의 가린 아이디를 받는다 — 가리는 것은 api 가 한다. */
export async function findLoginId(_prev: FindLoginIdState, formData: FormData): Promise<FindLoginIdState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!name || !email) return { error: "이름과 이메일을 입력해 주세요", name, email };

  try {
    const res = await request<{ maskedLoginId?: unknown }>("/auth/admin/login-id-find-attempts", {
      method: "POST",
      headers: await apiHeaders(),
      body: JSON.stringify({ name, email }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (typeof res?.maskedLoginId !== "string") {
      console.error("[find] 아이디 찾기 응답에 maskedLoginId 가 없습니다", res);
      return { error: CONNECT_FAILED, name, email };
    }
    return { name, maskedLoginId: res.maskedLoginId };
  } catch (e) {
    return { error: failureOf(e), name, email };
  }
}

/**
 * 임시 비밀번호 발급(S-EOMSRG). api 는 계정이 있는지 드러내지 않으려고 일치 여부 · 메일 발송 여부와 상관없이 같은 202 를 준다.
 * 시간 초과도 메일이 나갔을 수 있어 같은 안내로 끝낸다.
 */
export async function issueTemporaryPassword(_prev: TemporaryPasswordState, formData: FormData): Promise<TemporaryPasswordState> {
  const name = String(formData.get("name") ?? "").trim();
  const loginId = String(formData.get("loginId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!name || !loginId || !email) return { error: "이름 · 아이디 · 이메일을 입력해 주세요", name, loginId, email };

  try {
    await request("/auth/admin/temporary-passwords", {
      method: "POST",
      headers: await apiHeaders(),
      body: JSON.stringify({ name, loginId, email }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { sent: true };
  } catch (e) {
    if (isTimeout(e)) {
      console.error("[find] 임시 비밀번호 요청 시간 초과", e);
      return { sent: true };
    }
    return { error: failureOf(e), name, loginId, email };
  }
}
