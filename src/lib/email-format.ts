// 이메일 형식 — 이메일 칸이 있는 화면(플랫폼 관리자 등록 · 수정, 마이페이지 기본정보, 회원가입, 아이디 · 비밀번호 찾기, 도입문의)이
// 같이 쓴다. api 는 이 칸들을 모두 class-validator @IsEmail()(validator 13.15 isEmail · isFQDN, 기본 옵션)로 막으므로, 화면도
// 같은 규칙으로 본다 — 화면이 맞다고 한 값을 저장할 때 api 가 형식 오류로 막지 않게. node --test 로 검사한다(email-format.test.ts).
// 칸마다 다른 최대 길이(100 · 254)는 쓰는 쪽이 정한다.

/** 형식이 틀렸을 때 칸 아래(또는 제출 버튼 위)에 보이는 문구 — 이메일 칸이 있는 화면 모두 같다(2026-10-23 사용자 결정). */
export const EMAIL_FORMAT_ERROR = "이메일 형식이 올바르지 않습니다.";

/** @ 앞 — 영문 · 숫자 · 일부 기호 · 비ASCII(이모지 · 제어문자 제외). 점은 맨 앞 · 맨 뒤 · 연달아 오지 않는다. */
const LOCAL_ATOM = "[a-z0-9!#$%&'*+\\-/=?^_`{|}~\\u00a1-\\ud7ff\\uf900-\\ufdcf\\ufdf0-\\uffef]+";
const LOCAL = new RegExp(`^${LOCAL_ATOM}(?:\\.${LOCAL_ATOM})*$`, "i");
/** 도메인 마디 — 영문 · 숫자 · 하이픈 · 한글 같은 비ASCII(전각 영문 · 기호 제외). 하이픈으로 시작 · 끝나지 않는다. */
const LABEL_CHAR = "[a-z0-9\\u00a1-\\uff00\\uff5f-\\uffff]";
const LABEL = new RegExp(`^${LABEL_CHAR}(?:(?:${LABEL_CHAR}|-)*${LABEL_CHAR})?$`, "i");
/** 끝 마디(TLD) — 숫자 · 하이픈 · 전각 영문 없는 2자 이상, 또는 xn 으로 시작하는 국제화 도메인 표기. */
const TLD = /^(?:[a-z¡-¨ª-퟿豈-﷏ﷰ-＀｟-￯]{2,}|xn[a-z0-9-]+[a-z0-9])$/i;

const bytes = (text: string) => new TextEncoder().encode(text).length;

/**
 * api @IsEmail 이 받는 형식인가. 앞뒤 공백은 쓰는 쪽이 먼저 빼고 넘긴다(api 도 빼고 본다).
 * 따옴표로 묶은 @ 앞(`"kim lee"@…`)은 api 가 받지만 여기서는 막는다 — 실제로 쓰는 주소가 아니다.
 */
export function isEmailFormat(value: string): boolean {
  if (value.length > 254) return false;
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  // 길이 제한은 글자 수가 아니라 UTF-8 바이트다 — 한글은 한 글자에 3바이트라 @ 앞 22자부터 넘는다
  if (bytes(local) > 64 || bytes(domain) > 254 || !LOCAL.test(local)) return false;
  const labels = domain.split(".");
  const tld = labels.pop() ?? "";
  if (!labels.length || tld.length > 63 || /\s/.test(tld) || !TLD.test(tld)) return false;
  return labels.every((label) => label.length <= 63 && !/\s/.test(label) && LABEL.test(label));
}
