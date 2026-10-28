// 점포 수정 — 소속 BP 가 미사용인 점포를 플랫폼 계정으로 본 것. 제목 줄 위 빨간 띠 · 헤더 상태 배지, 저장은 막힌다
// (앱 store-form-view.tsx · admin-header.tsx 와 같다, 2026-10-28). 그리는 것은 edit.mjs 의 render.
import { render } from "./edit.mjs";

export default (ctx) => render(ctx, { bpStatus: "미사용" });
