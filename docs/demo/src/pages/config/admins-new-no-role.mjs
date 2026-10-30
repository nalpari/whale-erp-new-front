// BP 관리자 등록 — 고른 계정 역할(가맹마스터)에 권한명이 하나도 없을 때. 권한명 칸 아래 빨간 한 줄과 [이동](권한 그룹 관리), [저장]은 막힘
// (앱 admin-form-panel.tsx 와 같다, 2026-10-28). 그리는 것은 admins.mjs 의 render.
import { render } from "./admins.mjs";

export default (ctx) => render(ctx, { title: "BP 관리자 관리 · 등록 · 권한명 없음", newOpts: { role: "가맹마스터", noRoleGroup: true }, open: ["admin-new-open"] });
