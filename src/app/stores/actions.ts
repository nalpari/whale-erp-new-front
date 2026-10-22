"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import type {
  BusinessVerificationInput,
  BusinessVerificationResult,
  CreateStoreInput,
  StoreHistoryList,
  StoreTransitions,
  UpdateStoreInput,
} from "@/lib/store-types";
import {
  createStore,
  deleteStore,
  deleteStoreImage,
  getStoreHistories,
  getStoreTransitions,
  putStoreImage,
  updateStore,
  verifyStoreBusiness,
} from "@/lib/stores";

// 점포 등록 · 수정 · 삭제 · 상태 확인 · 사업자 진위확인 · 필터 자동완성 · 이력 쪽 넘기기.
// 메뉴 권한 · 관리 점포 범위 · 폐점 / BP 미사용 막기는 api 가 동작마다 본다. server action 은 공개 엔드포인트라
// id 범위 · 검색어 길이 · 파일 유무만 다시 본다. 로그인 판정도 api 가 한다 — 세션 토큰을 싣고, 없거나 끝났으면 api 가 401 을 준다.

/**
 * 실패 결과. status 가 있으면 api 가 거절한 것이 확실하다(4xx · 503). status 가 없으면 결과를 확신할 수 없다
 * (그 밖의 5xx · 연결 실패 · 응답을 읽지 못함) — 저장됐을 수도 있으니 화면은 상태를 다시 받고 「확인해 달라」고 알린다.
 * messages 는 검증 실패(400)의 문장 목록이다 — 화면이 칸마다 나눠 붙인다.
 */
export type ActionFailure = { ok: false; status?: number; message: string; messages?: string[] };
export type ActionResult<T = object> = ({ ok: true } & T) | ActionFailure;

/**
 * api 오류를 화면 문구로. 이 api 는 4xx(400 형식 · 운영 조건, 403 권한, 404 없음, 409 동시 수정 · 상태, 429 횟수)와
 * 503(진위확인 연동 · 저장소 없음)을 한국어로 알리므로 그대로 보인다. 401 은 할 일을 알 수 있게 고정 문구로 바꾼다.
 */
function failureOf(error: unknown, what: string): ActionFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if (error.status < 500 || error.status === 503) return { ok: false, status: error.status, message: error.message, messages: error.messages };
  }
  console.error(`점포 ${what} 결과 모름`, error);
  return { ok: false, message: `${what} 결과를 확인하지 못했습니다.` };
}

const validId = (id: number) => Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;
const NOT_FOUND = { ok: false as const, status: 404, message: "점포를 찾을 수 없습니다" };

/** 등록 · 수정 · 삭제가 끝났으면 목록 · 상세를 새로 받는다. 무효화가 실패해도 저장은 끝났으므로 성공으로 돌려준다 */
function refresh() {
  try {
    revalidatePath("/stores", "layout");
  } catch (error) {
    console.error("점포 화면 갱신 실패", error);
  }
}

export async function createStoreAction(input: CreateStoreInput): Promise<ActionResult<{ storeId: number; storeCode: string }>> {
  try {
    // BP 는 화면이 이 탭의 BP 를 싣는다(store-form-view). 플랫폼 계정이 다른 BP 를 고를 수 있는지 · BP 계정이 남의 BP 를 보냈는지는 api 가 본다.
    const result = await createStore(input);
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failureOf(error, "등록");
  }
}

export async function updateStoreAction(id: number, input: UpdateStoreInput): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await updateStore(id, input);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "수정");
  }
}

export async function deleteStoreAction(id: number): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await deleteStore(id);
    // 목록으로 옮길 때 새로 받지만, 뒤로 가기에 지운 점포의 화면이 그대로 돌아오지 않게 지나온 화면도 비운다
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "삭제");
  }
}

/**
 * 대표 이미지 올리기 · 바꾸기. 브라우저가 FormData(`file`)로 보낸다 — 서버 액션 본문 한도는 next.config 에서 6MB 로 늘렸다.
 * 형식 · 크기는 api 가 파일 내용으로 다시 본다(400). 저장소 설정이 없으면 503.
 */
export async function putStoreImageAction(id: number, data: FormData): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  const file = data instanceof FormData ? data.get("file") : null;
  if (!(file instanceof File) || file.size === 0) return { ok: false, status: 400, message: "대표 이미지 파일을 골라 주세요" };
  try {
    await putStoreImage(id, file);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "대표 이미지 저장");
  }
}

/** 대표 이미지 지우기 — 없어도 성공이다 */
export async function deleteStoreImageAction(id: number): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await deleteStoreImage(id);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "대표 이미지 삭제");
  }
}

/** 운영 · 폐점 · 삭제 가능 여부를 지금 기준으로 다시 본다(상태 변경 팝업 · 수정 화면에서 폐점을 고를 때) */
export async function getStoreTransitionsAction(id: number): Promise<ActionResult<StoreTransitions>> {
  if (!validId(id)) return NOT_FOUND;
  try {
    return { ok: true, ...(await getStoreTransitions(id)) };
  } catch (error) {
    return failureOf(error, "상태 확인");
  }
}

export async function getStoreHistoriesAction(id: number, page: number): Promise<ActionResult<StoreHistoryList>> {
  if (!validId(id)) return NOT_FOUND;
  try {
    return { ok: true, ...(await getStoreHistories(id, Number.isInteger(page) && page >= 1 ? page : 1)) };
  } catch (error) {
    return failureOf(error, "이력 조회");
  }
}

/** 사업자 진위확인. 연동 전이라 지금은 503 이 온다 — 화면이 그 문구를 칸 아래에 보인다 */
export async function verifyStoreBusinessAction(
  input: BusinessVerificationInput,
): Promise<ActionResult<BusinessVerificationResult>> {
  if (input.storeId !== undefined && !validId(input.storeId)) return NOT_FOUND;
  try {
    return { ok: true, ...(await verifyStoreBusiness(input)) };
  } catch (error) {
    return failureOf(error, "사업자정보 인증");
  }
}
