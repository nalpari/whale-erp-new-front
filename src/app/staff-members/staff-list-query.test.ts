// node --test src/app/staff-members/staff-list-query.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_STAFF_LIST_QUERY, parseStaffListQuery, staffListSearch, toStaffListSearch, withFilter } from "./staff-list-query.ts";

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
  assert.equal(parseStaffListQuery({ store: ["서초", "판교"] }).store, "서초");
});

test("검색어는 앞뒤 공백을 지운다", () => {
  assert.equal(parseStaffListQuery({ keyword: "  서지안 " }).keyword, "서지안");
});

test("parse(toSearch(q)) 는 q", () => {
  const q = {
    ...DEFAULT_STAFF_LIST_QUERY,
    store: "판교",
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

test("상세가 들고 온 목록 조건은 거른 뒤 돌려준다 — 「목록」 주소 · 재직 이력 링크가 쓴다", () => {
  assert.equal(staffListSearch({}), "");
  assert.equal(staffListSearch({ keyword: "서지안", page: "3" }), "?keyword=%EC%84%9C%EC%A7%80%EC%95%88&page=3");
  // 모르는 이름 · 이상한 값은 따라오지 않는다
  assert.equal(staffListSearch({ next: "//evil.example", page: "-1", employmentStatus: "X" }), "");
});

test("점포명과 함께 맞는 점포 id 가 URL 에 남는다", () => {
  const params = new URLSearchParams(toStaffListSearch({ ...DEFAULT_STAFF_LIST_QUERY, store: "서초", storeIds: [7, 1] }));
  assert.equal(params.get("store"), "서초");
  assert.equal(params.get("storeIds"), "7,1");
});

test("맞는 점포가 없으면 storeIds 가 빈 값으로 남는다 — 새로고침해도 0건", () => {
  const search = toStaffListSearch({ ...DEFAULT_STAFF_LIST_QUERY, store: "없는점", storeIds: [] });
  assert.equal(new URLSearchParams(search).get("storeIds"), "");
  assert.deepEqual(parseStaffListQuery({ store: "없는점", storeIds: "" }).storeIds, []);
});

test("점포명이 없으면 storeIds 는 쓰지 않는다", () => {
  assert.equal(new URLSearchParams(toStaffListSearch({ ...DEFAULT_STAFF_LIST_QUERY, storeIds: [1] })).has("storeIds"), false);
  assert.deepEqual(parseStaffListQuery({ storeIds: "1,2" }).storeIds, []);
});

test("storeIds 의 이상한 값 · 겹친 값은 버린다", () => {
  assert.deepEqual(parseStaffListQuery({ store: "서초", storeIds: "3,abc,0,-1,3,2147483648,1.5,9" }).storeIds, [3, 9]);
});

test("점포명만 있고 storeIds 가 없으면(이 PR 전 주소) null — 필터가 점포 목록에서 채운다", () => {
  assert.equal(parseStaffListQuery({ store: "판교" }).storeIds, null);
  // 아직 못 찾은 상태는 URL 에 빈 값으로 굳히지 않는다
  assert.equal(new URLSearchParams(toStaffListSearch({ ...DEFAULT_STAFF_LIST_QUERY, store: "판교", storeIds: null })).has("storeIds"), false);
});

test("검색어는 api 상한 50자로 자른다", () => {
  assert.equal(parseStaffListQuery({ keyword: "가".repeat(60) }).keyword, "가".repeat(50));
  assert.equal(parseStaffListQuery({ store: "나".repeat(60) }).store, "나".repeat(50));
});

test("쪽은 api 상한 1,000,000 을 넘으면 1", () => {
  assert.equal(parseStaffListQuery({ page: "1000000" }).page, 1_000_000);
  assert.equal(parseStaffListQuery({ page: "1000001" }).page, 1);
});
