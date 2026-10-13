import { notFound } from "next/navigation";
import { ApiError, getEnum } from "@/lib/api";
import { isNotificationId } from "@/lib/notification-view";
import { getTemplate } from "@/lib/notification-templates";
import { ForbiddenPanel } from "../forbidden-panel";
import { TemplateForm } from "../template-form";

// 알림 템플릿 수정(#576 · #579, 목업 notify/templates-edit.html). 기본 문구와 등록한 것 모두 모든 칸을 고친다(NOTIFY-10).
// 없는 id 는 404, 플랫폼 운영자가 아니면(403) 권한 없음 안내. 그 밖의 실패는 error.tsx 가 받는다.
export default async function TemplateDetailPage({ params }: PageProps<"/platform/notification-templates/[id]">) {
  const id = Number((await params).id);
  // api 의 id 범위(1..2147483647)와 같다 — 운영 알림 id 검사를 그대로 쓴다.
  if (!isNotificationId(id)) notFound();

  const loaded = await Promise.all([getTemplate(id), getEnum("NotificationTemplateChannel"), getEnum("PreferenceCategory")]).catch((error: unknown) => {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 404) notFound();
    if (error.status !== 401 && error.status !== 403) throw error;
    return null;
  });
  if (loaded) {
    const [detail, channels, categories] = loaded;
    return <TemplateForm detail={detail} channels={channels} categories={categories} />;
  }
  return <ForbiddenPanel title="알림 템플릿 수정" />;
}
