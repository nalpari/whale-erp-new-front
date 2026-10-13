// node --test src/lib/notification-view.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { badgeText, formatAt, linkOf, parseNotificationQuery } from "./notification-view.ts";

test("linkOf — 열 가지 템플릿 코드마다 업무 화면으로 간다", () => {
  const cases: [string, string, string][] = [
    ["NTF_CONTRACT_SIGNED", "CONTRACT", "/staff-members/contracts/41"],
    ["NTF_CONTRACT_REJECTED", "CONTRACT", "/staff-members/contracts/41"],
    ["NTF_CONTRACT_EXPIRED", "CONTRACT", "/staff-members/contracts/41"],
    ["NTF_CONTRACT_RENEWAL_DUE", "CONTRACT", "/staff-members/contracts/41"],
    ["NTF_LINK_HOLD", "STAFF_MEMBER", "/staff-members/41"],
    ["NTF_AFFILIATION_REJECTED", "STAFF_MEMBER", "/staff-members/41"],
    ["NTF_INQUIRY_RECEIVED", "INQUIRY", "/platform/community/inquiries/41"],
    ["NTF_INQUIRY_ANSWERED", "INQUIRY", "/support/inquiries/41"],
    ["NTF_LEAD_RECEIVED", "LEAD", "/platform/community/leads/41"],
    ["NTF_LEAD_ANSWERED", "LEAD", "/platform/community/leads/41"],
  ];
  for (const [templateCode, relatedType, path] of cases)
    assert.equal(linkOf({ templateCode, relatedType, relatedId: 41 }), path, templateCode);
});

test("linkOf — 관련 업무가 없거나 맞지 않으면 갈 곳이 없다", () => {
  assert.equal(linkOf({ templateCode: "NTF_CONTRACT_SIGNED", relatedType: "CONTRACT", relatedId: null }), null);
  assert.equal(linkOf({ templateCode: "NTF_CONTRACT_SIGNED", relatedType: null, relatedId: 41 }), null);
  assert.equal(linkOf({ templateCode: "NTF_UNKNOWN", relatedType: "CONTRACT", relatedId: 41 }), null);
  // 운영자가 템플릿 코드를 고쳐도 관련 업무가 맞지 않으면 엉뚱한 곳으로 보내지 않는다.
  assert.equal(linkOf({ templateCode: "NTF_INQUIRY_RECEIVED", relatedType: "CONTRACT", relatedId: 41 }), null);
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
