import { getEnum } from "@/lib/api";
import { TemplateForm } from "../template-form";

// 알림 템플릿 등록(#582, 목업 notify/templates-new.html). 수정 화면과 같은 폼을 빈 값으로 연다.
// 채널을 고르면 템플릿 코드에 채널 접두만 채운다(NOTIFY-11). 등록하면 수정 화면으로 간다.
export default async function NewTemplatePage() {
  const [channels, categories] = await Promise.all([getEnum("NotificationTemplateChannel"), getEnum("PreferenceCategory")]);
  return <TemplateForm channels={channels} categories={categories} />;
}
