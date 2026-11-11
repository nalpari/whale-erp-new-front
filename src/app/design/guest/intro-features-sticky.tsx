"use client";

import Image from "next/image";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SectionTitle, TRIM } from "./guest-ui";
import type { Feature } from "./intro-sections";
import { BUTTON_MOTION, FRAME } from "./theme";

function Lines({ lines }: { lines: string[] }) {
  return lines.map((line) => (
    <span key={line} className="block">
      {line}
    </span>
  ));
}

// 「○○, 이렇게 달라집니다」 — 제목 줄(제목 + 네 바로가기)과 그 아래 그림 · 글 칸이 화면에 붙어 있고,
// 스크롤하는 동안 그림 · 글만 네 기능 차례로 서서히 바뀐다. 지금 기능의 바로가기는 채워져 보인다(네이버페이 커넥트 소개 참고, 2026-11-10 사용자 지정).
// 구역 높이는 기능 수 × 화면 높이 80% 라 그만큼 스크롤하는 동안 붙어 있다. 그림(520×600)과 글(640) 묶음을 본문 가운데에, 글은 그림 세로 가운데에 둔다.
// 구역 여백은 메인과 같다 — 바탕은 연하늘(#f1f7fc, 짙은 남색 · 회청은 너무 강해 되돌렸다, 2026-11-11), 붙어 있는 동안 제목이 구역 위에서 100px 아래에 선다.
// 그림 · 글 칸은 화면 아래 24px 까지 세로로 길게 쓴다 — 머리 110 + 위 여백 + 제목 줄 78 + 간격 + 아래 24 를 뺀 높이. 위 여백(24~100) · 간격(24~60)은 창 높이에 따라 줄고,
// 칸이 낮으면 화면 조각을 비율 그대로 줄인다 — 낮은 노트북(1366×768 등)에서 카드 아래 · 글이 잘렸다(PR #254 리뷰 B3, 2026-11-10).
// 움직임 줄이기 설정이면 바뀔 때 서서히 겹치지 않고 바로 바뀐다(motion-reduce:transition-none).
const STEP_VH = 80;
const HEADER = 110;

// 그림 칸에는 사진 대신 실제 화면 조각(screen-mocks.tsx)을 메인 첫 화면과 같은 구름 바탕 위에 원래 크기로 띄운다 — 키우면 점포 상세가 칸 위아래에 붙었다(2026-11-10 사용자 지정).
// 한 기능에 화면이 둘 · 셋이면(screens) 그 기능의 스크롤 구간을 다시 나눠 화면을 좌우로 차례로 넘긴다 — 아래 점이 몇 번째 화면인지 보인다(2026-11-10 사용자 지정).
export type StickyFeature = Omit<Feature, "photo"> & { screens: ReactNode[] };

export function IntroFeaturesSticky({ light, bold, items }: { light: string; bold: string; items: StickyFeature[] }) {
  const [active, setActive] = useState(0);
  const [sub, setSub] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const articleRefs = useRef<(HTMLElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const [screenScale, setScreenScale] = useState(1);

  // 창이 낮거나 좁아 그림 칸이 작아지면 화면 조각을 비율 그대로 줄인다 — 가장 큰 조각(높이 460 · 폭 470px)에 여백을 더한 500px 기준, 높이 · 폭 중 작은 쪽(폭은 2026-11-11 추가 — 좁은 화면에서 조각이 칸 밖으로 잘렸다).
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setScreenScale(Math.min(1, el.clientHeight / 500, el.clientWidth / 500)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const [shift, setShift] = useState(0);

  // 지금 기능 글의 가운데를 글 칸 가운데에 맞추는 만큼 줄을 올린다. 글 길이가 기능마다 달라 실제 높이를 잰다.
  useLayoutEffect(() => {
    function measure() {
      const view = viewRef.current;
      const el = articleRefs.current[active];
      if (!view || !el) return;
      setShift(view.clientHeight / 2 - (el.offsetTop + el.offsetHeight / 2));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  useEffect(() => {
    function update() {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const travel = el.offsetHeight - (window.innerHeight - HEADER);
      if (travel <= 0) return;
      const progress = Math.min(Math.max((HEADER - rect.top) / travel, 0), 0.9999);
      const at = progress * items.length;
      const index = Math.floor(at);
      setActive(index);
      setSub(Math.floor((at - index) * items[index].screens.length));
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);

  // 바로가기 — 그 기능이 보이는 스크롤 자리로 옮긴다. 주소는 바꾸지 않는다(뒤로가기가 쌓이지 않게).
  function handleShortcut(i: number) {
    const el = sectionRef.current;
    if (!el) return;
    const travel = el.offsetHeight - (window.innerHeight - HEADER);
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER + (travel * (i + 0.5)) / items.length;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }

  const offsets = items.map((_, i) => items.slice(0, i).reduce((n, f) => n + f.screens.length, 0));
  const slide = offsets[active] + sub;

  return (
    <section ref={sectionRef} className="relative bg-[#f1f7fc]" style={{ height: `${items.length * STEP_VH}vh` }}>
      <div className={`${FRAME} sticky top-[110px] flex h-[calc(100vh-110px)] flex-col gap-[var(--gap)] pt-[var(--pt)] [--gap:clamp(24px,5vh,60px)] [--h:calc(100vh-212px-var(--pt)-var(--gap))] max-[1500px]:[--h:calc(100vh-260px-var(--pt)-var(--gap))] [--pt:clamp(24px,8vh,100px)]`}>
        <div className="flex flex-wrap items-end justify-between gap-x-[24px] gap-y-[16px]">
          <SectionTitle oneLine light={light} bold={bold} />
          <nav className="flex gap-[8px]">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                aria-current={i === active || undefined}
                onClick={() => handleShortcut(i)}
                className={`flex h-[48px] items-center rounded-[6px] border px-[18px] text-[18px] leading-[1.5] font-semibold whitespace-nowrap ${BUTTON_MOTION} ${i === active ? "border-guest-navy bg-guest-navy text-white" : "border-guest-button-line bg-white text-guest-navy hover:border-guest-navy"}`}
              >
                {item.tab}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center justify-center gap-[clamp(40px,6vw,120px)]">
          {/* 그림 — 메인 「시작 방법」 카드처럼 12px 흰 테두리 안에 24px 둥근 구름 칸. 모두 겹쳐 두고 지금 기능의 화면만 보인다. */}
          <div className="flex h-[var(--h)] w-[clamp(400px,30vw,520px)] shrink-0 flex-col rounded-[32px] border border-[#e3ebf3] bg-white p-[12px]">
            <div ref={panelRef} className="relative min-h-0 flex-1 overflow-hidden rounded-[24px]">
            {/* 네이버페이 커넥트처럼 화면 조각이 같은 칸 안에서 좌우로 밀려 바뀐다 — 다음 기능은 오른쪽에서 들어온다. 구름 바탕은 조금만 따라 움직여(시차) 하늘이 이어져 보인다(2026-11-10 사용자 지정). */}
            <div className="absolute inset-0 bg-[#e9eff6]">
              <Image
                src="/guest/billboard-bg.png"
                alt=""
                fill
                sizes="520px"
                className="object-cover transition-[object-position] duration-700 ease-out motion-reduce:transition-none"
                style={{ objectPosition: `${15 + active * 25}% 60%` }}
              />
              <span className="absolute inset-0 bg-white/20" />
            </div>
            <div
              className="relative flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ transform: `translateX(${slide * -100}%)` }}
            >
              {items.flatMap((f, i) =>
                f.screens.map((screen, j) => (
                  <div key={`${f.id}-${j}`} aria-hidden={offsets[i] + j !== slide} className="flex h-full w-full shrink-0 items-center justify-center">
                    <div style={{ scale: screenScale }}>{screen}</div>
                  </div>
                )),
              )}
            </div>
            {items[active].screens.length > 1 && (
              <div aria-hidden className="absolute inset-x-0 bottom-[14px] flex justify-center gap-[6px]">
                {items[active].screens.map((_, j) => (
                  <span key={j} className={`h-[6px] rounded-full transition-all duration-300 ease-out motion-reduce:transition-none ${j === sub ? "w-[18px] bg-guest-navy" : "w-[6px] bg-guest-navy/30"}`} />
                ))}
              </div>
            )}
            </div>
            {/* 카드는 연하늘 바탕보다 한 단계 진한 1px 선(#e3ebf3)으로 두른다(2026-11-10 사용자 지정). */}
            {/* 카드 아래 흰 칸에 기능 이름 — 메인 「시작 방법」 카드 제목과 같은 「01 이름」 22px 굵게(번호 연한 남색). */}
            <div className="relative h-[67px] shrink-0">
              {items.map((f, i) => (
                <p
                  key={f.id}
                  aria-hidden={i !== active}
                  className={`absolute inset-x-0 top-0 px-[22px] pt-[20px] text-[22px] leading-[1.4] font-bold text-guest-navy transition-opacity duration-500 ease-out motion-reduce:transition-none ${i === active ? "opacity-100" : "opacity-0"}`}
                >
                  <span className="mr-[8px] text-guest-navy-soft">{f.no.split(" ")[0]}</span>
                  {f.no.split(" ").slice(1).join(" ")}
                </p>
              ))}
            </div>
          </div>
          {/* 글 — 네이버페이 커넥트처럼 네 기능 글을 세로로 이어 두고, 지금 기능을 칸 가운데로 밀어 올린다. 앞 · 뒤 기능은 위아래로 흐리게 걸쳐 보여
              「스크롤하면 다음 기능이 나온다」를 알린다(2026-11-10 사용자 지정). 기능 사이 72px, 위아래 끝 8% 만 흐리게 지운다 — 더 지우면 앞 · 뒤 글이 안 보였다. */}
          <div
            ref={viewRef}
            className="relative h-[var(--h)] w-[clamp(440px,36vw,640px)] shrink-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)]"
          >
            <div
              className="flex flex-col gap-[72px] transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ transform: `translateY(${shift}px)` }}
            >
              {items.map((f, i) => (
                <article
                  key={f.id}
                  ref={(el) => {
                    articleRefs.current[i] = el;
                  }}
                  aria-hidden={i !== active}
                  className={`flex shrink-0 flex-col gap-[28px] text-guest-ink transition-opacity duration-500 ease-out motion-reduce:transition-none ${i === active ? "opacity-100" : "pointer-events-none opacity-30"}`}
                >
                  <div className="flex flex-col gap-[18px]">
                    <div className="flex flex-col gap-[8px]">
                      {/* 「01 점포 관리」 이름은 그림 카드 아래에만 둔다 — 글 위에도 있으면 같은 말이 두 번이었다(2026-11-10 사용자 지정). */}
                      <h3 className="text-[34px] leading-[1.4] font-bold text-guest-navy">
                        <Lines lines={f.title} />
                      </h3>
                    </div>
                    <p className={`text-[17px] leading-[1.6] text-guest-body ${TRIM}`}>
                      <Lines lines={f.lead} />
                    </p>
                  </div>
                  {/* 글자 크기 · 색은 메인 카드와 같다 — 설명 17px 본문색, 기능 목록 15px 먹색 동그라미 체크(2026-11-10 사용자 지정). */}
                  <ul className="flex flex-col gap-[12px] text-[15px] leading-[1.5] text-guest-ink">
                    {f.points.map((point) => (
                      <li key={point} className="flex items-center gap-[10px]">
                        <Image src="/guest/check-circle.svg" alt="" width={18} height={18} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
