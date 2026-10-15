"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { FIELD } from "@/components/common/theme";
import type { StoreSummary } from "@/lib/store-types";
import { searchStoresAction } from "./actions";

export type PickedStore = Pick<StoreSummary, "storeId" | "name" | "storeCode">;

const DEBOUNCE_MS = 300;

/**
 * 필터의 점포 고르기(데모 store-filter.mjs) — 점포명 · 점포코드로 찾아 고르면 아래 「선택한 점포」에 한 줄씩 쌓인다.
 * 고른 점포만 목록에 보이고, 고르지 않으면 전체다. 필터 폭(188px)이라 펼친 목록에는 점포코드를 보이지 않는다(코드로 찾기는 된다).
 * 키보드: ↑ · ↓ 로 고르고 Enter 로 넣는다. Esc 는 층만 닫는다. 포커스가 층 밖으로 나가면 닫는다.
 * 칩 영역은 5개까지 보이고 그 뒤로는 이 안에서 스크롤한다.
 */
export function StorePicker({ picked, onChange }: { picked: PickedStore[]; onChange: (next: PickedStore[]) => void }) {
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PickedStore[]>([]);
  const [failure, setFailure] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  /** 결과를 받은 검색어 — 지금 글자와 다르면 아직 찾는 중이다 */
  const [searched, setSearched] = useState("");
  const [, startSearching] = useTransition();
  // 늦게 온 이전 검색 결과가 새 결과를 덮지 않게 마지막 요청 번호만 받는다
  const requestNumber = useRef(0);

  const pickedIds = new Set(picked.map((p) => p.storeId));
  const options = items.filter((s) => !pickedIds.has(s.storeId));

  useEffect(() => {
    const text = keyword.trim();
    if (!text) return;
    const timer = setTimeout(() => {
      const mine = ++requestNumber.current;
      startSearching(async () => {
        const result = await searchStoresAction(text).catch((error: unknown) => {
          console.error("점포 찾기 호출 실패", error);
          return { ok: false as const, message: "점포를 찾지 못했습니다. 잠시 후 다시 시도해 주세요." };
        });
        if (mine !== requestNumber.current) return;
        setSearched(text);
        if (!result.ok) {
          setFailure(result.message);
          setItems([]);
          setActive(-1);
          return;
        }
        setFailure(null);
        setItems(result.items.map(({ storeId, name, storeCode }) => ({ storeId, name, storeCode })));
        setActive(0);
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keyword]);

  const choose = (store: PickedStore) => {
    onChange([...picked, store]);
    setKeyword("");
    setItems([]);
    setOpen(false);
  };

  const current = searched === keyword.trim();
  const showLayer = open && Boolean(keyword.trim());
  const listShown = showLayer && !failure && options.length > 0;

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
            setFailure(null);
            if (!e.target.value.trim()) {
              requestNumber.current++;
              setItems([]);
            }
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
            } else if (e.key === "Enter" && !e.nativeEvent.isComposing && listShown && current && options[active]) {
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
            {failure ? (
              <p className="px-[6px] py-[6px] text-erp-off">{failure}</p>
            ) : !current ? (
              <p className="px-[6px] py-[6px] text-erp-muted">찾는 중입니다.</p>
            ) : options.length === 0 ? (
              <p className="px-[6px] py-[6px] text-erp-muted">맞는 점포가 없습니다.</p>
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
        <p className="flex items-center gap-[6px] text-[13px] font-medium text-erp-ink">
          선택한 점포
          <span className="font-normal text-erp-label">{picked.length}개점</span>
          {picked.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="ml-auto text-erp-link hover:underline">
              모두 빼기
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
