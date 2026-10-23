// node --test src/lib/platform-admin-form.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { PlatformAdminDetail } from "./platform-admins";
import {
  EMPTY_FORM,
  emailError,
  formOf,
  isOriginalEmail,
  LOGIN_ID_FORMAT_ERROR,
  LOGIN_ID_TAKEN,
  loginIdCheckOutcome,
  loginIdError,
  saveBlockingErrors,
  serverErrorField,
  serverFieldMessage,
  splitPhone,
  toCreateInput,
  toUpdateInput,
  validateAdminForm,
  type AdminForm,
} from "./platform-admin-form.ts";

const filled: AdminForm = {
  ...EMPTY_FORM,
  loginId: " seojun01 ",
  name: " 이서준 ",
  phone: ["010", "1234", "5678"],
  email: " SeoJun@Whale.Test ",
  department: " ",
  jobTitle: "매니저",
  roleGroupId: "3",
};

test("다 채우면 오류가 없다", () => {
  assert.deepEqual(validateAdminForm(filled, "create"), {});
});

test("아이디 — 영문 하나 이상 · 영문 숫자만 · 4~20자, 수정에서는 보지 않는다", () => {
  assert.ok(validateAdminForm({ ...filled, loginId: "12345" }, "create").loginId, "숫자만");
  assert.ok(validateAdminForm({ ...filled, loginId: "seo_jun" }, "create").loginId, "밑줄");
  assert.ok(validateAdminForm({ ...filled, loginId: "abc" }, "create").loginId, "3자");
  assert.equal(validateAdminForm({ ...filled, loginId: "" }, "create").loginId, "아이디를 입력해 주세요.");
  assert.equal(validateAdminForm({ ...filled, loginId: "" }, "edit").loginId, undefined);
});

test("칸을 벗어날 때의 아이디 형식 검사 — 앞뒤 공백은 빼고 본다", () => {
  assert.equal(loginIdError(" seojun01 "), undefined);
  assert.equal(loginIdError(""), "아이디를 입력해 주세요.");
  assert.equal(loginIdError("1234"), "아이디는 영문 또는 영문 · 숫자 조합으로 4~20자입니다.");
});

test("칸을 벗어날 때의 이메일 형식 검사 — 앞뒤 공백은 빼고 본다", () => {
  assert.equal(emailError("  a@b.co  "), undefined);
  assert.equal(emailError(" "), "이메일을 입력해 주세요.");
  assert.ok(emailError("seojun@"));
});

test("이메일 형식 — api @IsEmail 이 막는 값은 화면도 형식 오류로", () => {
  // 아래 값은 2026-10-23 에 api 의 validator(13.15) isEmail 결과와 손으로 맞춰 보았다 — 저장소에 비교 검사는 없다
  for (const ok of ["kim@whale.co", "SeoJun@Whale.Test", "kim.lee@mail.whale.kr", "kim@회사.한국", "kim@whale.xn--3e0b707e", "a+b_c@wh-ale.io"]) {
    assert.equal(emailError(ok), undefined, ok);
  }
  const rejected = ["kim@whale.c", "kim@whale..co", "kim@.whale.co", ".kim@whale.co", "kim.@whale.co", "kim..lee@whale.co", "kim@whale.123", "kim@whale"];
  rejected.push("kim@-whale.co", "kim@whale-.co", "kim@whale_x.co", "a,b@x.co", "a(b@x.co", "kim@whale.co-", "kim@whale.xn--");
  for (const bad of rejected) {
    assert.equal(emailError(bad), "이메일 형식이 아닙니다.", bad);
  }
});

test("필수 칸 — 이름 · 연락처 · 이메일 · 사용자 권한", () => {
  const errors = validateAdminForm({ ...filled, name: "", phone: ["010", "", ""], email: "", roleGroupId: "" }, "create");
  assert.deepEqual(Object.keys(errors).sort(), ["email", "name", "phone", "roleGroupId"]);
  assert.ok(validateAdminForm({ ...filled, name: "이" }, "create").name, "1자");
  assert.ok(validateAdminForm({ ...filled, email: "seojun@" }, "create").email);
  assert.ok(validateAdminForm({ ...filled, phone: ["010", "12a4", "5678"] }, "create").phone);
});

test("등록 요청 — 공백을 빼고, 이메일은 소문자로, 빈 선택 칸은 null", () => {
  assert.deepEqual(toCreateInput(filled), {
    loginId: "seojun01",
    name: "이서준",
    phone: "01012345678",
    email: "seojun@whale.test",
    department: null,
    jobTitle: "매니저",
    zipCode: null,
    address: null,
    addressDetail: null,
    roleGroupId: 3,
  });
});

test("수정 요청 — 상태와 상세의 updatedAt 을 싣고 아이디는 싣지 않는다", () => {
  const input = toUpdateInput({ ...filled, accountStatus: "INACTIVE" }, "2026-10-13T00:00:00.000Z");
  assert.equal(input.accountStatus, "INACTIVE");
  assert.equal(input.updatedAt, "2026-10-13T00:00:00.000Z");
  assert.equal("loginId" in input, false);
});

test("연락처를 세 칸으로 나눈다", () => {
  assert.deepEqual(splitPhone("01012345678"), ["010", "1234", "5678"]);
  assert.deepEqual(splitPhone("0311234567"), ["031", "123", "4567"]);
  assert.deepEqual(splitPhone("0212345678"), ["02", "1234", "5678"]);
  assert.deepEqual(splitPhone(null), ["", "", ""]);
});

test("상세 값으로 수정 칸을 채운다 — 빈 값은 빈 문자열", () => {
  const detail = {
    loginId: "seojun01",
    name: "이서준",
    phone: "01012345678",
    email: "seojun@whale.test",
    department: null,
    jobTitle: "매니저",
    zipCode: "06236",
    address: "서울 강남구 테헤란로 152",
    addressDetail: null,
    roleGroup: { roleGroupId: 3, roleCode: "PA000002", name: "고객지원 담당", roleTypeCode: "PA" },
    accountStatus: "INACTIVE",
  } as PlatformAdminDetail;
  const form = formOf(detail);
  assert.deepEqual(form.phone, ["010", "1234", "5678"]);
  assert.equal(form.department, "");
  assert.equal(form.roleGroupId, "3");
  assert.equal(form.accountStatus, "INACTIVE");
});

test("경계값 — 아이디 4 · 20자, 이메일 100자, 칸별 공백", () => {
  assert.equal(validateAdminForm({ ...filled, loginId: "abcd" }, "create").loginId, undefined);
  assert.equal(validateAdminForm({ ...filled, loginId: "a".repeat(20) }, "create").loginId, undefined);
  assert.ok(validateAdminForm({ ...filled, loginId: "a".repeat(21) }, "create").loginId);
  // 수정에서는 형식이 틀린 아이디도 보지 않는다(바꿀 수 없는 칸)
  assert.equal(validateAdminForm({ ...filled, loginId: "bad_id" }, "edit").loginId, undefined);
  assert.equal(validateAdminForm({ ...filled, email: "a".repeat(95) + "@b.co" }, "create").email, undefined);
  assert.equal(validateAdminForm({ ...filled, email: "a".repeat(96) + "@b.co" }, "create").email, "이메일 형식이 아닙니다.");
  assert.equal(toCreateInput({ ...filled, phone: ["010", " 1234 ", "5678"] }).phone, "01012345678");
});

test("상세주소만 있고 기본주소가 없으면 막는다", () => {
  assert.equal(validateAdminForm({ ...filled, addressDetail: "302호" }, "create").addressDetail, "주소를 먼저 검색해 주세요.");
  const withAddress = { ...filled, zipCode: "06236", address: "서울 강남구 테헤란로 152", addressDetail: "302호" };
  assert.equal(validateAdminForm(withAddress, "create").addressDetail, undefined);
});

test("api 오류를 붙일 칸 — 400 · 409 의 아이디 · 이메일만, 수정의 아이디는 띠로", () => {
  const taken = "이미 사용 중인 아이디입니다. 삭제된 계정의 아이디도 다시 쓸 수 없습니다";
  assert.equal(serverErrorField(409, taken, "create"), "loginId");
  assert.equal(serverErrorField(409, taken, "edit"), null);
  assert.equal(serverErrorField(409, "이미 다른 관리자 계정에 등록된 이메일입니다", "edit"), "email");
  assert.equal(serverErrorField(409, "이미 다른 관리자 계정에 등록된 이메일입니다", "create"), "email");
  assert.equal(serverErrorField(409, "아이디 또는 이메일이 방금 다른 계정에 등록되었습니다", "create"), null);
  assert.equal(serverErrorField(403, "아이디 …", "create"), null);
  assert.equal(serverErrorField(undefined, "아이디 …", "create"), null);
});

test("칸에 붙일 api 오류 문구 — 아이디는 화면 문구로, 이메일은 api 문구 그대로", () => {
  const apiTaken = "이미 사용 중인 아이디입니다. 삭제된 계정의 아이디도 다시 쓸 수 없습니다";
  assert.equal(serverFieldMessage("loginId", 409, apiTaken), LOGIN_ID_TAKEN);
  assert.equal(serverFieldMessage("loginId", 400, "아이디는 영문 또는 영문 · 숫자 조합으로 4~20자입니다"), LOGIN_ID_FORMAT_ERROR);
  assert.equal(LOGIN_ID_FORMAT_ERROR, loginIdError("1234"), "화면 형식 검사와 같은 문구");
  const emailTaken = "이미 다른 관리자 계정에 등록된 이메일입니다";
  assert.equal(serverFieldMessage("email", 409, emailTaken), emailTaken);
});

test("여러 칸 검증 오류(400 배열)는 칸에 붙이지 않고 띠로 — 아이디 칸에 남아 저장을 막지 않게", () => {
  const joined = "아이디는 영문 또는 영문 · 숫자 조합으로 4~20자입니다, 이메일 형식이 아닙니다";
  assert.equal(serverErrorField(400, joined, "create"), null);
  assert.equal(serverErrorField(400, "아이디는 영문 또는 영문 · 숫자 조합으로 4~20자입니다", "create"), "loginId");
});

test("중복확인 답 → 화면 상태 — 사용 중 · 400 은 칸 오류, 401 · 403 은 띠, 그 밖은 확인 실패(저장은 막지 않는다)", () => {
  assert.deepEqual(loginIdCheckOutcome({ ok: true, available: true }), { check: "available" });
  assert.deepEqual(loginIdCheckOutcome({ ok: true, available: false }), { check: "idle", fieldError: LOGIN_ID_TAKEN });
  assert.deepEqual(loginIdCheckOutcome({ ok: false, status: 400, message: "아이디는 …" }), { check: "idle", fieldError: LOGIN_ID_FORMAT_ERROR });
  assert.deepEqual(loginIdCheckOutcome({ ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." }), {
    check: "idle",
    failure: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
  });
  // 403(등록 권한 없음)은 저장해도 막히므로 띠로 바로 알린다
  assert.deepEqual(loginIdCheckOutcome({ ok: false, status: 403, message: "권한이 없습니다" }), { check: "idle", failure: "권한이 없습니다" });
  for (const status of [404, 409, 429, 500, undefined]) {
    assert.deepEqual(loginIdCheckOutcome({ ok: false, status, message: "…" }), { check: "failed" }, `status ${status}`);
  }
});

test("저장을 막는 오류 — 서버가 거절한 아이디만 막고, 이메일 서버 오류는 막지 않는다", () => {
  assert.deepEqual(saveBlockingErrors(filled, "create", { loginId: LOGIN_ID_TAKEN }), { loginId: LOGIN_ID_TAKEN });
  assert.deepEqual(saveBlockingErrors(filled, "create", { email: "이미 다른 관리자 계정에 등록된 이메일입니다" }), {});
  // 같은 칸에 입력 검사 문구가 있으면 그쪽이 앞선다
  assert.equal(saveBlockingErrors({ ...filled, loginId: "" }, "create", { loginId: LOGIN_ID_TAKEN }).loginId, "아이디를 입력해 주세요.");
});

test("수정 화면의 원래 이메일 — 앞뒤 공백 · 대소문자는 보지 않는다", () => {
  assert.equal(isOriginalEmail(" SeoJun@Whale.Test ", "seojun@whale.test"), true);
  assert.equal(isOriginalEmail("seojun2@whale.test", "seojun@whale.test"), false);
  assert.equal(isOriginalEmail("", null), true);
  assert.equal(isOriginalEmail("a@b.co", null), false);
});
