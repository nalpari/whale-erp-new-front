"use server";

import { ApiError, apiError, requestRaw } from "@/lib/api";
import { apiHeaders } from "@/lib/forwarded-headers";
import { leadBodyOf, leadFailureOf, type LeadResult } from "@/lib/leads";

// 멈춘 api 에 폼이 오래 「접수 중」으로 잠기지 않게 끊는다. 이미 접수됐다면 다시 보낼 때 api 가 중복(429) 문구로 알린다.
const TIMEOUT_MS = 10_000;

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
    const failure = e instanceof ApiError ? leadFailureOf(e.status, e.message) : leadFailureOf(null, "");
    if (failure.log) console.error("[leads] 도입문의 접수 실패", e);
    return { ok: false, error: failure.message };
  }
}
