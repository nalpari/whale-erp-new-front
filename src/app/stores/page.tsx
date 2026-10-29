import { Button, ExcelDownloadButton, ExcelDownloadNotice, ExcelDownloadProvider, ListToolbar, NoticeBand } from "@/components/common";
import { STORE_STATUSES, STORE_TYPES } from "@/lib/store-types";
import { ApiError, deniedMessageOf, screenPath } from "@/lib/api";
import { getStores } from "@/lib/stores";
import type { StoreSummary } from "@/lib/store-types";
import { StoreFilter } from "./store-filter";
import { StorePermission } from "./store-permission";
import { StoreDenied, StoreFrame } from "./store-frame";
import { StoreListNavigationProvider } from "./store-list-navigation";
import { StorePageSizeSelect, StorePagination, StoreViewToggle } from "./store-list-controls";
import { StoreCard } from "./store-parts";
import { StoreTable } from "./store-table";
import { detailHrefOf, parseStoresQuery, pickedIdsOf, resolveStoresQuery, scopeTypeMismatch, storeListQueryOf, storesExcelHref, storesHref, withBack, type ParsedStoresQuery } from "./stores-query";

// 점포 정보 관리 목록(S-BAYAJS). 데모 docs/demo/stores/index.html 을 공통 컴포넌트로 옮겼다. api 는 GET /stores.
// 카드 목록이 기본이고 표로 바꿀 수 있다. 조건 · 쪽 · 보기는 URL 에만 둔다. 점포 조건은 목록에서 고른 점포(storeIds) 또는 헤더가 실어 온
// 범위(scope)다 — 직영 · 가맹 전체는 점포를 풀지 않고 점포유형으로 api 에 보낸다(storeListQueryOf).
// 엑셀은 지금 조건으로 받는다(공통 ExcelDownloadProvider · 중계 경로 /bp/{id}/stores/excel). 화면 주소는 탭 BP 주소 /bp/{id}/stores 다 — proxy 가
// 그 BP 를 X-Bp-Code-Id 로 싣는다(BP_PATH_SCREENS). api 가 그 헤더로 대상 BP 를 정하면(whale-erp-api 점포 탭 BP 전환) 플랫폼 계정은 고른
// BP 의 점포만 본다 — 그 전까지는 지금처럼 모든 BP 의 점포다.
export default async function StoresPage({ searchParams }: PageProps<"/stores">) {
  const raw = await searchParams;
  const parsed = parseStoresQuery(raw);

  // 고른 점포(범위의 점포 하나 포함)의 이름 · 상태를 찾는다. 찾지 못한 점포는 조건에서 빼고 안내하고(남겨 두면 칩에도 없는 조건이
  // 목록을 0건으로 만든다), 폐점이 있으면 점포상태 기본값이 「전체」다(stores-query.ts 의 resolveStoresQuery)
  const loaded = await loadList(parsed).catch((error: unknown) => {
    const denied = deniedMessageOf(error);
    if (denied === null) throw error;
    console.warn("점포 목록 거절", error instanceof ApiError ? error.status : undefined, denied);
    return { denied };
  });
  if ("denied" in loaded) return <StoreDenied message={loaded.denied} />;
  const { query, picked, missingCount, fromScope, items, total } = loaded;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  // 쿼리 · 돌아갈 주소(back)는 옛 경로로 두고, 링크로 그릴 때만 탭 BP 를 붙인다 — 엑셀 중계 경로도 /bp/{id} 아래로 불러야 proxy 가 헤더를 싣는다
  const at = await screenPath();
  const listHref = storesHref(query);
  const detailHref = (id: number) => at(detailHrefOf(listHref)(id));
  const excelHref = at(storesExcelHref(query));

  return (
    <StoreFrame
      // 등록 버튼은 제목 줄 오른쪽 — 3팀 목록(근로계약 · 직원 · TO-DO)과 같은 자리(2026-10-23)
      actions={
        // 가맹 마스터 · 가맹 관리자는 등록 권한이 켜져 있어도 등록하지 못한다 — api 가 403 으로 막는다
        <StorePermission action="create">
          <Button href={at(withBack("/stores/new", listHref))}>등록</Button>
        </StorePermission>
      }
    >
      <StoreListNavigationProvider query={query}>
        <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
          <StoreFilter picked={picked} scope={query.scope} requested={pickedIdsOf(parsed)} />
          <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px] [&>*]:shrink-0">
            <ExcelDownloadProvider fileName="점포목록.xlsx">
              {missingCount > 0 &&
                (fromScope ? (
                  <NoticeBand tone="info" title="상단에서 고른 점포를 찾을 수 없어 전체로 조회했습니다." detail="지워졌거나 볼 수 없게 된 점포입니다." />
                ) : (
                  <NoticeBand tone="info" title={`고른 점포 ${missingCount}곳을 찾을 수 없어 조건에서 뺐습니다.`} detail="지워졌거나 볼 수 없게 된 점포입니다." />
                ))}
              <ExcelDownloadNotice href={excelHref} />
              <ListToolbar total={total}>
                <StoreViewToggle />
                <ExcelDownloadButton href={excelHref} empty={total === 0} emptyTitle="받을 점포가 없습니다" />
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
                  {scopeTypeMismatch(query) ? "상단 범위와 고른 점포유형이 겹치지 않아 조회된 점포가 없습니다." : "조회된 점포가 없습니다."}
                </p>
              )}
              <div className="pt-[14px]">
                <StorePagination totalPages={totalPages} />
              </div>
            </ExcelDownloadProvider>
          </main>
        </div>
      </StoreListNavigationProvider>
    </StoreFrame>
  );
}

/** 목록 서버의 조회 — 고른 점포를 찾아 조건을 맞춘 뒤(resolveStoresQuery) 목록을 받는다 */
async function loadList(parsed: ParsedStoresQuery) {
  const resolved = resolveStoresQuery(parsed, await pickedStoresOf(pickedIdsOf(parsed)));
  const { items, total } = await getStores(storeListQueryOf(resolved.query));
  return { ...resolved, items, total };
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
