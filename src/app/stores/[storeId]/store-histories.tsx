"use client";

import { useRef, useState, useTransition } from "react";
import { Button, DataTable, Pagination, type Column } from "@/components/common";
import { formatDateTime } from "@/lib/format";
import { STORE_HISTORY_PAGE_SIZE, type StoreHistory, type StoreHistoryList } from "@/lib/store-types";
import { getStoreHistoriesAction } from "../actions";
import { NoticeBand } from "../store-parts";

const empty = (v: string | null) => (v ? v : <span className="text-erp-muted">-</span>);

const COLUMNS: Column<StoreHistory>[] = [
  { header: "변경 일시", width: "w-[180px]", cell: (h) => formatDateTime(h.changedAt) },
  { header: "변경자", width: "w-[140px]", cell: (h) => h.changedByName ?? <span className="text-erp-muted">시스템</span> },
  { header: "변경 항목", width: "w-[180px]", cell: (h) => h.field },
  { header: "변경 전", align: "left", cell: (h) => empty(h.beforeValue) },
  { header: "변경 후", align: "left", cell: (h) => empty(h.afterValue) },
];

/**
 * 변경 이력(데모 stores/detail) — 한 쪽 10건, 최신순. 첫 쪽은 서버가 상세와 함께 받아 오고, 쪽을 넘기면 여기서 받는다.
 * 표는 5줄 높이(머리 42 + 줄 46×5)로 두고 넘치면 표 안에서 스크롤, 머리글은 고정한다. 쪽 번호는 받았을 때만 바꾼다.
 * 상세를 다시 받아(상태 변경 · 수정 저장 뒤) 새 이력이 생기면 부모가 key(최신 이력 changeId)를 바꿔 첫 쪽부터 새로 그린다.
 */
export function StoreHistories({ storeId, initial }: { storeId: number; initial: StoreHistoryList | null }) {
  const [page, setPage] = useState(1);
  // 첫 쪽을 서버가 받지 못했으면(null) 빈 표와 함께 알리고, [다시 불러오기]로 다시 받는다(건수를 몰라 쪽 번호는 서지 않는다)
  const [data, setData] = useState<StoreHistoryList>(initial ?? { items: [], total: 0 });
  const [failure, setFailure] = useState<string | null>(initial ? null : "변경 이력을 불러오지 못했습니다.");
  const [loading, startLoading] = useTransition();
  // 쪽을 빨리 넘기면 늦게 온 앞 쪽 응답이 새 쪽을 덮지 않게 마지막 요청 번호만 받는다
  const requestNumber = useRef(0);

  const handlePageChange = (next: number) => {
    const mine = ++requestNumber.current;
    startLoading(async () => {
      const result = await getStoreHistoriesAction(storeId, next).catch((error: unknown) => {
        console.error("점포 이력 조회 호출 실패", error);
        return { ok: false as const, message: "이력을 받지 못했습니다. 잠시 후 다시 시도해 주세요." };
      });
      if (mine !== requestNumber.current) return;
      if (!result.ok) return setFailure(result.message);
      setFailure(null);
      setPage(next);
      setData(result);
    });
  };

  return (
    <div className="flex flex-col gap-[12px]">
      <h3 className="text-[18px] font-semibold text-erp-ink">
        변경 이력 <span className="text-[14px] font-medium text-erp-label">총 {data.total.toLocaleString("ko-KR")}건</span>
      </h3>
      {failure && (
        <div className="flex items-center gap-[12px]">
          <div className="min-w-0 flex-1">
            <NoticeBand title={failure} />
          </div>
          <Button variant="off" onClick={() => handlePageChange(page)} disabled={loading}>
            다시 불러오기
          </Button>
        </div>
      )}
      <div
        aria-busy={loading}
        className="max-h-[273px] overflow-y-auto border-y border-erp-thead-line [&_tbody_tr:last-child]:border-b-0 [&_thead]:sticky [&_thead]:top-0 [&_thead]:shadow-[0_1px_0_var(--color-erp-thead-line)] [&_thead_tr]:border-y-0"
      >
        <DataTable columns={COLUMNS} rows={data.items} rowKey={(h) => String(h.changeId)} empty="변경 이력이 없습니다." />
      </div>
      {data.total > STORE_HISTORY_PAGE_SIZE && (
        <Pagination page={page} totalPages={Math.ceil(data.total / STORE_HISTORY_PAGE_SIZE)} onPageChange={handlePageChange} />
      )}
    </div>
  );
}
