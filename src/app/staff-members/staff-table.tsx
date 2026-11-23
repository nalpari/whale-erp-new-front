import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, DataTable, Tag, type Column } from "@/components/common";
import { StoreNameWithType } from "@/components/site/store-type-tag";
import type { EnumValue } from "@/lib/enums";
import type { StaffMemberListItem } from "@/lib/staff-members";
import { WithIcon } from "../platform-admins/admin-table";
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
  contractStatuses,
  listHref,
  empty = "조건에 맞는 직원이 없습니다.",
  at = (path) => path,
}: {
  items: StaffMemberListItem[];
  total: number;
  page: number;
  pageSize: number;
  today: string;
  /** 계약 상태 이름(GET /enums/ContractStatus) */
  contractStatuses: EnumValue[];
  /** 지금 목록 주소(staffListHrefOf). 상세 링크에 ?back= 으로 실어 상세의 「목록」이 같은 조건으로 돌아오게 한다. */
  listHref: string;
  /** 빈 목록 문구 */
  empty?: string;
  /** 상세 링크에 탭 BP 를 붙인다(목록 화면의 screenPath) — listHref 는 옛 경로 그대로다 */
  at?: (path: string) => string;
}) {
  const columns: Column<Row>[] = [
    { header: "순번", width: "w-[60px]", cell: (r) => r.no },
    {
      header: "직원",
      // 「본사에 정보제공 미동의」(123px)가 한 줄에 들게 — 160 → 150(1260 작업, 2026-11-18 사용자 지정)
      width: "w-[150px]",
      cell: ({ item }) =>
        item.isMasked ? (
          // 본사 역할에게 가린 가맹 점포 직원(STAFF-23 · ATT-30) — 「본사에 정보제공 미동의」 한 줄. 가맹점포인 것은 옆 점포 열이 말해 「가맹 점포 직원」은 뺐다
          // (2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 「본사 제공 동의 없음 · 가맹 점포 직원」 두 줄)
          <span className="whitespace-nowrap text-erp-muted">본사에 정보제공 미동의</span>
        ) : item.staffMemberId !== null && (item.employmentStatus === "EMPLOYED" || item.employmentStatus === "RETIRED") ? (
          // 재직(가입 전 레코드 포함, WHALEERP-682)과 퇴직 직원은 상세로 간다 — 퇴직 직원도 상세에서 퇴직일 · 재직 이력을 본다(WHALEERP-763, 명세 S-VZVHSW · CTR-30)
          <Link href={at(withBack(`/staff-members/${item.staffMemberId}`, listHref))} className="text-erp-link hover:underline">
            {item.name}
          </Link>
        ) : (
          item.name
        ),
    },
    // 플랫폼 관리자 · BP 마스터 목록의 연락처처럼 휴대폰 아이콘을 붙인다. 열 이름은 직원이라 「휴대전화번호」 그대로, 가운데 정렬(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 글자만)
    { header: "휴대전화번호", width: "w-[145px]", cell: personal((item) => (item.phone ? <WithIcon icon="phone">{formatPhone(item.phone)}</WithIcon> : DASH)) },
    // 점포는 남는 폭 — 표 최소 폭(아래 minWidth)이 140px 을 지킨다. 길이가 제각각인 이름이라 왼쪽 정렬(점포 목록 점포명과 같다, 2026-11-18 사용자 지정)
    // 점포도 기준 폭(140)을 둔다 — 넓은 창에서는 모든 열이 같은 비율로 늘어난다 — 이 열만 남는 폭을 가지면 넓은 창에서 혼자 넓어져 표가 휑했다(2026-11-18 사용자 지정)
    // 점포 이름 앞에 본사 · 직영 · 가맹 꼬리표 — 근로계약 목록 · 상세와 같다(2026-11-19 사용자 지정). 꼬리표만큼 기준 폭을 170 으로 늘렸다
    { header: "점포", width: "w-[170px]", align: "left", cell: (r) => <StoreNameWithType storeId={r.item.store.storeId} name={r.item.store.name} isHq={r.item.store.isHq} /> },
    // 가장 긴 값 「파트타이머」 5자(59px)
    { header: "고용형태", width: "w-[80px]", cell: personal((item) => (item.employmentType ? EMPLOYMENT_TYPE_LABELS[item.employmentType] : DASH)) },
    {
      header: "가입 상태",
      // 데모는 210 — 재발송 버튼(WHALEERP-138)이 배지 옆에 서도록 넓혔다. 데모에는 목록 재발송 자리가 없다.
      // 가장 긴 「소속 승인 대기」 + [재발송] 175px 에 맞춰 300 → 200(1260 작업, 2026-11-18 사용자 지정)
      width: "w-[200px]",
      cell: personal((item) => (
        <span className="inline-flex items-center justify-center gap-[6px]">
          <CellView cell={joinCell(item, today)} />
          {item.contract && canResendInvitation(item) && <ResendInvitationButton contractId={item.contract.contractId} name={item.name} status={item.contract.status} lastSentAt={item.contract.lastSentAt} />}
        </span>
      )),
    },
    {
      header: "계약 상태",
      // 상태 이름이 길어져(「직원 서명 대기 · D-24」, WHALEERP-659) 160 이면 칸 끝이 잘린다 — 한 줄에 들게 넓혔다.
      // 재계약 꼬리표(「재계약」)가 배지 앞에 붙어 200 → 240(WHALEERP-672) → 200(1260 작업 — 꼬리표 + 「직원 서명 대기 · D-28」, 2026-11-18 사용자 지정)
      width: "w-[200px]",
      cell: personal((item) => {
        const cell = contractCell(item, today, contractStatuses);
        return cell ? (
          <span className="inline-flex items-center justify-center gap-[4px]">
            {cell.tag && <Tag>{cell.tag}</Tag>}
            <CellView cell={cell} />
          </span>
        ) : DASH;
      }),
    },
    {
      header: "재직 상태",
      // 데모는 110 인데 「재직 · 퇴직 예정 MM-DD」가 두 줄로 꺾이며 잘린다 — 한 줄에 들어가게 넓혔다(WHALEERP-585 화면 확인)
      // 「재직 · 퇴직 예정 MM-DD」 한 줄 — 180 → 160(1260 작업, 2026-11-18 사용자 지정)
      width: "w-[160px]",
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
      // 비었을 때 열 이름 줄은 두고 그 아래 빈 칸이 목록 영역 남는 높이를 채운다(점포 목록과 같다, 2026-11-04 사용자 지정)
      fillEmpty
      // 1260 창에서는 열 합이 표 자리(약 920px)보다 넓다 — 점포 칸 140px 을 지키고 표 상자 안에서만 가로로 민다(열 이름 줄 고정, 위 「총 N 건」 줄은
      // 그대로). BP 마스터 목록과 같은 방식(2026-11-18 사용자 지정 · 1260 작업). 고정 열 합 995 + 점포 140
      scroll
      minWidth="min-w-[1135px]"
    />
  );
}
