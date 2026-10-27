// node --test src/lib/format.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDate, formatDateTime, formatPhone, wasUpdated } from "./format.ts";

test("일시는 한국 시간으로 분까지", () => {
  assert.equal(formatDateTime("2026-10-13T00:05:00.000Z"), "2026-10-13 09:05");
  assert.equal(formatDateTime("2026-10-12T15:30:59Z"), "2026-10-13 00:30");
  assert.equal(formatDateTime(null), "");
  assert.equal(formatDateTime("깨진 값"), "");
});

test("날짜만 — 한국 시간으로 날짜가 넘어가는 경계도 맞춘다", () => {
  assert.equal(formatDate("2026-10-13T00:05:00.000Z"), "2026-10-13");
  assert.equal(formatDate("2026-10-12T15:30:59Z"), "2026-10-13"); // UTC 로는 12일, 한국 시간으로는 13일
  assert.equal(formatDate(null), "");
  assert.equal(formatDate("깨진 값"), "");
});

test("전화번호에 하이픈을 넣는다", () => {
  assert.equal(formatPhone("01077813302"), "010-7781-3302");
  assert.equal(formatPhone("0311234567"), "031-123-4567");
  assert.equal(formatPhone("0212345678"), "02-1234-5678");
  assert.equal(formatPhone("021234567"), "02-123-4567");
  assert.equal(formatPhone("050720331334"), "0507-2033-1334");
  assert.equal(formatPhone("05012345678"), "050-1234-5678", "050 11자리는 3자리 국번");
  assert.equal(formatPhone("0507203313345"), "0507203313345", "13자리는 그대로");
  assert.equal(formatPhone("010-1234"), "010-1234");
  assert.equal(formatPhone(null), "");
});

test("고친 적 있는지 — 등록일시와 1초 이상 다를 때만. 없거나 깨진 값은 고친 적 없음", () => {
  assert.equal(wasUpdated("2026-10-27T01:00:00.000Z", "2026-10-27T01:00:00.000Z"), false, "같으면 「-」");
  assert.equal(wasUpdated("2026-10-27T01:00:00.000Z", "2026-10-27T01:00:00.420Z"), false, "등록 때 ms 어긋남");
  assert.equal(wasUpdated("2026-10-27T01:00:00.000Z", "2026-10-27T01:00:01.000Z"), true);
  assert.equal(wasUpdated("2026-10-27T01:00:00.000Z", "2026-10-28T09:30:00.000Z"), true);
  assert.equal(wasUpdated(null, "2026-10-27T01:00:00.000Z"), false);
  assert.equal(wasUpdated("2026-10-27T01:00:00.000Z", "깨진 값"), false);
  assert.equal(wasUpdated("깨진 값", "2026-10-27T01:00:00.000Z"), false, "등록일시 쪽이 깨진 경우");
  assert.equal(wasUpdated(undefined, "2026-10-27T01:00:00.000Z"), false);
  assert.equal(wasUpdated("2026-10-27T01:00:00.000Z", undefined), false);
  assert.equal(wasUpdated("2026-10-27T01:00:00.000Z", "2026-10-27T01:00:00.999Z"), false, "999ms 는 같은 것으로");
  assert.equal(wasUpdated("2026-10-27T01:00:05.000Z", "2026-10-27T01:00:00.000Z"), true, "수정일시가 앞선 깨진 데이터도 차이가 1초 이상이면 고친 것으로(사용자 지정)");
});
