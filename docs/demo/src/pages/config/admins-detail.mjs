// BP 관리자 상세 — 목록 위 상세 패널을 열어 둔 것(hghr 이서아 · BP관리자 · 일부 점포 6개라 표가 스크롤한다).
// 상세는 따로 화면이 없다(앱과 같다, 2026-10-30 「front대로」 재영). 그리는 것은 admins.mjs 의 render.
import { render } from "./admins.mjs";

export default (ctx) => render(ctx, { title: "BP 관리자 관리 · 상세", open: ["admin-open-hghr"] });
