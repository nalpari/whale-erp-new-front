import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Button, PageBar } from "@/components/common";
import { ApiError, authHeaders, bpHref, deniedMessageOf, request } from "@/lib/api";
import { backHrefOf, withBack } from "../contract-list";
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
  // 직전 계약은 작성 화면 재료와 함께 읽는다. 근로계약 관리 조회 권한이 없거나 사용 중이 아닌 계정(403) · BP 를 고르지 않은 플랫폼
  // 계정(400)이면 api 문장을 그대로 보인다(이어 쓰기와 같다). 세션이 없으면 api 가 401 이라 「로그인이 필요합니다」다
  const readPrevious = async (): Promise<{ previous: ContractDetail | null; notice: string }> => {
    const none = { previous: null, notice: "로그인이 필요합니다." };
    if (from === undefined) return none;
    const headers = await authHeaders();
    if (!headers.Authorization) return none;
    try {
      return { previous: await request<ContractDetail>(`/contracts/${from}`, { headers }), notice: "" };
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) notFound();
      const denied = deniedMessageOf(e);
      if (!(e instanceof ApiError && e.status === 401) && denied === null) throw e;
      return denied !== null ? { previous: null, notice: denied } : none;
    }
  };
  const [{ stores, labels, signedIn, denied, minimumWages }, { previous, notice }] = await Promise.all([loadFormData(), readPrevious()]);
  // 재계약은 직전 계약의 근무지로만 한다 — 그 점포가 고를 수 있는 근무지(폐점 아님 · 맡은 점포)가 아니면 열지 않는다. 잠긴 칸에
  // 보이지 않는 점포로 저장되지 않게
  const storeOpen = !previous || stores.some((s) => s.storeId === previous.storeId);

  return (
    <>
      <PageBar title={from === undefined ? "근로계약서 초안 작성" : "재계약 작성"} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <ContractPermission action="create" fallback={<Notice title="근로계약서를 작성할 권한이 없습니다." back={back} />}>
            {/* 근무지 선택지를 api 가 거절했으면(BP 를 고르지 않음 · 권한 · 없는 BP) 그 문장. 재계약은 직전 계약을 읽지 못한 안내가 먼저고,
                읽었으면 거절이 먼저다 — 빈 선택지로 「폐점했거나 맡은 점포가 아님」이라고 잘못 안내하지 않게 */}
            {denied !== null && (from === undefined || previous) ? (
              <Notice title={denied} back={back} />
            ) : from === undefined ? (
              <ContractForm stores={stores} labels={labels} minimumWages={minimumWages} signedIn={signedIn} back={back} />
            ) : !previous ? (
              <Notice title={notice} back={back} />
            ) : previous.renewedBy != null ? (
              // 이미 체결된 재계약이 이어져 있다 — 그 계약으로 안내한다. 진행 중 재계약은 api 가 renewedBy 에 싣지 않아 이 화면을 열고,
              // 저장할 때 대체를 묻는다(api #157 리뷰 · front #135 참고 1). 칸이 없는 옛 api 응답(undefined)도 안내로 빠지지 않게 != null
              <Notice title="이 근로계약에는 이미 체결된 재계약이 이어져 있습니다. 그 근로계약에서 재계약해 주세요." back={back}>
                <Button href={await bpHref(withBack(`/contracts/${previous.renewedBy}`, query.back))}>이어지는 계약</Button>
              </Notice>
            ) : !canRenew(previous) ? (
              <Notice title="체결 완료되었거나 체결 뒤 종료된 근로계약만 재계약할 수 있습니다." back={back} />
            ) : !storeOpen ? (
              <Notice title="이 근무지에는 근로계약서를 작성할 수 없습니다(폐점했거나 맡은 점포가 아님)" back={back} />
            ) : (
              <ContractForm stores={stores} labels={labels} minimumWages={minimumWages} signedIn={signedIn} initial={renewalFromDetail(previous)} previousContractId={from} previousStartDate={previous.startDate ?? undefined} back={back} />
            )}
          </ContractPermission>
        </div>
      </div>
    </>
  );
}

/** 열 수 없을 때의 안내와 [목록]. 목록 주소에는 탭 BP 를 붙인다(bpHref) */
async function Notice({ title, back, children }: { title: string; back: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-[6px]">
      <p className="flex-1 text-[14px] font-semibold text-erp-ink">{title}</p>
      {children}
      <Button href={await bpHref(back)}>목록</Button>
    </div>
  );
}
