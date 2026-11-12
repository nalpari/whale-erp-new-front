import Link from "next/link";
import { Badge, DataTable, Tag, type Column } from "@/components/common";
import { formatDate } from "@/lib/format";
import type { FacilityListItem } from "@/lib/facilities";
import { rowNumber } from "../staff-members/staff-row";
import { FacilityStatusBadge } from "./facility-parts";
import { withBack } from "./facility-list-query";

type Row = { no: number; item: FacilityListItem };

// 목록 표(데모 stores/facilities.mjs) — 순번 · 운영상태 · 점포 · 그룹 · 분류 · 시설물/장비명 · 등록일. 등록일 최신순은 api 가 정한다.
// BP · 가맹 열은 없다 — BP 는 들어오기 전에 정해진다(PL-1). 폐점 점포의 것도 남고 점포 옆에 폐점 배지.
export function FacilityTable({
  items,
  total,
  page,
  pageSize,
  listHref,
  empty,
  at,
}: {
  items: FacilityListItem[];
  total: number;
  page: number;
  pageSize: number;
  /** 지금 목록 주소 — 상세 링크에 ?back= 으로 붙여 상세의 [목록]이 같은 조건으로 돌아오게 한다 */
  listHref: string;
  empty: string;
  /** 상세 링크에 탭 BP 를 붙인다(목록 화면의 screenPath) */
  at: (path: string) => string;
}) {
  const columns: Column<Row>[] = [
    { header: "순번", width: "w-[60px]", cell: (r) => r.no },
    { header: "운영상태", width: "w-[98px]", cell: (r) => <FacilityStatusBadge code={r.item.facilityStatusCode} label={r.item.facilityStatusLabel} /> },
    {
      header: "점포",
      width: "w-[220px]",
      align: "left",
      cell: ({ item }) => (
        <span className="inline-flex max-w-full items-center gap-[6px]">
          <span className="truncate">{item.storeName}</span>
          {item.isStoreClosed && <Badge tone="closed">폐점</Badge>}
        </span>
      ),
    },
    { header: "그룹", width: "w-[120px]", cell: (r) => <Tag>{r.item.facilityGroupLabel}</Tag> },
    { header: "분류", width: "w-[110px]", cell: (r) => r.item.facilityCategoryLabel },
    {
      header: "시설물/장비명",
      align: "left",
      cell: ({ item }) => (
        <Link href={at(withBack(`/facilities/${item.facilityId}`, listHref))} className="block truncate text-erp-link hover:underline">
          {item.name}
        </Link>
      ),
    },
    { header: "등록일", width: "w-[120px]", cell: (r) => formatDate(r.item.createdAt) },
  ];
  return (
    <DataTable
      columns={columns}
      // 순번은 다른 목록처럼 전체 건수에서 거꾸로
      rows={items.map((item, i) => ({ no: rowNumber(total, page, pageSize, i), item }))}
      rowKey={(r) => r.item.facilityId}
      empty={empty}
      fillEmpty
    />
  );
}
