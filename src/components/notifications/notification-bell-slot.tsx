import { ApiError } from "@/lib/api";
import { getNotifications } from "@/lib/notifications";
import { NotificationBell } from "./notification-bell";

const RECENT = 5;

// 종에 들어갈 값을 서버에서 읽는다. 목록 api 하나로 미확인 건수와 최근 다섯 건을 얻는다(따로 api 를 두지 않는다).
// 실패해도 헤더는 그려야 하므로 null 로 넘겨 배지 없는 종을 보인다.
export async function NotificationBellSlot() {
  const data = await getNotifications({ pageSize: RECENT })
    .then((list) => ({ unreadCount: list.unreadCount, recent: list.items }))
    .catch((error: unknown) => {
      // 403 은 비밀번호 강제 변경 · 약관 재동의 중 api 가 정해진 대로 막은 것이라 남기지 않는다. 바꾸면 화면을 다시 열어 종도 다시 읽는다.
      if (!(error instanceof ApiError && error.status === 403)) console.error("운영 알림 종 조회 실패", error);
      return null;
    });
  return <NotificationBell data={data} />;
}
