"use server";

import { ApiError, authHeaders, request } from "@/lib/api";
import type { PayslipAdditionalItem, PayslipPrevious, SavePayslipBody } from "@/lib/payslips";

// 급여명세서 검토 화면의 임시저장 · 지난 명세서 불러오기 · 추가 공제 항목(WHALEERP-228), 확정 · 확정 취소(WHALEERP-230), 발송 · 재발송(WHALEERP-231 · 237).
// 메뉴 권한(급여명세서 관리 수정) · 관리 범위 · 가림 · 상태 · 동시 저장(updatedAt)은 api 가 본다. server action 은 공개
// 엔드포인트라 id 모양만 다시 본다. 성공하면 화면이 router.refresh() 로 상세를 다시 받는다.

export type EditFailure = {
  ok: false;
  message: string;
  /** 확정 422 DEDUCTION_MISSING 의 비어 있는 공제 이름 */
  missing?: string[];
  /** 결과 모름(code 없는 5xx · 연결 실패 · action 호출 끊김) — 화면이 상세를 다시 받는다 */
  unknown?: true;
};
type Result<T = object> = ({ ok: true } & T) | EditFailure;

const validId = (id: unknown): id is number => typeof id === "number" && Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;
const NOT_FOUND: EditFailure = { ok: false, message: "급여명세서를 찾을 수 없습니다." };

/** api 의 4xx 문장과 api 가 code 를 붙인 5xx(메일 · 직원 앱 주소 설정 없음 503 · 메일 실패 502 — 원인이 정해진 실패) 문장은 그대로 보인다. 401 은 할 일을 알 수 있게, 그 밖의 5xx · 연결 실패는 결과 모름으로 바꾼다. */
function failureOf(error: unknown, what: string): EditFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if (error.status < 500 || typeof (error.body as { code?: unknown } | null)?.code === "string") {
      const items = (error.body as { items?: unknown } | null)?.items;
      const missing = Array.isArray(items)
        ? items.map((i) => (i as { itemName?: unknown }).itemName).filter((n): n is string => typeof n === "string")
        : undefined;
      return { ok: false, message: error.message, ...(missing && { missing }) };
    }
  }
  console.error(`급여명세서 ${what} 결과 모름`, error);
  return { ok: false, unknown: true, message: `${what} 결과를 확인하지 못했습니다. 화면을 새로 고쳐 확인해 주세요.` };
}

const send = async (method: "GET" | "PUT" | "POST", body?: object): Promise<RequestInit> => ({
  method,
  headers: { ...(await authHeaders()), ...(body && { "Content-Type": "application/json" }) },
  ...(body && { body: JSON.stringify(body) }),
});

/** 임시저장 — 금액 · 가산 · 3.3% · 붙인 추가 공제. */
export async function savePayslip(payslipId: number, body: SavePayslipBody): Promise<Result> {
  if (!validId(payslipId)) return NOT_FOUND;
  try {
    await request(`/payslips/${payslipId}`, await send("PUT", body));
    return { ok: true };
  } catch (error) {
    return failureOf(error, "임시저장");
  }
}

/** 확정 — 비어 있는 공제가 있으면 422(missing 에 이름). */
export async function confirmPayslip(payslipId: number, updatedAt: string): Promise<Result> {
  if (!validId(payslipId)) return NOT_FOUND;
  try {
    await request(`/payslips/${payslipId}/confirm`, await send("POST", { updatedAt }));
    return { ok: true };
  } catch (error) {
    return failureOf(error, "확정");
  }
}

/** 확정 취소 — 검토 중으로 돌아간다(발송한 뒤에도). */
export async function cancelPayslipConfirmation(payslipId: number, updatedAt: string): Promise<Result> {
  if (!validId(payslipId)) return NOT_FOUND;
  try {
    await request(`/payslips/${payslipId}/cancel-confirmation`, await send("POST", { updatedAt }));
    return { ok: true };
  } catch (error) {
    return failureOf(error, "확정 취소");
  }
}

/** 발송 — 확정만. 메일이 실패하면 확정 그대로(502 문장). */
export async function sendPayslip(payslipId: number, updatedAt: string): Promise<Result> {
  if (!validId(payslipId)) return NOT_FOUND;
  try {
    await request(`/payslips/${payslipId}/send`, await send("POST", { updatedAt }));
    return { ok: true };
  } catch (error) {
    return failureOf(error, "발송");
  }
}

/** 재발송 — 발송 완료만. 처음 발송과 같은 문구로 다시 보낸다(재발송 템플릿, 쟁점 NOTI-6 · #605). */
export async function resendPayslip(payslipId: number, updatedAt: string): Promise<Result> {
  if (!validId(payslipId)) return NOT_FOUND;
  try {
    await request(`/payslips/${payslipId}/resend`, await send("POST", { updatedAt }));
    return { ok: true };
  } catch (error) {
    return failureOf(error, "재발송");
  }
}

/** 같은 직원의 지난 명세서 값. 없으면 previous: null. */
export async function getPreviousValues(payslipId: number): Promise<Result<{ previous: PayslipPrevious | null }>> {
  if (!validId(payslipId)) return NOT_FOUND;
  try {
    const { previous } = await request<{ previous: PayslipPrevious | null }>(`/payslips/${payslipId}/previous-values`, await send("GET"));
    return { ok: true, previous };
  } catch (error) {
    return failureOf(error, "지난 명세서 불러오기");
  }
}

/** 「항목 추가」로 붙일 수 있는 추가 공제. */
export async function getAdditionalItems(): Promise<Result<{ items: PayslipAdditionalItem[] }>> {
  try {
    const { items } = await request<{ items: PayslipAdditionalItem[] }>("/payslips/additional-items", await send("GET"));
    return { ok: true, items };
  } catch (error) {
    return failureOf(error, "항목 목록 조회");
  }
}
