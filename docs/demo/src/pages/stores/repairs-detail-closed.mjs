// 수리 이력 상세 · 폐점 점포의 것 — 조회만 된다(수리 이력 정책서 PL-1)
import { render } from "./repairs-detail.mjs";

export default (ctx) => render(ctx, { sample: "closed" });
