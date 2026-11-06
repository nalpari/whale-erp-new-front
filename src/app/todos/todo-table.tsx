import Link from "next/link";
import { Badge, DataTable, type Column } from "@/components/common";
import type { EnumValue } from "@/lib/enums";
import { CellView } from "../staff-members/staff-table";
import { withBack } from "./todo-list-query";
import { assigneeText, dueFullText, statusCells, type TodoListItem } from "./todo-row";

type Row = { no: number; item: TodoListItem };

// 목록 표. 칸은 목업 TO-DO 탭(담당 · 근무지 · TO-DO · 수행 예정 · 상태)에 데모의 순번을 더했다. 순서는 api 그대로다
// (미완료 긴급 → 미완료 나머지 → 완료, 그 안은 수행 예정 일시 오름차순). 그룹은 한 줄이고 제목은 그 줄에 남은 행 가운데 첫 행의 상세로 간다.
export function TodoTable({
  items,
  page,
  pageSize,
  statusLabels,
  listHref,
  empty,
  at = (path) => path,
}: {
  items: TodoListItem[];
  page: number;
  pageSize: number;
  statusLabels: EnumValue[];
  /** 지금 목록 주소. 상세 링크에 ?back= 으로 붙여 상세의 「목록」이 같은 조건으로 돌아오게 한다 */
  listHref: string;
  /** 빈 목록 문구 — TO-DO 가 아예 없는지 · 조건에 맞는 TO-DO 가 없는지는 목록 화면이 가른다(2026-11-04 사용자 지정) */
  empty: string;
  /** 상세 링크에 탭 BP 를 붙인다(목록 화면의 screenPath) — listHref 는 옛 경로 그대로다 */
  at?: (path: string) => string;
}) {
  const columns: Column<Row>[] = [
    { header: "순번", width: "w-[60px]", cell: (r) => r.no },
    {
      header: "담당직원", // 2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 「담당」
      width: "w-[240px]", // 근무지와 같은 폭(2026-11-06 사용자 지정 — 전엔 140px, 「본사에 정보제공 미동의」 · 「OOO 외 N명」이 잘렸다)
      // 개인 배정의 첫 직원을 가렸으면 직원 목록처럼 흐린 글자(글자는 MASKED_STAFF 「본사에 정보제공 미동의」)
      cell: (r) => <span className={r.item.assigneeType === "INDIVIDUAL" && r.item.assignees[0]?.isMasked ? "text-erp-muted" : undefined}>{assigneeText(r.item)}</span>,
    },
    { header: "근무지", width: "w-[240px]", cell: (r) => r.item.storeName ?? "-" },
    {
      header: "TO-DO",
      align: "left",
      cell: ({ item }) => (
        <span className="inline-flex max-w-full items-center gap-[6px]">
          <Link href={at(withBack(`/todos/${item.todoId}`, listHref))} className="truncate text-erp-link hover:underline">
            {item.title}
          </Link>
          {item.isUrgent && <Badge tone="off">긴급</Badge>}
        </span>
      ),
    },
    { header: "수행 예정", width: "w-[140px]", cell: (r) => dueFullText(r.item.dueDate, r.item.dueTime) },
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
      empty={empty}
      // 비었을 때 열 이름 줄은 두고 그 아래 빈 칸이 목록 영역 남는 높이를 채운다(직원 · 점포 목록과 같다, 2026-11-04 사용자 지정)
      fillEmpty
    />
  );
}
