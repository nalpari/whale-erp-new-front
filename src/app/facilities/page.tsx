import { redirect, unstable_rethrow } from "next/navigation";
import { ListToolbar, NoticeBand } from "@/components/common";
import { bpHref, deniedMessageOf, screenPath } from "@/lib/api";
import { getFacilities, getFacilityStoreOptions } from "@/lib/facilities";
import { FacilityFilter } from "./facility-filter";
import { emptyPageHref, facilityListApiSearch, facilityListHref, isUnfiltered, DEFAULT_FACILITY_LIST_QUERY, parseFacilityListQuery, withBack } from "./facility-list-query";
import { FacilityCardBody, FacilityCreateButton, FacilityFrame, FacilityPageSizeSelect, FacilityPagination } from "./facility-parts";
import { FacilityTable } from "./facility-table";

// 시설물 및 장비 관리 목록(MN000022). 목업 docs/mockup/stores/facilities.html · 데모 docs/demo/stores/facilities.html 을 공통 컴포넌트로 옮겼다.
// api 는 GET /facilities(등록일 최신순, 한 쪽 50 · 100건). 화면 상태는 URL 에만 둔다(facility-list-query.ts).
// 화면 주소는 탭 BP 주소 /bp/{id}/facilities 다 — proxy 가 그 BP 를 X-Bp-Code-Id 로 싣는다(플랫폼 계정은 없으면 api 400).
// 데모의 [일괄 등록](PL-7)은 api 가 아직 없어 두지 않았다.
export default async function FacilitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseFacilityListQuery(await searchParams);
  const search = facilityListApiSearch(query);
  // api 의 거절(BP 를 고르지 않은 플랫폼 계정 400 · 권한 403 · 없는 BP 404 — deniedMessageOf)은 오류 화면이 아니라 그 문장으로 보인다
  const denied = (e: unknown): { notice: string } => {
    const notice = deniedMessageOf(e);
    if (notice === null) throw e;
    return { notice };
  };
  const [listed, storeOptions] = await Promise.all([
    // 직영 · 가맹 범위는 필터가 점포로 풀기 전이라 조회하지 않는다(곧 storeIds 주소로 바뀐다)
    search === null ? Promise.resolve({ items: [], total: 0 }) : getFacilities(search).catch(denied),
    getFacilityStoreOptions(true).catch(denied),
  ]);
  if ("notice" in listed || "notice" in storeOptions)
    return (
      <FacilityFrame>
        <FacilityCardBody>
          <NoticeBand title={"notice" in listed ? listed.notice : "notice" in storeOptions ? storeOptions.notice : ""} />
        </FacilityCardBody>
      </FacilityFrame>
    );

  const { items, total } = listed;
  // 상세에서 지우고 돌아온 쪽이 비었으면 남은 마지막 쪽으로
  const moveTo = emptyPageHref(query, items.length, total);
  if (moveTo) redirect(await bpHref(moveTo));
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  // 0건이면 조건 없이 한 번 더 물어 「아예 없는지」와 「조건에 맞는 것이 없는지」를 가른다(다른 목록과 같다). 묻지 못하면 「조건에 맞는 …」
  const noneAtAll =
    search !== null &&
    total === 0 &&
    (isUnfiltered(query) ||
      (await getFacilities(facilityListApiSearch({ ...DEFAULT_FACILITY_LIST_QUERY, storesCleared: true }) ?? "")
        .then((all) => all.total === 0)
        .catch((error: unknown) => {
          unstable_rethrow(error);
          console.warn("시설물 전체 건수 확인 실패", error);
          return false;
        })));
  const empty = search === null ? "" : noneAtAll ? "등록된 시설물 · 장비가 없습니다." : "조건에 맞는 시설물 · 장비가 없습니다.";
  const listHref = facilityListHref(query);
  // 쿼리 · 돌아갈 주소(back)는 옛 경로로 두고, 링크로 그릴 때만 탭 BP 를 붙인다
  const at = await screenPath();

  return (
    <FacilityFrame actions={<FacilityCreateButton href={at(withBack("/facilities/new", listHref))} />}>
      <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
        <FacilityFilter query={query} storeOptions={storeOptions} />
        <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          <ListToolbar total={total}>
            <FacilityPageSizeSelect query={query} />
          </ListToolbar>
          <FacilityTable items={items} total={total} page={query.page} pageSize={query.pageSize} listHref={listHref} empty={empty} at={at} />
          <div className="pt-[14px]">
            <FacilityPagination query={query} totalPages={totalPages} />
          </div>
        </main>
      </div>
    </FacilityFrame>
  );
}
