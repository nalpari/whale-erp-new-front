import Link from "next/link";
import type { ReactNode } from "react";
import { DataTable, Tag, type Column } from "@/components/common";
import { formatDateTime, formatPhone } from "@/lib/format";
import type { StoreSummary } from "@/lib/store-types";
import { CodeLabel } from "@/components/site/code-label";
import { formatBizNumber } from "@/lib/store-view";
import { StoreStatusBadge } from "./store-parts";

type Row = { no: number; store: StoreSummary };

const DASH = "-";

/** 점포 목록 표 보기(데모 stores/index 의 표). 점포명을 누르면 상세로 간다. 순번은 전체 건수에서 거꾸로 센다 — 맨 위(최신 등록)가 total, 가장 오래된 점포가 1 */
export function StoreTable({
  items,
  total,
  page,
  pageSize,
  detailHref,
  empty,
}: {
  items: StoreSummary[];
  total: number;
  page: number;
  pageSize: number;
  detailHref: (id: number) => string;
  /** 빈 목록 문구 — 점포가 아예 없는지 · 조건에 맞는 점포가 없는지는 목록 화면이 가른다 */
  empty: ReactNode;
}) {
  // 1260 창 기준 열 폭 — 내용이 정해진 열은 가장 긴 값(괄호)에 맞춘 고정 폭이고 점포명이 남는 폭을 갖는다(2026-11-18 사용자 지정 · 1260 작업)
  const columns: Column<Row>[] = [
    { header: "순번", width: "w-[60px]", cell: (r) => r.no.toLocaleString("ko-KR") },
    // ST900068(65px)
    { header: "점포코드", width: "w-[90px]", cell: (r) => r.store.storeCode },
    {
      // 남는 폭 — 표 최소 폭(아래 minWidth)이 160px 을 지킨다
      header: "점포명",
      // 기준 폭(160)을 둔다 — 넓은 창에서는 모든 열이 같은 비율로 늘어난다 — 이 열만 남는 폭을 가지면 넓은 창에서 혼자 넓어져 표가 휑했다(2026-11-18 사용자 지정)
      width: "w-[160px]",
      align: "left",
      cell: (r) => (
        <Link href={detailHref(r.store.storeId)} className="text-erp-link hover:underline">
          {r.store.name}
        </Link>
      ),
    },
    { header: "점포유형", width: "w-[90px]", cell: (r) => <Tag><CodeLabel group="STORE_TYPE" value={r.store.storeTypeCode} /></Tag> },
    { header: "점포상태", width: "w-[80px]", cell: (r) => <StoreStatusBadge status={r.store.storeStatusCode} /> },
    {
      // 열 이름 7자가 꺾이지 않는 폭
      header: "사업자등록번호",
      width: "w-[120px]",
      cell: (r) => (r.store.bizRegistrationNumber ? formatBizNumber(r.store.bizRegistrationNumber) : <span className="text-erp-muted">미인증</span>),
    },
    { header: "점포 연락처", width: "w-[120px]", cell: (r) => (r.store.phone ? formatPhone(r.store.phone) : DASH) },
    { header: "점포주소", width: "w-[130px]", align: "left", cell: (r) => r.store.region ?? DASH },
    { header: "재직직원", width: "w-[80px]", cell: (r) => r.store.staffCount.toLocaleString("ko-KR") },
    { header: "등록일", width: "w-[100px]", cell: (r) => formatDateTime(r.store.createdAt).slice(0, 10) || DASH },
  ];
  const rows = items.map((store, i) => ({ no: total - ((page - 1) * pageSize + i), store }));
  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => String(r.store.storeId)}
      empty={empty}
      fillEmpty
      // 1260 창에서 필터를 펼치면 표 자리(약 920px)보다 넓다 — 점포명 160px 을 지키고 표 상자 안에서만 가로로 민다(직원 목록과 같다).
      // 고정 열 합 870 + 점포명 160
      scroll
      minWidth="min-w-[1030px]"
    />
  );
}
