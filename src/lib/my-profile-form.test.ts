// node --test src/lib/my-profile-form.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { MyProfile } from "./my-profile";
import { formOf, serverErrorField, splitPhone, toUpdateInput, validateMyProfileForm, type MyProfileForm } from "./my-profile-form.ts";

const filled: MyProfileForm = { name: " 이서준 ", phone: ["010", "1234", "5678"], email: " SeoJun@Whale.Test " };

test("다 채우면 오류가 없다", () => {
  assert.deepEqual(validateMyProfileForm(filled), {});
});

test("이름 — 한글 · 영문 2~20자", () => {
  assert.equal(validateMyProfileForm({ ...filled, name: "" }).name, "이름을 입력해 주세요.");
  assert.ok(validateMyProfileForm({ ...filled, name: "a" }).name, "1자");
  assert.ok(validateMyProfileForm({ ...filled, name: "이서준1" }).name, "숫자 섞임");
});

test("연락처 — 숫자 10~11자리", () => {
  assert.equal(validateMyProfileForm({ ...filled, phone: ["", "", ""] }).phone, "연락처를 입력해 주세요.");
  assert.ok(validateMyProfileForm({ ...filled, phone: ["010", "12", "5678"] }).phone, "9자리");
});

test("이메일 — 형식과 100자", () => {
  assert.equal(validateMyProfileForm({ ...filled, email: "" }).email, "이메일을 입력해 주세요.");
  assert.ok(validateMyProfileForm({ ...filled, email: "not-an-email" }).email);
  assert.ok(validateMyProfileForm({ ...filled, email: `${"a".repeat(95)}@a.com` }).email, "100자 초과");
});

test("splitPhone — 숫자만 세 칸으로, 02는 두 자리", () => {
  assert.deepEqual(splitPhone("01012345678"), ["010", "1234", "5678"]);
  assert.deepEqual(splitPhone("0212345678"), ["02", "1234", "5678"]);
  assert.deepEqual(splitPhone(""), ["", "", ""]);
});

test("formOf — 프로필 값을 칸으로", () => {
  const profile: MyProfile = {
    loginId: "seojun01",
    name: "이서준",
    phone: "01012345678",
    email: "seojun@whale.test",
    roleTypeCode: "BM",
    createdAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  assert.deepEqual(formOf(profile), { name: "이서준", phone: ["010", "1234", "5678"], email: "seojun@whale.test" });
});

test("toUpdateInput — 공백을 지우고 이메일은 소문자로, updatedAt 은 그대로 싣는다", () => {
  assert.deepEqual(toUpdateInput(filled, "2026-01-01T00:00:00.000Z"), {
    name: "이서준",
    phone: "01012345678",
    email: "seojun@whale.test",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
});

test("serverErrorField — 이메일 문구만 그 칸, 나머지는 띠", () => {
  assert.equal(serverErrorField(409, "이미 등록된 이메일입니다."), "email");
  assert.equal(serverErrorField(400, "형식이 올바르지 않습니다."), null);
  assert.equal(serverErrorField(401, "이메일"), null);
});
