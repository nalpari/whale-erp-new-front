import type { Metadata } from "next";
import { PageBar } from "@/components/common";
import { ExcelDownloadView } from "./excel-download-view";

export const metadata: Metadata = { title: "엑셀 내려받기 · Whale ERP" };

// 1만 건 이상 엑셀 예약 생성 완료 메일의 링크(api EMAIL_EXCEL_READY → {ADMIN_WEB_URL}/excel-downloads/{id}).
// 메뉴가 없는 화면이라 로그인한 관리자면 어느 탭에서나 열리고(menus.ts MENULESS_PATHS), 요청한 본인인지는 api 가 본다.
// 로그인 없이 오면 proxy 가 /login?next= 로 보내 로그인 뒤 이 주소로 돌아온다(auth-routes.ts returnPathOf).
export default async function ExcelDownloadPage({ params }: PageProps<"/excel-downloads/[id]">) {
  const { id } = await params;
  return (
    <>
      <PageBar title="엑셀 내려받기" />
      <div className="flex min-h-0 flex-1 p-[24px]">
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          {/* int4 양의 정수만 — 아니면 api 를 부르지 않고 없는 파일로 본다 */}
          <ExcelDownloadView id={/^\d{1,9}$/.test(id) && Number(id) >= 1 ? Number(id) : null} />
        </main>
      </div>
    </>
  );
}
