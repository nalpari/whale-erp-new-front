"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./button";

const WIDTH = { base: "w-[420px]", wide: "w-[480px]" };

// 확인창. 네이티브 <dialog> 를 showModal 로 띄워 최상위 레이어 · 포커스 가두기 · Esc 닫기를 브라우저에 맡긴다.
// 떠 있는 것이라 그림자는 팝업 하나의 값만 쓴다(DESIGN.md Elevation). 닫히면 포커스는 브라우저가 연 요소로 돌려준다.
// 여닫음은 부모가 open 으로 쥔다 — Esc · 취소는 onCancel 로 알린다.
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "확인",
  cancelLabel = "취소",
  busy,
  wide,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 확인 동작이 도는 동안 두 버튼을 막는다. */
  busy?: boolean;
  /** 안내가 긴 창은 480 으로 넓힌다(기본 420). */
  wide?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // 한 화면에 확인창이 여럿 있어도(그룹 BP 적용 · 이동 확인 등) 제목 id 가 겹치지 않게 한다.
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
      // Esc 는 브라우저가 바로 닫지 않게 막고 부모에게 맡긴다 — open 과 실제 상태가 어긋나지 않게.
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      // #ebebeb 팝업 테두리는 Figma 에 한 번만 나오는 색이라 토큰이 없다(DESIGN.md Popups).
      className={`m-auto max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] bg-white p-[23px] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40 ${
        wide ? WIDTH.wide : WIDTH.base
      }`}
    >
      <h2 id={titleId} className="text-[18px] font-semibold">
        {title}
      </h2>
      <div className="mt-[12px] text-[14px] leading-[1.6] break-keep">{children}</div>
      <div className="mt-[24px] flex justify-end gap-[6px]">
        <Button variant="off" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
