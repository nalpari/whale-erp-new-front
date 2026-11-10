// 시설물 및 장비 상세 · 수리 이력이 있어 [삭제]가 막힌 견본(정책서 PL-4)
import { render } from "./facilities-detail.mjs";

export default (ctx) => render(ctx, { sample: "history" });
