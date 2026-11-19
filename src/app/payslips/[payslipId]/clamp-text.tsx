"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * 처리내역 내용 — 두 줄까지만 보이고 넘치면 [더보기]로 펼친다. 칸을 한꺼번에 많이 고친 「수정」 줄이 여러 줄로 길어 상자를 밀었다
 * (2026-11-19 사용자 지정). 넘치지 않는 줄에는 버튼을 두지 않는다 — 그린 뒤 실제 높이로 잰다
 */
export function ClampText({ text }: { text: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [overflow, setOverflow] = useState(false);
  useLayoutEffect(() => {
    const el = box.current;
    if (el && !open) setOverflow(el.scrollHeight > el.clientHeight + 1);
  }, [text, open]);
  return (
    <span className="flex min-w-0 flex-1 flex-col items-start">
      <span ref={box} className={`leading-[1.6] text-erp-ink ${open ? "" : "line-clamp-2"}`}>
        {text}
      </span>
      {(overflow || open) && (
        <button type="button" aria-expanded={open} className="cursor-pointer text-[13px] font-medium text-erp-link hover:underline" onClick={() => setOpen((v) => !v)}>
          {open ? "접기" : "더보기"}
        </button>
      )}
    </span>
  );
}
