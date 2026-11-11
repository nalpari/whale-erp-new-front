"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Moment } from "./intro-sections";
import { FRAME } from "./theme";

// 「사장님, 이런 순간 있으셨죠?」를 한 장씩 넘기는 큰 띠로 — 참고 사이트 첫 화면처럼 짙은 바탕 위에 흰 큰 문장 · 설명, 아래 「01 ─── 04」 진행 표시와 ‹ › 버튼(매장운영, 2026-11-11 사용자 지정).
// 한 장은 순간 하나다: 작은 회색 글(도입 전 질문) → 큰 흰 문장(도입 후) → 설명. 6초마다 다음 장으로 넘어가고, 마우스를 올리거나 움직임 줄이기 설정이면 멈춘다.
const AUTO_MS = 6000;

export function IntroMomentsSlider({ light, bold, items, photos }: { light: string; bold: string; items: Moment[]; photos: string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % items.length), AUTO_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, items.length]);

  const go = (step: number) => setIndex((i) => (i + step + items.length) % items.length);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="relative overflow-hidden bg-[#1c2630] py-[100px] text-white" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* 장마다 실사 사진을 배경으로 깔고 서서히 바꾼다. 왼쪽은 글이 읽히게 짙게, 오른쪽으로 갈수록 사진이 드러난다(2026-11-11 사용자 지정). */}
      {photos.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="100vw"
          className={`object-cover transition-opacity duration-1000 ease-out motion-reduce:transition-none ${i === index ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <span className="absolute inset-0 bg-gradient-to-r from-[#1c2630]/95 via-[#1c2630]/75 to-[#1c2630]/25" />
      <div className={`${FRAME} relative flex flex-col gap-[48px]`}>
        <p className="text-[20px] leading-[1.5] font-semibold text-white/60">
          {light} {bold}
        </p>
        <div className="relative min-h-[260px]">
          {items.map((m, i) => (
            <div
              key={m.after.title}
              aria-hidden={i !== index}
              className={`absolute inset-0 flex flex-col gap-[28px] transition-[opacity,translate] duration-700 ease-out motion-reduce:transition-none ${i === index ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[12px] opacity-0"}`}
            >
              <p className="text-[20px] leading-[1.5] text-white/55">{m.before.title.split("\n").join(" ")}</p>
              <h2 className="text-[56px] leading-[1.25] font-bold tracking-[-0.025em]">
                {m.after.title.split("\n").map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h2>
              <p className="text-[20px] leading-[1.6] text-white/80">{m.after.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-[24px]">
          <span className="text-[18px] font-semibold">{pad(index + 1)}</span>
          <span className="relative h-[2px] w-[200px] bg-white/25">
            <span className="absolute inset-y-0 left-0 bg-white transition-[width] duration-500 ease-out" style={{ width: `${((index + 1) / items.length) * 100}%` }} />
          </span>
          <span className="text-[18px] text-white/50">{pad(items.length)}</span>
          <div className="ml-[40px] flex gap-[10px]">
            {[
              { step: -1, label: "이전 순간", d: "M14 6l-6 6 6 6" },
              { step: 1, label: "다음 순간", d: "M10 6l6 6-6 6" },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                aria-label={b.label}
                onClick={() => go(b.step)}
                className="flex size-[48px] items-center justify-center rounded-full border border-white/40 text-white transition-colors duration-200 hover:bg-white/15"
              >
                <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={b.d} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
