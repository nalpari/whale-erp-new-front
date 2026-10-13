import { PageBar } from "@/components/common";

// 플랫폼 BP 마스터 계정 목록. 내용은 그 화면 작업에서 채운다.
export default function BpMasterAccountsPage() {
  return (
    <>
      <PageBar title="BP 마스터 계정 목록" />
      <div className="flex min-h-0 flex-1 p-[24px]">
        <main className="flex-1 rounded-[4px] border border-erp-panel-line bg-white p-[25px]" />
      </div>
    </>
  );
}
