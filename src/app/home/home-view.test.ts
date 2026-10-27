// node --test src/app/home/home-view.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { AdminStore } from "../../lib/session.ts";
import { readListQuery } from "../contracts/contract-list.ts";
import { parseStaffListQuery } from "../staff-members/staff-list-query.ts";
import { parseTodoListQuery } from "../todos/todo-list-query.ts";
import { homeSearchOf, pendingLineOf, renewalNamesOf, type HomePendingItem, type HomeRenewal } from "./home-view.ts";

const store = (storeId: number, storeTypeCode: string, storeStatusCode = "OPEN") => ({ storeId, storeTypeCode, storeStatusCode }) as AdminStore;
const STORES = [store(1, "DIRECT"), store(2, "FRANCHISE"), store(3, "DIRECT", "CLOSED"), store(4, "FRANCHISE")];

const item = (over: Partial<HomePendingItem>): HomePendingItem => ({
  type: "CONTRACT_PENDING_SIGNATURE",
  count: 3,
  firstName: "남도현",
  isFirstNameMasked: false,
  othersCount: 2,
  waitingDays: 6,
  filter: { storeIds: [3, 7], status: ["PENDING_SIGNATURE"] },
  ...over,
});

/** 주소의 쿼리를 목록 파서가 받는 모양으로 */
const searchOf = (href: string) => {
  const raw: Record<string, string | string[]> = {};
  for (const [k, v] of new URL(href, "http://x").searchParams) raw[k] = k in raw ? [raw[k], v].flat() : v;
  return raw;
};

test("범위 → storeIds — 전체는 보내지 않고, 직영 · 가맹은 폐점을 뺀 그 유형, 점포 하나는 그 점포(폐점도)", () => {
  assert.equal(homeSearchOf({ type: "ALL" }, STORES), "");
  assert.equal(homeSearchOf({ type: "DIRECT" }, STORES), "?storeIds=1");
  assert.equal(homeSearchOf({ type: "FRANCHISE" }, STORES), "?storeIds=2,4");
  assert.equal(homeSearchOf({ type: "STORE", storeId: 3 }, STORES), "?storeIds=3");
});

test("범위에 드는 점포가 이 탭에 없으면 null — 쿼리를 빼 BP 전체를 부르지 않는다", () => {
  assert.equal(homeSearchOf({ type: "STORE", storeId: 99 }, STORES), null);
  assert.equal(homeSearchOf({ type: "DIRECT" }, [store(3, "DIRECT", "CLOSED"), store(2, "FRANCHISE")]), null);
  assert.equal(homeSearchOf({ type: "ALL" }, []), "");
});

test("api 가 이 화면이 모르는 처리 대기 유형을 주면 null(그 줄만 건너뛴다)", () => {
  assert.equal(pendingLineOf(item({ type: "SOMETHING_NEW" as HomePendingItem["type"] }), 8), null);
});

test("서명 대기 — 이름 외 N명 · 발송 후 경과, 근로계약 목록의 점포 · 상태로 간다", () => {
  const line = pendingLineOf(item({}), 8)!;
  assert.deepEqual([line.kind, line.title, line.desc], ["계약", "근로계약 서명 대기 3건", "남도현 외 2명 · 발송 후 6일 경과"]);
  assert.equal(line.href, "/contracts?storeIds=3%2C7&status=PENDING_SIGNATURE");
  const q = readListQuery(searchOf(line.href));
  assert.deepEqual([q.storeIds, q.status], [[3, 7], ["PENDING_SIGNATURE"]]);
});

test("가려진 첫 이름은 이름 없이 「N건」, 0일은 「오늘 …」", () => {
  assert.equal(pendingLineOf(item({ firstName: null, isFirstNameMasked: true, waitingDays: 0 }), 8)?.desc, "3건 · 오늘 발송");
  assert.equal(pendingLineOf(item({ count: 1, othersCount: 0, type: "CONTRACT_CORRECTION_REQUESTED", waitingDays: 2 }), 8)?.desc, "남도현 · 요청 후 2일 경과");
});

test("갱신 예정 — 경과 없이 「새 근로계약서 초안 없음」, 체결 완료 목록", () => {
  const line = pendingLineOf(item({ type: "CONTRACT_RENEWAL", count: 2, othersCount: 1, waitingDays: null, filter: { storeIds: [3], status: ["SIGNED"] } }), 8)!;
  assert.deepEqual([line.title, line.desc], ["계약 갱신 예정 2건", "남도현 외 1명 · 새 근로계약서 초안 없음"]);
  assert.deepEqual(readListQuery(searchOf(line.href)).status, ["SIGNED"]);
});

test("소속 확인 거절 — 직원 목록의 「초대」 묶음(거절이 든 묶음)과 점포로 간다", () => {
  const line = pendingLineOf(item({ type: "AFFILIATION_REJECTED", count: 1, othersCount: 0, filter: { storeIds: [3], status: ["REJECTED"] } }), 8)!;
  assert.equal(line.kind, "직원");
  const q = parseStaffListQuery(searchOf(line.href));
  assert.deepEqual([q.storeIds, q.joinGroups], [[3], ["INVITED"]]);
  assert.ok(line.href.startsWith("/staff-members?"));
});

test("문의 답변완료 — 탭 BP 의 문의하기, 제목 외 N건", () => {
  const line = pendingLineOf(item({ type: "INQUIRY_ANSWERED", firstName: "KIOSK 연동 문의", count: 2, othersCount: 1, waitingDays: 1, filter: { storeIds: [], status: ["ANSWERED"] } }), 8)!;
  assert.deepEqual([line.title, line.desc, line.href], ["문의 답변완료 2건", "KIOSK 연동 문의 외 1건 · 답변 후 1일 경과", "/bp/8/support-inquiries?status=ANSWERED"]);
});

test("긴급 TO-DO — TO-DO 목록의 점포 · 대기 · 진행 중 · 긴급만", () => {
  const line = pendingLineOf(item({ type: "URGENT_TODO", firstName: "냉장고 재료 폐기", count: 1, othersCount: 0, filter: { storeIds: [3], status: ["PENDING", "IN_PROGRESS"] } }), 8)!;
  assert.equal(line.title, "긴급 TO-DO 1건");
  const q = parseTodoListQuery(searchOf(line.href));
  assert.deepEqual([q.storeIds, q.statuses, q.urgentOnly], [[3], ["PENDING", "IN_PROGRESS"], true]);
});

test("경고 밴드 대상 — 셋까지 이름(점포) MM-DD, 가려진 직원은 점포만, 나머지는 외 N명", () => {
  const r = (name: string | null, storeName: string, endDate: string): HomeRenewal => ({
    contractId: 1,
    staffMemberId: name ? 1 : null,
    name,
    isMasked: name === null,
    storeId: 1,
    storeName,
    endDate,
  });
  assert.equal(renewalNamesOf([r("서지안", "서초점", "2026-09-08"), r(null, "판교점", "2026-09-10")]), "서지안(서초점) 09-08, 판교점 09-10");
  assert.equal(renewalNamesOf([r("가", "a", "2026-09-01"), r("나", "b", "2026-09-02"), r("다", "c", "2026-09-03"), r("라", "d", "2026-09-04")]), "가(a) 09-01, 나(b) 09-02, 다(c) 09-03 외 1명");
});
