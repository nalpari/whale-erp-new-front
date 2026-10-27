"use client";

import { useId, useRef, type ReactNode } from "react";

// 라벨 옆 정보 아이콘(꽉 찬 원 + i) — 마우스를 올리거나 키보드로 닿으면 안내 문구가 아래에 뜬다(2026-10-26 사용자 지정, 권한 그룹 상세 「가맹마스터 계정」이 처음 쓴다).
// 뜨는 상자는 DESIGN.md Popups 모양(흰 바탕 · #ebebeb 1px · 2px 모서리 · 떠 있는 것의 그림자 하나)이고 fade 로 여닫는다(200ms / 150ms).
// 그룹에 이름(help)을 붙여, 이 아이콘을 다른 group 안에 둬도 그 부모의 호버에 뜨지 않는다. 늘 마운트해 두고 투명도만 바꾼다 — 화면 낭독기는 aria-describedby 로 문구를 읽는다.
// text 안의 줄바꿈(\n)은 그대로 줄을 바꾼다. 부모가 overflow 를 숨기면(truncate 등) 상자가 잘린다 — 말줄임 글자 안이 아니라 그 옆에 둔다.
// 잘리는 상자 안에 둘 수밖에 없으면(고정 머리 표의 열 이름, DataTable Column.help) floating 을 켠다 — 상자를 popover 로 최상위 레이어에 띄운다(2026-10-27).
// focusable=false 는 화면 낭독기에서 숨긴 곳(aria-hidden 머리 표)에 둘 때 — 탭 순서에서 빼고, 문구는 부르는 쪽이 읽히는 곳에 따로 둔다.
export function HelpTip({ text, label = "도움말", floating, focusable = true }: { text: ReactNode; label?: string; floating?: boolean; focusable?: boolean }) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const tip = useRef<HTMLSpanElement>(null);

  // floating — 아이콘 바로 아래 왼쪽에 맞춰 최상위 레이어에 띄운다(DateField 날짜판과 같은 popover). popover 를 모르는 브라우저에서는 뜨지 않는다
  const show = () => {
    const box = tip.current;
    const at = button.current?.getBoundingClientRect();
    if (!box || !at || !("showPopover" in box) || box.matches(":popover-open")) return;
    box.style.top = `${at.bottom + 6}px`;
    box.style.left = `${at.left - 8}px`;
    box.showPopover();
    // 오른쪽 끝 쪽 열(BP 공통코드 관리주체)이면 상자가 표 · 창 밖으로 넘쳤다 — 띄운 뒤 폭을 재서 감싼 표의 오른쪽 끝(표가 없으면 창 끝, 8px 안쪽)을
    // 넘지 않게 왼쪽으로 당긴다(사용자가 찾음)
    const bound = Math.min(document.documentElement.clientWidth - 8, button.current?.closest("table")?.getBoundingClientRect().right ?? Infinity);
    const overflow = box.getBoundingClientRect().right - bound;
    if (overflow > 0) box.style.left = `${Math.max(8, at.left - 8 - overflow)}px`;
    // 자리는 열 때 한 번 잡는다 — 표를 밀거나 창 크기가 바뀌면 아이콘에서 떨어지지 않게 닫는다(리뷰로 찾음)
    window.addEventListener("scroll", hide, { capture: true, once: true });
    window.addEventListener("resize", hide, { once: true });
  };
  // popover 를 모르는 브라우저는 :popover-open 을 matches 에 넘기면 예외를 던진다 — show 와 같이 먼저 가린다(리뷰로 찾음)
  function hide() {
    const box = tip.current;
    if (box && "hidePopover" in box && box.matches(":popover-open")) box.hidePopover();
  }

  const icon = (
    <button
      ref={button}
      type="button"
      aria-label={label}
      aria-describedby={id}
      tabIndex={focusable ? undefined : -1}
      onPointerEnter={floating ? show : undefined}
      onPointerLeave={floating ? hide : undefined}
      onFocus={floating ? show : undefined}
      onBlur={floating ? hide : undefined}
      className="grid size-[16px] place-items-center rounded-full text-erp-muted transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/help:text-erp-brand hover:text-erp-brand focus-visible:text-erp-brand motion-reduce:transition-none"
    >
      {/* 글자 「?」 대신 그린 아이콘 — 글꼴에 따라 가운데가 어긋나지 않는다(2026-10-26 사용자가 C안으로 고름) */}
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="8" fill="currentColor" />
        <rect x="7.3" y="7" width="1.4" height="5" rx="0.7" fill="#fff" />
        <circle cx="8" cy="4.8" r="0.9" fill="#fff" />
      </svg>
    </button>
  );
  // #ebebeb 팝업 테두리는 Figma 에 한 번만 나오는 색이라 토큰이 없다(DESIGN.md Popups). 가운데 정렬 칸(표 머리) 안에서도 글은 왼쪽부터
  const box =
    "w-max rounded-[2px] border border-[#ebebeb] bg-white px-[12px] py-[8px] text-left text-[13px] leading-[1.5] font-normal break-keep whitespace-pre-line text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)]";

  if (floating)
    return (
      <span className="relative inline-flex shrink-0">
        {icon}
        {/* popover 의 기본 자리(가운데 · 바깥 여백)를 풀고 show 가 잡은 자리에 선다. 열 때 투명도를 200ms 로 올린다.
            표 머리 도움말은 줄마다 접지 않고 두는 글(관리주체)이 있어 최대 폭을 320 으로 둔다 — 창 밖으로 넘치면 show 가 안으로 당긴다 */}
        <span
          ref={tip}
          popover="manual"
          role="tooltip"
          id={id}
          className={`pointer-events-none fixed inset-auto m-0 max-w-[320px] ${box} transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] starting:opacity-0 motion-reduce:transition-none`}
        >
          {text}
        </span>
      </span>
    );

  return (
    <span className="group/help relative inline-flex shrink-0">
      {icon}
      <span
        role="tooltip"
        id={id}
        className={`pointer-events-none absolute top-[calc(100%+6px)] left-[-8px] z-10 max-w-[260px] ${box} opacity-0 transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-focus-within/help:opacity-100 group-focus-within/help:duration-200 group-hover/help:opacity-100 group-hover/help:duration-200 motion-reduce:transition-none`}
      >
        {text}
      </span>
    </span>
  );
}
