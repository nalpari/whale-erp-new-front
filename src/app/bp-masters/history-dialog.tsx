"use client";

import { useRef, useState, useTransition } from "react";
import { Button, DataTable, Pagination, useAction, type Column } from "@/components/common";
import { HistoryScroll, HistoryTotalBar, WideDialog } from "@/components/site/wide-dialog";
import type { BpMasterHistory, BpMasterHistoryList } from "@/lib/bp-masters";
import { formatDateTime } from "@/lib/format";
import { FIRST_HISTORY_PAGE_SIZE, type HistoryPageSize } from "@/lib/history-paging";
import { FailedBand } from "../platform-admins/admin-parts";
import { getBpMasterHistoriesAction } from "./actions";

// 변경 이력 팝업(S-GZDODB · BP-6). 상세 하단 [변경이력]으로 열고, BP 정보와 BP 마스터 계정 이력을 한 표로 최신순 보인다.
// 사유는 받지 않는다 — 비고(note)는 사업자 번호 인증 줄에 붙는다. 비밀번호 초기화도 계정 이력 한 줄(비밀번호 → 초기화)로 보인다.
// 탈퇴 BP 는 이 팝업을 열지 않는다(api 409, WHALEERP-625) — 탈퇴 사유는 withdrawal-dialog.tsx 가 보인다.
// 폭 1000 · 총 건수 · 한 쪽 건수(20 · 50) · 제목과 [닫기] 고정 · 표 줄만 스크롤은 1팀 변경이력 팝업 모두 같다(WideDialog, 2026-11-04 사용자 지정).

const COLUMNS: Column<BpMasterHistory>[] = [
  { header: "변경일시", width: "w-[140px]", cell: (h) => formatDateTime(h.changedAt) },
  { header: "변경자", width: "w-[140px]", cell: (h) => h.changedByName ?? <span className="text-erp-muted">시스템</span> },
  { header: "항목", width: "w-[120px]", align: "left", cell: (h) => h.field },
  { header: "변경 전", align: "left", cell: (h) => h.beforeValue },
  {
    header: "변경 후",
    align: "left",
    cell: (h) => (
      <>
        {h.afterValue}
        {/* 비고 — 사업자 번호 인증으로 바뀐 줄의 「사업자 번호 인증」 */}
        {h.note && <span className="text-erp-label"> · {h.note}</span>}
      </>
    ),
  },
];

/** [변경이력] 버튼과 그 팝업. 열 때마다 첫 쪽을 새로 받는다 — 방금 고친 내용이 이력에 바로 보여야 한다. */
export function HistoryButton({ bpCodeId, panelOpen }: { bpCodeId: number; /** 감싼 상세 패널이 열려 있는가 — 닫히면 팝업도 닫는다 */ panelOpen: boolean }) {
  const [open, setOpen] = useState(false);
  // 상세 패널이 클릭 아닌 길로 닫히면(브라우저 뒤로 · 앞으로 가기 등) 팝업도 닫는다 — <dialog> 는 최상위 레이어라 패널과 함께 밀려 나가지 않는다
  if (!panelOpen && open) setOpen(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<HistoryPageSize>(FIRST_HISTORY_PAGE_SIZE);
  const [data, setData] = useState<BpMasterHistoryList | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const getBpMasterHistories = useAction(getBpMasterHistoriesAction, { overlay: false });

  // 쪽을 빨리 넘기면 늦게 온 앞 쪽 응답이 새 쪽을 덮지 않게 마지막 요청 번호만 받는다
  const requestNumber = useRef(0);

  /** 쪽 번호 · 건수는 받았을 때만 바꾼다 — 실패하면 쪽 번호와 표가 같은 쪽을 가리킨 채 띠만 선다. */
  const load = (next: number, size: HistoryPageSize = pageSize) => {
    const mine = ++requestNumber.current;
    startLoading(async () => {
      const result = await getBpMasterHistories(bpCodeId, next, size).catch((error: unknown) => {
        console.error("BP 마스터 계정 이력 조회 호출 실패", error);
        return { ok: false as const, message: "이력을 받지 못했습니다. 잠시 후 다시 시도해 주세요." };
      });
      if (mine !== requestNumber.current) return;
      if (!result.ok) return setFailure(result.message);
      setFailure(null);
      setPage(next);
      setPageSize(size);
      setData(result);
    });
  };

  const onClose = () => setOpen(false);

  return (
    <>
      <Button
        variant="soft"
        onClick={() => {
          // 다시 열면 지난번 건수 · 결과를 남기지 않는다 — 첫 조회가 실패해도 건수 칸과 표가 같은 기준이게
          setPageSize(FIRST_HISTORY_PAGE_SIZE);
          setFailure(null);
          setData(null);
          setOpen(true);
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
          {failure && <FailedBand message={failure} />}
          <HistoryScroll>
            <DataTable
              columns={COLUMNS}
              // api 이력 줄에는 id 가 없다(두 테이블을 합친 것) — 한 쪽 안에서 같은 값이 겹칠 수 있어 쪽 안 순번을 섞는다
              rows={(data?.items ?? []).map((h, i) => ({ ...h, key: `${page}-${i}` }))}
              rowKey={(h) => h.key}
              empty={failure && !data ? "변경이력을 불러오지 못했습니다." : loading && !data ? "불러오는 중입니다." : "변경이력이 없습니다."}
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
