// BP 관리자 수정 — 가맹 마스터(morinam01)를 미사용으로 고른 것. 계정상태 아래 회색 띠, [저장]은 함께 멈추는 가맹 관리자 확인창을 먼저 연다(앱 admin-form-panel.tsx).
import { render } from "./admins.mjs";

export default (ctx) =>
  render(ctx, { title: "BP 관리자 관리 · 수정 · 가맹 마스터 미사용", detail: "morinam01", edit: { status: "미사용" }, open: ["admin-open-morinam01", "admin-edit-open"] });
