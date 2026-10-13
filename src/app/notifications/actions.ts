"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import { deleteNotifications, readAllNotifications, readNotification } from "@/lib/notifications";
import { linkOf } from "@/lib/notification-view";

// 모두 읽음 · 선택 삭제. 실패하면 화면이 고른 것을 그대로 두고 문구만 보인다(#252 「이전 상태를 그대로 두고 다시 하게」).
/**
 * 읽음 · 삭제가 바뀌면 모든 화면을 다시 그리게 한다. 종(미확인 건수)은 화면마다 헤더에서 서버가 그리므로 알림함만 비우면
 * 다른 화면이나 뒤로 가기에서 예전 숫자가 남는다(2026-10-13 확인).
 */
function refreshBells() {
  revalidatePath("/", "layout");
}

export type ActionResult = { ok: true } | { ok: false; message: string };

async function run(what: string, act: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await act();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { ok: false, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if (error instanceof ApiError && error.status === 403) return { ok: false, message: "운영 알림을 볼 권한이 없습니다." };
    console.error(`${what} 실패`, error);
    return { ok: false, message: `${what}에 실패했습니다. 잠시 후 다시 시도해 주세요.` };
  }
  refreshBells();
  return { ok: true };
}

export async function readAllAction(): Promise<ActionResult> {
  return run("모두 읽음", readAllNotifications);
}

export async function deleteAction(ids: number[]): Promise<ActionResult> {
  return run("알림 삭제", () => deleteNotifications(ids));
}

/**
 * 알림을 눌러 업무 화면으로 갈 때(#255) — 읽음으로 바꾸고 갈 곳을 돌려준다. 읽음은 GET 이 아니라 여기(POST)서만 바꾼다:
 * 브라우저가 링크를 미리 불러오거나(프리페치 · 프리렌더) 메일 보안 검사기가 링크를 열어 보는 것만으로 읽음이 되면 안 된다.
 * 갈 곳이 없거나 남의 알림이면 알림함으로 돌려보내 안내하고, 읽음 처리에 실패하면 알림은 그대로 미확인이다.
 */
export async function openAction(id: number): Promise<string> {
  try {
    const target = linkOf(await readNotification(id)) ?? "/notifications?gone=1";
    refreshBells();
    return target;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return "/notifications?gone=1";
    console.error("운영 알림 읽음 처리 실패", error);
    return "/notifications?error=read";
  }
}
