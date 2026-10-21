"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ApiError, SESSION_COOKIE } from "./api";
import { createFaq, deletePost, updateFaq, type PostBody, type PostDetail } from "./community";
import { PASSWORD_REQUIRED_PREFIX, POST_BASE, postIdOf, SESSION_EXPIRED, type PostKind } from "./community-view";

// FAQ 등록 · 수정과 공지사항 · FAQ 지우기(지움 표시). 공지사항 등록 · 수정은 첨부 때문에 라우트 핸들러(platform-notices/save)가 한다.
// 로그인 · 권한(플랫폼 관리자 + 메뉴 권한)은 api 가 본다 — 세션 토큰을 싣고, 없거나 끝났으면 api 가 401 을 준다.

/** 실패면 폼 위 띠에 한 줄씩 보일 문장 목록. 4xx 는 api 문장 그대로다(401 · 권한 없음 403 만 고정 문구). */
export type SaveResult = { ok: true; detail: PostDetail } | { ok: false; status?: number; messages: string[] };
export type DeleteResult = { ok: true } | { ok: false; status?: number; messages: string[] };

const NOT_FOUND: { ok: false; status: number; messages: string[] } = { ok: false, status: 404, messages: ["게시물을 찾을 수 없습니다."] };

async function messageOf(error: unknown, what: string): Promise<{ status?: number; messages: string[] }> {
  if (error instanceof ApiError) {
    const { status } = error;
    if (status === 401) {
      // 쿠키를 지워야 /login 이 「로그인한 채 오면 홈으로」로 되돌려 보내지 않는다(라우트 핸들러 · BFF 와 같다).
      // 서버 액션 요청은 proxy 가 토큰을 갱신하지 않아(proxy.ts) 오래 쓰다 저장하면 여기로 온다.
      (await cookies()).delete(SESSION_COOKIE);
      return { status, messages: [SESSION_EXPIRED] };
    }
    // 비밀번호 강제 변경 403 은 권한 없음이 아니다 — api 문장을 그대로 두고, 화면이 변경 팝업을 띄운다.
    if (status === 403 && !error.message.startsWith(PASSWORD_REQUIRED_PREFIX)) return { status, messages: [`게시물을 ${what}할 권한이 없습니다.`] };
    // 그 밖의 4xx(검증 400 · 없는 글 404 · 그사이 고침 409 등)는 api 문장이 정확하다.
    if (status < 500) return { status, messages: error.messages };
  }
  console.error(`공지사항 · FAQ ${what} 실패`, error);
  return { messages: [`${what}에 실패했습니다. 잠시 후 다시 시도해 주세요.`] };
}

/** FAQ 등록(edit 없음) · 수정. 수정은 읽은 updatedAt 을 함께 보내야 한다 — 그사이 누가 고쳤으면 api 가 409 로 막는다. */
export async function saveFaqAction(edit: { postId: number; updatedAt: string } | null, body: PostBody): Promise<SaveResult> {
  // 서버 액션은 누구나 아무 인자로 부를 수 있다 — api 경로에 붙이기 전에 id 를 본다.
  if (edit && (postIdOf(edit.postId) === null || typeof edit.updatedAt !== "string" || !edit.updatedAt)) return NOT_FOUND;
  let detail: PostDetail;
  try {
    detail = edit ? await updateFaq(edit.postId, { ...body, updatedAt: edit.updatedAt }) : await createFaq(body);
  } catch (error) {
    return { ok: false, ...(await messageOf(error, "저장")) };
  }
  // 목록 · 수정 화면을 모두 새로 그리게 한다(수정은 [id] 동적 경로라 layout 단위로 비운다).
  revalidatePath(POST_BASE.FAQ, "layout");
  return { ok: true, detail };
}

export async function deletePostAction(kind: PostKind, postId: number): Promise<DeleteResult> {
  if ((kind !== "NOTICE" && kind !== "FAQ") || postIdOf(postId) === null) return NOT_FOUND;
  try {
    await deletePost(kind, postId);
  } catch (error) {
    return { ok: false, ...(await messageOf(error, "삭제")) };
  }
  revalidatePath(POST_BASE[kind], "layout");
  return { ok: true };
}
