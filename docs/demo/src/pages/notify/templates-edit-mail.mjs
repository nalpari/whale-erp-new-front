// 알림 템플릿 수정 · 메일. 목업 docs/mockup/notify/templates-edit.html 의 「근로계약 거부 · 메일」 예.
import { templateEdit } from "../../template-edit.mjs";

export default templateEdit({
  templateCode: "EMAIL_CONTRACT_REJECTED",
  kind: "mail",
  type: "근로계약 거부",
  channel: "메일",
  to: "소속 범위 사업자 관리자",
  title: "[WHALE ERP] #{직원이름} 님이 근로계약서를 거부했습니다",
  body: "#{직원이름} 님이 #{근무지} 근로계약서를 거부했습니다.\n\n거부 사유: #{거부사유}\n\n조건을 고쳐 새 계약을 만들거나 그대로 재발송할 수 있습니다.",
  vars: ["직원이름", "근무지", "거부사유", "계약링크"],
  preview: {
    title: "[WHALE ERP] 유하람 님이 근로계약서를 거부했습니다",
    body: "유하람 님이 모리커피 연남점 근로계약서를 거부했습니다.\n\n거부 사유: 근무 시작 시각이 면접 때 이야기한 것과 다릅니다.\n\n조건을 고쳐 새 계약을 만들거나 그대로 재발송할 수 있습니다.",
    button: "계약 열기",
  },
  history: [
    ["10-06 16:20", "이서준", "본문 마지막 줄 추가"],
    ["10-01 09:00", "시스템", "기본 문구 배포"],
  ],
});
