import { ApiError, getEnum } from "@/lib/api";
import { getTemplates } from "@/lib/notification-templates";
import { ForbiddenPanel } from "../forbidden-panel";
import { TemplateForm } from "../template-form";

// 알림 템플릿 등록(#582, 목업 notify/templates-new.html). 수정 화면과 같은 폼을 빈 값으로 연다.
// 채널을 고르면 템플릿 코드에 채널 접두만 채운다(NOTIFY-11). 등록하면 수정 화면으로 간다.
// 플랫폼 운영자가 아니면(401 · 403) 폼을 열지 않는다 — 권한은 목록 한 줄을 불러 보아 api 에 맡긴다.
export default async function NewTemplatePage() {
  const loaded = await Promise.all([
    getEnum("NotificationTemplateChannel"),
    getEnum("PreferenceCategory"),
    getTemplates({ channel: "NOTIFICATION", page: 1, pageSize: 20 }),
  ]).catch((error: unknown) => {
    if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 403)) throw error;
    return null;
  });
  if (!loaded) return <ForbiddenPanel title="알림 템플릿 등록" />;
  const [channels, categories] = loaded;
  return <TemplateForm channels={channels} categories={categories} />;
}
