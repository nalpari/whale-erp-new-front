// node --test src/app/facilities/facility-list-query.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  backHrefOf,
  DEFAULT_FACILITY_LIST_QUERY,
  emptyPageHref,
  facilityListApiSearch,
  isUnfiltered,
  parseFacilityListQuery,
  toFacilityListSearch,
  withFilter,
  withPickedStores,
} from "./facility-list-query.ts";

test("기본 조건은 주소에서 빠지고, 읽으면 기본값이다", () => {
  assert.equal(toFacilityListSearch(DEFAULT_FACILITY_LIST_QUERY), "");
  assert.deepEqual(parseFacilityListQuery({}), DEFAULT_FACILITY_LIST_QUERY);
});

test("주소 ↔ 조건 — 고른 점포 · 운영상태 · 그룹 · 분류 · 이름 · 쪽", () => {
  const q = parseFacilityListQuery({ storeIds: "3,5,3", status: "STORED", group: "STORE_EQUIPMENT", category: "GRINDER", keyword: " 그라인더 ", page: "2", pageSize: "100" });
  assert.deepEqual(q.storeIds, [3, 5]);
  assert.equal(q.keyword, "그라인더");
  assert.equal(toFacilityListSearch(q), "?storeIds=3%2C5&status=STORED&group=STORE_EQUIPMENT&category=GRINDER&keyword=%EA%B7%B8%EB%9D%BC%EC%9D%B8%EB%8D%94&page=2&pageSize=100");
});

test("이상한 값은 그 칸만 기본값 — 그룹 없는 분류 · 모르는 그룹 · 없는 쪽 크기", () => {
  const q = parseFacilityListQuery({ category: "GRINDER", group: "OTHER", pageSize: "20", status: "운영" });
  assert.equal(q.group, "");
  assert.equal(q.category, "");
  assert.equal(q.pageSize, 50);
  assert.equal(q.status, "");
});

test("api 쿼리 — 코드 이름으로 바꾸고, 점포 하나 범위는 storeIds", () => {
  const q = parseFacilityListQuery({ scope: "STORE:7", group: "STORE_FACILITY", category: "HVAC" });
  assert.equal(facilityListApiSearch(q), "storeIds=7&facilityGroupCode=STORE_FACILITY&facilityCategoryCode=HVAC&page=1&pageSize=50");
});

test("직영 · 가맹 범위는 점포로 풀기 전이라 조회하지 않는다(null)", () => {
  assert.equal(facilityListApiSearch(parseFacilityListQuery({ scope: "DIRECT" })), null);
  assert.ok(facilityListApiSearch(parseFacilityListQuery({ scope: "ALL" })));
});

test("그룹을 바꾸면 분류는 「전체」, 쪽은 1로", () => {
  const q = { ...parseFacilityListQuery({ group: "STORE_EQUIPMENT", category: "GRINDER" }), page: 3 };
  const next = withFilter(q, { group: "STORE_FACILITY" });
  assert.equal(next.category, "");
  assert.equal(next.page, 1);
  assert.equal(withFilter(q, { keyword: "a" }).category, "GRINDER");
});

test("고른 점포를 모두 빼면 비운 「전체」(빈 storeIds)", () => {
  const q = withPickedStores(DEFAULT_FACILITY_LIST_QUERY, []);
  assert.equal(toFacilityListSearch(q), "?storeIds=");
  assert.equal(parseFacilityListQuery({ storeIds: "" }).storesCleared, true);
});

test("돌아갈 주소는 시설물 목록 주소만", () => {
  assert.equal(backHrefOf("/facilities?page=2"), "/facilities?page=2");
  assert.equal(backHrefOf("//evil.example"), "/facilities");
  assert.equal(backHrefOf(["/facilities"]), "/facilities");
});

test("빈 쪽이면 남은 마지막 쪽으로, 조건 없음 판정", () => {
  const q = { ...DEFAULT_FACILITY_LIST_QUERY, page: 4 };
  assert.equal(emptyPageHref(q, 0, 120), "/facilities?page=3");
  assert.equal(emptyPageHref(q, 1, 120), null);
  assert.equal(isUnfiltered(DEFAULT_FACILITY_LIST_QUERY), true);
  assert.equal(isUnfiltered({ ...DEFAULT_FACILITY_LIST_QUERY, keyword: "a" }), false);
});
