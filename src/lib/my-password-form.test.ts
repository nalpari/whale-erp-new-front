// node --test src/lib/my-password-form.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { myPasswordErrorField } from "./my-password-form.ts";

test("myPasswordErrorField — 현재 비밀번호 불일치만 그 칸, 확인 불일치는 확인 칸, 나머지 정책 위반은 새 비밀번호 칸", () => {
  assert.equal(myPasswordErrorField(400, "현재 비밀번호가 올바르지 않습니다."), "current");
  assert.equal(myPasswordErrorField(400, "새 비밀번호가 일치하지 않습니다."), "newPasswordConfirm");
  assert.equal(myPasswordErrorField(400, "영문·숫자·특수문자를 각각 1자 이상 포함해 8~20자로 입력해 주세요."), "newPassword");
  assert.equal(myPasswordErrorField(400, "비밀번호는 아이디와 다르게 설정해 주세요."), "newPassword");
  assert.equal(myPasswordErrorField(400, "사용할 수 없는 문자가 포함되어 있습니다."), "newPassword");
  // "현재 비밀번호"를 담고 있지만 틀렸다는 뜻이 아니다 — 새 비밀번호가 지금 쓰는 것과 같다는 뜻이라 새 비밀번호 칸이다.
  assert.equal(myPasswordErrorField(400, "현재 비밀번호와 다른 비밀번호를 입력해 주세요."), "newPassword");
});

test("myPasswordErrorField — 400 이 아니면(세션 만료 · 연결 실패 등) 칸이 아니라 띠", () => {
  assert.equal(myPasswordErrorField(401, "현재 비밀번호가 올바르지 않습니다."), null);
  assert.equal(myPasswordErrorField(undefined, "비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요."), null);
});
