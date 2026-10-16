"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import { checkRetiredDate } from "@/lib/retirement";
import { kstToday, type RetirementPreview } from "@/lib/staff-members";
import { cancelRetirement, changeRetirementDate, getRetirementPreview, retireStaffMember } from "@/lib/staff-members-api";

// 퇴직 처리 확인창의 미리 보기 · 처리 · 퇴직일 변경 · 취소(WHALEERP-585).
// 메뉴 권한(직원 정보 관리 수정) · 업무 범위 · 상태 · 날짜는 api 가 동작마다 본다. server action 은 공개 엔드포인트라
// id 와 날짜 모양만 다시 본다 — 화면을 거치지 않은 이상한 값을 api 까지 보내지 않는다.

/**
 * 실패 결과. status 가 있으면 api 가 거절한 것이 확실하다. 없으면 결과를 모른다(5xx · 연결 실패) — 처리됐을 수도 있으니
 * 화면은 상세를 다시 받는다(failureEffect 의 refresh).
 */
export type ActionFailure = { ok: false; status?: number; message: string };
export type ActionResult<T = object> = ({ ok: true } & T) | ActionFailure;

/** api 는 400 · 403 · 404 · 409 를 한국어로 알리므로 그대로 보인다. 401 은 할 일을 알 수 있게 고정 문구로 바꾼다. */
function failureOf(error: unknown, what: string): ActionFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if (error.status < 500) return { ok: false, status: error.status, message: error.message };
  }
  console.error(`퇴직 ${what} 결과 모름`, error);
  return { ok: false, message: `${what} 결과를 확인하지 못했습니다. 화면을 새로 불러왔으니 확인해 주세요.` };
}

const validId = (id: unknown): id is number => typeof id === "number" && Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;
const NOT_FOUND: ActionFailure = { ok: false, status: 404, message: "직원을 찾을 수 없습니다." };

/** 날짜 모양만 본다. 3개월 범위도 같이 보지만 api 가 다시 본다(오늘이 화면과 서버에서 다를 수 있다). */
function badDate(retiredDate: unknown): ActionFailure | null {
  const message = typeof retiredDate === "string" ? checkRetiredDate(retiredDate, kstToday()) : "퇴직일을 입력해 주세요.";
  return message ? { ok: false, status: 400, message } : null;
}

/** 처리 뒤 상세 · 목록을 새로 받는다. 무효화가 실패해도 처리는 끝났으므로 성공으로 돌려준다 */
function refresh() {
  try {
    revalidatePath("/staff-members", "layout");
  } catch (error) {
    console.error("직원 화면 갱신 실패", error);
  }
}

export async function previewRetirementAction(id: unknown, retiredDate: unknown): Promise<ActionResult<{ preview: RetirementPreview }>> {
  if (!validId(id)) return NOT_FOUND;
  const bad = badDate(retiredDate);
  if (bad) return bad;
  try {
    return { ok: true, preview: await getRetirementPreview(id, retiredDate as string) };
  } catch (error) {
    return failureOf(error, "미리 보기");
  }
}

export async function retireAction(id: unknown, retiredDate: unknown): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  const bad = badDate(retiredDate);
  if (bad) return bad;
  try {
    await retireStaffMember(id, retiredDate as string);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "처리");
  }
}

export async function changeRetirementDateAction(id: unknown, retiredDate: unknown): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  const bad = badDate(retiredDate);
  if (bad) return bad;
  try {
    await changeRetirementDate(id, retiredDate as string);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "퇴직일 변경");
  }
}

export async function cancelRetirementAction(id: unknown): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await cancelRetirement(id);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "취소");
  }
}
