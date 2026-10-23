// node --test src/app/contracts/contract-list.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  apiSearch,
  backHrefOf,
  deadlineNote,
  fillScopeOf,
  listAfterSave,
  periodText,
  pickedIdsOf,
  readListQuery,
  sentText,
  toSearch,
  unusableScopeOf,
  wageText,
  withBack,
  withKnownStatus,
  withPickedStores,
  withScopeCondition,
  type ListQuery,
} from "./contract-list.ts";

const EMPTY: ListQuery = { page: 1, staffMemberName: "", status: [], storeIds: [], storesCleared: false, scope: null };

test("readListQuery 는 빈 값 · 잘못된 page 를 기본값으로 바꾼다", () => {
  assert.deepEqual(readListQuery({}), EMPTY);
  assert.equal(readListQuery({ page: "0" }).page, 1);
  assert.equal(readListQuery({ page: "abc" }).page, 1);
  assert.equal(readListQuery({ page: "3" }).page, 3);
});

test("readListQuery 점포 조건 — 고른 점포가 범위보다 앞서고, 빈 storeIds 는 목록에서 비운 「전체」다", () => {
  assert.deepEqual(readListQuery({ storeIds: "3,7,3,x,0", scope: "DIRECT" }), { ...EMPTY, storeIds: [3, 7] });
  assert.deepEqual(readListQuery({ storeIds: "", scope: "DIRECT" }), { ...EMPTY, storesCleared: true });
  assert.deepEqual(readListQuery({ scope: "STORE:12" }).scope, { type: "STORE", storeId: 12 });
  assert.deepEqual(readListQuery({ scope: "ALL" }).scope, { type: "ALL" });
  assert.equal(readListQuery({ scope: "FOO" }).scope, null);
  assert.equal(readListQuery({ storeIds: Array.from({ length: 1001 }, (_, i) => i + 1).join(",") }).storeIds.length, 1000);
});

test("readListQuery 는 상태가 하나여도 배열로 준다", () => {
  assert.deepEqual(readListQuery({ status: "SIGNED" }).status, ["SIGNED"]);
  assert.deepEqual(readListQuery({ status: ["SIGNED", "REJECTED"] }).status, ["SIGNED", "REJECTED"]);
});

test("toSearch 는 기본값을 빼고, 상태는 같은 키를 되풀이한다", () => {
  assert.equal(toSearch(EMPTY), "");
  assert.equal(toSearch({ ...EMPTY, page: 2, status: ["SIGNED", "REJECTED"] }), "?page=2&status=SIGNED&status=REJECTED");
});

test("toSearch 점포 조건 — 고른 점포 · 비운 「전체」 · 헤더 범위 순, 주소를 다시 읽으면 같은 조건이다", () => {
  const cases: ListQuery[] = [
    { ...EMPTY, storeIds: [3, 7] },
    { ...EMPTY, storesCleared: true },
    { ...EMPTY, scope: { type: "ALL" } },
    { ...EMPTY, scope: { type: "STORE", storeId: 12 } },
  ];
  assert.deepEqual(
    cases.map((q) => toSearch(q)),
    ["?storeIds=3%2C7", "?storeIds=", "?scope=ALL", "?scope=STORE%3A12"],
  );
  for (const q of cases) assert.deepEqual(readListQuery(Object.fromEntries(new URLSearchParams(toSearch(q)))), q);
});

test("apiSearch — 고른 점포 · 점포 하나 범위는 storeIds, 직영 · 가맹 범위는 storeTypes, 전체는 점포 조건 없음", () => {
  assert.equal(apiSearch(EMPTY, 20), "?pageSize=20");
  assert.equal(apiSearch({ ...EMPTY, storeIds: [3, 7], scope: null }, 20), "?pageSize=20&storeIds=3%2C7");
  assert.equal(apiSearch({ ...EMPTY, scope: { type: "STORE", storeId: 12 } }, 20), "?pageSize=20&storeIds=12");
  assert.equal(apiSearch({ ...EMPTY, scope: { type: "FRANCHISE" } }, 20), "?pageSize=20&storeTypes=FRANCHISE");
  assert.equal(apiSearch({ ...EMPTY, scope: { type: "ALL" } }, 20), "?pageSize=20");
  assert.equal(apiSearch({ ...EMPTY, storesCleared: true }, 20), "?pageSize=20");
  assert.equal(
    apiSearch({ ...EMPTY, page: 2, staffMemberName: "도윤", status: ["SIGNED"] }, 20),
    "?page=2&pageSize=20&staffMemberName=%EB%8F%84%EC%9C%A4&status=SIGNED",
  );
});

test("점포 조건 바꾸기 · 헤더 범위로 채우기", () => {
  const q = { ...EMPTY, page: 3, scope: { type: "DIRECT" as const } };
  assert.deepEqual(withPickedStores(q, [5]), { ...EMPTY, storeIds: [5] });
  assert.deepEqual(withPickedStores(q, []), { ...EMPTY, storesCleared: true });
  assert.deepEqual(withScopeCondition({ ...EMPTY, page: 2, storeIds: [5] }, { type: "ALL" }), { ...EMPTY, scope: { type: "ALL" } });
  // 주소에 점포 조건이 없고 헤더 범위가 전체가 아닐 때만 채운다
  assert.deepEqual(fillScopeOf(EMPTY, { type: "FRANCHISE" }), { type: "FRANCHISE" });
  assert.equal(fillScopeOf(EMPTY, { type: "ALL" }), null);
  assert.equal(fillScopeOf({ ...EMPTY, storesCleared: true }, { type: "FRANCHISE" }), null);
  assert.equal(fillScopeOf({ ...EMPTY, storeIds: [1] }, { type: "FRANCHISE" }), null);
  assert.deepEqual(pickedIdsOf({ storeIds: [], scope: { type: "STORE", storeId: 9 } }), [9]);
});

test("상세의 [목록]은 넘어온 근로계약 목록 주소로만 돌아간다", () => {
  assert.equal(withBack("/contracts/7", "/contracts"), "/contracts/7");
  const back = withBack("/contracts/7", "/contracts?storeIds=3&page=2");
  assert.equal(back, "/contracts/7?back=%2Fcontracts%3FstoreIds%3D3%26page%3D2");
  assert.equal(backHrefOf(new URLSearchParams(back.split("?")[1]).get("back") ?? undefined), "/contracts?storeIds=3&page=2");
  for (const bad of ["https://evil.example/contracts", "//evil/contracts", "/stores", "/contracts/7", undefined]) assert.equal(backHrefOf(bad), "/contracts", String(bad));
});

test("목록에서 나가는 주소는 쿼리가 있어도 back 을 잇고, 근로계약 목록이 아닌 back 은 싣지 않는다", () => {
  assert.equal(withBack("/contracts/7?send=unknown", "/contracts?storeIds=3"), "/contracts/7?send=unknown&back=%2Fcontracts%3FstoreIds%3D3");
  assert.equal(withBack("/contracts/new", "https://evil.example/contracts"), "/contracts/new");
  assert.equal(withBack("/contracts/7/edit", undefined), "/contracts/7/edit");
});

test("저장 · 삭제 뒤 목록 — 새로 만들었거나 지웠으면 점포 조건을 「전체」로 비우고, 이어 쓰기 저장은 그대로", () => {
  assert.equal(listAfterSave("/contracts?scope=DIRECT&page=3&staffMemberName=%EA%B9%80", null), "/contracts?staffMemberName=%EA%B9%80&storeIds=");
  // 이어 쓰기 · 수정 — 저장한 점포가 고른 점포 안이면 그대로, 밖이면 비운다(임시저장은 점포를 바꿀 수 있다)
  assert.equal(listAfterSave("/contracts?storeIds=3,7", 7), "/contracts?storeIds=3,7");
  assert.equal(listAfterSave("/contracts?storeIds=3,7", 9), "/contracts?storeIds=");
  assert.equal(listAfterSave("/contracts?scope=STORE%3A3", 9), "/contracts?storeIds=");
  assert.equal(listAfterSave("/contracts?scope=STORE%3A3", 3), "/contracts?scope=STORE%3A3");
  assert.equal(listAfterSave("/contracts?scope=FRANCHISE", 9), "/contracts?scope=FRANCHISE");
  assert.equal(listAfterSave("/stores", 3), "/contracts");
});

test("쓸 수 없는 범위는 헤더 · 칩과 같은 판정이다 — 폐점만 남은 점포 유형도 쓸 수 없다", () => {
  const store = (storeId: number, storeTypeCode: string, storeStatusCode = "OPERATING") => ({ storeId, storeCode: `S${storeId}`, name: `점포${storeId}`, storeTypeCode, storeStatusCode });
  const stores = [store(1, "DIRECT", "CLOSED"), store(2, "FRANCHISE")];
  assert.equal(unusableScopeOf({ scope: { type: "DIRECT" } }, stores), true);
  assert.equal(unusableScopeOf({ scope: { type: "FRANCHISE" } }, stores), false);
  assert.equal(unusableScopeOf({ scope: { type: "STORE", storeId: 9 } }, stores), true);
  assert.equal(unusableScopeOf({ scope: { type: "STORE", storeId: 2 } }, stores), false);
  assert.equal(unusableScopeOf({ scope: { type: "ALL" } }, stores), false);
  assert.equal(unusableScopeOf({ scope: null }, stores), false);
});

test("기간 · 급여 표기", () => {
  assert.equal(periodText({ startDate: "2026-09-14", endDate: null }), "2026-09-14 ~ 무기한");
  assert.equal(periodText({ startDate: "2026-09-01", endDate: "2027-08-31" }), "2026-09-01 ~ 2027-08-31");
  // 정직원도 시급이다
  assert.equal(wageText({ wageAmount: 11600 }), "11,600 /h");
  // 임시저장은 비어 있을 수 있다
  assert.equal(periodText({ startDate: null, endDate: null }), "-");
  assert.equal(wageText({ wageAmount: null }), "-");
});

test("발송일은 한국 날짜로 끊는다", () => {
  assert.equal(sentText(null), "-");
  // UTC 9월 1일 15:30 = 한국 9월 2일 00:30
  assert.equal(sentText("2026-09-01T15:30:00.000Z"), "09-02");
  assert.equal(sentText("2026-09-01T02:00:00.000Z"), "09-01");
});

test("서명 대기만 남은 날을 붙인다", () => {
  const now = new Date("2026-09-07T03:00:00Z"); // 한국 9월 7일
  const row = { status: "PENDING_SIGNATURE" as const, signDeadlineAt: "2026-10-01T02:00:00.000Z" };
  assert.equal(deadlineNote(row, now), "D-24");
  assert.equal(deadlineNote({ ...row, signDeadlineAt: "2026-09-07T14:00:00.000Z" }, now), "D-0");
  assert.equal(deadlineNote({ ...row, signDeadlineAt: "2026-09-01T00:00:00.000Z" }, now), undefined);
  assert.equal(deadlineNote({ ...row, status: "SIGNED" }, now), undefined);
});

test("api 가 400 을 줄 주소 값은 보내기 전에 거른다", () => {
  // 이름 검색어는 api @MaxLength(50) 에 맞춰 자른다
  assert.equal(readListQuery({ staffMemberName: "가".repeat(60) }).staffMemberName.length, 50);
  // 모르는 상태 값은 뺀다
  const q = readListQuery({ status: ["SIGNED", "FOO"] });
  assert.deepEqual(withKnownStatus(q, [{ value: "SIGNED" }, { value: "DRAFT" }]).status, ["SIGNED"]);
});
