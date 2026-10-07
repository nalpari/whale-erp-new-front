// 알림 템플릿 수정 · 앱 푸시. 목업 docs/mockup/notify/templates-edit.html 의 「근로계약서 발송 · 앱 푸시」 예.
// 같은 문구가 잠금 화면 푸시와 직원 근무 앱 알림함 한 줄로 쓰인다. 글자 수는 NOTIFY-4 미정이라 제목 40·본문 100 가정.
import { templateEdit } from "../../template-edit.mjs";

export default templateEdit({
  templateCode: "PUSH_CONTRACT_SENT",
  kind: "push",
  type: "근로계약서 발송",
  channel: "앱 푸시",
  to: "직원",
  count: true,
  title: "근로계약서가 도착했습니다",
  body: "#{근무지} 근로계약서를 확인하고 날인해 주세요. 날인 기한은 #{날인기한}까지입니다.",
  vars: ["근무지", "날인기한"],
  preview: {
    title: "근로계약서가 도착했습니다",
    body: "모리커피 연남점 근로계약서를 확인하고 날인해 주세요. 날인 기한은 10-30까지입니다.",
    sub: "모리커피 연남점 · 10-07 09:41",
  },
  history: [
    ["10-07 09:41", "김하린", "본문 수정"],
    ["10-01 09:00", "시스템", "기본 문구 배포"],
  ],
});
