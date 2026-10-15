import type { Metadata } from "next";
import { ErpRoot } from "@/components/common";

export const metadata: Metadata = {
  title: "점포 정보 관리 · Whale ERP",
};

// ERP 화면의 밝은 테마 · font-erp 는 ErpRoot 안에만 걸린다(DESIGN.md). 빠지면 시스템 글꼴과 OS 다크 모드로 떨어진다.
export default function StoresLayout({ children }: LayoutProps<"/stores">) {
  return <ErpRoot className="min-h-[100dvh]">{children}</ErpRoot>;
}
