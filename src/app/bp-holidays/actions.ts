"use server";

import { revalidatePath } from "next/cache";
import { isDate } from "@/lib/bp-holiday-view";
import {
  checkBpHolidayOverlaps,
  createBpHoliday,
  deleteBpHoliday,
  getBpHolidayHistories,
  terminateBpHoliday,
  updateBpHoliday,
  type BpHolidayHistoryList,
  type BpHolidayOverlaps,
  type CheckBpHolidayOverlapsInput,
  type SaveBpHolidayInput,
  type UpdateBpHolidayInput,
} from "@/lib/bp-holidays";
import { failureOf as sharedFailureOf, validId, type ActionFailure, type ActionResult } from "@/lib/role-group-actions";

// BP 휴일 등록 · 수정 · 강제 종료 · 삭제 · 겹침 확인 · 변경 이력 조회. 실패하면 화면이 입력값을 그대로 두고 문구만 보인다.
// 점포 범위 · 상태별 동작 · 동시 수정은 api 가 동작마다 본다 — 400 · 403 · 404 · 409 문구가 무엇이 막혔는지 말한다.
// 탭 BP 는 인자로 받지 않는다 — 액션은 화면 주소(/bp/{id}/bp-holidays)로 POST 되어 proxy 가 헤더로 싣는다(authHeaders).
// server action 은 공개 엔드포인트라 id 가 int4 양의 정수인지 · 날짜 모양만 다시 본다.

const PATH = "/bp-holidays";

const failureOf = (error: unknown, what: string, wrote = true) => sharedFailureOf(error, "BP 휴일", what, wrote);
const NOT_FOUND = { ok: false, status: 404, message: "휴일을 찾을 수 없습니다." } satisfies ActionFailure;

/** 저장이 끝났으면 목록 · 상세를 새로 받는다. 무효화가 실패해도 저장은 끝났으므로 성공으로 돌려준다. */
function refresh() {
  try {
    revalidatePath(PATH);
  } catch (error) {
    console.error("BP 휴일 화면 갱신 실패", error);
  }
}

export async function createBpHolidayAction(input: SaveBpHolidayInput): Promise<ActionResult<{ bpHolidayId: number }>> {
  try {
    const result = await createBpHoliday(input);
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failureOf(error, "등록");
  }
}

export async function updateBpHolidayAction(id: number, input: UpdateBpHolidayInput): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await updateBpHoliday(id, input);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "수정");
  }
}

export async function terminateBpHolidayAction(id: number, updatedAt: string): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await terminateBpHoliday(id, updatedAt);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "강제 종료");
  }
}

export async function deleteBpHolidayAction(id: number, updatedAt: string): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await deleteBpHoliday(id, updatedAt);
    // 화면은 성공하면 상세를 닫고 목록 주소로 옮긴다 — 지운 휴일의 ?holiday= 로 다시 그려 404 띠가 잠깐 보이지 않게 여기서는 다시 그리지 않는다
    return { ok: true };
  } catch (error) {
    return failureOf(error, "삭제");
  }
}

/** 겹침 확인 — 읽기라 응답을 못 받으면 「확인하지 못했다」고만 알리고 저장은 화면이 이어서 묻는다. */
export async function checkBpHolidayOverlapsAction(input: CheckBpHolidayOverlapsInput): Promise<ActionResult<BpHolidayOverlaps>> {
  if (input.bpHolidayId !== undefined && !validId(input.bpHolidayId)) return NOT_FOUND;
  try {
    return { ok: true, ...(await checkBpHolidayOverlaps(input)) };
  } catch (error) {
    return failureOf(error, "겹침 확인", false);
  }
}

export async function getBpHolidayHistoriesAction(q: { from: string; to: string; page: number }): Promise<ActionResult<BpHolidayHistoryList>> {
  if (!isDate(q.from) || !isDate(q.to)) return { ok: false, status: 400, message: "기간을 YYYY-MM-DD 로 입력해 주세요." };
  if (q.from > q.to) return { ok: false, status: 400, message: "시작 날짜는 끝 날짜보다 늦을 수 없습니다." };
  const page = Number.isInteger(q.page) && q.page >= 1 && q.page <= 100_000 ? q.page : 1;
  try {
    return { ok: true, ...(await getBpHolidayHistories({ ...q, page })) };
  } catch (error) {
    return failureOf(error, "변경이력 조회", false);
  }
}
