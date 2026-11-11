"use client";

import Image from "next/image";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { SectionTitle } from "./guest-ui";
import type { Feature } from "./intro-sections";
import { FRAME } from "./theme";

// 「○○, 이렇게 달라집니다」의 펼침 목록 모양 — 토스페이 비즈니스 소개(보안 구역)처럼 기능마다 1px 선으로 나눈 줄이고,
// 지금 줄만 펼쳐져 왼쪽에 그림 카드, 오른쪽에 제목 · 설명 · 기능 목록이 나온다. 나머지 줄은 흐린 제목만 보인다(재무관리 · 프랜차이즈, 2026-11-10 사용자 지정).
// 스크롤하면 아래 줄이 차례로 저절로 펼쳐진다 — 목록은 화면에 붙어 있고(sticky), 구역 높이(기능 수 × 화면 높이 70%)만큼 스크롤하는 동안
// 스크롤 진행에 따라 펼친 줄이 바뀐다(매장운영 붙는 구역과 같은 방식). 줄 제목을 누르면 그 줄이 펼쳐지는 스크롤 자리로 옮긴다.
// 펼침 · 접힘은 grid 행 높이 전환(300ms)이고, 움직임 줄이기 설정이면 바로 바뀐다.
// 펼친 칸이 너무 높아 큰 제목 26px · 그림 260px · 간격을 줄였다(2026-11-10 사용자 지정).
// 글자 크기 · 색은 메인 카드와 같다 — 제목 남색, 설명 17px 본문색, 기능 목록 15px 먹색 동그라미 체크.
// 그림 칸은 사진 대신 화면 예시(screen-mocks.tsx)를 매장운영과 같은 구름 바탕에 띄운다(2026-11-10 사용자 지정).
export type AccordionFeature = Omit<Feature, "photo"> & { screen: ReactNode };

const STEP_VH = 70;
const HEADER = 110;

export function IntroFeaturesAccordion({ light, bold, items }: { light: string; bold: string; items: AccordionFeature[] }) {
  const [open, setOpen] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function update() {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const travel = el.offsetHeight - (window.innerHeight - HEADER);
      if (travel <= 0) return;
      const progress = Math.min(Math.max((HEADER - rect.top) / travel, 0), 0.9999);
      setOpen(Math.floor(progress * items.length));
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items.length]);

  // 줄 제목 — 그 줄이 펼쳐지는 스크롤 자리로 옮긴다. 주소는 바꾸지 않는다.
  function handleRowClick(i: number) {
    const el = sectionRef.current;
    if (!el) return;
    const travel = el.offsetHeight - (window.innerHeight - HEADER);
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER + (travel * (i + 0.5)) / items.length;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <section ref={sectionRef} className="relative bg-[#f1f7fc]" style={{ height: `${items.length * STEP_VH}vh` }}>
      {/* 창이 낮으면 위 여백 · 간격 · 줄 높이 · 그림 높이가 함께 줄어 목록 전체가 한 화면에 든다. 가운데 정렬은 넘칠 때 제목이 머리말 밑으로 들어가 위에서부터 쌓는다(PR #254 리뷰 B3). */}
      <div className={`${FRAME} sticky top-[110px] flex h-[calc(100vh-110px)] flex-col gap-[clamp(20px,4vh,48px)] pt-[clamp(24px,8vh,100px)]`}>
        <SectionTitle oneLine light={light} bold={bold} />
        <ul className="border-b border-[#d5e1ec]">
          {items.map((f, i) => {
            const isOpen = i === open;
            const [num, ...name] = f.no.split(" ");
            return (
              <li key={f.id} className="border-t border-[#d5e1ec]">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`accordion-${f.id}`}
                  onClick={() => handleRowClick(i)}
                  className={`flex w-full items-center py-[clamp(10px,2.2vh,24px)] text-left text-[28px] leading-[1.4] font-bold transition-colors duration-300 ease-out ${isOpen ? "text-guest-navy" : "text-guest-navy/30 hover:text-guest-navy/60"}`}
                >
                  <span className="inline-block w-[46px] shrink-0 text-guest-navy-soft">{num}</span>
                  {name.join(" ")}
                </button>
                <div id={`accordion-${f.id}`} inert={!isOpen} className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="min-h-0 overflow-hidden">
                    {/* 펼친 내용은 줄 제목 글자(번호 뒤)에 맞춰 46px 들여 쓰고, 그림이 왼쪽 · 글이 오른쪽이다(order-first). 그림 칸은 매장운영 그림 카드와 같은 520px 로 묶는다 — 반 폭이면 가로로 너무 길었다(2026-11-10 사용자 지정). */}
                    <div className="grid grid-cols-[520px_minmax(0,1fr)] items-center gap-[80px] pb-[clamp(14px,2.6vh,28px)] pl-[46px]">
                      <div className="flex flex-col gap-[20px]">
                        <div className="flex flex-col gap-[10px]">
                          <h3 className="text-[26px] leading-[1.4] font-bold text-guest-navy">
                            {f.title.map((line) => (
                              <span key={line} className="block">
                                {line}
                              </span>
                            ))}
                          </h3>
                          <p className="text-[17px] leading-[1.6] text-guest-body">
                            {f.lead.map((line) => (
                              <span key={line} className="block">
                                {line}
                              </span>
                            ))}
                          </p>
                        </div>
                        <ul className="flex flex-col gap-[8px] text-[15px] leading-[1.5] text-guest-ink">
                          {f.points.map((point) => (
                            <li key={point} className="flex items-center gap-[10px]">
                              <Image src="/guest/check-circle.svg" alt="" width={18} height={18} />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="relative order-first h-[clamp(180px,calc(100vh-560px),260px)] overflow-hidden rounded-[24px] border border-[#e3ebf3] bg-white">
                        <Image src="/guest/billboard-bg.png" alt="" fill sizes="720px" className="object-cover" style={{ objectPosition: `${15 + i * 25}% 60%` }} />
                        <span className="absolute inset-0 bg-white/20" />
                        <div className="relative flex h-full items-center justify-center">
                          <div className="origin-center [@media(max-height:820px)]:scale-[0.78]">{f.screen}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
