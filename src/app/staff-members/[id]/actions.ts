"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import { codeOf, isApiSendRefusal } from "@/lib/api-error";
import { checkBirthDate } from "@/lib/birth-date";
import { checkRetiredDate, staleDayWarning } from "@/lib/retirement";
import { kstToday, type RetirementPreview } from "@/lib/staff-members";
import { cancelRetirement, changeRetirementDate, getRetirementPreview, correctBirthDate, issuePasswordResetLink, retireStaffMember } from "@/lib/staff-members-api";

// 퇴직 처리 확인창의 미리 보기 · 처리 · 퇴직일 변경 · 취소(WHALEERP-585)와 비밀번호 초기화(WHALEERP-177) · 생년월일 정정(WHALEERP-602).
// 메뉴 권한(직원 정보 관리 수정) · 업무 범위 · 상태 · 날짜는 api 가 동작마다 본다. server action 은 공개 엔드포인트라
// id 와 날짜 모양만 다시 본다 — 화면을 거치지 않은 이상한 값을 api 까지 보내지 않는다.

/**
 * 실패 결과. status 가 있으면 api 가 거절한 것이 확실하다. 없으면 결과를 모른다(5xx · 연결 실패) — 퇴직 확인창은 처리됐을 수도
 * 있으니 상세를 다시 받는다(failureEffect 의 refresh). 비밀번호 초기화는 다시 받아도 발송 여부를 알 수 없어 고정 문구로 바꾼다
 * (resetFailureMessage) — failureOf 의 「화면을 새로 불러왔으니」 문구는 그 확인창에 보이지 않는다.
 * today 는 서버의 오늘 — 날짜가 바뀌어 막았을 때만 싣는다. 확인창이 이 값으로 경고 · 미리 보기를 다시 그린다.
 * code 는 api 오류 본문의 업무 code(500 미만일 때, BIRTH_DATE_NOT_JOINED 등) — 같은 상태 코드 안에서 화면 동작을 가를 때 쓴다.
 */
export type ActionFailure = { ok: false; status?: number; message: string; today?: string; code?: string };
export type ActionResult<T = object> = ({ ok: true } & T) | ActionFailure;

/**
 * api 는 400 · 403 · 404 · 409 를 한국어로 알리므로 그대로 보인다. 401 은 할 일을 알 수 있게 고정 문구로 바꾼다.
 * what 은 화면 문구에 들어가는 동작 이름, feature 는 로그에서 기능을 가르는 이름이다(퇴직 · 비밀번호 초기화 · 생년월일 정정).
 */
function failureOf(error: unknown, what: string, log: { feature: string; staffMemberId: number }): ActionFailure {
  if (error instanceof ApiError) {
    if (error.status === 401) return { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
    if (error.status < 500) {
      const code = codeOf(error.body);
      return { ok: false, status: error.status, message: error.message, ...(code === undefined ? {} : { code }) };
    }
  }
  // 결과 모름은 api 로그와 맞춰 봐야 해 기능 이름과 대상 id 를 함께 남긴다.
  console.error(`${log.feature} ${what} 결과 모름`, { staffMemberId: log.staffMemberId }, error);
  return { ok: false, message: `${what} 결과를 확인하지 못했습니다. 화면을 새로 불러왔으니 확인해 주세요.` };
}

const validId = (id: unknown): id is number => typeof id === "number" && Number.isInteger(id) && id >= 1 && id <= 2_147_483_647;
const NOT_FOUND: ActionFailure = { ok: false, status: 404, message: "직원을 찾을 수 없습니다." };

/** 날짜 모양만 본다. 3개월 범위도 같이 보지만 api 가 다시 본다(오늘이 화면과 서버에서 다를 수 있다). */
function badDate(retiredDate: unknown): ActionFailure | null {
  const message = typeof retiredDate === "string" ? checkRetiredDate(retiredDate, kstToday()) : "퇴직일을 입력해 주세요.";
  return message ? { ok: false, status: 400, message } : null;
}

/**
 * 확인창이 경고를 정할 때 쓴 오늘과 서버의 오늘 사이에 퇴직일이 지난 날짜가 됐으면 막는다. 브라우저 시계가 늦어도 api 가 경고 없이
 * 즉시 정리하지 않게 한다 — api 의 즉시 정리 판정은 서버 시계(kstToday)다.
 */
function staleDay(retiredDate: string, shownToday: unknown): ActionFailure | null {
  const today = kstToday();
  const message = staleDayWarning(retiredDate, typeof shownToday === "string" ? shownToday : "", today);
  return message ? { ok: false, status: 409, message, today } : null;
}

/** 처리 뒤 상세 · 목록을 새로 받는다. 무효화가 실패해도 처리는 끝났으므로 성공으로 돌려준다 */
function refresh() {
  try {
    revalidatePath("/staff-members", "layout");
  } catch (error) {
    console.error("직원 화면 갱신 실패", error);
  }
}

export async function previewRetirementAction(id: unknown, retiredDate: unknown): Promise<ActionResult<{ preview: RetirementPreview }>> {
  if (!validId(id)) return NOT_FOUND;
  const bad = badDate(retiredDate);
  if (bad) return bad;
  try {
    return { ok: true, preview: await getRetirementPreview(id, retiredDate as string) };
  } catch (error) {
    return failureOf(error, "미리 보기", { feature: "퇴직", staffMemberId: id });
  }
}

export async function retireAction(id: unknown, retiredDate: unknown, shownToday: unknown): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  const bad = badDate(retiredDate) ?? staleDay(retiredDate as string, shownToday);
  if (bad) return bad;
  try {
    await retireStaffMember(id, retiredDate as string);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "처리", { feature: "퇴직", staffMemberId: id });
  }
}

export async function changeRetirementDateAction(id: unknown, retiredDate: unknown, shownToday: unknown): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  const bad = badDate(retiredDate) ?? staleDay(retiredDate as string, shownToday);
  if (bad) return bad;
  try {
    await changeRetirementDate(id, retiredDate as string);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "퇴직일 변경", { feature: "퇴직", staffMemberId: id });
  }
}

export async function cancelRetirementAction(id: unknown): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await cancelRetirement(id);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "취소", { feature: "퇴직", staffMemberId: id });
  }
}

/**
 * 비밀번호 재설정 링크 발송. 상세 화면에 바뀌는 값이 없어 다시 받지 않는다.
 * api 의 503 은 보내지 않았다고 알린 것이라(링크 주소 · 발송기 없음 · 발송 실패, 앞선 링크는 그대로) 결과 모름이 아니다 — 문구를 그대로 보인다.
 * 프록시 · 로드밸런서의 503 은 api 에 닿았는지 몰라 결과 모름으로 둔다(isApiSendRefusal).
 */
export async function issuePasswordResetLinkAction(id: unknown): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  try {
    await issuePasswordResetLink(id);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError && isApiSendRefusal(error.status, error.body)) return { ok: false, status: 503, message: error.message };
    return failureOf(error, "재설정 링크 발송", { feature: "비밀번호 초기화", staffMemberId: id });
  }
}

/**
 * 생년월일 정정(WHALEERP-602). 날짜 모양 · 오늘 뒤 · 지금과 같은 값은 api 까지 보내지 않고 막는다(같은 값 검사는 화면이 보낸 current 를
 * 믿으므로 api 가 다시 409 로 막는다). 오늘은 서버 시계(kstToday)로 다시 본다. 만 19세 미만 · 가입 · 퇴직은 api 가 본다.
 * 같은 계정의 다른 소속 · 날인 대기 계약 대조에 닿으므로 상세 전체를 새로 받는다.
 */
export async function correctBirthDateAction(id: unknown, birthDate: unknown, current: unknown): Promise<ActionResult> {
  if (!validId(id)) return NOT_FOUND;
  const message = typeof birthDate === "string" ? checkBirthDate(birthDate, kstToday(), typeof current === "string" ? current : null) : "새 생년월일을 입력해 주세요.";
  if (message) return { ok: false, status: 400, message };
  try {
    await correctBirthDate(id, birthDate as string);
    refresh();
    return { ok: true };
  } catch (error) {
    return failureOf(error, "정정", { feature: "생년월일 정정", staffMemberId: id });
  }
}
