// BP 관리자 상세 — 한 번도 로그인하지 않은 전체 점포 계정(hgcs). 하늘색 「아직 로그인하지 않은 계정입니다.」, 대상점포는 「전체 점포 · 지금 N개점」과 안내 두 줄.
import { render } from "./admins.mjs";

export default (ctx) => render(ctx, { title: "BP 관리자 관리 · 상세 · 로그인 전", detail: "hgcs", open: ["admin-open-hgcs"] });
