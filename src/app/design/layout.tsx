import type { Metadata } from "next";
import Link from "next/link";
import { ErpRoot } from "@/components/common";

export const metadata: Metadata = {
  title: "디자인 샘플 · Whale ERP",
  robots: { index: false },
};

export default function DesignLayout({ children }: LayoutProps<"/design">) {
  return (
    <ErpRoot className="min-h-[100dvh]">
      {children}
      <nav className="fixed right-4 bottom-4 z-10 flex gap-1 rounded-[4px] bg-erp-ink p-1 text-[13px] text-white shadow-lg">
        <Link href="/design" className="rounded-[2px] px-3 py-1.5 hover:bg-white/15">
          유닛
        </Link>
        <Link href="/design/full" className="rounded-[2px] px-3 py-1.5 hover:bg-white/15">
          전체 페이지
        </Link>
      </nav>
    </ErpRoot>
  );
}
