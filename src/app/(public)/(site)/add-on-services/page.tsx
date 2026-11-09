import type { Metadata } from "next";
import { AddOnServices } from "@/app/design/guest/add-on-services/add-on-services";

export const metadata: Metadata = { title: "부가서비스 · Whale ERP" };

// 로그인 전 부가서비스 소개. Figma 「로그인전_부가서비스」 샘플과 같은 구현이다(2026-10-19, 시안 갱신 2026-11-06).
export default function AddOnServicesPage() {
  return <AddOnServices />;
}
