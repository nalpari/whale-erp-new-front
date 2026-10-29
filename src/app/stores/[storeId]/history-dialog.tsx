"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Button, DataTable, NoticeBand, Pagination, type Column } from "@/components/common";
import { formatDateTime } from "@/lib/format";
import { STORE_HISTORY_PAGE_SIZE, type StoreHistory, type StoreHistoryList } from "@/lib/store-types";
import { getStoreHistoriesAction } from "../actions";

// 변경이력 버튼과 그 팝업(플랫폼 관리자 history-dialog.tsx 와 같은 생김새 — 확인창(ConfirmDialog)과 같은 네이티브
// <dialog> 다, 표가 넓어 이 창만 넓힌다). 등록 · 최종수정은 기본정보의 변경이력 행에 이미 보이므로 팝업에는
// 다시 적지 않고 표를 바로 둔다. 표는 5줄 높이로 두고 넘치면 표 안에서 스크롤, 머리글은 고정한다(store-histories.tsx
// 와 같다). 열 때마다 첫 쪽을 새로 받는다 — 방금 고친 내용이 이력에 바로 보여야 한다.
const empty = (v: string | null) => (v ? v : <span className="text-erp-muted">-</span>);

const COLUMNS: Column<StoreHistory>[] = [
  { header: "변경일시", width: "w-[140px]", cell: (h) => formatDateTime(h.changedAt) },
  { header: "변경자", width: "w-[70px]", cell: (h) => h.changedByName ?? <span className="text-erp-muted">시스템</span> },
  { header: "항목", width: "w-[140px]", align: "left", cell: (h) => h.field },
  { header: "변경 전", align: "left", cell: (h) => empty(h.beforeValue) },
  { header: "변경 후", align: "left", cell: (h) => empty(h.afterValue) },
];

export function HistoryButton({ storeId }: { storeId: number }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<StoreHistoryList | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  // 쪽을 빨리 넘기면 늦게 온 앞 쪽 응답이 새 쪽을 덮지 않게 마지막 요청 번호만 받는다
  const requestNumber = useRef(0);

  // 실패하면 옛 줄을 남기지 않는다 — 옛 줄과 오류 띠가 같이 보이면 어느 쪽이 맞는지 헷갈린다(2026-10-16 코드리뷰).
  // page 는 요청하는 즉시 바꾼다 — 성공할 때만 바꾸면 실패 뒤 [다시 불러오기]가 방금 실패한 쪽이 아니라
  // 그 앞에 보던 쪽을 다시 받는다(코드 리뷰로 찾음). 실패하는 동안은 data 가 비어 쪽 번호가 화면에 보이지 않는다.
  const load = (next: number) => {
    const mine = ++requestNumber.current;
    setFailure(null);
    setPage(next);
    startLoading(async () => {
      const result = await getStoreHistoriesAction(storeId, next).catch((error: unknown) => {
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

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const onClose = () => setOpen(false);

  return (
    <>
      <Button
        variant="soft"
        onClick={() => {
          // 지난 번 열었을 때의 줄 · 쪽 번호 · 오류가 새로 열 때까지 그대로 보이지 않게 비운다(2026-10-16 코드리뷰).
          setOpen(true);
          setData(null);
          setPage(1);
          load(1);
        }}
      >
        변경이력
      </Button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onCancel={(e) => {
          e.preventDefault();
          onClose();
        }}
        // #ebebeb 팝업 테두리는 Figma 에 한 번만 나오는 색이라 토큰이 없다(DESIGN.md Popups). 폭은 회원가입
        // 약관동의 팝업(terms-dialog.tsx)과 같은 860 으로 맞췄다(2026-10-16 점검).
        className="m-auto max-h-[calc(100dvh-48px)] w-[860px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-[2px] border border-[#ebebeb] bg-white p-[23px] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
      >
        <h2 id={titleId} className="text-[18px] font-semibold">
          변경이력
        </h2>
        <div className="mt-[12px] flex flex-col gap-[12px]" aria-busy={loading}>
          {failure && (
            <div className="flex items-center gap-[12px]">
              <div className="min-w-0 flex-1">
                <NoticeBand title={failure} />
              </div>
              <Button variant="off" onClick={() => load(page)} disabled={loading}>
                다시 불러오기
              </Button>
            </div>
          )}
          <div className="max-h-[273px] overflow-y-auto border-y border-erp-thead-line [&_thead]:sticky [&_thead]:top-0 [&_thead]:shadow-[0_1px_0_var(--color-erp-thead-line)] [&_thead_tr]:border-y-0 [&_tbody_tr:last-child]:border-b-0">
            <DataTable
              columns={COLUMNS}
              rows={data?.items ?? []}
              rowKey={(h) => String(h.changeId)}
              empty={loading && !data ? "불러오는 중입니다." : failure ? "이력을 불러오지 못했습니다." : "변경이력이 없습니다."}
            />
          </div>
          {data && data.total > STORE_HISTORY_PAGE_SIZE && (
            <div className="pt-[6px]">
              <Pagination page={page} totalPages={Math.ceil(data.total / STORE_HISTORY_PAGE_SIZE)} onPageChange={load} />
            </div>
          )}
        </div>
        <div className="mt-[24px] flex justify-end">
          <Button variant="off" onClick={onClose}>
            닫기
          </Button>
        </div>
      </dialog>
    </>
  );
}
