"use client";

import { useId, useRef, useState } from "react";
import { FIELD, SMALL_BUTTON } from "@/components/common/theme";
import { searchStoresByText, toPickedStore } from "@/lib/store-scope";
import type { StoreSummary } from "@/lib/store-types";
import { useStores } from "./session-gate";

export type PickedStore = Pick<StoreSummary, "storeId" | "name" | "storeCode">;

/**
 * 목록 필터의 점포 고르기(데모 store-filter.mjs) — 점포명 · 점포코드로 찾아 고르면 아래 「선택한 점포」에 한 줄씩 쌓인다.
 * 점포 검색 필터가 있는 목록이 쓴다 — 고른 점포는 그 목록 주소의 storeIds, 헤더 범위는 scope 로 받는다(src/lib/store-scope.ts).
 * 찾기는 로그인 정보의 관리 점포(useStores, 폐점 포함) 안에서 한다 — api 를 부르지 않아 「점포 정보 관리」 메뉴 권한이 없는 화면에서도
 * 쓸 수 있다. 로그인 뒤 새로 생긴 점포는 다시 로그인해야 찾힌다(헤더 범위 선택기와 같다).
 * 고른 점포만 목록에 보이고, 고르지 않으면 전체다. 필터 폭(188px)이라 펼친 목록에는 점포코드를 보이지 않는다(코드로 찾기는 된다).
 * 키보드: ↑ · ↓ 로 고르고 Enter 로 넣는다. Esc 는 층만 닫는다. 포커스가 층 밖으로 나가면 닫는다.
 * 칩 영역은 5개까지 보이고 그 뒤로는 이 안에서 스크롤한다.
 */
export function StorePicker({
  picked,
  hidden = [],
  onChange,
}: {
  picked: PickedStore[];
  /** 후보에서 숨길 점포 — 목록이 찾지 못해 조건에서 뺀 점포(지웠거나 볼 수 없게 됐는데 로그인 정보에는 아직 남은 것) */
  hidden?: readonly number[];
  onChange: (next: PickedStore[]) => void;
}) {
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const stores = useStores();
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const pickedIds = new Set([...picked.map((p) => p.storeId), ...hidden]);
  const options: PickedStore[] = searchStoresByText(stores, keyword)
    .filter((s) => !pickedIds.has(s.storeId))
    .map(toPickedStore);

  const choose = (store: PickedStore) => {
    onChange([...picked, store]);
    setKeyword("");
    setOpen(false);
  };

  const showLayer = open && Boolean(keyword.trim());
  const listShown = showLayer && options.length > 0;

  return (
    <div className="flex flex-col gap-[10px]">
      <div
        ref={box}
        className="relative"
        // Tab 등으로 포커스가 층 밖으로 나가면 닫는다 — 열린 층이 남으면 화면 다른 곳의 Esc 가 엉뚱하게 먹는다
        onBlur={(e) => {
          if (!box.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
        }}
      >
        <input
          type="text"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && showLayer) {
              e.preventDefault();
              setOpen(false);
            } else if (e.key === "ArrowDown" && options.length) {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, options.length - 1));
            } else if (e.key === "ArrowUp" && options.length) {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && !e.nativeEvent.isComposing && listShown && options[active]) {
              e.preventDefault();
              choose(options[active]);
            }
          }}
          placeholder="점포명 또는 점포코드"
          aria-label="점포 찾기"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={listShown}
          aria-controls={listShown ? listId : undefined}
          aria-activedescendant={listShown && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          maxLength={50}
          className={`${FIELD} pr-[10px]`}
        />
        {showLayer && (
          <div
            // 열려 있는 동안 Esc 가 이 층부터 닫도록 알린다(slide-panel.tsx 의 data-dismiss-open 규칙)
            data-dismiss-open=""
            // 누르는 동안 검색칸이 포커스를 잃어 층이 닫히지 않게 한다
            onMouseDown={(e) => e.preventDefault()}
            // 떠 있는 층이라 팝업 그림자 하나만 쓴다(DESIGN.md). #ebebeb 는 팝업 테두리 값이다
            className="absolute top-[calc(100%+4px)] right-0 left-0 z-20 max-h-[288px] overflow-y-auto overscroll-contain rounded-[2px] border border-[#ebebeb] bg-white p-[6px] text-[14px] shadow-[0_2px_6px_rgba(40,47,55,0.08)]"
          >
            {options.length === 0 ? (
              <div className="flex flex-col gap-[6px] px-[6px] py-[6px]">
                <p className="text-erp-muted">검색 결과가 없습니다.</p>
                {/* 찾기는 로그인 정보 안에서 한다 — 방금 등록한 점포를 「없음」으로 오해하지 않게 */}
                <p className="text-[12px] text-erp-label">로그인 뒤 등록한 점포는 다시 로그인하면 찾을 수 있습니다.</p>
              </div>
            ) : (
              <ul id={listId} role="listbox" aria-label="고를 수 있는 점포">
                {options.map((store, i) => (
                  <li
                    key={store.storeId}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(store)}
                    className={`cursor-pointer truncate rounded-[2px] px-[6px] py-[6px] text-erp-ink ${i === active ? "bg-erp-thead-bg" : ""}`}
                  >
                    {store.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-[6px]">
        {/* 칩이 생기면 나타나는 24px [전체 제거] 만큼 줄 높이를 미리 둔다 — 첫 점포를 고를 때 아래 필터가 밀리지 않게 */}
        <p className="flex min-h-[24px] items-center gap-[6px] text-[13px] font-medium text-erp-ink">
          선택한 점포
          <span className="font-normal text-erp-label">{picked.length}개점</span>
          {picked.length > 0 && (
            // 「점포」 라벨 줄의 [일괄검색]과 같은 작은 버튼(theme SMALL_BUTTON)
            <button type="button" onClick={() => onChange([])} className={`ml-auto ${SMALL_BUTTON}`}>
              전체 제거
            </button>
          )}
        </p>
        {/* 칩 34px × 5 + 간격 6px × 4 = 194px 까지 보이고 그 뒤로는 이 안에서 스크롤 */}
        <ul aria-label="선택한 점포" className="flex max-h-[194px] flex-col gap-[6px] overflow-y-auto overscroll-contain">
          {picked.map((store) => (
            <li
              key={store.storeId}
              className="flex h-[34px] shrink-0 items-center gap-[6px] rounded-[2px] border border-erp-field-line bg-white pr-[4px] pl-[10px] text-[14px] text-erp-ink"
            >
              <span className="min-w-0 flex-1 truncate" title={`${store.name} · ${store.storeCode}`}>
                {store.name}
              </span>
              <button
                type="button"
                aria-label={`${store.name} 빼기`}
                onClick={() => onChange(picked.filter((p) => p.storeId !== store.storeId))}
                className="grid size-[24px] shrink-0 place-items-center rounded-[2px] text-erp-label transition-colors duration-150 hover:text-erp-ink"
              >
                <svg viewBox="0 0 8 8" className="size-[8px] stroke-current" aria-hidden>
                  <path d="M1 1l6 6M7 1L1 7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
