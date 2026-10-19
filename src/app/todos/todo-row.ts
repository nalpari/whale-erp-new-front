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
 * 가린 직원의 이름 자리. 직원 목록(staff-table)과 같은 글자다. api 는 본사 역할이 본사 제공 동의를 하지 않은 가맹 점포 직원을 볼 때
 * id · 이름을 비우고 isMasked 를 준다(운영 정책 ATT-30). 화면은 흐린 글자로 두고 링크를 걸지 않는다.
 */
export const MASKED_STAFF = "본사 제공 동의 없음";

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

/** 수행 예정. 오늘과 같은 해면 MM-DD, 아니면 YYYY-MM-DD. 시간이 있으면 뒤에 붙인다. today 는 kstToday() */
export function dueText(dueDate: string, dueTime: string | null, today: string): string {
  const date = dueDate.slice(0, 4) === today.slice(0, 4) ? dueDate.slice(5) : dueDate;
  return dueTime ? `${date} ${dueTime}` : date;
}

const STATUS_STYLE: Record<TodoStatus, Cell["style"]> = { PENDING: "badge-neutral", IN_PROGRESS: "badge-on", DONE: "muted" };

/** 상태 칸. 여러 행을 묶은 줄은 완료 건수(done/count)를, 한 명 수행을 완료했으면 수행자 이름을 붙인다 */
export function statusCells(item: Pick<TodoListItem, "status" | "todoCount" | "doneCount" | "performer">, labels: EnumValue[]): Cell[] {
  const label = labelOf(labels, item.status);
  const cells: Cell[] = [{ text: item.todoCount > 1 ? `${label} · ${item.doneCount}/${item.todoCount}` : label, style: STATUS_STYLE[item.status] }];
  if (item.status === "DONE" && item.performer) cells.push({ text: staffNameText(item.performer), style: "muted" });
  return cells;
}

/** 지우면 몇 건이 지워지고 몇 건이 남는가(T-2). 그룹은 대기인 행만 지운다. 그룹이 아니면 이 행 하나 */
export function deletePreview(detail: Pick<TodoDetail, "status" | "groupTodos">): { pending: number; remaining: number } {
  const rows = detail.groupTodos.length ? detail.groupTodos : [detail];
  const pending = rows.filter((r) => r.status === "PENDING").length;
  return { pending, remaining: rows.length - pending };
}

/** 삭제 뒤 토스트. 남은 행이 있으면 함께 알린다 */
export function deleteResultMessage({ deleted, remaining }: Schemas["TodoDeleteResponseDto"]): string {
  return remaining ? `대기 ${deleted}건을 삭제했습니다. 진행 중 · 완료 ${remaining}건은 남았습니다.` : "삭제되었습니다.";
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
