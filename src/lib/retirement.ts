// 퇴직 처리(WHALEERP-585) 판정. 규칙은 api okf/api/staff-retirement.md 와 같다 — 화면은 버튼 · 확인창을 미리 가르고,
// 막는 것은 늘 api 다(입사일보다 앞선 날짜처럼 화면이 모르는 값은 미리 보기의 400 으로 받는다).
// 날짜는 모두 한국 날짜 YYYY-MM-DD 다. today 는 kstToday() 값을 받는다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { StaffMemberListItem } from "./staff-members.ts";

/** 지난 날짜로 받는 범위. api MAX_PAST_MONTHS 와 같다(STAFF-24). */
const MAX_PAST_MONTHS = 3;

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD 이고 있는 날짜인가. 2026-02-30 같은 날짜는 아니다. */
function isDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

/** 받을 수 있는 가장 이른 퇴직일. 달을 빼고, 그 달에 같은 날이 없으면 말일로 맞춘다(5-31 → 2-28, api addMonths). */
export function earliestRetiredDate(today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  const month = m - 1 - MAX_PAST_MONTHS;
  const last = new Date(Date.UTC(y, month + 1, 0)).getUTCDate();
  const date = new Date(Date.UTC(y, month, Math.min(d, last)));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** 확인창의 퇴직일 검사. 맞으면 null, 아니면 칸 아래에 둘 문구. 미래 날짜는 상한이 없다(api). */
export function checkRetiredDate(value: string, today: string): string | null {
  if (value === "") return "퇴직일을 입력해 주세요.";
  if (!isDate(value)) return "퇴직일을 YYYY-MM-DD 로 입력해 주세요.";
  if (value < earliestRetiredDate(today)) return "퇴직일은 오늘 이후, 또는 최근 3개월 안의 지난 날짜만 받습니다.";
  return null;
}

/** 지난 날짜면 처리하는 그 자리에서 정리된다. 오늘은 아직 일하는 날이라 다음 날 배치가 정리한다. */
export const isSettledNow = (retiredDate: string, today: string) => retiredDate < today;

/**
 * 확인창을 연 채 자정을 넘겨, 화면이 「즉시 정리」 경고를 보이지 않은 퇴직일이 이제 지난 날짜가 되었는가.
 * 그대로 처리하면 api 는 그 자리에서 되돌릴 수 없게 정리한다 — 확인창은 처리하지 않고 경고를 띄워 다시 확인받는다.
 * shownToday 는 확인창이 판단에 쓴 오늘, now 는 확인을 누른 순간의 오늘(KST).
 */
export const settlesWithoutWarning = (retiredDate: string, shownToday: string, now: string) =>
  !isSettledNow(retiredDate, shownToday) && isSettledNow(retiredDate, now);

/** 자정을 넘겨 다시 확인받을 때의 문구. 확인창 · 서버 액션이 같은 문구를 쓴다. */
export const STALE_DAY_MESSAGE = "날짜가 바뀌어 퇴직일이 지난 날짜가 되었습니다. 처리하면 즉시 정리되니 다시 확인해 주세요.";

/**
 * 서버 액션의 판정. 확인창이 경고 여부를 정할 때 쓴 오늘(shownToday)과 서버의 오늘(api 가 즉시 정리를 정하는 시계) 사이에
 * 퇴직일이 지난 날짜가 됐으면 문구를 돌려준다 — 브라우저 시계가 늦어도 경고 없이 즉시 정리되지 않게 한다(PR #36 재리뷰).
 * shownToday 가 날짜가 아니면 판단할 수 없으므로 다시 확인받는다.
 */
export function staleDayWarning(retiredDate: string, shownToday: string, serverToday: string): string | null {
  if (!isDate(shownToday)) return STALE_DAY_MESSAGE;
  return settlesWithoutWarning(retiredDate, shownToday, serverToday) ? STALE_DAY_MESSAGE : null;
}

/**
 * 상세 머리의 퇴직 버튼. retire = 「퇴직 처리」, scheduled = 「퇴직일 변경」 · 「퇴직 처리 취소」, null = 없음.
 * 가입 완료 레코드에만, 「직원 정보 관리」 수정 권한이 있을 때만 보인다. 업무 범위 밖 직원은 상세 api 가 404 라 여기 오지 않는다.
 * 변경 · 취소는 퇴직일 전날까지만 된다 — 당일부터는 배치가 돌 수 있어 api 가 409 다.
 */
export function retirementActions(
  staff: Pick<StaffMemberListItem, "joinState" | "employmentStatus" | "retiredDate">,
  today: string,
  canUpdate: boolean,
): "retire" | "scheduled" | null {
  if (!canUpdate || staff.joinState !== "JOINED" || staff.employmentStatus !== "EMPLOYED") return null;
  if (!staff.retiredDate) return "retire";
  return staff.retiredDate > today ? "scheduled" : null;
}

/** api 403 강제 비밀번호 변경 문구(api src/auth/access-messages.ts, 2026-10-14). 이 문구로 화면 동작을 가른다. */
export const PASSWORD_CHANGE_REQUIRED_MESSAGE = "서비스 이용을 위해 비밀번호를 변경해 주세요.";

/**
 * 퇴직 처리 · 미리 보기 실패를 받은 확인창이 할 일(okf/api/admin-auth.md 「403 messages」).
 * password = 강제 변경 팝업을 다시 띄운다, leave = 문구를 알리고 이전 화면으로(권한 없음 · 사용할 수 없는 계정),
 * inline = 확인창 안에 문구(400 날짜 · 409 상태 · 404 · 401), refresh = 결과를 몰라(5xx · 연결 실패) 화면을 새로 받는다.
 */
export function failureEffect(failure: { status?: number; message: string }): "password" | "leave" | "inline" | "refresh" {
  if (failure.status === undefined) return "refresh";
  if (failure.status !== 403) return "inline";
  return failure.message === PASSWORD_CHANGE_REQUIRED_MESSAGE ? "password" : "leave";
}
