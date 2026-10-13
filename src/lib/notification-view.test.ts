// node --test src/lib/notification-view.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { badgeText, formatAt, isNotificationId, linkOf, parseNotificationQuery, relatedLabel } from "./notification-view.ts";

test("linkOf — 화면이 있는 업무로 간다", () => {
  const cases: [string, string, string][] = [
    ["NTF_CONTRACT_SIGNED", "CONTRACT", "/contracts/41"],
    ["NTF_CONTRACT_REJECTED", "CONTRACT", "/contracts/41"],
    ["NTF_CONTRACT_EXPIRED", "CONTRACT", "/contracts/41"],
    ["NTF_CONTRACT_RENEWAL_DUE", "CONTRACT", "/contracts/41"],
    ["NTF_LINK_HOLD", "STAFF_MEMBER", "/staff-members/41"],
    ["NTF_AFFILIATION_REJECTED", "STAFF_MEMBER", "/staff-members/41"],
  ];
  for (const [templateCode, relatedType, path] of cases)
    assert.equal(linkOf({ templateCode, relatedType, relatedId: 41 }), path, templateCode);
});

test("linkOf — 아직 화면이 없는 문의 · 도입문의는 갈 곳이 없다(알림함에서 안내)", () => {
  const cases: [string, string][] = [
    ["NTF_INQUIRY_RECEIVED", "INQUIRY"],
    ["NTF_INQUIRY_ANSWERED", "INQUIRY"],
    ["NTF_LEAD_RECEIVED", "LEAD"],
    ["NTF_LEAD_ANSWERED", "LEAD"],
  ];
  for (const [templateCode, relatedType] of cases)
    assert.equal(linkOf({ templateCode, relatedType, relatedId: 41 }), null, templateCode);
});

test("linkOf — 관련 업무가 없거나 맞지 않으면 갈 곳이 없다", () => {
  assert.equal(linkOf({ templateCode: "NTF_CONTRACT_SIGNED", relatedType: "CONTRACT", relatedId: null }), null);
  assert.equal(linkOf({ templateCode: "NTF_CONTRACT_SIGNED", relatedType: null, relatedId: 41 }), null);
  assert.equal(linkOf({ templateCode: "NTF_UNKNOWN", relatedType: "CONTRACT", relatedId: 41 }), null);
  // 운영자가 템플릿 코드를 고쳐도 관련 업무가 맞지 않으면 엉뚱한 곳으로 보내지 않는다.
  assert.equal(linkOf({ templateCode: "NTF_LINK_HOLD", relatedType: "CONTRACT", relatedId: 41 }), null);
});

test("parseNotificationQuery — 이상한 값은 기본값(1쪽 · 20건)으로", () => {
  assert.deepEqual(parseNotificationQuery({}), { page: 1, pageSize: 20 });
  assert.deepEqual(parseNotificationQuery({ page: "3", pageSize: "50" }), { page: 3, pageSize: 50 });
  for (const page of ["0", "-1", "abc", "1.5"]) assert.equal(parseNotificationQuery({ page }).page, 1, page);
  for (const pageSize of ["30", "200", "x"]) assert.equal(parseNotificationQuery({ pageSize }).pageSize, 20, pageSize);
  assert.deepEqual(parseNotificationQuery({ page: ["2", "5"] }), { page: 2, pageSize: 20 });
});

test("formatAt — 한국 시간 MM-DD HH:mm", () => {
  // UTC 로는 전날 밤인 한국 아침
  assert.equal(formatAt("2026-10-12T23:05:00.000Z"), "10-13 08:05");
});

test("badgeText — 없으면 빈 글자, 100 건부터 99+", () => {
  assert.equal(badgeText(0), "");
  assert.equal(badgeText(7), "7");
  assert.equal(badgeText(99), "99");
  assert.equal(badgeText(100), "99+");
});

test("relatedLabel — 관련 업무 종류와 번호", () => {
  assert.equal(relatedLabel("CONTRACT", 41), "근로계약 #41");
  assert.equal(relatedLabel("STAFF_MEMBER", 12), "직원 #12");
  assert.equal(relatedLabel("INQUIRY", 7), "문의사항 #7");
  assert.equal(relatedLabel("LEAD", 3), "도입문의 #3");
  assert.equal(relatedLabel(null, null), "-");
  assert.equal(relatedLabel("UNKNOWN", 5), "-");
});

test("isNotificationId — 1..2147483647 의 정수만", () => {
  for (const ok of [1, 70, 2147483647]) assert.equal(isNotificationId(ok), true, String(ok));
  for (const bad of [0, -1, 1.5, NaN, Infinity, 2147483648]) assert.equal(isNotificationId(bad), false, String(bad));
});
