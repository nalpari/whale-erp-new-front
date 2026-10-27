"use server";

import { redirect } from "next/navigation";
import { ApiError, authHeaders, request } from "@/lib/api";
import type { PayslipBulkResult, PayslipCandidates, PayslipSendResult } from "@/lib/payslips";
import { getPayslipCandidates } from "@/lib/payslips-api";

// 급여명세서 작성 팝업(WHALEERP-226)의 작성 대상 조회 · 초안 작성 · 일괄 작성과 목록의 「확정 N건 발송」(WHALEERP-231 · 237). 메뉴 권한(급여명세서 관리 등록) · 관리 범위 · 본사 제공 동의 · 계약 유효 · 중복은 api 가 본다.
// server action 은 공개 엔드포인트라 id 와 달 모양만 다시 본다 — 화면을 거치지 않은 이상한 값을 api 까지 보내지 않는다.

export type DraftFailure = {
  ok: false;
  message: string;
  /** 이미 있는 명세서(409 PAYSLIP_EXISTS) */
  payslipId?: number;
  /** 결과 모름(code 없는 5xx · 연결 실패 · action 호출 끊김) — 화면이 목록을 다시 받는다 */
  unknown?: true;
};

const validId = (id: unknown): id is number => typeof id === "number" && Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;
const validMonth = (month: unknown): month is string => typeof month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
const BAD_INPUT: DraftFailure = { ok: false, message: "직원 또는 급여 월이 올바르지 않습니다." };

/** api 의 4xx 문장과 api 가 code 를 붙인 5xx(메일 · 직원 앱 주소 설정 없음 503 · 메일 실패 502 — 원인이 정해진 실패) 문장은 그대로 보인다. 401 은 할 일을 알 수 있게, 그 밖의 5xx · 연결 실패는 결과 모름으로 바꾼다. */
function failureOf(error: unknown, what: string): DraftFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if (error.status < 500 || typeof (error.body as { code?: unknown } | null)?.code === "string") {
      const payslipId = (error.body as { payslipId?: unknown } | null)?.payslipId;
      return { ok: false, message: error.message, ...(validId(payslipId) && { payslipId }) };
    }
  }
  console.error(`급여명세서 ${what} 결과 모름`, error);
  return { ok: false, unknown: true, message: `${what} 결과를 확인하지 못했습니다. 목록을 새로 불러와 확인해 주세요.` };
}

const post = async (body: object) => ({
  method: "POST",
  headers: { ...(await authHeaders()), "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/** 그 달 작성 대상(팝업을 열 때마다 새로 받는다 — 방금 만든 명세서가 「작성됨」으로 보여야 한다). */
export async function getPayslipCandidatesAction(month: string): Promise<{ ok: true; data: PayslipCandidates } | DraftFailure> {
  if (!validMonth(month)) return BAD_INPUT;
  try {
    return { ok: true, data: await getPayslipCandidates(month) };
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) return failureOf(error, "작성 대상 조회");
    console.error("급여명세서 작성 대상 조회 실패", error);
    return { ok: false, message: "작성 대상을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

/** 직원 한 명의 초안. 만들면 그 명세서 검토 화면으로 간다. */
export async function createPayslip(staffMemberId: number, month: string): Promise<DraftFailure> {
  if (!validId(staffMemberId) || !validMonth(month)) return BAD_INPUT;
  let payslipId: number;
  try {
    ({ payslipId } = await request<{ payslipId: number }>("/payslips", await post({ staffMemberId, month })));
  } catch (error) {
    return failureOf(error, "초안 작성");
  }
  // 목록 · 상세는 요청마다 새로 받는다(no-store). 따로 비울 캐시가 없다.
  redirect(`/payslips/${payslipId}`);
}

/** 그 달 관리 범위 작성 대상 모두의 초안. 결과(만든 것 · 건너뛴 것)는 화면이 한 줄로 알리고 목록으로 간다. */
export async function bulkCreatePayslips(month: string): Promise<{ ok: true; result: PayslipBulkResult } | DraftFailure> {
  if (!validMonth(month)) return BAD_INPUT;
  try {
    return { ok: true, result: await request<PayslipBulkResult>("/payslips/bulk", await post({ month })) };
  } catch (error) {
    return failureOf(error, "일괄 작성");
  }
}

/** 「확정 N건 발송」 — 그 달 · 점포 조건(고른 점포 또는 직영 · 가맹) · 직원명의 확정 명세서를 보낸다. 일부가 실패해도 보낸 것은 그대로이고 실패 대상을 돌려준다. */
export async function sendPayslips(target: {
  month: string;
  storeIds?: number[];
  storeTypes?: ("DIRECT" | "FRANCHISE")[];
  staffName?: string;
}): Promise<{ ok: true; result: PayslipSendResult } | DraftFailure> {
  if (
    !validMonth(target.month) ||
    (target.storeIds && !target.storeIds.every(validId)) ||
    (target.storeTypes && !target.storeTypes.every((t) => t === "DIRECT" || t === "FRANCHISE"))
  )
    return BAD_INPUT;
  try {
    return { ok: true, result: await request<PayslipSendResult>("/payslips/send", await post(target)) };
  } catch (error) {
    return failureOf(error, "발송");
  }
}
