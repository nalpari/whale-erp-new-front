import { Button, PageBar } from "@/components/common";
import { ApiError, getEnum } from "@/lib/api";
import type { EnumValue } from "@/lib/enums";
import { parseTemplateQuery } from "@/lib/notification-template-view";
import { getTemplates, type TemplateList as ListData } from "@/lib/notification-templates";
import { ChannelTabs } from "./channel-tabs";
import { TemplateList } from "./template-list";

// 알림 템플릿 관리 목록(#575 · #579, 목업 notify/templates.html · 데모 pages/notify/templates.mjs). 플랫폼 운영자 전용.
// 채널 탭 넷(운영 알림 · 앱 푸시 · 메일 · 알림톡). 화면 상태(채널 · 쪽 · 건수)는 URL 에만 둔다.
// 지우는 길은 없고 사용 안 함으로 끈다(운영 정책 NTF-21). 승인 상태도 두지 않는다(NOTIFY-6).
export default async function NotificationTemplatesPage({ searchParams }: PageProps<"/platform/notification-templates">) {
  const query = parseTemplateQuery(await searchParams);
  let channels: EnumValue[] = [];
  let data: ListData | null = null;
  let failure = "";
  try {
    [channels, data] = await Promise.all([getEnum("NotificationTemplateChannel"), getTemplates(query)]);
  } catch (error) {
    const denied = error instanceof ApiError && (error.status === 401 || error.status === 403);
    failure = denied ? "알림 템플릿을 볼 권한이 없습니다." : "알림 템플릿을 불러오지 못했습니다.";
    if (!denied) console.error("알림 템플릿 목록 조회 실패", error);
  }

  return (
    <>
      <PageBar title="알림 템플릿 관리" />
      <div className="flex min-h-0 flex-1 p-[24px]">
        <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          {data ? (
            <>
              <ChannelTabs channels={channels} selected={query.channel} />
              <TemplateList items={data.items} total={data.total} query={query} totalPages={Math.max(1, Math.ceil(data.total / query.pageSize))} />
            </>
          ) : (
            <div className="flex flex-col items-center gap-[16px] py-[80px] text-[14px] text-erp-muted">
              <p>{failure}</p>
              {!failure.includes("권한") && (
                <Button variant="off" href={`/platform/notification-templates?channel=${query.channel}`}>
                  다시 시도
                </Button>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
