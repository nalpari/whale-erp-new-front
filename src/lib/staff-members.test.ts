// node --test src/lib/staff-members.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPLOYMENT_TYPES, JOIN_GROUPS, hqSharingConsentText, withEmploymentHistory, kstToday, staffEmailText, staffListApiSearch, storeIdsByName, type StaffListQuery } from "./staff-members.ts";

const base: StaffListQuery = {
  storeIds: [],
  storesCleared: false,
  scope: null,
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

test("검색어 · 고른 점포 id 를 싣는다", () => {
  const params = paramsOf({ ...base, keyword: "서지안", storeIds: [1, 7] });
  assert.equal(params.get("keyword"), "서지안");
  assert.equal(params.get("storeIds"), "1,7");
  assert.equal(params.has("storeTypes"), false);
});

test("상단 범위 — 점포 하나는 storeIds, 직영 · 가맹은 storeTypes, 전체는 점포 조건 없음", () => {
  assert.equal(paramsOf({ ...base, scope: { type: "STORE", storeId: 12 } }).get("storeIds"), "12");
  const direct = paramsOf({ ...base, scope: { type: "DIRECT" } });
  assert.equal(direct.get("storeTypes"), "DIRECT");
  assert.equal(direct.has("storeIds"), false);
  assert.equal(paramsOf({ ...base, scope: { type: "FRANCHISE" } }).get("storeTypes"), "FRANCHISE");
  for (const q of [{ ...base, scope: { type: "ALL" as const } }, { ...base, storesCleared: true }, base]) {
    const params = paramsOf(q);
    assert.equal(params.has("storeIds"), false);
    assert.equal(params.has("storeTypes"), false);
  }
});

test("비운 「전체」면 범위가 함께 있어도 점포 조건을 보내지 않는다", () => {
  for (const scope of [{ type: "FRANCHISE" as const }, { type: "DIRECT" as const }, { type: "STORE" as const, storeId: 3 }]) {
    const params = paramsOf({ ...base, storesCleared: true, scope });
    assert.equal(params.has("storeIds"), false);
    assert.equal(params.has("storeTypes"), false);
  }
});

test("고른 점포가 있으면 범위보다 앞선다 — storeTypes 를 보내지 않는다", () => {
  const direct = paramsOf({ ...base, storeIds: [1, 7], scope: { type: "DIRECT" } });
  assert.equal(direct.get("storeIds"), "1,7");
  assert.equal(direct.has("storeTypes"), false);
  assert.equal(paramsOf({ ...base, storeIds: [3], scope: { type: "STORE", storeId: 12 } }).get("storeIds"), "3");
});

test("api 를 부르지 않고 0건인 조건 — 빈 값은 api 가 400, 빼면 전체라서", () => {
  assert.equal(staffListApiSearch({ ...base, joinGroups: [] }), null);
  assert.equal(staffListApiSearch({ ...base, employmentTypes: [] }), null);
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

// GET /enums/StaffJoinState 응답 모양(api STAFF_JOIN_STATE_LABELS).
const JOIN_STATE_LABELS = [
  { value: "JOINED", label: "가입 완료", order: 1 },
  { value: "LINK_HOLD", label: "연결 보류", order: 2 },
  { value: "UNDER_AGE", label: "가입 불가(만 19세 미만)", order: 3 },
  { value: "AFFILIATION_PENDING", label: "소속 추가 확인", order: 4 },
  { value: "RETURN_PENDING", label: "복귀 확인", order: 5 },
  { value: "INVITED", label: "초대 발송", order: 6 },
  { value: "EXPIRED", label: "초대 만료", order: 7 },
  { value: "REJECTED", label: "거절", order: 8 },
  { value: "DRAFT", label: "초안", order: 9 },
];

test("이메일 칸 — 값이 있으면 그대로 보인다(조회 권한이면 보인다, ACC-17)", () => {
  assert.equal(staffEmailText({ email: "jian.seo@example.com", joinState: "JOINED" }, JOIN_STATE_LABELS), "jian.seo@example.com");
});

test("이메일 칸 — 초안 · 초대 발송은 「가입 전」(화면 문구, enum 한글이 아니다)", () => {
  for (const joinState of ["DRAFT", "INVITED"] as const) {
    assert.equal(staffEmailText({ email: null, joinState }, JOIN_STATE_LABELS), "가입 전", joinState);
    assert.equal(staffEmailText({ email: null, joinState }, []), "가입 전", `${joinState} — enum 없이도`);
  }
});

test("이메일 칸 — 그 밖의 가입 전 상태는 api enum(StaffJoinState)의 한글. 초대 만료 · 거절은 소속 추가 확인 · 복귀 확인에서도 생겨 「가입 전」이라 하지 않는다", () => {
  const expected = {
    EXPIRED: "초대 만료",
    REJECTED: "거절",
    LINK_HOLD: "연결 보류",
    AFFILIATION_PENDING: "소속 추가 확인",
    RETURN_PENDING: "복귀 확인",
    UNDER_AGE: "가입 불가(만 19세 미만)",
  } as const;
  for (const [joinState, label] of Object.entries(expected)) {
    assert.equal(staffEmailText({ email: null, joinState: joinState as keyof typeof expected }, JOIN_STATE_LABELS), label, joinState);
  }
});

test("이메일 칸 — 가입 완료인데 없으면(퇴직 · 탈퇴 · 본사가 보는 가맹 직원) 「-」", () => {
  assert.equal(staffEmailText({ email: null, joinState: "JOINED" }, JOIN_STATE_LABELS), "-");
});

test("이메일 칸 — 가입 상태를 모르면 「-」", () => {
  assert.equal(staffEmailText({ email: null, joinState: null }, JOIN_STATE_LABELS), "-");
});

test("이메일 칸 — enum 을 받지 못했거나(빈 목록) 목록에 없는 값이면 영문 값 대신 「-」", () => {
  assert.equal(staffEmailText({ email: null, joinState: "LINK_HOLD" }, []), "-");
  assert.equal(staffEmailText({ email: null, joinState: "SOMETHING_NEW" as never }, JOIN_STATE_LABELS), "-");
});

const HQ_CONSENT_LABELS = [
  { value: "AGREED", label: "동의", order: 1 },
  { value: "NOT_AGREED", label: "미동의", order: 2 },
];

test("본사 제공 동의 칸은 가맹 점포 직원만 — 직영 점포 직원(null)은 줄이 없다", () => {
  assert.equal(hqSharingConsentText({ hqSharingConsent: "AGREED" }, HQ_CONSENT_LABELS), "동의");
  assert.equal(hqSharingConsentText({ hqSharingConsent: "NOT_AGREED" }, HQ_CONSENT_LABELS), "미동의");
  assert.equal(hqSharingConsentText({ hqSharingConsent: null }, HQ_CONSENT_LABELS), null);
});

test("본사 제공 동의 한글을 받지 못했으면 - — 영문 값을 보이지 않는다", () => {
  assert.equal(hqSharingConsentText({ hqSharingConsent: "NOT_AGREED" }, []), "-");
});

test("재직 이력 칸이 없는 상세 응답(api #136 배포 전)은 빈 목록으로 채운다 — 있으면 그대로", () => {
  const period = { staffMemberId: 3, hiredDate: "2024-01-02", retiredDate: "2024-06-30" };
  const before = { staffMemberId: 1, name: "서지안" } as unknown as Parameters<typeof withEmploymentHistory>[0];
  assert.deepEqual(withEmploymentHistory(before), { staffMemberId: 1, name: "서지안", previousRecords: [], laterRecords: [] });
  const after = { ...before, previousRecords: [period], laterRecords: [] } as Parameters<typeof withEmploymentHistory>[0];
  assert.deepEqual(withEmploymentHistory(after).previousRecords, [period]);
});
