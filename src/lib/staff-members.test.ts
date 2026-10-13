// node --test src/lib/staff-members.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EMPLOYMENT_TYPES,
  JOIN_GROUPS,
  kstToday,
  queryStaff,
  type StaffListQuery,
  type StaffRecord,
} from "./staff-members.ts";

const base: StaffListQuery = {
  store: "",
  keyword: "",
  employmentTypes: [...EMPLOYMENT_TYPES],
  joinGroups: [...JOIN_GROUPS],
  employmentStatus: "EMPLOYED",
  page: 1,
  pageSize: 20,
};

let nextId = 1;
const rec = (over: Partial<StaffRecord> = {}): StaffRecord => ({
  staffMemberId: nextId++,
  isMasked: false,
  name: "서지안",
  phone: "01028417702",
  store: { storeId: 1, name: "모리커피 서초점", storeType: "DIRECT" },
  employmentType: "FULL_TIME",
  joinState: "JOINED",
  invitation: null,
  linkHold: null,
  contract: null,
  employmentStatus: "EMPLOYED",
  retiredDate: null,
  ...over,
});
const ids = (r: { items: { staffMemberId: number }[] }) => r.items.map((i) => i.staffMemberId);

test("기본은 재직만, 최근 등록 먼저", () => {
  const a = rec();
  const b = rec({ employmentStatus: "RETIRED" });
  const c = rec();
  const res = queryStaff(base, [a, b, c]);
  assert.deepEqual(ids(res), [c.staffMemberId, a.staffMemberId]);
  assert.equal(res.total, 2);
});

test("재직 상태 ALL 이면 퇴직도 나온다", () => {
  const res = queryStaff({ ...base, employmentStatus: "ALL" }, [rec(), rec({ employmentStatus: "RETIRED" })]);
  assert.equal(res.total, 2);
});

test("가린 행은 개인 칸을 비워 낸다", () => {
  const m = rec({ isMasked: true, name: "가맹직원", store: { storeId: 6, name: "모리커피 연남점", storeType: "FRANCHISE" } });
  const [item] = queryStaff(base, [m]).items;
  assert.equal(item.isMasked, true);
  assert.equal(item.name, null);
  assert.equal(item.phone, null);
  assert.equal(item.joinState, null);
  assert.equal(item.employmentStatus, null);
  assert.deepEqual(item.store, m.store);
});

test("검색어가 있으면 가린 행을 뺀다 — 가린 사람이 검색으로 드러나지 않게", () => {
  const m = rec({ isMasked: true, name: "가맹직원" });
  assert.equal(queryStaff({ ...base, keyword: "가맹직원" }, [m]).total, 0);
});

test("재직 상태로 걸러도 가린 행은 남는다 — api 와 같다", () => {
  const m = rec({ isMasked: true, employmentStatus: "RETIRED" });
  assert.equal(queryStaff({ ...base, employmentStatus: "RETIRED" }, [m]).total, 1);
  assert.equal(queryStaff(base, [m]).total, 0);
});

test("점포명으로 걸러도 가린 행은 남는다 — 점포는 가린 칸이 아니다", () => {
  const m = rec({ isMasked: true, store: { storeId: 6, name: "모리커피 연남점", storeType: "FRANCHISE" } });
  assert.equal(queryStaff({ ...base, store: "연남" }, [m, rec()]).total, 1);
});

test("이름 부분 일치로 찾는다", () => {
  assert.equal(queryStaff({ ...base, keyword: "지안" }, [rec(), rec({ name: "오세라" })]).total, 1);
});

test("하이픈 섞인 번호로 찾는다", () => {
  const res = queryStaff({ ...base, keyword: "010-2841" }, [rec(), rec({ phone: "01033924418" })]);
  assert.equal(res.total, 1);
});

test("고용형태 하나만 고르면 그것만", () => {
  const res = queryStaff({ ...base, employmentTypes: ["PART_TIME"] }, [rec(), rec({ employmentType: "PART_TIME" })]);
  assert.equal(res.total, 1);
});

test("초대 발송 묶음은 INVITED · EXPIRED · REJECTED", () => {
  const rows = [
    rec({ joinState: "INVITED" }),
    rec({ joinState: "EXPIRED" }),
    rec({ joinState: "REJECTED" }),
    rec({ joinState: "JOINED" }),
  ];
  assert.equal(queryStaff({ ...base, joinGroups: ["INVITED"] }, rows).total, 3);
});

test("DRAFT · RETURN_PENDING 은 묶음을 모두 고를 때만 보인다", () => {
  const rows = [rec({ joinState: "DRAFT" }), rec({ joinState: "RETURN_PENDING" })];
  assert.equal(queryStaff(base, rows).total, 2);
  assert.equal(queryStaff({ ...base, joinGroups: JOIN_GROUPS.slice(0, 4) }, rows).total, 0);
});

test("묶음을 하나도 고르지 않으면 0건", () => {
  assert.equal(queryStaff({ ...base, joinGroups: [] }, [rec()]).total, 0);
});

test("쪽을 나누고, 마지막 쪽 너머는 빈 items 와 total", () => {
  const rows = Array.from({ length: 25 }, () => rec());
  const p2 = queryStaff({ ...base, page: 2 }, rows);
  assert.equal(p2.items.length, 5);
  assert.equal(p2.total, 25);
  const p9 = queryStaff({ ...base, page: 9 }, rows);
  assert.deepEqual(p9.items, []);
  assert.equal(p9.total, 25);
});

test("kstToday 는 한국 날짜 — UTC 로 전날 15시는 한국 0시", () => {
  assert.equal(kstToday(new Date("2026-10-11T15:00:00Z")), "2026-10-12");
  assert.equal(kstToday(new Date("2026-10-11T14:59:00Z")), "2026-10-11");
});
