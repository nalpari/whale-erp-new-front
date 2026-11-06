// 점포 상세 — 폐점 점포. 머리 카드에 폐점일, 아래 info 띠, 버튼은 [목록]만(앱 stores/[storeId]/page.tsx · store-detail-actions.tsx 와 같다, 2026-10-30).
// 그리는 것은 detail.mjs 의 render.
import { render } from "./detail.mjs";

export default (ctx) => render(ctx, { code: "ST000012" });
