// 점포 목록 — 목록에서 고른 점포 2곳을 찾지 못해(지워졌거나 볼 수 없게 됨) 조건에서 뺀 것. 목록 위 info 띠(앱 page.tsx 와 같다).
// 그리는 것은 index.mjs 의 render.
import { render } from "./index.mjs";

export default (ctx) => render(ctx, { missing: 2 });
