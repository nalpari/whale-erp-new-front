// 회원 탈퇴. 목업 docs/mockup/mypage/withdraw.html 의 기본 상태(조건 모두 충족)를 BP 마스터로 본 것.
// 화면에 들어오면 비밀번호 확인 창이 먼저 뜬다. 맞으면 닫히고 탈퇴 화면을 쓴다.
// 내용은 site.mjs 의 withdrawBody 로 옮겨 GNB 슬라이드 패널(site.mjs withdrawPanel)과 함께 쓴다(2026-10-06 피드백).
// 패널에서는 비밀번호 확인 창을 페이지 진입 때가 아니라 MY PAGE 의 "회원 탈퇴"를 누른 그 클릭에서 연다.
import * as ui from "../../ui.mjs";
import { erpHeader, withdrawBody } from "../../site.mjs";

export default ({ A, R }) => {
  const { html } = withdrawBody(R);
  const body = ui.detailBody(html);
  return { title: "회원 탈퇴", html: ui.erpFrame({ header: erpHeader(A, R), title: "회원 탈퇴", body }) };
};
