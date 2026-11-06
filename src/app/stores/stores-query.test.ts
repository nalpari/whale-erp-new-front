// node --test src/app/stores/stores-query.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { bpPath } from "../../lib/bp-path.ts";
import { withHeaderStoreSearch } from "../../lib/store-scope.ts";
import {
  backHrefOf,
  DEFAULT_STORES_QUERY,
  detailHrefOf,
  droppedStoreIds,
  fillScopeOf,
  keepFoundStores,
  MAX_PICKED_STORES,
  parseStoresQuery,
  pickedIdsOf,
  resolveStoresQuery,
  scopeTypeMismatch,
  storeListQueryOf,
  storesExcelHref,
  storesHref,
  withBack,
  withDefaultStatuses,
  withPickedStores,
  withScopeCondition,
  withStatuses,
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
  const q: StoresQuery = { page: 3, pageSize: 50, storeIds: [12, 5], bizRegistrationNumber: "12345", statuses: ["CLOSED"], storeTypes: ["DIRECT"], view: "table", scope: null, storesCleared: false, statusesDefault: false };
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
  assert.equal(cleared.scope, null);
  assert.equal(cleared.storesCleared, true);
  // 「전체」는 scope=ALL 이 아니라 빈 storeIds 로 적는다 — scope 는 헤더 범위를 뜻한다
  assert.equal(storesHref(cleared), "/stores?storeIds=");
  assert.equal(read("/stores?storeIds=").storesCleared, true);
  // 목록에서 비운 것이 헤더 범위보다 앞선다
  assert.equal(read("/stores?storeIds=&scope=DIRECT").scope, null);
  assert.equal(read("/stores?storeIds=&scope=DIRECT").storesCleared, true);
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
  assert.equal(some.missingCount, 1);
  const none = keepFoundStores(parsed, []);
  assert.deepEqual(none.query.storeIds, []);
  assert.equal(none.query.scope, null);
  assert.equal(none.query.storesCleared, true);
  assert.equal(none.missingCount, 2);
  assert.equal(storesHref(withDefaultStatuses(none.query, false)), "/stores?storeIds=");
  // 다 찾았으면 그대로
  assert.equal(keepFoundStores(parsed, [3, 7]).missingCount, 0);
});

test("범위의 점포 하나를 찾을 수 없으면(다른 BP 탭에서 복사한 주소) 「전체」로 보고 안내한다", () => {
  const missing = keepFoundStores(parseStoresQuery({ scope: "STORE:99" }), []);
  assert.equal(missing.query.scope, null);
  assert.equal(missing.query.storesCleared, true);
  assert.equal(missing.missingCount, 1);
  assert.equal(missing.fromScope, true);
  // 직영 · 가맹 범위는 점포를 찾지 않는다
  assert.equal(keepFoundStores(parseStoresQuery({ scope: "DIRECT" }), []).missingCount, 0);
});

test("목록 서버의 조합 — 찾은 점포로 칩 · 폐점 기본값 · 뺀 점포를 한 번에 정한다", () => {
  const found = (storeId: number, storeStatusCode = "OPERATING") => ({ storeId, name: `점포${storeId}`, storeCode: `ST${storeId}`, storeStatusCode });
  // 범위의 점포 하나가 폐점 — 점포상태 기본값 「전체」, api 는 그 점포
  const closed = resolveStoresQuery(parseStoresQuery({ scope: "STORE:4" }), [found(4, "CLOSED")]);
  assert.deepEqual(closed.query.statuses, ["NOT_OPERATING", "OPERATING", "CLOSED"]);
  assert.deepEqual(storeListQueryOf(closed.query).storeIds, [4]);
  assert.deepEqual(closed.picked, [{ storeId: 4, name: "점포4", storeCode: "ST4" }]);
  // 고른 점포 3(폐점) · 7(없음) — 3만 남기고 상태 「전체」, 뺀 점포 1곳
  const some = resolveStoresQuery(parseStoresQuery({ storeIds: "3,7" }), [found(3, "CLOSED")]);
  assert.deepEqual(some.query.storeIds, [3]);
  assert.deepEqual(some.query.statuses, ["NOT_OPERATING", "OPERATING", "CLOSED"]);
  assert.equal(some.missingCount, 1);
  assert.equal(some.fromScope, false);
  // 범위의 점포를 못 찾음 — 「전체」, 상태는 기본값(폐점 제외), api 에 점포 조건 없음
  const gone = resolveStoresQuery(parseStoresQuery({ scope: "STORE:99" }), []);
  assert.equal(gone.query.storesCleared, true);
  assert.deepEqual(gone.query.statuses, ["NOT_OPERATING", "OPERATING"]);
  assert.deepEqual(storeListQueryOf(gone.query).storeIds, []);
  assert.equal(gone.fromScope, true);
  // 고른 순서대로 칩을 그린다
  assert.deepEqual(resolveStoresQuery(parseStoresQuery({ storeIds: "7,3" }), [found(3), found(7)]).picked.map((p) => p.storeId), [7, 3]);
});

test("필터가 헤더 범위로 채울지 — 주소에 점포 조건이 없고 헤더가 전체가 아닐 때만", () => {
  const direct = { type: "DIRECT" } as const;
  assert.deepEqual(fillScopeOf(read("/stores"), direct), direct);
  assert.equal(fillScopeOf(read("/stores"), { type: "ALL" }), null);
  // 목록에서 비운 「전체」 · 등록 · 삭제 뒤는 다시 채우지 않는다
  assert.equal(fillScopeOf(read("/stores?storeIds="), direct), null);
  assert.equal(fillScopeOf(read("/stores?scope=ALL"), direct), null);
  // 주소의 범위 · 고른 점포가 앞선다
  assert.equal(fillScopeOf(read("/stores?scope=FRANCHISE"), direct), null);
  assert.equal(fillScopeOf(read("/stores?storeIds=3"), direct), null);
});

test("헤더 범위와 고른 점포유형이 겹치지 않으면 그 이유로 0건 — 유형을 하나도 안 고른 것과 가른다", () => {
  assert.equal(scopeTypeMismatch({ ...DEFAULT_STORES_QUERY, scope: { type: "DIRECT" }, storeTypes: ["FRANCHISE"] }), true);
  assert.equal(scopeTypeMismatch({ ...DEFAULT_STORES_QUERY, scope: { type: "DIRECT" } }), false);
  assert.equal(scopeTypeMismatch({ ...DEFAULT_STORES_QUERY, scope: { type: "DIRECT" }, storeTypes: [] }), false);
  // 목록에서 고른 점포가 있으면 범위를 쓰지 않는다
  assert.equal(scopeTypeMismatch({ ...DEFAULT_STORES_QUERY, storeIds: [3], scope: null, storeTypes: ["FRANCHISE"] }), false);
});

test("점포상태 · 점포 조건은 전용 함수로 — 상태를 고치면 주소에 남고, 범위를 걸면 고른 점포를 비운다", () => {
  const edited = withStatuses({ ...DEFAULT_STORES_QUERY, page: 3 }, ["OPERATING"]);
  assert.equal(edited.page, 1);
  assert.equal(edited.statusesDefault, false);
  assert.equal(storesHref(edited), "/stores?statuses=OPERATING");
  const scoped = withScopeCondition({ ...DEFAULT_STORES_QUERY, storeIds: [3], page: 2 }, { type: "DIRECT" });
  assert.deepEqual(scoped.storeIds, []);
  assert.deepEqual(scoped.scope, { type: "DIRECT" });
  assert.equal(scoped.page, 1);
  assert.equal(storesHref(scoped), "/stores?scope=DIRECT");
});

test("엑셀 중계 경로가 api 로 보내는 조건 — 범위는 점포유형 · 점포 하나는 storeIds, 「전체」는 빈 storeIds", () => {
  const apiOf = (q: StoresQuery) => storeListQueryOf(read(storesExcelHref(q).replace("/stores/excel", "/stores")));
  assert.deepEqual(apiOf({ ...DEFAULT_STORES_QUERY, scope: { type: "DIRECT" } }).storeTypes, ["DIRECT"]);
  assert.deepEqual(apiOf({ ...DEFAULT_STORES_QUERY, scope: { type: "STORE", storeId: 7 } }).storeIds, [7]);
  assert.ok(storesExcelHref({ ...DEFAULT_STORES_QUERY, scope: { type: "STORE", storeId: 7 } }).includes("scope=STORE%3A7"));
  assert.ok(storesExcelHref({ ...DEFAULT_STORES_QUERY, storesCleared: true }).includes("storeIds="));
  assert.ok(storesExcelHref({ ...DEFAULT_STORES_QUERY, scope: { type: "ALL" } }).includes("scope=ALL"));
});

test("등록 뒤 상세에 넘긴 목록 주소(?back=)가 두 번 인코딩돼도 점포 조건 없이 돌아와 헤더 범위로 채워진다", () => {
  const params = new URLSearchParams({ back: withHeaderStoreSearch("/stores?storeIds=3&scope=DIRECT&view=table") });
  const back = new URL(`/stores/1?${params}`, "http://x").searchParams.get("back") ?? undefined;
  assert.equal(backHrefOf(back), "/stores?view=table");
  const query = read(backHrefOf(back));
  assert.equal(query.storesCleared, false);
  // 필터가 헤더 범위로 다시 채운다
  assert.deepEqual(fillScopeOf(query, { type: "DIRECT" }), { type: "DIRECT" });
});

test("헤더가 실어 온 전체(scope=ALL)는 목록을 조작해도 scope=ALL 로 남는다 — 뒤로 가기에 헤더가 전체로 따라오게", () => {
  const fromHeader = read("/stores?scope=ALL");
  assert.deepEqual(fromHeader.scope, { type: "ALL" });
  assert.equal(fromHeader.storesCleared, false);
  // 쪽 넘기기 · 보기 · 점포유형을 바꿔도 범위가 주소에 남는다(목록에서 비운 「전체」 storeIds= 로 바뀌지 않는다)
  assert.equal(storesHref({ ...fromHeader, page: 2 }), "/stores?scope=ALL&page=2");
  assert.equal(storesHref(withStoreFilter(fromHeader, { storeTypes: ["DIRECT"] })), "/stores?scope=ALL&storeTypes=DIRECT");
  // 헤더의 전체는 다시 채우지 않는다
  assert.equal(fillScopeOf(fromHeader, { type: "DIRECT" }), null);
  // 목록에서 점포를 다 비우면 그때만 storeIds=
  assert.equal(storesHref(withPickedStores(fromHeader, [])), "/stores?storeIds=");
});

test("서버가 찾지 못해 뺀 점포는 점포 고르기 후보에서 숨긴다 — 다시 골라 같은 주소로 가면 칩이 어긋난다", () => {
  const pick = (storeId: number) => ({ storeId, name: `점포${storeId}`, storeCode: `ST${storeId}` });
  assert.deepEqual(droppedStoreIds([3, 7], [pick(3)]), [7]);
  assert.deepEqual(droppedStoreIds([3, 7], [pick(3), pick(7)]), []);
  assert.deepEqual(droppedStoreIds([], []), []);
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

test("돌아갈 목록 주소에는 탭 BP 를 싣지 않는다 — 이동할 때만 bpPath 로 씌운다", () => {
  // BP 를 실은 주소를 back 으로 넘기면 기본 목록이 된다(조건을 잃는다) — 넘기는 쪽이 옛 경로를 넘겨야 한다
  assert.equal(backHrefOf("/bp/8/stores?page=2"), "/stores");
  // 씌운 상세 주소의 back 은 옛 경로 그대로다
  assert.equal(bpPath(8, withBack("/stores/12/edit", "/stores?page=2")), "/bp/8/stores/12/edit?back=%2Fstores%3Fpage%3D2");
  assert.equal(bpPath(8, withBack("/stores/12", "/stores")), "/bp/8/stores/12");
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
