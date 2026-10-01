"use client";

import Image from "next/image";
import { useState } from "react";
import { Popup, useDropdown } from "./popup";
import { EASE_OUT } from "./theme";

// Figma Select_top. 헤더 오른쪽의 둥근 점포 선택칸. 목록은 위에서부터 펼쳐진다.
// 선택된 점포는 목록에서 빠진다(Figma 기준). 남는 항목이 없으면(점포가 하나) 트리거를 비활성으로 둔다.
// 화살표 키 탐색을 따로 두지 않으므로 ARIA listbox 대신 disclosure(aria-expanded + 버튼 목록)로 둔다.
// 감싸는 div 만 flex-1 로 남는 폭을 먹어 오른쪽 아이콘들을 끝으로 밀고, 선택칸과 목록은 420px 고정이다(둘이 같은 값이어야 한다).
export function StoreSelect({
  options,
  value: controlled,
  defaultValue = options[0] ?? "",
  onChange,
  label = "점포",
  placeholder = `${label} 선택`,
}: {
  options: string[];
  label?: string;
  placeholder?: string;
} & (
  // 제어 모드는 고른 값을 되돌려 줄 onChange 와 짝으로만 쓸 수 있다. 짝이 없으면 목록은 닫히는데 값은 그대로다.
  | { value: string; onChange: (value: string) => void; defaultValue?: never }
  | { value?: never; defaultValue?: string; onChange?: (value: string) => void }
)) {
  const { open, setOpen, close, ref, trigger, id } = useDropdown();
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const rest = options.filter((o) => o !== value);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${label}: ${value || placeholder}`}
        disabled={rest.length === 0}
        onClick={() => setOpen(!open)}
        className="flex h-[42px] w-[420px] items-center gap-[10px] rounded-full border border-erp-field-line bg-erp-thead-bg px-[18px] text-left text-[14px] text-erp-ink"
      >
        <span className="flex-1 truncate">{value || placeholder}</span>
        <Image
          src="/icons/chevron-small-brand.svg"
          alt=""
          width={5}
          height={8}
          className={`transition-transform duration-200 ${EASE_OUT} ${open ? "rotate-90" : "-rotate-90"}`}
        />
      </button>
      {/* 선택칸이 둥글어 목록도 모서리를 키우고, 항목마다 줄 배경으로 올린 위치를 보여 준다.
          그림자는 fold 전환의 clip-path 여유(8px) 안에 들어가게 작게 둔다. */}
      <Popup
        id={id}
        open={open}
        motion="fold"
        className="left-0 w-[420px] rounded-[12px]! border-erp-field-line! p-[6px]! shadow-[0_2px_6px_rgba(40,47,55,0.08)]"
      >
        <ul aria-label={label} className="text-[14px] text-erp-ink">
          {rest.map((o) => (
            <li key={o}>
              <button
                type="button"
                onClick={() => {
                  setInner(o);
                  onChange?.(o);
                  close();
                }}
                className="block w-full truncate rounded-[8px] px-[12px] py-[10px] text-left transition-colors duration-150 ease-out hover:bg-erp-thead-bg hover:text-erp-brand focus-visible:bg-erp-thead-bg"
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
