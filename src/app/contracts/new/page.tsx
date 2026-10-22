import { Button, PageBar } from "@/components/common";
import { backHrefOf } from "../contract-list";
import { ContractPermission } from "../contract-permission";
import { ContractForm } from "./contract-form";
import { loadFormData } from "./load-form-data";

// 근로계약서 초안 작성. docs/demo/staff/contracts-new.html 을 공통 컴포넌트로 옮겼다.
export default async function NewContractPage({ searchParams }: PageProps<"/contracts/new">) {
  const back = backHrefOf((await searchParams).back);
  const { stores, labels, signedIn } = await loadFormData();

  return (
    <>
      <PageBar title="근로계약서 초안 작성" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <ContractPermission action="create" fallback={<Notice title="근로계약서를 작성할 권한이 없습니다" back={back} />}>
            <ContractForm stores={stores} labels={labels} signedIn={signedIn} back={back} />
          </ContractPermission>
        </div>
      </div>
    </>
  );
}

function Notice({ title, back }: { title: string; back: string }) {
  return (
    <div className="flex items-center gap-[6px]">
      <p className="flex-1 text-[14px] font-semibold text-erp-ink">{title}</p>
      <Button href={back}>목록</Button>
    </div>
  );
}
