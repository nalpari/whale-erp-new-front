// 회원 탈퇴 — 진행 중인 근로계약이 있어 막힌 상태(목업 docs/mockup/mypage/withdraw.html 의 「조건 미충족」).
// [근로계약 확인]이 근로계약 관리로 보내고 [회원 탈퇴]는 막힌다. 내용은 withdraw.mjs 와 같은 site.mjs 의 withdrawBody 다.
import * as ui from "../../ui.mjs";
import { erpHeader, withdrawBody } from "../../site.mjs";

export default ({ A, R }) => {
  const { html } = withdrawBody(R, { blocked: true });
  const body = ui.detailBody(html);
  return { title: "회원 탈퇴 · 조건 미충족", html: ui.erpFrame({ header: erpHeader(A, R), title: "회원 탈퇴", body }) };
};
