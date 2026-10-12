"use server";

import { redirect } from "next/navigation";
import { ApiError, getSession, request } from "@/lib/api";
import type { CreateContractBody } from "./contract-form-model";

/**
 * 근로계약서 초안 저장. 성공하면 목록으로 간다. 실패하면 화면에 보일 문장을 돌려준다 —
 * api 의 400 · 404 · 409 문장(만 19세 미만, 같은 번호로 재직 중 등)을 그대로 쓴다.
 */
export async function createContract(body: CreateContractBody): Promise<{ error: string }> {
  return save("/contracts", "POST", body);
}

/** 임시저장 이어 쓰기. 임시저장이 아니게 된 계약이면 api 가 409 로 돌려준다 */
export async function updateContract(contractId: number, body: CreateContractBody): Promise<{ error: string }> {
  return save(`/contracts/${contractId}`, "PUT", body);
}

async function save(path: string, method: "POST" | "PUT", body: CreateContractBody): Promise<{ error: string }> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요합니다" };
  try {
    await request(path, {
      method,
      headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (e instanceof ApiError) return { error: e.status === 401 ? "로그인이 필요합니다" : e.message };
    throw e;
  }
  // 목록은 요청마다 새로 받는다(no-store). 따로 비울 캐시가 없다.
  redirect("/contracts");
}
