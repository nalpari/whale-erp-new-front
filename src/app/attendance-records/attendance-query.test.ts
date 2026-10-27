// node --test src/app/attendance-records/attendance-query.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { byLabel, type DayRow, defaultQuery, editTail, fixPairIndex, lateMinutes, matchesFilter, matchesSummary, mondayOf, needsFix, fixSaveNote, forcedNextDay, initialNextDay, laterDayMark, overnightNote, parseAttendanceQuery, storeParams, toAttendanceSearch, weekSummary } from "./attendance-query.ts";

const TODAY = "2026-10-23";
const def = defaultQuery(TODAY);

const punch = (time: string, extra: Partial<NonNullable<DayRow["pairs"][number]["checkIn"]>> = {}) => ({
  attendanceRecordId: 1,
  recordedAt: `2026-10-22T${time}:00+09:00`,
  time,
  reviewReason: null,
  entryMethod: "SELF" as const,
  isCorrected: false,
  ...extra,
});
const row = (patch: Partial<DayRow> = {}): DayRow => ({
  date: "2026-10-22",
  staffMemberId: 1,
  name: "오세라",
  phone: "01012345678",
  storeId: 7,
  storeName: "성수점",
  employmentType: "PART_TIME",
  employmentStatus: "EMPLOYED",
  schedules: [],
  pairs: [{ checkIn: punch("09:00"), checkOut: punch("18:00") }],
  status: "NORMAL",
  isPayslipConfirmed: false,
  ...patch,
});

test("보정 패널은 고칠 짝(사유 · 빈 쪽)으로 연다, 없으면 첫 짝", () => {
  const punch = (time: string, reviewReason: string | null = null) => ({ time, reviewReason }) as unknown as DayRow["pairs"][number]["checkIn"];
  const pairs = (list: [DayRow["pairs"][number]["checkIn"], DayRow["pairs"][number]["checkOut"]][]) => ({ pairs: list.map(([checkIn, checkOut]) => ({ checkIn, checkOut })) }) as Pick<DayRow, "pairs">;
  assert.equal(fixPairIndex(pairs([[punch("09:00"), punch("12:00")], [punch("13:00"), null]])), 1);
  assert.equal(fixPairIndex(pairs([[punch("09:00"), punch("12:00")], [punch("13:00"), punch("18:00", "OUT_OF_RADIUS_CHECKOUT")]])), 1);
  assert.equal(fixPairIndex(pairs([[punch("09:00"), punch("12:00")]])), 0);
});

test("기본값 — 체크 묶음 전부 · 재직 · 오늘 · 이번 주 · 한 달", () => {
  assert.deepEqual(parseAttendanceQuery({}, TODAY), def);
  assert.equal(def.week, "2026-10-19");
  assert.equal(def.fixFrom, "2026-09-22");
  assert.equal(toAttendanceSearch(def, TODAY), "");
});

test("체크 묶음은 아는 값만, 다 빼면 빈 배열 · 기간이 이상하면 기본 기간", () => {
  const q = parseAttendanceQuery({ status: "LATE,X", reason: "", employment: "X", fixFrom: "2026-01-01", fixTo: TODAY, week: "2026-10-22" }, TODAY);
  assert.deepEqual(q.statuses, ["LATE"]);
  assert.deepEqual(q.reasons, []);
  assert.equal(q.employment, "EMPLOYED");
  assert.equal(q.fixFrom, def.fixFrom);
  assert.equal(q.week, "2026-10-19");
});

test("주소 왕복 — 기본값은 빼고 바꾼 것만", () => {
  const q = { ...def, storeIds: [7, 8], staff: "오", statuses: ["LATE" as const], employment: "ALL" as const, date: "2026-10-22" };
  const search = toAttendanceSearch(q, TODAY);
  assert.equal(search, "?storeIds=7%2C8&staff=%EC%98%A4&status=LATE&employment=ALL&date=2026-10-22");
  assert.deepEqual(parseAttendanceQuery(Object.fromEntries(new URLSearchParams(search)), TODAY), q);
});

test("api 점포 조건 — 고른 점포 · 점포 하나 범위는 storeIds, 직영 · 가맹 범위는 storeTypes, 전체는 없음", () => {
  assert.equal(storeParams({ ...def, storeIds: [7] }).toString(), "storeIds=7");
  assert.equal(storeParams({ ...def, scope: { type: "STORE", storeId: 9 } }).toString(), "storeIds=9");
  assert.equal(storeParams({ ...def, scope: { type: "FRANCHISE" } }).toString(), "storeTypes=FRANCHISE");
  assert.equal(storeParams({ ...def, scope: { type: "ALL" } }).toString(), "");
});

test("거르기 — 직원(이름 · 번호), 상태, 사유 · 기록 구분은 그 값이 있는 줄에만", () => {
  assert.equal(matchesFilter(row(), { ...def, staff: "세라" }), true);
  assert.equal(matchesFilter(row(), { ...def, staff: "010-1234" }), true);
  assert.equal(matchesFilter(row(), { ...def, staff: "김" }), false);
  assert.equal(matchesFilter(row(), { ...def, statuses: ["LATE"] }), false);
  assert.equal(matchesFilter(row({ status: null }), { ...def, statuses: [] }), true);
  // 사유 없는 줄은 사유를 다 빼도 남는다
  assert.equal(matchesFilter(row(), { ...def, reasons: [] }), true);
  const outRow = row({ pairs: [{ checkIn: punch("09:00"), checkOut: punch("18:00", { reviewReason: "OUT_OF_RADIUS_CHECKOUT" }) }] });
  assert.equal(matchesFilter(outRow, { ...def, reasons: ["MOCK_LOCATION"] }), false);
  // 선택지에서 뺀 위치 오차 초과만 남은 줄은 사유 거르기에 걸리지 않는다
  const accuracyRow = row({ pairs: [{ checkIn: punch("09:00", { reviewReason: "ACCURACY_EXCEEDED" }), checkOut: punch("18:00") }] });
  assert.equal(matchesFilter(accuracyRow, { ...def, reasons: ["MOCK_LOCATION"] }), true);
  // 기록 구분 — 보정됨만 고르면 보정 안 한 직원 등록 줄은 빠지고, 기록 없는 줄은 남는다
  assert.equal(matchesFilter(row(), { ...def, entries: ["CORRECTED"] }), false);
  assert.equal(matchesFilter(row({ pairs: [], status: "OFF" }), { ...def, entries: ["CORRECTED"] }), true);
  // 재직 상태 기본은 재직
  assert.equal(matchesFilter(row({ employmentStatus: "RETIRED" }), def), false);
  assert.equal(matchesSummary(row({ employmentStatus: "RETIRED" }), { ...def, employment: "ALL" }), true);
});

test("보정이 필요한 기록 — 미등록 · 확인 필요 · 대신 등록 · 보정됨", () => {
  assert.equal(needsFix(row()), false);
  assert.equal(needsFix(row({ status: "MISSING_CHECK_OUT" })), true);
  assert.equal(needsFix(row({ pairs: [{ checkIn: punch("09:00", { reviewReason: "MOCK_LOCATION" }), checkOut: null }] })), true);
  assert.equal(needsFix(row({ pairs: [{ checkIn: punch("09:00", { entryMethod: "PROXY" }), checkOut: null }] })), true);
  assert.equal(needsFix(row({ pairs: [{ checkIn: punch("09:00", { isCorrected: true }), checkOut: null }] })), true);
});

test("근태 요약 — 횟수는 줄에서, 근무 · 연장 · 주휴 대상은 api 직원별 값(급여 계산과 같은 규칙)을 거른 줄의 직원만 더한다", () => {
  const rows = [row(), row({ status: "LATE" }), row({ status: "ABSENT", pairs: [] }), row({ status: "MISSING_CHECK_OUT", pairs: [{ checkIn: punch("09:00"), checkOut: null }] })];
  const weekStaff = [
    { staffMemberId: rows[0].staffMemberId, workedMinutes: 2_000, overtimeMinutes: 90, isWeeklyHolidayEligible: true },
    // 필터로 줄이 빠진 직원은 더하지 않는다
    { staffMemberId: 999, workedMinutes: 500, overtimeMinutes: 60, isWeeklyHolidayEligible: true },
  ];
  assert.deepEqual(weekSummary(rows, weekStaff), {
    normal: 1,
    late: 1,
    missing: 2,
    workedMinutes: 2_000,
    overtimeMinutes: 90,
    nightMinutes: 0,
    weeklyHolidayStaff: 1,
  });
  assert.equal(mondayOf("2026-10-25"), "2026-10-19");
});

test("근태 요약 — 야간(22~06시)은 줄에서 센다", () => {
  const night = row({
    staffMemberId: 2,
    pairs: [{ checkIn: punch("21:00"), checkOut: { ...punch("06:30"), recordedAt: "2026-10-23T06:30:00+09:00" } }],
  });
  assert.equal(weekSummary([night], []).nightMinutes, 8 * 60);
});

test("다음 날 퇴근 안내 — 퇴근이 출근보다 이르거나 같을 때만", () => {
  assert.equal(overnightNote("2026-10-23", "15:00", "02:00"), "다음 날(10/24) 02:00 퇴근으로 저장합니다.");
  assert.equal(overnightNote("2026-10-31", "22:00", "22:00"), "다음 날(11/1) 22:00 퇴근으로 저장합니다.");
  assert.equal(overnightNote("2026-10-23", "09:00", "18:00"), null);
  assert.equal(overnightNote("2026-10-23", "15:00", "2:0"), null);
});

test("보정이 필요한 기록 꼬리 · 처리한 사람 · 지각 분", () => {
  const edits = [
    { at: "2026-08-30T01:12:00.000Z", kind: "CORRECTION" as const, by: "정하윤", byRole: "BP 마스터", before: "출근 09:02 · 퇴근 없음", after: "출근 09:02 · 퇴근 18:30", reason: "퇴근 등록 누락" },
    { at: "2026-08-27T09:05:00.000Z", kind: "PROXY" as const, by: "정하윤", byRole: null, before: null, after: "출근 10:00 · 퇴근 16:00", reason: "위치 수집 일시 중지" },
  ];
  assert.equal(editTail(edits, "CORRECTION"), "08-30 정하윤");
  assert.equal(editTail(edits, "PROXY"), "위치 수집 일시 중지 · 정하윤");
  assert.equal(editTail([], "PROXY"), null);
  assert.equal(byLabel(edits[0]), "정하윤 (BP 마스터)");
  assert.equal(byLabel(edits[1]), "정하윤");
  const punch = (time: string) => ({ attendanceRecordId: 1, recordedAt: "", time, reviewReason: null, entryMethod: "SELF" as const, isCorrected: false });
  const late = { status: "LATE" as const, schedules: [{ startTime: "13:00", endTime: "22:00", breakMinutes: 0 }], pairs: [{ checkIn: punch("13:18"), checkOut: null }] };
  assert.equal(lateMinutes(late), 18);
  assert.equal(lateMinutes({ ...late, status: "NORMAL" }), 0);
});

test("보정 퇴근 날 — 처음 값은 원래 퇴근이 다음 날인가, 퇴근이 출근보다 이르면 늘 다음 날, 안내는 api 가 저장할 날", () => {
  assert.equal(laterDayMark("2026-10-23", "2026-10-24T01:00:00.000Z"), "(다음날)");
  assert.equal(laterDayMark("2026-10-23", "2026-10-23T09:00:00.000Z"), "");
  assert.equal(laterDayMark("2026-10-23", "2026-10-25T01:00:00.000Z"), "(+2일)");
  assert.equal(initialNextDay("2026-10-23", { recordedAt: "2026-10-24T01:00:00.000Z" }), true);
  assert.equal(initialNextDay("2026-10-23", { recordedAt: "2026-10-23T09:00:00.000Z" }), false);
  assert.equal(initialNextDay("2026-10-23", null), false);
  assert.equal(forcedNextDay("22:00", "06:00"), true);
  assert.equal(forcedNextDay("09:00", "10:00"), false);
  // 24시간 넘는 짝(09:00 → 다음 날 10:00)을 다음 날 09:30 으로
  assert.equal(fixSaveNote("2026-10-23", true, "09:00", "09:30", true), "다음 날(10/24) 09:30 퇴근으로 저장합니다.");
  assert.equal(fixSaveNote("2026-10-23", true, "09:00", "18:00", false), null);
  assert.equal(fixSaveNote("2026-10-23", true, "22:00", "06:00", false), "다음 날(10/24) 06:00 퇴근으로 저장합니다.");
  // 출근 없는 퇴근에 밤 출근을 채우면 출근이 전날이다
  assert.equal(fixSaveNote("2026-10-24", false, "22:00", "06:00", false), "전날(10/23) 22:00 출근으로 저장합니다.");
  assert.equal(fixSaveNote("2026-10-24", false, "05:00", "06:00", false), null);
});
