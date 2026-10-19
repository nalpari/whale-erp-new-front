import { notFound } from "next/navigation";
import { Button, PageBar } from "@/components/common";
import { ApiError, authHeaders, getEnum, request } from "@/lib/api";
import type { ContractDetail } from "../../new/contract-form-model";
import { WorkerForm } from "./worker-form";
import { isWorkerEditable, workerOf } from "./worker-model";

// 날인 전 근로자 정보 수정 화면(WHALEERP-125 · 126). 발송 대기 · 서명 대기 · 수정 요청 계약만 연다.
// 공통 틀(AdminFrame)이 헤더를 그리므로 제목 줄(PageBar)부터 그린다.
export default async function ContractWorkerPage({ params }: PageProps<"/contracts/[contractId]/worker">) {
  const { contractId: raw } = await params;
  const contractId = Number(raw);
  if (!Number.isInteger(contractId) || contractId < 1) notFound();

  const [gender, contractStatus, headers] = await Promise.all([getEnum("Gender"), getEnum("ContractStatus"), authHeaders()]);
  let c: ContractDetail | null = null;
  if (headers.Authorization) {
    try {
      c = await request<ContractDetail>(`/contracts/${contractId}`, { headers });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) notFound();
      if (!(e instanceof ApiError && e.status === 401)) throw e;
    }
  }

  return (
    <>
      <PageBar title="근로계약 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          {!c ? (
            <Notice title="로그인이 필요합니다" />
          ) : !isWorkerEditable(c.status) ? (
            <Notice title="발송 대기 · 서명 대기 · 수정 요청 근로계약만 근로자 정보를 고칠 수 있습니다" contractId={contractId} />
          ) : (
            <WorkerForm contractId={contractId} status={c.status ?? ""} initial={workerOf(c)} labels={{ gender, contractStatus }} />
          )}
        </div>
      </div>
    </>
  );
}

function Notice({ title, contractId }: { title: string; contractId?: number }) {
  return (
    <div className="flex items-center gap-[6px]">
      <p className="flex-1 text-[14px] font-semibold text-erp-ink">{title}</p>
      <Button href={contractId ? `/contracts/${contractId}` : "/contracts"}>{contractId ? "상세" : "목록"}</Button>
    </div>
  );
}
