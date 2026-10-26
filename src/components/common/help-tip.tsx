import { useId } from "react";

// 라벨 옆 정보 아이콘(꽉 찬 원 + i) — 마우스를 올리거나 키보드로 닿으면 안내 문구가 아래에 뜬다(2026-10-26 사용자 지정, 권한 그룹 상세 「가맹마스터 계정」이 처음 쓴다).
// 뜨는 상자는 DESIGN.md Popups 모양(흰 바탕 · #ebebeb 1px · 2px 모서리 · 떠 있는 것의 그림자 하나)이고 fade 로 여닫는다(200ms / 150ms).
// 늘 마운트해 두고 투명도만 바꾼다 — 화면 낭독기는 aria-describedby 로 문구를 읽는다.
// text 안의 줄바꿈(\n)은 그대로 줄을 바꾼다. 부모가 overflow 를 숨기면(truncate 등) 상자가 잘린다 — 말줄임 글자 안이 아니라 그 옆에 둔다.
export function HelpTip({ text, label = "도움말" }: { text: string; label?: string }) {
  const id = useId();
  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        className="grid size-[16px] place-items-center rounded-full text-erp-muted transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:text-erp-brand focus-visible:text-erp-brand motion-reduce:transition-none"
      >
        {/* 글자 「?」 대신 그린 아이콘 — 글꼴에 따라 가운데가 어긋나지 않는다(2026-10-26 사용자가 C안으로 고름) */}
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="8" fill="currentColor" />
          <rect x="7.3" y="7" width="1.4" height="5" rx="0.7" fill="#fff" />
          <circle cx="8" cy="4.8" r="0.9" fill="#fff" />
        </svg>
      </button>
      {/* #ebebeb 팝업 테두리는 Figma 에 한 번만 나오는 색이라 토큰이 없다(DESIGN.md Popups) */}
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none absolute top-[calc(100%+6px)] left-[-8px] z-10 w-max max-w-[260px] rounded-[2px] border border-[#ebebeb] bg-white px-[12px] py-[8px] text-[13px] leading-[1.5] font-normal break-keep whitespace-pre-line text-erp-ink opacity-0 shadow-[0_2px_6px_rgba(40,47,55,0.08)] transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-focus-within:opacity-100 group-focus-within:duration-200 group-hover:opacity-100 group-hover:duration-200 motion-reduce:transition-none"
      >
        {text}
      </span>
    </span>
  );
}
