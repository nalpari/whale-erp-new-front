// 헤더 점포 범위(Scope)를 목록의 점포 검색 조건으로 옮긴다. 점포 검색 컴포넌트(StorePicker)를 쓰는 목록 메뉴만 따른다.
// 그 목록은 주소의 storeIds 로 고른 점포를 받는다 — 범위는 탭 안(sessionStorage)에만 있어 서버가 모르므로 주소로 넘긴다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { Scope } from "./browser-storage.ts";
import type { AdminStore } from "./session.ts";
import { STORE_STATUSES } from "./store-types.ts";

/**
 * 점포 검색 컴포넌트를 쓰는 목록 메뉴의 url. 이 메뉴의 화면(목록 · 상세 · 등록 · 수정)에서 헤더 범위를 바꾸면 그 목록으로 가서
 * 범위의 점포로 검색하고, 헤더 메뉴 링크에도 범위(그 메뉴에서 사용자가 고른 점포가 있으면 그 점포)를 싣는다. 여기 없는 화면은 헤더 범위를
 * 바꿔도 그대로다. 그 목록은 주소의 storeIds 로 고른 점포를, statuses 로 점포상태를 받는다(점포 정보 관리 목록과 같은 이름).
 */
export const STORE_SCOPE_LIST_URLS: readonly string[] = ["/stores"];

export const usesStoreScope = (url: string | null | undefined) => !!url && STORE_SCOPE_LIST_URLS.includes(url);

export const isClosedStore = (s: AdminStore) => s.storeStatusCode === "CLOSED";

/**
 * 폐점이 아닌 점포 — 헤더 범위의 개수(전체 · 직영 · 가맹 N개점)와 직영 · 가맹 전체가 담는 점포다. 삭제한 점포는 api 가 로그인 정보에서 이미 뺀다.
 * 폐점 점포는 선택기에 회색으로 보이고 하나씩은 고를 수 있다(2026-10-20).
 */
export const openStores = (stores: readonly AdminStore[]) => stores.filter((s) => !isClosedStore(s));

/** 범위에 드는 점포 — 전체면 [](조건 없음), 직영 · 가맹이면 폐점이 아닌 그 유형의 점포 모두, 점포 하나면 그 점포(폐점도, 로그인 정보에 없으면 []) */
export function scopeStores(scope: Scope, stores: readonly AdminStore[]): AdminStore[] {
  switch (scope.type) {
    case "ALL":
      return [];
    case "DIRECT":
    case "FRANCHISE":
      return openStores(stores).filter((s) => s.storeTypeCode === scope.type);
    case "STORE":
      return stores.filter((s) => s.storeId === scope.storeId);
  }
}

/** 목록 주소에서 고른 점포(storeIds)를 뺀다 — 점포 조건이 바뀌므로 쪽(page)도 1로 돌린다. 다른 조건은 그대로 둔다 */
export function withoutStoreIds(href: string): string {
  const at = href.indexOf("?");
  if (at < 0) return href;
  const params = new URLSearchParams(href.slice(at + 1));
  params.delete("storeIds");
  params.delete("page");
  const search = params.toString();
  return search ? `${href.slice(0, at)}?${search}` : href.slice(0, at);
}

/** 고른 점포 중 폐점이 있는가 — 목록의 기본 점포상태가 폐점을 빼므로, 있으면 상태 조건을 「전체」로 넣어야 0건이 되지 않는다 */
export const includesClosedStore = (ids: readonly number[], stores: readonly AdminStore[]) =>
  stores.some((s) => isClosedStore(s) && ids.includes(s.storeId));

/** 이 점포들로 검색하는 목록 주소. 없으면 조건 없는 목록, 폐점 점포가 들면 점포상태를 「전체」로 함께 싣는다 */
export function pickedListHref(url: string, ids: readonly number[], stores: readonly AdminStore[]): string {
  if (!ids.length) return url;
  const params = new URLSearchParams({ storeIds: ids.join(",") });
  if (includesClosedStore(ids, stores)) params.set("statuses", STORE_STATUSES.join(","));
  return `${url}?${params}`;
}

/** 범위로 검색하는 목록 주소. 전체면 조건 없는 목록이다 */
export const scopedListHref = (url: string, scope: Scope, stores: readonly AdminStore[]) =>
  pickedListHref(
    url,
    scopeStores(scope, stores).map((s) => s.storeId),
    stores,
  );

/** 선택기 항목 키 ↔ 범위. 점포 하나는 「STORE:id」 */
export const scopeKeyOf = (scope: Scope) => (scope.type === "STORE" ? `STORE:${scope.storeId}` : scope.type);
/** 모르는 키면 null — 부르는 쪽이 범위를 바꾸지 않는다 */
export function scopeOfKey(key: string): Scope | null {
  if (key === "ALL" || key === "DIRECT" || key === "FRANCHISE") return { type: key };
  const id = key.startsWith("STORE:") ? Number(key.slice("STORE:".length)) : NaN;
  return Number.isInteger(id) && id > 0 ? { type: "STORE", storeId: id } : null;
}

/**
 * 저장된 범위를 이 탭의 점포 목록에 맞춘다 — 고른 점포가 없어졌거나(지움 · 범위 밖), 직영 · 가맹인데 그 유형에 폐점이 아닌 점포가
 * 없으면 「전체」다. 선택기에 없는 범위가 남아 표시와 실제 검색이 어긋나지 않게 한다.
 */
export function restoredScope(saved: Scope | null, stores: readonly AdminStore[]): Scope {
  if (!saved) return { type: "ALL" };
  if (saved.type !== "ALL" && !scopeStores(saved, stores).length) return { type: "ALL" };
  return saved;
}
