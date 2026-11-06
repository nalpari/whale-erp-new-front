// 알림 템플릿 수정 · 운영 알림. 목업 docs/mockup/notify/templates-edit.html 을 운영 알림 채널로 본 것.
// 문구는 api 기본 문구(20261030093710 정리 뒤 20261030120100 — 거부 사유는 받지 않아 그 줄을 근무지로, WHALEERP-635).
import { templateEdit } from "../../template-edit.mjs";

export default templateEdit({
  base: true,
  templateCode: "NTF_CONTRACT_REJECTED",
  kind: "ops",
  type: "근로계약 거부",
  channel: "운영 알림",
  to: "소속 범위 사업자 관리자",
  title: "근로계약서 서명 거부",
  body: "#{직원이름} 님이 근로계약서 서명을 거부했습니다.\n\n- 근무지: #{근무지}\n\n필요하면 계약 조건을 수정해\n근로계약서를 다시 보내 주세요.",
  vars: [{ name: "직원이름", label: "직원 이름", required: true, example: "유하람" }, { name: "근무지", label: "근무지 점포 이름", required: true, example: "모리커피 연남점" }],
  preview: { title: "근로계약서 서명 거부", sub: "유하람 님이 근로계약서 서명을 거부했습니다. · 근무지: 모리커피 연남점" },
  history: [
    ["10-06 16:20", "이서준", "본문 수정"],
    ["10-01 09:00", "시스템", "기본 문구 배포"],
  ],
});
