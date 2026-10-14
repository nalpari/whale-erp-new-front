import { Button, GlobalHeader, PageBar, ServiceLinks, StoreSelect, UserPop } from "@/components/common";
import { NotificationBellSlot } from "@/components/notifications/notification-bell-slot";
import { ApiError } from "@/lib/api";
import { getNotifications, type NotificationList as ListData } from "@/lib/notifications";
import { parseNotificationQuery } from "@/lib/notification-view";
// 헤더 메뉴 · 사용자 메뉴는 아직 디자인 견본의 값뿐이다. 공통 GNB 가 생기면 그것으로 바꾼다.
import { MENUS, STORES, USER_ITEMS } from "../design/sample";
import { NotificationList } from "./notification-list";

// 운영 알림함(#254 · 데모 docs/demo/src/pages/notify/index.mjs). 화면 상태(쪽 · 건수)는 URL 에만 둔다.
// 플랫폼 운영자와 사업자 관리자가 같은 화면을 쓴다 — 무엇을 받는지는 api 가 로그인한 계정으로 정한다.
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseNotificationQuery(await searchParams);
  let data: ListData | null = null;
  let failure = "";
  try {
    data = await getNotifications(query);
  } catch (error) {
    failure =
      error instanceof ApiError && (error.status === 401 || error.status === 403)
        ? "운영 알림을 볼 권한이 없습니다."
        : "알림을 불러오지 못했습니다.";
    if (!failure.startsWith("운영")) console.error("운영 알림함 조회 실패", error);
  }
  const retry = `/notifications?page=${query.page}&pageSize=${query.pageSize}`;

  return (
    <div className="h-[100dvh] overflow-x-auto overflow-y-hidden bg-erp-thead-bg">
      <div className="relative flex h-full min-w-[1720px] flex-col overflow-x-clip">
        <GlobalHeader
          menus={MENUS}
          right={
            <>
              <StoreSelect options={STORES} />
              <ServiceLinks />
              <NotificationBellSlot />
              <UserPop name="정하윤 (BP 마스터)" items={USER_ITEMS} />
            </>
          }
        />
        <PageBar title="운영 알림함" />
        <div className="flex min-h-0 flex-1 p-[24px]">
          <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
            {data ? (
              <NotificationList
                items={data.items}
                total={data.total}
                unreadCount={data.unreadCount}
                query={query}
                totalPages={Math.max(1, Math.ceil(data.total / query.pageSize))}
              />
            ) : (
              <div className="flex flex-col items-center gap-[16px] py-[80px] text-[14px] text-erp-muted">
                <p>{failure}</p>
                {failure.startsWith("알림을") && (
                  <Button variant="off" href={retry}>
                    다시 시도
                  </Button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
