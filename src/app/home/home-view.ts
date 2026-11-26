// 로그인 후 홈의 순수 규칙 — 업무 범위 → api 쿼리, 확인 필요 한 줄의 문구 · 이동 주소, 공지 띠.
// 이동 주소는 각 목록의 주소 만들기로 만들어 그 목록의 query 파서와 어긋나지 않게 한다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "../../lib/api-types.generated.ts";
import type { Scope } from "../../lib/browser-storage.ts";
import { bpPath } from "../../lib/bp-path.ts";
import type { AdminStore } from "../../lib/session.ts";
import { JOIN_GROUP_STATES, JOIN_GROUPS } from "../../lib/staff-members.ts";
import { branchStores, isClosedStore, isUnusableScope, scopeStores } from "../../lib/store-scope.ts";
import { listHrefOf } from "../contracts/contract-list.ts";
import { DEFAULT_STAFF_LIST_QUERY, staffListHrefOf } from "../staff-members/staff-list-query.ts";
import { DEFAULT_TODO_LIST_QUERY, TODO_STATUSES, toTodoListSearch } from "../todos/todo-list-query.ts";

export type HomeSummary = components["schemas"]["HomeSummaryResponseDto"];
export type HomePending = components["schemas"]["HomePendingResponseDto"];
export type HomePendingItem = components["schemas"]["HomePendingItemDto"];

/**
 * /home/summary · /home/pending 쿼리 — 전체면 빈 값(관리 범위 전체), 아니면 범위의 점포 ID 쉼표 목록. 범위에 드는 점포가 이 탭에 없으면
 * (isUnusableScope) null — 쿼리를 빼면 BP 전체가 보이므로 부르지 않고 안내한다.
 */
export function homeSearchOf(scope: Scope, stores: readonly AdminStore[]): string | null {
  if (isUnusableScope(scope, stores)) return null;
  const ids = scopeStores(scope, stores).map((s) => s.storeId);
  return ids.length ? `?storeIds=${ids.join(",")}` : "";
}

/** 홈 「점포」 칸의 운영 · 미운영 × 직영 · 가맹 수 — 로그인 정보의 점포를 상단 범위로 거른다(전체면 모두). 본사 · 폐점은 세지 않는다(2026-11-18 사용자 지정) */
export function storeCountsOf(scope: Scope, stores: readonly AdminStore[]) {
  const inScope = scope.type === "ALL" ? stores : scopeStores(scope, stores);
  const live = branchStores(inScope).filter((s) => !isClosedStore(s));
  const count = (status: string, type: string) => live.filter((s) => s.storeStatusCode === status && s.storeTypeCode === type).length;
  const row = (status: string) => ({ direct: count(status, "DIRECT"), franchise: count(status, "FRANCHISE") });
  return { operating: row("OPERATING"), notOperating: row("NOT_OPERATING") };
}

type Kind = "근로계약" | "직원" | "문의" | "TO-DO";

const PENDING_TEXT: Record<HomePendingItem["type"], { kind: Kind; title: string; since?: string }> = {
  CONTRACT_RENEWAL: { kind: "근로계약", title: "갱신 예정" },
  CONTRACT_PENDING_SIGNATURE: { kind: "근로계약", title: "직원 서명 대기", since: "발송" },
  CONTRACT_CORRECTION_REQUESTED: { kind: "근로계약", title: "직원 수정 요청", since: "요청" },
  AFFILIATION_REJECTED: { kind: "직원", title: "소속 확인 거절", since: "거절" },
  INQUIRY_ANSWERED: { kind: "문의", title: "답변완료", since: "답변" },
  // TO-DO 상태 이름이 아닌 「미완료」를 쓰지 않는다(용어집 TO-DO 상태 3종) — 대기 · 진행 중 긴급 TO-DO 다
  URGENT_TODO: { kind: "TO-DO", title: "긴급", since: "등록" },
};

/** 대표 이름 — 가려졌으면 이름 없이 「N건」, 나머지가 있으면 「외 N명」(문의 · TO-DO 는 제목이라 「외 N건」) */
function whoOf(item: HomePendingItem, kind: Kind): string {
  if (item.isFirstNameMasked || item.firstName === null) return `${item.count}건`;
  if (!item.othersCount) return item.firstName;
  return `${item.firstName} 외 ${item.othersCount}${kind === "문의" || kind === "TO-DO" ? "건" : "명"}`;
}

/** 확인 필요 한 줄이 갈 목록 주소. filter 의 점포 · 상태를 그 목록의 주소 조건으로 옮긴다 */
export function pendingHrefOf(item: HomePendingItem, bpCodeId: number): string {
  const { storeIds, status } = item.filter;
  switch (item.type) {
    case "CONTRACT_RENEWAL":
    case "CONTRACT_PENDING_SIGNATURE":
    case "CONTRACT_CORRECTION_REQUESTED":
      return bpPath(bpCodeId, listHrefOf({ page: 1, pageSize: 20, staffMemberName: "", status, statusNone: false, storeIds, storesCleared: false, scope: null }));
    case "AFFILIATION_REJECTED":
      // 직원 목록은 가입 상태를 묶음으로만 거른다 — 그 상태가 든 묶음(거절은 「초대」)
      return bpPath(
        bpCodeId,
        staffListHrefOf({
          ...DEFAULT_STAFF_LIST_QUERY,
          storeIds,
          joinGroups: JOIN_GROUPS.filter((g) => JOIN_GROUP_STATES[g].some((s) => status.includes(s))),
        }),
      );
    case "INQUIRY_ANSWERED": {
      const params = new URLSearchParams();
      for (const s of status) params.append("status", s);
      return bpPath(bpCodeId, `/support-inquiries?${params}`);
    }
    case "URGENT_TODO":
      return bpPath(bpCodeId, `/todos${toTodoListSearch({ ...DEFAULT_TODO_LIST_QUERY, storeIds, statuses: TODO_STATUSES.filter((s) => status.includes(s)), urgentOnly: true })}`);
  }
}

/** 계약 갱신 예정의 D-N 을 빨간색으로 보이는 남은 날(운영 정책 HOM-04) */
const RENEWAL_URGENT_DAYS = 7;

/**
 * 확인 필요 한 줄 — 구분 · 항목 · 내용 · 이동 주소. api 가 이 화면이 모르는 유형을 주면 null(그 줄만 건너뛴다).
 * 계약 갱신 예정은 내용 끝에 가장 이른 종료까지 남은 날 「종료 D-N」(due)을 따로 주고, 7일 이내면 urgent 다(경고 밴드 대신, HOM-04).
 */
export function pendingLineOf(item: HomePendingItem, bpCodeId: number) {
  const text = PENDING_TEXT[item.type] as (typeof PENDING_TEXT)[HomePendingItem["type"]] | undefined;
  if (!text) return null;
  const days = item.waitingDays;
  const waited =
    item.type === "CONTRACT_RENEWAL" ? "새 근로계약서 초안 없음" : !text.since || days === null ? null : days === 0 ? `오늘 ${text.since}` : `${text.since} 후 ${days}일 경과`;
  const left = item.type === "CONTRACT_RENEWAL" ? item.dueInDays : null;
  return {
    kind: text.kind,
    title: `${text.title} ${item.count}건`,
    desc: [whoOf(item, text.kind), waited].filter(Boolean).join(" · "),
    /** 대표 이름 — 홈 확인 필요의 항목 옆. 가려졌거나 없으면 null(제목에 이미 건수가 있어 「3건 · 3건」이 되지 않게, 리뷰 반영) */
    who: item.isFirstNameMasked || item.firstName === null ? null : whoOf(item, text.kind),
    /**
     * 짧은 경과 — 홈 확인 필요의 오른쪽 칸(「2일 경과」 · 「오늘」). 칸이 좁아(창 1260) 「발송 후」 같은 앞말은 뺀다(2026-11-18 사용자 지정).
     * 계약 갱신 예정은 경과가 없어 null — 「새 근로계약서 초안 없음」은 항목 칸에 붙이고 오른쪽 칸은 종료 D-N(due)이다
     */
    /** 계약 갱신 예정의 「새 근로계약서 초안 없음」 — 대표 이름 옆에 붙인다(가려진 이름이면 이것만) */
    note: item.type === "CONTRACT_RENEWAL" ? waited : null,
    elapsed: !text.since || days === null ? null : days === 0 ? "오늘" : `${days}일 경과`,
    due: left === null ? null : { text: `종료 D-${left}`, urgent: left <= RENEWAL_URGENT_DAYS },
    href: pendingHrefOf(item, bpCodeId),
  };
}

/**
 * 운영 점포별 현황 맨 아래 안내 — 확인 필요 총건수 가운데 표에 없는 건(미운영 점포의 건 = api `notOperatingCount`, 점포에 묶이지 않은 문의 답변완료).
 * 집계 기준은 그대로다 — 현황은 운영 점포만(운영 정책 HOM-06), 확인 필요는 미운영 · 문의까지(HOM-07). 두 숫자의 차이만 글로 알린다(WHALEERP-759 B안,
 * 2026-11-24 재영). 0건인 쪽은 빼고, 둘 다 0이면 null(줄을 두지 않는다). `notOperatingCount` 가 없는 옛 api 응답이면 0으로 본다(api 배포 전에 front 가 먼저 나가도 깨지지 않게)
 */
export function outsideTableNote(pending: HomePending): string | null {
  const notOperating = pending.notOperatingCount ?? 0;
  const inquiries = pending.items.find((i) => i.type === "INQUIRY_ANSWERED")?.count ?? 0;
  const parts = [notOperating > 0 ? `미운영 점포 ${notOperating}건` : null, inquiries > 0 ? `문의 답변완료 ${inquiries}건` : null].filter((p): p is string => p !== null);
  return parts.length ? `${parts.join(" · ")}은 운영 점포별 현황에 없고 확인 필요에만 셉니다.` : null;
}

/** 공지 띠가 읽는 글 수 — api 는 고정 공지를 먼저 주므로 넉넉히 받아 게시일로 고른다(latestNotices) */
export const NOTICES_PATH = "/support-notices?page=1&pageSize=20";
const NOTICE_SHOWN = 3;

/** 공지 띠 — 고정 여부와 상관없이 게시일 최신 3건(같은 날이면 나중 글). api 는 고정 공지를 먼저 주므로 게시일로 다시 고른다 */
export function latestNotices<P extends { postId: number; postedDate: string }>(items: readonly P[]): P[] {
  return [...items].sort((a, b) => b.postedDate.localeCompare(a.postedDate) || b.postId - a.postId).slice(0, NOTICE_SHOWN);
}
