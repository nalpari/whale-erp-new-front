import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, DataTable, type Column } from "@/components/common";
import type { StaffMemberListItem } from "@/lib/staff-members";
import { ResendInvitationButton } from "./resend-invitation-button";
import { withBack } from "./staff-list-query";
import { canResendInvitation, contractCell, EMPLOYMENT_TYPE_LABELS, formatPhone, joinCell, rowNumber, statusCells, type Cell } from "./staff-row";

// 데모 staff-parts.mjs 의 회색 배지(quiet). 공통 Badge 에는 on · off 두 가지뿐이다.
const NEUTRAL = "inline-block rounded-[2px] px-[4px] py-[2px] text-center text-[14px] font-medium bg-erp-subtle text-erp-ink whitespace-nowrap";
const DASH = "-";

export function CellView({ cell }: { cell: Cell }) {
  switch (cell.style) {
    case "badge-on":
      return <Badge tone="on">{cell.text}</Badge>;
    case "badge-off":
      return <Badge tone="off">{cell.text}</Badge>;
    case "badge-neutral":
      return <span className={NEUTRAL}>{cell.text}</span>;
    case "mark-on":
      return <span className="text-erp-on">{cell.text}</span>;
    case "mark-off":
      return <span className="text-erp-off">{cell.text}</span>;
    case "muted":
      return <span className="text-erp-muted">{cell.text}</span>;
  }
}

type Row = { no: number; item: StaffMemberListItem };
// 가린 행은 점포만 보이고 나머지는 「-」다. 각 칸이 같은 판단을 하지 않도록 여기서 한 번 가른다.
const personal = (render: (item: StaffMemberListItem) => ReactNode) => (r: Row) => (r.item.isMasked ? DASH : render(r.item));

export function StaffTable({
  items,
  total,
  page,
  pageSize,
  today,
  listHref,
  empty = "조회된 직원이 없습니다.",
}: {
  items: StaffMemberListItem[];
  total: number;
  page: number;
  pageSize: number;
  today: string;
  /** 지금 목록 주소(staffListHrefOf). 상세 링크에 ?back= 으로 실어 상세의 「목록」이 같은 조건으로 돌아오게 한다. */
  listHref: string;
  /** 빈 목록 문구 */
  empty?: string;
}) {
  const columns: Column<Row>[] = [
    { header: "순번", width: "w-[60px]", cell: (r) => r.no },
    {
      header: "직원",
      width: "w-[110px]",
      cell: ({ item }) =>
        item.isMasked ? (
          // 본사 역할에게 가린 가맹 점포 직원(STAFF-23 · ATT-30). 칸이 좁아 두 줄로 둔다 — 한 줄이면 말줄임으로 「가맹 점포 직원」이 잘린다
          <span className="block whitespace-normal leading-[17px] text-erp-muted">
            본사 제공 동의 없음 ·<br />
            가맹 점포 직원
          </span>
        ) : item.staffMemberId !== null && item.joinState === "JOINED" && item.employmentStatus === "EMPLOYED" ? (
          <Link href={withBack(`/staff-members/${item.staffMemberId}`, listHref)} className="text-erp-link hover:underline">
            {item.name}
          </Link>
        ) : (
          item.name
        ),
    },
    { header: "휴대전화번호", width: "w-[140px]", cell: personal((item) => (item.phone ? formatPhone(item.phone) : DASH)) },
    { header: "점포", cell: (r) => r.item.store.name },
    { header: "고용형태", width: "w-[110px]", cell: personal((item) => (item.employmentType ? EMPLOYMENT_TYPE_LABELS[item.employmentType] : DASH)) },
    {
      header: "가입·인증",
      // 데모는 210 — 재발송 버튼(WHALEERP-138)이 배지 옆에 서도록 넓혔다. 데모에는 목록 재발송 자리가 없다
      width: "w-[300px]",
      cell: personal((item) => (
        <span className="inline-flex items-center justify-center gap-[6px]">
          <CellView cell={joinCell(item, today)} />
          {item.contract && canResendInvitation(item) && <ResendInvitationButton contractId={item.contract.contractId} name={item.name} />}
        </span>
      )),
    },
    {
      header: "계약 상태",
      width: "w-[160px]",
      cell: personal((item) => {
        const cell = contractCell(item, today);
        return cell ? <CellView cell={cell} /> : DASH;
      }),
    },
    {
      header: "재직",
      // 데모는 110 인데 「재직 · 퇴직 예정 MM-DD」가 두 줄로 꺾이며 잘린다 — 한 줄에 들어가게 넓혔다(WHALEERP-585 화면 확인)
      width: "w-[180px]",
      cell: personal((item) => (
        <span className="inline-flex flex-wrap items-center justify-center gap-[4px]">
          {statusCells(item).map((cell) => (
            <CellView key={cell.text} cell={cell} />
          ))}
        </span>
      )),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={items.map((item, i) => ({ no: rowNumber(total, page, pageSize, i), item }))}
      // 가린 행은 api 가 staffMemberId 를 null 로 준다 — 순번으로 가른다(한 쪽 안에서 겹치지 않는다)
      rowKey={(r) => r.item.staffMemberId ?? `masked-${r.no}`}
      empty={empty}
    />
  );
}
