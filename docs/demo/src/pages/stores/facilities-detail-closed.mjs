// 시설물 및 장비 상세 · 폐점 점포의 것 — 조회만 된다(정책서 PL-1)
import { render } from "./facilities-detail.mjs";

export default (ctx) => render(ctx, { sample: "closed" });
