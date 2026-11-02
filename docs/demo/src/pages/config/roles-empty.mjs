// BP 권한 그룹 관리 — 권한 그룹이 하나도 없는 BP. 오른쪽 칸 문구가 바뀌고 [등록] 안내가 붙는다(앱 bp-role-groups/role-side.tsx).
import { render } from "./roles.mjs";

export default (ctx) => render(ctx, { title: "BP 권한 그룹 관리 · 목록 없음", groups: [] });
