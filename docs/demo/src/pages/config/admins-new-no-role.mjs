// BP 관리자 등록 — 고른 계정 역할(가맹 마스터)에 권한명이 하나도 없을 때. 권한명 칸 아래 빨간 한 줄과 [이동](권한 그룹 관리)
// (앱 admin-form-panel.tsx 와 같다, 2026-10-28). 그리는 것은 admins-new.mjs 의 render.
import { render } from "./admins-new.mjs";

export default (ctx) => render(ctx, { noRoleGroup: true });
