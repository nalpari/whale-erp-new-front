import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, DataTable, DetailTable, GuideIcon, PageBar, Tag, type DetailRow } from "@/components/common";
import { deniedMessageOf, getEnum } from "@/lib/api";
import { labelOf } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import { getTodo, type TodoDetail } from "@/lib/todos-api";
import { CellView } from "../../staff-members/staff-table";
import { backHrefOf } from "../todo-list-query";
import { StaffNames } from "../staff-names";
import { staffNameText, statusCells } from "../todo-row";
import { TodoDetailActions, TodoStatusControl } from "./todo-detail-actions";
import { TitledBox, TodoHistory } from "./todo-history";

export const metadata: Metadata = {
  title: "TO-DO 상세 · Whale ERP",
};

type GroupRow = TodoDetail["groupTodos"][number];

// TO-DO 상세(#117). 목록 한 줄은 그 줄에 남은 행 가운데 첫 행이라, 이 화면은 그 행 하나를 보이고 그룹이면 직원별 상태를 함께 보인다 — 직원별 상태 표의
// 줄마다 그 행의 상태를 바꾼다(T-1, 그룹이면 그 행만). 수정은 그룹 전체, 삭제는 그룹의 대기 행만이다(T-2).
// 없거나 · 지웠거나 · 업무 범위 밖이면 404 다.
export default async function TodoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [todo, statusLabels, assigneeTypeLabels, executionModeLabels] = await Promise.all([
    // api 의 거절(BP 를 고르지 않은 플랫폼 계정 400 · 다른 BP 403 — deniedMessageOf)은 오류 화면이 아니라 그 문장으로 보인다. 404(없는 · 지운 · 업무 범위 밖 TO-DO)는 getTodo 가 null 로 바꿔 notFound 다(근로계약 상세와 같다)
    getTodo((await params).id).catch((e: unknown) => {
      const notice = deniedMessageOf(e);
      if (notice === null) throw e;
      return { notice };
    }),
    getEnum("TodoStatus"),
    getEnum("TodoAssigneeType"),
    getEnum("TodoExecutionMode"),
  ]);
  if (!todo) notFound();
  if ("notice" in todo)
    return (
      <>
        <PageBar title="TO-DO 리스트 관리" />
        <p role="alert" className="p-[24px] text-[14px] text-erp-label">
          {todo.notice}
        </p>
      </>
    );
  const listHref = backHrefOf((await searchParams).back);
  // 한 명 수행을 끝낸 직원(목록 상태 칸의 둘째 칸과 같은 값)
  const performer = todo.status === "DONE" && todo.performer ? staffNameText(todo.performer) : null;

  // 배치(2026-11-09 사용자 지정, 3팀 확인 필요 — 전엔 「TO-DO」 표 하나에 상태 · 제목 · 내용 · 배정 · 등록이 섞여 흐름이 끊겼다):
  // 맨 위 제목 + 「수행예정 … | 긴급」, 왼쪽 「TO-DO」 표 → 직원별 상태, 오른쪽 상태 변경이력.
  // 제목은 맨 위 한 번만 — 공지사항 상세 머리 줄과 같은 모양
  // 근무지 전체 · 각자 수행은 직원마다 TO-DO 가 한 건씩이다 — 직원별 상태 표 한곳에서 줄마다 상태를 바꾼다(2026-11-09 사용자 지정, 3팀 확인 필요 — 전엔 이름 링크로 그 직원 TO-DO 로 옮겨 가 바꿨다)
  const isGroup = todo.groupTodos.length > 0;
  const assignRows: DetailRow[] = [
    { label: "근무지", value: todo.storeName ?? "-" },
    {
      label: "배정대상",
      value:
        todo.assigneeType === "ALL"
          ? `${labelOf(assigneeTypeLabels, todo.assigneeType)} · ${labelOf(executionModeLabels, todo.executionMode)}`
          : labelOf(assigneeTypeLabels, todo.assigneeType),
    },
    // 이 행의 배정 직원. 한 명 수행은 대상 전원, 퇴직으로 배정이 풀렸으면 비어 있다
    ...(isGroup ? [] : [{ label: "직원", value: <span><StaffNames staff={todo.assignees} /></span>, multiline: true }]),
  ];
  // 「TO-DO」 상자 — 상태(관리자가 직원 대신 바꾼다, T-1 · 그룹이면 이 행만) · 완료 일시 · 내용
  const todoRows: DetailRow[] = [
    // 상태 줄은 선택칸 하나(지금 상태가 골라진 채) + [상태 변경] — 상태 배지를 따로 두지 않는다(2026-11-09 사용자 지정, 3팀 확인 필요 — 전엔 배지 · 선택칸에 같은 값이 두 번)
    // 수정 권한이 없으면 지금 상태 배지만
    ...(isGroup
      ? []
      : [
          {
            label: "상태",
            value: <TodoStatusControl todoId={todo.todoId} status={todo.status} labels={statusLabels} fallback={<CellView cell={statusCells(todo, statusLabels)[0]} />} />,
          },
        ]),
    // 완료면 완료 일시, 한 명 수행을 끝낸 직원은 그 뒤 회색 이름(목록 상태 칸과 같은 값)
    ...(todo.completedAt
      ? [
          {
            label: "완료 일시",
            value: (
              <span>
                {formatDateTime(todo.completedAt)}
                {performer && <span className="text-erp-label"> · {performer}</span>}
              </span>
            ),
          },
        ]
      : []),
    { label: "내용", value: todo.body || "-", multiline: true },
  ];
  // 등록은 다른 화면처럼 「시각 · 사람」(사람은 회색). 최종수정 줄은 api 가 고친 사람을 주지 않아 일단 뺐다 — 「최종수정자」가 생기면 넣는다(2026-11-09 사용자 지정).
  const editRows: DetailRow[] = [
    {
      label: "등록",
      value: (
        <span>
          {formatDateTime(todo.createdAt)}
          {todo.createdByName && <span className="text-erp-label"> · {todo.createdByName}</span>}
        </span>
      ),
    },
  ];
  const due = todo.dueTime ? `${todo.dueDate} ${todo.dueTime}` : todo.dueDate;

  return (
    <>
      <PageBar title="TO-DO 리스트 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <div className="flex items-start gap-[18px]">
            <div className="flex min-w-0 flex-1 flex-col gap-[8px] py-[6px]">
              {/* 제목 20px 600 — 자르지 않고 줄을 바꾼다. 긴급은 아래 줄 수행예정 뒤(2026-11-09 사용자 지정, 3팀 확인 필요) */}
              <h2 className="min-w-0 text-[20px] font-semibold break-all text-erp-ink">{todo.title}</h2>
              {/* 「수행예정 [꼬리표] | [긴급]」 — 공지사항 상세 「구분 | 게시일」과 같은 모양(이름 회색 14px 500, 사이 #d9d9d9 세로선).
                  상태는 여기 두지 않는다 — 아래 「TO-DO」 상자에서 보고 바로 바꾼다(2026-11-09 사용자 지정, 3팀 확인 필요 — 떨어져 있어 어색했다) */}
              <div className="flex flex-wrap items-center gap-[10px] text-[14px] font-medium text-erp-label">
                <span className="flex items-center gap-[6px]">
                  수행예정 <Tag>{due}</Tag>
                </span>
                {todo.isUrgent && (
                  <>
                    {/* 긴급 앞에 세로선 — 공지사항 상세 머리 줄과 같은 구분(2026-11-09 사용자 지정) */}
                    <span aria-hidden="true" className="h-[11px] w-px bg-[#d9d9d9]" />
                    <Badge tone="off">
                      <span className="inline-flex items-center gap-[4px]">
                        <GuideIcon risk />
                        긴급
                      </span>
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-[6px]">
              <TodoDetailActions detail={todo} listHref={listHref} />
            </div>
          </div>

          <div className="grid grid-cols-[7fr_5fr] items-start gap-[24px]">
            <div className="flex min-w-0 flex-col gap-[24px]">
              {/* 「TO-DO」 한 상자에 상태 · 완료 일시 · 내용 · 근무지 · 배정대상 · 직원 · 등록 — 「내용」 · 「상태 변경」 · 「배정」 · 「등록 · 수정」 상자를 합쳤다(2026-11-09 사용자 지정, 3팀 확인 필요) */}
              <DetailTable title="TO-DO" rows={[...todoRows, ...assignRows, ...editRows]} />
              {isGroup && (
                <TitledBox title="직원별 상태">
                  <DataTable<GroupRow>
                    headVariant="plain"
                    columns={[
                      // 직원 이름은 글자로만 — 그 직원 TO-DO 로 옮겨 가지 않고 이 표에서 바로 바꾼다. 가린 직원은 흐린 글자
                      { header: "직원", cell: (r) => (r.isMasked ? <span className="text-erp-muted">{staffNameText(r)}</span> : (r.staffMemberName ?? "배정 풀림")) },
                      {
                        header: "상태",
                        // 직원 · 상태 · 완료 일시 세 열을 같은 폭으로(2026-11-09 사용자 지정)
                        cell: (r) => {
                          const now = <CellView cell={statusCells(r, statusLabels)[0]} />;
                          // 가린 직원 · 배정 풀린 줄은 바꾸지 않고 지금 상태만
                          return r.isMasked || !r.staffMemberName ? (
                            now
                          ) : (
                            <span className="inline-flex justify-center">
                              <TodoStatusControl todoId={r.todoId} status={r.status} labels={statusLabels} name={r.staffMemberName} fallback={now} />
                            </span>
                          );
                        },
                      },
                      { header: "완료 일시", cell: (r) => formatDateTime(r.completedAt) || "-" },
                    ]}
                    rows={todo.groupTodos}
                    rowKey={(r) => r.todoId}
                  />
                </TitledBox>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-[24px]">
              {/* 「상태 변경이력」 — 왼쪽 상자들과 같은 회색 제목 줄, 10건씩 쪽 나눔(2026-11-09 사용자 지정, 3팀 확인 필요) */}
              <TodoHistory histories={todo.histories} statusLabels={statusLabels} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
