import { cookies } from "next/headers";
import { Button, DataTable, ListToolbar, PageBar } from "@/components/common";
import { ApiError, authHeaders, getEnum, request } from "@/lib/api";
import { contractColumns } from "./columns";
import { ContractPermission } from "./contract-permission";
import { SavedNotice } from "./saved-notice";
import { ContractFilters, ContractPageSize, ContractPagination } from "./contract-filters";
import { SAVED_COOKIE, apiSearch, listHrefOf, readListQuery, savedNoticeOf, toSearch, withBack, withKnownStatus, type ContractListPage } from "./contract-list";

// 근로계약 관리 목록. docs/demo/staff/contracts.html 을 공통 컴포넌트로 옮겼고, 목록은 GET /contracts 에서 받는다.
// 점포 조건은 목록에서 고른 점포(storeIds) 또는 헤더가 실어 온 범위(scope)다 — 직영 · 가맹 전체는 점포 유형으로 api 에 보낸다(apiSearch, WHALEERP-133).
export default async function ContractsPage({ searchParams }: PageProps<"/contracts">) {
  const asked = readListQuery(await searchParams);
  // 저장 뒤 시스템이 한 처리(쿠키 SAVED_COOKIE, WHALEERP-132) — SavedNotice 가 한 번 보이고 쿠키를 지운다
  const savedNotice = savedNoticeOf((await cookies()).get(SAVED_COOKIE)?.value);
  const [statuses, draftActions, employmentTypes, headers] = await Promise.all([
    getEnum("ContractStatus"),
    getEnum("ContractDraftAction"),
    getEnum("EmploymentType"),
    authHeaders(),
  ]);

  const query = withKnownStatus(asked, statuses);

  // 관리자 로그인이 아직 없어 세션이 없으면 목록 대신 안내를 보인다. 만료된 토큰(401)도 같다.
  // 사용 중이 아닌 관리자 계정(403)은 api 문장을 그대로 보인다. 그 밖의 오류는 error.tsx 가 받는다.
  let page: ContractListPage | null = null;
  let notice = "로그인이 필요합니다.";
  if (headers.Authorization) {
    try {
      page = await request<ContractListPage>(`/contracts${apiSearch(query)}`, {
        headers,
      });
    } catch (e) {
      if (!(e instanceof ApiError && (e.status === 401 || e.status === 403))) throw e;
      if (e.status === 403) notice = e.message;
    }
  }

  const rows = (page?.items ?? []).map((item, i) => ({ ...item, no: (query.page - 1) * query.pageSize + i + 1 }));
  const totalPages = Math.max(1, Math.ceil((page?.total ?? 0) / query.pageSize));

  return (
    <>
      <PageBar title="근로계약 관리">
        <ContractPermission action="create">
          <Button href={withBack("/contracts/new", listHrefOf(query))}>계약서 작성</Button>
        </ContractPermission>
      </PageBar>
      <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
        {/* 주소가 바뀌면(뒤로 가기 포함) 입력칸을 주소 값으로 다시 맞춘다 */}
        <ContractFilters key={toSearch(query)} query={query} statuses={statuses} statusCounts={page?.statusCounts} />
        <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          <SavedNotice text={savedNotice} />
          <ListToolbar total={page?.total ?? 0}>
            <ContractPageSize query={query} />
          </ListToolbar>
          <DataTable
            columns={contractColumns(statuses, new Date(), draftActions, employmentTypes, listHrefOf(query))}
            rows={rows}
            rowKey={(r) => r.contractId}
            empty={page ? undefined : notice}
          />
          <div className="pt-[14px]">
            <ContractPagination query={query} totalPages={totalPages} />
          </div>
        </main>
      </div>
    </>
  );
}
