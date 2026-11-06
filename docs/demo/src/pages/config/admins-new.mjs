// BP 관리자 등록 — 목록 위 등록 패널을 연 처음 상태. 계정 역할 「선택」이라 권한명 · 점포 찾기가 막혀 있고, 역할을 고르면 풀린다.
// 등록은 따로 화면이 없다(앱과 같다, 2026-10-30 「front대로」 재영). 그리는 것은 admins.mjs 의 render.
import { render } from "./admins.mjs";

export default (ctx) => render(ctx, { title: "BP 관리자 관리 · 등록", open: ["admin-new-open"] });
