import type { Metadata } from "next";
import { ErpRoot } from "@/components/common";

export const metadata: Metadata = {
  title: "근로계약 관리 · Whale ERP",
};

export default function ContractsLayout({ children }: LayoutProps<"/contracts">) {
  return <ErpRoot className="min-h-[100dvh]">{children}</ErpRoot>;
}
