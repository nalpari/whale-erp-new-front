// BP 관리자 등록 · 수정 입력칸 — 검사와 요청 만들기. 패널(src/app/bp-admins/)에서 뺀 순수 함수라 node --test 로 검사한다(bp-admin-form.test.ts).
// 아이디 · 이름 · 휴대전화 · 이메일 형식은 플랫폼 관리자와 같아 그쪽 것을 쓴다. api 가 다시 막으므로 화면은 저장 전에 칸 아래 먼저 알리기만 한다.
import type { BpAdminDetail, BpAdminRoleGroup, BpAdminRoleType, BpAdminStatus, CreateBpAdminInput, UpdateBpAdminInput } from "./bp-admins";
import { emailError, loginIdError, NAME_PATTERN, PHONE_PATTERN, splitPhone } from "./platform-admin-form.ts";
import { allowsAllStores } from "./bp-admin-rules.ts";

// 이메일 형식 · 문구는 플랫폼 관리자와 같다(platform-admin-form.ts emailError — 형식 판정은 email-format.ts). 등록 패널이 중복 확인 전에도 쓴다
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

/**
 * 계정 역할을 정하고 그 역할의 권한 그룹 · 점포로 새로 고른다. 그룹이 하나뿐이면(가맹 마스터 고정 그룹 등) 미리 고르고,
 * 「전체 점포」는 BP 관리자만 고를 수 있어 다른 역할이면 일부 점포로 돌린다. 앞 역할의 후보에서 고른 점포는 비운다.
 */
export function withRole(form: BpAdminForm, role: BpAdminRoleType | "", roleGroups: BpAdminRoleGroup[]): BpAdminForm {
  const groups = roleGroups.filter((r) => r.roleTypeCode === role);
  return {
    ...form,
    roleTypeCode: role,
    roleGroupId: groups.length === 1 ? String(groups[0].roleGroupId) : "",
    isAllStores: allowsAllStores(role) ? form.isAllStores : false,
    stores: [],
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
  if (!PHONE_PATTERN.test(phone)) errors.phone = phone ? "연락처는 숫자 9~12자리입니다." : "연락처를 입력해 주세요."; // 라벨 「연락처」 — 플랫폼 관리자와 같은 문구(2026-10-27 사용자 지정), 자릿수는 1팀 9~12자리
  const email = emailError(form.email);
  if (email) errors.email = email;
  if (mode === "create" && !form.roleTypeCode) errors.roleTypeCode = "계정 역할을 골라 주세요.";
  if (!form.roleGroupId) errors.roleGroupId = "권한명을 골라 주세요."; // 칸 라벨 「권한명」(2026-10-27 사용자 지정)
  if (!storesLocked && !form.isAllStores && form.stores.length + outOfScopeCount === 0) errors.stores = "대상점포를 1곳 이상 골라 주세요.";
  return errors;
}

/** 아이디 중복 문구 — 칸을 벗어날 때의 확인과 저장할 때의 409 가 같이 쓴다. 관리자 등록 세 화면(플랫폼 · BP 관리자 · BP 마스터)이 같은 문구 — 탈퇴 · 삭제 계정 아이디 안내는 길어 뺐다(2026-10-28 사용자 지정) */
export const LOGIN_ID_TAKEN = "이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.";
/** 이메일 중복 문구 — 칸을 벗어날 때의 확인과 저장할 때의 409 가 같이 쓴다. 네 화면 같은 문구(2026-10-28 사용자 지정) */
export const EMAIL_TAKEN = "이미 사용 중인 이메일입니다. 다른 이메일을 입력해 주세요.";

/**
 * 칸 아래에 붙일 api 오류 문구. 저장할 때의 409 가운데 api 의 중복 문구일 때만 중복 확인과 같은 화면 문구로 바꾼다 — 같은 중복이 두 문구로 보였다(2026-10-29 사용자 결정).
 * 칸은 「아이디」 · 「이메일」 글자로 가르므로, 중복이 아닌 409 가 그 칸으로 와도 진짜 이유를 덮지 않게 중복 문구(api bp-admins.service.ts LOGIN_ID_TAKEN · EMAIL_TAKEN)에 직접 맞춘다.
 */
export function bpAdminFieldMessage(field: BpAdminFormField, status: number | undefined, apiText: string): string {
  if (status !== 409) return apiText;
  if (field === "loginId" && apiText.includes("사용할 수 없는 아이디")) return LOGIN_ID_TAKEN;
  if (field === "email" && apiText.includes("관리자 계정의 이메일")) return EMAIL_TAKEN;
  return apiText;
}

/**
 * api 가 거절한 이유를 붙일 칸. 한 칸의 것이 아니면 null(패널 위 띠로 보인다).
 * api 는 오류에 칸 이름을 싣지 않아 문구로 가른다 — 400(형식 · 고를 수 없는 값) · 409(중복 · 한 점포 한 가맹 마스터)만 본다.
 * 수정에서는 아이디를 고칠 수 없으므로 아이디 오류는 띠로 보낸다.
 */
export function bpAdminServerErrorField(status: number | undefined, message: string, mode: "create" | "edit"): BpAdminFormField | null {
  if (status !== 400 && status !== 409) return null;
  // 여러 칸의 검증 실패(400 배열)는 api.ts 가 「, 」로 이어 붙인다 — 한 칸에 몰아 붙이면 다른 칸의 이유가 묻히므로 띠로(platform-admins 와 같다)
  if (status === 400 && message.includes(", ")) return null;
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
