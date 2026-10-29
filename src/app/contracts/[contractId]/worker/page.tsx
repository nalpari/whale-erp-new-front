import { notFound } from "next/navigation";
import { Button, PageBar } from "@/components/common";
import { ApiError, authHeaders, bpHref, deniedMessageOf, getEnum, request } from "@/lib/api";
import type { ContractDetail } from "../../new/contract-form-model";
import { backHrefOf, withBack } from "../../contract-list";
import { ContractPermission } from "../../contract-permission";
import { WorkerForm } from "./worker-form";
import { isWorkerEditable, workerOf } from "./worker-model";

// 날인 전 근로자 정보 수정 화면(WHALEERP-125 · 126). 발송 대기 · 서명 대기 · 수정 요청 계약만 연다.
// 공통 틀(AdminFrame)이 헤더를 그리므로 제목 줄(PageBar)부터 그린다.
export default async function ContractWorkerPage({ params, searchParams }: PageProps<"/contracts/[contractId]/worker">) {
  const { contractId: raw } = await params;
  const back = backHrefOf((await searchParams).back);
  const contractId = Number(raw);
  if (!Number.isInteger(contractId) || contractId < 1) notFound();

  const [gender, contractStatus, headers] = await Promise.all([getEnum("Gender"), getEnum("ContractStatus"), authHeaders()]);
  // 근로계약 관리 조회 권한이 없거나 사용 중이 아닌 계정(403) · BP 를 고르지 않은 플랫폼 계정(400)이면 api 문장을 그대로 보인다(목록과 같다)
  let c: ContractDetail | null = null;
  let notice = "로그인이 필요합니다.";
  if (headers.Authorization) {
    try {
      c = await request<ContractDetail>(`/contracts/${contractId}`, { headers });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) notFound();
      // api 의 거절(BP 를 고르지 않음 400 · 권한 · 다른 BP 403 · 없는 BP 404 — deniedMessageOf)은 그 문장을 보인다
      const denied = deniedMessageOf(e);
      if (!(e instanceof ApiError && e.status === 401) && denied === null) throw e;
      if (denied !== null) notice = denied;
    }
  }

  return (
    <>
      <PageBar title="근로계약 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          {!c ? (
            <Notice title={notice} back={back} />
          ) : !isWorkerEditable(c.status) ? (
            <Notice title="발송 대기 · 서명 대기 · 수정 요청 근로계약만 근로자 정보를 고칠 수 있습니다." contractId={contractId} back={back} />
          ) : (
            <ContractPermission action="update" fallback={<Notice title="근로자 정보를 고칠 권한이 없습니다." contractId={contractId} back={back} />}>
              <WorkerForm contractId={contractId} status={c.status ?? ""} initial={workerOf(c)} labels={{ gender, contractStatus }} back={back} />
            </ContractPermission>
          )}
        </div>
      </div>
    </>
  );
}

/** 막혔을 때의 안내와 이동 버튼. 이동 주소에는 탭 BP 를 붙인다(bpHref) */
async function Notice({ title, contractId, back }: { title: string; contractId?: number; back: string }) {
  return (
    <div className="flex items-center gap-[6px]">
      <p className="flex-1 text-[14px] font-semibold text-erp-ink">{title}</p>
      <Button href={await bpHref(contractId ? withBack(`/contracts/${contractId}`, back) : back)}>{contractId ? "상세" : "목록"}</Button>
    </div>
  );
}
