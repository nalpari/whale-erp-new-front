import { notFound } from "next/navigation";
import { Button, PageBar } from "@/components/common";
import { ApiError, authHeaders, request } from "@/lib/api";
import { backHrefOf } from "../contract-list";
import { ContractPermission } from "../contract-permission";
import { ContractForm } from "./contract-form";
import { canRenew, renewalFromDetail, type ContractDetail } from "./contract-form-model";
import { loadFormData } from "./load-form-data";

// 근로계약서 초안 작성. docs/demo/staff/contracts-new.html 을 공통 컴포넌트로 옮겼다.
// ?from=계약 ID 면 재계약(WHALEERP-156) — 그 계약 값을 채워 열고 저장할 때 직전 계약으로 싣는다. 재직 중이면 api 가 같은 직원 레코드에
// 붙이고(연장), 퇴직했으면 새 레코드를 만든다(재입사).
export default async function NewContractPage({ searchParams }: PageProps<"/contracts/new">) {
  const query = await searchParams;
  const back = backHrefOf(query.back);
  const from = typeof query.from === "string" ? Number(query.from) : undefined;
  if (from !== undefined && !(Number.isInteger(from) && from >= 1 && from <= 2_147_483_647)) notFound();
  const { stores, labels, signedIn } = await loadFormData();

  // 근로계약 관리 조회 권한이 없거나 사용 중이 아닌 계정(403)이면 api 문장을 그대로 보인다(이어 쓰기와 같다)
  let previous: ContractDetail | null = null;
  let notice = "로그인이 필요합니다";
  if (from !== undefined && signedIn) {
    try {
      previous = await request<ContractDetail>(`/contracts/${from}`, { headers: await authHeaders() });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) notFound();
      if (!(e instanceof ApiError && (e.status === 401 || e.status === 403))) throw e;
      if (e.status === 403) notice = e.message;
    }
  }

  return (
    <>
      <PageBar title={from === undefined ? "근로계약서 초안 작성" : "재계약 작성"} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <ContractPermission action="create" fallback={<Notice title="근로계약서를 작성할 권한이 없습니다" back={back} />}>
            {from === undefined ? (
              <ContractForm stores={stores} labels={labels} signedIn={signedIn} back={back} />
            ) : !previous ? (
              <Notice title={notice} back={back} />
            ) : !canRenew(previous) ? (
              <Notice title="체결 완료되었거나 체결 뒤 종료된 근로계약만 재계약할 수 있습니다" back={back} />
            ) : (
              <ContractForm stores={stores} labels={labels} signedIn initial={renewalFromDetail(previous)} previousContractId={from} back={back} />
            )}
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
