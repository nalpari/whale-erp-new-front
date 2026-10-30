// BP 권한 그룹 관리 — 플랫폼 계정으로 본 것(BA000004 상세). 늘 조회만이라 [등록] · [삭제] · [저장]이 없고 상세 위에 회색 안내 한 줄,
// [메뉴설정] 팝업은 칸이 막히고 [닫기]만이다(앱 bp-role-groups/role-side.tsx, 2026-10-30 재영). 데모 헤더는 BP 마스터 것 그대로다.
import { render } from "./roles.mjs";

export default (ctx) => render(ctx, { title: "BP 권한 그룹 관리 · 플랫폼 계정", platform: true, open: ["role-pick-BA000004"] });
