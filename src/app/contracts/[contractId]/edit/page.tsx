import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Button, PageBar } from "@/components/common";
import { ApiError, authHeaders, bpHref, deniedMessageOf, request } from "@/lib/api";
import { ContractForm } from "../../new/contract-form";
import { fromDetail, type ContractDetail } from "../../new/contract-form-model";
import { loadFormData } from "../../new/load-form-data";
import { backHrefOf, withBack } from "../../contract-list";
import { ContractPermission } from "../../contract-permission";
import { DeleteDraftButton } from "../delete-button";

// 임시저장한 근로계약서 이어 쓰기. 작성 화면과 같은 폼을 불러온 값으로 연다. 임시저장이 아니면 열지 않는다.
// 임시저장 삭제도 여기서 한다(폼 위쪽 버튼 줄, 취소와 임시저장 사이).
// 직원이 수정을 요청한 계약(수정 요청)도 여기서 고친다 — 임시저장 · 삭제 · 종이 계약 없이 「수정 저장」만(WHALEERP-125 · 126).
export default async function EditContractPage({ params, searchParams }: PageProps<"/contracts/[contractId]/edit">) {
  const { contractId: raw } = await params;
  const back = backHrefOf((await searchParams).back);
  const contractId = Number(raw);
  if (!Number.isInteger(contractId) || contractId < 1) notFound();

  const { stores, labels, signedIn, denied } = await loadFormData();
  // 근로계약 관리 조회 권한이 없거나 사용 중이 아닌 계정(403) · BP 를 고르지 않은 플랫폼 계정(400)이면 api 문장을 그대로 보인다(목록과 같다)
  let detail: ContractDetail | null = null;
  let notice = "로그인이 필요합니다.";
  if (signedIn) {
    try {
      detail = await request<ContractDetail>(`/contracts/${contractId}`, { headers: await authHeaders() });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) notFound();
      // api 의 거절(BP 를 고르지 않음 400 · 권한 · 다른 BP 403 — deniedMessageOf)은 그 문장을 보인다. 404(없는 계약 · 없는 BP)는 위에서 찾을 수 없음 화면이다
      const denied = deniedMessageOf(e);
      if (!(e instanceof ApiError && e.status === 401) && denied === null) throw e;
      if (denied !== null) notice = denied;
    }
  }
  // 재계약(WHALEERP-156)의 임시저장 · 수정 요청이면 직전 계약 시작일 — 새 계약 시작일은 그 다음 날부터라 화면이 먼저 막는다. 읽지 못하면
  // 비워 두고 api 의 400 에 맡긴다
  const previousStartDate =
    (detail?.status === "DRAFT" || detail?.status === "CORRECTION_REQUESTED") && detail.previousContractId
      ? await request<ContractDetail>(`/contracts/${detail.previousContractId}`, { headers: await authHeaders() }).then(
          (p) => p.startDate ?? undefined,
          () => undefined,
        )
      : undefined;

  return (
    <>
      <PageBar title={detail?.status === "CORRECTION_REQUESTED" ? "근로계약서 수정" : "근로계약서 이어 쓰기"} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          {!signedIn || !detail ? (
            <Notice title={notice} back={back} />
          ) : detail.status === "CORRECTION_REQUESTED" ? (
            <ContractPermission action="update" fallback={<Notice title="근로계약서를 고칠 권한이 없습니다." contractId={contractId} back={back} />}>
              {/* 재계약 수정 요청도 번호 · 시작일을 임시저장 이어 쓰기와 같이 막는다(api 가 400 으로 다시 본다, api #157 리뷰) */}
              {/* 근무지 선택지를 api 가 거절했으면 그 문장(loadFormData) */}
              {denied !== null ? (
                <Notice title={denied} contractId={contractId} back={back} />
              ) : (
                <ContractForm
                  stores={stores}
                  labels={labels}
                  signedIn
                  contractId={contractId}
                  initial={fromDetail(detail)}
                  correction
                  previousContractId={detail.previousContractId ?? undefined}
                  previousStartDate={previousStartDate}
                  back={back}
                />
              )}
            </ContractPermission>
          ) : detail.status !== "DRAFT" ? (
            <Notice title="임시저장 · 수정 요청 근로계약서만 고칠 수 있습니다." back={back} />
          ) : (
            // 임시저장 이어 쓰기는 작성의 연장이라 작성 권한으로 연다(api 도 저장에 작성 권한을 본다). 삭제 버튼은 삭제 권한이 있을 때만 —
            // 이어 쓸 수 없어도 삭제 권한이 있으면 안내 줄에서 지울 수 있다
            <ContractPermission
              action="create"
              fallback={
                <Notice title="근로계약서를 이어 쓸 권한이 없습니다." contractId={contractId} back={back}>
                  <ContractPermission action="delete">
                    <DeleteDraftButton contractId={contractId} back={back} />
                  </ContractPermission>
                </Notice>
              }
            >
              {/* 근무지 선택지를 api 가 거절했으면 그 문장(loadFormData) — 삭제는 그대로 둔다 */}
              {denied !== null ? (
                <Notice title={denied} contractId={contractId} back={back}>
                  <ContractPermission action="delete">
                    <DeleteDraftButton contractId={contractId} back={back} />
                  </ContractPermission>
                </Notice>
              ) : (
                <ContractForm
                  stores={stores}
                  labels={labels}
                  signedIn
                  contractId={contractId}
                  initial={fromDetail(detail)}
                  // 재계약 임시저장(WHALEERP-156)은 근무지 · 번호를 바꾸지 않는다(api 가 400 으로 다시 본다)
                  previousContractId={detail.previousContractId ?? undefined}
                  previousStartDate={previousStartDate}
                  back={back}
                  deleteButton={
                    <ContractPermission action="delete">
                      <DeleteDraftButton contractId={contractId} back={back} />
                    </ContractPermission>
                  }
                />
              )}
            </ContractPermission>
          )}
        </div>
      </div>
    </>
  );
}

// 권한이 없어 막혔으면 상세로 보낸다 — 목록의 임시저장 행은 이 화면으로 바로 오므로, 조회 권한만 있어도 내용은 상세에서 본다.
// 그래도 할 수 있는 동작(임시저장 삭제)은 children 으로 받아 이동 버튼 뒤에 둔다. 이동 주소에는 탭 BP 를 붙인다(bpHref)
async function Notice({ title, contractId, back, children }: { title: string; contractId?: number; back: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-[6px]">
      <p className="flex-1 text-[14px] font-semibold text-erp-ink">{title}</p>
      {contractId !== undefined && (
        <Button variant="soft" href={await bpHref(withBack(`/contracts/${contractId}`, back))}>
          상세
        </Button>
      )}
      <Button href={await bpHref(back)}>목록</Button>
      {children}
    </div>
  );
}
