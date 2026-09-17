"use client";

import Image from "next/image";
import { useRef, useState, type ComponentProps } from "react";
import { FIELD } from "./theme";

// ref 는 안쪽에서 지우기 뒤 포커스를 옮기는 데 쓰므로 받지 않는다.
type Props = Omit<ComponentProps<"input">, "type" | "value" | "defaultValue" | "onChange" | "className" | "ref"> & {
  /** 넘기면 제어 모드, 안 넘기면 내부 상태로 동작한다. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSearch?: (value: string) => void;
};

// 검색 입력칸. 브라우저 기본 지우기(X) 버튼을 숨기고, 값이 있을 때만 같은 선 굵기(1.5)의 X 를 보여 준다.
// Figma 에 지우기 아이콘이 없어 기존 아이콘의 선 굵기(1.5)에 맞춰 그렸다. 색은 erp-label, 호버 때 erp-ink.
export function SearchField({ value: controlled, defaultValue = "", onValueChange, onSearch, onKeyDown, ...props }: Props) {
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const input = useRef<HTMLInputElement>(null);
  const change = (next: string) => {
    setInner(next);
    onValueChange?.(next);
  };

  return (
    <div className="relative">
      <input
        {...props}
        ref={input}
        type="search"
        value={value}
        onChange={(e) => change(e.target.value)}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          // 한글 조합 중 Enter 는 조합 확정용이라 검색하지 않는다(조합이 끝난 뒤 한 번 더 온다).
          if (e.key === "Enter" && !e.nativeEvent.isComposing) onSearch?.(value);
        }}
        className={`${FIELD} pr-[52px] [&::-webkit-search-cancel-button]:appearance-none`}
      />
      <button
        type="button"
        aria-label="입력 지우기"
        inert={!value}
        onClick={() => {
          change("");
          input.current?.focus();
        }}
        className={`group absolute top-1/2 right-[32px] grid size-[18px] -translate-y-1/2 place-items-center rounded-full bg-erp-subtle transition-[opacity,background-color] duration-150 ease-out hover:bg-erp-field-line ${
          value ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <svg viewBox="0 0 8 8" className="size-[8px] stroke-erp-label transition-colors duration-150 ease-out group-hover:stroke-erp-ink" aria-hidden>
          <path d="M1 1l6 6M7 1L1 7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="검색"
        onClick={() => onSearch?.(value)}
        className="absolute top-0 right-0 grid size-[34px] place-items-center"
      >
        <Image src="/icons/search.svg" alt="" width={12} height={12} />
      </button>
    </div>
  );
}
