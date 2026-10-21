// node --test src/app/stores/stores-query.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  backHrefOf,
  DEFAULT_STORES_QUERY,
  detailHrefOf,
  keepFoundStores,
  MAX_PICKED_STORES,
  parseStoresQuery,
  pickedIdsOf,
  storeListQueryOf,
  storesExcelHref,
  storesHref,
  withBack,
  withDefaultStatuses,
  withPickedStores,
  withStoreFilter,
  type StoresQuery,
} from "./stores-query.ts";

const read = (href: string, hasClosedStore = false) =>
  withDefaultStatuses(parseStoresQuery(Object.fromEntries(new URL(href, "http://x").searchParams)), hasClosedStore);

test("기본값 — 폐점 제외 · 두 유형 · 카드 · 20건 · 점포 조건 없음", () => {
  assert.deepEqual(read("/stores"), DEFAULT_STORES_QUERY);
  assert.equal(storesHref(DEFAULT_STORES_QUERY), "/stores");
  assert.equal(parseStoresQuery({}).statuses, null);
});

test("틀린 값은 기본값으로 — api 400 · 500 을 일으키지 않는다", () => {
  const q = parseStoresQuery({ page: "0", pageSize: "30", storeIds: "1,x,-3,1234567890,2", view: "grid", bizRegistrationNumber: "123-45-6789012" });
  assert.equal(q.page, 1);
  assert.equal(q.pageSize, 20);
  assert.deepEqual(q.storeIds, [1, 2]);
  assert.equal(q.view, "cards");
  assert.equal(q.bizRegistrationNumber, "1234567890");
});

test("체크 목록 — 빈 값이면 하나도 고르지 않은 것, 모르는 값은 버린다", () => {
  assert.deepEqual(parseStoresQuery({ statuses: "" }).statuses, []);
  assert.deepEqual(parseStoresQuery({ statuses: "CLOSED,NOPE,OPERATING" }).statuses, ["OPERATING", "CLOSED"]);
  assert.deepEqual(parseStoresQuery({ storeTypes: "FRANCHISE" }).storeTypes, ["FRANCHISE"]);
});

test("만든 주소를 다시 읽으면 같은 조건 — 새로 고침 · 상세에서 돌아오기", () => {
  const q: StoresQuery = { page: 3, pageSize: 50, storeIds: [12, 5], bizRegistrationNumber: "12345", statuses: ["CLOSED"], storeTypes: ["DIRECT"], view: "table", scope: null, statusesDefault: false };
  assert.deepEqual(read(storesHref(q)), q);
  const scoped: StoresQuery = { ...DEFAULT_STORES_QUERY, scope: { type: "STORE", storeId: 7 } };
  assert.deepEqual(read(storesHref(scoped)), scoped);
});

test("점포 조건 — 고른 점포(storeIds)가 있으면 범위(scope)는 쓰지 않는다", () => {
  assert.deepEqual(parseStoresQuery({ scope: "DIRECT" }).scope, { type: "DIRECT" });
  const both = parseStoresQuery({ storeIds: "3", scope: "DIRECT" });
  assert.deepEqual(both.storeIds, [3]);
  assert.equal(both.scope, null);
  assert.equal(parseStoresQuery({ scope: "NOPE" }).scope, null);
});

test("api 조건 — 직영 · 가맹 범위는 점포를 풀지 않고 점포유형으로, 점포 하나는 storeIds 로", () => {
  const direct = storeListQueryOf({ ...DEFAULT_STORES_QUERY, scope: { type: "DIRECT" } });
  assert.deepEqual(direct.storeIds, []);
  assert.deepEqual(direct.storeTypes, ["DIRECT"]);
  // 유형 필터에서 직영을 뺐으면 0건이다(api 에 묻지 않는다 — getStores)
  assert.deepEqual(storeListQueryOf({ ...DEFAULT_STORES_QUERY, storeTypes: ["FRANCHISE"], scope: { type: "DIRECT" } }).storeTypes, []);
  assert.deepEqual(storeListQueryOf({ ...DEFAULT_STORES_QUERY, scope: { type: "STORE", storeId: 9 } }).storeIds, [9]);
  assert.deepEqual(storeListQueryOf({ ...DEFAULT_STORES_QUERY, storeIds: [1, 2] }).storeIds, [1, 2]);
  assert.deepEqual(pickedIdsOf({ storeIds: [], scope: { type: "ALL" } }), []);
});

test("점포상태 기본값은 서버가 고른 점포의 지금 상태로 정한다 — 폐점이 들면 「전체」, 주소에 적은 값은 그대로", () => {
  assert.deepEqual(read("/stores?scope=STORE%3A4", true).statuses, ["NOT_OPERATING", "OPERATING", "CLOSED"]);
  assert.equal(read("/stores?scope=STORE%3A4", true).statusesDefault, true);
  const given = read("/stores?scope=STORE%3A4&statuses=OPERATING", true);
  assert.deepEqual(given.statuses, ["OPERATING"]);
  assert.equal(given.statusesDefault, false);
});

test("사용자가 고친 점포상태는 폐점 여부와 상관없이 주소에 남는다 — 이 메뉴에서 폐점 처리해 브라우저 정보가 옛것이어도 체크가 되살아나지 않는다", () => {
  // 폐점 점포를 고른 채 「폐점」만 끈 것
  const off: StoresQuery = { ...DEFAULT_STORES_QUERY, storeIds: [4], statuses: ["NOT_OPERATING", "OPERATING"], statusesDefault: false };
  assert.deepEqual(read(storesHref(off), true).statuses, ["NOT_OPERATING", "OPERATING"]);
  // 고치지 않았으면 적지 않는다 — 서버가 정한다
  assert.equal(storesHref({ ...DEFAULT_STORES_QUERY, storeIds: [4] }), "/stores?storeIds=4");
});

test("고른 점포를 바꾸면 1쪽으로, 비우면 「전체」, 점포상태는 고치지 않았으면 기본값 그대로(서버가 정함)", () => {
  const start: StoresQuery = { ...DEFAULT_STORES_QUERY, page: 3, scope: { type: "DIRECT" } };
  const picked = withPickedStores(start, [4]);
  assert.equal(picked.page, 1);
  assert.equal(picked.scope, null);
  assert.equal(picked.statusesDefault, true);
  const cleared = withPickedStores(picked, []);
  assert.deepEqual(cleared.scope, { type: "ALL" });
  // 「전체」는 scope=ALL 이 아니라 빈 storeIds 로 적는다 — scope 는 헤더 범위를 뜻한다
  assert.equal(storesHref(cleared), "/stores?storeIds=");
  assert.deepEqual(read("/stores?storeIds=").scope, { type: "ALL" });
  assert.deepEqual(read("/stores?storeIds=&scope=DIRECT").scope, { type: "ALL" });
  // 사용자가 고친 점포상태는 그대로 둔다
  const edited = withPickedStores({ ...start, statuses: ["OPERATING"], statusesDefault: false }, [4]);
  assert.deepEqual(edited.statuses, ["OPERATING"]);
  assert.equal(edited.statusesDefault, false);
});

test("고른 점포 중 찾은 것만 남기고, 모두 없어졌으면 「전체」 — 헤더 범위로 다시 채우지 않는다", () => {
  const parsed = parseStoresQuery({ storeIds: "3,7" });
  const some = keepFoundStores(parsed, [7]);
  assert.deepEqual(some.query.storeIds, [7]);
  assert.equal(some.query.scope, null);
  assert.equal(some.missing, 1);
  const none = keepFoundStores(parsed, []);
  assert.deepEqual(none.query.storeIds, []);
  assert.deepEqual(none.query.scope, { type: "ALL" });
  assert.equal(none.missing, 2);
  assert.equal(storesHref(withDefaultStatuses(none.query, false)), "/stores?storeIds=");
  // 다 찾았으면 그대로
  assert.equal(keepFoundStores(parsed, [3, 7]).missing, 0);
});

test("범위의 점포 하나를 찾을 수 없으면(다른 BP 탭에서 복사한 주소) 「전체」로 보고 안내한다", () => {
  const missing = keepFoundStores(parseStoresQuery({ scope: "STORE:99" }), []);
  assert.deepEqual(missing.query.scope, { type: "ALL" });
  assert.equal(missing.missing, 1);
  // 직영 · 가맹 범위는 점포를 찾지 않는다
  assert.equal(keepFoundStores(parseStoresQuery({ scope: "DIRECT" }), []).missing, 0);
});

test("필터를 바꾸면 1쪽으로", () => {
  assert.equal(withStoreFilter({ ...DEFAULT_STORES_QUERY, page: 4 }, { storeTypes: ["DIRECT"] }).page, 1);
});

test("엑셀 주소 — 점포 조건과 점포상태를 늘 싣고 쪽 · 보기 · 건수는 뺀다. 중계 경로가 같은 조건으로 읽는다", () => {
  const q: StoresQuery = { ...DEFAULT_STORES_QUERY, page: 3, pageSize: 50, view: "table", storeIds: [4, 2], statuses: ["CLOSED"] };
  assert.equal(storesExcelHref(q), "/stores/excel?storeIds=4%2C2&statuses=CLOSED");
  assert.equal(storesExcelHref({ ...DEFAULT_STORES_QUERY, scope: { type: "DIRECT" } }), "/stores/excel?scope=DIRECT&statuses=NOT_OPERATING%2COPERATING");
  const excel = read(storesExcelHref(q).replace("/stores/excel", "/stores"));
  // 엑셀은 점포상태를 늘 적어 보내므로 중계 경로에서는 「적은 값」이다
  assert.deepEqual(excel, { ...q, page: 1, pageSize: 20, view: "cards", statusesDefault: false });
});

test("쪽 번호가 api 상한(1천만)을 넘으면 첫 쪽", () => {
  assert.equal(parseStoresQuery({ page: "99999999" }).page, 1);
  assert.equal(parseStoresQuery({ page: "10000000" }).page, 10_000_000);
});

test("돌아갈 목록 주소는 점포 목록만 — 다른 곳으로 보내려는 값은 기본 목록", () => {
  for (const bad of ["//evil.com", "https://e/stores", "/stores/1", "/stores#a", "/storesx", "javascript:alert(1)", undefined, ["/stores?page=2"]]) {
    assert.equal(backHrefOf(bad), "/stores", String(bad));
  }
  assert.equal(backHrefOf("/stores?page=2&view=table"), "/stores?page=2&view=table");
});

test("상세 · 등록으로 넘긴 목록 주소가 ?back= 를 거쳐 그대로 돌아온다", () => {
  const list = storesHref({ ...DEFAULT_STORES_QUERY, page: 3, view: "table", scope: { type: "DIRECT" } });
  const detail = detailHrefOf(list)(12);
  const back = new URL(detail, "http://x").searchParams.get("back") ?? undefined;
  assert.equal(backHrefOf(back), list);
  assert.equal(detailHrefOf("/stores")(12), "/stores/12");
  assert.equal(withBack("/stores/new", "/stores"), "/stores/new");
  assert.equal(withBack("/stores/new", "/stores?scope=DIRECT"), "/stores/new?back=%2Fstores%3Fscope%3DDIRECT");
});

test("상태 · 유형을 모두 끈 목록 왕복 — 새로 고침에 기본값(폐점 제외)으로 되살아나지 않고, 엑셀도 같은 조건을 보낸다", () => {
  const off: StoresQuery = { ...DEFAULT_STORES_QUERY, statuses: [], storeTypes: [], statusesDefault: false };
  const back = read(storesHref(off));
  assert.deepEqual(back.statuses, []);
  assert.deepEqual(back.storeTypes, []);
  const excel = new URL(storesExcelHref({ ...DEFAULT_STORES_QUERY, statuses: [] }), "http://x").searchParams;
  assert.equal(excel.get("statuses"), "");
});

test("고른 점포는 api 상한(1000개)까지 받는다", () => {
  const ids = Array.from({ length: 1200 }, (_, i) => i + 1);
  assert.equal(MAX_PICKED_STORES, 1000);
  assert.deepEqual(parseStoresQuery({ storeIds: ids.join(",") }).storeIds, ids.slice(0, 1000));
  assert.deepEqual(parseStoresQuery({ storeIds: "3,3,1" }).storeIds, [3, 1]);
});
