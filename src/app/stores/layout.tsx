import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "점포 정보 관리 · Whale ERP",
};

// 밝은 테마 · font-erp(ErpRoot) · 헤더는 로그인 후 공통 틀(AdminFrame)이 씌운다. 여기서 ErpRoot 를 또 두면
// 그 안에 min-h-[100dvh] 상자가 하나 더 생겨 화면이 100dvh 를 넘는다(DESIGN.md 「한 화면 규칙」).
export default function StoresLayout({ children }: LayoutProps<"/stores">) {
  return children;
}
