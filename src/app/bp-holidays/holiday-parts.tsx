"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useCodeLabel } from "@/components/site/code-label";
import type { ActionFailure } from "@/lib/role-group-actions";

// BP 휴일 패널 · 팝업이 같이 쓰는 작은 조각. 공통 컴포넌트에 없는 것만 둔다.

/**
 * server action 호출 자체가 실패했을 때(연결 끊김 · 재배포로 action 을 못 찾음). 쓰기(wrote)는 처리됐을 수도 있어
 * 부르는 쪽이 화면을 새로 받는다 — 그 사실을 함께 말한다. 읽기는 다시 시도하라고만 한다.
 */
export const unknownResult =
  (what: string, wrote = true) =>
  (error: unknown): ActionFailure => {
    console.error(`BP 휴일 ${what} 호출 실패`, error);
    return {
      ok: false,
      message: wrote
        ? `${what} 결과를 확인하지 못했습니다. 화면을 새로 받았으니 처리됐는지 확인한 뒤 다시 시도해 주세요.`
        : `${what}에 실패했습니다. 잠시 후 다시 시도해 주세요.`,
    };
  };

/**
 * 적용 범위 꼬리표 — 「전체 점포」는 연한 분홍(erp-off-bg) 바탕, 「일부 점포」는 그대로 회색으로 가른다 — 파랑은 달력 BP 휴일 칩과 겹쳐 분홍으로(DESIGN 「색은 상태다」 예외, 1팀 확인 필요)(2026-11-03 사용자 지정 — 둘이 같은 회색이라 구분이 안 됐다).
 * 공통코드 관리주체 꼬리표(OwnerTag)와 같은 방식 — 글자 · 선은 그대로 두고 바탕만 가른다. 글자가 달라 색만으로 말하지 않는다.
 */
export const ScopeTag = ({ isAllStores }: { isAllStores: boolean }) => (
  <span
    className={`inline-block rounded-[2px] border border-erp-thead-line px-[4px] py-px text-[14px] font-medium whitespace-nowrap text-erp-sub ${isAllStores ? "bg-erp-off-bg" : "bg-erp-thead-bg"}`}
  >
    {isAllStores ? "전체 점포" : "일부 점포"}
  </span>
);

/**
 * 휴일 유형 문구 — 「하루」 「기간」 「매주 반복」. 한글은 공통코드 HOLIDAY_TYPE · HOLIDAY_REPEAT_TYPE(플랫폼고정)에서 읽는다(naming.md 화면 문구).
 */
export function useHolidayTypeText() {
  const typeLabel = useCodeLabel("HOLIDAY_TYPE");
  const repeatLabel = useCodeLabel("HOLIDAY_REPEAT_TYPE");
  return (type: string, repeat: string | null) => (type === "REPEAT" && repeat ? `${repeatLabel(repeat)} ${typeLabel(type)}` : typeLabel(type));
}

/** 회색 보조 글자 */
export const Muted = ({ children }: { children: ReactNode }) => <span className="text-erp-muted">{children}</span>;

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
 * 폭: wide 1000(변경이력 — 2026-11-03 사용자 지정, 전엔 860. 다른 1팀 변경이력 팝업은 860 그대로라 BP 휴일만 넓다) · narrow 480(점포 목록).
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
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  width?: "wide" | "narrow";
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
      <h2 id={titleId} className="shrink-0 text-[18px] font-semibold">
        {title}
      </h2>
      <div className="mt-[12px] flex min-h-0 flex-1 flex-col gap-[12px] text-[14px]">{children}</div>
      <div className="mt-[24px] flex shrink-0 justify-end gap-[6px]">{footer}</div>
    </dialog>
  );
}
