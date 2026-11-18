"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { EASE_OUT } from "./theme";

const PANEL_BUTTON = "grid h-[32px] place-items-center rounded-[2px] border border-erp-button-line bg-white";

// Figma Fillter. 목록 화면 왼쪽의 필터 패널. 안에는 FilterSection 을 쌓는다.
// 접으면 폭을 226 → 76 으로 바꾼다. 옆 목록이 따라 늘어나야 해서 폭 자체를 전환한다.
// 안쪽 내용은 폭을 고정해 두고 잘라내므로, 줄어드는 동안 줄바꿈이 일어나지 않는다.
// 패널 높이는 부모가 정한다. 항목이 넘치면 제목 줄은 두고 그 아래만 세로로 스크롤한다.
// 스크롤 영역은 왼쪽 18 여백 뒤에 188 폭 내용을 두고, 오른쪽 18 안에서 스크롤바 자리를 잡는다.
// 접기/펼치기는 버튼 하나다. 오른쪽 18 에 붙여 두어, 폭이 줄면 그대로 따라 움직여 접힌 상태의 왼쪽 18 자리에 닿는다
// (안쪽 폭 224 - 18 - 38 = 168, 74 - 18 - 38 = 18). 사라졌다 나타나지 않으니 깜빡이지 않고 포커스도 그대로다.
//
// 창 폭 1400 미만이면 접힌 채 시작한다 — 1260 · 1366 창에서 목록이 150px 넓어진다(2026-11-18 사용자 지정 · 1260 작업). 펼쳐도 화면이
// 깨지지 않게 화면마다 1260 + 펼침 기준으로 맞춘다 — 접기는 덤이다. 서버 화면도 같은 모양이 되게 처음 모양은 CSS 미디어 쿼리가 정하고
// (처음 열 때 펼쳤다 접히는 움직임이 없다), 버튼을 누르면 그때부터 누른 쪽을 따른다. inert · aria 는 그려진 뒤 창 폭을 읽어 맞춘다.
// applied — 처음 상태와 다른 조건이 걸려 있다. 펼쳤든 접었든 접기 · 펼침 버튼 오른쪽 위에 빨간 점(8px, 알림 종 팝업의 안 읽은 점과 같은 색)을
// 붙이고, 마우스를 올리면 「필터 적용 중」 툴팁(헤더 툴팁과 같은 모양)을 띄운다 — 접힌 막대만 보고는 조건이 걸린 줄 몰랐다. 버튼을 회청으로
// 뒤집는 안은 기본 버튼과 같아 보여 접었다(2026-11-18 사용자 지정).
const NARROW = "(max-width: 1399px)";
// 누른 접기 · 펼침을 화면(주소 경로)마다 기억한다 — 조건을 바꾸면 필터를 새로 그리는 화면(근로계약 · 공통코드 key)에서 펼쳐 둔 필터가 다시
// 접혔다. 탭 안에서만 산다(새로 고치면 창 폭을 따른다)
const chosenByPath = new Map<string, boolean>();

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(NARROW);
    const sync = () => setNarrow(m.matches);
    sync();
    m.addEventListener("change", sync);
    return () => m.removeEventListener("change", sync);
  }, []);
  return narrow;
}

export function FilterPanel({
  title = "필터",
  onReset,
  applied = false,
  defaultOpen = true,
  className = "",
  children,
}: {
  title?: string;
  /** 없으면 초기화 버튼이 비활성화된다. */
  onReset?: () => void;
  /** 처음 상태와 다른 조건이 걸려 있다 — 접기 · 펼침 버튼에 빨간 점을 붙여 알린다(펼쳤든 접었든) */
  applied?: boolean;
  /** false 면 창 폭과 상관없이 접힌 채 시작한다. 기본은 창 폭(1400 미만이면 접힘)을 따른다 */
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  // null — 아직 누르지 않았다(창 폭을 따른다)
  const path = usePathname();
  const [chosen, setChosenState] = useState<boolean | null>(() => chosenByPath.get(path) ?? (defaultOpen ? null : false));
  const setChosen = (next: boolean) => {
    chosenByPath.set(path, next);
    setChosenState(next);
  };
  const narrow = useNarrow();
  const open = chosen ?? !narrow;
  const auto = chosen === null;
  const width = auto ? "w-[226px] max-[1399px]:w-[76px]" : open ? "w-[226px]" : "w-[76px]";
  const fade = auto
    ? "opacity-100 duration-200 max-[1399px]:opacity-0 max-[1399px]:duration-100"
    : open
      ? "opacity-100 duration-200"
      : "opacity-0 duration-100";
  // 접힌 아이콘 · 펼친 아이콘 중 보이는 것 — 처음 모양은 CSS 가 정한다
  const showCollapse = auto ? "max-[1399px]:invisible" : open ? "" : "invisible";
  const showExpand = auto ? "invisible max-[1399px]:visible" : open ? "invisible" : "";

  return (
    // 툴팁이 막대 밖(목록 위)으로 나가야 해서 잘라 내기는 안쪽 상자가 맡는다
    <aside
      className={`relative shrink-0 rounded-[4px] border border-erp-panel-line bg-white transition-[width] duration-250 ${EASE_OUT} motion-reduce:transition-none ${width} ${className}`}
    >
      <div className="h-full overflow-hidden rounded-[4px]">
      <div
        inert={!open}
        className={`flex h-full w-[224px] flex-col transition-opacity ${fade}`}
      >
        <div className="mx-[18px] mt-[18px] flex shrink-0 items-center gap-[6px] border-b border-erp-divider pb-[18px]">
          <h2 className="flex-1 text-[15px] font-semibold text-erp-ink">{title}</h2>
          <button type="button" aria-label={`${title} 초기화`} disabled={!onReset} onClick={onReset} className={`${PANEL_BUTTON} px-[13px]`}>
            <Image src="/icons/reset.svg" alt="" width={14} height={14} />
          </button>
          {/* 접기/펼치기 버튼 자리 */}
          <span className="w-[38px]" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pl-[18px] [scrollbar-gutter:stable]">
          <div className="flex w-[188px] flex-col gap-[18px] pt-[18px] pb-[24px]">{children}</div>
        </div>
      </div>
      </div>
      <button
        type="button"
        aria-label={`${title} ${open ? "접기" : "펼치기"}${applied ? " (필터 적용 중)" : ""}`}
        aria-expanded={open}
        onClick={() => setChosen(!open)}
        className={`group absolute top-[18px] right-[18px] w-[38px] ${PANEL_BUTTON}`}
      >
        {/* 두 아이콘을 미리 그려 두고 보이는 것만 바꾼다. src 를 바꾸면 새로 불러오는 동안 비어 보인다 */}
        <Image src="/icons/collapse.svg" alt="" width={12} height={18} className={`col-start-1 row-start-1 ${showCollapse}`} />
        <Image src="/icons/expand.svg" alt="" width={12} height={18} className={`col-start-1 row-start-1 ${showExpand}`} />
        {applied && (
          // 흰 테두리 2px 로 버튼 테두리와 겹쳐도 또렷하다
          <span aria-hidden className="absolute -top-[4px] -right-[4px] size-[8px] rounded-full bg-erp-off ring-2 ring-white" />
        )}
        {applied && (
          // 헤더 툴팁(HeaderTip)과 같은 모양 — 버튼 왼쪽 끝에 맞춰 아래로 띄운다(막대가 좁아 가운데 맞춤이면 왼쪽이 잘린다)
          <span
            aria-hidden
            className="pointer-events-none absolute top-[calc(100%+8px)] left-0 z-20 translate-y-[4px] rounded-[6px] border border-erp-brand bg-white px-[12px] py-[10px] text-[14px] leading-[2] font-medium whitespace-nowrap text-erp-ink opacity-0 transition-[opacity,translate] duration-150 ease-out [text-box:trim-both_cap_alphabetic] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:translate-y-0"
          >
            필터 적용 중
          </span>
        )}
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
  action,
}: {
  label: string;
  children: ReactNode;
  /** 라벨 줄 오른쪽에 둘 작은 동작(점포 [일괄검색]) */
  action?: ReactNode;
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
      {action ? (
        <div className="flex items-center justify-between gap-[6px]">
          <p className="text-[14px] font-medium text-erp-label">{label}</p>
          {action}
        </div>
      ) : (
        <p className="text-[14px] font-medium text-erp-label">{label}</p>
      )}
      {children}
    </div>
  );
}
