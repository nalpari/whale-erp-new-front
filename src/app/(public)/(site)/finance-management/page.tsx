import type { Metadata } from "next";
import { FinanceManagement } from "@/app/design/guest/finance-management/finance-management";

export const metadata: Metadata = { title: "재무관리 · Whale ERP" };

// 로그인 전 재무관리 소개. Figma 「로그인전_공유」 재무관리(44:1412) 샘플과 같은 구현이고 링크만 실제 경로로 건다(2026-11-06).
export default function FinanceManagementPage() {
  return <FinanceManagement />;
}
