import type { Metadata } from "next";
import { Franchise } from "@/app/design/guest/franchise/franchise";

export const metadata: Metadata = { title: "프랜차이즈 · Whale ERP" };

// 로그인 전 프랜차이즈 소개. Figma 「로그인전_공유」 프랜차이즈(44:1035) 샘플과 같은 구현이고 링크만 실제 경로로 건다(2026-11-06).
export default function FranchisePage() {
  return <Franchise />;
}
