"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import {
  bulkCreateSchedules,
  createSchedule,
  deleteSchedule,
  getScheduleDefaults,
  getScheduleStaff,
  updateSchedule,
  type BulkResult,
  type ScheduleDefaults,
  type ScheduleFields,
  type ScheduleStaff,
} from "@/lib/work-schedules-api";
import type { ActionFailure, ActionResult } from "../staff-members/[id]/actions";

// 근무스케줄 등록 · 수정 · 삭제(#203)와 등록 패널의 직원 · 계약 값. 메뉴 권한(근무스케줄 관리) · 업무 범위 · 규칙(계약 · 퇴직일 · 겹침 ·
// 가입 전 · 본사 가림)은 api 가 다시 본다. server action 은 공개 엔드포인트라 경로 · 쿼리에 넣는 id 와 날짜 모양만 다시 본다.
// 실패 모양은 TO-DO · 직원 상세와 같아 useFailure 를 같이 쓴다.

const validId = (id: unknown): id is number => typeof id === "number" && Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;
const validDate = (d: unknown): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
const NOT_FOUND: ActionFailure = { ok: false, status: 404, message: "근무스케줄을 찾을 수 없습니다." };
const BAD_INPUT: ActionFailure = { ok: false, status: 400, message: "직원과 근무일을 골라 주세요." };
/** 등록 결과를 모를 때 — 이미 저장됐을 수 있어 다시 저장하게 두지 않는다(같은 시각이면 겹침으로 막히지만, 화면을 새로 받아 확인하게 한다) */
const SAVE_UNKNOWN = "저장 결과를 확인하지 못했습니다. 화면을 새로 불러왔으니 확인해 주세요.";

/** api 의 400 · 403 · 404 · 409 문장은 한국어라 그대로 보인다. 401 은 고정 문구, 5xx · 연결 실패는 결과 모름(status 없음) */
function failureOf(error: unknown, what: string, log: object): ActionFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if (error.status < 500) return { ok: false, status: error.status, message: error.message };
  }
  console.error(`근무스케줄 ${what} 결과 모름`, log, error);
  return { ok: false, message: SAVE_UNKNOWN };
}

/** 처리 뒤 화면을 새로 받는다. 무효화가 실패해도 처리는 끝났으므로 성공으로 돌려준다 */
function refresh() {
  try {
    revalidatePath("/work-schedules");
  } catch (error) {
    console.error("근무스케줄 화면 갱신 실패", error);
  }
}

export async function getScheduleStaffAction(storeId: unknown, workDate: unknown): Promise<ActionResult<{ staff: ScheduleStaff[] }>> {
  if (!validId(storeId) || !validDate(workDate)) return BAD_INPUT;
  try {
    return { ok: true, staff: await getScheduleStaff(storeId, workDate) };
  } catch (error) {
    return failureOf(error, "직원 목록 조회", { storeId, workDate });
  }
}

export async function getScheduleDefaultsAction(staffMemberId: unknown, workDate: unknown): Promise<ActionResult<{ defaults: ScheduleDefaults }>> {
  if (!validId(staffMemberId) || !validDate(workDate)) return BAD_INPUT;
  try {
    return { ok: true, defaults: await getScheduleDefaults(staffMemberId, workDate) };
  } catch (error) {
    return failureOf(error, "계약 값 조회", { staffMemberId, workDate });
  }
}

export async function createScheduleAction(staffMemberId: unknown, body: ScheduleFields): Promise<ActionResult> {
  if (!validId(staffMemberId)) return BAD_INPUT;
  try {
    await createSchedule({ ...body, staffMemberId });
    refresh();
    return { ok: true };
  } catch (error) {
    const failure = failureOf(error, "등록", { staffMemberId, workDate: body.workDate });
    if (failure.status === undefined) refresh();
    return failure;
  }
}

/** 여러 명 일괄 — 규칙에 걸린 줄은 failed 로 돌려주고 나머지는 저장된다 */
export async function bulkCreateSchedulesAction(
  workDate: unknown,
  rows: { staffMemberId: number; startTime: string; endTime: string; breakMinutes: number }[],
): Promise<ActionResult<{ result: BulkResult }>> {
  if (!validDate(workDate) || !Array.isArray(rows) || rows.length === 0 || !rows.every((r) => validId(r.staffMemberId))) return BAD_INPUT;
  try {
    const result = await bulkCreateSchedules({ workDate, rows });
    refresh();
    return { ok: true, result };
  } catch (error) {
    const failure = failureOf(error, "일괄 등록", { workDate, count: rows.length });
    if (failure.status === undefined) refresh();
    return failure;
  }
}

export async function updateScheduleAction(id: unknown, body: ScheduleFields): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await updateSchedule(id, body);
    refresh();
    return { ok: true };
  } catch (error) {
    const failure = failureOf(error, "수정", { id });
    if (failure.status === undefined || failure.status === 404) refresh();
    return failure;
  }
}

export async function deleteScheduleAction(id: unknown): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await deleteSchedule(id);
    refresh();
    return { ok: true };
  } catch (error) {
    const failure = failureOf(error, "삭제", { id });
    if (failure.status === undefined || failure.status === 404) refresh();
    return failure;
  }
}
