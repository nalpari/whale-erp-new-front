// 내 정보(MY PAGE) 기본정보 입력칸 — 검사와 요청 만들기. 패널(src/components/site/my-page-panel.tsx)에서 뺀 순수 함수라
// node --test 로 검사한다(my-profile-form.test.ts). 규칙은 manyfast F-AMTDCK > S-JXKHCM 과 같다 — 플랫폼 관리자
// 등록(platform-admin-form.ts)의 이름 · 연락처 규칙과 같은 값이지만, 서로 다른 기능이라 따로 둔다(코드가 아주 짧다).
// 이메일 형식은 api @IsEmail 과 같은 규칙이라 이메일 칸이 있는 화면이 같이 쓰는 email-format.ts 를 쓴다.
import { EMAIL_FORMAT_ERROR, isEmailFormat } from "./email-format.ts";
import type { MyProfile, UpdateMyProfileInput } from "./my-profile";

export const NAME_PATTERN = /^[가-힣A-Za-z ]{2,20}$/;
export const PHONE_PATTERN = /^[0-9]{10,11}$/;

export type MyProfileForm = {
  name: string;
  phone: [string, string, string];
  email: string;
};

export type MyProfileFormField = "name" | "phone" | "email" | "currentPassword";

/** 하이픈 없는 번호를 세 칸으로 — 휴대전화(3-4-4) · 02 지역번호(2-3/4-4) · 그 밖 지역번호(3-3/4-4). */
export function splitPhone(digits: string): [string, string, string] {
  if (!digits) return ["", "", ""];
  const head = digits.startsWith("02") ? 2 : 3;
  return [digits.slice(0, head), digits.slice(head, digits.length - 4), digits.slice(-4)];
}

export function formOf(profile: MyProfile): MyProfileForm {
  return { name: profile.name, phone: splitPhone(profile.phone), email: profile.email };
}

const phoneOf = (form: MyProfileForm) => form.phone.map((p) => p.trim()).join("");

export function validateMyProfileForm(form: MyProfileForm): Partial<Record<MyProfileFormField, string>> {
  const errors: Partial<Record<MyProfileFormField, string>> = {};
  if (!NAME_PATTERN.test(form.name.trim())) errors.name = form.name.trim() ? "이름은 한글 또는 영문 2~20자입니다." : "이름을 입력해 주세요.";
  const phone = phoneOf(form);
  if (!PHONE_PATTERN.test(phone)) errors.phone = phone ? "연락처는 숫자 10~11자리입니다." : "연락처를 입력해 주세요.";
  const email = form.email.trim();
  if (!email) errors.email = "이메일을 입력해 주세요.";
  else if (email.length > 100 || !isEmailFormat(email)) errors.email = EMAIL_FORMAT_ERROR;
  return errors;
}

/** 이메일을 바꿀 때만 지금 비밀번호를 받는다 — 비우면 400(api 가 코드 리뷰로 더함, 2026-10-21. 탈취한
 * 접근 토큰만으로 로그인 이메일을 바꿔 비밀번호 찾기를 가로채는 계정 탈취를 막는다). */
export function validateCurrentPassword(emailChanged: boolean, currentPassword: string): string | undefined {
  if (emailChanged && !currentPassword.trim()) return "이메일을 바꾸려면 지금 비밀번호를 입력해 주세요.";
  return undefined;
}

/** updatedAt 은 조회 응답 그대로 — 동시 수정 검사에 쓴다. currentPassword 는 이메일을 바꿀 때만 싣는다
 * (둘 다 api 쪽이 코드 리뷰로 더해짐, 2026-10-21). */
export function toUpdateInput(form: MyProfileForm, updatedAt: string, currentPassword?: string): UpdateMyProfileInput {
  return {
    name: form.name.trim(),
    phone: phoneOf(form),
    email: form.email.trim().toLowerCase(),
    updatedAt,
    ...(currentPassword ? { currentPassword } : {}),
  };
}

/** api 가 거절한 이유를 붙일 칸. */
export function serverErrorField(status: number | undefined, message: string): MyProfileFormField | null {
  if (status !== 400 && status !== 409) return null;
  if (message.includes("비밀번호")) return "currentPassword";
  if (message.includes("이메일")) return "email";
  return null;
}
