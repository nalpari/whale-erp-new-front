import { PageBar } from "@/components/common";
import { ContractForm } from "./contract-form";
import { loadFormData } from "./load-form-data";

// 근로계약서 초안 작성. docs/demo/staff/contracts-new.html 을 공통 컴포넌트로 옮겼다.
export default async function NewContractPage() {
  const { stores, labels, signedIn } = await loadFormData();

  return (
    <>
      <PageBar title="근로계약서 초안 작성" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <ContractForm stores={stores} labels={labels} signedIn={signedIn} />
        </div>
      </div>
    </>
  );
}
