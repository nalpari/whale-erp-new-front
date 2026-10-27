// 로그인 후 홈의 순수 규칙 — 업무 범위 → api 쿼리, 처리 대기 한 줄의 문구 · 이동 주소, 경고 밴드 문구.
// 이동 주소는 각 목록의 주소 만들기로 만들어 그 목록의 query 파서와 어긋나지 않게 한다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "../../lib/api-types.generated.ts";
import type { Scope } from "../../lib/browser-storage.ts";
import { bpPath } from "../../lib/bp-path.ts";
import type { AdminStore } from "../../lib/session.ts";
import { JOIN_GROUP_STATES, JOIN_GROUPS } from "../../lib/staff-members.ts";
import { scopeStores } from "../../lib/store-scope.ts";
import { listHrefOf } from "../contracts/contract-list.ts";
import { DEFAULT_STAFF_LIST_QUERY, staffListHrefOf } from "../staff-members/staff-list-query.ts";
import { DEFAULT_TODO_LIST_QUERY, TODO_STATUSES, toTodoListSearch } from "../todos/todo-list-query.ts";

export type HomeSummary = components["schemas"]["HomeSummaryResponseDto"];
export type HomePending = components["schemas"]["HomePendingResponseDto"];
export type HomePendingItem = components["schemas"]["HomePendingItemDto"];
export type HomeRenewal = components["schemas"]["HomeRenewalDto"];

/** /home/summary · /home/pending 쿼리 — 전체면 빈 값(관리 범위 전체), 아니면 범위의 점포 ID 쉼표 목록 */
export function homeSearchOf(scope: Scope, stores: readonly AdminStore[]): string {
  const ids = scopeStores(scope, stores).map((s) => s.storeId);
  return ids.length ? `?storeIds=${ids.join(",")}` : "";
}

type Kind = "계약" | "직원" | "문의" | "TO-DO";

const PENDING_TEXT: Record<HomePendingItem["type"], { kind: Kind; title: string; since?: string }> = {
  CONTRACT_RENEWAL: { kind: "계약", title: "계약 갱신 예정" },
  CONTRACT_PENDING_SIGNATURE: { kind: "계약", title: "근로계약 서명 대기", since: "발송" },
  CONTRACT_CORRECTION_REQUESTED: { kind: "계약", title: "근로계약 수정 요청", since: "요청" },
  AFFILIATION_REJECTED: { kind: "직원", title: "소속 확인 거절", since: "거절" },
  INQUIRY_ANSWERED: { kind: "문의", title: "문의 답변완료", since: "답변" },
  // TO-DO 상태 이름이 아닌 「미완료」를 쓰지 않는다(용어집 TO-DO 상태 3종) — 대기 · 진행 중 긴급 TO-DO 다
  URGENT_TODO: { kind: "TO-DO", title: "긴급 TO-DO", since: "등록" },
};

/** 대표 이름 — 가려졌으면 이름 없이 「N건」, 나머지가 있으면 「외 N명」(문의 · TO-DO 는 제목이라 「외 N건」) */
function whoOf(item: HomePendingItem, kind: Kind): string {
  if (item.isFirstNameMasked || item.firstName === null) return `${item.count}건`;
  if (!item.othersCount) return item.firstName;
  return `${item.firstName} 외 ${item.othersCount}${kind === "문의" || kind === "TO-DO" ? "건" : "명"}`;
}

/** 처리 대기 한 줄이 갈 목록 주소. filter 의 점포 · 상태를 그 목록의 주소 조건으로 옮긴다 */
export function pendingHrefOf(item: HomePendingItem, bpCodeId: number): string {
  const { storeIds, status } = item.filter;
  switch (item.type) {
    case "CONTRACT_RENEWAL":
    case "CONTRACT_PENDING_SIGNATURE":
    case "CONTRACT_CORRECTION_REQUESTED":
      return listHrefOf({ page: 1, pageSize: 20, staffMemberName: "", status, storeIds, storesCleared: false, scope: null });
    case "AFFILIATION_REJECTED":
      // 직원 목록은 가입 상태를 묶음으로만 거른다 — 그 상태가 든 묶음(거절은 「초대」)
      return staffListHrefOf({
        ...DEFAULT_STAFF_LIST_QUERY,
        storeIds,
        joinGroups: JOIN_GROUPS.filter((g) => JOIN_GROUP_STATES[g].some((s) => status.includes(s))),
      });
    case "INQUIRY_ANSWERED": {
      const params = new URLSearchParams();
      for (const s of status) params.append("status", s);
      return bpPath(bpCodeId, `/support-inquiries?${params}`);
    }
    case "URGENT_TODO":
      return `/todos${toTodoListSearch({ ...DEFAULT_TODO_LIST_QUERY, storeIds, statuses: TODO_STATUSES.filter((s) => status.includes(s)), urgentOnly: true })}`;
  }
}

/** 처리 대기 한 줄 — 구분 · 항목 · 내용 · 이동 주소 */
export function pendingLineOf(item: HomePendingItem, bpCodeId: number) {
  const text = PENDING_TEXT[item.type];
  const days = item.waitingDays;
  const waited =
    item.type === "CONTRACT_RENEWAL" ? "새 근로계약서 초안 없음" : !text.since || days === null ? null : days === 0 ? `오늘 ${text.since}` : `${text.since} 후 ${days}일 경과`;
  return {
    kind: text.kind,
    title: `${text.title} ${item.count}건`,
    desc: [whoOf(item, text.kind), waited].filter(Boolean).join(" · "),
    href: pendingHrefOf(item, bpCodeId),
  };
}

/** 경고 밴드에 이름을 적는 대상 수 — 나머지는 「외 N명」 */
const BAND_NAMES = 3;

/** 경고 밴드 대상 줄 — 「서지안(서초점) 09-08, 서초점 09-10 외 2명」. 가려진 직원은 이름 없이 점포만 */
export function renewalNamesOf(renewals: readonly HomeRenewal[]): string {
  const shown = renewals
    .slice(0, BAND_NAMES)
    .map((r) => `${r.isMasked || r.name === null ? r.storeName : `${r.name}(${r.storeName})`} ${r.endDate.slice(5)}`)
    .join(", ");
  const rest = renewals.length - BAND_NAMES;
  return rest > 0 ? `${shown} 외 ${rest}명` : shown;
}
