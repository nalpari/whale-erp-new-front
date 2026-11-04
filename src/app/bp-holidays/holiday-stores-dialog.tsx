"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { Button, DataTable, Tag, type Column } from "@/components/common";
import { FailedBand } from "@/components/site/side-parts";
import { getBpHolidayStoresAction, type HolidayStoresOnDate } from "./actions";
import { HistoryScroll, WideDialog } from "@/components/site/wide-dialog";
import { unknownResult } from "./holiday-parts";

// 목록의 대상점포 · 예외점포 칸 — 글자(「오퍼카페 외 2개」 · 「3개」)를 누르면 그날 걸린 점포를 작은 팝업으로 보인다(2026-11-03 사용자 지정 —
// 목록 api 는 첫 점포 · 수만 주어 「어디 어디」를 알 수 없었다). 누를 때 상세를 받아 그 날짜 기준으로 고른다(반복 휴일은 날짜마다 점포가 다를 수 있다).
// 목록의 수는 그날 이미 폐점한 점포를 빼고 세지만 상세에는 폐점 날짜가 없어, 팝업은 폐점한 점포도 보이고 「폐점」 꼬리표를 붙인다(코드 리뷰).

type Store = HolidayStoresOnDate["stores"][number];
const COLUMNS: Column<Store>[] = [
  {
    header: "점포명",
    align: "left",
    cell: (s) => (
      <span className="flex min-w-0 items-center gap-[6px]">
        <span className="truncate">{s.name}</span>
        {s.storeStatusCode === "CLOSED" && <Tag>폐점</Tag>}
      </span>
    ),
  },
  { header: "점포코드", width: "w-[120px]", cell: (s) => s.storeCode },
];

/** 칸 정렬은 열을 따른다 — 글자 길이만큼의 인라인 버튼이라 가운데 열(예외점포)에서는 가운데, 왼쪽 열(대상점포)에서는 왼쪽에 선다 */
export function HolidayStoresButton({ bpHolidayId, date, children }: { bpHolidayId: number; date: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<HolidayStoresOnDate | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  // 닫았다 다시 열면 늦게 온 앞 요청의 응답이 새 결과를 덮지 않게 마지막 요청 번호만 받는다(변경이력과 같다, 코드 리뷰)
  const requestNumber = useRef(0);

  const handleOpen = () => {
    setData(null);
    setFailure(null);
    setOpen(true);
    const mine = ++requestNumber.current;
    startLoading(async () => {
      const result = await getBpHolidayStoresAction(bpHolidayId, date).catch(unknownResult("점포 조회", false));
      if (mine !== requestNumber.current) return;
      if (!result.ok) return setFailure(result.message);
      setData(result);
    });
  };

  const kind = data ? (data.isAllStores ? "예외점포" : "대상점포") : "점포";
  return (
    <>
      <button type="button" onClick={handleOpen} className="inline-block max-w-full truncate align-middle text-erp-link hover:underline">
        {children}
      </button>
      <WideDialog
        open={open}
        width="narrow"
        title={
          <>
            {kind} <span className="text-[14px] font-normal text-erp-label">· {data ? `${data.name} (${date})` : date}</span>
          </>
        }
        onClose={() => setOpen(false)}
        footer={
          <Button variant="off" onClick={() => setOpen(false)}>
            닫기
          </Button>
        }
      >
        {failure && <FailedBand message={failure} />}
        <div className="flex min-h-0 flex-1 flex-col" aria-busy={loading}>
          <HistoryScroll>
            <DataTable columns={COLUMNS} rows={data?.stores ?? []} rowKey={(s) => s.storeId} empty={failure ? "점포 목록을 불러오지 못했습니다." : loading || !data ? "불러오는 중입니다." : "점포가 없습니다."} />
          </HistoryScroll>
        </div>
      </WideDialog>
    </>
  );
}
