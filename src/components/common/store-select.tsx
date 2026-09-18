"use client";

import Image from "next/image";
import { useState } from "react";
import { Popup, useDropdown } from "./popup";
import { EASE_OUT } from "./theme";

// Figma Select_top. 헤더 오른쪽의 점포 선택. 목록은 위에서부터 펼쳐진다.
// 선택된 점포는 목록에서 빠진다(Figma 기준).
// 화살표 키 탐색을 따로 두지 않으므로 ARIA listbox 대신 disclosure(aria-expanded + 버튼 목록)로 둔다.
// v2 는 GlobalHeaderV2 의 둥근 420px 선택칸이다. 남는 폭을 차지하고 왼쪽에 붙는다.
export function StoreSelect({
  options,
  value: controlled,
  defaultValue = options[0] ?? "",
  onChange,
  label = "점포",
  placeholder = `${label} 선택`,
  variant = "v1",
}: {
  options: string[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  variant?: "v1" | "v2";
}) {
  const { open, setOpen, close, ref, trigger, id } = useDropdown();
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const rest = options.filter((o) => o !== value);

  return (
    <div ref={ref} className={variant === "v2" ? "relative flex-1" : "relative w-[260px]"}>
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${label}: ${value || placeholder}`}
        disabled={rest.length === 0}
        onClick={() => setOpen(!open)}
        className={
          variant === "v2"
            ? "flex h-[42px] w-[420px] items-center gap-[10px] rounded-full border border-erp-field-line bg-erp-thead-bg px-[18px] text-left text-[14px] text-erp-ink"
            : "flex h-[34px] w-full text-left"
        }
      >
        {variant === "v2" ? (
          <>
            <span className="flex-1 truncate">{value || placeholder}</span>
            <Image
              src="/icons/chevron-small-brand.svg"
              alt=""
              width={5}
              height={8}
              className={`transition-transform duration-200 ${EASE_OUT} ${open ? "rotate-90" : "-rotate-90"}`}
            />
          </>
        ) : (
          <>
            <span className="flex flex-1 items-center truncate rounded-l-[2px] border-y border-l border-erp-field-line bg-white pl-[10px] text-[14px] text-erp-ink">
              {value || placeholder}
            </span>
            <span className="grid w-[34px] place-items-center rounded-r-[2px] border-y border-r border-erp-field-line bg-white">
              <Image
                src="/icons/chevron-small.svg"
                alt=""
                width={5}
                height={8}
                className={`transition-transform duration-200 ${EASE_OUT} ${open ? "rotate-90" : "-rotate-90"}`}
              />
            </span>
          </>
        )}
      </button>
      {/* 목록은 한 벌이고 v1·v2 는 껍데기 클래스만 다르다.
          v1: 항목이 버튼이라 ul 에 trim 을 걸면 안쪽까지 닿지 않는다. 첫 항목 위, 마지막 항목 아래만 잘라 Figma 높이를 맞춘다.
              잘린 기준선 아래 획이 가려지지 않도록 truncate 대신 줄바꿈만 막는다.
          v2: 선택칸이 둥글어 목록도 모서리를 키우고, 항목마다 줄 배경으로 올린 위치를 보여 준다.
              그림자는 fold 전환의 clip-path 여유(8px) 안에 들어가게 작게 둔다. */}
      <Popup
        id={id}
        open={open}
        motion="fold"
        className={
          variant === "v2"
            ? "left-0 w-[420px] rounded-[12px]! border-erp-field-line! p-[6px]! shadow-[0_2px_6px_rgba(40,47,55,0.08)]"
            : "right-0 w-[260px]"
        }
      >
        <ul
          aria-label={label}
          className={
            variant === "v2"
              ? "text-[14px] text-erp-ink"
              : "text-[14px] leading-[2] text-erp-ink [text-box-edge:cap_alphabetic] [&>li:first-child>button]:[text-box-trim:trim-start] [&>li:last-child>button]:[text-box-trim:trim-end]"
          }
        >
          {rest.map((o) => (
            <li key={o}>
              <button
                type="button"
                onClick={() => {
                  setInner(o);
                  onChange?.(o);
                  close();
                }}
                className={
                  variant === "v2"
                    ? "block w-full truncate rounded-[8px] px-[12px] py-[10px] text-left transition-colors duration-150 ease-out hover:bg-erp-thead-bg hover:text-erp-brand focus-visible:bg-erp-thead-bg"
                    : "block w-full text-left whitespace-nowrap hover:text-erp-brand"
                }
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      </Popup>
    </div>
  );
}
