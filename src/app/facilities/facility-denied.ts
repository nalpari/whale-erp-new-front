import { notFound } from "next/navigation";
import { ApiError, deniedMessageOf } from "@/lib/api";

/** api 의 시설물 404 문장(whale-erp-api facilities.service.ts 의 NOT_FOUND) — 가드의 BP 404 와 가른다 */
const FACILITY_NOT_FOUND = "시설물·장비를 찾을 수 없습니다";

/**
 * 상세 · 수정의 조회 실패. 없거나 볼 수 없는 것(시설물 404)은 찾을 수 없음 화면, api 가 거절했으면(BP 를 고르지 않음 400 · 403 · 없는 BP 404)
 * 그 문장({ denied }). 그 밖은 그대로 던져 error.tsx 가 받는다.
 */
export const facilityDenied =
  (facilityId: number) =>
  (error: unknown): { denied: string } => {
    const denied = deniedMessageOf(error);
    if (denied === null) throw error;
    const status = error instanceof ApiError ? error.status : undefined;
    console.warn("시설물 조회 거절", { facilityId, status, message: denied });
    if (status === 404 && denied === FACILITY_NOT_FOUND) notFound();
    return { denied };
  };
