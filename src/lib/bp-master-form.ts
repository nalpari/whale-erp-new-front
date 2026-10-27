// BP 마스터 계정 등록 · 수정 폼의 칸 값 · 검사 · 요청 만들기. 패널(src/app/bp-masters/)에서 뺀 순수 함수라 node --test 로 검사한다.
// 규칙은 okf bp.md · 지시서(docs/plans/2026-10-22-bp-masters.md)와 같다 — api 가 다시 막으므로 화면은 저장 전에 칸 아래 먼저 알리기만 한다.
// node --test 가 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { BpMasterDetail, CreateBpMasterInput, UpdateBpMasterInput } from "./bp-masters.ts";
import { loginIdError, NAME_PATTERN, PHONE_PATTERN, splitPhone } from "./platform-admin-form.ts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BIZ_NUMBER_PATTERN = /^[0-9]{10}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 진위확인을 통과한 세 값. token 은 이번 화면에서 받은 것만 있다(수정에서 저장돼 있던 인증은 token 이 없다). */
export type BpVerified = { bizNumber: string; ceoName: string; openDate: string; token?: string };

/** 입력칸 값 그대로. 연락처는 세 칸이다. */
export type BpMasterForm = {
  loginId: string;
  name: string;
  phone: [string, string, string];
  email: string;
  tradeName: string;
  ceoPhone: [string, string, string];
  ceoEmail: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  category: string;
  item: string;
  /** 진위확인 입력 — 인증 상자를 펼쳤을 때만 쓴다 */
  bizNumber: string;
  ceoName: string;
  openDate: string;
  /** 인증 상자를 펼쳤는가. 처음엔 접혀 있고 [사업자 번호 인증하기] · [재인증]으로 연다 */
  verifying: boolean;
  /** 인증 완료 카드에 보이는 값 — 수정은 저장돼 있던 인증, 등록은 이번 화면의 인증 */
  verified: BpVerified | null;
};

export type BpMasterFormField =
  | "loginId"
  | "name"
  | "phone"
  | "email"
  | "tradeName"
  | "ceoPhone"
  | "ceoEmail"
  | "addressDetail"
  | "category"
  | "item"
  | "bizNumber"
  | "ceoName"
  | "openDate";

export type BpMasterFormErrors = Partial<Record<BpMasterFormField, string>>;

export const EMPTY_BP_MASTER_FORM: BpMasterForm = {
  loginId: "",
  name: "",
  phone: ["010", "", ""],
  email: "",
  tradeName: "",
  ceoPhone: ["", "", ""],
  ceoEmail: "",
  zipCode: "",
  address: "",
  addressDetail: "",
  category: "",
  item: "",
  bizNumber: "",
  ceoName: "",
  openDate: "",
  verifying: false,
  verified: null,
};

/** 상세 값으로 수정 칸을 채운다. 인증된 BP 면 완료 카드에 저장된 세 값을 둔다. */
export function formOfBpMaster(d: BpMasterDetail): BpMasterForm {
  const verified =
    d.bizVerifiedAt && d.bizRegistrationNumber
      ? { bizNumber: d.bizRegistrationNumber, ceoName: d.bizCeoName ?? "", openDate: d.bizOpenDate ?? "" }
      : null;
  return {
    ...EMPTY_BP_MASTER_FORM,
    loginId: d.loginId,
    name: d.name ?? "",
    phone: splitPhone(d.phone),
    email: d.email ?? "",
    tradeName: d.tradeName,
    ceoPhone: splitPhone(d.bizCeoPhone),
    ceoEmail: d.bizCeoEmail ?? "",
    zipCode: d.bizZipCode ?? "",
    address: d.bizAddress ?? "",
    addressDetail: d.bizAddressDetail ?? "",
    category: d.bizCategory ?? "",
    item: d.bizItem ?? "",
    verified,
  };
}

const phoneOf = (parts: [string, string, string]) => parts.map((p) => p.trim()).join("");
const optional = (value: string) => value.trim() || null;

/** 진위확인에 보낼 세 값 — 지금 칸 값을 다듬은 것 */
export function verificationValuesOf(f: Pick<BpMasterForm, "bizNumber" | "ceoName" | "openDate">) {
  return { bizNumber: f.bizNumber.replace(/-/g, "").trim(), ceoName: f.ceoName.trim(), openDate: f.openDate };
}

/** [인증하기]를 누를 때 세 칸의 오류 */
export function verificationErrors(f: Pick<BpMasterForm, "bizNumber" | "ceoName" | "openDate">): BpMasterFormErrors {
  const errors: BpMasterFormErrors = {};
  const { bizNumber, ceoName, openDate } = verificationValuesOf(f);
  if (!BIZ_NUMBER_PATTERN.test(bizNumber)) errors.bizNumber = bizNumber ? "사업자등록번호는 숫자 10자리입니다." : "사업자등록번호를 입력해 주세요.";
  if (!ceoName) errors.ceoName = "대표자명을 입력해 주세요.";
  else if (ceoName.length > 50) errors.ceoName = "대표자명은 50자까지입니다.";
  if (!DATE_PATTERN.test(openDate)) errors.openDate = openDate ? "개업일자는 YYYY-MM-DD 입니다." : "개업일자를 입력해 주세요.";
  return errors;
}

/** 계정 이메일 형식 — 저장 검사와 중복 확인(칸을 벗어날 때)이 함께 쓴다. */
export function emailError(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "이메일을 입력해 주세요.";
  if (email.length > 100 || !EMAIL_PATTERN.test(email)) return "이메일 형식이 아닙니다.";
}

/**
 * 저장할 때 칸별 오류. 인증 상자의 세 칸은 보지 않는다 — 번호 중복 · 확인 불가 · 처리 오류여도 인증 없이 저장할 수 있다(S-OJEYQJ · S-CQGGZS).
 * 대표자 연락처 · 이메일과 업태 · 종목 · 주소는 선택이고, 적었을 때만 형식을 본다.
 */
export function validateBpMasterForm(form: BpMasterForm, mode: "create" | "edit"): BpMasterFormErrors {
  const errors: BpMasterFormErrors = {};
  const loginId = mode === "create" ? loginIdError(form.loginId) : undefined;
  if (loginId) errors.loginId = loginId;
  if (!NAME_PATTERN.test(form.name.trim())) errors.name = form.name.trim() ? "이름은 한글 또는 영문 2~20자입니다." : "이름을 입력해 주세요.";
  const phone = phoneOf(form.phone);
  if (!PHONE_PATTERN.test(phone)) errors.phone = phone ? "연락처는 숫자 10~11자리입니다." : "연락처를 입력해 주세요.";
  const email = emailError(form.email);
  if (email) errors.email = email;
  const tradeName = form.tradeName.trim();
  if (!tradeName) errors.tradeName = "상호명을 입력해 주세요.";
  else if (tradeName.length > 50) errors.tradeName = "상호명은 50자까지입니다.";
  const ceoPhone = phoneOf(form.ceoPhone);
  if (ceoPhone && !PHONE_PATTERN.test(ceoPhone)) errors.ceoPhone = "대표자 연락처는 숫자 10~11자리입니다.";
  const ceoEmail = form.ceoEmail.trim();
  if (ceoEmail && (ceoEmail.length > 100 || !EMAIL_PATTERN.test(ceoEmail))) errors.ceoEmail = "대표자 이메일 형식이 아닙니다.";
  if (form.category.trim().length > 50) errors.category = "업태는 50자까지입니다.";
  if (form.item.trim().length > 50) errors.item = "종목은 50자까지입니다.";
  if (form.addressDetail.trim().length > 100) errors.addressDetail = "상세주소는 100자까지입니다.";
  // 상세주소는 기본주소에 딸린 값이다 — 「302호」만 남은 주소가 저장되지 않게 막는다
  else if (form.addressDetail.trim() && !form.address.trim()) errors.addressDetail = "주소를 먼저 검색해 주세요.";
  return errors;
}

/**
 * 인증 상자를 펼친 채 저장하려 하는가. 펼친 상자의 값은 인증해야만 저장되므로, 그대로 저장하면 적은 값이 사라진다 —
 * 화면이 「인증하지 않은 값은 저장되지 않습니다」를 한 번 알린다.
 */
export function hasPendingVerification(form: BpMasterForm): boolean {
  if (!form.verifying) return false;
  const { bizNumber, ceoName, openDate } = verificationValuesOf(form);
  return Boolean(bizNumber || ceoName || openDate);
}

function profileOf(form: BpMasterForm) {
  return {
    name: form.name.trim(),
    phone: phoneOf(form.phone),
    email: form.email.trim().toLowerCase(),
    tradeName: form.tradeName.trim(),
    bizCeoPhone: optional(phoneOf(form.ceoPhone)),
    bizCeoEmail: optional(form.ceoEmail.toLowerCase()),
    bizZipCode: optional(form.zipCode),
    bizAddress: optional(form.address),
    bizAddressDetail: optional(form.addressDetail),
    bizCategory: optional(form.category),
    bizItem: optional(form.item),
    // 이번 화면에서 받은 토큰만 보낸다 — 저장돼 있던 인증은 토큰이 없어 그대로 남는다
    ...(form.verified?.token ? { verificationToken: form.verified.token } : {}),
  };
}

export function toCreateBpMasterInput(form: BpMasterForm): CreateBpMasterInput {
  return { loginId: form.loginId.trim(), ...profileOf(form) };
}

export function toUpdateBpMasterInput(form: BpMasterForm): UpdateBpMasterInput {
  return profileOf(form);
}

/**
 * api 가 거절한 이유를 붙일 칸. 한 칸의 것이 아니면 null(패널 위 띠로 보인다).
 * api 는 오류에 칸 이름을 싣지 않아 문구로 가른다 — 400(형식) · 409(중복)만 본다. 수정에서는 아이디를 고칠 수 없으므로 아이디 오류도 띠로.
 */
export function bpMasterServerErrorField(status: number | undefined, message: string, mode: "create" | "edit"): BpMasterFormField | null {
  if (status !== 400 && status !== 409) return null;
  if (message.includes("아이디 또는 이메일")) return null;
  if (message.includes("아이디")) return mode === "create" ? "loginId" : null;
  if (message.includes("대표자 이메일")) return "ceoEmail";
  if (message.includes("이메일")) return "email";
  if (message.includes("상호")) return "tradeName";
  return null;
}
