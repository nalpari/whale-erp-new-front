// node --test src/lib/birth-date.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { BIRTH_DATE_NOTES, canCorrectBirthDate, confirmAfterDateChange, ignoresCheck, isPendingInput, checkBirthDate, refreshesAfterCorrection } from "./birth-date.ts";

test("버튼 — api 가 정정할 수 있다고 알렸고 수정 권한이 있으면 보인다", () => {
  assert.equal(canCorrectBirthDate({ birthDateCorrectable: true }, true), true);
});

test("버튼 — 수정 권한이 없으면 숨긴다", () => {
  assert.equal(canCorrectBirthDate({ birthDateCorrectable: true }, false), false);
});

test("버튼 — api 가 정정할 수 없다고 하면(가입 전 · 탈퇴 · 연결 보류 · 퇴직) 숨긴다", () => {
  assert.equal(canCorrectBirthDate({ birthDateCorrectable: false }, true), false);
});

test("버튼 — 옛 api 응답(칸 없음)은 숨긴다", () => {
  assert.equal(canCorrectBirthDate({} as { birthDateCorrectable: boolean }, true), false);
});

test("입력 검사 — 맞는 날짜는 null", () => {
  assert.equal(checkBirthDate("1990-05-20", "2026-10-26", "1990-05-21"), null);
  assert.equal(checkBirthDate("1990-05-20", "2026-10-26", null), null);
});

test("입력 검사 — 빈 값 · 모양 · 없는 날짜", () => {
  assert.equal(checkBirthDate("", "2026-10-26", null), "새 생년월일을 입력해 주세요.");
  assert.equal(checkBirthDate("1990-5-2", "2026-10-26", null), "생년월일은 YYYY-MM-DD 형식의 있는 날짜여야 합니다.");
  assert.equal(checkBirthDate("1990-02-30", "2026-10-26", null), "생년월일은 YYYY-MM-DD 형식의 있는 날짜여야 합니다.");
});

test("입력 검사 — 오늘은 받고 내일부터 막는다", () => {
  assert.equal(checkBirthDate("2026-10-26", "2026-10-26", null), null);
  assert.equal(checkBirthDate("2026-10-27", "2026-10-26", null), "오늘 이후 날짜는 넣을 수 없습니다.");
});

test("입력 검사 — 지금 생년월일과 같으면 막는다", () => {
  assert.equal(checkBirthDate("1990-05-20", "2026-10-26", "1990-05-20"), "지금 생년월일과 같습니다.");
});

test("안내 — 세 줄이다", () => {
  assert.equal(BIRTH_DATE_NOTES.length, 3);
});

test("409 + NOT_JOINED code 면 닫고 다시 받는다", () => {
  assert.equal(refreshesAfterCorrection({ status: 409, code: "BIRTH_DATE_NOT_JOINED" }), true);
});

test("409 가입 전 · 퇴직만 닫고 다시 받는다. 같은 값 409 · 400 · 404 · 결과 모름은 확인창 안에 둔다", () => {
  assert.equal(refreshesAfterCorrection({ status: 409, code: "BIRTH_DATE_NOT_JOINED" }), true);
  assert.equal(refreshesAfterCorrection({ status: 409, code: "BIRTH_DATE_RETIRED" }), true);
  assert.equal(refreshesAfterCorrection({ status: 409, code: "BIRTH_DATE_UNCHANGED" }), false);
  assert.equal(refreshesAfterCorrection({ status: 409 }), false);
  for (const status of [400, 404, 401, undefined]) assert.equal(refreshesAfterCorrection({ status, code: "BIRTH_DATE_RETIRED" }), false, String(status));
});

test("날짜가 바뀌면 확인 체크를 푼다 — blur 보정(1990-05-1 → 1990-05-01)도 바뀐 값이다. 같은 값이면 유지, 체크 안 했으면 그대로 false", () => {
  assert.equal(confirmAfterDateChange(true, "1990-05-10", "1990-05-01"), false);
  assert.equal(confirmAfterDateChange(true, "1990-05-01", ""), false);
  assert.equal(confirmAfterDateChange(true, "1990-05-01", "1990-05-01"), true);
  assert.equal(confirmAfterDateChange(false, "1990-05-10", "1990-05-01"), false);
});

test("덜 친 값 — 칸의 글자가 비어 있지 않고 확인창의 날짜와 다르면 입력 중이다", () => {
  assert.equal(isPendingInput("1990-05-1", "1990-05-10"), true);
  assert.equal(isPendingInput("19900501", ""), true);
  assert.equal(isPendingInput("", "1990-05-10"), false);
  assert.equal(isPendingInput("1990-05-10", "1990-05-10"), false);
});

test("체크 클릭 무시 — 입력 중이면 무시, 마우스(pointerdown) 뒤 날짜가 바뀌었으면 무시, 키보드(pointerdown 없음)나 날짜가 안 바뀌었으면 받는다", () => {
  assert.equal(ignoresCheck(true, null, null), true);
  assert.equal(ignoresCheck(false, 100, 101), true);
  assert.equal(ignoresCheck(false, 100, 100), true);
  assert.equal(ignoresCheck(false, 100, 99), false);
  assert.equal(ignoresCheck(false, 100, null), false);
  assert.equal(ignoresCheck(false, null, 101), false);
  assert.equal(ignoresCheck(false, null, null), false);
});
