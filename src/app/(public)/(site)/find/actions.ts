"use server";

import { apiError, request, requestRaw } from "@/lib/api";
import { isEmailFormat } from "@/lib/email-format";
import { apiHeaders } from "@/lib/forwarded-headers";
import { CONNECT_FAILED, failureOf, INVALID_INPUT, LOGIN_ID_NOT_FOUND, maskedLoginIdOf, temporaryPasswordOutcome } from "./find-failure";

// 입력값은 실패해도 폼에 남긴다 — 서버 액션이 끝나면 React 가 비제어 폼을 defaultValue 로 되돌린다.
// 이메일 형식은 api 에 묻기 전에 api @IsEmail 과 같은 규칙(email-format.ts)으로 보고, 틀리면 api 400 과 같은 문구를 보인다 —
// 브라우저 검사(type="email")는 a@b 같은 값을 통과시킨다.
export type FindLoginIdState = { error?: string; name?: string; email?: string; maskedLoginId?: string };
export type TemporaryPasswordState = { error?: string; name?: string; loginId?: string; email?: string; sent?: boolean };

// 임시 비밀번호는 api 가 메일 발송을 기다린 뒤 답한다. 멈춘 api 에 폼이 수 분 동안 「처리 중」으로 잠기지 않게 끊는다.
const TIMEOUT_MS = 10_000;

/** 아이디 찾기(S-PHOPWY). 이름 · 이메일이 맞는 사용 중 계정의 가린 아이디를 받는다 — 가리는 것은 api 가 한다. */
export async function findLoginId(_prev: FindLoginIdState, formData: FormData): Promise<FindLoginIdState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!name || !email) return { error: "이름과 이메일을 입력해 주세요", name, email };
  if (!isEmailFormat(email)) return { error: INVALID_INPUT, name, email };

  try {
    const res = await request<unknown>("/auth/admin/login-id-find-attempts", {
      method: "POST",
      headers: await apiHeaders(),
      body: JSON.stringify({ name, email }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const maskedLoginId = maskedLoginIdOf(res);
    if (!maskedLoginId) {
      console.error("[find] 아이디 찾기 응답에 maskedLoginId 가 없습니다", res);
      return { error: CONNECT_FAILED, name, email };
    }
    return { name, maskedLoginId };
  } catch (e) {
    const failure = failureOf(e, LOGIN_ID_NOT_FOUND);
    if (failure.log) console.error("[find] 아이디 찾기 실패", e);
    return { error: failure.message, name, email };
  }
}

/**
 * 임시 비밀번호 발급(S-EOMSRG). 일치하지 않으면 아이디 찾기처럼 일치 없음(404)을, 메일 발송 중 오류(503)면 메일이 오지 않을 때 다시 받으라고 안내한다
 * (2026-10-20 재영). api #77 머지 전에는 일치 여부 · 메일 발송 여부와 상관없이 202 라 늘 발송 안내다. 실패 판정은 find-failure.ts 의 temporaryPasswordOutcome.
 */
export async function issueTemporaryPassword(_prev: TemporaryPasswordState, formData: FormData): Promise<TemporaryPasswordState> {
  const name = String(formData.get("name") ?? "").trim();
  const loginId = String(formData.get("loginId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!name || !loginId || !email) return { error: "이름 · 아이디 · 이메일을 입력해 주세요", name, loginId, email };
  if (!isEmailFormat(email)) return { error: INVALID_INPUT, name, loginId, email };

  try {
    // 본문은 쓰지 않아 상태 코드만 본다 — request() 는 2xx 뒤 본문을 파싱해, 깨진 본문이면 발급을 마쳤는데도 실패로 던진다.
    const res = await requestRaw("/auth/admin/temporary-passwords", {
      method: "POST",
      headers: await apiHeaders(),
      body: JSON.stringify({ name, loginId, email }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw await apiError(res);
    return { sent: true };
  } catch (e) {
    const outcome = temporaryPasswordOutcome(e);
    if ("sent" in outcome) {
      console.error("[find] 임시 비밀번호 요청 시간 초과", e);
      return { sent: true };
    }
    if (outcome.log) console.error("[find] 임시 비밀번호 요청 실패", e);
    return { error: outcome.message, name, loginId, email };
  }
}
