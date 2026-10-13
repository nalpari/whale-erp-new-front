// node --test src/lib/code-validation.test.ts
// Node 24 가 타입을 벗겨 그대로 실행한다. 테스트 도구를 따로 깔지 않는다.
import assert from "node:assert/strict";
import { test } from "node:test";
import { codeFormatError, duplicateCodes, normalizeCode } from "./code-validation.ts";

test("소문자로 치면 대문자로 바꾸고 앞뒤 공백을 뺀다", () => {
  assert.equal(normalizeCode(" full_time "), "FULL_TIME");
  assert.equal(normalizeCode("Pos2"), "POS2");
});

test("영문 대문자·숫자·밑줄, 영문으로 시작, 20자 이내만 통과한다", () => {
  for (const ok of ["A", "A".repeat(20), "POS_2", "TABLE_ORDER"]) assert.equal(codeFormatError(ok), null, ok);
});

test("비었거나 형식이 틀리면 오류 문구를 준다", () => {
  assert.equal(codeFormatError(""), "코드를 입력해 주세요.");
  for (const bad of ["1POS", "_POS", "A".repeat(21), "POS-2", "POS 2", "가나", "pos"])
    assert.equal(codeFormatError(bad), "영문 대문자·숫자·밑줄만 쓰고 영문으로 시작하며 20자 이내입니다.", bad);
});

test("새 코드가 기존 코드나 다른 새 코드와 겹치면 그 코드를 돌려준다", () => {
  assert.deepEqual([...duplicateCodes(["SERVICE", "POS"], ["KIOSK", "POS"])], ["POS"]);
  assert.deepEqual([...duplicateCodes([], ["BANK", "CARD", "BANK"])], ["BANK"]);
  assert.deepEqual([...duplicateCodes(["SERVICE"], ["BANK"])], []);
});

test("빈 새 코드는 중복으로 세지 않는다 — 빈칸 오류가 따로 난다", () => {
  assert.deepEqual([...duplicateCodes([], ["", ""])], []);
});
