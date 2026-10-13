// node --test src/lib/notification-view.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { badgeText, formatAt, isNotificationId, parseNotificationQuery, relatedLabel, safeLink } from "./notification-view.ts";

test("safeLink — 업무 쪽이 넘긴 관리자 웹 경로는 그대로 간다", () => {
  for (const link of ["/contracts/41", "/staff-members/12", "/support/inquiries/7?tab=answer"]) assert.equal(safeLink(link), link);
});

test("safeLink — 링크가 없거나 관리자 웹 밖이면 갈 곳이 없다(알림함에서 안내)", () => {
  for (const link of [null, "", "https://evil.example", "//evil.example", "contracts/41", "/a b", "/a\\b", "javascript:alert(1)"])
    assert.equal(safeLink(link), null, String(link));
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
