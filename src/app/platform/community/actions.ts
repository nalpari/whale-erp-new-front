"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import { deletePost } from "@/lib/community";
import { COMMUNITY } from "@/lib/community-view";

// 공지사항 · FAQ 지우기(지움 표시). 등록 · 수정은 첨부 때문에 라우트 핸들러(posts/route.ts)가 한다.
// 로그인 · 권한(플랫폼 관리자)은 api 가 본다 — 세션 토큰을 싣고, 없거나 끝났으면 api 가 401 을 준다.

export type DeleteResult = { ok: true } | { ok: false; message: string };

export async function deletePostAction(postId: number): Promise<DeleteResult> {
  // 서버 액션은 누구나 아무 인자로 부를 수 있다 — api 경로에 붙이기 전에 id 범위(1..2147483647)를 본다.
  if (!Number.isInteger(postId) || postId < 1 || postId > 2_147_483_647) return { ok: false, message: "게시물을 찾을 수 없습니다." };
  try {
    await deletePost(postId);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) return { ok: false, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
      if (error.status === 403) return { ok: false, message: "게시물을 지울 권한이 없습니다." };
      // 404(없는 글) · 409(이미 지운 글)는 api 문장이 정확하다.
      if (error.status === 404 || error.status === 409) return { ok: false, message: error.message };
    }
    console.error("공지사항 · FAQ 삭제 실패", postId, error);
    return { ok: false, message: "삭제에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }
  revalidatePath(COMMUNITY, "layout");
  return { ok: true };
}
