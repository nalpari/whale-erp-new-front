"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, authHeaders, bpHref, send } from "@/lib/api";
import { SAVE_UNKNOWN_NEW, saveFailureOf } from "../[contractId]/send-model";
import { SAVED_COOKIE, SAVED_COOKIE_MAX_AGE, listAfterSave, savedKindOf, withBack } from "../contract-list";
import { type CreateContractBody, type SavedContract, type SaveResult } from "./contract-form-model";

// 경로에 넣는 id — 1..2147483647 정수만. 서버 액션은 누구나 직접 부를 수 있어 TS 타입이 막아 주지 않는다.
// "1/../../stores/5" 같은 값이 api 의 다른 경로로 쓰기 요청을 보내지 않게 한다(front #13 리뷰).
const isContractId = (id: unknown): id is number => Number.isInteger(id) && (id as number) >= 1 && (id as number) <= 2_147_483_647;

/**
 * 근로계약서 초안 저장. 성공하면 목록으로 가서 시스템이 한 처리(가입 초대 · 소속 추가 확인 · 복귀 확인 · 즉시 발송)를 알린다(쿠키 SAVED_COOKIE, WHALEERP-132). 실패하면 화면에 보일 문장을 돌려준다 —
 * api 의 400 · 404 · 409 문장(만 19세 미만, 같은 번호로 재직 중 등)을 그대로 쓴다. 같은 점포에 진행 중 계약이
 * 있으면(409 CONTRACT_IN_PROGRESS) 그 목록도 돌려줘 화면이 대체할지 묻는다(WHALEERP-129).
 * 초안 저장은 곧바로 보낸다(2026-10-19 재영) — 저장은 됐는데 가입 초대 알림톡이 실패하면(502) 그 계약 상세로 옮겨 알린다.
 */
export async function createContract(body: CreateContractBody, back?: string): Promise<SaveResult> {
  return save("/contracts", "POST", body, null, back);
}

/** 임시저장 이어 쓰기. 임시저장이 아니게 된 계약이면 api 가 409 로 돌려준다 */
export async function updateContract(contractId: number, body: CreateContractBody, back?: string): Promise<SaveResult> {
  if (!isContractId(contractId)) return { error: "근로계약을 찾을 수 없습니다." };
  return save(`/contracts/${contractId}`, "PUT", body, contractId, back);
}

/**
 * 저장의 결과를 받지 못했을 때(saveFailureOf 의 unknown — api 의 503 이 아닌 5xx 전부) — 이어 쓰기는 그 계약 상세로 옮겨 알리고, 새 계약은 계약 ID 를 몰라 폼에 남기되
 * 다시 저장하지 못하게 막는다(locked).
 */
async function unknownOutcome(contractId: number | null, back: string | undefined): Promise<SaveResult> {
  if (contractId !== null) redirect(await bpHref(withBack(`/contracts/${contractId}?send=unknown`, back)));
  return { error: SAVE_UNKNOWN_NEW, locked: true };
}

/**
 * back 은 화면이 넘긴 목록 주소다 — 서버 액션은 누구나 부를 수 있어 withBack · listAfterSave 가 backHrefOf 로 다시 거른다.
 * 옮겨 갈 주소 · 쿠키 경로는 옛 경로에 이 요청의 탭 BP 를 붙인다(bpHref — 화면 주소 /bp/{id}/contracts…).
 */
async function save(path: string, method: "POST" | "PUT", body: CreateContractBody, contractId: number | null, back: string | undefined): Promise<SaveResult> {
  const headers = await authHeaders();
  if (!headers.Authorization) return { error: "로그인이 필요합니다." };
  let saved: SavedContract | null = null;
  try {
    saved = await send<SavedContract>(path, method, body);
  } catch (e) {
    if (e instanceof ApiError) {
      const failure = saveFailureOf(e, { feature: "근로계약", contractId });
      if (failure.kind === "login") return { error: "로그인이 필요합니다." };
      // 저장은 됐다 — 성공과 같이 새 계약이면 점포 조건을 「전체」로 비운 목록을 넘긴다(#109 리뷰)
      if (failure.kind === "sendFailed") redirect(await bpHref(withBack(failure.target, listAfterSave(back, contractId === null ? null : body.storeId))));
      if (failure.kind === "unknown") return await unknownOutcome(contractId, back);
      return failure.inProgress ? { error: failure.error, inProgress: failure.inProgress } : { error: failure.error };
    }
    // api 와의 연결이 응답 전에 끊겼다 — 저장 · 발송됐을 수 있다
    console.error("근로계약 저장 응답을 받지 못함", contractId, e);
    return await unknownOutcome(contractId, back);
  }
  // 목록은 요청마다 새로 받는다(no-store). 따로 비울 캐시가 없다. 새 계약이면 점포 조건을 「전체」로 비운다
  const kind = savedKindOf(saved);
  if (kind) (await cookies()).set(SAVED_COOKIE, kind, { path: await bpHref("/contracts"), maxAge: SAVED_COOKIE_MAX_AGE, sameSite: "lax" });
  redirect(await bpHref(listAfterSave(back, contractId === null ? null : body.storeId)));
}
