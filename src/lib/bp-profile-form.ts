// 내 정보(마이페이지) 사업자정보 입력칸 — 검사와 요청 만들기. bp-profile-tab.tsx 에서 뺀 순수 함수라
// node --test 로 검사한다(bp-profile-form.test.ts). 숫자 패턴은 api DTO(bp-profile-update.dto.ts ·
// bp-business-verification.dto.ts)와 같다 — 대표자 연락처 9~12자리는 api 2026-10-27 변경분과 같다(그전 api 는 9~11). 규칙은 manyfast F-AMTDCK > S-UOJVUR.
import type { AddressValue } from "@/components/address-field";
import { isBizVerificationExpired } from "./biz-verification-rules.ts";
import { splitPhone } from "./my-profile-form.ts";
import type { BpProfile, UpdateBpProfileInput, VerifyBpBusinessInput } from "./bp-profile.ts";

export const BIZ_NUMBER_PATTERN = /^[0-9]{10}$/;
export const CEO_PHONE_PATTERN = /^[0-9]{9,12}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type BpProfileForm = {
  tradeName: string;
  bizCeoPhone: [string, string, string];
  /** 체크하면 대표자 연락처는 내 정보(기본정보)의 연락처를 그대로 쓴다(점포 사업자주소의 "점포 주소와
   * 같음"과 같은 패턴 — store-form.ts bizSameAsStore). bizCeoPhone 자체는 체크해도 지우지 않는다 —
   * 체크를 풀면 전에 적던 값으로 돌아온다. */
  sameAsBasicPhone: boolean;
  bizCeoEmail: string;
  /** 체크하면 대표자 이메일은 내 정보(기본정보)의 이메일을 그대로 쓴다. */
  sameAsBasicEmail: boolean;
  address: AddressValue;
  bizCategory: string;
  bizItem: string;
};

export type BpProfileFormField = "tradeName" | "bizCeoPhone" | "bizCeoEmail" | "bizAddressDetail" | "bizCategory" | "bizItem";

/**
 * 사업자 번호 인증 칸 — 점포 사업자정보처럼 인증은 검사만 하고, 저장(PATCH)에 토큰을 실어야 반영된다
 * (2026-10-22 사용자 결정). `saved*` 는 지금 서버에 실제로 반영된 값(처음 불러올 때·저장 성공 뒤에만
 * 바뀐다) — 잠금 여부의 바탕이다. `verification` 은 이번 화면에서 검사를 통과해 받은 토큰으로, 지금 칸
 * 값(바뀌지 않은 상호명 등은 포함하지 않는다)과 같을 때만 유효하다(currentVerification) — 칸을 고치면
 * 즉시 버려진다(store-form.ts 의 `verified`와 같은 패턴). 저장해야만 `saved*`로 옮겨 간다.
 */
export type VerifyForm = {
  savedBizNumber: string;
  savedCeoName: string;
  savedOpenDate: string;
  savedVerifiedAt: string | null;
  bizRegistrationNumber: string;
  bizCeoName: string;
  bizOpenDate: string;
  verification: {
    token: string;
    verifiedAt: number;
    bizRegistrationNumber: string;
    bizCeoName: string;
    bizOpenDate: string;
  } | null;
  /** "사용안함"을 눌러 저장 때 지우기로 한 상태(2026-10-23 사용자 결정) — 점포와 달리 BP 는 인증된
   * 세 값을 아예 지울 수 있다. 누른 시점엔 아무 일도 안 나고, 전체 "저장"을 눌러야 실제로 반영된다
   * (인증 · 재인증과 같은 두 단계). */
  pendingClear: boolean;
};
export type VerifyFormField = "bizRegistrationNumber" | "bizCeoName" | "bizOpenDate";

/** basicPhone · basicEmail — 내 정보(기본정보)의 연락처 · 이메일. 저장된 대표자 연락처 · 이메일이 지금
 * 기본정보 값과 같으면(그리고 비어 있지 않으면) 체크박스를 체크된 채로 보여준다 — store-form.ts
 * formOfStore 의 sameAddress 와 같은 패턴(점포 주소와 같음). 실시간으로 묶인 값이 아니라 저장 시점의
 * 복사본이라, 기본정보를 나중에 바꿔도 여기는 따라가지 않는다 — 다르면 체크 해제로 보인다. */
export function formOf(profile: BpProfile, basicPhone: string, basicEmail: string): BpProfileForm {
  const sameAsBasicPhone = Boolean(basicPhone) && profile.bizCeoPhone === basicPhone;
  const sameAsBasicEmail = Boolean(basicEmail) && profile.bizCeoEmail === basicEmail;
  return {
    tradeName: profile.tradeName,
    bizCeoPhone: splitPhone(profile.bizCeoPhone),
    sameAsBasicPhone,
    bizCeoEmail: profile.bizCeoEmail,
    sameAsBasicEmail,
    address: {
      zipCode: profile.bizZipCode,
      address: profile.bizAddress,
      addressDetail: profile.bizAddressDetail,
    },
    bizCategory: profile.bizCategory,
    bizItem: profile.bizItem,
  };
}

/** 인증 입력 상자의 처음 값 — 저장된 값으로 채워서 시작한다(재인증도 이 칸을 그대로 고쳐 쓴다). 인증한
 * 적 없으면 다 비운다. `verification` 은 늘 null 로 시작한다 — 불러오기는 검사를 통과한 게 아니다. */
export function verifyFormOf(profile: BpProfile): VerifyForm {
  return {
    savedBizNumber: profile.bizRegistrationNumber,
    savedCeoName: profile.bizCeoName,
    savedOpenDate: profile.bizOpenDate ?? "",
    savedVerifiedAt: profile.bizVerifiedAt,
    bizRegistrationNumber: profile.bizRegistrationNumber,
    bizCeoName: profile.bizCeoName,
    bizOpenDate: profile.bizOpenDate ?? "",
    verification: null,
    pendingClear: false,
  };
}

const phoneOf = (phone: [string, string, string]) => phone.map((p) => p.trim()).join("");

/** 체크한 칸은 내 정보(기본정보) 값을 그대로 쓰므로 형식을 다시 보지 않는다 — 그 값은 이미 api 가 받은 값이다
 * (store-form.ts 의 bizSameAsStore 와 같은 생략). */
export function validateBpProfileForm(form: BpProfileForm): Partial<Record<BpProfileFormField, string>> {
  const errors: Partial<Record<BpProfileFormField, string>> = {};
  const tradeName = form.tradeName.trim();
  if (!tradeName) errors.tradeName = "상호명을 입력해 주세요.";
  else if (tradeName.length > 50) errors.tradeName = "상호명은 1~50자입니다.";
  if (!form.sameAsBasicPhone) {
    const phone = phoneOf(form.bizCeoPhone);
    if (phone && !CEO_PHONE_PATTERN.test(phone)) errors.bizCeoPhone = "대표자 연락처는 숫자 9~12자리입니다.";
  }
  if (!form.sameAsBasicEmail) {
    const email = form.bizCeoEmail.trim();
    if (email && (email.length > 100 || !EMAIL_PATTERN.test(email))) errors.bizCeoEmail = "대표자 이메일 형식이 올바르지 않습니다.";
  }
  if (form.address.addressDetail.length > 100) errors.bizAddressDetail = "상세주소는 100자까지입니다.";
  if (form.bizCategory.length > 50) errors.bizCategory = "업태는 50자까지입니다.";
  if (form.bizItem.length > 50) errors.bizItem = "종목은 50자까지입니다.";
  return errors;
}

/** basicPhone · basicEmail — 내 정보(기본정보)의 연락처 · 이메일(하이픈 없는 전화, 그대로의 이메일). 체크한
 * 칸은 그 값을 그대로 보낸다. verifyForm 에 이번 화면에서 유효한 인증(currentVerification)이 있으면 그
 * 토큰을 싣는다 — 없으면 businessVerificationToken 자체를 싣지 않아 api 가 사업자등록번호 · 대표자명 ·
 * 개업일자 · 인증일시를 그대로 둔다. */
export function toUpdateBpProfileInput(
  form: BpProfileForm,
  updatedAt: string,
  basicPhone: string,
  basicEmail: string,
  verifyForm: VerifyForm,
): UpdateBpProfileInput {
  const phone = form.sameAsBasicPhone ? basicPhone : phoneOf(form.bizCeoPhone);
  const email = form.sameAsBasicEmail ? basicEmail.trim() : form.bizCeoEmail.trim();
  const detail = form.address.addressDetail.trim();
  const category = form.bizCategory.trim();
  const item = form.bizItem.trim();
  const verification = currentVerification(verifyForm);
  return {
    tradeName: form.tradeName.trim(),
    updatedAt,
    ...(phone ? { bizCeoPhone: phone } : {}),
    ...(email ? { bizCeoEmail: email } : {}),
    ...(form.address.zipCode ? { bizZipCode: form.address.zipCode } : {}),
    ...(form.address.address ? { bizAddress: form.address.address } : {}),
    ...(detail ? { bizAddressDetail: detail } : {}),
    ...(category ? { bizCategory: category } : {}),
    ...(item ? { bizItem: item } : {}),
    // pendingClear 와 businessVerificationToken 은 함께 못 싣는다(api 400) — pendingClear 가 늘 앞선다.
    // handleClearSaved 가 "사용안함"을 누르는 순간 verification 을 비우고, 그동안(struck) 상자가 인증하기
    // 버튼을 숨겨 새 토큰도 못 생기게 하지만, 이 가드는 그 보장과 무관하게 여기서 한 번 더 지킨다.
    ...(verifyForm.pendingClear
      ? { clearBusinessVerification: true }
      : verification
        ? { businessVerificationToken: verification.token }
        : {}),
  };
}

export function validateVerifyForm(form: Pick<VerifyForm, "bizRegistrationNumber" | "bizCeoName" | "bizOpenDate">): Partial<Record<VerifyFormField, string>> {
  const errors: Partial<Record<VerifyFormField, string>> = {};
  const number = form.bizRegistrationNumber.replace(/-/g, "").trim();
  if (!BIZ_NUMBER_PATTERN.test(number)) errors.bizRegistrationNumber = number ? "사업자등록번호는 숫자 10자리입니다." : "사업자등록번호를 입력해 주세요.";
  const ceoName = form.bizCeoName.trim();
  if (!ceoName) errors.bizCeoName = "대표자명을 입력해 주세요.";
  else if (ceoName.length > 50) errors.bizCeoName = "대표자명은 50자까지입니다.";
  if (!DATE_PATTERN.test(form.bizOpenDate)) errors.bizOpenDate = form.bizOpenDate ? "개업일자는 YYYY-MM-DD 입니다." : "개업일자를 입력해 주세요.";
  return errors;
}

const VERIFY_LABELS: Record<VerifyFormField, string> = {
  bizRegistrationNumber: "사업자등록번호",
  bizCeoName: "대표자명",
  bizOpenDate: "개업일자",
};

/** 비어 있는 진위확인 칸 — 칸 순서(사업자등록번호 · 대표자명 · 개업일자)대로. */
export function emptyVerifyFields(form: Pick<VerifyForm, "bizRegistrationNumber" | "bizCeoName" | "bizOpenDate">): VerifyFormField[] {
  return (Object.keys(VERIFY_LABELS) as VerifyFormField[]).filter((key) => !form[key].replace(/-/g, "").trim());
}

/** 비어 있는 진위확인 칸만 가운뎃점으로 모은 한 줄 안내 — 칸마다 「~를 입력해 주세요.」를 따로 띄우지 않는다.
 * 점포 사업자정보(store-form-view.tsx)와 같은 형식(사용자 지정, 2026-10-22 — 세션 간 조율로 쉼표+조사에서
 * 되돌림). 형식이 틀린 칸(숫자 10자리 아님 등)은 여기 들지 않고 그 칸 아래에 따로 보인다. 빈 칸이 없으면 null. */
export function missingVerifyMessage(missing: VerifyFormField[]): string | null {
  if (!missing.length) return null;
  return `${missing.map((key) => VERIFY_LABELS[key]).join("·")} 항목을 입력해 주세요.`;
}

export function toVerifyInput(form: Pick<VerifyForm, "bizRegistrationNumber" | "bizCeoName" | "bizOpenDate">): VerifyBpBusinessInput {
  return {
    bizRegistrationNumber: form.bizRegistrationNumber.replace(/-/g, "").trim(),
    bizCeoName: form.bizCeoName.trim(),
    bizOpenDate: form.bizOpenDate,
  };
}

/** 지금 칸 값 — 인증 검사 · currentVerification 비교에 쓰는 다듬은 모양(하이픈 제거 · 앞뒤 공백 제거). */
function verificationValuesOf(f: Pick<VerifyForm, "bizRegistrationNumber" | "bizCeoName" | "bizOpenDate">) {
  return {
    bizRegistrationNumber: f.bizRegistrationNumber.replace(/-/g, "").trim(),
    bizCeoName: f.bizCeoName.trim(),
    bizOpenDate: f.bizOpenDate,
  };
}

/** 이번 화면의 인증 결과 — 지금 칸 값과 같을 때만. 다르면(인증 뒤 고침 · 늦게 온 응답) 없는 것으로 본다
 * (store-form.ts currentVerification 과 같은 패턴). */
export function currentVerification(f: VerifyForm): VerifyForm["verification"] {
  const now = verificationValuesOf(f);
  const v = f.verification;
  return v && v.bizRegistrationNumber === now.bizRegistrationNumber && v.bizCeoName === now.bizCeoName && v.bizOpenDate === now.bizOpenDate ? v : null;
}

/** 사업자 번호 인증이 끝났는가 — 저장된 번호가 있거나 이번 화면에서 지금 칸 값으로 통과했다. */
export const isVerified = (f: VerifyForm) => Boolean(f.savedBizNumber) || Boolean(currentVerification(f));

/** 이번 화면에서 받은 인증이 10분(BIZ_VERIFICATION_TTL_MS)을 넘겼는가 — 저장을 누르는 순간에만 본다
 * (점포 store-form.ts validateStoreForm 과 같은 TTL. api BusinessVerificationService 의 토큰도 같은
 * 10분이라, 그대로 두면 저장 자체가 400 으로 막혀 상호명 등 무관한 칸까지 같이 거절된다 — code-review
 * 로 찾음, 2026-10-23). 저장된 값이 있어 currentVerification 이 없는 상태(savedLocked)는 토큰이 아니라
 * 서버에 남은 값을 보는 것이라 만료가 없다. */
export function isVerificationExpired(f: VerifyForm, now: number): boolean {
  const v = currentVerification(f);
  return Boolean(v) && isBizVerificationExpired(v!.verifiedAt, now);
}

/** 만료됐으면 verification 을 비운 새 VerifyForm 을, 아니면 그대로(참조 그대로) 돌려준다 — 호출부가
 * === 로 "방금 비웠다"를 가를 수 있다. */
export function expireVerification(f: VerifyForm, now: number): VerifyForm {
  return isVerificationExpired(f, now) ? { ...f, verification: null } : f;
}

/** 이번 화면에서 통과했지만 아직 저장하지 않아 서버 값과 다른가 — 인증완료 배지에 "저장하면 반영됩니다"를
 * 더 보일지 가른다. */
export function hasPendingVerification(f: VerifyForm): boolean {
  const v = currentVerification(f);
  return Boolean(v) && (v!.bizRegistrationNumber !== f.savedBizNumber || v!.bizCeoName !== f.savedCeoName || v!.bizOpenDate !== f.savedOpenDate);
}

/** 진위확인 칸을 고쳤는데(또는 재인증을 열어 둔 채) 인증하지 않았는가. 그 값은 인증을 거쳐야만 저장에 실리므로
 * (businessVerificationToken), 그대로 저장하면 칸에 보이던 값이 저장 뒤 원래대로 돌아온다 — 저장 전에 막는다
 * (store-form.ts hasUnverifiedChange 와 같은 패턴). "지우기"는 칸을 저장된 값으로 되돌리므로(clearVerify)
 * 여기 걸리지 않는다. "사용안함"(pendingClear)은 인증 대신 지우겠다는 의도적인 선택이라 따로 뺀다 — 인증을
 * 요구하면 안 된다. */
export function hasUnverifiedChange(f: VerifyForm): boolean {
  if (f.pendingClear) return false;
  if (currentVerification(f)) return false;
  return f.bizRegistrationNumber !== f.savedBizNumber || f.bizCeoName !== f.savedCeoName || f.bizOpenDate !== f.savedOpenDate;
}

/** api 가 거절한 이유를 붙일 칸(기본정보 저장). 인증 실패는 칸이 아니라 띠로 보인다(mockup, 번호·대표자명·개업일자가 한 묶음이라). */
export function serverErrorField(status: number | undefined, message: string): BpProfileFormField | null {
  if (status !== 400 && status !== 409) return null;
  if (message.includes("상호명")) return "tradeName";
  if (message.includes("연락처")) return "bizCeoPhone";
  if (message.includes("이메일")) return "bizCeoEmail";
  if (message.includes("업태")) return "bizCategory";
  if (message.includes("종목")) return "bizItem";
  return null;
}
