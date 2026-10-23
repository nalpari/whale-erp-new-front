// node --test src/lib/bp-master-form.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bpMasterServerErrorField,
  EMPTY_BP_MASTER_FORM,
  formOfBpMaster,
  hasPendingVerification,
  toCreateBpMasterInput,
  toUpdateBpMasterInput,
  validateBpMasterForm,
  verificationErrors,
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
  } as BpMasterDetail;
  const form = formOfBpMaster(detail);
  assert.deepEqual(form.verified, { bizNumber: "1058633412", ceoName: "정하윤", openDate: "2016-05-20" });
  assert.deepEqual(form.ceoPhone, ["02", "3380", "1127"]);
  assert.equal(form.verifying, false);
  assert.equal(formOfBpMaster({ ...detail, bizVerifiedAt: null, bizRegistrationNumber: null }).verified, null);
});

test("api 오류를 붙일 칸 — 중복 · 형식만, 수정의 아이디 오류는 띠로", () => {
  assert.equal(bpMasterServerErrorField(409, "이미 사용 중인 아이디입니다", "create"), "loginId");
  assert.equal(bpMasterServerErrorField(409, "이미 사용 중인 아이디입니다", "edit"), null);
  assert.equal(bpMasterServerErrorField(409, "이미 사용 중인 이메일입니다", "edit"), "email");
  assert.equal(bpMasterServerErrorField(400, "대표자 이메일 형식이 아닙니다", "edit"), "ceoEmail");
  assert.equal(bpMasterServerErrorField(409, "아이디 또는 이메일이 이미 쓰였습니다", "create"), null);
  assert.equal(bpMasterServerErrorField(500, "이메일", "create"), null);
});
