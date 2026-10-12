import { notFound } from "next/navigation";
import { AlarmLink, Button, GlobalHeader, PageBar, ServiceLinks, StoreSelect, UserPop } from "@/components/common";
import { ApiError, request } from "@/lib/api";
import { MENUS, STORES, USER_ITEMS } from "../../../design/sample";
import { ContractForm } from "../../new/contract-form";
import { fromDetail, type ContractDetail } from "../../new/contract-form-model";
import { loadFormData } from "../../new/load-form-data";

// 임시저장한 근로계약서 이어 쓰기. 작성 화면과 같은 폼을 불러온 값으로 연다. 임시저장이 아니면 열지 않는다.
export default async function EditContractPage({ params }: PageProps<"/contracts/[contractId]/edit">) {
  const { contractId: raw } = await params;
  const contractId = Number(raw);
  if (!Number.isInteger(contractId) || contractId < 1) notFound();

  const { stores, labels, signedIn, token } = await loadFormData();
  let detail: ContractDetail | null = null;
  if (token) {
    try {
      detail = await request<ContractDetail>(`/contracts/${contractId}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) notFound();
      if (!(e instanceof ApiError && e.status === 401)) throw e;
    }
  }

  return (
    <div className="h-[100dvh] overflow-x-auto overflow-y-hidden bg-erp-thead-bg">
      <div className="flex h-full min-w-[1720px] flex-col">
        <GlobalHeader
          menus={MENUS}
          right={
            <>
              <StoreSelect options={STORES} />
              <ServiceLinks />
              <AlarmLink href="#" />
              <UserPop name="김지영 (admin)" items={USER_ITEMS} />
            </>
          }
        />
        <PageBar title="근로계약서 이어 쓰기" />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
          <div className="rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
            {!signedIn || !detail ? (
              <Notice title="로그인이 필요합니다" />
            ) : detail.status !== "DRAFT" ? (
              <Notice title="임시저장한 근로계약서만 이어 쓸 수 있습니다" />
            ) : (
              <ContractForm stores={stores} labels={labels} signedIn contractId={contractId} initial={fromDetail(detail)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Notice({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-[6px]">
      <p className="flex-1 text-[14px] font-semibold text-erp-ink">{title}</p>
      <Button href="/contracts">목록</Button>
    </div>
  );
}
