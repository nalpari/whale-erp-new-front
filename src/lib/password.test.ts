import assert from "node:assert/strict";
import { test } from "node:test";
import { passwordChecks } from "./password.ts";

const met = (password: string, loginId = "whaleadmin") => passwordChecks(password, loginId).map((c) => c.met);

test("passwordChecks: 영문·숫자·허용 특수문자 8~20자면 둘 다 충족", () => {
  assert.deepEqual(met("abcd123!"), [true, true]);
  assert.deepEqual(met("A1?" + "a".repeat(17)), [true, true]);
});

test("passwordChecks: 길이·종류가 모자라면 첫 조건 미충족", () => {
  assert.equal(met("ab12!")[0], false);
  assert.equal(met("A1!" + "a".repeat(18))[0], false);
  assert.equal(met("abcdefgh1")[0], false);
  assert.equal(met("12345678!")[0], false);
});

test("passwordChecks: 공백·허용하지 않는 특수문자는 미충족", () => {
  assert.equal(met("abcd 123!")[0], false);
  assert.equal(met("abcd123~")[0], false);
});

test("passwordChecks: 아이디와 같으면(대소문자 무시) 미충족, 빈 값도 미충족", () => {
  assert.equal(met("Admin12!x", "admin12!X")[1], false);
  assert.equal(met("")[1], false);
});
