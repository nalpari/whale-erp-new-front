import { notFound } from "next/navigation";
import { Button, PageBar } from "@/components/common";
import { ApiError, authHeaders, request } from "@/lib/api";
import { ContractForm } from "../../new/contract-form";
import { fromDetail, type ContractDetail } from "../../new/contract-form-model";
import { loadFormData } from "../../new/load-form-data";
import { ContractPermission } from "../../contract-permission";
import { DeleteDraftButton } from "../delete-button";

// 임시저장한 근로계약서 이어 쓰기. 작성 화면과 같은 폼을 불러온 값으로 연다. 임시저장이 아니면 열지 않는다.
// 임시저장 삭제도 여기서 한다(폼 위쪽 버튼 줄, 취소와 임시저장 사이).
// 직원이 수정을 요청한 계약(수정 요청)도 여기서 고친다 — 임시저장 · 삭제 · 종이 계약 없이 「수정 저장」만(WHALEERP-125 · 126).
export default async function EditContractPage({ params }: PageProps<"/contracts/[contractId]/edit">) {
  const { contractId: raw } = await params;
  const contractId = Number(raw);
  if (!Number.isInteger(contractId) || contractId < 1) notFound();

  const { stores, labels, signedIn } = await loadFormData();
  let detail: ContractDetail | null = null;
  if (signedIn) {
    try {
      detail = await request<ContractDetail>(`/contracts/${contractId}`, { headers: await authHeaders() });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) notFound();
      if (!(e instanceof ApiError && e.status === 401)) throw e;
    }
  }

  return (
    <>
      <PageBar title={detail?.status === "CORRECTION_REQUESTED" ? "근로계약서 수정" : "근로계약서 이어 쓰기"} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          {!signedIn || !detail ? (
            <Notice title="로그인이 필요합니다" />
          ) : detail.status === "CORRECTION_REQUESTED" ? (
            <ContractPermission action="update" fallback={<Notice title="근로계약서를 고칠 권한이 없습니다" contractId={contractId} />}>
              <ContractForm stores={stores} labels={labels} signedIn contractId={contractId} initial={fromDetail(detail)} correction />
            </ContractPermission>
          ) : detail.status !== "DRAFT" ? (
            <Notice title="임시저장 · 수정 요청 근로계약서만 고칠 수 있습니다" />
          ) : (
            // 임시저장 이어 쓰기는 작성의 연장이라 작성 또는 수정 권한으로 연다. 삭제 버튼은 삭제 권한이 있을 때만
            <ContractPermission action={["create", "update"]} fallback={<Notice title="근로계약서를 이어 쓸 권한이 없습니다" contractId={contractId} />}>
              <ContractForm
                stores={stores}
                labels={labels}
                signedIn
                contractId={contractId}
                initial={fromDetail(detail)}
                deleteButton={
                  <ContractPermission action="delete">
                    <DeleteDraftButton contractId={contractId} />
                  </ContractPermission>
                }
              />
            </ContractPermission>
          )}
        </div>
      </div>
    </>
  );
}

// 권한이 없어 막혔으면 상세로 보낸다 — 목록의 임시저장 행은 이 화면으로 바로 오므로, 조회 권한만 있어도 내용은 상세에서 본다
function Notice({ title, contractId }: { title: string; contractId?: number }) {
  return (
    <div className="flex items-center gap-[6px]">
      <p className="flex-1 text-[14px] font-semibold text-erp-ink">{title}</p>
      {contractId !== undefined && (
        <Button variant="soft" href={`/contracts/${contractId}`}>
          상세
        </Button>
      )}
      <Button href="/contracts">목록</Button>
    </div>
  );
}
