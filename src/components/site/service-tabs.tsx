"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// 서비스 탭 한 줄 — 플랫폼 권한 관리의 메뉴 등록 팝업과 플랫폼 메뉴 관리가 같이 쓴다. 탭 패널은 부르는 쪽이 `${idPrefix}-panel` 로 둔다.

// 끝이 가려진 쪽만 흐리게 — 색을 더하지 않고 마스크로 글자를 지운다(두 바탕 규칙)
const EDGE_MASK = {
  none: "",
  left: "[mask-image:linear-gradient(to_right,transparent,black_32px)]",
  right: "[mask-image:linear-gradient(to_left,transparent,black_32px)]",
  both: "[mask-image:linear-gradient(to_right,transparent,black_32px,black_calc(100%-32px),transparent)]",
} as const;

/**
 * 서비스 탭 — 서비스(공통코드 SERVICE)가 많아도 한 줄을 지키고 가로로 스크롤해 고른다.
 * 스크롤바는 잘라내 보이지 않게 하고, 넘치는 쪽만 끝을 흐리게 한 뒤 ‹ › 버튼을 둔다(넘칠 때만). 세로 휠도 가로로 넘긴다. 고른 탭은 보이는 자리로 끌어온다.
 */
export function ServiceTabs({
  services,
  selected,
  idPrefix,
  onSelect,
}: {
  /** suffix 는 이름 뒤에 붙는 것(메뉴 수 · 미사용 배지 등) */
  services: { serviceCode: string; name: string; suffix?: ReactNode }[];
  selected: string | null;
  idPrefix: string;
  onSelect: (code: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setEdge((e) => (e.left === left && e.right === right ? e : { left, right }));
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [services.length]);

  // 가로 휠이 없는 마우스도 넘길 수 있게 세로 휠을 가로로 바꾼다. 줄이 실제로 가로로 넘칠 때만 기본 동작을 막는다 —
  // 막지 않으면 팝업이 세로로 넘치는 작은 화면에서 팝업까지 함께 내려간다. React 의 onWheel 은 passive 라 막을 수 없어 직접 단다.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      // 그 방향으로 더 갈 수 있을 때만 막는다 — 끝까지 갔으면 휠이 팝업을 세로로 내리게 둔다
      const canMove = e.deltaY > 0 ? el.scrollLeft + el.clientWidth < el.scrollWidth - 1 : el.scrollLeft > 1;
      if (!canMove) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    ref.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [selected]);

  const scrollBy = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: reduce ? "auto" : "smooth" });
  };
  const arrow = (dir: -1 | 1) => (
    <button
      type="button"
      tabIndex={-1}
      aria-label={dir < 0 ? "앞 서비스 보기" : "다음 서비스 보기"}
      onClick={() => scrollBy(dir)}
      className="grid h-[42px] w-[28px] shrink-0 place-items-center text-[18px] text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink"
    >
      {dir < 0 ? "‹" : "›"}
    </button>
  );
  // 탭 목록 키보드 — 좌우 화살표 · Home · End 로 옮겨 고르고 그 탭에 포커스를 둔다. Tab 키로는 고른 탭 하나에만 선다(roving tabindex).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const at = Math.max(
      0,
      services.findIndex((s) => s.serviceCode === selected),
    );
    const next =
      e.key === "ArrowRight" ? (at + 1) % services.length : e.key === "ArrowLeft" ? (at - 1 + services.length) % services.length : e.key === "Home" ? 0 : e.key === "End" ? services.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    onSelect(services[next].serviceCode);
    requestAnimationFrame(() => document.getElementById(`${idPrefix}-${services[next].serviceCode}`)?.focus());
  };
  const mask = EDGE_MASK[edge.left && edge.right ? "both" : edge.left ? "left" : edge.right ? "right" : "none"];

  return (
    <div className="flex items-stretch border-b border-erp-thead-line">
      {edge.left && arrow(-1)}
      {/* 스크롤바는 보이지 않게 잘라낸다 — 공통 틀(ErpRoot)이 모든 요소에 scrollbar-width: thin 을 !important 로 걸어 none 이 먹지 않는다.
          안쪽 줄을 42 + 24 높이로 두고(스크롤바는 그 아래 여백에 생긴다) 바깥 42 상자가 넘친 아래를 가린다. 이동은 ‹ › · 휠 · 탭 고르기로 한다. */}
      <div className="h-[42px] min-w-0 flex-1 overflow-hidden">
        <div
          ref={ref}
          role="tablist"
          aria-label="서비스"
          onScroll={measure}
          onKeyDown={handleKeyDown}
          className={`box-content flex h-[42px] gap-[6px] overflow-x-auto overflow-y-hidden overscroll-x-contain pb-[24px] [-ms-overflow-style:none] [scrollbar-width:none]! [&::-webkit-scrollbar]:hidden ${mask}`}
        >
          {services.map((s, i) => {
            const on = s.serviceCode === selected;
            // 고른 탭이 없거나 다시 받은 목록에서 사라졌으면 첫 탭이 Tab 키를 받는다
            const focusable = on || (i === 0 && !services.some((x) => x.serviceCode === selected));
            return (
              <button
                key={s.serviceCode}
                type="button"
                role="tab"
                id={`${idPrefix}-${s.serviceCode}`}
                aria-selected={on}
                aria-controls={`${idPrefix}-panel`}
                tabIndex={focusable ? 0 : -1}
                onClick={() => onSelect(s.serviceCode)}
                className={`h-[42px] shrink-0 border-b-2 px-[12px] text-[14px] font-medium whitespace-nowrap transition-colors duration-150 ease-out ${
                  on ? "border-erp-brand text-erp-ink" : "border-transparent text-erp-label hover:text-erp-ink"
                }`}
              >
                {s.name}
                {s.suffix}
              </button>
            );
          })}
        </div>
      </div>
      {edge.right && arrow(1)}
    </div>
  );
}
