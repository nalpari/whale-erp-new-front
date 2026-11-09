// 회원 탈퇴 — 퇴근 기록이 없는 출근이 있는 점포가 있어 막힌 상태(목업 docs/mockup/mypage/withdraw.html 의 「조건 미충족」).
// 「폐점할 수 없는 점포」 선택 상자로 막힌 점포의 사유를 보고 [회원 탈퇴]는 막힌다(2026-11-09). 내용은 withdraw.mjs 와 같은 site.mjs 의 withdrawBody 다.
import * as ui from "../../ui.mjs";
import { erpHeader, withdrawBody } from "../../site.mjs";

export default ({ A, R }) => {
  const { html } = withdrawBody(R, { blocked: true });
  const body = ui.detailBody(html);
  return { title: "회원 탈퇴 · 조건 미충족", html: ui.erpFrame({ header: erpHeader(A, R), title: "회원 탈퇴", body }) };
};
