import type { Metadata } from "next";
import { FinanceManagement } from "./finance-management";

export const metadata: Metadata = { title: "Whale ERP · 재무관리" };

export default function FinanceManagementPage() {
  return <FinanceManagement />;
}
