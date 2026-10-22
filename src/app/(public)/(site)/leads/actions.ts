"use server";

import { ApiError, apiError, requestRaw } from "@/lib/api";
import { apiHeaders } from "@/lib/forwarded-headers";
import { LEAD_FAILED, leadBodyOf, leadFailureOf, type LeadResult } from "@/lib/leads";

// 멈춘 api 에 폼이 오래 「접수 중」으로 잠기지 않게 끊는다. 끊어도 api 는 접수를 마쳤을 수 있어 결과를 모른다고 안내한다(LEAD_UNKNOWN).
const TIMEOUT_MS = 10_000;

const isTimeout = (e: unknown) => e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");

/** 도입문의 접수(S-SDMDKC). api 가 IP 로 한도를 세므로 사용자 IP 를 넘긴다(forwarded-headers.ts). */
export async function submitLead(form: FormData): Promise<LeadResult> {
  try {
    // 201 은 본문이 없어 상태 코드만 본다.
    const res = await requestRaw("/leads", {
      method: "POST",
      headers: await apiHeaders(),
      body: JSON.stringify(leadBodyOf(form)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw await apiError(res);
    return { ok: true };
  } catch (e) {
    // 연결 자체가 안 된 것(api 꺼짐)은 접수되지 않았으니 다시 하라고, 시간 초과는 결과를 모른다고 알린다.
    const failure = e instanceof ApiError ? leadFailureOf(e.status, e.message) : isTimeout(e) ? leadFailureOf(null, "") : { message: LEAD_FAILED, log: true };
    if (failure.log) console.error("[leads] 도입문의 접수 실패", e);
    return { ok: false, error: failure.message };
  }
}
