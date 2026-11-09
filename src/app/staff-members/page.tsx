import { Button, ListToolbar, PageBar } from "@/components/common";
import { deniedMessageOf, getEnum, screenPath } from "@/lib/api";
import { kstToday, staffListApiSearch } from "@/lib/staff-members";
import { getStaffMembers } from "@/lib/staff-members-api";
import { BulkExportButton } from "./bulk-export-button";
import { StaffFilter } from "./staff-filter";
import { StaffPageSize, StaffPagination } from "./staff-list-controls";
import { DEFAULT_STAFF_LIST_QUERY, parseStaffListQuery, staffListHrefOf } from "./staff-list-query";
import { StaffTable } from "./staff-table";
import { ContractMenuPermission } from "../contracts/contract-permission";

// 직원 정보 관리 목록(WHALEERP-138). 데모 docs/demo/staff/index.html 을 공통 컴포넌트로 옮겼다.
// 데이터는 GET /staff-members(getStaffMembers)다. 화면 상태는 URL 에만 둔다.
// 점포 조건은 목록에서 고른 점포(storeIds) 또는 헤더가 실어 온 범위(scope)다 — 직영 · 가맹 전체는 점포 유형(storeTypes)으로 api 에 보낸다
// (staffListApiSearch — 근로계약 · TO-DO 목록과 같고, 그 유형의 폐점 점포는 api 가 뺀다). 상세로 갈 때 지금 목록 주소를 ?back= 으로 넘긴다.
// 화면 주소는 탭 BP 주소 /bp/{id}/staff-members 다 — proxy 가 그 BP 를 X-Bp-Code-Id 로 실어, 플랫폼 계정은 고른 BP 의 직원만 본다(BP_PATH_SCREENS).
// 바깥 틀 · 헤더는 공통 틀(AdminFrame)이 그린다. 이 화면은 제목 줄부터 그리고, 넘치는 내용은 필터와 목록 안에서만 스크롤한다.
export default async function StaffMembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseStaffListQuery(await searchParams);
  // api 의 거절(BP 를 고르지 않은 플랫폼 계정 400 · 다른 BP 403 · 없는 BP 404 — deniedMessageOf)은 오류 화면이 아니라 그 문장으로 보인다(근로계약 목록과 같다)
  // 계약 상태 칸의 이름은 GET /enums/ContractStatus 에서 받는다(WHALEERP-659)
  const [listed, contractStatuses] = await Promise.all([
    getStaffMembers(query).catch((e: unknown) => {
      const notice = deniedMessageOf(e);
      if (notice === null) throw e;
      return { notice };
    }),
    getEnum("ContractStatus"),
  ]);
  if ("notice" in listed)
    return (
      <>
        <PageBar title="직원 정보 관리" />
        <p role="alert" className="p-[24px] text-[14px] text-erp-label">
          {listed.notice}
        </p>
      </>
    );
  const { items, total } = listed;
  // 쿼리 · 돌아갈 주소(back)는 옛 경로로 두고, 링크로 그릴 때만 탭 BP 를 붙인다
  const at = await screenPath();
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  // 0건이면 조건 없이(전체 점포 · 모든 유형 · 재직 상태 전체) 한 번 더 물어 「직원이 아예 없는지」와 「조건에 맞는 직원이 없는지」를 가른다
  // (점포 목록과 같은 방식, 2026-11-04 사용자 지정). 묻지 못하면 예전처럼 「조건에 맞는 직원이 없습니다.」
  // 조건 없는 조회는 기본 조건에서 재직 상태를 전체로 · 점포를 「전체」로 바꿔 만든다(리뷰 반영 — 손으로 다시 적으면 기본값이 바뀔 때 어긋난다)
  const allQuery = { ...DEFAULT_STAFF_LIST_QUERY, storesCleared: true, employmentStatus: "ALL" as const, pageSize: query.pageSize };
  // 지금 조회가 이미 「전체」(조건 없음)면 다시 묻지 않는다 — 같은 요청을 두 번 보내지 않게(리뷰 반영)
  // 묶음 · 고용형태를 하나도 고르지 않았으면(null) 다시 묻지 않고 늘 「조건에 맞는 …」 — 목록 필터 체크박스 공통 정책(2026-11-09 공지)
  const search = staffListApiSearch({ ...query, page: 1 });
  const noStaffAtAll =
    total === 0 &&
    search !== null &&
    (search === staffListApiSearch(allQuery) ||
      (await getStaffMembers(allQuery)
        .then((all) => all.total === 0)
        .catch((error: unknown) => {
        // 확인에 실패하면 예전처럼 「조건에 맞는 …」 — 장애를 알아챌 수 있게 로그만 남긴다(리뷰 반영)
        console.warn("직원 전체 건수 확인 실패", error);
        return false;
      })));

  return (
    <>
      <PageBar title="직원 정보 관리">
        {/* 초안을 저장하면 초대가 나간다 — 데모의 「계약서 작성」을 이름만 바꿨다(2026-10-12 yjnoh). 근로계약 등록 권한일 때만(WHALEERP-592) */}
        <ContractMenuPermission action="create">
          <Button href={at("/contracts/new")}>직원 초대</Button>
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
            contractStatuses={contractStatuses}
            listHref={staffListHrefOf(query)}
            at={at}
            empty={noStaffAtAll ? "등록된 직원이 없습니다." : "조건에 맞는 직원이 없습니다."}
          />
          <div className="pt-[14px]">
            <StaffPagination query={query} totalPages={totalPages} />
          </div>
        </main>
      </div>
    </>
  );
}
