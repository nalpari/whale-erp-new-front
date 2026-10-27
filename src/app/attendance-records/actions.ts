"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import {
  correctAttendance,
  getAttendanceHistory,
  getProxyStaff,
  proxyAttendance,
  reviewAttendance,
  type AttendanceHistory,
  type CorrectAttendance,
  type ProxyAttendance,
  type ProxyStaff,
} from "@/lib/attendance-records-api";
import type { ActionFailure, ActionResult } from "../staff-members/[id]/actions";

// 출퇴근 기록 보정 · 「이상 없음」 · 대신 등록 · 이력(WHALEERP-218 · 220). 메뉴 권한 · 업무 범위 · 규칙(3개월 · 동의 · 계약 · 충돌)은 api 가
// 다시 본다. server action 은 공개 엔드포인트라 경로에 넣는 id 와 날짜 · 점포 조건 모양만 다시 본다. 실패 모양은 근무스케줄과 같다.

const validId = (id: unknown): id is number => typeof id === "number" && Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;
const validDate = (d: unknown): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
const NOT_FOUND: ActionFailure = { ok: false, status: 404, message: "출퇴근 기록을 찾을 수 없습니다." };
const SAVE_UNKNOWN = "저장 결과를 확인하지 못했습니다. 화면을 새로 불러왔으니 확인해 주세요.";

export type EditResult = ActionResult<{ isPayslipConfirmed: boolean }> & { code?: string };

/** api 의 4xx 문장은 한국어라 그대로 보인다(코드도 함께 — 409 ATTENDANCE_CHANGED 면 화면이 최신 기록을 다시 받는다). 5xx · 끊김은 결과 모름 */
function failureOf(error: unknown, what: string, log: object): ActionFailure & { code?: string } {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    const code = (error.body as { code?: unknown } | null)?.code;
    if (error.status < 500) return { ok: false, status: error.status, message: error.message, ...(typeof code === "string" ? { code } : {}) };
  }
  console.error(`출퇴근 ${what} 결과 모름`, log, error);
  return { ok: false, message: SAVE_UNKNOWN };
}

function refresh() {
  try {
    revalidatePath("/attendance-records");
  } catch (error) {
    console.error("출퇴근 화면 갱신 실패", error);
  }
}

export async function correctAttendanceAction(recordId: unknown, body: CorrectAttendance): Promise<EditResult> {
  if (!validId(recordId)) return NOT_FOUND;
  try {
    const result = await correctAttendance(recordId, body);
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    refresh();
    return failureOf(error, "보정", { recordId });
  }
}

export async function reviewAttendanceAction(recordId: unknown): Promise<EditResult> {
  if (!validId(recordId)) return NOT_FOUND;
  try {
    const result = await reviewAttendance(recordId);
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    refresh();
    return failureOf(error, "이상 없음", { recordId });
  }
}

export async function proxyAttendanceAction(body: ProxyAttendance): Promise<EditResult> {
  if (!validId(body?.staffMemberId) || !validDate(body?.date)) return { ok: false, status: 400, message: "직원과 날짜를 골라 주세요." };
  try {
    const result = await proxyAttendance(body);
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    refresh();
    return failureOf(error, "대신 등록", { staffMemberId: body.staffMemberId, date: body.date });
  }
}

export async function getProxyStaffAction(stores: string, date: unknown): Promise<ActionResult<{ staff: ProxyStaff[] }>> {
  if (!validDate(date) || typeof stores !== "string" || stores.length > 20_000) return { ok: false, status: 400, message: "날짜를 골라 주세요." };
  try {
    return { ok: true, staff: await getProxyStaff(new URLSearchParams(stores), date) };
  } catch (error) {
    return failureOf(error, "대신 등록 직원 조회", { date });
  }
}

export async function getAttendanceHistoryAction(recordId: unknown): Promise<ActionResult<{ history: AttendanceHistory }>> {
  if (!validId(recordId)) return NOT_FOUND;
  try {
    return { ok: true, history: await getAttendanceHistory(recordId) };
  } catch (error) {
    return failureOf(error, "이력 조회", { recordId });
  }
}
