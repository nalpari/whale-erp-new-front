// 플랫폼 메뉴 관리. 목업 docs/mockup/system/menus.html 의 기본 권한(등록·수정)으로 그린다 — 신규 메뉴·상세 수정·저장·위치 옮기기가 있다.
// 화면 본문은 menus-master.mjs 와 같고 헤더만 플랫폼 관리자 기준이다.
import { render } from "./menus-master.mjs";

export default (ctx) => render(ctx, { master: false });
