// node --test src/app/staff-members/staff-list-query.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_STAFF_LIST_QUERY, parseStaffListQuery, toStaffListSearch, withFilter } from "./staff-list-query.ts";

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
