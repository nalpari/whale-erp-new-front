// 로그인 후 홈 점포 하나 화면(WHALEERP-342)의 순수 규칙 — 어느 점포로 그릴지, 영역별 api 쿼리, TO-DO 세기, 직원 정보 상태 칸.
// api 는 새로 만들지 않고 기존 목록을 부른다(2026-10-27 재영). 가림(isMasked)은 각 api 가 정한다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { Scope } from "../../lib/browser-storage.ts";
import type { AdminStore } from "../../lib/session.ts";
import { employmentStatusCells, type Cell } from "../staff-members/staff-row.ts";
import type { StaffMemberListItem } from "../../lib/staff-members.ts";

/**
 * 점포 하나 화면으로 그릴 점포. 범위가 점포 하나면 그 점포, 가맹마스터 · 가맹관리자(FM · FA)는 고를 점포가 하나라 범위(전체 · 가맹 등)와
 * 상관없이 그 점포다(HOME-6). 그 밖에는 null — 여러 점포 화면이다. 이 탭에 없는 점포(쓸 수 없는 범위)는 부르는 쪽이 먼저 거른다.
 */
export function oneStoreIdOf(scope: Scope, roleTypeCode: string, stores: readonly AdminStore[]): number | null {
  if (scope.type === "STORE") return scope.storeId;
  if ((roleTypeCode === "FM" || roleTypeCode === "FA") && stores.length === 1) return stores[0].storeId;
  return null;
}

/** 직원 정보 표가 읽는 줄 수 — 넘으면 수가 「앞 N명 기준」이라고 밝히고 직원 관리로 보낸다 */
export const STAFF_LIMIT = 100;
/** 오늘 TO-DO 를 읽는 줄 수(api 상한 200) — 완료는 줄의 묶음 상태로 세야 해서 total 만으로는 안 된다 */
export const TODO_TODAY_LIMIT = 200;
/** 공지 띠가 읽는 글 수 — api 는 고정 공지를 먼저 주므로 넉넉히 받아 게시일로 고른다(latestNotices) */
export const NOTICE_FETCH = 20;
const NOTICE_SHOWN = 3;

/** 가입 대기로 보이는 가입 상태(HOME-9) — 초대 발송 · 초대 만료 · 거절 · 소속 추가 확인 · 복귀 확인 */
const WAITING_STATES: ReadonlySet<string> = new Set(["INVITED", "EXPIRED", "REJECTED", "AFFILIATION_PENDING", "RETURN_PENDING"]);
/**
 * 직원 정보 표가 받는 가입 상태 — 임시저장만 있는 레코드(DRAFT)는 재직이 아니라(운영 정책 CTR-29) 표와 수에서 뺀다. 연결 보류(LINK_HOLD)는
 * 없앤 규칙이라 받지 않는다. 가입 불가(UNDER_AGE)는 받아 그대로 보인다.
 */
const STAFF_STATES = ["JOINED", ...WAITING_STATES, "UNDER_AGE"];

/** 영역별 api 경로(BFF) */
export function oneStorePaths(storeId: number, today: string) {
  const todo = (extra: Record<string, string>, pageSize: number) =>
    `/todos?${new URLSearchParams({ storeIds: String(storeId), ...extra, page: "1", pageSize: String(pageSize) })}`;
  const staff = new URLSearchParams({ storeIds: String(storeId), joinState: STAFF_STATES.join(","), employmentStatus: "EMPLOYED", page: "1", pageSize: String(STAFF_LIMIT) });
  return {
    notices: `/support-notices?page=1&pageSize=${NOTICE_FETCH}`,
    store: `/stores/${storeId}`,
    /** 오늘 수행 예정 전부 — 완료 수 · 앞 2건도 여기서(todoSummaryOf) */
    todoToday: todo({ dueDateFrom: today, dueDateTo: today }, TODO_TODAY_LIMIT),
    /** 날짜와 상관없이 대기 · 진행 중인 긴급 — 여러 점포 화면 처리 대기의 긴급 TO-DO 와 같다 */
    todoUrgent: `${todo({ isUrgent: "true", status: "PENDING" }, 1)}&status=IN_PROGRESS`,
    inquiries: "/support-inquiries?page=1&pageSize=2",
    inquiriesWaiting: "/support-inquiries?status=RECEIVED&status=IN_PROGRESS&page=1&pageSize=1",
    staff: `/staff-members?${staff}`,
  };
}

/**
 * TO-DO 카드 숫자 — 오늘 완료 / 오늘 전체, 진행 막대 %, 대기 · 진행 중(오늘), 긴급. 완료는 목록 줄의 status 로 센다 — 근무지 전체 배정은 묶음
 * 상태라 모두 완료해야 완료다. api 의 status=DONE 필터는 행에 걸려 한 명만 끝낸 묶음도 완료 줄로 오므로 쓰지 않는다. 오늘 것이 상한(200)을
 * 넘으면 받은 줄 기준이다(partial).
 */
export function todoSummaryOf(list: { items: readonly { status: string }[]; total: number }, urgent: number) {
  const today = list.total;
  const done = list.items.filter((t) => t.status === "DONE").length;
  return { today, done, open: Math.max(0, today - done), urgent, percent: today ? Math.round((done / today) * 100) : 0, partial: list.items.length < list.total };
}

/** 공지 띠 — 고정 여부와 상관없이 게시일 최신 3건(같은 날이면 나중 글). api 는 고정 공지를 먼저 주므로 게시일로 다시 고른다 */
export function latestNotices<P extends { postId: number; postedDate: string }>(items: readonly P[]): P[] {
  return [...items].sort((a, b) => b.postedDate.localeCompare(a.postedDate) || b.postId - a.postId).slice(0, NOTICE_SHOWN);
}

/**
 * 직원 정보 상태 칸 — 가입 대기(WAITING_STATES), 가입 불가(만 19세 미만), 가입한 직원은 재직 · 퇴직 예정(employmentStatusCells).
 * 가린 행은 빈 배열(화면이 「—」).
 */
export function oneStoreStatusCells(item: StaffMemberListItem): Cell[] {
  if (item.isMasked) return [];
  if (item.joinState === "UNDER_AGE") return [{ text: "가입 불가(만 19세 미만)", style: "badge-off" }];
  if (item.joinState && WAITING_STATES.has(item.joinState)) return [{ text: "가입 대기", style: "muted" }];
  return employmentStatusCells(item);
}

/**
 * 제목 옆 「재직 N · 가입 대기 M · 가입 불가 U · 가려진 직원 K」 — 가린 행은 가입 여부를 몰라 따로 센다(2026-10-27 재영). 받은 줄로 세므로
 * 전체(total)가 받은 줄보다 많으면 partial — 화면이 「앞 100명 기준」을 밝힌다(가린 직원 수는 api total 로 가를 수 없다).
 */
export function staffCountsOf(list: { items: readonly StaffMemberListItem[]; total: number }) {
  const { items } = list;
  const masked = items.filter((i) => i.isMasked).length;
  const visible = items.filter((i) => !i.isMasked);
  const waiting = visible.filter((i) => i.joinState && WAITING_STATES.has(i.joinState)).length;
  const underAge = visible.filter((i) => i.joinState === "UNDER_AGE").length;
  return { employed: visible.length - waiting - underAge, waiting, underAge, masked, partial: items.length < list.total };
}
