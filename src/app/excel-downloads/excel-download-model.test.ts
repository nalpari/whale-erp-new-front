// node --test src/app/excel-downloads/excel-download-model.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { EXPIRED, failureOf, NOT_FOUND, NOT_FOUND_DETAIL, remainingOf } from "./excel-download-model.ts";

test("남은 기한 — 시간 · 분, 1분 안, 지났거나 깨진 날짜는 null", () => {
  const now = Date.parse("2026-10-28T05:00:00Z");
  assert.equal(remainingOf("2026-10-29T05:00:00Z", now), "24시간 0분 남음");
  assert.equal(remainingOf("2026-10-28T08:12:30Z", now), "3시간 12분 남음");
  assert.equal(remainingOf("2026-10-28T05:12:00Z", now), "12분 남음");
  assert.equal(remainingOf("2026-10-28T05:00:30Z", now), "1분 안에 끝남");
  assert.equal(remainingOf("2026-10-28T05:00:00Z", now), null);
  assert.equal(remainingOf("not-a-date", now), null);
});

test("실패 안내 — 404 · 410 은 정한 문구에 다시 받기 없음, 409 는 api 문구 그대로 안내 색, 연결 실패 · 5xx 는 다시 받기", () => {
  assert.deepEqual(failureOf(404, "Not Found"), { tone: "risk", title: NOT_FOUND, detail: NOT_FOUND_DETAIL, retry: false });
  assert.deepEqual(failureOf(410, "Gone"), { tone: "risk", title: EXPIRED, retry: false });
  assert.deepEqual(failureOf(409, "아직 파일을 만드는 중입니다"), { tone: "info", title: "아직 파일을 만드는 중입니다", retry: true });
  assert.equal(failureOf(0, "x").retry, true);
  assert.equal(failureOf(502, "x").retry, true);
  assert.deepEqual(failureOf(403, "권한이 없습니다"), { tone: "risk", title: "권한이 없습니다", retry: false });
});

test("실패 안내 — 409 만들지 못함은 실패 색에 다시 받기 없음, 403 비밀번호 변경은 바꾼 뒤 다시 받기", () => {
  assert.deepEqual(failureOf(409, "엑셀 파일을 만들지 못했습니다. 다시 요청해 주세요"), {
    tone: "risk",
    title: "엑셀 파일을 만들지 못했습니다. 다시 요청해 주세요",
    retry: false,
  });
  assert.deepEqual(failureOf(403, "비밀번호를 변경한 뒤 이용할 수 있습니다"), { tone: "risk", title: "비밀번호를 변경한 뒤 이용할 수 있습니다", retry: true });
});
