"use server";

import { revalidatePath } from "next/cache";
import { actionFailure, type ActionResult } from "@/lib/api";
import {
  createFacility,
  deleteFacility,
  deleteFacilityDocument,
  getFacilityManagerOptions,
  updateFacility,
  type CreateFacilityInput,
  type FacilityDocumentKind,
  type FacilityManagerOption,
  type UpdateFacilityInput,
} from "@/lib/facilities";
import { DOCUMENT_KINDS } from "./facility-form-model";

// 시설물 · 장비 등록 · 수정 · 삭제 · 문서 빼기 · 관리 담당자 선택지. 문서 올리기는 파일이 서버 액션 한도(6MB)를 넘어 라우트 핸들러(documents/route.ts)다.
// 메뉴 권한 · 관리 점포 범위 · 폐점 점포 조회만은 api 가 동작마다 본다. server action 은 공개 엔드포인트라 id 범위 · 문서 종류만 다시 본다.
// 탭 BP(X-Bp-Code-Id)는 화면이 탭 BP 주소(/bp/{id}/facilities)에서 부르므로 proxy 가 싣는다 — 플랫폼 계정은 없으면 api 가 400.

const FEATURE = { feature: "시설물·장비" };
const validId = (id: number) => Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;
const NOT_FOUND = { ok: false as const, status: 404, message: "시설물·장비를 찾을 수 없습니다.", messages: ["시설물·장비를 찾을 수 없습니다."] };

/** 쓰기가 끝났으면 목록 · 상세를 새로 받는다. 무효화가 실패해도 저장은 끝났으므로 성공으로 돌려준다 */
function refresh() {
  try {
    revalidatePath("/facilities", "layout");
  } catch (error) {
    console.error("시설물 화면 갱신 실패", error);
  }
}

export async function createFacilityAction(input: CreateFacilityInput): Promise<ActionResult<{ facilityId: number }>> {
  try {
    const { facilityId } = await createFacility(input);
    refresh();
    return { ok: true, facilityId };
  } catch (error) {
    return actionFailure(error, "등록", { ...FEATURE, storeId: input.storeId });
  }
}

/** 수정 — 상세의 updatedAt 을 함께 보낸다. 그 사이 다른 사람이 고쳤으면 409 */
export async function updateFacilityAction(id: number, input: UpdateFacilityInput): Promise<ActionResult<{ updatedAt: string }>> {
  if (!validId(id)) return NOT_FOUND;
  try {
    const { updatedAt } = await updateFacility(id, input);
    refresh();
    return { ok: true, updatedAt };
  } catch (error) {
    return actionFailure(error, "저장", { ...FEATURE, facilityId: id });
  }
}

export async function deleteFacilityAction(id: number): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await deleteFacility(id);
    refresh();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "삭제", { ...FEATURE, facilityId: id });
  }
}

/** 문서 빼기(수정 화면의 「빼기」) — 없어도 성공이다 */
export async function deleteFacilityDocumentAction(id: number, kind: FacilityDocumentKind): Promise<ActionResult> {
  if (!validId(id) || !DOCUMENT_KINDS.includes(kind)) return NOT_FOUND;
  try {
    await deleteFacilityDocument(id, kind);
    refresh();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "문서 빼기", { ...FEATURE, facilityId: id, kind });
  }
}

/** 관리 담당자 선택지 — 등록 화면에서 점포를 고를 때마다 그 점포의 재직 직원을 받는다 */
export async function getManagerOptionsAction(storeId: number): Promise<ActionResult<{ items: FacilityManagerOption[] }>> {
  if (!validId(storeId)) return { ok: true, items: [] };
  try {
    return { ok: true, items: await getFacilityManagerOptions(storeId) };
  } catch (error) {
    return actionFailure(error, "관리 담당자 조회", { ...FEATURE, storeId }, { definite: true });
  }
}
