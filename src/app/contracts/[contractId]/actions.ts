"use server";

import { redirect } from "next/navigation";
import { ApiError, getSession, request } from "@/lib/api";

/** 임시저장 삭제. 성공하면 목록으로 간다. 실패하면 화면에 보일 문장을 돌려준다(임시저장이 아님 409 등) */
export async function deleteContract(contractId: number): Promise<{ error: string }> {
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
