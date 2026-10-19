import { GuestHome } from "@/app/design/guest/guest-home";
import { SITE_ROUTES } from "@/app/design/guest/guest-routes";

// 로그인 전 홈. Figma 「로그인전_Main」 샘플(design/guest)과 같은 구현이고 링크만 실제 경로로 건다(2026-10-19).
export default function PublicHome() {
  return <GuestHome routes={SITE_ROUTES} />;
}
