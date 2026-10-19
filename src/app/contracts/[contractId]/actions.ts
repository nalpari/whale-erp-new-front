"use server";

import { redirect } from "next/navigation";
import { ApiError, getSession, request } from "@/lib/api";
import { inProgressOf, type SaveResult } from "../new/contract-form-model";
import { saveOutcomeUnknown, sendFailedTarget, sendFailureOf, type SendFailure } from "./send-model";
import type { WorkerBody } from "./worker/worker-model";

// 경로에 넣는 id — 1..2147483647 정수만. 서버 액션은 누구나 직접 부를 수 있어 TS 타입이 막아 주지 않는다.
// "1/../../stores/5" 같은 값이 api 의 다른 경로로 쓰기 요청을 보내지 않게 한다(front #13 리뷰).
const isContractId = (id: unknown): id is number => Number.isInteger(id) && (id as number) >= 1 && (id as number) <= 2_147_483_647;

/** 임시저장 삭제. 성공하면 목록으로 간다. 실패하면 화면에 보일 문장을 돌려준다(임시저장이 아님 409 등) */
export async function deleteContract(contractId: number): Promise<{ error: string }> {
  if (!isContractId(contractId)) return { error: "근로계약을 찾을 수 없습니다" };
  const session = await getSession();
  if (!session) return { error: "로그인이 필요합니다" };
  try {
    await request(`/contracts/${contractId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.status === 401 ? "로그인이 필요합니다" : e.message };
    throw e;
  }
  redirect("/contracts");
}

/**
 * 날인 전 당사자 정보 수정(WHALEERP-125 · 126). 저장하면 api 가 곧바로 다시 보낸다(2026-10-19 재영). 성공하면 상세로 간다. 실패하면 화면에 보일 문장을 돌려주고, 새 번호로
 * 같은 점포에 진행 중 계약이 있으면(409 CONTRACT_IN_PROGRESS) 그 목록도 돌려줘 화면이 대체할지 묻는다.
 */
export async function updateWorker(contractId: number, body: WorkerBody): Promise<SaveResult> {
  if (!isContractId(contractId)) return { error: "근로계약을 찾을 수 없습니다" };
  const session = await getSession();
  if (!session) return { error: "로그인이 필요합니다" };
  try {
    await request(`/contracts/${contractId}/worker`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) return { error: "로그인이 필요합니다" };
      // 고친 내용은 저장했는데 다시 보내기(가입 초대 알림톡)가 실패했다 — 상세에서 알린다
      const sendFailed = sendFailedTarget(e.status, e.body);
      if (sendFailed) redirect(sendFailed);
      // 결과를 받지 못했다(코드 없는 502 · 504) — 저장 · 다시 보내기가 됐을 수 있어 같은 폼으로 다시 저장하지 않게 상세로(front #50 리뷰)
      const code = (e.body as { code?: unknown } | null)?.code;
      if (saveOutcomeUnknown(e.status, typeof code === "string" ? code : undefined)) redirect(`/contracts/${contractId}?send=unknown`);
      const inProgress = e.status === 409 ? inProgressOf(e.body) : undefined;
      return inProgress ? { error: e.message, inProgress } : { error: e.message };
    }
    console.error("당사자 정보 저장 응답을 받지 못함", contractId, e);
    redirect(`/contracts/${contractId}?send=unknown`);
  }
  redirect(`/contracts/${contractId}`);
}

/** 재발송 결과. 실패면 화면에 보일 문장 · api 의 코드 · 다시 읽어야 하는지(send-model.ts) */
export type SendContractResult = { ok: true } | SendFailure;

/**
 * 근로계약 발송 · 재발송(WHALEERP-136). 계정이 없는 직원에게 가입 초대 알림톡을 보내고 서명 대기로 둔다.
 * 기존 계정(소속 추가 · 복귀)은 앱 알림이 아직 없어 api 가 409 SEND_CHANNEL_NOT_READY 로 막는다.
 */
export async function sendContract(contractId: number): Promise<SendContractResult> {
  if (!isContractId(contractId)) return { ok: false, error: "근로계약을 찾을 수 없습니다", recheck: false };
  const session = await getSession();
  if (!session) return { ok: false, error: "로그인이 필요합니다", recheck: false };
  try {
    await request(`/contracts/${contractId}/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) return { ok: false, error: "로그인이 필요합니다", recheck: false };
      const code = (e.body as { code?: unknown } | null)?.code;
      // 502 · 503 은 api 문장이 한글이라 그대로 둔다(발송 실패 · 접수 여부 모름 · 설정 없음)
      return sendFailureOf(e.status, typeof code === "string" ? code : undefined, e.message);
    }
    // api 와의 연결이 응답 전에 끊겼다 — api 는 이미 쓰고 보냈을 수 있어 오류 화면 대신 다시 읽게 한다
    console.error("근로계약 발송 응답을 받지 못함", contractId, e);
    return sendFailureOf(null, undefined, "");
  }
  return { ok: true };
}
