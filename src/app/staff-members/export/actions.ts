"use server";

import { actionFailure, ApiError, send, type ActionResult } from "@/lib/api";
import type { BulkExport, BulkExportLink } from "./bulk-export-model";

// 직원 자료 일괄 저장 요청 · 내려받기 주소 받기(WHALEERP-337). 역할(BP 마스터 · 가맹마스터) · 업무 범위 · 만드는 중 여부는 api 가 본다.
// server action 은 공개 엔드포인트라 경로 · 본문에 넣는 id 모양만 다시 본다. 조회(미리 보기 · 지난 요청)는 화면이 BFF 로 부른다.

const validId = (id: unknown): id is number => typeof id === "number" && Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;
const FEATURE = { feature: "직원 자료 일괄 저장" };

/**
 * 실패 결과. 503 은 api 가 받지 않은 것이 확실해 api 문장을 그대로 보인다. 그 밖의 5xx · 끊김은 결과 모름이라 unknown 문장으로 바꾼다.
 * 4xx · 401 은 actionFailure 가 정한다.
 */
function failureOf(error: unknown, what: string, log: Record<string, unknown>, unknown: string) {
  if (error instanceof ApiError && error.status === 503) {
    console.error(`직원 자료 일괄 저장 ${what} 503`, log, error);
    return { ok: false as const, status: 503, message: error.message, messages: error.messages };
  }
  const failure = actionFailure(error, what, { ...FEATURE, ...log });
  return failure.status !== undefined ? failure : { ...failure, message: unknown, messages: [unknown] };
}

/** 일괄 저장 요청. storeIds 가 비면 관리 점포 전체다. 결과 모름(5xx · 끊김)이면 화면이 지난 요청을 다시 읽어 만들어졌는지 보인다 */
export async function requestBulkExport(storeIds: unknown): Promise<ActionResult<{ item: BulkExport }>> {
  if (!Array.isArray(storeIds) || storeIds.length > 1000 || !storeIds.every(validId))
    return { ok: false, status: 400, message: "업무 범위를 다시 골라 주세요.", messages: ["업무 범위를 다시 골라 주세요."] };
  try {
    const item = await send<BulkExport>("/staff-members/bulk-exports", "POST", storeIds.length ? { storeIds } : {});
    return { ok: true, item };
  } catch (error) {
    return failureOf(error, "요청", { storeCount: storeIds.length }, "요청 결과를 확인하지 못했습니다. 지난 요청 표에서 확인해 주세요.");
  }
}

/** 내려받기 주소(5분짜리 서명 주소). 받기만 하는 요청이라 결과 모름이어도 다시 눌러도 된다 */
export async function getBulkExportLink(bulkExportId: unknown): Promise<ActionResult<{ link: BulkExportLink }>> {
  if (!validId(bulkExportId)) return { ok: false, status: 404, message: "요청을 찾을 수 없습니다.", messages: ["요청을 찾을 수 없습니다."] };
  try {
    return { ok: true, link: await send<BulkExportLink>(`/staff-members/bulk-exports/${bulkExportId}/download`, "POST") };
  } catch (error) {
    return failureOf(error, "내려받기", { bulkExportId }, "파일 주소를 받지 못했습니다. 잠시 뒤 다시 눌러 주세요.");
  }
}
