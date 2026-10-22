import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, DataTable, DetailTable, PageBar, type DetailRow } from "@/components/common";
import { getEnum } from "@/lib/api";
import { labelOf } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import { getTodo, type TodoDetail } from "@/lib/todos-api";
import { CellView } from "../../staff-members/staff-table";
import { backHrefOf, withBack } from "../todo-list-query";
import { StaffName, StaffNames } from "../staff-names";
import { historyActorText, historyText, staffNameText, statusCells } from "../todo-row";
import { TodoDetailActions, TodoStatusControl } from "./todo-detail-actions";

export const metadata: Metadata = {
  title: "TO-DO 상세 · Whale ERP",
};

type GroupRow = TodoDetail["groupTodos"][number];
type HistoryRow = TodoDetail["histories"][number] & { key: number };

// TO-DO 상세(#117). 목록 한 줄은 그 줄에 남은 행 가운데 첫 행이라, 이 화면은 그 행 하나를 보이고 그룹이면 직원별 상태를 함께 보인다 — 직원 이름을 누르면
// 그 직원의 행으로 가서 그 행의 상태를 바꾼다(T-1, 그룹이면 그 행만). 수정은 그룹 전체, 삭제는 그룹의 대기 행만이다(T-2).
// 없거나 · 지웠거나 · 업무 범위 밖이면 404 다.
export default async function TodoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [todo, statusLabels, assigneeTypeLabels, executionModeLabels] = await Promise.all([
    getTodo((await params).id),
    getEnum("TodoStatus"),
    getEnum("TodoAssigneeType"),
    getEnum("TodoExecutionMode"),
  ]);
  if (!todo) notFound();
  const listHref = backHrefOf((await searchParams).back);
  const status = statusCells({ ...todo, todoCount: 1, doneCount: 0 }, statusLabels);

  const rows: DetailRow[] = [
    { label: "제목", value: todo.title },
    { label: "내용", value: todo.body ?? "-", multiline: true },
    { label: "근무지", value: todo.storeName ?? "-" },
    {
      label: "배정 대상",
      value:
        todo.assigneeType === "ALL"
          ? `${labelOf(assigneeTypeLabels, todo.assigneeType)} · ${labelOf(executionModeLabels, todo.executionMode)}`
          : labelOf(assigneeTypeLabels, todo.assigneeType),
    },
    // 이 행의 배정 직원. 한 명 수행은 대상 전원, 퇴직으로 배정이 풀렸으면 비어 있다
    { label: "직원", value: <span><StaffNames staff={todo.assignees} /></span>, multiline: true },
    { label: "수행 예정 일시", value: todo.dueTime ? `${todo.dueDate} ${todo.dueTime}` : todo.dueDate },
    { label: "긴급", value: todo.isUrgent ? <Badge tone="off">긴급</Badge> : "아님" },
    {
      label: "상태",
      value: (
        <>
          {status.map((cell) => (
            <CellView key={cell.text} cell={cell} />
          ))}
          <TodoStatusControl key={todo.status} todoId={todo.todoId} status={todo.status} labels={statusLabels} />
        </>
      ),
    },
    ...(todo.completedAt ? [{ label: "완료 일시", value: formatDateTime(todo.completedAt) }] : []),
    { label: "등록", value: `${todo.createdByName ?? "-"} · ${formatDateTime(todo.createdAt)}` },
  ];

  return (
    <>
      <PageBar title="TO-DO 리스트 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <div className="flex items-center gap-[6px]">
            <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">TO-DO 상세</h2>
            <TodoDetailActions detail={todo} listHref={listHref} />
          </div>
          <DetailTable title="TO-DO" rows={rows} />

          {todo.groupTodos.length > 0 && (
            <section className="flex flex-col gap-[10px]">
              <h3 className="text-[15px] font-semibold text-erp-ink">직원별 상태</h3>
              <DataTable<GroupRow>
                columns={[
                  {
                    header: "직원",
                    // 가린 직원은 흐린 글자로만 둔다(직원 목록과 같다) — 그 행으로 가는 링크를 걸지 않는다
                    cell: (r) =>
                      r.isMasked ? (
                        <span className="text-erp-muted">{staffNameText(r)}</span>
                      ) : r.todoId === todo.todoId ? (
                        <b className="font-medium">{r.staffMemberName ?? "배정 풀림"}</b>
                      ) : (
                        <Link href={withBack(`/todos/${r.todoId}`, listHref)} className="text-erp-link hover:underline">
                          {r.staffMemberName ?? "배정 풀림"}
                        </Link>
                      ),
                  },
                  { header: "상태", width: "w-[160px]", cell: (r) => <CellView cell={statusCells({ ...r, todoCount: 1, doneCount: 0, performer: null }, statusLabels)[0]} /> },
                  { header: "완료 일시", width: "w-[180px]", cell: (r) => formatDateTime(r.completedAt) || "-" },
                ]}
                rows={todo.groupTodos}
                rowKey={(r) => r.todoId}
                rowState={(r) => (r.todoId === todo.todoId ? "selected" : undefined)}
              />
            </section>
          )}

          <section className="flex flex-col gap-[10px]">
            <h3 className="text-[15px] font-semibold text-erp-ink">상태 이력</h3>
            <DataTable<HistoryRow>
              columns={[
                { header: "일시", width: "w-[180px]", cell: (h) => formatDateTime(h.changedAt) },
                { header: "변경", align: "left", cell: (h) => historyText(h, statusLabels) },
                { header: "바꾼 사람", width: "w-[180px]", cell: (h) => <StaffName text={historyActorText(h)} masked={!h.changedByName && h.isStaffMemberMasked} /> },
              ]}
              rows={todo.histories.map((h, i) => ({ ...h, key: i }))}
              rowKey={(h) => h.key}
              empty="이력이 없습니다."
            />
          </section>
        </div>
      </div>
    </>
  );
}
