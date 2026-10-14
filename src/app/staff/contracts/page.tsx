import { Button, DataTable, ListToolbar, PageBar } from "@/components/common";
import { ApiError, getEnum, getSession, request } from "@/lib/api";
import { contractColumns } from "./columns";
import { ContractFilters, ContractPagination } from "./contract-filters";
import { PAGE_SIZE, readListQuery, toSearch, withKnownStatus, type ContractListPage } from "./contract-list";

// 근로계약 관리 목록. docs/demo/staff/contracts.html 을 공통 컴포넌트로 옮겼고, 목록은 GET /contracts 에서 받는다.
export default async function ContractsPage({ searchParams }: PageProps<"/staff/contracts">) {
  const asked = readListQuery(await searchParams);
  const [statuses, draftActions, employmentTypes, session] = await Promise.all([
    getEnum("ContractStatus"),
    getEnum("ContractDraftAction"),
    getEnum("EmploymentType"),
    getSession(),
  ]);

  const query = withKnownStatus(asked, statuses);

  // 관리자 로그인이 아직 없어 세션이 없으면 목록 대신 안내를 보인다. 만료된 토큰(401)도 같다.
  // 사용 중이 아닌 관리자 계정(403)은 api 문장을 그대로 보인다. 그 밖의 오류는 error.tsx 가 받는다.
  let page: ContractListPage | null = null;
  let notice = "로그인이 필요합니다.";
  if (session) {
    try {
      page = await request<ContractListPage>(`/contracts${toSearch(query, { pageSize: String(PAGE_SIZE) })}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
    } catch (e) {
      if (!(e instanceof ApiError && (e.status === 401 || e.status === 403))) throw e;
      if (e.status === 403) notice = e.message;
    }
  }

  const rows = (page?.items ?? []).map((item, i) => ({ ...item, no: (query.page - 1) * PAGE_SIZE + i + 1 }));
  const totalPages = Math.max(1, Math.ceil((page?.total ?? 0) / PAGE_SIZE));

  return (
    <>
      <PageBar title="근로계약 관리">
        <Button href="/staff/contracts/new">계약서 작성</Button>
      </PageBar>
      <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
        {/* 주소가 바뀌면(뒤로 가기 포함) 입력칸을 주소 값으로 다시 맞춘다 */}
        <ContractFilters key={toSearch(query)} query={query} statuses={statuses} />
        <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          <ListToolbar total={page?.total ?? 0} />
          <DataTable
            columns={contractColumns(statuses, new Date(), draftActions, employmentTypes)}
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
