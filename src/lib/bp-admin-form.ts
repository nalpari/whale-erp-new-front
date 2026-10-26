// BP 관리자 등록 · 수정 입력칸 — 검사와 요청 만들기. 패널(src/app/bp-admins/)에서 뺀 순수 함수라 node --test 로 검사한다(bp-admin-form.test.ts).
// 아이디 · 이름 · 휴대전화 · 이메일 형식은 플랫폼 관리자와 같아 그쪽 것을 쓴다. api 가 다시 막으므로 화면은 저장 전에 칸 아래 먼저 알리기만 한다.
import type { BpAdminDetail, BpAdminRoleType, BpAdminStatus, CreateBpAdminInput, UpdateBpAdminInput } from "./bp-admins";
import { emailError, loginIdError, NAME_PATTERN, PHONE_PATTERN, splitPhone } from "./platform-admin-form.ts";

// 이메일 형식 · 문구는 플랫폼 관리자 · MY PAGE 와 같다(email-format.ts) — 등록 패널이 중복 확인 전에도 쓴다
export { emailError };

export type PickedMappingStore = { storeId: number; name: string; storeCode: string };

/** 입력칸 값 그대로. 휴대전화는 세 칸, 권한 그룹은 select 값(문자열)이다. stores 는 보는 사람의 범위 안 매핑만 — 범위 밖은 api 가 둔다. */
export type BpAdminForm = {
  loginId: string;
  name: string;
  phone: [string, string, string];
  email: string;
  roleTypeCode: BpAdminRoleType | "";
  roleGroupId: string;
  isAllStores: boolean;
  stores: PickedMappingStore[];
  accountStatus: BpAdminStatus;
};

export type BpAdminFormField = "loginId" | "name" | "phone" | "email" | "roleTypeCode" | "roleGroupId" | "stores";

export const EMPTY_BP_ADMIN_FORM: BpAdminForm = {
  loginId: "",
  name: "",
  phone: ["010", "", ""],
  email: "",
  roleTypeCode: "",
  roleGroupId: "",
  isAllStores: false,
  stores: [],
  accountStatus: "ACTIVE",
};

/** 상세 값으로 수정 칸을 채운다. 매핑 점포는 보는 사람 범위 안의 것만 칩으로 — 범위 밖은 패널이 읽기 전용 표로 따로 보인다. */
export function bpAdminFormOf(detail: BpAdminDetail): BpAdminForm {
  return {
    loginId: detail.loginId,
    name: detail.name ?? "",
    phone: splitPhone(detail.phone),
    email: detail.email ?? "",
    roleTypeCode: detail.roleTypeCode,
    roleGroupId: String(detail.roleGroup.roleGroupId),
    isAllStores: detail.isAllStores,
    stores: detail.stores.filter((s) => !s.isOutOfScope).map(({ storeId, name, storeCode }) => ({ storeId, name, storeCode })),
    accountStatus: detail.accountStatus,
  };
}

const phoneOf = (form: BpAdminForm) => form.phone.map((p) => p.trim()).join("");

/**
 * 칸별 오류 문구. 없으면 빈 객체. 등록은 아이디 · 계정 역할도 본다(수정은 바꾸지 않는다).
 * 일부 점포면 매핑이 1곳 이상이어야 한다 — 범위 밖 매핑(outOfScopeCount)도 저장 뒤 남으므로 센다. 점포 칸을 막았으면(본인 계정) 보지 않는다.
 */
export function validateBpAdminForm(
  form: BpAdminForm,
  { mode, outOfScopeCount = 0, storesLocked = false }: { mode: "create" | "edit"; outOfScopeCount?: number; storesLocked?: boolean },
): Partial<Record<BpAdminFormField, string>> {
  const errors: Partial<Record<BpAdminFormField, string>> = {};
  const loginId = mode === "create" ? loginIdError(form.loginId) : undefined;
  if (loginId) errors.loginId = loginId;
  if (!NAME_PATTERN.test(form.name.trim())) errors.name = form.name.trim() ? "이름은 한글 또는 영문 2~20자입니다." : "이름을 입력해 주세요.";
  const phone = phoneOf(form);
  if (!PHONE_PATTERN.test(phone)) errors.phone = phone ? "휴대전화번호는 숫자 10~11자리입니다." : "휴대전화번호를 입력해 주세요.";
  const email = emailError(form.email);
  if (email) errors.email = email;
  if (mode === "create" && !form.roleTypeCode) errors.roleTypeCode = "계정 역할을 골라 주세요.";
  if (!form.roleGroupId) errors.roleGroupId = "권한 그룹을 골라 주세요.";
  if (!storesLocked && !form.isAllStores && form.stores.length + outOfScopeCount === 0) errors.stores = "대상 점포를 1곳 이상 골라 주세요.";
  return errors;
}

/**
 * api 가 거절한 이유를 붙일 칸. 한 칸의 것이 아니면 null(패널 위 띠로 보인다).
 * api 는 오류에 칸 이름을 싣지 않아 문구로 가른다 — 400(형식 · 고를 수 없는 값) · 409(중복 · 한 점포 한 가맹 마스터)만 본다.
 * 수정에서는 아이디를 고칠 수 없으므로 아이디 오류는 띠로 보낸다.
 */
export function bpAdminServerErrorField(status: number | undefined, message: string, mode: "create" | "edit"): BpAdminFormField | null {
  if (status !== 400 && status !== 409) return null;
  if (message.includes("아이디 또는 이메일")) return null;
  if (message.includes("아이디")) return mode === "create" ? "loginId" : null;
  if (message.includes("이메일")) return "email";
  if (message.includes("점포")) return "stores";
  if (message.includes("권한")) return "roleGroupId";
  return null;
}

function profileOf(form: BpAdminForm) {
  return {
    name: form.name.trim(),
    phone: phoneOf(form),
    email: form.email.trim().toLowerCase(),
    roleGroupId: Number(form.roleGroupId),
    isAllStores: form.isAllStores,
    storeIds: form.isAllStores ? [] : form.stores.map((s) => s.storeId),
  };
}

export function toCreateBpAdminInput(form: BpAdminForm): CreateBpAdminInput {
  // 검사(validateBpAdminForm)를 거친 뒤에만 부른다 — 계정 역할이 비어 있지 않다
  return { loginId: form.loginId.trim(), roleTypeCode: form.roleTypeCode as BpAdminRoleType, ...profileOf(form) };
}

/** updatedAt 은 상세에서 받은 값 그대로 — api 가 그 사이 다른 사람이 고쳤는지 본다. */
export function toUpdateBpAdminInput(form: BpAdminForm, updatedAt: string): UpdateBpAdminInput {
  return { ...profileOf(form), accountStatus: form.accountStatus, updatedAt };
}
