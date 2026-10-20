// 헤더 점포 범위(Scope)를 목록의 점포 검색 조건으로 옮긴다. 점포 검색 컴포넌트(StorePicker)를 쓰는 목록 메뉴만 따른다.
// 그 목록은 주소의 storeIds 로 고른 점포를 받는다 — 범위는 탭 안(sessionStorage)에만 있어 서버가 모르므로 주소로 넘긴다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { Scope } from "./browser-storage.ts";
import type { AdminStore } from "./session.ts";

/**
 * 점포 검색 컴포넌트를 쓰는 목록 메뉴의 url. 이 메뉴의 화면(목록 · 상세 · 등록 · 수정)에서 헤더 범위를 바꾸면 그 목록으로 가서
 * 범위의 점포로 검색하고, 헤더 메뉴 링크에도 범위를 싣는다. 여기 없는 화면은 헤더 범위를 바꿔도 그대로다.
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

/** 범위로 검색하는 목록 주소. 전체면 조건 없는 목록이다 */
export function scopedListHref(url: string, scope: Scope, stores: readonly AdminStore[]): string {
  const ids = scopeStores(scope, stores).map((s) => s.storeId);
  return ids.length ? `${url}?storeIds=${ids.join(",")}` : url;
}
