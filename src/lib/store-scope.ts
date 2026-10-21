// 헤더 점포 범위(Scope)를 목록의 점포 검색 조건으로 옮긴다. 범위는 탭 안(sessionStorage)에만 있어 서버가 모르므로, 헤더가 메뉴로
// 이동할 때 주소에 짧은 값 하나(?scope=ALL · DIRECT · FRANCHISE · STORE:12 — 전체도 적는다)로 싣는다. 어느 메뉴에 점포 검색 필터가 있는지는 헤더가 모른다 —
// 필터가 있는 목록만 이 값을 읽고(서버에서 api 조건으로 바꾼다), 없는 목록은 모르는 값이라 무시한다. 그래서 메뉴 주소 · 코드를 적어 두는 목록이 없다.
// 목록에서 사용자가 고른 점포는 그 목록 주소의 storeIds 에 두고, 있으면(빈 값 「전체」도) scope 보다 앞선다. scope 는 늘 헤더 범위만 뜻해서,
// 주소에 scope 가 있으면 그 탭의 헤더 범위도 그 값으로 맞춘다(admin-header.tsx — 주소를 복사해 다른 탭에서 열 때).
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { Scope } from "./browser-storage.ts";
import type { AdminStore } from "./session.ts";

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

/** 점포 찾기 결과 수 — 필터의 펼친 목록이 이 이상 길어지지 않게 */
const STORE_SEARCH_MAX = 20;

/** 점포명 · 점포코드에 글자가 든 점포(대소문자 무시), 폐점 포함, 앞에서부터 20개. 빈 글자면 없음 — 필터의 점포 고르기(StorePicker)가 쓴다 */
export function searchStoresByText(stores: readonly AdminStore[], text: string): AdminStore[] {
  const word = text.trim().toLowerCase();
  if (!word) return [];
  return stores.filter((s) => s.name.toLowerCase().includes(word) || s.storeCode.toLowerCase().includes(word)).slice(0, STORE_SEARCH_MAX);
}

/** 선택기 항목 키 ↔ 범위. 점포 하나는 「STORE:id」. 주소의 scope 값도 이 키다 */
export const scopeKeyOf = (scope: Scope) => (scope.type === "STORE" ? `STORE:${scope.storeId}` : scope.type);
/** 모르는 키면 null — 부르는 쪽이 범위를 바꾸지 않는다 */
export function scopeOfKey(key: string): Scope | null {
  if (key === "ALL" || key === "DIRECT" || key === "FRANCHISE") return { type: key };
  // 주소에서도 오므로 int4 양의 정수만 받는다(1e3 · 0x10 · 10자리 이상 · 앞뒤 공백은 버린다) — api 가 범위 밖 id 를 400 으로 막아 오류 화면이 된다
  const raw = key.startsWith("STORE:") ? key.slice("STORE:".length) : "";
  const id = /^\d{1,9}$/.test(raw) ? Number(raw) : 0;
  return id > 0 ? { type: "STORE", storeId: id } : null;
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

/** 주소에 싣는 범위 조건의 이름 */
export const SCOPE_PARAM = "scope";

/** 주소의 scope 값 → 범위. 없거나 모르는 값이면 null(범위가 정해지지 않은 것) */
export const scopeOfParam = (raw: string | undefined): Scope | null => (raw === undefined ? null : scopeOfKey(raw));

function withParams(href: string, change: (params: URLSearchParams) => void): string {
  const at = href.indexOf("?");
  const params = new URLSearchParams(at < 0 ? "" : href.slice(at + 1));
  change(params);
  const path = at < 0 ? href : href.slice(0, at);
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

/**
 * 헤더가 메뉴로 갈 주소(메뉴 링크 · 범위를 바꿔 그 메뉴의 목록으로) — 범위를 scope 로 싣는다. 전체도 scope=ALL 로 적는다: 헤더를 거친
 * 기록 항목마다 범위가 남아, 뒤로 · 앞으로 가기를 해도 헤더가 주소를 따라 그 범위로 돌아온다(scopeFromAddress). 전체를 빼면 「전체로
 * 메뉴에 들어옴 → 직영으로 바꿈 → 뒤로」에서 헤더가 직영에 남고, 필터가 다시 직영으로 채워 전체로 돌아갈 수 없었다.
 */
export const withScope = (href: string, scope: Scope) => withParams(href, (p) => p.set(SCOPE_PARAM, scopeKeyOf(scope)));

/**
 * 이 탭에서 쓸 수 없는 범위 — 고를 점포가 없다(점포 하나가 로그인 정보에 없음 · 직영 · 가맹에 폐점이 아닌 점포가 없음). 다른 BP 탭에서
 * 복사한 주소에서 생긴다. 헤더는 따르지 않고(scopeFromAddress), 목록은 「전체」로 보고 안내한다(store-filter.tsx).
 */
export const isUnusableScope = (scope: Scope, stores: readonly AdminStore[]) => scope.type !== "ALL" && !scopeStores(scope, stores).length;

/** 주소의 scope 로 헤더 범위를 바꿀 값 — 없거나 지금과 같거나 이 탭에서 쓸 수 없으면 null(그대로 둔다) */
export function scopeFromAddress(param: string | undefined, current: Scope, stores: readonly AdminStore[]): Scope | null {
  const wanted = scopeOfParam(param);
  if (!wanted || scopeKeyOf(wanted) === scopeKeyOf(current) || isUnusableScope(wanted, stores)) return null;
  return wanted;
}

/** 칩에 그리는 점포 모양 — 점포 목록 · 로그인 정보의 점포에서 칸 셋만 뽑는다 */
export const toPickedStore = ({ storeId, name, storeCode }: { storeId: number; name: string; storeCode: string }) => ({ storeId, name, storeCode });

/**
 * 등록 · 삭제 뒤 돌아갈 목록 주소 — 점포 검색을 「전체」로 비운다(2026-10-20). 빈 storeIds(목록에서 고른 점포 없음)를 적어 목록이 헤더 범위로
 * 다시 채우지 않게 한다 — scope=ALL 로 적으면 헤더 범위까지 전체로 바뀐다. 점포 조건이 바뀌므로 쪽(page)도 뺀다. 다른 조건은 그대로 둔다.
 */
export const withoutStoreSearch = (href: string) =>
  withParams(href, (p) => {
    p.delete(SCOPE_PARAM);
    p.delete("page");
    p.set("storeIds", "");
  });
