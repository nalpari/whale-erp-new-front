"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import { withPeriod } from "@/lib/format";
import {
  checkBpAdminEmailAvailable,
  checkBpAdminLoginIdAvailable,
  createBpAdmin,
  getBpAdminHistories,
  getBpAdminStoreOptions,
  getBpAdminUpdateImpact,
  resetBpAdminPassword,
  updateBpAdmin,
  type BpAdminHistoryList,
  type BpAdminRoleType,
  type BpAdminStoreOption,
  type BpAdminUpdateImpact,
  type CreateBpAdminInput,
  type UpdateBpAdminInput,
} from "@/lib/bp-admins";

// 등록 · 수정 · 비밀번호 초기화 · 이력 · 점포 선택지 조회. 실패하면 화면이 입력값을 그대로 두고 문구만 보인다.
// 대상 BP 는 화면 주소(/bp/{id}/bp-admins)로 POST 되는 이 액션 요청에 proxy 가 실은 헤더로 정해진다 — 인자로 받지 않는다.
// 역할 규칙(등록할 수 있는 역할 · 고칠 수 있는 계정 · 본인 보호 · 점포 범위)은 api 가 동작마다 본다(403 · 400 문구가 무엇이 막혔는지 말한다).
// server action 은 공개 엔드포인트라 id 가 int4 양의 정수인지만 다시 본다.

/** rewrite 된 폴더 경로 — 탭 BP 주소(/bp/{id}/bp-admins)가 아니라 이것을 무효화한다(bp-role-groups 와 같다) */
const PATH = "/bp-admins";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; status?: number; message: string };

/**
 * api 오류를 화면 문구로 바꾼다. 400(형식 · 고를 수 없는 권한 · 점포 범위) · 403(역할 · 본인 보호) · 404(없거나 볼 수 없는 계정) ·
 * 409(중복 · 동시 수정 · 한 점포 한 가맹 마스터 · 이메일 없는 계정 초기화)는 api 가 한국어로 알리므로 그대로 보인다.
 * 401 은 할 일을 알 수 있게 고정 문구로, 그 밖(5xx · 연결 실패)은 일반 문구로 바꾼다.
 */
function failureOf(error: unknown, what: string): { ok: false; status?: number; message: string } {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if ([400, 403, 404, 409].includes(error.status)) return { ok: false, status: error.status, message: withPeriod(error.message) };
  }
  console.error(`BP 관리자 ${what} 실패`, error);
  return { ok: false, message: `${what}하지 못했습니다. 잠시 후 다시 시도해 주세요.` };
}

const validId = (id: number) => Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;
const NOT_FOUND = { ok: false as const, status: 404, message: "관리자 계정을 찾을 수 없습니다" };
const ROLE_TYPES: readonly BpAdminRoleType[] = ["BA", "FM", "FA"];

/** 저장이 끝났으면 목록 · 상세를 새로 받는다. 무효화가 실패해도 저장은 끝났으므로 성공으로 돌려준다. */
function refresh() {
  try {
    revalidatePath(PATH);
  } catch (error) {
    console.error("BP 관리자 화면 갱신 실패", error);
  }
}

export async function createBpAdminAction(input: CreateBpAdminInput): Promise<ActionResult<{ adminAccountId: number; isMailSent: boolean }>> {
  try {
    const result = await createBpAdmin(input);
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failureOf(error, "등록");
  }
}

/** 아이디 중복 확인 — 등록 패널이 칸을 벗어나거나 Enter 를 칠 때 부른다. 형식은 화면이 먼저 본다. */
export async function checkBpAdminLoginIdAction(loginId: string): Promise<ActionResult<{ available: boolean }>> {
  try {
    return { ok: true, available: await checkBpAdminLoginIdAvailable(loginId) };
  } catch (error) {
    return failureOf(error, "아이디 확인");
  }
}

/** 이메일 중복 확인 — 등록 패널이 아이디와 같은 때(칸을 벗어나거나 Enter) 부른다. 형식은 화면이 먼저 본다. */
export async function checkBpAdminEmailAction(email: string): Promise<ActionResult<{ available: boolean }>> {
  try {
    return { ok: true, available: await checkBpAdminEmailAvailable(email) };
  } catch (error) {
    return failureOf(error, "이메일 확인");
  }
}

export async function updateBpAdminAction(id: number, input: UpdateBpAdminInput): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await updateBpAdmin(id, input);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "수정");
  }
}

/** 가맹 마스터를 저장하면 함께 바뀔 가맹 관리자 수 — 수정 패널이 상태 칸 아래 띠(미사용을 고를 때)와 저장 전 확인창에 쓴다. */
export async function getBpAdminUpdateImpactAction(
  id: number,
  input: Pick<UpdateBpAdminInput, "accountStatus" | "storeIds">,
): Promise<ActionResult<BpAdminUpdateImpact>> {
  if (!validId(id)) return NOT_FOUND;
  if (input?.accountStatus !== "ACTIVE" && input?.accountStatus !== "INACTIVE") return { ok: false, status: 400, message: "계정상태를 골라 주세요." };
  if (!Array.isArray(input.storeIds) || !input.storeIds.every(validId)) return { ok: false, status: 400, message: "점포를 다시 골라 주세요." };
  try {
    const impact = await getBpAdminUpdateImpact(id, input);
    // 수가 빠지면 패널의 `deactivatedCount || unmappedCount` 검사가 거짓이 되어 확인창 없이 저장된다 — 모양이 다르면 실패로 돌려 저장을 막는다
    if (typeof impact?.deactivatedCount !== "number" || typeof impact.unmappedCount !== "number") {
      console.error("BP 관리자 함께 바뀌는 계정 응답 모양이 다르다", impact);
      return { ok: false, message: "함께 바뀌는 계정을 확인하지 못했습니다." };
    }
    return { ok: true, ...impact };
  } catch (error) {
    return failureOf(error, "함께 바뀌는 계정 조회");
  }
}

export async function resetBpAdminPasswordAction(id: number): Promise<ActionResult<{ isMailSent: boolean }>> {
  if (!validId(id)) return NOT_FOUND;
  try {
    const { isMailSent } = await resetBpAdminPassword(id);
    // 초기화가 updatedAt 을 올리고 미발송 표시도 바꾼다 — 새로 받지 않으면 이어서 수정할 때 옛 updatedAt 으로 거짓 409 가 난다
    refresh();
    return { ok: true, isMailSent };
  } catch (error) {
    // api 문구 「이메일이 없는 계정이라 보낼 곳이 없습니다」(409)는 화면 말투로 바꾼다 — 세 관리 화면 같다(2026-10-28 사용자 지정)
    if (error instanceof ApiError && error.status === 409 && error.message.includes("이메일이 없는 계정"))
      return { ok: false, status: 409, message: "해당 계정에는 등록된 이메일 주소가 없어 메일을 발송할 수 없습니다." };
    return failureOf(error, "비밀번호를 초기화");
  }
}

export async function getBpAdminHistoriesAction(id: number, page: number): Promise<ActionResult<BpAdminHistoryList>> {
  if (!validId(id)) return NOT_FOUND;
  try {
    return { ok: true, ...(await getBpAdminHistories(id, Number.isInteger(page) && page >= 1 ? page : 1)) };
  } catch (error) {
    return failureOf(error, "이력 조회");
  }
}

/** 대상 점포 선택지 — 등록 · 수정 패널이 열릴 때와 (등록에서) 계정 역할을 바꿀 때 받는다. 폐점 · (가맹 마스터면) 다른 가맹 마스터 담당 점포는 api 가 빼고 보낸다. */
export async function getBpAdminStoreOptionsAction(
  roleTypeCode: BpAdminRoleType,
  adminAccountId?: number,
): Promise<ActionResult<{ items: BpAdminStoreOption[] }>> {
  if (!ROLE_TYPES.includes(roleTypeCode)) return { ok: false, status: 400, message: "계정 역할을 골라 주세요." };
  if (adminAccountId !== undefined && !validId(adminAccountId)) return NOT_FOUND;
  try {
    return { ok: true, items: await getBpAdminStoreOptions(roleTypeCode, adminAccountId) };
  } catch (error) {
    return failureOf(error, "점포 목록 조회");
  }
}
