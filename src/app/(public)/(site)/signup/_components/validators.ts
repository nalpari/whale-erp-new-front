// 회원가입 기본정보 형식 검사. 여기 있는 건 글자 모양만 보는 검사다 — 아이디·이메일 중복 확인은
// signup/actions.ts 가 api 로 한다. 사업자등록번호 중복(진위) 확인은 국세청 연동이 없어 아직 못 한다.
// 메세지가 있으면 오류, undefined 면 통과.

const LOGIN_ID = /^(?=.*[A-Za-z])[A-Za-z0-9]{4,20}$/;
export function validateLoginId(value: string): string | undefined {
  if (!value) return "아이디를 입력해 주세요.";
  if (!LOGIN_ID.test(value)) return "영문·숫자 조합으로 4~20자로 입력해 주세요.";
  return undefined;
}

// 허용 특수문자: ! @ # $ % ^ & * ( ) - _ = + [ ] { } ? (공백 불가)
const PASSWORD_CHARS = /^[A-Za-z0-9!@#$%^&*()\-_=+[\]{}?]{8,20}$/;
const HAS_LETTER = /[A-Za-z]/;
const HAS_DIGIT = /[0-9]/;
const HAS_SPECIAL = /[!@#$%^&*()\-_=+[\]{}?]/;
export function validatePassword(value: string): string | undefined {
  if (!value) return "비밀번호를 입력해 주세요.";
  if (!PASSWORD_CHARS.test(value) || !HAS_LETTER.test(value) || !HAS_DIGIT.test(value) || !HAS_SPECIAL.test(value))
    return "영문·숫자·특수문자를 모두 포함해 8~20자로 입력해 주세요.";
  return undefined;
}

export function validatePasswordConfirm(password: string, confirm: string): string | undefined {
  if (!confirm) return "비밀번호를 한 번 더 입력해 주세요.";
  if (password !== confirm) return "비밀번호가 일치하지 않습니다.";
  return undefined;
}

// 사업자등록번호 숫자 10자리. 입력칸이 숫자만 받는다. 진위는 국세청 API 가 볼 일이다.
const BIZ_REGISTRATION_NUMBER = /^\d{10}$/;
export function validateBizRegistrationNumber(value: string): string | undefined {
  if (!BIZ_REGISTRATION_NUMBER.test(value)) return "사업자등록번호는 숫자 10자리로 입력해 주세요.";
  return undefined;
}

const NAME = /^[A-Za-z가-힣]{2,20}$/;
export function validateName(value: string): string | undefined {
  if (!value) return "이름을 입력해 주세요.";
  if (!NAME.test(value)) return "한글 또는 영문 2~20자로 입력해 주세요.";
  return undefined;
}

export function validatePhone(a: string, b: string, c: string): string | undefined {
  const digits = `${a}${b}${c}`;
  if (!digits) return "연락처를 입력해 주세요.";
  if (!/^[0-9]+$/.test(digits) || digits.length < 10 || digits.length > 11) return "숫자만, 세 칸을 합쳐 10~11자리로 입력해 주세요.";
  return undefined;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateEmail(value: string): string | undefined {
  if (!value) return "이메일을 입력해 주세요.";
  if (!EMAIL.test(value)) return "이메일 형식으로 입력해 주세요.";
  return undefined;
}

export function validateTradeName(value: string): string | undefined {
  // api 는 앞뒤 공백을 지우고 본다 — 공백만 친 값을 여기서 거르지 않으면 제출할 때 api 400 으로만 걸려
  // 이 칸이 아니라 제출 버튼 아래에 엉뚱하게 오류가 뜬다(2026-10-14 코드리뷰).
  if (!value.trim()) return "상호명을 입력해 주세요.";
  if (value.length > 50) return "50자 이내로 입력해 주세요.";
  return undefined;
}
