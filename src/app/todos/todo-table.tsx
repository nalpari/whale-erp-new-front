import Link from "next/link";
import { Badge, DataTable, type Column } from "@/components/common";
import type { EnumValue } from "@/lib/enums";
import { CellView } from "../staff-members/staff-table";
import { assigneeText, dueText, statusCells, type TodoListItem } from "./todo-row";

type Row = { no: number; item: TodoListItem };

// 목록 표. 칸은 목업 TO-DO 탭(담당 · 근무지 · TO-DO · 수행 예정 · 상태)에 데모의 순번을 더했다. 순서는 api 그대로다
// (미완료 긴급 → 미완료 나머지 → 완료, 그 안은 수행 예정 일시 오름차순). 그룹은 한 줄이고 제목은 그 줄에 남은 행 가운데 첫 행의 상세로 간다.
export function TodoTable({
  items,
  page,
  pageSize,
  today,
  statusLabels,
  listSearch,
  filtered,
}: {
  items: TodoListItem[];
  page: number;
  pageSize: number;
  today: string;
  statusLabels: EnumValue[];
  /** 지금 목록 조건. 상세 링크에 붙여 상세의 「목록」이 같은 조건으로 돌아오게 한다 */
  listSearch: string;
  /** 거르는 조건이 있으면 빈 목록 문구를 「조건에 맞는」으로 바꾼다(hasTodoFilter) */
  filtered: boolean;
}) {
  const columns: Column<Row>[] = [
    { header: "순번", width: "w-[60px]", cell: (r) => r.no },
    {
      header: "담당",
      width: "w-[140px]",
      // 개인 배정의 첫 직원을 가렸으면 직원 목록처럼 흐린 글자(「본사 제공 동의 없음」)
      cell: (r) => <span className={r.item.assigneeType === "INDIVIDUAL" && r.item.assignees[0]?.isMasked ? "text-erp-muted" : undefined}>{assigneeText(r.item)}</span>,
    },
    { header: "근무지", width: "w-[160px]", cell: (r) => r.item.storeName ?? "-" },
    {
      header: "TO-DO",
      align: "left",
      cell: ({ item }) => (
        <span className="inline-flex max-w-full items-center gap-[6px]">
          <Link href={`/todos/${item.todoId}${listSearch}`} className="truncate text-erp-link hover:underline">
            {item.title}
          </Link>
          {item.isUrgent && <Badge tone="off">긴급</Badge>}
        </span>
      ),
    },
    { header: "수행 예정", width: "w-[140px]", cell: (r) => dueText(r.item.dueDate, r.item.dueTime, today) },
    {
      header: "상태",
      width: "w-[180px]",
      cell: (r) => (
        <span className="inline-flex flex-wrap items-center justify-center gap-[4px]">
          {statusCells(r.item, statusLabels).map((cell) => (
            <CellView key={cell.text} cell={cell} />
          ))}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={items.map((item, i) => ({ no: (page - 1) * pageSize + i + 1, item }))}
      rowKey={(r) => r.item.todoId}
      empty={filtered ? "조건에 맞는 TO-DO 가 없습니다." : "등록된 TO-DO 가 없습니다."}
    />
  );
}
