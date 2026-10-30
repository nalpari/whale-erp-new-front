// 알림 템플릿 수정 · 메일. 목업 docs/mockup/notify/templates-edit.html 의 「근로계약 거부 · 메일」 예.
// 문구는 api 기본 문구(20261030093710 정리 뒤 20261030120100 — 거부 사유 줄을 뺌, WHALEERP-635).
import { templateEdit } from "../../template-edit.mjs";

export default templateEdit({
  base: true,
  templateCode: "EMAIL_CONTRACT_REJECTED",
  kind: "mail",
  type: "근로계약 거부",
  channel: "메일",
  to: "소속 범위 사업자 관리자",
  title: "[WHALE ERP] 근로계약서 서명 거부",
  body: "#{직원이름} 님이 근로계약서 서명을 거부했습니다.\n\n- 근무지: #{근무지}\n\n필요하면 계약 조건을 수정해\n근로계약서를 다시 보내 주세요.",
  vars: [{ name: "직원이름", label: "직원 이름", required: true, example: "유하람" }, { name: "근무지", label: "근무지 점포 이름", required: true, example: "모리커피 연남점" }, { name: "링크", label: "바로가기 링크", required: true, buttonLink: true, example: "https://…" }],
  preview: {
    title: "[WHALE ERP] 근로계약서 서명 거부",
    body: "유하람 님이 근로계약서 서명을 거부했습니다.\n\n- 근무지: 모리커피 연남점\n\n필요하면 계약 조건을 수정해\n근로계약서를 다시 보내 주세요.",
    button: "계약 열기",
  },
  history: [
    ["10-06 16:20", "이서준", "본문 마지막 줄 추가"],
    ["10-01 09:00", "시스템", "기본 문구 배포"],
  ],
});
