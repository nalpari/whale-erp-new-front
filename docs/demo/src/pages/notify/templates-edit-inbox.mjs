// 알림 템플릿 수정 · 앱 푸시 탭의 TO-DO 배정. 푸시 없이 직원 근무 앱 알림함에만 쌓여(앱 NOTI-1) 미리보기도 알림함 줄만.
import { templateEdit } from "../../template-edit.mjs";

export default templateEdit({
  base: true,
  templateCode: "PUSH_TODO_ASSIGNED",
  kind: "inbox",
  type: "TO-DO 배정",
  channel: "앱 푸시",
  to: "직원 · 푸시 없이 직원 근무 앱 알림함에만",
  title: "새 TO-DO 가 배정되었습니다",
  body: "#{TO-DO제목} · #{수행예정일시}",
  vars: [{ name: "TO-DO제목", label: "TO-DO 제목", required: true, example: "마감 정산표 확인" }, { name: "수행예정일시", label: "수행 예정 일시", required: false, example: "10-08 18:00" }],
  preview: { title: "새 TO-DO 가 배정되었습니다", sub: "마감 정산표 확인 · 10-08 18:00" },
  history: [["10-01 09:00", "시스템", "기본 문구 배포"]],
});
