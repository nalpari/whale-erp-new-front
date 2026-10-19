// 비로그인 화면은 실제 라우트((public)/(site))와 이 디자인 샘플이 같은 구현을 쓴다. 화면 사이 링크만 둘이 달라
// 이 표를 받아 그린다 — 샘플 안에서 누른 링크는 샘플 안에 머문다(2026-10-19).
// 실제 화면이 아직 없는 곳(도입문의·공지사항)도 공개 경로(auth-routes.ts)에 미리 열어 둔 주소로 건다.
export const SITE_ROUTES = {
  home: "/",
  login: "/login",
  signUp: "/signup",
  findAccount: "/find",
  inquiry: "/inquiry",
  notices: "/notices",
  storeOperations: "/store-operations",
  addOnServices: "/add-on-services",
  terms: "/terms",
};

export type GuestRoutes = typeof SITE_ROUTES;

export const SAMPLE_ROUTES: GuestRoutes = {
  home: "/design/guest",
  login: "/design/guest/login",
  signUp: "/design/guest/sign-up",
  findAccount: "/design/guest/find-account",
  inquiry: "/design/guest/inquiry",
  notices: "/design/guest/notices",
  storeOperations: "/design/guest/store-operations",
  addOnServices: "/design/guest/add-on-services",
  // 약관 전문은 샘플을 따로 두지 않고 실제 화면을 연다.
  terms: "/terms",
};
