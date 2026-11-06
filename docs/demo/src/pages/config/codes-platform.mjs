// BP 공통코드 관리 — 플랫폼 계정으로 본 것. 늘 조회만이라 회색 안내 한 줄, [추가] · [저장] · 이동 · 삭제 열이 없고
// 코드명은 글자, 사용여부는 배지다(앱 bp-code-item-panel.tsx, 2026-10-30 재영). 데모 헤더는 BP 마스터 것 그대로다.
import { render } from "./codes.mjs";

export default (ctx) => render(ctx, { title: "BP 공통코드 관리 · 플랫폼 계정", platform: true });
