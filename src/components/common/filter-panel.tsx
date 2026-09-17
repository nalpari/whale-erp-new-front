"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { EASE_OUT } from "./theme";

const PANEL_BUTTON = "grid h-[32px] place-items-center rounded-[2px] border border-erp-button-line bg-white";

// Figma Fillter. 목록 화면 왼쪽의 필터 패널. 안에는 FilterSection 을 쌓는다.
// 접으면 폭을 226 → 76 으로 바꾼다. 옆 목록이 따라 늘어나야 해서 폭 자체를 전환한다.
// 안쪽 내용은 폭을 고정해 두고 잘라내므로, 줄어드는 동안 줄바꿈이 일어나지 않는다.
// 패널 높이는 부모가 정한다. 항목이 넘치면 제목 줄은 두고 그 아래만 세로로 스크롤한다.
// 스크롤 영역은 왼쪽 18 여백 뒤에 188 폭 내용을 두고, 오른쪽 18 안에서 스크롤바 자리를 잡는다.
// 누른 버튼이 inert 영역으로 들어가므로, 접고 펼칠 때 포커스를 반대쪽 버튼으로 옮긴다.
export function FilterPanel({
  title = "필터",
  onReset,
  defaultOpen = true,
  className = "",
  children,
}: {
  title?: string;
  /** 없으면 초기화 버튼이 비활성화된다. */
  onReset?: () => void;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const collapseButton = useRef<HTMLButtonElement>(null);
  const expandButton = useRef<HTMLButtonElement>(null);
  const toggle = (next: boolean) => {
    setOpen(next);
    // inert 가 풀리는 다음 프레임에 옮긴다.
    requestAnimationFrame(() => (next ? collapseButton : expandButton).current?.focus());
  };

  return (
    <aside
      className={`relative shrink-0 overflow-hidden rounded-[4px] border border-erp-panel-line bg-white transition-[width] duration-250 ${EASE_OUT} motion-reduce:transition-none ${
        open ? "w-[226px]" : "w-[76px]"
      } ${className}`}
    >
      <div
        inert={!open}
        className={`flex h-full w-[224px] flex-col transition-opacity ${
          open ? "opacity-100 duration-200" : "opacity-0 duration-100"
        }`}
      >
        <div className="mx-[18px] mt-[18px] flex shrink-0 items-center gap-[6px] border-b border-erp-divider pb-[18px]">
          <h2 className="flex-1 text-[15px] font-semibold text-erp-ink">{title}</h2>
          <button type="button" aria-label={`${title} 초기화`} disabled={!onReset} onClick={onReset} className={`${PANEL_BUTTON} px-[13px]`}>
            <Image src="/icons/reset.svg" alt="" width={14} height={14} />
          </button>
          <button
            ref={collapseButton}
            type="button"
            aria-label={`${title} 접기`}
            aria-expanded={open}
            onClick={() => toggle(false)}
            className={`${PANEL_BUTTON} px-[12px]`}
          >
            <Image src="/icons/collapse.svg" alt="" width={12} height={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pl-[18px] [scrollbar-gutter:stable]">
          <div className="flex w-[188px] flex-col gap-[18px] pt-[18px] pb-[24px]">{children}</div>
        </div>
      </div>
      <button
        ref={expandButton}
        type="button"
        aria-label={`${title} 펼치기`}
        aria-expanded={open}
        inert={open}
        onClick={() => toggle(true)}
        className={`absolute top-[18px] left-[18px] px-[12px] transition-opacity ${PANEL_BUTTON} ${
          open ? "opacity-0 duration-100" : "opacity-100 delay-100 duration-200"
        }`}
      >
        <Image src="/icons/expand.svg" alt="" width={12} height={18} />
      </button>
    </aside>
  );
}

// 필터 한 묶음. 마지막 묶음에는 last 를 줘서 아래 구분선을 뺀다.
export function FilterSection({
  label,
  children,
  tight,
  last,
}: {
  label: string;
  children: ReactNode;
  /** 라벨과 내용 간격을 8 로 줄인다(입력칸 묶음). 없으면 12(체크박스 묶음). */
  tight?: boolean;
  last?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex flex-col ${tight ? "gap-[8px]" : "gap-[12px]"} ${last ? "" : "border-b border-erp-divider pb-[18px]"}`}
    >
      <p className="text-[14px] font-medium text-erp-label">{label}</p>
      {children}
    </div>
  );
}
