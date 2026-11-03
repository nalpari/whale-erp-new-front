"use client";

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { Button, DataTable, type Column } from "@/components/common";
import { FailedBand } from "@/components/site/side-parts";
import { getBpHolidayStoresAction, type HolidayStoresOnDate } from "./actions";
import { unknownResult } from "./holiday-parts";

// 목록의 대상점포 · 예외점포 칸 — 글자(「오퍼카페 외 2곳」 · 「3개」)를 누르면 그날 걸린 점포를 작은 팝업으로 보인다(2026-11-03 사용자 지정 —
// 목록 api 는 첫 점포 · 수만 주어 「어디 어디」를 알 수 없었다). 누를 때 상세를 받아 그 날짜 기준으로 고른다(반복 휴일은 날짜마다 점포가 다를 수 있다).

type Store = HolidayStoresOnDate["stores"][number];
const COLUMNS: Column<Store>[] = [
  { header: "점포명", align: "left", cell: (s) => <span className="block truncate">{s.name}</span> },
  { header: "점포코드", width: "w-[120px]", cell: (s) => s.storeCode },
];

export function HolidayStoresButton({ bpHolidayId, date, children }: { bpHolidayId: number; date: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<HolidayStoresOnDate | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleOpen = () => {
    setData(null);
    setFailure(null);
    setOpen(true);
    startLoading(async () => {
      const result = await getBpHolidayStoresAction(bpHolidayId, date).catch(unknownResult("점포 조회", false));
      if (!result.ok) return setFailure(result.message);
      setData(result);
    });
  };

  const kind = data ? (data.isAllStores ? "예외점포" : "대상점포") : "점포";
  return (
    <>
      <button type="button" onClick={handleOpen} className="block max-w-full truncate text-left text-erp-link hover:underline">
        {children}
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        // #ebebeb 팝업 테두리는 Figma 에 한 번만 나오는 색이라 토큰이 없다(DESIGN.md Popups)
        className="m-auto max-h-[calc(100dvh-48px)] w-[480px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[2px] border border-[#ebebeb] bg-white p-[23px] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40 open:flex"
      >
        <h2 id={titleId} className="shrink-0 text-[18px] font-semibold">
          {kind} <span className="text-[14px] font-normal text-erp-label">· {data ? `${data.name} (${date})` : date}</span>
        </h2>
        <div className="mt-[12px] flex min-h-0 flex-1 flex-col gap-[12px] text-[14px]" aria-busy={loading}>
          {failure && <FailedBand message={failure} />}
          {/* 열 이름 줄은 고정하고 점포 줄만 스크롤 — 변경이력 팝업과 같다 */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-y border-erp-thead-line [&_tbody_tr:last-child]:border-b-0 [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[1] [&_thead]:shadow-[0_1px_0_var(--color-erp-thead-line)] [&_thead_tr]:border-y-0">
            <DataTable columns={COLUMNS} rows={data?.stores ?? []} rowKey={(s) => s.storeId} empty={loading || (!data && !failure) ? "불러오는 중입니다." : "점포가 없습니다."} />
          </div>
        </div>
        <div className="mt-[24px] flex shrink-0 justify-end">
          <Button variant="off" onClick={() => setOpen(false)}>
            닫기
          </Button>
        </div>
      </dialog>
    </>
  );
}
