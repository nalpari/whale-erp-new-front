// 로그인 후 홈 점포 하나 화면(WHALEERP-342)의 순수 규칙 — 어느 점포로 그릴지, 영역별 api 쿼리, TO-DO 세기, 직원 정보 상태 칸.
// api 는 새로 만들지 않고 기존 목록을 부른다(2026-10-27 재영). 가림(isMasked)은 각 api 가 정한다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { Scope } from "../../lib/browser-storage.ts";
import type { AdminStore } from "../../lib/session.ts";
import { DEFAULT_STAFF_LIST_QUERY } from "../staff-members/staff-list-query.ts";
import { employmentStatusCells, type Cell } from "../staff-members/staff-row.ts";
import { staffListApiSearch, type StaffMemberListItem } from "../../lib/staff-members.ts";

/**
 * 점포 하나 화면으로 그릴 점포. 범위가 점포 하나면 그 점포, 가맹마스터 · 가맹관리자(FM · FA)는 고를 점포가 하나라 범위가 「전체」여도
 * 그 점포다. 그 밖에는 null — 여러 점포 화면이다. 이 탭에 없는 점포(쓸 수 없는 범위)는 부르는 쪽이 먼저 거른다.
 */
export function oneStoreIdOf(scope: Scope, roleTypeCode: string, stores: readonly AdminStore[]): number | null {
  if (scope.type === "STORE") return scope.storeId;
  if ((roleTypeCode === "FM" || roleTypeCode === "FA") && stores.length === 1) return stores[0].storeId;
  return null;
}

/** 직원 정보 표가 읽는 줄 수 — 넘으면 「앞 N명」으로 알리고 직원 관리로 보낸다 */
export const STAFF_LIMIT = 100;

/** 영역별 api 경로(BFF). TO-DO 는 total 만 쓰려고 쪽 크기를 줄인다 */
export function oneStorePaths(storeId: number, today: string) {
  const todo = (extra: Record<string, string>, pageSize: number) =>
    `/todos?${new URLSearchParams({ storeIds: String(storeId), ...extra, page: "1", pageSize: String(pageSize) })}`;
  const staff = staffListApiSearch({ ...DEFAULT_STAFF_LIST_QUERY, storeIds: [storeId], pageSize: STAFF_LIMIT });
  return {
    notices: "/support-notices?page=1&pageSize=3",
    store: `/stores/${storeId}`,
    /** 오늘 전체 — 앞 2건도 여기서 */
    todoToday: todo({ dueDateFrom: today, dueDateTo: today }, 2),
    todoTodayDone: todo({ dueDateFrom: today, dueDateTo: today, status: "DONE" }, 1),
    /** 날짜와 상관없이 대기 · 진행 중인 긴급 — 여러 점포 화면 처리 대기의 긴급 TO-DO 와 같다 */
    todoUrgent: `${todo({ isUrgent: "true", status: "PENDING" }, 1)}&status=IN_PROGRESS`,
    inquiries: "/support-inquiries?page=1&pageSize=2",
    inquiriesWaiting: "/support-inquiries?status=RECEIVED&status=IN_PROGRESS&page=1&pageSize=1",
    staff: `/staff-members?${staff}`,
  };
}

/** TO-DO 카드 숫자 — 오늘 완료 / 오늘 전체, 진행 막대 %, 대기 · 진행 중(오늘), 긴급 */
export function todoSummaryOf(today: number, done: number, urgent: number) {
  return { today, done, open: Math.max(0, today - done), urgent, percent: today ? Math.round((done / today) * 100) : 0 };
}

/**
 * 직원 정보 상태 칸 — 가입하지 않은 직원(초대 발송 · 만료 · 거절 · 소속 추가 확인 · 복귀 확인 등)은 「가입 대기」, 가입한 직원은 재직 · 퇴직 예정
 * (employmentStatusCells). 가린 행은 빈 배열(화면이 「-」).
 */
export function oneStoreStatusCells(item: StaffMemberListItem): Cell[] {
  if (item.isMasked) return [];
  if (item.joinState !== "JOINED") return [{ text: "가입 대기", style: "muted" }];
  return employmentStatusCells(item);
}

/** 제목 옆 「재직 N · 가입 대기 M · 가려진 직원 K」 — 가린 행은 가입 여부를 몰라 앞 둘에 넣지 않고 따로 센다(2026-10-27 재영) */
export function staffCountsOf(items: readonly StaffMemberListItem[]) {
  const masked = items.filter((i) => i.isMasked).length;
  const waiting = items.filter((i) => !i.isMasked && i.joinState !== "JOINED").length;
  return { employed: items.length - masked - waiting, waiting, masked };
}
