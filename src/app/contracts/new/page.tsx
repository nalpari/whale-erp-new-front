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
  // 직전 계약은 작성 화면 재료와 함께 읽는다. 근로계약 관리 조회 권한이 없거나 사용 중이 아닌 계정(403)이면 api 문장을 그대로
  // 보인다(이어 쓰기와 같다). 세션이 없으면 api 가 401 이라 「로그인이 필요합니다」다
  const readPrevious = async (): Promise<{ previous: ContractDetail | null; notice: string }> => {
    const none = { previous: null, notice: "로그인이 필요합니다" };
    if (from === undefined) return none;
    const headers = await authHeaders();
    if (!headers.Authorization) return none;
    try {
      return { previous: await request<ContractDetail>(`/contracts/${from}`, { headers }), notice: "" };
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) notFound();
      if (!(e instanceof ApiError && (e.status === 401 || e.status === 403))) throw e;
      return e.status === 403 ? { previous: null, notice: e.message } : none;
    }
  };
  const [{ stores, labels, signedIn }, { previous, notice }] = await Promise.all([loadFormData(), readPrevious()]);
  // 재계약은 직전 계약의 근무지로만 한다 — 그 점포가 고를 수 있는 근무지(폐점 아님 · 맡은 점포)가 아니면 열지 않는다. 잠긴 칸에
  // 보이지 않는 점포로 저장되지 않게
  const storeOpen = !previous || stores.some((s) => s.storeId === previous.storeId);

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
            ) : !storeOpen ? (
              <Notice title="이 근무지에는 근로계약서를 작성할 수 없습니다(폐점했거나 맡은 점포가 아님)" back={back} />
            ) : (
              <ContractForm stores={stores} labels={labels} signedIn={signedIn} initial={renewalFromDetail(previous)} previousContractId={from} back={back} />
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
