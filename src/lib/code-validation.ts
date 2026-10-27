// 공통코드 그룹 코드 · 상세 코드 입력 규칙(okf/system.md 「플랫폼 공통코드 관리」).
// api 도 같은 규칙으로 막는다(DTO 의 형식 검사 · 409 중복). 화면은 저장 전에 칸 아래에 먼저 알린다.

/** 영문 대문자·숫자·밑줄, 영문으로 시작, 20자 이내. DB CHECK 와 같은 식이다. */
export const CODE_PATTERN = /^[A-Z][A-Z0-9_]{0,19}$/;
export const CODE_MAX_LENGTH = 20;
/** 새 상세 코드 칸의 안내 문구 — 입력 규칙을 칸 안에 미리 보인다(2026-10-27 사용자 지정 — 전엔 「상세 코드」). */
export const CODE_PLACEHOLDER = "영문 대문자로 시작, 영문·숫자·_ 최대 20자";

/** 소문자로 쳐도 대문자로 바꾼다. 입력칸이 칠 때마다 부른다. */
export function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

/** 형식 오류 문구. 맞으면 null. */
export function codeFormatError(code: string): string | null {
  if (!code) return "코드를 입력해 주세요.";
  // 칸 아래 한 줄에 들어가게 줄였다(2026-10-27 사용자 지정 — 전엔 「영문 대문자·숫자·밑줄만 쓰고 영문으로 시작하며 20자 이내입니다.」)
  if (!CODE_PATTERN.test(code)) return "영문 대문자로 시작해 영문·숫자·_로 입력해 주세요.(최대 20자)";
  return null;
}

/**
 * 새 코드 중 겹치는 것. 그룹 코드는 플랫폼 전체, 상세 코드는 같은 그룹 안에서 유일하다.
 * 화면이 아는 기존 코드(지금 쪽의 그룹 · 고른 그룹의 상세 코드)만 본다 — 다른 쪽이나 BP 행과 겹치는 것은 api 가 409 로 알린다.
 */
export function duplicateCodes(existing: readonly string[], created: readonly string[]): Set<string> {
  const seen = new Set(existing);
  const duplicates = new Set<string>();
  for (const code of created) {
    if (!code) continue;
    if (seen.has(code)) duplicates.add(code);
    seen.add(code);
  }
  return duplicates;
}
