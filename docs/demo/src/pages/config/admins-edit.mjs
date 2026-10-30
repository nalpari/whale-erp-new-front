// BP 관리자 수정 — 상세 위에 수정 패널을 겹쳐 연 것(hghr). 계정상태를 미사용으로 고르면 [취소][저장] 위에 안내가 선다.
// 수정은 따로 화면이 없다(앱과 같다, 2026-10-30 「front대로」 재영). 그리는 것은 admins.mjs 의 render.
import { render } from "./admins.mjs";

export default (ctx) => render(ctx, { title: "BP 관리자 관리 · 수정", open: ["admin-open-hghr", "admin-edit-open"] });
