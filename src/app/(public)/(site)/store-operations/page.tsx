import type { Metadata } from "next";
import { SITE_ROUTES } from "@/app/design/guest/guest-routes";
import { StoreOperations } from "@/app/design/guest/store-operations/store-operations";

export const metadata: Metadata = { title: "매장운영 · Whale ERP" };

// 로그인 전 매장운영 소개. Figma 「로그인전_Sub」 샘플과 같은 구현이고 링크만 실제 경로로 건다(2026-10-19).
export default function StoreOperationsPage() {
  return <StoreOperations routes={SITE_ROUTES} />;
}
