import { Button, ListToolbar } from "@/components/common";
import { STORE_STATUSES, STORE_TYPES } from "@/lib/store-types";
import { getStores } from "@/lib/stores";
import type { StoreSummary } from "@/lib/store-types";
import { StoreFilter } from "./store-filter";
import { StorePermission } from "./store-permission";
import { StoreFrame } from "./store-frame";
import { StoreListNavigationProvider } from "./store-list-navigation";
import { StorePageSizeSelect, StorePagination, StoreViewToggle } from "./store-list-controls";
import { NoticeBand, StoreCard } from "./store-parts";
import type { PickedStore } from "@/components/site/store-picker";
import { StoreTable } from "./store-table";
import { detailHrefOf, keepFoundStores, parseStoresQuery, pickedIdsOf, storeListQueryOf, storesExcelHref, storesHref, withBack, withDefaultStatuses } from "./stores-query";
import { StoreExcelButton, StoreExcelNotice, StoreExcelProvider } from "./store-excel";

// 점포 정보 관리 목록(S-BAYAJS). 데모 docs/demo/stores/index.html 을 공통 컴포넌트로 옮겼다. api 는 GET /stores.
// 카드 목록이 기본이고 표로 바꿀 수 있다. 조건 · 쪽 · 보기는 URL 에만 둔다. 점포 조건은 목록에서 고른 점포(storeIds) 또는 헤더가 실어 온
// 범위(scope)다 — 직영 · 가맹 전체는 점포를 풀지 않고 점포유형으로 api 에 보낸다(storeListQueryOf).
// 엑셀은 지금 조건으로 바로 받는다(store-excel.tsx · 중계 경로 /stores/excel). 플랫폼 사용자의 BP 고르기는 헤더 BP 선택이 생길 때 붙인다.
export default async function StoresPage({ searchParams }: PageProps<"/stores">) {
  const raw = await searchParams;
  const parsed = parseStoresQuery(raw);

  const ids = pickedIdsOf(parsed);
  const found = (await pickedStoresOf(ids)).filter((s) => ids.includes(s.storeId));
  const picked: PickedStore[] = ids
    .map((id) => found.find((s) => s.storeId === id))
    .filter((s) => s !== undefined)
    .map(({ storeId, name, storeCode }) => ({ storeId, name, storeCode }));
  // 고른 점포에 폐점이 있으면 점포상태 기본값이 「전체」다(stores-query.ts)
  const hasClosedStore = found.some((s) => s.storeStatusCode === "CLOSED");
  // 고른 점포(범위의 점포 하나 포함) 중 지워졌거나 볼 수 없게 된 점포는 조건에서 빼고 안내한다 — 남겨 두면 칩에도 없는 조건이 목록을 0건으로 만든다
  const { query: kept, missing: missingCount } = keepFoundStores(parsed, picked.map((p) => p.storeId));
  const query = withDefaultStatuses(kept, hasClosedStore);
  const { items, total } = await getStores(storeListQueryOf(query));
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const listHref = storesHref(query);
  const detailHref = detailHrefOf(listHref);
  const excelHref = storesExcelHref(query);

  return (
    <StoreFrame>
      <StoreListNavigationProvider query={query}>
        <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
          <StoreFilter picked={picked} scope={query.scope} />
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
                  <Button href={withBack("/stores/new", listHref)}>등록</Button>
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

/** 고른 점포의 이름 · 상태 — URL 에는 id 만 있다. 상태 · 유형과 상관없이 찾는다. 한 쪽이 100건까지라 100개씩 나눠 찾는다 */
async function pickedStoresOf(ids: number[]): Promise<StoreSummary[]> {
  const chunks: number[][] = [];
  for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100));
  const lists = await Promise.all(
    chunks.map((storeIds) =>
      getStores({ storeIds, page: 1, pageSize: 100, bizRegistrationNumber: "", statuses: [...STORE_STATUSES], storeTypes: [...STORE_TYPES] }),
    ),
  );
  return lists.flatMap((l) => l.items);
}
