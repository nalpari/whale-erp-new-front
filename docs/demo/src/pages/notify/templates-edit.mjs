// 알림 템플릿 수정 · 운영 알림. 목업 docs/mockup/notify/templates-edit.html 을 운영 알림 채널로 본 것.
import { templateEdit } from "../../template-edit.mjs";

export default templateEdit({
  base: true,
  templateCode: "NTF_CONTRACT_REJECTED",
  kind: "ops",
  type: "근로계약 거부",
  channel: "운영 알림",
  to: "소속 범위 사업자 관리자",
  title: "#{직원이름} 님이 근로계약서를 거부했습니다",
  body: "사유 · #{거부사유}",
  vars: [{ name: "직원이름", label: "직원 이름", required: true, example: "유하람" }, { name: "근무지", label: "근무지", required: false, example: "모리커피 연남점" }, { name: "거부사유", label: "거부 사유", required: false, example: "근무 시작 시각이 다릅니다" }],
  preview: { title: "유하람 님이 근로계약서를 거부했습니다", sub: "사유 · 근무 시작 시각이 면접 때 이야기한 것과 다릅니다" },
  history: [
    ["10-06 16:20", "이서준", "본문 수정"],
    ["10-01 09:00", "시스템", "기본 문구 배포"],
  ],
});
