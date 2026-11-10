"use client";

import { useRef, useState, useTransition } from "react";
import { Button, DataTable, NoticeBand, Pagination, useAction, type Column } from "@/components/common";
import { HistoryScroll, HistoryTotalBar, WideDialog } from "@/components/site/wide-dialog";
import { formatDateTime } from "@/lib/format";
import { FIRST_HISTORY_PAGE_SIZE, type HistoryPageSize } from "@/lib/history-paging";
import type { StoreHistory, StoreHistoryList } from "@/lib/store-types";
import { getStoreHistoriesAction } from "../actions";

// 변경이력 버튼과 그 팝업(플랫폼 관리자 history-dialog.tsx 와 같은 생김새 — 확인창(ConfirmDialog)과 같은 네이티브
// <dialog> 다, 표가 넓어 확인창보다 넓힌다). 등록 · 최종수정은 기본정보의 변경이력 행에 이미 보이므로 팝업에는
// 다시 적지 않고 표를 바로 둔다. 열 때마다 첫 쪽을 새로 받는다 — 방금 고친 내용이 이력에 바로 보여야 한다.
// 폭 1000 · 총 건수 · 한 쪽 건수(20 · 50) · 제목과 [닫기] 고정 · 표 줄만 스크롤(머리 고정)은 1팀 변경이력 팝업 모두 같다
// (WideDialog, 2026-11-04 사용자 지정 — 전엔 표를 5줄 높이 273px 로 묶었다).
const empty = (v: string | null) => (v ? v : <span className="text-erp-muted">-</span>);

const COLUMNS: Column<StoreHistory>[] = [
  { header: "변경일시", width: "w-[140px]", cell: (h) => formatDateTime(h.changedAt) },
  { header: "변경자", width: "w-[140px]", cell: (h) => h.changedByName ?? <span className="text-erp-muted">시스템</span> },
  { header: "항목", width: "w-[120px]", align: "left", cell: (h) => h.field },
  { header: "변경 전", align: "left", cell: (h) => empty(h.beforeValue) },
  { header: "변경 후", align: "left", cell: (h) => empty(h.afterValue) },
];

/** variant — 표 안 버튼이 무거우면 outline(흰 바탕 · 브랜드 테두리)으로 둔다(점포 상세 변경이력 줄, 2026-11-03 사용자 지정) */
export function HistoryButton({ storeId, variant = "soft" }: { storeId: number; variant?: "soft" | "outline" }) {
  const getStoreHistories = useAction(getStoreHistoriesAction, { overlay: false });
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<HistoryPageSize>(FIRST_HISTORY_PAGE_SIZE);
  const [data, setData] = useState<StoreHistoryList | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  // 쪽을 빨리 넘기면 늦게 온 앞 쪽 응답이 새 쪽을 덮지 않게 마지막 요청 번호만 받는다
  const requestNumber = useRef(0);

  // 실패하면 옛 줄을 남기지 않는다 — 옛 줄과 오류 띠가 같이 보이면 어느 쪽이 맞는지 헷갈린다(2026-10-16 코드리뷰).
  // page 는 요청하는 즉시 바꾼다 — 성공할 때만 바꾸면 실패 뒤 [다시 불러오기]가 방금 실패한 쪽이 아니라
  // 그 앞에 보던 쪽을 다시 받는다(코드 리뷰로 찾음). 실패하는 동안은 data 가 비어 쪽 번호가 화면에 보이지 않는다.
  // 한 쪽 건수도 쪽 번호처럼 요청하는 즉시 바꾼다 — 실패 뒤 [다시 불러오기]가 고른 건수로 다시 받는다.
  const load = (next: number, size: HistoryPageSize = pageSize) => {
    const mine = ++requestNumber.current;
    setFailure(null);
    setPage(next);
    setPageSize(size);
    startLoading(async () => {
      const result = await getStoreHistories(storeId, next, size).catch((error: unknown) => {
        console.error("점포 이력 조회 호출 실패", error);
        return { ok: false as const, message: "이력을 받지 못했습니다. 잠시 후 다시 시도해 주세요." };
      });
      if (mine !== requestNumber.current) return;
      if (!result.ok) {
        setData(null);
        return setFailure(result.message);
      }
      setData(result);
    });
  };

  const onClose = () => setOpen(false);

  return (
    <>
      <Button
        variant={variant}
        onClick={() => {
          // 지난 번 열었을 때의 줄 · 쪽 번호 · 오류가 새로 열 때까지 그대로 보이지 않게 비운다(2026-10-16 코드리뷰).
          setOpen(true);
          setData(null);
          load(1, FIRST_HISTORY_PAGE_SIZE);
        }}
      >
        변경이력
      </Button>
      <WideDialog
        open={open}
        title="변경이력"
        // 총 건수 · 한 쪽 건수는 제목 줄 오른쪽 끝 — 제목 아래 빈 줄이 어색했다(2026-11-04 사용자 지정)
        titleAside={<HistoryTotalBar total={data?.total ?? null} pageSize={pageSize} disabled={loading} onPageSizeChange={(size) => load(1, size)} />}
        onClose={onClose}
        footer={
          <Button variant="off" onClick={onClose}>
            닫기
          </Button>
        }
      >
        <div className="flex min-h-0 flex-1 flex-col gap-[12px]" aria-busy={loading}>
          {failure && (
            <div className="flex shrink-0 items-center gap-[12px]">
              <div className="min-w-0 flex-1">
                <NoticeBand title={failure} />
              </div>
              <Button variant="off" onClick={() => load(page)} disabled={loading}>
                다시 불러오기
              </Button>
            </div>
          )}
          <HistoryScroll>
            <DataTable
              columns={COLUMNS}
              rows={data?.items ?? []}
              rowKey={(h) => String(h.changeId)}
              empty={loading && !data ? "불러오는 중입니다." : failure ? "이력을 불러오지 못했습니다." : "변경이력이 없습니다."}
            />
          </HistoryScroll>
          {/* 한 쪽뿐이어도 쪽 이동(1)을 보인다 — 목록 화면과 같다 */}
          {data && data.total > 0 && (
            <div className="shrink-0 pt-[6px]">
              <Pagination page={page} totalPages={Math.max(1, Math.ceil(data.total / pageSize))} onPageChange={(p) => load(p)} />
            </div>
          )}
        </div>
      </WideDialog>
    </>
  );
}
