// node --test src/lib/my-profile-form.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { MyProfile } from "./my-profile";
import { formOf, serverErrorField, splitPhone, toUpdateInput, validateCurrentPassword, validateMyProfileForm, type MyProfileForm } from "./my-profile-form.ts";

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
  // @ 앞은 api 가 64바이트까지만 받아 도메인을 늘려 잰다
  assert.equal(validateMyProfileForm({ ...filled, email: `${"a".repeat(60)}@${"b".repeat(35)}.com` }).email, undefined, "100자");
  assert.ok(validateMyProfileForm({ ...filled, email: `${"a".repeat(60)}@${"b".repeat(36)}.com` }).email, "100자 초과");
  // api @IsEmail 이 막는 값(규칙 자체는 email-format.test.ts)
  for (const bad of ["seojun@whale.c", "seojun@whale.co,"]) assert.equal(validateMyProfileForm({ ...filled, email: bad }).email, "이메일 형식이 올바르지 않습니다.", bad);
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

test("toUpdateInput — currentPassword 는 줄 때만 싣는다", () => {
  assert.deepEqual(toUpdateInput(filled, "2026-01-01T00:00:00.000Z", "Current1!"), {
    name: "이서준",
    phone: "01012345678",
    email: "seojun@whale.test",
    updatedAt: "2026-01-01T00:00:00.000Z",
    currentPassword: "Current1!",
  });
  assert.ok(!("currentPassword" in toUpdateInput(filled, "2026-01-01T00:00:00.000Z")));
});

test("validateCurrentPassword — 이메일을 바꿀 때만, 비어 있으면 오류", () => {
  assert.equal(validateCurrentPassword(false, ""), undefined);
  assert.equal(validateCurrentPassword(true, ""), "이메일을 바꾸려면 지금 비밀번호를 입력해 주세요.");
  assert.equal(validateCurrentPassword(true, "  "), "이메일을 바꾸려면 지금 비밀번호를 입력해 주세요.");
  assert.equal(validateCurrentPassword(true, "Current1!"), undefined);
});

test("serverErrorField — 비밀번호 · 이메일 문구만 그 칸, 나머지는 띠", () => {
  assert.equal(serverErrorField(409, "이미 등록된 이메일입니다."), "email");
  assert.equal(serverErrorField(400, "지금 비밀번호가 맞지 않습니다"), "currentPassword");
  assert.equal(serverErrorField(400, "형식이 올바르지 않습니다."), null);
  assert.equal(serverErrorField(401, "이메일"), null);
});
