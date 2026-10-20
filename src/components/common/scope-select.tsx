"use client";

import Image from "next/image";
import { useState } from "react";
import { Popup, useDropdown } from "./popup";
import { EASE_OUT } from "./theme";

/** muted — 이름을 보조 줄과 같은 회색으로(폐점 점포 등). 고를 수는 있다 */
export type ScopeSelectOption = { key: string; label: string; meta: string; muted?: boolean };
export type ScopeSelectSection = { title: string; options: ScopeSelectOption[] };

// 헤더 점포 범위 드롭다운(데모 site.mjs scopeDropdown · 목업 F-TLJOCK). 칸은 「BP 이름 · 고른 값」이고, 목록은 묶음(제목 + 항목)으로 펼친다.
// 항목은 굵은 이름과 작은 보조 줄(개수 · 점포코드)이다. 고른 항목은 목록에 남고 ✓ 가 붙는다. 맨 위 검색칸이 이름 · 보조 줄로 거르고,
// 남는 항목이 없는 묶음은 숨긴다. 감싸는 div 만 flex-1 로 남는 폭을 먹어 오른쪽 아이콘들을 끝으로 민다(StoreSelect 와 같다).
export function ScopeSelect({
  title,
  sections,
  value,
  onChange,
  label = "점포",
}: {
  /** 칸 앞에 굵게 둘 이름(BP) */
  title: string;
  sections: ScopeSelectSection[];
  /** 고른 항목의 key */
  value: string;
  onChange: (key: string) => void;
  label?: string;
}) {
  const { open, setOpen, close, ref, trigger, id } = useDropdown();
  const [query, setQuery] = useState("");
  const all = sections.flatMap((s) => s.options);
  const current = all.find((o) => o.key === value)?.label ?? all[0]?.label ?? "";
  const term = query.trim().toLowerCase();
  const shown = sections
    .map((s) => ({ ...s, options: s.options.filter((o) => !term || `${o.label} ${o.meta}`.toLowerCase().includes(term)) }))
    .filter((s) => s.options.length);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${label}: ${current || "없음"}`}
        disabled={all.length === 0}
        onClick={() => setOpen(!open)}
        className="flex h-[42px] w-[420px] items-center gap-[8px] rounded-full border border-erp-field-line bg-erp-thead-bg px-[18px] text-left text-[14px] text-erp-ink"
      >
        <b className="shrink-0 font-semibold">{title}</b>
        <span className="text-erp-label">·</span>
        <span className="flex-1 truncate">{current || `${label} 없음`}</span>
        <Image
          src="/icons/chevron-small-brand.svg"
          alt=""
          width={5}
          height={8}
          className={`transition-transform duration-200 ${EASE_OUT} ${open ? "rotate-90" : "-rotate-90"}`}
        />
      </button>
      {/* 선택칸이 둥글어 목록도 모서리를 키우고(StoreSelect 와 같다), 그림자는 fold 전환의 clip-path 여유 안에 들어가게 작게 둔다. */}
      <Popup id={id} open={open} motion="fold" className="left-0 w-[304px] rounded-[12px]! border-erp-field-line! p-[6px]! shadow-[0_2px_6px_rgba(40,47,55,0.08)]">
        {/* 검색 줄 높이는 목업(pop__search · 36.5px)에 맞춘다 — 위 6 · 아래 8 여백, 입력칸 줄 높이 1.5 + 위아래 1px */}
        <div className="mb-[6px] flex items-center gap-[8px] border-b border-erp-divider px-[10px] pt-[6px] pb-[8px]">
          <Image src="/icons/search.svg" alt="" width={14} height={14} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="점포 이름으로 찾기"
            aria-label={`${label} 찾기`}
            className="min-w-0 flex-1 border-0 bg-transparent px-[2px] py-[1px] text-[13px] leading-[1.5] text-erp-ink outline-none placeholder:text-erp-label"
          />
        </div>
        <div className="max-h-[328px] overflow-y-auto">
          {shown.map((s) => (
            <div key={s.title} role="group" aria-label={s.title} className="flex flex-col gap-[1px]">
              <p className="px-[12px] pt-[10px] pb-[4px] text-[11px] font-semibold tracking-[0.04em] text-erp-muted uppercase">{s.title}</p>
              {s.options.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  aria-pressed={o.key === value}
                  onClick={() => {
                    setQuery("");
                    onChange(o.key);
                    close();
                  }}
                  className="group flex w-full items-start gap-[10px] rounded-[8px] px-[12px] py-[8px] text-left transition-colors duration-150 ease-out hover:bg-erp-thead-bg focus-visible:bg-erp-thead-bg"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                    <b className={`truncate text-[13px] font-semibold ${o.muted ? "text-erp-muted" : "text-erp-ink"}`}>{o.label}</b>
                    <span className="truncate text-[11.5px] text-erp-muted">{o.meta}</span>
                  </span>
                  {o.key === value && <span className="shrink-0 text-[14px] font-semibold text-erp-brand">✓</span>}
                </button>
              ))}
            </div>
          ))}
          {shown.length === 0 && <p className="px-[12px] py-[14px] text-center text-[13px] text-erp-label">맞는 점포가 없습니다.</p>}
        </div>
      </Popup>
    </div>
  );
}
