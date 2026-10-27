import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "출·퇴근 현황 조회 · Whale ERP",
};

// ErpRoot(밝은 테마 · font-erp)는 공통 틀(AdminFrame)이 이미 씌운다. 여기서는 탭 제목만 둔다.
export default function AttendanceRecordsLayout({ children }: LayoutProps<"/attendance-records">) {
  return children;
}
