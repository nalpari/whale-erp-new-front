import { ApiError } from "@/lib/api";
import { getNotifications } from "@/lib/notifications";
import { PASSWORD_CHANGE_REQUIRED_MESSAGE } from "@/lib/retirement";
import { NotificationBell } from "./notification-bell";

const RECENT = 5;

// 종에 들어갈 값을 서버에서 읽는다. 목록 api 하나로 미확인 건수와 최근 다섯 건을 얻는다(따로 api 를 두지 않는다).
// 실패해도 헤더는 그려야 하므로 null 로 넘겨 배지 없는 종을 보인다.
export async function NotificationBellSlot() {
  const data = await getNotifications({ pageSize: RECENT })
    .then((list) => ({ unreadCount: list.unreadCount, recent: list.items }))
    .catch((error: unknown) => {
      // 강제 비밀번호 변경 전에는 api 가 모든 요청을 403 으로 막는다 — 정해진 동작이라 오류로 남기지 않는다(2026-10-28, 개발 서버 Issues 로 잡혔다)
      const passwordPending = error instanceof ApiError && error.status === 403 && error.message === PASSWORD_CHANGE_REQUIRED_MESSAGE;
      if (!passwordPending) console.error("운영 알림 종 조회 실패", error);
      return null;
    });
  return <NotificationBell data={data} />;
}
