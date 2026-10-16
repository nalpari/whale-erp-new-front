import Link from "next/link";
import { DataTable, type Column } from "@/components/common";
import { formatDateTime, formatPhone } from "@/lib/format";
import type { StoreSummary } from "@/lib/store-types";
import { CodeLabel } from "@/components/site/code-label";
import { formatBizNumber } from "@/lib/store-view";
import { StoreStatusBadge } from "./store-parts";

type Row = { no: number; store: StoreSummary };

const DASH = "-";

/** 점포 목록 표 보기(데모 stores/index 의 표). 점포명을 누르면 상세로 간다. 순번은 전체 건수에서 거꾸로 센다 — 맨 위(최신 등록)가 total, 가장 오래된 점포가 1 */
export function StoreTable({ items, total, page, pageSize, detailHref }: { items: StoreSummary[]; total: number; page: number; pageSize: number; detailHref: (id: number) => string }) {
  const columns: Column<Row>[] = [
    { header: "순번", width: "w-[60px]", cell: (r) => r.no.toLocaleString("ko-KR") },
    { header: "점포코드", width: "w-[110px]", cell: (r) => r.store.storeCode },
    {
      header: "점포명",
      align: "left",
      cell: (r) => (
        <Link href={detailHref(r.store.storeId)} className="text-erp-link hover:underline">
          {r.store.name}
        </Link>
      ),
    },
    { header: "점포유형", width: "w-[110px]", cell: (r) => <CodeLabel group="STORE_TYPE" value={r.store.storeTypeCode} /> },
    { header: "점포상태", width: "w-[98px]", cell: (r) => <StoreStatusBadge status={r.store.storeStatusCode} /> },
    {
      header: "사업자등록번호",
      width: "w-[150px]",
      cell: (r) => (r.store.bizRegistrationNumber ? formatBizNumber(r.store.bizRegistrationNumber) : <span className="text-erp-muted">미인증</span>),
    },
    { header: "연락처", width: "w-[150px]", cell: (r) => (r.store.phone ? formatPhone(r.store.phone) : DASH) },
    { header: "근무직원수", width: "w-[100px]", cell: (r) => r.store.staffCount.toLocaleString("ko-KR") },
    { header: "등록일", width: "w-[120px]", cell: (r) => formatDateTime(r.store.createdAt).slice(0, 10) || DASH },
  ];
  const rows = items.map((store, i) => ({ no: total - ((page - 1) * pageSize + i), store }));
  return <DataTable columns={columns} rows={rows} rowKey={(r) => String(r.store.storeId)} empty="조회된 점포가 없습니다." />;
}
