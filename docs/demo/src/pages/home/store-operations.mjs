// 매장운영 소개. 본문은 앱(src/app/design/guest)이 그린 HTML 을 그대로 쓴다 — 앱 화면을 고치면 dev 서버를 띄우고
// node docs/demo/snapshot-guest.mjs 로 src/snapshots/store-operations.html 을 다시 떠 온다(2026-11-10). 움직이는 부분은 첫 상태로 멈춰 보인다.
import * as g from "../../guest.mjs";

export default ({ A, R }) => ({
  title: "매장운영",
  head: g.head(A),
  html: g.page(A, R, { current: "home/store-operations.html", main: g.snapshot(A, R, "store-operations"), flush: true }),
});
