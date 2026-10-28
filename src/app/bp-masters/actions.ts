"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import {
  changeBpMasterStatus,
  checkBpMasterEmailAvailable,
  checkBpMasterLoginIdAvailable,
  createBpMaster,
  deleteBpMaster,
  getBpMasterHistories,
  resetBpMasterPassword,
  updateBpMaster,
  verifyBpBusiness,
  type BpBusinessVerificationInput,
  type BpMasterHistoryList,
  type BpMasterStatus,
  type CreateBpMasterInput,
  type CreateBpMasterResult,
  type UpdateBpMasterInput,
} from "@/lib/bp-masters";

// 등록 · 수정 · 상태 변경 · 비밀번호 초기화 · 삭제 · 이력 · 아이디 확인 · 사업자 진위확인. 실패하면 화면이 입력값을 그대로 두고 문구만 보인다.
// 메뉴 권한 · 삭제 조건 · 탈퇴 BP 보호는 api 가 동작마다 본다. server action 은 공개 엔드포인트라 id 가 int4 양의 정수인지만 다시 본다.

const PATH = "/bp-masters";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; status?: number; message: string };

/**
 * api 오류를 화면 문구로 바꾼다. 400 · 403 · 404 · 409 · 422(국세청 불일치) · 429(진위확인 시간당 한도)는 api 가 한국어로 알리므로 그대로,
 * 503(국세청 장애)은 인증 없이 저장할 수 있다는 것을 함께, 401 은 고정 문구로, 그 밖(5xx · 연결 실패)은 일반 문구로 바꾼다.
 * 비밀번호 초기화의 503 은 국세청이 아니라 메일 설정 없음이라 api 문구 그대로 둔다(2026-10-28 — 국세청 문구가 떴다, 사용자 지적).
 */
function failureOf(error: unknown, what: string, keep503 = false): { ok: false; status?: number; message: string } {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    // 429 는 사업자 진위확인 시간당 한도(10건)
    if ([400, 403, 404, 409, 422, 429].includes(error.status)) return { ok: false, status: error.status, message: error.message };
    if (error.status === 503 && keep503) return { ok: false, status: 503, message: error.message };
    if (error.status === 503) return { ok: false, status: 503, message: "지금은 국세청 확인을 할 수 없습니다. 인증 없이 저장하고 나중에 인증할 수 있습니다." };
  }
  console.error(`BP 마스터 계정 ${what} 실패`, error);
  return { ok: false, message: `${what}하지 못했습니다. 잠시 후 다시 시도해 주세요.` };
}

const validId = (id: number) => Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;
const NOT_FOUND = { ok: false as const, status: 404, message: "BP 를 찾을 수 없습니다" };

/** 저장이 끝났으면 목록 · 상세를 새로 받는다. 무효화가 실패해도 저장은 끝났으므로 성공으로 돌려준다. */
function refresh() {
  try {
    revalidatePath(PATH);
  } catch (error) {
    console.error("BP 마스터 계정 화면 갱신 실패", error);
  }
}

export async function createBpMasterAction(input: CreateBpMasterInput): Promise<ActionResult<CreateBpMasterResult>> {
  try {
    const result = await createBpMaster(input);
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failureOf(error, "등록");
  }
}

export async function updateBpMasterAction(bpCodeId: number, input: UpdateBpMasterInput): Promise<ActionResult> {
  if (!validId(bpCodeId)) return NOT_FOUND;
  try {
    await updateBpMaster(bpCodeId, input);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "수정");
  }
}

export async function changeBpMasterStatusAction(bpCodeId: number, status: Exclude<BpMasterStatus, "WITHDRAWN">): Promise<ActionResult> {
  if (!validId(bpCodeId)) return NOT_FOUND;
  if (status !== "ACTIVE" && status !== "INACTIVE") return { ok: false, status: 400, message: "사용 또는 미사용으로만 바꿀 수 있습니다" };
  try {
    await changeBpMasterStatus(bpCodeId, status);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "상태 변경");
  }
}

export async function resetBpMasterPasswordAction(bpCodeId: number): Promise<ActionResult<{ isMailSent: boolean }>> {
  if (!validId(bpCodeId)) return NOT_FOUND;
  try {
    const result = await resetBpMasterPassword(bpCodeId);
    // 강제 변경 대상 · 초기 비밀번호 미발송 표시 · 변경 이력이 바뀐다(수정 일시는 BP 정보 것이라 그대로다)
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failureOf(error, "비밀번호 초기화", true);
  }
}

export async function deleteBpMasterAction(bpCodeId: number): Promise<ActionResult> {
  if (!validId(bpCodeId)) return NOT_FOUND;
  try {
    await deleteBpMaster(bpCodeId);
    // 여기서는 다시 그리지 않는다 — ?bp=<지운 BP> 가 남은 주소로 그려져 「삭제되었거나 없는 BP」 띠가 잠깐 보인다.
    // 화면이 상세를 닫고 목록 주소로 옮기며 새로 받는다(platform-admins 와 같다).
    return { ok: true };
  } catch (error) {
    return failureOf(error, "삭제");
  }
}

export async function getBpMasterHistoriesAction(bpCodeId: number, page: number): Promise<ActionResult<BpMasterHistoryList>> {
  if (!validId(bpCodeId)) return NOT_FOUND;
  try {
    return { ok: true, ...(await getBpMasterHistories(bpCodeId, Number.isInteger(page) && page >= 1 ? page : 1)) };
  } catch (error) {
    return failureOf(error, "이력 조회");
  }
}

/** 아이디 중복 확인 — 등록 화면이 칸을 벗어나거나 Enter 를 칠 때 부른다. 형식은 화면이 먼저 본다. */
export async function checkBpMasterLoginIdAction(loginId: string): Promise<ActionResult<{ available: boolean }>> {
  try {
    return { ok: true, available: await checkBpMasterLoginIdAvailable(loginId) };
  } catch (error) {
    return failureOf(error, "아이디 확인");
  }
}

/** 이메일 중복 확인 — 등록 · 수정 화면이 아이디와 같은 때(칸을 벗어나거나 Enter) 부른다. 형식은 화면이 먼저 본다. */
export async function checkBpMasterEmailAction(email: string): Promise<ActionResult<{ available: boolean }>> {
  try {
    return { ok: true, available: await checkBpMasterEmailAvailable(email) };
  } catch (error) {
    return failureOf(error, "이메일 확인");
  }
}

/** 사업자 진위확인 —중복을 먼저 보고 국세청에 묻는다. 수정은 bpCodeId 를 실어 자기 BP 를 중복에서 뺀다. */
export async function verifyBpBusinessAction(input: BpBusinessVerificationInput): Promise<ActionResult<{ verificationToken: string }>> {
  if (input.bpCodeId !== undefined && !validId(input.bpCodeId)) return NOT_FOUND;
  try {
    return { ok: true, ...(await verifyBpBusiness(input)) };
  } catch (error) {
    return failureOf(error, "사업자정보 인증");
  }
}
