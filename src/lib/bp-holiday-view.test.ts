// node --test src/lib/bp-holiday-view.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bpHolidaysApiPath,
  bpHolidaysHref,
  canChooseAllStores,
  defaultHistoryRange,
  emptyHolidayForm,
  formOfDetail,
  groupByDate,
  holidayBody,
  isDate,
  isEditOpen,
  openStores,
  outsideHoliday,
  parseBpHolidayQuery,
  repeatBasis,
  repeatEndText,
  repeatSkipNote,
  shiftBpHolidayMonth,
  targetText,
  validateHolidayForm,
  yesterdayOf,
  type BpHolidayQuery,
  type HolidayForm,
} from "./bp-holiday-view.ts";

const TODAY = "2026-10-26";

test("주소가 없으면 이번 달 캘린더 · 오늘을 고른다", () => {
  assert.deepEqual(parseBpHolidayQuery({}, TODAY), { year: 2026, month: 10, view: "calendar", day: TODAY, holiday: null, at: null, edit: false });
});

test("다른 달이면 고른 날짜를 비우고, 그 달 밖의 날짜는 버린다", () => {
  assert.equal(parseBpHolidayQuery({ year: "2026", month: "11" }, TODAY).day, null);
  assert.equal(parseBpHolidayQuery({ year: "2026", month: "11", day: "2026-11-03" }, TODAY).day, "2026-11-03");
  assert.equal(parseBpHolidayQuery({ year: "2026", month: "11", day: "2026-10-03" }, TODAY).day, null);
  assert.equal(parseBpHolidayQuery({ year: "2026", month: "11", day: "2026-11-31" }, TODAY).day, null);
});

test("연 휴일 · 선택 날짜 · 목록 보기를 읽고 틀린 값은 버린다", () => {
  const q = parseBpHolidayQuery({ view: "list", holiday: "12", at: "2026-10-30" }, TODAY);
  assert.equal(q.view, "list");
  assert.equal(q.holiday, 12);
  assert.equal(q.at, "2026-10-30");
  assert.equal(parseBpHolidayQuery({ holiday: "0" }, TODAY).holiday, null);
  assert.equal(parseBpHolidayQuery({ holiday: "99999999999" }, TODAY).holiday, null);
  assert.equal(parseBpHolidayQuery({ at: "2026-02-30" }, TODAY).at, null);
  assert.deepEqual(parseBpHolidayQuery({ year: "1999", month: "13" }, TODAY).year, 2026);
});

test("만든 주소를 다시 읽으면 같은 상태다", () => {
  const cases: BpHolidayQuery[] = [
    { year: 2026, month: 10, view: "calendar", day: TODAY, holiday: null, at: null, edit: false },
    { year: 2026, month: 11, view: "list", day: "2026-11-02", holiday: 7, at: "2026-11-09", edit: false },
    { year: 2026, month: 11, view: "list", day: "2026-11-02", holiday: 7, at: "2026-11-09", edit: true },
    { year: 2000, month: 1, view: "calendar", day: "2000-01-01", holiday: null, at: null, edit: false },
  ];
  for (const q of cases) {
    const params = Object.fromEntries(new URL(bpHolidaysHref(q), "http://x").searchParams);
    assert.deepEqual(parseBpHolidayQuery(params, TODAY), q);
  }
  // 상세를 닫으면 선택 날짜(at)도 남기지 않는다
  assert.equal(bpHolidaysHref({ ...cases[0], at: "2026-10-30" }), "/bp-holidays?year=2026&month=10&day=2026-10-26");
});

test("수정은 상세가 열려 있을 때만 주소에 남고, 고칠 수 있는 그 휴일일 때만 연다", () => {
  assert.equal(parseBpHolidayQuery({ edit: "1" }, TODAY).edit, false);
  assert.equal(parseBpHolidayQuery({ holiday: "7", edit: "1" }, TODAY).edit, true);
  assert.equal(parseBpHolidayQuery({ holiday: "7", edit: "true" }, TODAY).edit, false);
  const q = { holiday: 7, edit: true };
  assert.equal(isEditOpen(q, true, 7), true);
  assert.equal(isEditOpen(q, false, 7), false); // 고칠 수 없는 휴일
  assert.equal(isEditOpen(q, true, 8), false); // 다른 휴일로 옮기는 중
  assert.equal(isEditOpen(q, true, null), false); // 상세를 못 불러옴
  assert.equal(isEditOpen({ holiday: 7, edit: false }, true, 7), false);
});

test("고른 날짜가 휴일 기간 밖인가", () => {
  const day = { startDate: "2026-11-12", endDate: "2026-11-12", repeatEndDate: null };
  assert.equal(outsideHoliday(day, "2026-11-10"), true); // 시작일을 옮긴 뒤 옛 날짜
  assert.equal(outsideHoliday(day, "2026-11-12"), false);
  assert.equal(outsideHoliday(day, "2026-11-13"), true);
  const endless = { startDate: "2026-11-02", endDate: null, repeatEndDate: null };
  assert.equal(outsideHoliday(endless, "2030-01-01"), false);
  assert.equal(outsideHoliday({ ...endless, repeatEndDate: "2026-12-28" }, "2026-12-29"), true);
});

test("달 이동은 고른 날짜 · 상세를 닫고 경계에서 멈춘다", () => {
  const q: BpHolidayQuery = { year: 2026, month: 12, view: "list", day: "2026-12-01", holiday: 3, at: "2026-12-01", edit: true };
  assert.deepEqual(shiftBpHolidayMonth(q, 1), { year: 2027, month: 1, view: "list", day: null, holiday: null, at: null, edit: false });
  assert.equal(shiftBpHolidayMonth({ ...q, year: 2100 }, 1), null);
  assert.equal(shiftBpHolidayMonth({ ...q, year: 2000, month: 1 }, -1), null);
});

test("api 목록은 고른 달 하나", () => {
  assert.equal(bpHolidaysApiPath({ year: 2026, month: 9 }), "/bp-holidays?year=2026&month=9");
});

test("날짜별로 묶어도 들어온 순서를 지킨다", () => {
  const map = groupByDate([
    { date: "2026-10-01", id: 1 },
    { date: "2026-10-02", id: 2 },
    { date: "2026-10-01", id: 3 },
  ]);
  assert.deepEqual(map.get("2026-10-01")?.map((r) => r.id), [1, 3]);
  assert.equal(map.size, 2);
});

test("날짜 형식 · 없는 날짜", () => {
  assert.equal(isDate("2024-02-29"), true);
  assert.equal(isDate("2026-02-29"), false);
  assert.equal(isDate("2026-1-01"), false);
  assert.equal(isDate(undefined), false);
});

const form = (patch: Partial<HolidayForm>): HolidayForm => ({ ...emptyHolidayForm(TODAY, false), name: "정기휴무", storeIds: [3], ...patch });

test("검사 — 휴일명 · 지난 시작일 · 대상 점포", () => {
  assert.deepEqual(validateHolidayForm(form({}), TODAY), {});
  assert.ok(validateHolidayForm(form({ name: "  " }), TODAY).name);
  assert.ok(validateHolidayForm(form({ name: "가".repeat(31) }), TODAY).name);
  assert.ok(validateHolidayForm(form({ startDate: "2026-10-25" }), TODAY).startDate);
  assert.ok(validateHolidayForm(form({ storeIds: [] }), TODAY).storeIds);
  // 전체 점포는 예외 점포가 없어도(적용 점포가 0곳이 되어도) 된다(S-UCPMYB)
  assert.deepEqual(validateHolidayForm(form({ isAllStores: true, storeIds: [] }), TODAY), {});
});

test("검사 — 기간 종료일은 시작일과 같아도 된다(api ruleOf)", () => {
  assert.deepEqual(validateHolidayForm(form({ type: "PERIOD", endDate: TODAY }), TODAY), {});
  assert.ok(validateHolidayForm(form({ type: "PERIOD", startDate: "2026-10-28", endDate: "2026-10-27" }), TODAY).endDate);
  assert.ok(validateHolidayForm(form({ type: "PERIOD", endDate: "" }), TODAY).endDate);
});

test("검사 — 반복 종료일 · 횟수", () => {
  assert.deepEqual(validateHolidayForm(form({ type: "REPEAT", repeatEnd: "UNTIL_DATE", repeatEndDate: TODAY }), TODAY), {});
  assert.ok(validateHolidayForm(form({ type: "REPEAT", startDate: "2026-10-28", repeatEnd: "UNTIL_DATE", repeatEndDate: "2026-10-27" }), TODAY).repeatEndDate);
  assert.ok(validateHolidayForm(form({ type: "REPEAT", repeatEnd: "COUNT", repeatCount: "0" }), TODAY).repeatCount);
  assert.ok(validateHolidayForm(form({ type: "REPEAT", repeatEnd: "COUNT", repeatCount: "10000" }), TODAY).repeatCount);
  assert.deepEqual(validateHolidayForm(form({ type: "REPEAT", repeatEnd: "COUNT", repeatCount: "9999" }), TODAY), {});
});

test("검사 — 날짜는 2100-12-31 까지(api ruleOf)", () => {
  assert.deepEqual(validateHolidayForm(form({ startDate: "2100-12-31" }), TODAY), {});
  assert.ok(validateHolidayForm(form({ startDate: "2101-01-01" }), TODAY).startDate);
  assert.ok(validateHolidayForm(form({ type: "PERIOD", endDate: "2101-01-01" }), TODAY).endDate);
  assert.ok(validateHolidayForm(form({ type: "REPEAT", repeatEnd: "UNTIL_DATE", repeatEndDate: "2101-01-01" }), TODAY).repeatEndDate);
});

test("검사 — 진행 중 휴일은 일정 칸을 보지 않는다(읽은 값 그대로 보낸다)", () => {
  assert.deepEqual(validateHolidayForm(form({ startDate: "2026-09-01" }), TODAY, { scheduleLocked: true }), {});
});

test("본문 — 유형과 맞지 않는 칸은 비운다", () => {
  assert.deepEqual(holidayBody(form({ type: "DAY", endDate: "2026-11-01", repeatCount: "3" })), {
    name: "정기휴무",
    description: null,
    holidayTypeCode: "DAY",
    startDate: TODAY,
    endDate: null,
    holidayRepeatTypeCode: null,
    repeatEndType: null,
    repeatEndDate: null,
    repeatCount: null,
    isAllStores: false,
    storeIds: [3],
    excludedStoreIds: [],
  });
  const repeat = holidayBody(form({ type: "REPEAT", repeatType: "MONTHLY", repeatEnd: "COUNT", repeatCount: " 12 ", repeatEndDate: "2026-12-01" }));
  assert.equal(repeat.repeatCount, 12);
  assert.equal(repeat.repeatEndDate, null);
  const all = holidayBody(form({ isAllStores: true, storeIds: [3], excludedStoreIds: [5] }));
  assert.deepEqual([all.storeIds, all.excludedStoreIds], [[], [5]]);
});

test("상세 → 양식 → 같은 일정", () => {
  const detail = {
    name: "정기휴무",
    description: null,
    holidayTypeCode: "REPEAT",
    startDate: "2026-09-21",
    endDate: null,
    holidayRepeatTypeCode: "WEEKLY",
    repeatEndType: "COUNT",
    repeatEndDate: null,
    repeatCount: 10,
    isAllStores: false,
    stores: [
      { storeId: 3, effectiveEndDate: null, periodState: "ACTIVE" as const },
      { storeId: 4, effectiveEndDate: null, periodState: "UPCOMING" as const },
      // 빠진 기간은 수정 양식에 들어가지 않는다
      { storeId: 5, effectiveEndDate: "2026-10-25", periodState: "ENDED" as const },
    ],
  };
  const f = formOfDetail(detail);
  assert.deepEqual([f.type, f.repeatType, f.repeatEnd, f.repeatCount, f.storeIds], ["REPEAT", "WEEKLY", "COUNT", "10", [3, 4]]);
  assert.deepEqual(formOfDetail({ ...detail, isAllStores: true }).excludedStoreIds, [3, 4]);
});

test("열린 점포 — 닫힌 기간 · 끝난 휴일의 열린 기간은 빼고 같은 점포는 하나만", () => {
  const rows = [
    { storeId: 2, effectiveEndDate: "2026-10-25", periodState: "ENDED" as const },
    { storeId: 2, effectiveEndDate: null, periodState: "UPCOMING" as const },
    { storeId: 3, effectiveEndDate: null, periodState: "ACTIVE" as const },
    // 강제 종료된 휴일 — 열린 기간이어도 ENDED
    { storeId: 4, effectiveEndDate: null, periodState: "ENDED" as const },
  ];
  assert.deepEqual(openStores(rows).map((s) => s.storeId), [2, 3]);
});

test("반복 기준 · 건너뛰는 날 안내", () => {
  assert.equal(repeatBasis("WEEKLY", "2026-09-21"), "월요일");
  assert.equal(repeatBasis("MONTHLY", "2026-10-31"), "31일");
  assert.equal(repeatBasis("YEARLY", "2028-02-29"), "2월 29일");
  assert.equal(repeatBasis("DAILY", "2026-10-31"), "");
  assert.ok(repeatSkipNote("MONTHLY", "2026-10-29"));
  assert.equal(repeatSkipNote("MONTHLY", "2026-10-28"), null);
  assert.ok(repeatSkipNote("YEARLY", "2028-02-29"));
  assert.equal(repeatSkipNote("WEEKLY", "2026-10-31"), null);
});

test("종료 조건 · 적용 대상 문구", () => {
  assert.equal(repeatEndText("NONE", null, null), "종료일 없음");
  assert.equal(repeatEndText("UNTIL_DATE", "2026-12-28", null), "2026-12-28까지");
  assert.equal(repeatEndText("COUNT", null, 10), "10회");
  const t = { isAllStores: false, bpTradeName: null, firstStoreName: "판교점", otherStoreCount: 2, excludedStoreCount: 0 };
  assert.equal(targetText(t), "판교점 외 2개");
  assert.equal(targetText({ ...t, otherStoreCount: 0 }), "판교점");
  assert.equal(targetText({ ...t, isAllStores: true, bpTradeName: "㈜한강상회", excludedStoreCount: 1 }), "㈜한강상회 · 예외 1개");
});

test("어제 · 이력 기본 기간 · 전체 점포 역할", () => {
  assert.equal(yesterdayOf("2026-03-01"), "2026-02-28");
  assert.equal(yesterdayOf("2027-01-01"), "2026-12-31");
  assert.deepEqual(defaultHistoryRange(TODAY), { from: "2026-10-01", to: TODAY });
  assert.equal(canChooseAllStores("BM"), true);
  assert.equal(canChooseAllStores("PA"), true);
  assert.equal(canChooseAllStores("FM"), false);
  assert.equal(canChooseAllStores("FA"), false);
});
