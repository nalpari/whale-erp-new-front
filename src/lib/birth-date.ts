// 직원 생년월일 정정(WHALEERP-602) 판정. 화면은 버튼 · 입력 검사 · 실패 문구를 미리 가르고, 막는 것은 늘 api 다
// (PUT /staff-members/:id/birth-date — 권한 · 범위 · 가입 · 퇴직 · 만 19세 · 같은 값).
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { StaffMember } from "./staff-members.ts";

/**
 * 상세의 「정정」 버튼. 「직원 정보 관리」 수정 권한이 있고(usePagePermission) api 가 정정할 수 있다고 알린 직원(`birthDateCorrectable`)일 때 보인다.
 * api 판정은 409 BIRTH_DATE_NOT_JOINED · BIRTH_DATE_RETIRED 와 같다 — 계정이 탈퇴 · 연결 보류여도 `joinState` 는 직원 레코드 기준이라
 * JOINED 로 오기 때문에 joinState · employmentStatus 로는 가를 수 없다. 퇴직 예정은 api 가 허용한다. 옛 api(칸 없음)는 false 로 채워 숨긴다
 * (withEmploymentHistory). 본사 역할 · 범위는 보지 않는다 — 범위 밖 · 본사에 가린 직원은 api 가 404 다.
 */
export function canCorrectBirthDate(staff: Pick<StaffMember, "birthDateCorrectable">, canUpdate: boolean): boolean {
  return canUpdate && staff.birthDateCorrectable === true;
}

/** YYYY-MM-DD 이고 있는 날짜인가. 2026-02-30 같은 날짜는 아니다. */
function isDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

/**
 * 확인창 · 서버 액션의 새 생년월일 검사. 맞으면 null, 아니면 칸 아래에 둘 문구. 오늘 뒤 날짜는 받지 않는다(api 400 BIRTH_DATE_INVALID — 형식 · 없는 날짜 · 오늘 뒤 — 와 같은 문구. 본문이 틀리면 code 없는 400 이다).
 * 만 19세 미만은 api 가 본다. current 는 지금 생년월일 — 같으면 api 가 409 BIRTH_DATE_UNCHANGED 라 미리 알린다.
 */
export function checkBirthDate(value: string, today: string, current: string | null): string | null {
  if (value === "") return "새 생년월일을 입력해 주세요.";
  if (!isDate(value)) return "생년월일은 YYYY-MM-DD 형식의 있는 날짜여야 합니다";
  if (value > today) return "오늘 이후 날짜는 넣을 수 없습니다.";
  if (value === current) return "지금 생년월일과 같습니다.";
  return null;
}

/**
 * 새 생년월일이 바뀌면 「신분증 등으로 확인했습니다」 체크를 푼다(관리자가 본 날짜가 아니면 확인으로 치지 않는다). 값이 같으면 유지한다 —
 * DateField 는 값이 그대로여도 blur 때 onChange 를 다시 부른다.
 */
export const confirmAfterDateChange = (confirmed: boolean, prev: string, next: string) => confirmed && prev === next;

/** 확인창 체크 문구. 체크해야 [정정]이 눌린다. */
export const BIRTH_DATE_CONFIRM_LABEL = "신분증 등으로 본인의 생년월일을 확인했습니다";

/** 확인창 안내 세 줄(노영주 승인안) */
export const BIRTH_DATE_NOTES: readonly string[] = [
  "이미 체결한 근로계약서의 생년월일은 바뀌지 않습니다.",
  "날인 대기 중인 계약은 바뀐 생년월일로 본인 대조를 다시 합니다.",
  "이 직원의 다른 근무지 소속에도 같이 바뀝니다.",
];

/** 서버 액션 자체를 부르지 못했을 때(브라우저 연결 끊김 · 배포 뒤 옛 화면의 액션 불일치) */
export const BIRTH_DATE_REQUEST_FAILED_MESSAGE = "정정 결과를 확인하지 못했습니다. 화면을 새로 고쳐 생년월일을 확인해 주세요.";

/** 가입 전(탈퇴 · 연결 보류 포함) · 퇴직으로 막는 409 의 code. 같은 값(UNCHANGED)은 상태가 바뀐 것이 아니라 여기에 넣지 않는다. */
const STATE_CHANGED_CODES: ReadonlySet<string> = new Set(["BIRTH_DATE_NOT_JOINED", "BIRTH_DATE_RETIRED"]);

/**
 * 실패 뒤 확인창을 닫고 상세를 다시 받는가. 가입 전(탈퇴 · 연결 보류 포함) · 퇴직(409)은 화면이 낡았다는 뜻이라 다시 받아 버튼을 거둔다 —
 * 다시 받으면 버튼과 함께 확인창도 내려가므로 문구를 토스트로 알리고 닫은 뒤 다시 받는다. 비밀번호 초기화의 refreshesAfterReset 은 409 를
 * 모두 닫지만, 여기서는 같은 값(409 BIRTH_DATE_UNCHANGED)을 code 로 뺀다 — 확인창을 닫지 않고 문구를 둔 채 값만 다시 받는다(확인창).
 * 400 은 확인창 안에 문구로 둔다.
 */
export const refreshesAfterCorrection = (failure: { status?: number; code?: string }) =>
  failure.status === 409 && failure.code !== undefined && STATE_CHANGED_CODES.has(failure.code);
