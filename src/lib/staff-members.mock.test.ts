// node --test src/lib/staff-members.mock.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMockStaff } from "./staff-members.mock.ts";
import { EMPLOYMENT_TYPES, JOIN_GROUPS, queryStaff, type StaffListQuery } from "./staff-members.ts";

const TODAY = "2026-10-12";
const rows = buildMockStaff(TODAY);
const base: StaffListQuery = {
  store: "",
  keyword: "",
  employmentTypes: [...EMPLOYMENT_TYPES],
  joinGroups: [...JOIN_GROUPS],
  employmentStatus: "EMPLOYED",
  page: 1,
  pageSize: 20,
};

test("69건, id 가 겹치지 않는다", () => {
  assert.equal(rows.length, 69);
  assert.equal(new Set(rows.map((r) => r.staffMemberId)).size, 69);
});

test("기본 필터(재직)는 데모처럼 63건, 20건에 4쪽", () => {
  const res = queryStaff(base, rows);
  assert.equal(res.total, 63);
  assert.equal(queryStaff({ ...base, page: 4 }, rows).items.length, 3);
});

test("첫 쪽은 데모의 순서 — 서지안부터", () => {
  const names = queryStaff(base, rows).items.slice(0, 4).map((i) => i.name);
  assert.deepEqual(names, ["서지안", "오세라", "문태경", "배정숙"]);
});

test("가맹 점포 직원은 모두 가린 행이고, 가린 행은 모두 가맹 점포다", () => {
  for (const r of rows) assert.equal(r.isMasked, r.store.storeType === "FRANCHISE", `id ${r.staffMemberId}`);
  assert.equal(rows.filter((r) => r.isMasked).length, 7);
});

test("데모의 상태 예가 모두 있다", () => {
  const states = new Set(rows.map((r) => r.joinState));
  for (const s of ["JOINED", "INVITED", "LINK_HOLD", "AFFILIATION_PENDING", "UNDER_AGE"] as const) assert.ok(states.has(s), s);
  const contracts = new Set(rows.map((r) => r.contract?.status));
  for (const s of ["PENDING_SEND", "PENDING_SIGNATURE", "SIGNED", "REJECTED", "ENDED"] as const) assert.ok(contracts.has(s), s);
});

test("날짜는 오늘을 기준으로 만든다 — 연결 보류 4일 전, 날인 기한 24일 뒤, 종료 20일 뒤", () => {
  const hold = rows.find((r) => r.joinState === "LINK_HOLD");
  assert.equal(hold?.linkHold?.heldAt.slice(0, 10), "2026-10-08");
  const signing = rows.find((r) => r.contract?.status === "PENDING_SIGNATURE");
  assert.equal(signing?.contract?.signDeadlineAt?.slice(0, 10), "2026-11-05");
  const renewal = rows.find((r) => r.name === "배정숙");
  assert.equal(renewal?.contract?.endDate, "2026-11-01");
});

test("번호는 숫자만 10~11자리", () => {
  for (const r of rows) if (r.phone !== null) assert.match(r.phone, /^\d{10,11}$/);
});
