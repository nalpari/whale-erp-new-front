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
  savedKindOf,
  savedNoticeOf,
  sentText,
  statusNotes,
  toSearch,
  unusableScopeOf,
  wageText,
  withBack,
  withKnownStatus,
  withPickedStores,
  withSaved,
  withScopeCondition,
  type ListQuery,
} from "./contract-list.ts";

const EMPTY: ListQuery = { page: 1, pageSize: 20, staffMemberName: "", status: [], storeIds: [], storesCleared: false, scope: null };

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
  assert.equal(apiSearch(EMPTY), "?pageSize=20");
  assert.equal(apiSearch({ ...EMPTY, storeIds: [3, 7], scope: null }), "?pageSize=20&storeIds=3%2C7");
  assert.equal(apiSearch({ ...EMPTY, scope: { type: "STORE", storeId: 12 } }), "?pageSize=20&storeIds=12");
  assert.equal(apiSearch({ ...EMPTY, scope: { type: "FRANCHISE" } }), "?pageSize=20&storeTypes=FRANCHISE");
  assert.equal(apiSearch({ ...EMPTY, scope: { type: "ALL" } }), "?pageSize=20");
  assert.equal(apiSearch({ ...EMPTY, storesCleared: true }), "?pageSize=20");
  assert.equal(
    apiSearch({ ...EMPTY, page: 2, staffMemberName: "도윤", status: ["SIGNED"] }),
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

test("페이지당 건수는 20 · 50 · 100 만 — 기본 20 은 주소에서 빼고, 다른 값은 기본으로", () => {
  assert.equal(readListQuery({ pageSize: "50" }).pageSize, 50);
  assert.equal(readListQuery({ pageSize: "500" }).pageSize, 20);
  assert.equal(readListQuery({ pageSize: "abc" }).pageSize, 20);
  assert.equal(toSearch({ ...EMPTY, pageSize: 100 }), "?pageSize=100");
  assert.equal(toSearch(EMPTY), "");
  assert.equal(apiSearch({ ...EMPTY, pageSize: 50 }), "?pageSize=50");
});

test("상태 칸 안내 — 발송 대기는 직원의 지금 가입 · 초대 상태, 서명 대기는 소속 · 복귀 확인과 남은 날, 퇴직이면 「퇴직」", () => {
  const now = new Date("2026-09-07T03:00:00Z");
  const base = {
    status: "PENDING_SEND" as const,
    signDeadlineAt: "2026-10-01T02:00:00.000Z",
    draftAction: "SIGNUP_INVITE" as const,
    staffJoinState: "INVITED" as const,
    staffRetired: false,
  };
  assert.deepEqual(statusNotes(base, now), ["가입 대기 중"]);
  // 초대가 만료되면 저장 때 판별한 초대 유형(가입 초대)이 아니라 만료다
  assert.deepEqual(statusNotes({ ...base, staffJoinState: "EXPIRED" }, now), ["초대 만료"]);
  assert.deepEqual(statusNotes({ ...base, status: "PENDING_SIGNATURE", staffJoinState: "AFFILIATION_PENDING" }, now), ["소속 확인 중", "D-24"]);
  // 가입한 직원의 서명 대기는 남은 날만
  assert.deepEqual(statusNotes({ ...base, status: "PENDING_SIGNATURE", staffJoinState: "JOINED" }, now), ["D-24"]);
  assert.deepEqual(statusNotes({ ...base, status: "ENDED", staffJoinState: "JOINED", staffRetired: true }, now), ["퇴직"]);
  assert.deepEqual(statusNotes({ ...base, status: "SIGNED", staffJoinState: "JOINED" }, now), []);
});

test("api 가 가입 상태를 아직 싣지 않으면 발송 대기에 판별한 초대 유형을 붙인다(먼저 배포된 화면)", () => {
  const row = { status: "PENDING_SEND" as const, signDeadlineAt: null, draftAction: "SIGNUP_INVITE" as const, staffJoinState: undefined, staffRetired: undefined };
  // @ts-expect-error — 옛 api 응답에는 두 칸이 없다
  assert.deepEqual(statusNotes(row, new Date(), () => "가입 초대"), ["가입 초대"]);
});

test("저장 뒤 안내 — 임시저장 · 종이 계약은 상태로, 보낸 저장은 api 가 싣는 「실제로 한 처리」로 고른다", () => {
  assert.equal(savedKindOf({ status: "DRAFT", draftAction: null }), "DRAFT");
  assert.equal(savedKindOf({ status: "SIGNED", draftAction: "SIGNUP_INVITE" }), "PAPER");
  assert.equal(savedKindOf({ status: "PENDING_SEND", draftAction: "SIGNUP_INVITE" }), "SIGNUP_INVITE");
  assert.equal(savedKindOf({ status: "PENDING_SIGNATURE", draftAction: "AFFILIATION_CONFIRM" }), "AFFILIATION_CONFIRM");
  assert.equal(savedKindOf({ status: "PENDING_SIGNATURE", draftAction: "RETURN_CONFIRM" }), "RETURN_CONFIRM");
  // 가입한 직원에게 앱으로 보냈다(수정 요청을 고쳐 다시 보낸 것도) — api 가 처음 판별값 대신 IMMEDIATE_SEND 를 싣는다
  assert.equal(savedKindOf({ status: "PENDING_SIGNATURE", draftAction: "IMMEDIATE_SEND" }), "IMMEDIATE_SEND");
  assert.equal(savedKindOf({ status: "PENDING_SIGNATURE", draftAction: null }), null);
  assert.equal(savedKindOf(null), null);
  assert.match(savedNoticeOf("SIGNUP_INVITE") ?? "", /가입 초대 알림톡을 보냈습니다/);
  assert.equal(savedNoticeOf("toString"), null);
  assert.equal(savedNoticeOf(["DRAFT"]), null);
  assert.equal(withSaved("/contracts", "DRAFT"), "/contracts?saved=DRAFT");
  assert.equal(withSaved("/contracts?page=2", "DRAFT"), "/contracts?page=2&saved=DRAFT");
  assert.equal(withSaved("/contracts", null), "/contracts");
  // 이미 있던 saved 는 바꾼다 — 겹치면 배열이 되어 안내가 사라진다
  assert.equal(withSaved("/contracts?saved=DRAFT", "PAPER"), "/contracts?saved=PAPER");
  // 새 계약 저장 뒤 실제로 가는 주소 — 점포 조건을 비운 목록에 안내를 싣는다
  assert.equal(withSaved(listAfterSave("/contracts?storeIds=3&page=2", null), "SIGNUP_INVITE"), `${listAfterSave("/contracts?storeIds=3&page=2", null)}&saved=SIGNUP_INVITE`);
});

test("발송 대기에 가입 · 초대 안내가 없을 때 — 초안 직원 · 가입 상태가 null 이면 판별한 초대 유형, 가입한 직원은 없음", () => {
  const now = new Date("2026-09-07T03:00:00Z");
  const row = { status: "PENDING_SEND" as const, signDeadlineAt: null, draftAction: "SIGNUP_INVITE" as const, staffRetired: false };
  assert.deepEqual(statusNotes({ ...row, staffJoinState: "JOINED" }, now), []);
  // 나간 초대가 없는 초안 직원(알림톡 실패 뒤 등)은 어느 초대를 보내야 하는지 예전처럼 알린다
  assert.deepEqual(statusNotes({ ...row, staffJoinState: "DRAFT" }, now, () => "가입 초대"), ["가입 초대"]);
  // @ts-expect-error — 가입 상태가 null 로 온 응답
  assert.deepEqual(statusNotes({ ...row, staffJoinState: null }, now, () => "가입 초대"), ["가입 초대"]);
  assert.deepEqual(statusNotes({ ...row, status: "PENDING_SIGNATURE", staffJoinState: "LINK_HOLD" }, now), []);
});
