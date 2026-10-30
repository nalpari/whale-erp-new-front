// BP 권한 그룹 관리 — 대체 권한 그룹이 없어 지울 수 없는 경우. BP 관리자 그룹이 BA000004 하나뿐이고 연결 사용자가 있어
// 삭제 확인창에 빨간 상자 두 줄이 서고 [삭제]가 막힌다(앱 role-delete-dialog.tsx noCandidateText).
import { render, GROUPS } from "./roles.mjs";

export default (ctx) =>
  render(ctx, {
    title: "BP 권한 그룹 관리 · 삭제 불가(대체 없음)",
    groups: GROUPS.filter((g) => g[0] === "FA" || g[1] === "BA000004" || g[11]),
    open: ["role-pick-BA000004", "role-delete-BA000004"],
  });
