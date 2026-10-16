import { Button, ListToolbar } from "@/components/common";
import { STORE_STATUSES, STORE_TYPES } from "@/lib/store-types";
import { getStores } from "@/lib/stores";
import { StoreFilter } from "./store-filter";
import { StorePermission } from "./store-permission";
import { StoreFrame } from "./store-frame";
import { StoreListNavigationProvider } from "./store-list-navigation";
import { StorePageSizeSelect, StorePagination, StoreViewToggle } from "./store-list-controls";
import { NoticeBand, StoreCard } from "./store-parts";
import type { PickedStore } from "./store-picker";
import { StoreTable } from "./store-table";
import { detailHrefOf, parseStoresQuery, storesExcelHref, storesHref } from "./stores-query";
import { StoreExcelButton, StoreExcelNotice, StoreExcelProvider } from "./store-excel";

// 점포 정보 관리 목록(S-BAYAJS). 데모 docs/demo/stores/index.html 을 공통 컴포넌트로 옮겼다. api 는 GET /stores.
// 카드 목록이 기본이고 표로 바꿀 수 있다. 조건 · 쪽 · 보기는 URL 에만 둔다.
// 엑셀은 지금 조건으로 바로 받는다(store-excel.tsx · 중계 경로 /stores/excel). 플랫폼 사용자의 BP 고르기는 헤더 BP 선택이 생길 때 붙인다.
export default async function StoresPage({ searchParams }: PageProps<"/stores">) {
  const raw = await searchParams;
  const parsed = parseStoresQuery(raw);

  // 고른 점포의 이름 — URL 에는 id 만 있다. 상태 · 유형과 상관없이 찾는다
  const pickedList = parsed.storeIds.length
    ? await getStores({ ...parsed, page: 1, pageSize: 100, bizRegistrationNumber: "", statuses: [...STORE_STATUSES], storeTypes: [...STORE_TYPES] })
    : { items: [], total: 0 };
  const picked: PickedStore[] = parsed.storeIds
    .map((id) => pickedList.items.find((s) => s.storeId === id))
    .filter((s) => s !== undefined)
    .map(({ storeId, name, storeCode }) => ({ storeId, name, storeCode }));
  // 지워졌거나 볼 수 없게 된 점포는 조건에서 뺀다 — 남겨 두면 칩에도 없는 조건이 목록을 0건으로 만든다
  const missingCount = parsed.storeIds.length - picked.length;
  const query = missingCount ? { ...parsed, storeIds: picked.map((p) => p.storeId) } : parsed;
  const { items, total } = await getStores(query);
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const detailHref = detailHrefOf(storesHref(query));
  const excelHref = storesExcelHref(query);

  return (
    <StoreFrame>
      <StoreListNavigationProvider query={query}>
        <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
          <StoreFilter picked={picked} />
          <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px] [&>*]:shrink-0">
            <StoreExcelProvider>
              {missingCount > 0 && (
                <NoticeBand tone="info" title={`고른 점포 ${missingCount}곳을 찾을 수 없어 조건에서 뺐습니다.`} detail="지워졌거나 볼 수 없게 된 점포입니다." />
              )}
              <StoreExcelNotice href={excelHref} />
              <ListToolbar total={total}>
                <StoreViewToggle />
                <StoreExcelButton href={excelHref} empty={total === 0} />
                {/* 가맹 마스터 · 가맹 관리자는 등록 권한이 켜져 있어도 등록하지 못한다 — api 가 403 으로 막는다 */}
                <StorePermission action="create">
                  <Button href="/stores/new">등록</Button>
                </StorePermission>
                <StorePageSizeSelect />
              </ListToolbar>
              {query.view === "table" ? (
                <StoreTable items={items} total={total} page={query.page} pageSize={query.pageSize} detailHref={detailHref} />
              ) : items.length ? (
                <ul aria-label="점포 목록" className="grid grid-cols-4 gap-[12px]">
                  {items.map((store) => (
                    <li key={store.storeId} className="contents">
                      <StoreCard store={store} href={detailHref(store.storeId)} />
                    </li>
                  ))}
                </ul>
              ) : (
                // 빈 상태 — 표와 같은 92px 한 줄(DESIGN.md Tables)
                <p className="grid h-[92px] place-items-center rounded-[4px] border border-erp-panel-line text-[14px] text-erp-muted">
                  조회된 점포가 없습니다.
                </p>
              )}
              <div className="pt-[14px]">
                <StorePagination totalPages={totalPages} />
              </div>
            </StoreExcelProvider>
          </main>
        </div>
      </StoreListNavigationProvider>
    </StoreFrame>
  );
}
