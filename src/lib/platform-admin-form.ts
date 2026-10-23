// 플랫폼 관리자 등록 · 수정 입력칸 — 검사와 요청 만들기. 패널(src/app/platform-admins/)에서 뺀 순수 함수라
// node --test 로 검사한다(platform-admin-form.test.ts).
// 규칙은 api(platform-admin-format.ts · save-platform-admin.dto.ts)와 같다. api 가 다시 막으므로 화면은 저장 전에 칸 아래 먼저 알리기만 한다.
import type { AdminStatus, CreatePlatformAdminInput, PlatformAdminDetail, UpdatePlatformAdminInput } from "./platform-admins";

/** 아이디 — 영문 또는 영문 · 숫자 4~20자, 영문이 하나 이상(PL-OCJOFP). 밑줄은 쓸 수 없다. */
export const LOGIN_ID_PATTERN = /^(?=.*[A-Za-z])[A-Za-z0-9]{4,20}$/;
/** 이름 — 한글 · 영문 2~20자. */
export const NAME_PATTERN = /^[가-힣A-Za-z ]{2,20}$/;
/** 연락처 — 하이픈 없이 숫자 10~11자리. */
export const PHONE_PATTERN = /^[0-9]{10,11}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 입력칸 값 그대로. 연락처는 세 칸, 권한은 select 값(문자열)이다. */
export type AdminForm = {
  loginId: string;
  name: string;
  phone: [string, string, string];
  email: string;
  department: string;
  jobTitle: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  roleGroupId: string;
  accountStatus: AdminStatus;
};

export type AdminFormField = "loginId" | "name" | "phone" | "email" | "department" | "jobTitle" | "addressDetail" | "roleGroupId";

export const EMPTY_FORM: AdminForm = {
  loginId: "",
  name: "",
  phone: ["010", "", ""],
  email: "",
  department: "",
  jobTitle: "",
  zipCode: "",
  address: "",
  addressDetail: "",
  roleGroupId: "",
  accountStatus: "ACTIVE",
};

/** 하이픈 없는 번호를 세 칸으로 — 휴대전화(3-4-4) · 02 지역번호(2-3/4-4) · 그 밖 지역번호(3-3/4-4). */
export function splitPhone(digits: string | null): [string, string, string] {
  if (!digits) return ["", "", ""];
  const head = digits.startsWith("02") ? 2 : 3;
  return [digits.slice(0, head), digits.slice(head, digits.length - 4), digits.slice(-4)];
}

/** 상세 값으로 수정 칸을 채운다. 비어 있는 선택 칸은 빈 문자열로 둔다. */
export function formOf(detail: PlatformAdminDetail): AdminForm {
  return {
    loginId: detail.loginId,
    name: detail.name ?? "",
    phone: splitPhone(detail.phone),
    email: detail.email ?? "",
    department: detail.department ?? "",
    jobTitle: detail.jobTitle ?? "",
    zipCode: detail.zipCode ?? "",
    address: detail.address ?? "",
    addressDetail: detail.addressDetail ?? "",
    roleGroupId: String(detail.roleGroup.roleGroupId),
    accountStatus: detail.accountStatus,
  };
}

const phoneOf = (form: AdminForm) => form.phone.map((p) => p.trim()).join("");

export const LOGIN_ID_FORMAT_ERROR = "아이디는 영문 또는 영문 · 숫자 조합으로 4~20자입니다.";
/** 아이디 중복 — 중복확인의 「사용 중」과 저장 때 api 409 를 같은 문구로 보인다(api 문구는 다음에 할 일을 말하지 않는다). */
export const LOGIN_ID_TAKEN = "이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.";

/** 아이디 형식 오류 문구. 맞으면 undefined. 저장할 때와 칸을 벗어날 때(중복 확인 전) 같이 쓴다. */
export function loginIdError(loginId: string): string | undefined {
  const value = loginId.trim();
  if (LOGIN_ID_PATTERN.test(value)) return undefined;
  return value ? LOGIN_ID_FORMAT_ERROR : "아이디를 입력해 주세요.";
}

/** 수정 화면의 이메일이 원래 값 그대로인가 — 그대로면 확인 대상이 아니라 칸 아래에 아무것도 띄우지 않는다(MY PAGE 와 같다). */
export function isOriginalEmail(value: string, original: string | null): boolean {
  return value.trim().toLowerCase() === (original ?? "").trim().toLowerCase();
}

/**
 * 이메일 형식 오류 문구. 맞으면 undefined. 저장할 때와 칸을 벗어나거나 Enter 를 칠 때 같이 쓴다.
 * 아이디처럼 중복을 바로 물어볼 API 가 없어(중복은 저장할 때 — 등록 · 수정 모두 — api 가 409 로 막는다) 형식만 본다.
 */
export function emailError(email: string): string | undefined {
  const value = email.trim();
  if (!value) return "이메일을 입력해 주세요.";
  if (value.length > 100 || !EMAIL_PATTERN.test(value)) return "이메일 형식이 아닙니다.";
  return undefined;
}

/** 칸별 오류 문구. 없으면 빈 객체. 등록은 아이디도 본다(수정은 아이디를 바꾸지 않는다). */
export function validateAdminForm(form: AdminForm, mode: "create" | "edit"): Partial<Record<AdminFormField, string>> {
  const errors: Partial<Record<AdminFormField, string>> = {};
  const loginId = mode === "create" ? loginIdError(form.loginId) : undefined;
  if (loginId) errors.loginId = loginId;
  if (!NAME_PATTERN.test(form.name.trim())) errors.name = form.name.trim() ? "이름은 한글 또는 영문 2~20자입니다." : "이름을 입력해 주세요.";
  const phone = phoneOf(form);
  if (!PHONE_PATTERN.test(phone)) errors.phone = phone ? "연락처는 숫자 10~11자리입니다." : "연락처를 입력해 주세요.";
  const email = emailError(form.email);
  if (email) errors.email = email;
  if (form.department.trim().length > 30) errors.department = "소속 부서는 30자까지입니다.";
  if (form.jobTitle.trim().length > 30) errors.jobTitle = "직책은 30자까지입니다.";
  if (form.addressDetail.trim().length > 100) errors.addressDetail = "상세주소는 100자까지입니다.";
  // 상세주소는 기본주소에 딸린 값이다 — api 는 세 칸을 따로 받아, 막지 않으면 「302호」만 남은 주소가 저장된다
  else if (form.addressDetail.trim() && !form.address.trim()) errors.addressDetail = "주소를 먼저 검색해 주세요.";
  if (!form.roleGroupId) errors.roleGroupId = "사용자 권한을 골라 주세요.";
  return errors;
}

/**
 * api 가 거절한 이유를 붙일 칸. 한 칸의 것이 아니면 null(패널 위 띠로 보인다).
 * api 는 오류에 칸 이름을 싣지 않아 문구로 가른다 — 400(형식) · 409(중복)만 보고, 「아이디 또는 이메일」(동시 등록 경합)은 띠로.
 * 수정에서는 아이디를 고칠 수 없으므로 아이디 오류도 띠로 보낸다.
 */
export function serverErrorField(status: number | undefined, message: string, mode: "create" | "edit"): AdminFormField | null {
  if (status !== 400 && status !== 409) return null;
  if (message.includes("아이디 또는 이메일")) return null;
  // 여러 칸 검증 오류(400 배열 — api.ts messageOf 가 ", " 로 잇는다)는 한 칸에 붙이지 않고 띠로 원문을 보인다 — 아이디 칸에 붙이면
  // 함께 온 다른 칸의 이유가 아이디 아래에 숨고, 서버가 거절한 아이디로 남아 아이디를 고치기 전까지 저장이 막힌다.
  if (status === 400 && message.includes(", ")) return null;
  if (message.includes("아이디")) return mode === "create" ? "loginId" : null;
  if (message.includes("이메일")) return "email";
  return null;
}

/**
 * 칸 아래에 붙일 api 오류 문구. 아이디는 화면 문구로 바꾼다 — 400(형식)은 화면 검사와 같은 문구, 409(중복)는 LOGIN_ID_TAKEN.
 * 그 밖(이메일 중복 등)은 api 문구 그대로. 여러 칸 검증 오류는 serverErrorField 가 이미 띠로 보낸다.
 */
export function serverFieldMessage(field: AdminFormField, status: number | undefined, message: string): string {
  if (field !== "loginId") return message;
  if (status === 400) return LOGIN_ID_FORMAT_ERROR;
  if (status === 409) return LOGIN_ID_TAKEN;
  return message;
}

/** 아이디 중복확인 상태. 오류(형식 · 사용 중)는 이 상태가 아니라 칸 오류 문구로 보인다. */
export type LoginIdCheck = "idle" | "checking" | "available" | "failed";

/** 중복확인 server action 의 답(actions.ts ActionResult). 호출 자체가 거절되면(catch) 화면이 "failed" 로 둔다. */
type LoginIdCheckResult = { ok: true; available: boolean } | { ok: false; status?: number; message: string };

/**
 * 중복확인 답을 화면 상태로. 「사용 중」 · 400 은 칸 오류(서버가 거절한 값 — 고칠 때까지 저장 요청을 보내지 않는다),
 * 401(로그인 만료) · 403(등록 권한 없음 — 저장해도 같은 이유로 막힌다, 2026-10-23 사용자 결정)은 위 띠로 api 문구를,
 * 그 밖(429 · 5xx · 연결 실패)은 "failed" — 저장은 막지 않고 api 가 저장할 때 다시 본다.
 */
export function loginIdCheckOutcome(result: LoginIdCheckResult): { check: LoginIdCheck; fieldError?: string; failure?: string } {
  if (result.ok) return result.available ? { check: "available" } : { check: "idle", fieldError: LOGIN_ID_TAKEN };
  if (result.status === 400) return { check: "idle", fieldError: LOGIN_ID_FORMAT_ERROR };
  if (result.status === 401 || result.status === 403) return { check: "idle", failure: result.message };
  return { check: "failed" };
}

/**
 * 저장을 막는 오류. 입력 검사 문구에 더해, 서버가 거절한 아이디(사용 중 · 형식)는 고치기 전까지 막는다 — api 가 같은 이유로
 * 다시 거절한다. 이메일 중복 같은 다른 칸의 서버 오류는 막지 않는다 — 그 사이 다른 계정이 이메일을 바꿨을 수 있다.
 * 같은 칸에 입력 검사 문구가 있으면 그쪽이 앞선다.
 */
export function saveBlockingErrors(
  form: AdminForm,
  mode: "create" | "edit",
  serverErrors: Partial<Record<AdminFormField, string>>,
): Partial<Record<AdminFormField, string>> {
  return { ...(serverErrors.loginId && { loginId: serverErrors.loginId }), ...validateAdminForm(form, mode) };
}

/** 선택 칸 — 비우면 null 로 보내 지운다. */
const optional = (value: string) => value.trim() || null;

function profileOf(form: AdminForm) {
  return {
    name: form.name.trim(),
    phone: phoneOf(form),
    email: form.email.trim().toLowerCase(),
    department: optional(form.department),
    jobTitle: optional(form.jobTitle),
    zipCode: optional(form.zipCode),
    address: optional(form.address),
    addressDetail: optional(form.addressDetail),
    roleGroupId: Number(form.roleGroupId),
  };
}

export function toCreateInput(form: AdminForm): CreatePlatformAdminInput {
  return { loginId: form.loginId.trim(), ...profileOf(form) };
}

/** updatedAt 은 상세에서 받은 값 그대로 — api 가 그 사이 다른 사람이 고쳤는지 본다. */
export function toUpdateInput(form: AdminForm, updatedAt: string): UpdatePlatformAdminInput {
  return { ...profileOf(form), accountStatus: form.accountStatus, updatedAt };
}
