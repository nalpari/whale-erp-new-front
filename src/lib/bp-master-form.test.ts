// node --test src/lib/bp-master-form.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bpMasterServerErrorField,
  emailError,
  EMPTY_BP_MASTER_FORM,
  formOfBpMaster,
  hasPendingVerification,
  isVerificationExpired,
  toCreateBpMasterInput,
  toUpdateBpMasterInput,
  validateBpMasterForm,
  verificationErrors,
  verificationRejection,
  type BpMasterForm,
} from "./bp-master-form.ts";
import type { BpMasterDetail } from "./bp-masters.ts";

const filled: BpMasterForm = {
  ...EMPTY_BP_MASTER_FORM,
  loginId: "hangang01",
  name: "정하윤",
  phone: ["010", "3380", "1127"],
  email: "Hayoon@Hangang.co.kr ",
  tradeName: " ㈜한강상회 ",
};

test("필수는 아이디 · 이름 · 연락처 · 이메일 · 상호명, 나머지는 적었을 때만 형식을 본다", () => {
  assert.deepEqual(Object.keys(validateBpMasterForm(EMPTY_BP_MASTER_FORM, "create")).sort(), ["email", "loginId", "name", "phone", "tradeName"]);
  assert.deepEqual(validateBpMasterForm(filled, "create"), {});
  const bad = { ...filled, ceoPhone: ["010", "1", ""] as BpMasterForm["ceoPhone"], ceoEmail: "ceo@", addressDetail: "302호" };
  assert.deepEqual(Object.keys(validateBpMasterForm(bad, "create")).sort(), ["addressDetail", "ceoEmail", "ceoPhone"]);
  // 수정은 아이디를 보지 않는다
  assert.equal(validateBpMasterForm({ ...filled, loginId: "" }, "edit").loginId, undefined);
});

test("인증 상자의 세 칸은 저장을 막지 않는다 — 인증 없이 저장할 수 있다", () => {
  const open = { ...filled, verifying: true, bizNumber: "12", ceoName: "", openDate: "" };
  assert.deepEqual(validateBpMasterForm(open, "create"), {});
  assert.equal(hasPendingVerification(open), true);
  assert.equal(hasPendingVerification({ ...filled, verifying: true }), false);
  // 등록은 처음부터 상자가 열려 있다(MY PAGE 처럼, 2026-10-28)
  assert.equal(EMPTY_BP_MASTER_FORM.verifying, true);
  assert.deepEqual(Object.keys(verificationErrors(open)).sort(), ["bizNumber", "ceoName", "openDate"]);
  assert.deepEqual(verificationErrors({ bizNumber: "105-86-33412", ceoName: "정하윤", openDate: "2016-05-20" }), {});
});

test("요청 — 다듬고 빈 선택 칸은 null, 이번 화면의 인증 토큰만 싣는다", () => {
  const input = toCreateBpMasterInput({ ...filled, verified: { bizNumber: "1058633412", ceoName: "정하윤", openDate: "2016-05-20", token: "t1" } });
  assert.deepEqual(input, {
    loginId: "hangang01",
    name: "정하윤",
    phone: "01033801127",
    email: "hayoon@hangang.co.kr",
    tradeName: "㈜한강상회",
    bizCeoPhone: null,
    bizCeoEmail: null,
    bizZipCode: null,
    bizAddress: null,
    bizAddressDetail: null,
    bizCategory: null,
    bizItem: null,
    verificationToken: "t1",
  });
  // 저장돼 있던 인증(토큰 없음)은 보내지 않는다 — api 가 그대로 둔다
  const kept = toUpdateBpMasterInput({ ...filled, verified: { bizNumber: "1058633412", ceoName: "정하윤", openDate: "2016-05-20" } });
  assert.equal("verificationToken" in kept, false);
  assert.equal("loginId" in kept, false);
});

test("상세로 채우면 인증된 BP 는 완료 카드 값을, 미인증 BP 는 빈 카드를 갖는다", () => {
  const detail = {
    loginId: "hangang01",
    name: "정하윤",
    phone: "01033801127",
    email: "hayoon@hangang.co.kr",
    tradeName: "㈜한강상회",
    bizRegistrationNumber: "1058633412",
    bizCeoName: "정하윤",
    bizOpenDate: "2016-05-20",
    bizVerifiedAt: "2025-02-03T02:10:00Z",
    bizCeoPhone: "0233801127",
    bizCeoEmail: null,
    bizZipCode: "04524",
    bizAddress: "서울 중구 세종대로 110",
    bizAddressDetail: "7층",
    bizCategory: "음식점업",
    bizItem: "한식 음식점",
    withdrawal: null,
  } as BpMasterDetail;
  const form = formOfBpMaster(detail);
  assert.deepEqual(form.verified, { bizNumber: "1058633412", ceoName: "정하윤", openDate: "2016-05-20" });
  assert.deepEqual(form.ceoPhone, ["02", "3380", "1127"]);
  assert.equal(form.verifying, false);
  assert.equal(formOfBpMaster({ ...detail, bizVerifiedAt: null, bizRegistrationNumber: null }).verified, null);
  // 인증이 없으면 상자를 열어 둔다
  assert.equal(formOfBpMaster({ ...detail, bizVerifiedAt: null, bizRegistrationNumber: null }).verifying, true);
  // 번호만 남고 인증 시각이 없는 BP 는 인증 완료 카드로 열지 않는다
  assert.equal(formOfBpMaster({ ...detail, bizVerifiedAt: null }).verified, null);
});

test("api 오류를 붙일 칸 — 중복 · 형식만, 수정의 아이디 오류는 띠로", () => {
  assert.equal(bpMasterServerErrorField(409, "이미 사용 중인 아이디입니다", "create"), "loginId");
  assert.equal(bpMasterServerErrorField(409, "이미 사용 중인 아이디입니다", "edit"), null);
  assert.equal(bpMasterServerErrorField(409, "이미 사용 중인 이메일입니다", "edit"), "email");
  assert.equal(bpMasterServerErrorField(400, "대표자 이메일 형식이 아닙니다", "edit"), "ceoEmail");
  assert.equal(bpMasterServerErrorField(409, "아이디 또는 이메일이 이미 쓰였습니다", "create"), null);
  assert.equal(bpMasterServerErrorField(409, "사용 중이거나 미사용인 다른 관리자 계정의 이메일입니다", "create"), "email");
  assert.equal(bpMasterServerErrorField(409, "이미 사용 중인 상호입니다", "create"), "tradeName");
  assert.equal(bpMasterServerErrorField(409, "이미 사용 중인 대표자 이메일입니다", "create"), "ceoEmail");
  assert.equal(bpMasterServerErrorField(500, "이메일", "create"), null);
});

test("대표자 연락처는 02 국번 9자리도 받는다(1팀 연락처 9~12자리, MY PAGE 와 같다)", () => {
  assert.equal(validateBpMasterForm({ ...filled, ceoPhone: ["02", "123", "4567"] }, "create").ceoPhone, undefined);
  assert.equal(validateBpMasterForm({ ...filled, ceoPhone: ["02", "12", "4567"] }, "create").ceoPhone, "대표자 연락처는 숫자 9~12자리입니다.");
});

test("emailError — 앞뒤 공백은 지우고 보고, 100자까지", () => {
  assert.equal(emailError(" a@b.co "), undefined);
  assert.equal(emailError(""), "이메일을 입력해 주세요.");
  assert.equal(emailError("a@b"), "이메일 형식이 아닙니다.");
  const local = (n: number) => `${"a".repeat(n - "@b.co".length)}@b.co`;
  assert.equal(emailError(local(100)), undefined);
  assert.equal(emailError(local(101)), "이메일 형식이 아닙니다.");
});

test("이번 화면의 인증은 10분이 지나면 저장 전에 푼다 — 저장돼 있던 인증(token 없음)은 보지 않는다", () => {
  const verified = { bizNumber: "1058633412", ceoName: "정하윤", openDate: "2016-05-20", token: "t", verifiedAt: 0 };
  assert.equal(isVerificationExpired({ verified }, 9 * 60_000 + 59_999), false);
  assert.equal(isVerificationExpired({ verified }, 10 * 60_000), true);
  assert.equal(isVerificationExpired({ verified: { ...verified, token: undefined, verifiedAt: undefined } }, 10 * 60_000), false);
  assert.equal(isVerificationExpired({ verified: null }, 10 * 60_000), false);
});

test("저장이 실어 보낸 인증 때문에 거절됐는가 — 토큰 만료 400 · 번호 중복 409 만, 토큰을 보냈을 때만", () => {
  const sent = { verified: { bizNumber: "1058633412", ceoName: "정하윤", openDate: "2016-05-20", token: "t", verifiedAt: 0 } };
  assert.equal(verificationRejection(sent, 400, "사업자정보 인증이 만료되었습니다. 다시 인증해 주세요."), "사업자정보 인증이 만료되었습니다. 다시 인증해 주세요.");
  assert.equal(verificationRejection(sent, 409, "이미 등록된 사업자등록번호입니다."), "이미 등록된 사업자등록번호입니다.");
  assert.equal(verificationRejection(sent, 409, "사용 중이거나 미사용인 다른 관리자 계정의 이메일입니다"), null);
  assert.equal(verificationRejection({ verified: { ...sent.verified, token: undefined } }, 409, "이미 등록된 사업자등록번호입니다."), null);
});

test("기본정보와 동일 — 저장된 대표자 값이 기본정보와 같고 비어 있지 않을 때만 켜고, 켜면 기본정보 값으로 검사 · 저장한다", () => {
  const detail = {
    bpCodeId: 1,
    bpCode: "BP000001",
    loginId: "hangang01",
    name: "정하윤",
    phone: "01033801127",
    email: "hayoon@hangang.co.kr",
    tradeName: "㈜한강상회",
    bizRegistrationNumber: null,
    bizCeoName: null,
    bizOpenDate: null,
    bizVerifiedAt: null,
    bizCeoPhone: "01033801127",
    bizCeoEmail: "Hayoon@Hangang.co.kr",
    bizZipCode: null,
    bizAddress: null,
    bizAddressDetail: null,
    bizCategory: null,
    bizItem: null,
    withdrawal: null,
  } as unknown as BpMasterDetail;
  const same = formOfBpMaster(detail);
  assert.equal(same.sameAsBasicPhone, true);
  assert.equal(same.sameAsBasicEmail, true);
  const differ = formOfBpMaster({ ...detail, bizCeoPhone: "0233801127", bizCeoEmail: null });
  assert.equal(differ.sameAsBasicPhone, false);
  assert.equal(differ.sameAsBasicEmail, false);
  // 등록은 꺼져 있다
  assert.equal(EMPTY_BP_MASTER_FORM.sameAsBasicPhone, false);
  // 켜면 적어 둔 대표자 값 대신 기본정보 값을 보낸다 — 적어 둔 값이 틀려도 검사에 걸리지 않는다
  const checked = { ...filled, ceoPhone: ["0", "", ""] as BpMasterForm["ceoPhone"], ceoEmail: "bad@", sameAsBasicPhone: true, sameAsBasicEmail: true };
  assert.deepEqual(validateBpMasterForm(checked, "create"), {});
  const input = toCreateBpMasterInput(checked);
  assert.equal(input.bizCeoPhone, "01033801127");
  assert.equal(input.bizCeoEmail, "hayoon@hangang.co.kr");
});
