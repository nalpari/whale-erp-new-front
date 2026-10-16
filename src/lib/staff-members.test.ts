// node --test src/lib/staff-members.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPLOYMENT_TYPES, JOIN_GROUPS, kstToday, staffListApiSearch, storeIdsByName, type StaffListQuery } from "./staff-members.ts";

const base: StaffListQuery = {
  store: "",
  storeIds: [],
  keyword: "",
  employmentTypes: [...EMPLOYMENT_TYPES],
  joinGroups: [...JOIN_GROUPS],
  employmentStatus: "EMPLOYED",
  page: 1,
  pageSize: 20,
};
const paramsOf = (q: StaffListQuery) => {
  const search = staffListApiSearch(q);
  assert.notEqual(search, null);
  return new URLSearchParams(search ?? "");
};

test("기본 조건은 재직 · 1쪽 · 20건만 보낸다 — 모두 고른 체크는 빼서 전체", () => {
  assert.deepEqual(Object.fromEntries(paramsOf(base)), { employmentStatus: "EMPLOYED", page: "1", pageSize: "20" });
});

test("재직 상태 전체는 파라미터를 뺀다", () => {
  assert.equal(paramsOf({ ...base, employmentStatus: "ALL" }).has("employmentStatus"), false);
});

test("묶음은 그 상태들을 쉼표 목록으로 — 초대 발송 = INVITED · EXPIRED · REJECTED", () => {
  const params = paramsOf({ ...base, joinGroups: ["INVITED", "LINK_HOLD"] });
  assert.equal(params.get("joinState"), "INVITED,EXPIRED,REJECTED,LINK_HOLD");
});

test("고용형태 하나만 고르면 그것만", () => {
  assert.equal(paramsOf({ ...base, employmentTypes: ["PART_TIME"] }).get("employmentType"), "PART_TIME");
});

test("검색어 · 점포 id 를 싣는다", () => {
  const params = paramsOf({ ...base, keyword: "서지안", store: "서초", storeIds: [1, 7] });
  assert.equal(params.get("keyword"), "서지안");
  assert.equal(params.get("storeIds"), "1,7");
});

test("점포명이 없으면 storeIds 를 싣지 않는다 — 관리 범위 전체", () => {
  assert.equal(paramsOf({ ...base, storeIds: [1] }).has("storeIds"), false);
});

test("api 를 부르지 않고 0건인 조건 — 빈 값은 api 가 400, 빼면 전체라서", () => {
  assert.equal(staffListApiSearch({ ...base, joinGroups: [] }), null);
  assert.equal(staffListApiSearch({ ...base, employmentTypes: [] }), null);
  assert.equal(staffListApiSearch({ ...base, store: "없는점", storeIds: [] }), null);
});

const stores = [
  { storeId: 1, name: "모리커피 서초점" },
  { storeId: 2, name: "모리커피 성수점" },
  { storeId: 7, name: "온기식당 서초점" },
];

test("점포명 부분 일치로 점포 id 를 찾는다", () => {
  assert.deepEqual(storeIdsByName(stores, "서초"), [1, 7]);
  assert.deepEqual(storeIdsByName(stores, "모리커피"), [1, 2]);
});

test("점포명은 앞뒤 공백 · 대소문자를 가리지 않는다", () => {
  assert.deepEqual(storeIdsByName([{ storeId: 3, name: "Cafe ABC" }], "  abc "), [3]);
});

test("맞는 점포가 없으면 빈 목록", () => {
  assert.deepEqual(storeIdsByName(stores, "판교"), []);
});

test("kstToday 는 한국 날짜 — UTC 로 전날 15시는 한국 0시", () => {
  assert.equal(kstToday(new Date("2026-10-11T15:00:00Z")), "2026-10-12");
  assert.equal(kstToday(new Date("2026-10-11T14:59:00Z")), "2026-10-11");
});
