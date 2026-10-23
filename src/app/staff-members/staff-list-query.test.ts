// node --test src/app/staff-members/staff-list-query.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { weekHref } from "./[id]/summary-view.ts";
import { backHrefOf, detailListHrefOf, DEFAULT_STAFF_LIST_QUERY, parseStaffListQuery, toStaffListSearch, withBack, withFilter, withPickedStores, withScopeCondition } from "./staff-list-query.ts";

const pick = (q: { storeIds: number[]; storesCleared: boolean; scope: unknown }) => ({ storeIds: q.storeIds, storesCleared: q.storesCleared, scope: q.scope });

test("빈 URL 은 기본값 — 재직, 모든 체크, 1쪽, 20건", () => {
  assert.deepEqual(parseStaffListQuery({}), DEFAULT_STAFF_LIST_QUERY);
  assert.equal(DEFAULT_STAFF_LIST_QUERY.employmentStatus, "EMPLOYED");
  assert.equal(DEFAULT_STAFF_LIST_QUERY.pageSize, 20);
});

test("기본값은 URL 에서 빠진다", () => {
  assert.equal(toStaffListSearch(DEFAULT_STAFF_LIST_QUERY), "");
});

test("고른 값만 URL 에 남는다", () => {
  const search = toStaffListSearch({
    ...DEFAULT_STAFF_LIST_QUERY,
    keyword: "서지안",
    joinGroups: ["LINK_HOLD", "JOINED"],
    employmentStatus: "ALL",
    page: 2,
    pageSize: 50,
  });
  const params = new URLSearchParams(search);
  assert.equal(params.get("keyword"), "서지안");
  assert.equal(params.get("joinGroup"), "JOINED,LINK_HOLD"); // 화면 순서로 정렬
  assert.equal(params.get("employmentStatus"), "ALL");
  assert.equal(params.get("page"), "2");
  assert.equal(params.get("pageSize"), "50");
  assert.equal(params.has("employmentType"), false);
});

test("체크를 모두 끄면 빈 값으로 남는다 — 새로고침해도 0건 조건", () => {
  const q = { ...DEFAULT_STAFF_LIST_QUERY, joinGroups: [] };
  const search = toStaffListSearch(q);
  assert.equal(search, "?joinGroup=");
  assert.deepEqual(parseStaffListQuery({ joinGroup: "" }).joinGroups, []);
});

test("모르는 묶음은 버리고 아는 것만 남긴다", () => {
  assert.deepEqual(parseStaffListQuery({ joinGroup: "NOPE,LINK_HOLD" }).joinGroups, ["LINK_HOLD"]);
});

test("이상한 값은 그 칸만 기본값", () => {
  const q = parseStaffListQuery({ page: "0", pageSize: "7", employmentStatus: "SOMETIMES", keyword: "오세라" });
  assert.equal(q.page, 1);
  assert.equal(q.pageSize, 20);
  assert.equal(q.employmentStatus, "EMPLOYED");
  assert.equal(q.keyword, "오세라");
  assert.equal(parseStaffListQuery({ page: "2.5" }).page, 1);
  assert.equal(parseStaffListQuery({ page: "abc" }).page, 1);
});

test("같은 이름이 여럿이면 첫 값", () => {
  assert.equal(parseStaffListQuery({ keyword: ["서지안", "오세라"] }).keyword, "서지안");
});

test("검색어는 앞뒤 공백을 지운다", () => {
  assert.equal(parseStaffListQuery({ keyword: "  서지안 " }).keyword, "서지안");
});

test("parse(toSearch(q)) 는 q", () => {
  const q = {
    ...DEFAULT_STAFF_LIST_QUERY,
    storeIds: [3, 12],
    employmentTypes: ["PART_TIME" as const],
    joinGroups: ["INVITED" as const, "UNDER_AGE" as const],
    employmentStatus: "RETIRED" as const,
    page: 3,
    pageSize: 100 as const,
  };
  const params = Object.fromEntries(new URLSearchParams(toStaffListSearch(q)));
  assert.deepEqual(parseStaffListQuery(params), q);
});

test("필터를 바꾸면 page 를 지운다 — 4쪽에서 거르면 빈 쪽이 보이지 않게", () => {
  const q = withFilter({ ...DEFAULT_STAFF_LIST_QUERY, page: 4 }, { keyword: "서지안" });
  assert.equal(q.page, 1);
  assert.equal(q.keyword, "서지안");
});

test("점포 조건 — 고른 점포 · 비운 「전체」 · 헤더 범위 · 정해지지 않음", () => {
  assert.deepEqual(pick(parseStaffListQuery({ storeIds: "7,1" })), { storeIds: [7, 1], storesCleared: false, scope: null });
  assert.deepEqual(pick(parseStaffListQuery({ storeIds: "" })), { storeIds: [], storesCleared: true, scope: null });
  assert.deepEqual(pick(parseStaffListQuery({ scope: "DIRECT" })), { storeIds: [], storesCleared: false, scope: { type: "DIRECT" } });
  assert.deepEqual(pick(parseStaffListQuery({ scope: "STORE:12" })), { storeIds: [], storesCleared: false, scope: { type: "STORE", storeId: 12 } });
  assert.deepEqual(pick(parseStaffListQuery({})), { storeIds: [], storesCleared: false, scope: null });
  // 모르는 범위는 정해지지 않은 것 — 필터가 헤더 범위로 채운다
  assert.equal(parseStaffListQuery({ scope: "NOPE" }).scope, null);
});

test("고른 점포 · 빈 storeIds 가 범위보다 앞선다", () => {
  assert.deepEqual(pick(parseStaffListQuery({ storeIds: "3", scope: "FRANCHISE" })), { storeIds: [3], storesCleared: false, scope: null });
  assert.deepEqual(pick(parseStaffListQuery({ storeIds: "", scope: "FRANCHISE" })), { storeIds: [], storesCleared: true, scope: null });
});

test("점포 조건을 주소로 — 고른 점포 → storeIds, 비운 「전체」 → 빈 storeIds, 범위 → scope", () => {
  assert.equal(toStaffListSearch({ ...DEFAULT_STAFF_LIST_QUERY, storeIds: [7, 1] }), "?storeIds=7%2C1");
  assert.equal(toStaffListSearch({ ...DEFAULT_STAFF_LIST_QUERY, storesCleared: true }), "?storeIds=");
  assert.equal(toStaffListSearch({ ...DEFAULT_STAFF_LIST_QUERY, scope: { type: "ALL" } }), "?scope=ALL");
  assert.equal(toStaffListSearch({ ...DEFAULT_STAFF_LIST_QUERY, scope: { type: "STORE", storeId: 12 } }), "?scope=STORE%3A12");
  for (const q of [
    { ...DEFAULT_STAFF_LIST_QUERY, storesCleared: true },
    { ...DEFAULT_STAFF_LIST_QUERY, scope: { type: "FRANCHISE" as const } },
  ])
    assert.deepEqual(parseStaffListQuery(Object.fromEntries(new URLSearchParams(toStaffListSearch(q)))), q);
});

test("storeIds 의 이상한 값 · 겹친 값은 버리고 1000개에서 자른다", () => {
  assert.deepEqual(parseStaffListQuery({ storeIds: "3,abc,0,-1,3,2147483648,1.5,9" }).storeIds, [3, 9]);
  const many = Array.from({ length: 1001 }, (_, i) => i + 1).join(",");
  assert.equal(parseStaffListQuery({ storeIds: many }).storeIds.length, 1000);
  // 이상한 값뿐이면 비운 「전체」다(api 400 을 내지 않게)
  assert.deepEqual(pick(parseStaffListQuery({ storeIds: "abc" })), { storeIds: [], storesCleared: true, scope: null });
});

test("예전 점포명 주소(?store=)는 점포 조건을 읽지 않는다 — 필터가 상단 범위로 채운다", () => {
  assert.deepEqual(pick(parseStaffListQuery({ store: "판교", storeIds: "3,7" })), { storeIds: [], storesCleared: false, scope: null });
  assert.deepEqual(pick(parseStaffListQuery({ store: "없는점", storeIds: "" })), { storeIds: [], storesCleared: false, scope: null });
  assert.equal(parseStaffListQuery({ store: "판교", scope: "DIRECT" }).scope, null);
  // 주소에 다시 적지 않는다
  assert.equal(toStaffListSearch(parseStaffListQuery({ store: "판교", keyword: "서지안" })), "?keyword=%EC%84%9C%EC%A7%80%EC%95%88");
});

test("고른 점포를 바꾸면 범위를 지우고 첫 쪽 — 다 비우면 「전체」(빈 storeIds)", () => {
  const scoped = { ...DEFAULT_STAFF_LIST_QUERY, scope: { type: "DIRECT" as const }, page: 3 };
  assert.deepEqual(pick(withPickedStores(scoped, [5])), { storeIds: [5], storesCleared: false, scope: null });
  assert.equal(withPickedStores(scoped, [5]).page, 1);
  assert.deepEqual(pick(withPickedStores(scoped, [])), { storeIds: [], storesCleared: true, scope: null });
  assert.equal(toStaffListSearch(withPickedStores(scoped, [])), "?storeIds=");
});

test("헤더 범위로 채우면 고른 점포 · 비운 「전체」를 지운다", () => {
  const q = withScopeCondition({ ...DEFAULT_STAFF_LIST_QUERY, storeIds: [1], page: 2 }, { type: "FRANCHISE" });
  assert.deepEqual(pick(q), { storeIds: [], storesCleared: false, scope: { type: "FRANCHISE" } });
  assert.equal(q.page, 1);
});

test("상세 링크는 목록 주소를 ?back= 으로 싣는다 — 기본 목록이면 싣지 않는다", () => {
  assert.equal(withBack("/staff-members/5", "/staff-members"), "/staff-members/5");
  assert.equal(withBack("/staff-members/5", "/staff-members?storeIds=3&page=2"), "/staff-members/5?back=%2Fstaff-members%3FstoreIds%3D3%26page%3D2");
});

test("상세의 「목록」 주소(backHrefOf)는 직원 목록 주소만 거른 뒤 돌려준다", () => {
  assert.equal(backHrefOf(undefined), "/staff-members");
  assert.equal(backHrefOf("/staff-members"), "/staff-members");
  assert.equal(backHrefOf("/staff-members?scope=DIRECT&page=3"), "/staff-members?scope=DIRECT&page=3");
  assert.equal(backHrefOf("/staff-members?storeIds="), "/staff-members?storeIds=");
  // 다른 곳 · 여러 값 · 모르는 이름 · 이상한 값은 따라오지 않는다
  assert.equal(backHrefOf("//evil.example"), "/staff-members");
  assert.equal(backHrefOf("/contracts?page=2"), "/staff-members");
  assert.equal(backHrefOf(["/staff-members?page=2"]), "/staff-members");
  assert.equal(backHrefOf("/staff-members?next=//evil.example&page=-1&employmentStatus=X"), "/staff-members");
  // 목록 주소 그대로 왕복한다
  const list = "/staff-members?storeIds=3%2C7&keyword=%EC%84%9C%EC%A7%80%EC%95%88&employmentStatus=ALL&page=2";
  assert.equal(backHrefOf(new URLSearchParams(withBack("/staff-members/5", list).split("?")[1]).get("back") ?? ""), list);
});

test("검색어는 api 상한 50자로 자른다", () => {
  assert.equal(parseStaffListQuery({ keyword: "가".repeat(60) }).keyword, "가".repeat(50));
});

test("쪽은 api 상한 1,000,000 을 넘으면 1", () => {
  assert.equal(parseStaffListQuery({ page: "1000000" }).page, 1_000_000);
  assert.equal(parseStaffListQuery({ page: "1000001" }).page, 1);
});

test("backHrefOf — 직원 목록 주소가 아니면 기본 목록", () => {
  for (const raw of [
    "/staff-members/5",
    "/staff-membersevil",
    "/staff-members/../admin",
    "https://evil.example/staff-members",
    "/\\evil.example",
    " /staff-members",
    "%2Fstaff-members%3Fpage%3D2",
    "/staff-members#x",
  ])
    assert.equal(backHrefOf(raw), "/staff-members", raw);
  // 조각(#)이 붙은 주소는 받지 않는다 — 쿼리가 있어도 기본 목록
  assert.equal(backHrefOf("/staff-members?page=2#x"), "/staff-members");
});

test("backHrefOf — 같은 이름이 여럿이면 목록처럼 첫 값", () => {
  assert.equal(backHrefOf("/staff-members?page=2&page=5"), "/staff-members?page=2");
  assert.equal(backHrefOf("/staff-members?storeIds=3&storeIds=7"), "/staff-members?storeIds=3");
});

test("backHrefOf — 옛 ?store= 는 점포 조건째 버리고, 고른 점포가 범위보다 앞선다", () => {
  assert.equal(backHrefOf("/staff-members?store=판교&storeIds=3&page=2"), "/staff-members?page=2");
  assert.equal(backHrefOf("/staff-members?storeIds=3&scope=DIRECT"), "/staff-members?storeIds=3");
});

test("storeIds 1000개 자르기 — 앞에서부터 1000개, 겹친 값은 하나로 센다", () => {
  const ids = parseStaffListQuery({ storeIds: Array.from({ length: 1001 }, (_, i) => i + 1).join(",") }).storeIds;
  assert.equal(ids.length, 1000);
  assert.equal(ids[0], 1);
  assert.equal(ids[999], 1000);
  assert.equal(ids.includes(1001), false);
  const dup = parseStaffListQuery({ storeIds: ["1", ...Array.from({ length: 1001 }, (_, i) => String(i + 1))].join(",") }).storeIds;
  assert.equal(dup.length, 1000);
  assert.equal(dup[999], 1000);
});

test("이상한 storeIds 뿐이면 범위가 있어도 비운 「전체」", () => {
  assert.deepEqual(pick(parseStaffListQuery({ storeIds: "abc", scope: "DIRECT" })), { storeIds: [], storesCleared: true, scope: null });
});

test("상세 [목록] — ?back= 이 있으면 그 목록 주소", () => {
  assert.equal(detailListHrefOf({ back: "/staff-members?storeIds=3&page=2" }), "/staff-members?storeIds=3&page=2");
  // back 이 있으면 상세 주소에 붙은 다른 값은 보지 않는다
  assert.equal(detailListHrefOf({ back: "/staff-members?scope=DIRECT", keyword: "홍", week: "2026-10-26" }), "/staff-members?scope=DIRECT");
});

test("상세 [목록] — ?back= 이 없으면 상세 주소에 붙은 예전 형식 목록 조건을 목록 규칙으로", () => {
  assert.equal(detailListHrefOf({ keyword: "홍", page: "3" }), "/staff-members?keyword=%ED%99%8D&page=3");
  // 같은 이름 여럿은 첫 값, 모르는 이름 · 예전 ?store= · 상세 전용 week 는 버린다
  assert.equal(
    detailListHrefOf({ page: ["2", "5"], next: "//evil.example", store: "판교", storeIds: "3", week: "2026-10-26", employmentStatus: "ALL" }),
    "/staff-members?employmentStatus=ALL&page=2",
  );
  assert.equal(detailListHrefOf({ storeIds: "3,7", scope: "DIRECT" }), "/staff-members?storeIds=3%2C7");
});

test("상세 [목록] — 둘 다 없거나 week 만 있으면 기본 목록", () => {
  assert.equal(detailListHrefOf({}), "/staff-members");
  assert.equal(detailListHrefOf({ week: "2026-10-26" }), "/staff-members");
});

test("상세 [목록] — back 이 이상한 값이면 기본 목록이고 예전 조건으로 떨어지지 않는다", () => {
  assert.equal(detailListHrefOf({ back: "//evil.example", keyword: "홍" }), "/staff-members");
  assert.equal(detailListHrefOf({ back: "", page: "3" }), "/staff-members");
  assert.equal(detailListHrefOf({ back: ["/staff-members?page=2", "/staff-members?page=3"], page: "4" }), "/staff-members");
});

test("주 넘김(weekHref)은 ?back= 도 예전 형식 목록 조건도 잃지 않는다", () => {
  const today = "2026-10-22";
  const back = Object.fromEntries(new URLSearchParams(weekHref({ back: "/staff-members?storeIds=3&page=2" }, "2026-10-26", today).slice(1)));
  assert.equal(back.week, "2026-10-26");
  assert.equal(detailListHrefOf(back), "/staff-members?storeIds=3&page=2");
  const legacy = Object.fromEntries(new URLSearchParams(weekHref({ keyword: "홍", page: "3", week: "2026-10-26" }, "2026-10-12", today).slice(1)));
  assert.equal(legacy.week, "2026-10-12");
  assert.equal(detailListHrefOf(legacy), "/staff-members?keyword=%ED%99%8D&page=3");
});
