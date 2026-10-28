// 점포 등록 — 탈퇴한 BP 를 플랫폼 계정으로 고르고 들어온 것. 제목 줄 위 빨간 띠 · 헤더 상태 배지, 저장은 막힌다
// (앱 store-form-view.tsx · admin-header.tsx 와 같다, 2026-10-28). 그리는 것은 new.mjs 의 render.
import { render } from "./new.mjs";

export default (ctx) => render(ctx, { bpStatus: "탈퇴" });
