"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Button, DataTable, Pagination, type Column } from "@/components/common";
import { formatDateTime } from "@/lib/format";
import { HISTORY_PAGE_SIZE } from "@/lib/platform-admin-paging";
import { FailedBand } from "./admin-parts";

// 변경이력 팝업(S-BRSPGB). 상세의 [변경이력] 버튼으로 연다(2026-10-08). 최신순, 한 쪽 10건.
// 변경 전후 값 · 변경자 · 변경일시만 있고 사유와 비밀번호 값은 남기지 않는다.
// 확인창(ConfirmDialog)과 같은 네이티브 <dialog> 다 — 표가 넓어 이 창만 넓힌다.
// 미입력 값(변경 전후 값이 없을 때)은 빈 칸으로 둔다(대시 표시를 없앤 2026-10-20 디자인 수정 — 상세 표와 같다).
// 제목·칸 이름은 1팀 영역 모두(점포·BP·휴일 등) 같은 말을 쓴다(2026-10-20 디자인 수정).
// BP 관리자 상세도 같은 팝업을 쓴다 — 이력을 받는 서버 액션(load)만 다르다. 이력 줄 모양은 두 api 가 같다.

type History = { changeId: number; field: string; beforeValue: string | null; afterValue: string | null; changedAt: string; changedByName: string | null };
type HistoryList = { items: History[]; total: number };
type LoadResult = ({ ok: true } & HistoryList) | { ok: false; message: string };

const COLUMNS: Column<History>[] = [
  { header: "변경일시", width: "w-[140px]", cell: (h) => formatDateTime(h.changedAt) },
  { header: "변경자", width: "w-[80px]", cell: (h) => h.changedByName ?? <span className="text-erp-muted">시스템</span> },
  { header: "항목", width: "w-[120px]", align: "left", cell: (h) => h.field },
  { header: "변경 전", align: "left", cell: (h) => h.beforeValue },
  { header: "변경 후", align: "left", cell: (h) => h.afterValue },
];

/** [변경 이력] 버튼과 그 팝업. 열 때마다 첫 쪽을 새로 받는다 — 방금 고친 내용이 이력에 바로 보여야 한다. */
export function HistoryButton({
  adminId,
  panelOpen,
  load: loadPage,
}: {
  adminId: number;
  /** 감싼 상세 패널이 열려 있는가 — 닫히면 팝업도 닫는다 */
  panelOpen: boolean;
  /** 이력 한 쪽을 받는 서버 액션 */
  load: (id: number, page: number) => Promise<LoadResult>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  // 상세 패널이 클릭 아닌 길로 닫히면(브라우저 뒤로 · 앞으로 가기 등) 팝업도 닫는다 — <dialog> 는 최상위 레이어라 패널과 함께 밀려 나가지 않는다
  if (!panelOpen && open) setOpen(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<HistoryList | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();

  // 쪽을 빨리 넘기면 늦게 온 앞 쪽 응답이 새 쪽을 덮지 않게 마지막 요청 번호만 받는다
  const requestNumber = useRef(0);

  /** 쪽 번호는 받았을 때만 바꾼다 — 실패하면 쪽 번호와 표가 같은 쪽을 가리킨 채 띠만 선다. */
  const load = (next: number) => {
    const mine = ++requestNumber.current;
    startLoading(async () => {
      const result = await loadPage(adminId, next).catch((error: unknown) => {
        console.error("관리자 이력 조회 호출 실패", error);
        return { ok: false as const, message: "이력을 받지 못했습니다. 잠시 후 다시 시도해 주세요." };
      });
      if (mine !== requestNumber.current) return;
      if (!result.ok) return setFailure(result.message);
      setFailure(null);
      setPage(next);
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
          setOpen(true);
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
        // #ebebeb 팝업 테두리는 Figma 에 한 번만 나오는 색이라 토큰이 없다(DESIGN.md Popups).
        className="m-auto max-h-[calc(100dvh-48px)] w-[760px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-[2px] border border-[#ebebeb] bg-white p-[23px] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
      >
        <h2 id={titleId} className="text-[18px] font-semibold">
          변경이력
        </h2>
        <div className="mt-[12px] flex flex-col gap-[12px]" aria-busy={loading}>
          {failure && <FailedBand message={failure} />}
          <DataTable
            columns={COLUMNS}
            rows={data?.items ?? []}
            rowKey={(h) => h.changeId}
            empty={loading && !data ? "불러오는 중입니다." : "변경이력이 없습니다."}
          />
          {data && data.total > HISTORY_PAGE_SIZE && (
            <div className="pt-[6px]">
              <Pagination page={page} totalPages={Math.ceil(data.total / HISTORY_PAGE_SIZE)} onPageChange={load} />
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
