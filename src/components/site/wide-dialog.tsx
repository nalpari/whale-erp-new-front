"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Select } from "@/components/common";
import { HISTORY_PAGE_SIZES, type HistoryPageSize } from "@/lib/history-paging";

// 표가 들어가는 팝업과 1팀 변경이력 팝업(BP 휴일 · BP 마스터 · 플랫폼 관리자 · BP 관리자 · 점포)이 같이 쓰는 조각.
// BP 휴일 화면에서 만들어(holiday-parts.tsx) 모두 같은 모양으로 맞추며 옮겼다(2026-11-04 사용자 지정).

/** 머리 줄을 고정하고 줄만 스크롤하는 표 감싸기 — 표가 border-collapse 라 머리 줄의 선은 표에 붙어 스크롤된다. 그 틈으로 아래 글자가 비쳤다(2026-11-03 사용자 지적).
 * 점포 변경이력(stores/[storeId]/history-dialog.tsx)처럼 위아래 선은 감싸는 칸이 긋고, 머리 줄 아래 선은 그림자(1px)로 붙여 머리와 함께 고정한다 */
const STICKY_TABLE =
  "overflow-y-auto overscroll-contain border-y border-erp-thead-line [&_tbody_tr:last-child]:border-b-0 [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[1] [&_thead]:shadow-[0_1px_0_var(--color-erp-thead-line)] [&_thead_tr]:border-y-0";

/** 표 감싸기 — fill: 팝업(WideDialog)의 남는 높이를 다 쓴다. 280: 확인창 안처럼 높이를 280px 로 묶는다(겹침 확인창) */
export function HistoryScroll({ children, height = "fill" }: { children: ReactNode; height?: "fill" | "280" }) {
  return <div className={`${height === "fill" ? "min-h-0 flex-1" : "max-h-[280px]"} ${STICKY_TABLE}`}>{children}</div>;
}

/**
 * 표가 들어가는 팝업(네이티브 <dialog>, 최상위 레이어) — ConfirmDialog 와 같은 껍데기. Esc 는 onClose 로 돌린다(닫는 것은 부르는 쪽 상태).
 * 폭: wide 1000(1팀 변경이력 팝업 모두 — 2026-11-03 BP 휴일, 2026-11-04 나머지도 사용자 지정, 전엔 860) · narrow 480(BP 휴일 점포 목록).
 * 제목 · [닫기]는 늘 그 자리 — 본문은 남는 높이만 쓰고, 그 안의 표(HistoryScroll)가 머리 줄을 고정한 채 줄만 스크롤한다(2026-11-03 사용자 지정 —
 * 길면 [닫기]가 아래로 밀려 안 보였다). 열렸을 때만 flex(닫힌 dialog 는 숨김 그대로).
 * 표 칸(td) 안에 놓여도 칸의 줄바꿈 막기 · 가운데 정렬을 물려받지 않게 되돌린다(점포 목록 팝업은 목록 칸 안에 있다, 코드 리뷰).
 */
export function WideDialog({
  open,
  title,
  onClose,
  children,
  footer,
  width = "wide",
  titleAside,
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  width?: "wide" | "narrow";
  /** 제목 줄 오른쪽 끝 — 변경이력의 총 건수 · 한 쪽 건수(HistoryTotalBar). 제목 아래 빈 줄을 없앤다(2026-11-04 사용자 지정) */
  titleAside?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // #ebebeb 팝업 테두리는 Figma 에 한 번만 나오는 색이라 토큰이 없다(DESIGN.md Popups).
      className={`m-auto max-h-[calc(100dvh-48px)] ${width === "wide" ? "w-[1000px]" : "w-[480px]"} max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[2px] border border-[#ebebeb] bg-white p-[23px] text-left whitespace-normal text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40 open:flex`}
    >
      <div className="flex shrink-0 items-center gap-[12px]">
        <h2 id={titleId} className="text-[18px] font-semibold">
          {title}
        </h2>
        {titleAside && <div className="ml-auto">{titleAside}</div>}
      </div>
      <div className="mt-[12px] flex min-h-0 flex-1 flex-col gap-[12px] text-[14px]">{children}</div>
      <div className="mt-[24px] flex shrink-0 justify-end gap-[6px]">{footer}</div>
    </dialog>
  );
}

/**
 * 변경이력 표 위 오른쪽 끝의 총 건수 · 한 쪽 건수(20 · 50) — 목록 화면(ListToolbar)과 같은 모양(2026-11-03 BP 휴일, 2026-11-04 1팀 변경이력 모두 사용자 지정).
 * 기간 조회처럼 왼쪽에 둘 것이 있으면 children 으로 넘긴다. 건수를 바꾸면 부르는 쪽이 첫 쪽부터 다시 받는다.
 */
export function HistoryTotalBar({
  total,
  pageSize,
  disabled,
  onPageSizeChange,
  children,
}: {
  /** 아직 받지 못했으면 null — 「-」로 보인다 */
  total: number | null;
  pageSize: HistoryPageSize;
  disabled: boolean;
  onPageSizeChange: (size: HistoryPageSize) => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center gap-[6px]">
      {children}
      <p className="ml-auto text-[14px] text-erp-ink">
        총 <b className="font-semibold">{total === null ? "-" : total.toLocaleString("ko-KR")}</b> 건
      </p>
      <div className="w-[80px] shrink-0">
        <Select aria-label="페이지당 건수" value={String(pageSize)} disabled={disabled} onChange={(e) => onPageSizeChange(Number(e.target.value) as HistoryPageSize)}>
          {HISTORY_PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
