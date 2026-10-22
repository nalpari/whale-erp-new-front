// node --test src/lib/bp-profile-form.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { BpProfile } from "./bp-profile";
import {
  currentVerification,
  emptyVerifyFields,
  formOf,
  hasPendingVerification,
  hasUnverifiedChange,
  isVerified,
  missingVerifyMessage,
  serverErrorField,
  toUpdateBpProfileInput,
  toVerifyInput,
  validateBpProfileForm,
  validateVerifyForm,
  verifyFormOf,
  type BpProfileForm,
  type VerifyForm,
} from "./bp-profile-form.ts";

const profile: BpProfile = {
  tradeName: "한강상회",
  bizRegistrationNumber: "2118701234",
  bizCeoName: "남도현",
  bizOpenDate: "2021-03-15",
  bizCeoPhone: "01055301182",
  bizCeoEmail: "ceo@hangang.co.kr",
  bizZipCode: "04007",
  bizAddress: "서울 마포구 망원로 42",
  bizAddressDetail: "3층",
  bizCategory: "도소매업",
  bizItem: "식자재 유통",
  bizVerifiedAt: "2026-03-04T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const unverified: BpProfile = {
  ...profile,
  bizRegistrationNumber: "",
  bizCeoName: "",
  bizOpenDate: null,
  bizVerifiedAt: null,
};

const filledForm: BpProfileForm = {
  tradeName: " ㈜한강상회 ",
  bizCeoPhone: ["010", "5530", "1182"],
  sameAsBasicPhone: false,
  bizCeoEmail: " CEO@Hangang.co.kr ",
  sameAsBasicEmail: false,
  address: {
    zipCode: "04007",
    address: "서울 마포구 망원로 42",
    addressDetail: " 3층 ",
  },
  bizCategory: " 도소매업 ",
  bizItem: " 식자재 유통 ",
};

const emptyForm: BpProfileForm = {
  tradeName: "한강상회",
  bizCeoPhone: ["", "", ""],
  sameAsBasicPhone: false,
  bizCeoEmail: "",
  sameAsBasicEmail: false,
  address: { zipCode: "", address: "", addressDetail: "" },
  bizCategory: "",
  bizItem: "",
};

test("formOf — BpProfile 값을 칸으로, 전화는 세 칸으로 나눈다. 기본정보 값과 다르면 동일 체크박스는 꺼진다", () => {
  assert.deepEqual(formOf(profile, "01000000000", "other@whale.test"), {
    tradeName: "한강상회",
    bizCeoPhone: ["010", "5530", "1182"],
    sameAsBasicPhone: false,
    bizCeoEmail: "ceo@hangang.co.kr",
    sameAsBasicEmail: false,
    address: {
      zipCode: "04007",
      address: "서울 마포구 망원로 42",
      addressDetail: "3층",
    },
    bizCategory: "도소매업",
    bizItem: "식자재 유통",
  });
});

test("formOf — 저장된 대표자 연락처 · 이메일이 지금 기본정보 값과 같으면 동일 체크박스가 켜진다(store-form.ts sameAddress 와 같은 패턴)", () => {
  const form = formOf(profile, "01055301182", "ceo@hangang.co.kr");
  assert.equal(form.sameAsBasicPhone, true);
  assert.equal(form.sameAsBasicEmail, true);
});

test("formOf — 기본정보 값이 비어 있으면(아직 못 받음 등) 같아 보여도 동일로 켜지 않는다", () => {
  const empty: BpProfile = { ...profile, bizCeoPhone: "", bizCeoEmail: "" };
  const form = formOf(empty, "", "");
  assert.equal(form.sameAsBasicPhone, false);
  assert.equal(form.sameAsBasicEmail, false);
});

test("verifyFormOf — 저장된 값으로 칸을 채우고(재인증도 이 칸을 그대로 고쳐 쓴다), verification 은 늘 null", () => {
  assert.deepEqual(verifyFormOf(profile), {
    savedBizNumber: "2118701234",
    savedCeoName: "남도현",
    savedOpenDate: "2021-03-15",
    savedVerifiedAt: "2026-03-04T00:00:00.000Z",
    bizRegistrationNumber: "2118701234",
    bizCeoName: "남도현",
    bizOpenDate: "2021-03-15",
    verification: null,
  });
  assert.deepEqual(verifyFormOf(unverified), {
    savedBizNumber: "",
    savedCeoName: "",
    savedOpenDate: "",
    savedVerifiedAt: null,
    bizRegistrationNumber: "",
    bizCeoName: "",
    bizOpenDate: "",
    verification: null,
  });
});

test("validateBpProfileForm — 다 채우면 오류가 없다", () => {
  assert.deepEqual(validateBpProfileForm(filledForm), {});
});

test("validateBpProfileForm — 상호명만 필수, 나머지는 비워도 된다", () => {
  assert.deepEqual(validateBpProfileForm(emptyForm), {});
  assert.equal(validateBpProfileForm({ ...filledForm, tradeName: "" }).tradeName, "상호명을 입력해 주세요.");
  assert.equal(validateBpProfileForm({ ...filledForm, tradeName: "a".repeat(51) }).tradeName, "상호명은 1~50자입니다.");
});

test("validateBpProfileForm — 채웠을 때만 형식을 본다(연락처 · 이메일)", () => {
  assert.ok(validateBpProfileForm({ ...filledForm, bizCeoPhone: ["01", "12", "5678"] }).bizCeoPhone, "8자리");
  assert.ok(validateBpProfileForm({ ...filledForm, bizCeoEmail: "not-an-email" }).bizCeoEmail);
});

test("validateBpProfileForm — 기본정보와 동일 체크박스가 켜 있으면 형식을 보지 않는다", () => {
  assert.deepEqual(
    validateBpProfileForm({
      ...filledForm,
      bizCeoPhone: ["01", "12", "5678"],
      sameAsBasicPhone: true,
    }),
    {},
  );
  assert.deepEqual(
    validateBpProfileForm({
      ...filledForm,
      bizCeoEmail: "not-an-email",
      sameAsBasicEmail: true,
    }),
    {},
  );
});

test("toUpdateBpProfileInput — 공백을 지우고, 빈 칸은 보내지 않는다(api @IsOptional 이 undefined 만 건너뛴다). verification 없으면 토큰도 싣지 않는다", () => {
  const verifyForm = verifyFormOf(profile);
  assert.deepEqual(toUpdateBpProfileInput(filledForm, "2026-01-01T00:00:00.000Z", "01000000000", "basic@whale.test", verifyForm), {
    tradeName: "㈜한강상회",
    updatedAt: "2026-01-01T00:00:00.000Z",
    bizCeoPhone: "01055301182",
    bizCeoEmail: "CEO@Hangang.co.kr",
    bizZipCode: "04007",
    bizAddress: "서울 마포구 망원로 42",
    bizAddressDetail: "3층",
    bizCategory: "도소매업",
    bizItem: "식자재 유통",
  });
  const input = toUpdateBpProfileInput(emptyForm, "2026-01-01T00:00:00.000Z", "", "", verifyFormOf(unverified));
  assert.deepEqual(input, {
    tradeName: "한강상회",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
});

test("toUpdateBpProfileInput — 기본정보와 동일 체크박스가 켜 있으면 기본정보 값을 보낸다", () => {
  const form: BpProfileForm = {
    ...filledForm,
    sameAsBasicPhone: true,
    sameAsBasicEmail: true,
  };
  const input = toUpdateBpProfileInput(form, "2026-01-01T00:00:00.000Z", "01000000000", "basic@whale.test", verifyFormOf(profile));
  assert.equal(input.bizCeoPhone, "01000000000");
  assert.equal(input.bizCeoEmail, "basic@whale.test");
});

test("toUpdateBpProfileInput — 이번 화면에서 지금 칸 값으로 통과한 verification 이 있으면 그 토큰을 businessVerificationToken 으로 싣는다", () => {
  const verifyForm: VerifyForm = {
    ...verifyFormOf(unverified),
    bizRegistrationNumber: "2118701234",
    bizCeoName: "남도현",
    bizOpenDate: "2021-03-15",
    verification: { token: "tok", verifiedAt: 1, bizRegistrationNumber: "2118701234", bizCeoName: "남도현", bizOpenDate: "2021-03-15" },
  };
  const input = toUpdateBpProfileInput(emptyForm, "2026-01-01T00:00:00.000Z", "", "", verifyForm);
  assert.equal(input.businessVerificationToken, "tok");
});

test("validateVerifyForm — 세 값 모두 필수", () => {
  const filled = { bizRegistrationNumber: "211-87-01234", bizCeoName: "남도현", bizOpenDate: "2021-03-15" };
  assert.deepEqual(validateVerifyForm(filled), {});
  assert.equal(validateVerifyForm({ ...filled, bizRegistrationNumber: "" }).bizRegistrationNumber, "사업자등록번호를 입력해 주세요.");
  assert.equal(validateVerifyForm({ ...filled, bizRegistrationNumber: "123" }).bizRegistrationNumber, "사업자등록번호는 숫자 10자리입니다.");
  assert.equal(validateVerifyForm({ ...filled, bizCeoName: "" }).bizCeoName, "대표자명을 입력해 주세요.");
  assert.equal(validateVerifyForm({ ...filled, bizOpenDate: "" }).bizOpenDate, "개업일자를 입력해 주세요.");
});

test("emptyVerifyFields · missingVerifyMessage — 비어 있는 칸만 가운뎃점으로 모은다(점포 사업자정보와 같은 형식)", () => {
  const filled = { bizRegistrationNumber: "211-87-01234", bizCeoName: "남도현", bizOpenDate: "2021-03-15" };
  assert.deepEqual(emptyVerifyFields(filled), []);
  assert.deepEqual(emptyVerifyFields({ ...filled, bizRegistrationNumber: "123" }), []);
  assert.equal(missingVerifyMessage([]), null);
  assert.equal(
    missingVerifyMessage(emptyVerifyFields({ bizRegistrationNumber: "", bizCeoName: " ", bizOpenDate: "" })),
    "사업자등록번호·대표자명·개업일자 항목을 입력해 주세요.",
  );
  assert.equal(
    missingVerifyMessage(emptyVerifyFields({ ...filled, bizRegistrationNumber: "", bizCeoName: "" })),
    "사업자등록번호·대표자명 항목을 입력해 주세요.",
  );
});

test("toVerifyInput — 사업자등록번호는 하이픈을 지우고 숫자만 보낸다. updatedAt 은 싣지 않는다(검사만, 저장이 아니다)", () => {
  assert.deepEqual(toVerifyInput({ bizRegistrationNumber: "211-87-01234", bizCeoName: " 남도현 ", bizOpenDate: "2021-03-15" }), {
    bizRegistrationNumber: "2118701234",
    bizCeoName: "남도현",
    bizOpenDate: "2021-03-15",
  });
});

test("currentVerification — 지금 칸 값과 같을 때만 돌려준다. 칸을 고치면(인증 뒤에도) null", () => {
  const base = verifyFormOf(unverified);
  const token = { token: "tok", verifiedAt: 1, bizRegistrationNumber: "2118701234", bizCeoName: "남도현", bizOpenDate: "2021-03-15" };
  const matching: VerifyForm = { ...base, bizRegistrationNumber: "2118701234", bizCeoName: "남도현", bizOpenDate: "2021-03-15", verification: token };
  assert.deepEqual(currentVerification(matching), token);
  const edited: VerifyForm = { ...matching, bizCeoName: "다른대표" };
  assert.equal(currentVerification(edited), null);
  assert.equal(currentVerification(base), null);
});

test("isVerified — 저장된 번호가 있거나 이번 화면 인증이 지금 칸과 맞으면 참", () => {
  assert.equal(isVerified(verifyFormOf(profile)), true);
  assert.equal(isVerified(verifyFormOf(unverified)), false);
  const base = verifyFormOf(unverified);
  const fresh: VerifyForm = {
    ...base,
    bizRegistrationNumber: "2118701234",
    bizCeoName: "남도현",
    bizOpenDate: "2021-03-15",
    verification: { token: "tok", verifiedAt: 1, bizRegistrationNumber: "2118701234", bizCeoName: "남도현", bizOpenDate: "2021-03-15" },
  };
  assert.equal(isVerified(fresh), true);
});

test("hasPendingVerification — 이번 화면에서 통과했지만 저장된 값과 다를 때만 참", () => {
  assert.equal(hasPendingVerification(verifyFormOf(profile)), false);
  const base = verifyFormOf(profile);
  const same: VerifyForm = { ...base, verification: { token: "t", verifiedAt: 1, bizRegistrationNumber: "2118701234", bizCeoName: "남도현", bizOpenDate: "2021-03-15" } };
  assert.equal(hasPendingVerification(same), false);
  const changed: VerifyForm = {
    ...verifyFormOf(profile),
    bizCeoName: "새대표",
    verification: { token: "t", verifiedAt: 1, bizRegistrationNumber: "2118701234", bizCeoName: "새대표", bizOpenDate: "2021-03-15" },
  };
  assert.equal(hasPendingVerification(changed), true);
});

test("hasUnverifiedChange — 인증 없이 칸만 고쳤으면 참. 저장된 값으로 되돌리면(지우기·사용안함) 거짓", () => {
  const base = verifyFormOf(profile);
  assert.equal(hasUnverifiedChange(base), false);
  const typedOnly: VerifyForm = { ...base, bizCeoName: "새대표" };
  assert.equal(hasUnverifiedChange(typedOnly), true);
  const verified: VerifyForm = {
    ...base,
    bizCeoName: "새대표",
    verification: { token: "t", verifiedAt: 1, bizRegistrationNumber: base.savedBizNumber, bizCeoName: "새대표", bizOpenDate: base.savedOpenDate },
  };
  assert.equal(hasUnverifiedChange(verified), false);
  const revertedToSaved: VerifyForm = { ...base, bizCeoName: "새대표", bizRegistrationNumber: base.savedBizNumber, bizOpenDate: base.savedOpenDate };
  assert.equal(hasUnverifiedChange({ ...revertedToSaved, bizCeoName: base.savedCeoName }), false);
});

test("serverErrorField — 상호명 · 연락처 · 이메일 · 업태 · 종목 문구만 그 칸, 나머지는 띠", () => {
  assert.equal(serverErrorField(400, "상호명은 1~50자로 입력해 주세요."), "tradeName");
  assert.equal(serverErrorField(400, "대표자 연락처는 숫자 9~11자리입니다"), "bizCeoPhone");
  assert.equal(serverErrorField(400, "대표자 이메일 형식이 아닙니다"), "bizCeoEmail");
  assert.equal(serverErrorField(409, "다른 곳에서 먼저 수정했습니다. 최신 정보를 불러온 뒤 다시 저장해 주세요"), null);
  assert.equal(serverErrorField(401, "상호명"), null);
});
