// 사업자정보 인증(국세청 진위확인) 상자의 공통 규칙 — 입력 거르기 · 검사 · 문구 · 10분 만료. 네 화면(회원가입 · 점포 등록/수정 ·
// 마이페이지 사업자정보 탭 · 플랫폼 BP 관리)이 같은 규칙 · 같은 문구를 쓰도록 둔 곳이다(manyfast S-VRNTHD, 2026-10-22 사용자 확정).
// 지금은 회원가입 · 점포가 쓰고, 마이페이지 탭과 플랫폼 BP 관리는 이것으로 옮길 차례다. 화면마다 다른 것은 재인증에서 여는 칸(점포는
// 저장 뒤 대표자명만)과 [재인증 취소] · 안내 문구다.
// node --test 가 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.

export type BizVerifyField = "bizNumber" | "ceoName" | "openDate";
export type BizVerifyValues = Record<BizVerifyField, string>;

export const BIZ_NUMBER_PATTERN = /^[0-9]{10}$/;
/** 하이픈을 넣어 쳐도(123-45-67890) 잘리지 않는 길이. 숫자 10자리 검사는 하이픈을 뺀 뒤에 한다. */
export const BIZ_NUMBER_INPUT_MAX = 12;
export const BIZ_CEO_NAME_MAX = 50;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** api 가 주는 인증 결과의 유효 시간. 지나면 저장하지 않고 다시 인증하게 한다. 요청을 보내기 직전부터 잰다 — api 는 그 뒤에 서명하니 화면이 먼저 만료로 본다. */
export const BIZ_VERIFICATION_TTL_MS = 10 * 60_000;

export const BIZ_VERIFY_LABELS: Record<BizVerifyField, string> = { bizNumber: "사업자등록번호", ceoName: "대표자명", openDate: "개업일자" };
const ORDER: BizVerifyField[] = ["bizNumber", "ceoName", "openDate"];

export const BIZ_MESSAGE = {
  GUIDE: "사업자정보가 국세청에 등록된 정보와 일치하는지 확인합니다.",
  NUMBER_FORMAT: "사업자등록번호는 숫자 10자리입니다.",
  CEO_NAME_LENGTH: `대표자명은 ${BIZ_CEO_NAME_MAX}자까지입니다.`,
  OPEN_DATE_FORMAT: "개업일자는 YYYY-MM-DD 입니다.",
  DUPLICATE: "이미 등록된 사업자등록번호입니다.",
  MISMATCH: "입력한 사업자정보가 국세청 정보와 일치하지 않습니다.",
  UNAVAILABLE: "국세청 확인이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.",
  /** 한도 초과(429) — 일반 문구(사용자 확정) */
  BUSY: "잠시 후 다시 시도해 주세요.",
  EXPIRED: "사업자정보 인증이 만료되었습니다. 다시 인증해 주세요.",
  UNVERIFIED: "인증하기를 눌러 사업자정보를 확인해 주세요.",
  /** 서버에 닿지 못했거나(연결 끊김) 알아볼 수 없는 실패 */
  FAILED: "사업자정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
} as const;

/** 입력칸에 칠 때 — 숫자와 하이픈만 남기고 12자까지. */
export const bizNumberInput = (raw: string) => raw.replace(/[^0-9-]/g, "").slice(0, BIZ_NUMBER_INPUT_MAX);

/** 인증 · 저장에 쓰는 번호 — 하이픈 · 공백을 뺀 숫자만. */
export const bizDigits = (value: string) => value.replace(/[^0-9]/g, "");

/** 보낼 값 — 번호는 숫자만, 대표자명은 앞뒤 공백을 지운다. */
export function bizVerifyValuesOf(v: BizVerifyValues): BizVerifyValues {
  return { bizNumber: bizDigits(v.bizNumber), ceoName: v.ceoName.trim(), openDate: v.openDate };
}

export const sameBizVerifyValues = (a: BizVerifyValues, b: BizVerifyValues) => {
  const x = bizVerifyValuesOf(a);
  const y = bizVerifyValuesOf(b);
  return x.bizNumber === y.bizNumber && x.ceoName === y.ceoName && x.openDate === y.openDate;
};

export type BizVerifyCheck = {
  /** 비어 있는 칸 — 칸 순서대로. 한 줄로 묶어 버튼 위에 보인다(missingMessage). */
  missing: BizVerifyField[];
  /** 채웠지만 형식이 틀린 칸 — 그 칸 바로 아래에 보인다. */
  format: Partial<Record<BizVerifyField, string>>;
};

/** 인증하기 전 검사. locked 는 고칠 수 없는 칸(저장한 점포의 번호 · 개업일자) — 이미 저장된 값이라 보지 않는다. */
export function checkBizVerify(v: BizVerifyValues, locked: Partial<Record<BizVerifyField, boolean>> = {}): BizVerifyCheck {
  const values = bizVerifyValuesOf(v);
  const missing = ORDER.filter((key) => !locked[key] && !values[key]);
  const format: BizVerifyCheck["format"] = {};
  if (!locked.bizNumber && values.bizNumber && !BIZ_NUMBER_PATTERN.test(values.bizNumber)) format.bizNumber = BIZ_MESSAGE.NUMBER_FORMAT;
  if (!locked.ceoName && values.ceoName.length > BIZ_CEO_NAME_MAX) format.ceoName = BIZ_MESSAGE.CEO_NAME_LENGTH;
  if (!locked.openDate && values.openDate && !DATE_PATTERN.test(values.openDate)) format.openDate = BIZ_MESSAGE.OPEN_DATE_FORMAT;
  return { missing, format };
}

export const hasBizVerifyProblem = (c: BizVerifyCheck) => c.missing.length > 0 || Object.keys(c.format).length > 0;

/** 비어 있는 칸만 「·」로 묶은 한 줄 — "대표자명·개업일자 항목을 입력해 주세요."(사용자 확정, 2026-10-22). 없으면 null. */
export function missingMessage(missing: BizVerifyField[]): string | null {
  return missing.length ? `${missing.map((key) => BIZ_VERIFY_LABELS[key]).join("·")} 항목을 입력해 주세요.` : null;
}

export const isBizVerificationExpired = (verifiedAt: number, now: number) => now - verifiedAt >= BIZ_VERIFICATION_TTL_MS;

/**
 * 인증 요청이 실패했을 때 보일 문구와 자리. 중복만 번호 칸 아래(field), 나머지는 인증하기 버튼 바로 위 한 줄(field: null).
 * status 가 없으면 서버에 닿지 못한 것이다. 화면마다 api 문구가 달라도(가입 · 점포 · 마이페이지 api 가 따로 짓는다) 네 화면이
 * 같은 글자를 보이도록 상태 코드로만 가른다.
 */
export function bizVerifyFailure(status: number | undefined): { field: "bizNumber" | null; message: string } {
  if (status === 409) return { field: "bizNumber", message: BIZ_MESSAGE.DUPLICATE };
  if (status === 422) return { field: null, message: BIZ_MESSAGE.MISMATCH };
  if (status === 503) return { field: null, message: BIZ_MESSAGE.UNAVAILABLE };
  if (status === 429) return { field: null, message: BIZ_MESSAGE.BUSY };
  return { field: null, message: BIZ_MESSAGE.FAILED };
}

/** 상자 머리의 상태 — 「인증 완료 · 2026-10-22」 / 「미인증」. date 는 YYYY-MM-DD(없으면 날짜 없이). */
export function bizVerifiedLabel(verified: boolean, date: string): string {
  if (!verified) return "미인증";
  return date ? `인증 완료 · ${date}` : "인증 완료";
}

/** 화면에서 막 받은 인증의 날짜(한국 시간 YYYY-MM-DD). */
export function dateOfMillis(millis: number): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date(millis));
}
