import { Button, ListToolbar, PageBar } from "@/components/common";
import { kstToday } from "@/lib/staff-members";
import { getStaffMembers } from "@/lib/staff-members-api";
import { BulkExportButton } from "./bulk-export-button";
import { StaffFilter } from "./staff-filter";
import { StaffPageSize, StaffPagination } from "./staff-list-controls";
import { parseStaffListQuery, staffListHrefOf } from "./staff-list-query";
import { StaffTable } from "./staff-table";
import { ContractMenuPermission } from "../contracts/contract-permission";

// 직원 정보 관리 목록(WHALEERP-138). 데모 docs/demo/staff/index.html 을 공통 컴포넌트로 옮겼다.
// 데이터는 GET /staff-members(getStaffMembers)다. 화면 상태는 URL 에만 둔다.
// 점포 조건은 목록에서 고른 점포(storeIds) 또는 헤더가 실어 온 범위(scope)다 — 직영 · 가맹 전체는 점포 유형(storeTypes)으로 api 에 보낸다
// (staffListApiSearch — 근로계약 · TO-DO 목록과 같고, 그 유형의 폐점 점포는 api 가 뺀다). 상세로 갈 때 지금 목록 주소를 ?back= 으로 넘긴다.
// 바깥 틀 · 헤더는 공통 틀(AdminFrame)이 그린다. 이 화면은 제목 줄부터 그리고, 넘치는 내용은 필터와 목록 안에서만 스크롤한다.
export default async function StaffMembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseStaffListQuery(await searchParams);
  const { items, total } = await getStaffMembers(query);
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <>
      <PageBar title="직원 정보 관리">
        {/* 초안을 저장하면 초대가 나간다 — 데모의 「계약서 작성」을 이름만 바꿨다(2026-10-12 yjnoh). 근로계약 등록 권한일 때만(WHALEERP-592) */}
        <ContractMenuPermission action="create">
          <Button href="/contracts/new">직원 초대</Button>
        </ContractMenuPermission>
      </PageBar>
      <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
        <StaffFilter query={query} />
        <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          <ListToolbar total={total}>
            <BulkExportButton />
            <StaffPageSize query={query} />
          </ListToolbar>
          <StaffTable
            items={items}
            total={total}
            page={query.page}
            pageSize={query.pageSize}
            today={kstToday()}
            listHref={staffListHrefOf(query)}
          />
          <div className="pt-[14px]">
            <StaffPagination query={query} totalPages={totalPages} />
          </div>
        </main>
      </div>
    </>
  );
}
