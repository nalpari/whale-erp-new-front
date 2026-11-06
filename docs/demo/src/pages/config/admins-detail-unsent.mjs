// BP 관리자 상세 — 초기 비밀번호 메일이 실패한 사용 계정(hgpay). 이름 아래 빨간 상자, 목록 최근 로그인은 빨간 「초기화 비밀번호 미발송」(앱 admin-detail-panel.tsx).
import { render } from "./admins.mjs";

export default (ctx) => render(ctx, { title: "BP 관리자 관리 · 상세 · 비밀번호 미발송", detail: "hgpay", open: ["admin-open-hgpay"] });
