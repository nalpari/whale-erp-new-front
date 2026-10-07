// 알림 템플릿 수정 · 알림톡. 목업 docs/mockup/notify/templates-edit.html 의 「가입 초대 · 알림톡」 예.
// 알림톡도 화면에서 본문을 고친다(NOTIFY-8, 2026-10-07 재영). 제목은 없고, 카카오 템플릿 코드와 변수 목록은 고정.
import { templateEdit } from "../../template-edit.mjs";

export default templateEdit({
  base: true,
  templateCode: "TALK_STAFF_INVITATION",
  kind: "talk",
  type: "가입 초대",
  channel: "알림톡",
  to: "초대받은 직원",
  kakaoCode: "WHALE_INVITE_01",
  notice: "카카오 검수를 받은 문구와 한 글자라도 다르면 발송되지 않습니다. 검수를 받은 뒤 고쳐 주세요.",
  title: "",
  body: "#{근무지}에서 근로계약서를 보내려고 합니다.\n아래 링크로 WHALE ERP 직원 근무 앱에 가입해 주세요.\n링크는 30일 동안 쓸 수 있습니다.",
  vars: [{ name: "근무지", label: "근무지", required: true, example: "모리커피 연남점" }, { name: "초대링크", label: "초대 링크", required: false, example: "https://…" }],
  preview: {
    body: "모리커피 연남점에서 근로계약서를 보내려고 합니다.\n아래 링크로 WHALE ERP 직원 근무 앱에 가입해 주세요.\n링크는 30일 동안 쓸 수 있습니다.",
    button: "가입하기",
  },
  history: [
    ["09-30 14:05", "이서준", "본문 수정"],
    ["09-01 09:00", "시스템", "기본 문구 배포"],
  ],
});
