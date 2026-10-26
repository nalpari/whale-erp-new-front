import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "플랫폼 휴일 관리 · Whale ERP",
};

// ErpRoot(밝은 테마 · font-erp)는 공통 틀(AdminFrame)이 이미 씌운다. 여기서는 탭 제목만 둔다.
export default function PublicHolidaysLayout({ children }: LayoutProps<"/public-holidays">) {
  return children;
}
