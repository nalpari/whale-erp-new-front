import Link from "next/link";
import { Badge, DataTable, type Column } from "@/components/common";
import type { EnumValue } from "@/lib/enums";
import { CellView } from "../staff-members/staff-table";
import { withBack } from "./todo-list-query";
import { rowNumber } from "../staff-members/staff-row";
import { doneCountText, dueFullText, statusCells, targetText, type TodoListItem } from "./todo-row";

type Row = { no: number; item: TodoListItem };

// 목록 표. 칸은 목업 TO-DO 탭(담당 · 근무지 · TO-DO · 수행예정 · 상태)에 데모의 순번을 더했다. 순서는 api 그대로다
// (미완료 긴급 → 미완료 나머지 → 완료, 그 안은 수행예정 일시 오름차순). 그룹은 한 줄이고 제목은 그 줄에 남은 행 가운데 첫 행의 상세로 간다.
export function TodoTable({
  items,
  total,
  page,
  pageSize,
  statusLabels,
  listHref,
  empty,
  at = (path) => path,
}: {
  items: TodoListItem[];
  /** 전체 건수 — 순번을 다른 목록처럼 큰 수부터 매긴다 */
  total: number;
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
    // 열 순서: 순번 · 근무지 · TO-DO · 수행예정 · 담당직원 · 상태 · 완료 / 배정 직원(2026-11-09 사용자 지정, 3팀 확인 필요 — 전엔 담당직원 · 근무지 · TO-DO · 수행예정 · 상태)
    { header: "근무지", width: "w-[300px]", align: "left", cell: (r) => r.item.storeName ?? "-" },
    {
      header: "TO-DO",
      align: "left",
      cell: ({ item }) => (
        <span className="inline-flex max-w-full items-center gap-[6px]">
          <Link href={at(withBack(`/todos/${item.todoId}`, listHref))} className="truncate text-erp-link hover:underline">
            {item.title}
          </Link>
          {/* 목록은 아이콘 없이 「긴급」 글자 배지만 — 줄마다 아이콘이 붙으니 어색했다(2026-11-09 사용자 지정). 상세는 아이콘 + 「긴급」 */}
          {item.isUrgent && <Badge tone="off">긴급</Badge>}
        </span>
      ),
    },
    { header: "수행예정", width: "w-[180px]", align: "left", cell: (r) => dueFullText(r.item.dueDate, r.item.dueTime) },
    // 「담당직원」 — 「개인 · 서지안」 · 「개인 · 오세라 외 1명」 · 「전체 · 각자 수행」 · 「전체 · 한 명만 수행」(2026-11-09 사용자 지정, 3팀 확인 필요 — 전엔 「OOO 외 N명」).
    // 개인 배정의 첫 직원(이름을 보이는 직원)을 가렸으면 직원 목록처럼 흐린 글자
    {
      header: "담당직원",
      width: "w-[200px]",
      align: "left",
      cell: (r) => <span className={r.item.assigneeType === "INDIVIDUAL" && r.item.assignees[0]?.isMasked ? "text-erp-muted" : undefined}>{targetText(r.item)}</span>,
    },
    // 상태는 배지 하나, 옆 칸에 완료 인원 숫자(2026-11-09 사용자 지정, 3팀 확인 필요)
    { header: "상태", width: "w-[120px]", cell: (r) => <CellView cell={statusCells(r.item, statusLabels)[0]} /> },
    { header: "완료 / 배정 직원", width: "w-[130px]", cell: (r) => <span className="tabular-nums">{doneCountText(r.item)}</span> },
  ];

  return (
    <DataTable
      columns={columns}
      // 순번은 다른 목록(직원 · 근로계약 · 급여명세서 · 점포)처럼 전체 건수에서 거꾸로 — 3 · 2 · 1(2026-11-09 사용자 지정)
      rows={items.map((item, i) => ({ no: rowNumber(total, page, pageSize, i), item }))}
      rowKey={(r) => r.item.todoId}
      empty={empty}
      // 비었을 때 열 이름 줄은 두고 그 아래 빈 칸이 목록 영역 남는 높이를 채운다(직원 · 점포 목록과 같다, 2026-11-04 사용자 지정)
      fillEmpty
    />
  );
}
