"use server";

import { redirect } from "next/navigation";
import { ApiError, getSession, request } from "@/lib/api";
import { inProgressOf, type CreateContractBody, type SaveResult } from "./contract-form-model";

// 경로에 넣는 id — 1..2147483647 정수만. 서버 액션은 누구나 직접 부를 수 있어 TS 타입이 막아 주지 않는다.
// "1/../../stores/5" 같은 값이 api 의 다른 경로로 쓰기 요청을 보내지 않게 한다(front #13 리뷰).
const isContractId = (id: unknown): id is number => Number.isInteger(id) && (id as number) >= 1 && (id as number) <= 2_147_483_647;

/**
 * 근로계약서 초안 저장. 성공하면 목록으로 간다. 실패하면 화면에 보일 문장을 돌려준다 —
 * api 의 400 · 404 · 409 문장(만 19세 미만, 같은 번호로 재직 중 등)을 그대로 쓴다. 같은 점포에 진행 중 계약이
 * 있으면(409 CONTRACT_IN_PROGRESS) 그 목록도 돌려줘 화면이 대체할지 묻는다(WHALEERP-129).
 */
export async function createContract(body: CreateContractBody): Promise<SaveResult> {
  return save("/contracts", "POST", body);
}

/** 임시저장 이어 쓰기. 임시저장이 아니게 된 계약이면 api 가 409 로 돌려준다 */
export async function updateContract(contractId: number, body: CreateContractBody): Promise<SaveResult> {
  if (!isContractId(contractId)) return { error: "근로계약을 찾을 수 없습니다" };
  return save(`/contracts/${contractId}`, "PUT", body);
}

async function save(path: string, method: "POST" | "PUT", body: CreateContractBody): Promise<SaveResult> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요합니다" };
  try {
    await request(path, {
      method,
      headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) return { error: "로그인이 필요합니다" };
      const inProgress = e.status === 409 ? inProgressOf(e.body) : undefined;
      return inProgress ? { error: e.message, inProgress } : { error: e.message };
    }
    throw e;
  }
  // 목록은 요청마다 새로 받는다(no-store). 따로 비울 캐시가 없다.
  redirect("/contracts");
}
