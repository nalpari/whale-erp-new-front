// 점포 상세 — 소속 BP 가 탈퇴인 점포를 플랫폼 계정으로 본 것. 머리 카드 위 빨간 띠 · 헤더 범위 선택기 옆 상태 배지,
// 상태 변경 · 삭제 · 수정은 막힌다(앱 stores/[storeId]/page.tsx · admin-header.tsx 와 같다, 2026-10-28). 그리는 것은 detail.mjs 의 render.
import { render } from "./detail.mjs";

export default (ctx) => render(ctx, { bpStatus: "탈퇴" });
