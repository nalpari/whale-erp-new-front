import type { Metadata } from "next";
import { AddOnServices } from "@/app/design/guest/add-on-services/add-on-services";
import { SITE_ROUTES } from "@/app/design/guest/guest-routes";

export const metadata: Metadata = { title: "부가서비스 · Whale ERP" };

// 로그인 전 부가서비스 소개. Figma 「로그인전_부가서비스」 샘플과 같은 구현이고 링크만 실제 경로로 건다(2026-10-19).
export default function AddOnServicesPage() {
  return <AddOnServices routes={SITE_ROUTES} />;
}
