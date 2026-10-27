"use client";

import { useRef, useState, useTransition } from "react";
import { Button, DataTable, DateField, Pagination, type Column } from "@/components/common";
import { FailedBand } from "@/components/site/side-parts";
import { BP_HOLIDAY_HISTORY_PAGE_SIZE, defaultHistoryRange } from "@/lib/bp-holiday-view";
import type { BpHolidayHistory, BpHolidayHistoryList } from "@/lib/bp-holidays";
import { formatDateTime } from "@/lib/format";
import { getBpHolidayHistoriesAction } from "./actions";
import { unknownResult, WideDialog } from "./holiday-parts";

// 변경 이력. 화면 위 [변경 이력 보기]는 이력이 생긴 날짜로 찾는 팝업이고 기본 기간은 이달 1일~오늘이다 — 지운 휴일은 여기서만 보인다(S-YAFRYZ).
// 상세의 [변경 이력]은 그 휴일의 이력(상세 응답에 함께 온다)만 같은 표로 보인다. 칸 이름은 1팀 영역의 다른 이력과 같다.
// 미입력 값(변경 전후 값이 없을 때)은 빈 칸으로 둔다(상세 표와 같다).

const COLUMNS: Column<BpHolidayHistory>[] = [
  { header: "변경일시", width: "w-[140px]", cell: (h) => formatDateTime(h.changedAt) },
  { header: "변경자", width: "w-[80px]", cell: (h) => h.changedByName ?? <span className="text-erp-muted">시스템</span> },
  { header: "항목", width: "w-[90px]", align: "left", cell: (h) => h.field },
  { header: "변경 전", align: "left", cell: (h) => h.beforeValue },
  { header: "변경 후", align: "left", cell: (h) => h.afterValue },
];

const WITH_HOLIDAY: Column<BpHolidayHistory>[] = [...COLUMNS.slice(0, 2), { header: "휴일명", width: "w-[120px]", align: "left", cell: (h) => h.holidayName }, ...COLUMNS.slice(2)];

/** 화면 위 [변경 이력 보기] — 기간으로 찾는다. 열 때마다 기본 기간 첫 쪽을 새로 받는다(방금 고친 내용이 바로 보여야 한다). */
export function HolidayHistoryButton({ today }: { today: string }) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState(() => defaultHistoryRange(today));
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BpHolidayHistoryList | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  // 쪽을 빨리 넘기면 늦게 온 앞 쪽 응답이 새 쪽을 덮지 않게 마지막 요청 번호만 받는다
  const requestNumber = useRef(0);

  /** 쪽 번호 · 기간은 받았을 때만 바꾼다 — 실패하면 표는 앞의 결과 그대로 두고 띠만 선다. */
  const load = (next: { from: string; to: string }, nextPage: number) => {
    const mine = ++requestNumber.current;
    startLoading(async () => {
      const result = await getBpHolidayHistoriesAction({ ...next, page: nextPage }).catch(unknownResult("변경 이력 조회", false));
      if (mine !== requestNumber.current) return;
      if (!result.ok) return setFailure(result.message);
      setFailure(null);
      setPage(nextPage);
      setData(result);
    });
  };

  return (
    <>
      <Button
        variant="soft"
        onClick={() => {
          const initial = defaultHistoryRange(today);
          setRange(initial);
          setData(null);
          setOpen(true);
          load(initial, 1);
        }}
      >
        변경 이력 보기
      </Button>
      <WideDialog
        open={open}
        title="변경 이력 보기"
        onClose={() => setOpen(false)}
        footer={
          <Button variant="off" onClick={() => setOpen(false)}>
            닫기
          </Button>
        }
      >
        <div className="flex items-center gap-[6px]">
          <div className="w-[150px]">
            <DateField aria-label="이력 시작일" value={range.from} onChange={(from) => setRange((r) => ({ ...r, from }))} />
          </div>
          <span className="text-erp-label">~</span>
          <div className="w-[150px]">
            <DateField aria-label="이력 종료일" value={range.to} onChange={(to) => setRange((r) => ({ ...r, to }))} />
          </div>
          <Button variant="soft" onClick={() => load(range, 1)} disabled={loading}>
            조회
          </Button>
        </div>
        <div className="flex flex-col gap-[12px]" aria-busy={loading}>
          {failure && <FailedBand message={failure} />}
          <DataTable columns={WITH_HOLIDAY} rows={data?.items ?? []} rowKey={(h) => h.changeId} empty={loading && !data ? "불러오는 중입니다." : "이력이 없습니다."} />
          {data && data.total > BP_HOLIDAY_HISTORY_PAGE_SIZE && (
            <div className="pt-[6px]">
              <Pagination page={page} totalPages={Math.ceil(data.total / BP_HOLIDAY_HISTORY_PAGE_SIZE)} onPageChange={(p) => load(range, p)} />
            </div>
          )}
        </div>
      </WideDialog>
    </>
  );
}

/** 상세의 [변경 이력] — 그 휴일의 이력(상세 응답의 histories). 패널이 닫히면 함께 닫는다. */
export function OwnHistoryButton({ histories, panelOpen }: { histories: BpHolidayHistory[]; /** 감싼 상세 패널이 열려 있는가 */ panelOpen: boolean }) {
  const [open, setOpen] = useState(false);
  // 상세 패널이 클릭 아닌 길로 닫히면(브라우저 뒤로 가기 등) 팝업도 닫는다 — <dialog> 는 최상위 레이어라 패널과 함께 밀려 나가지 않는다
  if (!panelOpen && open) setOpen(false);
  return (
    <>
      <Button variant="soft" onClick={() => setOpen(true)}>
        변경 이력
      </Button>
      <WideDialog
        open={open}
        title="변경 이력"
        onClose={() => setOpen(false)}
        footer={
          <Button variant="off" onClick={() => setOpen(false)}>
            닫기
          </Button>
        }
      >
        <DataTable columns={COLUMNS} rows={histories} rowKey={(h) => h.changeId} empty="이력이 없습니다." />
      </WideDialog>
    </>
  );
}
