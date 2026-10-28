"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Tag } from "@/components/common";
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

/** 적용 범위 꼬리표 — 「전체 점포」 · 「일부 점포」(데모 c.tag) */
export const ScopeTag = ({ isAllStores }: { isAllStores: boolean }) => <Tag>{isAllStores ? "전체 점포" : "일부 점포"}</Tag>;

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

/**
 * 넓은 팝업(네이티브 <dialog>, 최상위 레이어) — 변경 이력처럼 표가 들어가는 창. ConfirmDialog 와 같은 껍데기이고 폭만 넓다.
 * Esc 는 onClose 로 돌린다(닫는 것은 부르는 쪽 상태).
 */
export function WideDialog({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
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
      className="m-auto max-h-[calc(100dvh-48px)] w-[760px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-[2px] border border-[#ebebeb] bg-white p-[23px] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
    >
      <h2 id={titleId} className="text-[18px] font-semibold">
        {title}
      </h2>
      <div className="mt-[12px] flex flex-col gap-[12px] text-[14px]">{children}</div>
      <div className="mt-[24px] flex justify-end gap-[6px]">{footer}</div>
    </dialog>
  );
}
