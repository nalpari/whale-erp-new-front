import { Button, DataTable, ListToolbar, PageBar } from "@/components/common";
import { ApiError, authHeaders, deniedMessageOf, getEnum, request, screenPath } from "@/lib/api";
import { contractColumns } from "./columns";
import { ContractPermission } from "./contract-permission";
import { SavedNotice } from "./saved-notice";
import { ContractFilters, ContractPageSize, ContractPagination } from "./contract-filters";
import { apiSearch, listHrefOf, readListQuery, toSearch, withBack, withKnownStatus, type ContractListPage } from "./contract-list";

// 근로계약 관리 목록. docs/demo/staff/contracts.html 을 공통 컴포넌트로 옮겼고, 목록은 GET /contracts 에서 받는다.
// 점포 조건은 목록에서 고른 점포(storeIds) 또는 헤더가 실어 온 범위(scope)다 — 직영 · 가맹 전체는 점포 유형으로 api 에 보낸다(apiSearch, WHALEERP-133).
// 화면 주소는 탭 BP 주소 /bp/{id}/contracts 다 — proxy 가 그 BP 를 X-Bp-Code-Id 로 실어, 플랫폼 계정은 고른 BP 의 계약만 본다(BP_PATH_SCREENS, WHALEERP-618).
export default async function ContractsPage({ searchParams }: PageProps<"/contracts">) {
  const asked = readListQuery(await searchParams);
  const [statuses, draftActions, employmentTypes, headers] = await Promise.all([
    getEnum("ContractStatus"),
    getEnum("ContractDraftAction"),
    getEnum("EmploymentType"),
    authHeaders(),
  ]);

  const query = withKnownStatus(asked, statuses);

  // 관리자 로그인이 아직 없어 세션이 없으면 목록 대신 안내를 보인다. 만료된 토큰(401)도 같다.
  // api 가 거절하면(사용 중이 아닌 관리자 계정 403 · 플랫폼 계정이 BP 를 고르지 않음 400 등) 그 문장을 그대로 보인다. 그 밖의 오류는 error.tsx 가 받는다.
  let page: ContractListPage | null = null;
  let notice = "로그인이 필요합니다.";
  if (headers.Authorization) {
    try {
      page = await request<ContractListPage>(`/contracts${apiSearch(query)}`, {
        headers,
      });
    } catch (e) {
      // api 의 거절(BP 를 고르지 않음 400 · 권한 · 다른 BP 403 · 없는 BP 404 — deniedMessageOf)은 그 문장을 보인다
      const denied = deniedMessageOf(e);
      if (!(e instanceof ApiError && e.status === 401) && denied === null) throw e;
      if (denied !== null) notice = denied;
    }
  }

  const rows = (page?.items ?? []).map((item, i) => ({ ...item, no: (query.page - 1) * query.pageSize + i + 1 }));
  const totalPages = Math.max(1, Math.ceil((page?.total ?? 0) / query.pageSize));
  // 쿼리 · 돌아갈 주소(back)는 옛 경로로 두고, 링크로 그릴 때만 탭 BP 를 붙인다
  const at = await screenPath();

  return (
    <>
      <PageBar title="근로계약 관리">
        <ContractPermission action="create">
          <Button href={at(withBack("/contracts/new", listHrefOf(query)))}>계약서 작성</Button>
        </ContractPermission>
      </PageBar>
      <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
        {/* 주소가 바뀌면(뒤로 가기 포함) 입력칸을 주소 값으로 다시 맞춘다 */}
        <ContractFilters key={toSearch(query)} query={query} statuses={statuses} statusCounts={page?.statusCounts} />
        <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          {/* 저장 뒤 시스템이 한 처리(쿠키, WHALEERP-132) — 화면이 쿠키를 읽고 지운다 */}
          <SavedNotice />
          <ListToolbar total={page?.total ?? 0}>
            <ContractPageSize query={query} />
          </ListToolbar>
          <DataTable
            columns={contractColumns(statuses, new Date(), draftActions, employmentTypes, listHrefOf(query), at)}
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
