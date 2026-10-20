"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "./api";
import { createFaq, deletePost, updateFaq, type PostBody, type PostDetail } from "./community";
import { POST_BASE, type PostKind } from "./community-view";

// FAQ 등록 · 수정과 공지사항 · FAQ 지우기(지움 표시). 공지사항 등록 · 수정은 첨부 때문에 라우트 핸들러(platform-notices/save)가 한다.
// 로그인 · 권한(플랫폼 관리자 + 메뉴 권한)은 api 가 본다 — 세션 토큰을 싣고, 없거나 끝났으면 api 가 401 을 준다.

/** 실패면 폼 위 띠에 한 줄씩 보일 문장 목록. 400 검증 실패 · 409 는 api 문장 그대로다. */
export type SaveResult = { ok: true; detail: PostDetail } | { ok: false; status?: number; messages: string[] };
export type DeleteResult = { ok: true } | { ok: false; message: string };

// 서버 액션은 누구나 아무 인자로 부를 수 있다 — api 경로에 붙이기 전에 id 범위(1..2147483647)를 본다.
const isPostId = (id: unknown): id is number => Number.isInteger(id) && (id as number) >= 1 && (id as number) <= 2_147_483_647;
const isKind = (kind: unknown): kind is PostKind => kind === "NOTICE" || kind === "FAQ";

function messageOf(error: unknown, what: string): { status?: number; messages: string[] } {
  if (error instanceof ApiError) {
    const { status } = error;
    if (status === 401) return { status, messages: ["로그인이 만료되었습니다. 다시 로그인해 주세요."] };
    if (status === 403) return { status, messages: [`게시물을 ${what}할 권한이 없습니다.`] };
    // 400(검증) · 404(없는 글) · 409(그사이 고침 · 이미 지움)는 api 문장이 정확하다.
    if (status === 400 || status === 404 || status === 409) return { status, messages: error.messages };
  }
  console.error(`공지사항 · FAQ ${what} 실패`, error);
  return { messages: [`${what}에 실패했습니다. 잠시 후 다시 시도해 주세요.`] };
}

export async function saveFaqAction(postId: number | null, body: PostBody, updatedAt?: string): Promise<SaveResult> {
  if (postId !== null && !isPostId(postId)) return { ok: false, status: 404, messages: ["게시물을 찾을 수 없습니다."] };
  let detail: PostDetail;
  try {
    detail = postId === null ? await createFaq(body) : await updateFaq(postId, { ...body, updatedAt: updatedAt ?? "" });
  } catch (error) {
    return { ok: false, ...messageOf(error, "저장") };
  }
  // 목록 · 수정 화면을 모두 새로 그리게 한다(수정은 [id] 동적 경로라 layout 단위로 비운다).
  revalidatePath(POST_BASE.FAQ, "layout");
  return { ok: true, detail };
}

export async function deletePostAction(kind: PostKind, postId: number): Promise<DeleteResult> {
  if (!isKind(kind) || !isPostId(postId)) return { ok: false, message: "게시물을 찾을 수 없습니다." };
  try {
    await deletePost(kind, postId);
  } catch (error) {
    return { ok: false, message: messageOf(error, "삭제").messages.join(" ") };
  }
  revalidatePath(POST_BASE[kind], "layout");
  return { ok: true };
}
