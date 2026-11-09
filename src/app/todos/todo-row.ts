// TO-DO 목록 한 줄 · 상세의 표시 문구. 담당 · 수행 예정 모양은 목업 docs/mockup/staff/index.html TO-DO 탭을 따른다.
// 상태 한글은 getEnum("TodoStatus") 로 받은 목록을 넘겨받는다. 색은 직원 목록의 CellView 를 같이 쓴다 — 공통 Badge 가 파랑 · 빨강뿐이라
// 대기는 회색, 진행 중은 파랑, 완료는 흐린 글자(맨 뒤 묶음), 긴급은 빨강(목록 쪽에서 붙인다)으로 나눴다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "../../lib/api-types.generated.ts";
import { labelOf, type EnumValue } from "../../lib/enums.ts";
import type { Cell } from "../staff-members/staff-row.ts";

type Schemas = components["schemas"];
export type TodoListItem = Schemas["TodoListItemDto"];
export type TodoDetail = Schemas["TodoDetailDto"];
type TodoStatus = Schemas["TodoStatus"];

/**
 * 가린 직원의 이름 자리. 급여명세서 · 직원 목록과 같은 글자다(2026-11-05 사용자 지정 — 직원 목록도 한 줄이 되었다).
 * 여기는 「외 1명」 · 「(퇴직)」을 이어 붙여 짧은 글자를 쓴다. api 는 본사 역할이 본사 제공 동의를 하지 않은 가맹 점포 직원을 볼 때
 * id · 이름을 비우고 isMasked 를 준다(운영 정책 ATT-30). 화면은 흐린 글자로 두고 링크를 걸지 않는다.
 */
export const MASKED_STAFF = "본사에 정보제공 미동의";

/** 직원 이름 칸. 가렸으면 MASKED_STAFF, 이름이 없으면(퇴직으로 배정이 풀린 행 등) 「-」 */
export function staffNameText(s: { staffMemberName: string | null; isMasked: boolean }): string {
  return s.isMasked ? MASKED_STAFF : (s.staffMemberName ?? "-");
}

/** 담당 칸. 근무지 전체는 「전체 · 각자」 · 「전체 · 한 명」, 개인은 직원 이름(여러 명을 한 줄로 묶었으면 「누구 외 n명」) */
export function assigneeText(item: Pick<TodoListItem, "assigneeType" | "executionMode" | "assignees">): string {
  if (item.assigneeType === "ALL") return item.executionMode === "ANY_ONE" ? "전체 · 한 명" : "전체 · 각자";
  const [head, ...rest] = item.assignees;
  if (!head) return "-";
  return rest.length ? `${staffNameText(head)} 외 ${rest.length}명` : staffNameText(head);
}

/**
 * 목록 「담당직원」 칸 — 개인 배정은 앞에 「개인」을 붙여 「개인 · 서지안」, 여러 명이면 「개인 · 오세라 외 1명」.
 * 근무지 전체는 등록 화면 카드와 같은 말로 「전체 · 각자 수행」 · 「전체 · 한 명만 수행」(2026-11-09 사용자 지정, 3팀 확인 필요)
 */
export function targetText(item: Pick<TodoListItem, "assigneeType" | "executionMode" | "assignees">): string {
  if (item.assigneeType === "ALL") return item.executionMode === "ANY_ONE" ? "전체 · 한 명만 수행" : "전체 · 각자 수행";
  if (item.assignees.length > 1) return `개인 · ${staffNameText(item.assignees[0])} 외 ${item.assignees.length - 1}명`;
  // 퇴직으로 배정이 모두 풀린 개인 배정은 이름 자리를 「-」로(예전 담당 칸과 같다)
  return item.assignees[0] ? `개인 · ${staffNameText(item.assignees[0])}` : "개인 · -";
}

/** 목록의 수행 예정 — 늘 YYYY-MM-DD, 시간이 있으면 뒤에 붙인다(상세와 같다, 2026-11-06 사용자 지정 — 전엔 올해면 MM-DD) */
export function dueFullText(dueDate: string, dueTime: string | null): string {
  return dueTime ? `${dueDate} ${dueTime}` : dueDate;
}

/** 수행 예정(홈 TO-DO 카드). 오늘과 같은 해면 MM-DD, 아니면 YYYY-MM-DD. 시간이 있으면 뒤에 붙인다. today 는 kstToday() */
export function dueText(dueDate: string, dueTime: string | null, today: string): string {
  const date = dueDate.slice(0, 4) === today.slice(0, 4) ? dueDate.slice(5) : dueDate;
  return dueTime ? `${date} ${dueTime}` : date;
}

const STATUS_STYLE: Record<TodoStatus, Cell["style"]> = { PENDING: "badge-neutral", IN_PROGRESS: "badge-on", DONE: "muted" };

/**
 * 상태 칸 — 상태(대기 · 진행 중 · 완료) 하나만. 완료 인원은 옆 「완료 / 배정 직원」 칸(doneCountText)이 맡는다(2026-11-09 사용자 지정, 3팀 확인 필요 —
 * 전엔 「진행 중 · 1/3」 · 「완료 김민식」처럼 한 칸에 붙였다). 한 명 수행을 끝낸 직원 이름은 목록에 두지 않고 상세에서 본다
 */
export function statusCells(item: Pick<TodoListItem, "status">, labels: EnumValue[]): Cell[] {
  return [{ text: labelOf(labels, item.status), style: STATUS_STYLE[item.status] }];
}

/**
 * 「완료 / 배정 직원」 칸 — 완료한 행 수 / 배정 직원 수(2026-11-09 사용자 지정). 각자 수행 · 개인은 직원마다 행이라 행 수가 곧 배정 직원 수다.
 * 근무지 전체 · 한 명 수행은 행 하나에 대상 전원이 붙어, 배정 직원은 그 행의 직원 수로 센다(「1 / 5명」 — 행 수로 세면 「0 / 1명」으로 한 명에게만 배정한 것처럼 읽혔다)
 */
export function doneCountText(item: Pick<TodoListItem, "todoCount" | "doneCount" | "assigneeType" | "executionMode" | "assignees">): string {
  const assigned = item.assigneeType === "ALL" && item.executionMode === "ANY_ONE" && item.assignees.length ? item.assignees.length : item.todoCount;
  return `${item.doneCount} / ${assigned}명`;
}

/**
 * 상세 머리 줄의 TO-DO 전체 값 — 목록 한 줄과 같은 상태 · 완료 인원(2026-11-09 사용자 지정). 여러 명에게 나눈 TO-DO 는 묶음 전체로 센다 —
 * 모두 완료면 완료, 모두 대기면 대기, 그 밖은 진행 중(api 목록 groupStatus 와 같다)
 */
export function overallOf(detail: Pick<TodoDetail, "status" | "groupTodos" | "assigneeType" | "executionMode" | "assignees">): {
  status: TodoStatus;
  count: string;
} {
  const rows = detail.groupTodos.length ? detail.groupTodos : [detail];
  const status: TodoStatus = rows.every((r) => r.status === "DONE") ? "DONE" : rows.every((r) => r.status === "PENDING") ? "PENDING" : "IN_PROGRESS";
  const count = doneCountText({
    todoCount: rows.length,
    doneCount: rows.filter((r) => r.status === "DONE").length,
    assigneeType: detail.assigneeType,
    executionMode: detail.executionMode,
    assignees: detail.assignees,
  });
  return { status, count };
}

/** 지우면 몇 건이 지워지고 몇 건이 남는가(T-2). 그룹은 대기인 행만 지운다. 그룹이 아니면 이 행 하나 */
export function deletePreview(detail: Pick<TodoDetail, "status" | "groupTodos">): { pending: number; remaining: number } {
  const rows = detail.groupTodos.length ? detail.groupTodos : [detail];
  const pending = rows.filter((r) => r.status === "PENDING").length;
  return { pending, remaining: rows.length - pending };
}

/** 상태 이력 한 줄의 「변경」 칸 */
export function historyText(h: Schemas["TodoStatusHistoryDto"], labels: EnumValue[]): string {
  if (h.isUnassignedStaffMemberMasked) return `배정 풀림 · ${MASKED_STAFF}(퇴직)`;
  if (h.unassignedStaffMemberName) return `배정 풀림 · ${h.unassignedStaffMemberName}(퇴직)`;
  if (h.isUrgentChanged) return "긴급 표시 변경";
  if (h.fromStatus === null) return `등록 · ${labelOf(labels, h.toStatus)}`;
  return `${labelOf(labels, h.fromStatus)} → ${labelOf(labels, h.toStatus)}`;
}

/** 상태 이력의 「바꾼 사람」. 관리자가 바꿨으면 관리자, 직원이 바꿨으면 직원 이름(가렸으면 MASKED_STAFF). 퇴직 배정 풀림은 시스템이 남겨 「-」 */
export function historyActorText(h: Schemas["TodoStatusHistoryDto"]): string {
  if (h.changedByName) return h.changedByName;
  if (h.isStaffMemberMasked) return MASKED_STAFF;
  return h.staffMemberName ?? "-";
}
