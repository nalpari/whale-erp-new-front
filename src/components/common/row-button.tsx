import type { ComponentProps } from "react";

// 표 줄 안 작은 버튼(26px · 13px 500 · 2px 모서리) — 34px 버튼은 표 줄(46px) 안에서 무겁고 칸을 넘쳤다. 점선 알약(RoundButton)은 표 줄에서 버튼 느낌이
// 약했다(2026-11-20 사용자 지정). primary 는 그 줄의 주 동작(회청 바탕 · 흰 글자), outline 은 나머지(흰 바탕 · 회청 실선 · 먹색 글자). 호버는 다른 버튼처럼
// 색만 바뀐다 — primary 는 흰 바탕 · 먹색, outline 은 옅은 회색 바탕. 출·퇴근 현황 조회 「보정이 필요한 기록」 · 「일별 출퇴근」이 처음 쓴다
const TONE = {
  primary: "bg-erp-brand text-white hover:bg-white hover:text-erp-ink",
  outline: "bg-white text-erp-ink hover:bg-erp-subtle",
};

export function RowButton({ variant = "outline", ...props }: { variant?: keyof typeof TONE } & Omit<ComponentProps<"button">, "className" | "style" | "type">) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-[26px] shrink-0 cursor-pointer items-center justify-center rounded-[2px] border border-erp-brand px-[10px] text-[13px] font-medium whitespace-nowrap transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 ${TONE[variant]}`}
    />
  );
}
