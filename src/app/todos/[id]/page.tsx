import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, DataTable, DetailTable, GuideIcon, GuideNote, PageBar, Tag, type DetailRow } from "@/components/common";
import { deniedMessageOf, getEnum, screenPath } from "@/lib/api";
import { labelOf } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import { getTodo, type TodoDetail } from "@/lib/todos-api";
import { CellView } from "../../staff-members/staff-table";
import { backHrefOf, withBack } from "../todo-list-query";
import { StaffNames } from "../staff-names";
import { overallOf, staffNameText, statusCells } from "../todo-row";
import { TodoDetailActions, TodoStatusControl } from "./todo-detail-actions";
import { TodoHistory } from "./todo-history";

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
  // 직원별 상태의 이름 링크 — 탭 BP 주소를 씌운다(/bp/{id}/todos/…)
  const at = await screenPath();
  // 한 명 수행을 끝낸 직원(목록 상태 칸의 둘째 칸과 같은 값)
  const performer = todo.status === "DONE" && todo.performer ? staffNameText(todo.performer) : null;

  // 배치(2026-11-09 사용자 지정, 3팀 확인 필요 — 전엔 「TO-DO」 표 하나에 상태 · 제목 · 내용 · 배정 · 등록이 섞여 흐름이 끊겼다):
  // 맨 위 제목 + 「수행예정 … | 긴급」, 왼쪽 「TO-DO」 표 → 직원별 상태, 오른쪽 상태 변경이력.
  // 제목은 맨 위 한 번만 — 공지사항 상세 머리 줄과 같은 모양
  // 근무지 전체 · 각자 수행은 직원마다 TO-DO 가 한 건씩이다 — 직원별 상태 표 한곳에서 줄마다 상태를 바꾼다(2026-11-09 사용자 지정, 3팀 확인 필요 — 전엔 이름 링크로 그 직원 TO-DO 로 옮겨 가 바꿨다)
  const isGroup = todo.groupTodos.length > 0;
  // 여러 명에게 나눈 TO-DO 면 오른쪽 이력은 지금 보는 직원 한 명의 것이다 — 이력 제목에 그 이름을 적는다(가렸으면 MASKED_STAFF, 퇴직으로 풀렸으면 「배정 풀림」)
  const mine = todo.groupTodos.find((r) => r.todoId === todo.todoId);
  const who = mine ? (mine.isMasked ? staffNameText(mine) : (mine.staffMemberName ?? "배정 풀림")) : undefined;
  // 묶음 전체의 완료 시각 — 모두 완료면 가장 늦은 완료 시각, 아니면 없음(ISO 문자열이라 글자 비교로 가장 늦은 것을 고른다)
  const completedAt = !isGroup
    ? todo.completedAt
    : todo.groupTodos.every((r) => r.status === "DONE")
      ? (todo.groupTodos.map((r) => r.completedAt).filter((v): v is string => Boolean(v)).sort().at(-1) ?? null)
      : null;
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
  const completedText = completedAt ? (
    <span>
      {formatDateTime(completedAt)}
      {performer && <span className="text-erp-label"> · {performer}</span>}
    </span>
  ) : null;
  const todoRows: DetailRow[] = [
    // 상태 줄은 선택칸 하나(지금 상태가 골라진 채) + [상태 변경] — 상태 배지를 따로 두지 않는다(2026-11-09 사용자 지정, 3팀 확인 필요 — 전엔 배지 · 선택칸에 같은 값이 두 번)
    // 수정 권한이 없으면 지금 상태 배지만
    // 완료 시각 — 「완료 일시 2026-11-09 12:41 · 이름」(한 명 수행을 끝낸 직원은 회색 이름). 여러 명에게 나눈 TO-DO 는 모든 직원이 완료해야 완료라(목록 상태와 같다)
    // 그때 마지막 완료 시각이다 — 한 명만 끝냈을 때 그 한 명의 시각을 두면 전체가 끝난 것처럼 읽혔다. 직원마다의 시각은 아래 「직원별 상태」 표에 있다
    // 개인 배정 · 한 명 수행은 따로 줄을 두지 않고 상태 줄의 [상태 변경] 오른쪽에 붙인다 — 상태와 완료 시각을 한눈에(2026-11-09 사용자 지정)
    ...(isGroup
      ? completedAt
        ? [{ label: "완료 일시", value: completedText }]
        : []
      : [
          {
            label: "상태",
            value: (
              <span className="flex min-w-0 flex-wrap items-center gap-x-[18px] gap-y-[6px]">
                <TodoStatusControl todoId={todo.todoId} status={todo.status} labels={statusLabels} fallback={<CellView cell={statusCells(todo, statusLabels)[0]} />} />
                {completedAt && (
                  <span className="text-erp-label">
                    완료 일시 <span className="text-erp-ink">{formatDateTime(completedAt)}</span>
                    {performer && <> · {performer}</>}
                  </span>
                )}
              </span>
            ),
          },
        ]),
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
  const overall = overallOf(todo);

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
                  상태 바꾸기는 아래 「TO-DO」 상자 · 직원별 상태에서 한다(2026-11-09 사용자 지정, 3팀 확인 필요) */}
              <div className="flex flex-wrap items-center gap-[10px] text-[14px] font-medium text-erp-label">
                <span className="flex items-center gap-[6px]">
                  수행예정 <Tag>{due}</Tag>
                </span>
                {/* TO-DO 전체 값 — 목록 한 줄과 같은 상태 배지 + 「완료 / 배정 직원」(여러 명에게 나눈 TO-DO 는 묶음 전체, 2026-11-09 사용자 지정) */}
                <span aria-hidden="true" className="h-[11px] w-px bg-[#d9d9d9]" />
                <span className="flex items-center gap-[6px]">
                  상태 <CellView cell={statusCells(overall, statusLabels)[0]} />
                  <span className="font-normal text-erp-ink tabular-nums">{overall.count}</span>
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
                // 「직원별 상태」 제목은 회색 제목 바 없이 표 위 글자 제목(15px 600)으로 두고 옆에 느낌표 안내 — 표는 기본 회색 열 이름 줄(2026-11-09 사용자 지정)
                <section className="flex min-w-0 flex-col gap-[10px]">
                  <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[6px]">
                    <h3 className="text-[15px] font-semibold text-erp-ink">직원별 상태</h3>
                    {/* 문의 상세 저장 옆 안내와 같은 공통 느낌표 안내 */}
                    <GuideNote inline>직원을 선택하면 직원의 상태 변경이력을 확인할 수 있습니다.</GuideNote>
                  </div>
                  <DataTable<GroupRow>
                    columns={[
                      // 직원 이름을 누르면 그 직원의 TO-DO 상세로 간다 — 오른쪽 「상태 변경이력」은 그 직원의 이력이다(api 가 행 하나의 이력만 준다,
                      // 2026-11-09 사용자 지정). 지금 보는 직원은 링크 없이 굵게, 가린 직원은 흐린 글자(링크 없음)
                      {
                        header: "직원",
                        cell: (r) =>
                          r.isMasked ? (
                            <span className="text-erp-muted">{staffNameText(r)}</span>
                          ) : r.todoId === todo.todoId ? (
                            <span className="font-semibold">{r.staffMemberName ?? "배정 풀림"}</span>
                          ) : (
                            <Link href={at(withBack(`/todos/${r.todoId}`, listHref))} className="text-erp-link hover:underline">
                              {r.staffMemberName ?? "배정 풀림"}
                            </Link>
                          ),
                      },
                      {
                        header: "상태",
                        // 직원 · 상태 · 완료 일시 세 열을 같은 폭으로(2026-11-09 사용자 지정)
                        cell: (r) => {
                          const now = <CellView cell={statusCells(r, statusLabels)[0]} />;
                          // 가린 직원 · 퇴직으로 배정이 풀린 줄도 관리자가 대신 바꾼다 — 막으면 그 줄을 끝낼 길이 없어 목록이 「2 / 3명」에 머문다(2026-11-09 사용자 지정)
                          return (
                            <span className="inline-flex justify-center">
                              <TodoStatusControl
                                todoId={r.todoId}
                                status={r.status}
                                labels={statusLabels}
                                name={r.isMasked ? staffNameText(r) : (r.staffMemberName ?? "배정 풀림")}
                                fallback={now}
                              />
                            </span>
                          );
                        },
                      },
                      { header: "완료 일시", cell: (r) => formatDateTime(r.completedAt) || "-" },
                    ]}
                    rows={todo.groupTodos}
                    rowKey={(r) => r.todoId}
                    // 지금 보는 직원(오른쪽 이력의 주인) 줄은 공통코드 그룹 목록과 같은 「고른 줄」 — 옅은 회색 바탕 + 왼쪽 회청 3px 선 + 굵은 이름(2026-11-09 사용자 지정)
                    rowState={(r) => (r.todoId === todo.todoId ? "current" : undefined)}
                  />
                </section>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-[24px]">
              {/* 「상태 변경이력」 — 왼쪽 상자들과 같은 회색 제목 줄, 10건씩 쪽 나눔(2026-11-09 사용자 지정, 3팀 확인 필요) */}
              <TodoHistory histories={todo.histories} statusLabels={statusLabels} who={who} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
