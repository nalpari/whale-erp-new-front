// BP 관리자 상세 — 가맹 관리자(moriyn)를 BP 마스터가 본 것. 연결된 가맹마스터만 고치므로 빨간 상자 · 비밀번호 「-」 · [수정] 없음, 표 끝에 연결 가맹마스터 줄.
import { render } from "./admins.mjs";

export default (ctx) => render(ctx, { title: "BP 관리자 관리 · 상세 · 가맹 관리자", detail: "moriyn", open: ["admin-open-moriyn"] });
