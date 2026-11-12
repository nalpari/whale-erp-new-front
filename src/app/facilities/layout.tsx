import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "시설물 및 장비 관리 · Whale ERP",
};

// ErpRoot(밝은 테마 · font-erp)와 헤더는 로그인 후 공통 틀(AdminFrame)이 이미 씌운다. 여기서는 탭 제목만 둔다.
export default function FacilitiesLayout({ children }: LayoutProps<"/facilities">) {
  return children;
}
