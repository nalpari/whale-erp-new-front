import {
  AlarmLink,
  Button,
  DataTable,
  GlobalHeader,
  ListToolbar,
  PageBar,
  ServiceLinks,
  StoreSelect,
  UserPop,
} from "@/components/common";
import { ApiError, getEnum, getSession, request } from "@/lib/api";
import { MENUS, STORES, USER_ITEMS } from "../design/sample";
import { contractColumns } from "./columns";
import { ContractFilters, ContractPagination } from "./contract-filters";
import { PAGE_SIZE, readListQuery, toSearch, type ContractListPage } from "./contract-list";

// 근로계약 관리 목록. docs/demo/staff/contracts.html 을 공통 컴포넌트로 옮겼고, 목록은 GET /contracts 에서 받는다.
// 머리글의 메뉴·점포·사용자는 아직 디자인 견본 값이다(1팀 로그인 · 범위 선택기가 생기면 바꾼다).
export default async function ContractsPage({ searchParams }: PageProps<"/contracts">) {
  const query = readListQuery(await searchParams);
  const [statuses, draftActions, employmentTypes, session] = await Promise.all([
    getEnum("ContractStatus"),
    getEnum("ContractDraftAction"),
    getEnum("EmploymentType"),
    getSession(),
  ]);

  // 관리자 로그인이 아직 없어 세션이 없으면 목록 대신 안내를 보인다. 만료된 토큰(401)도 같다.
  let page: ContractListPage | null = null;
  if (session) {
    try {
      page = await request<ContractListPage>(`/contracts${toSearch(query, { pageSize: String(PAGE_SIZE) })}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) throw e;
    }
  }

  const rows = (page?.items ?? []).map((item, i) => ({ ...item, no: (query.page - 1) * PAGE_SIZE + i + 1 }));
  const totalPages = Math.max(1, Math.ceil((page?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="h-[100dvh] overflow-x-auto overflow-y-hidden bg-erp-thead-bg">
      <div className="relative flex h-full min-w-[1720px] flex-col overflow-x-clip">
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
        <PageBar title="근로계약 관리">
          <Button href="/contracts/new">계약서 작성</Button>
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
              empty={page ? undefined : "로그인이 필요합니다."}
            />
            <div className="pt-[14px]">
              <ContractPagination query={query} totalPages={totalPages} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
