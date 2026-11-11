"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GuideIcon, usePanelOpen } from "@/components/common";
import { stripBp } from "@/lib/bp-path";
import { GUIDE_STEPS, type GuideArrival, nextArrival, parseGuide, partsOnScreen } from "@/lib/start-guide";

// 시작 가이드 미니 카드(2026-11-11 사용자 지정) — 시작 가이드의 [OOO로 가기]로 넘어온 실제 화면 오른쪽 아래에 그 단계의 순서 · 안내를 작게 띄운다.
// 넘어와서 「무엇을 입력하랬지, 무엇이 중요했지」를 잊지 않게 하려는 것이다. AdminFrame 에 한 번만 두고, 지금 화면 주소(탭 BP 접두를 뗀 것)와
// 그 단계 칸의 화면(part.path · 이어 넘어가는 nextPaths)인 칸들을 보인다 — 화면 파일(1팀 · 3팀)은 건드리지 않는다.
// 주소의 ?guide=<갈래>-<단계>(예: STORE-1)로 넘어올 때만 뜨고, 넘어온 화면을 기억해 그 화면에 있는 동안(검색 · 쪽 넘김으로 주소의 guide 가
// 빠져도, 이어 넘어가는 화면에서도) 남는다. 그 단계와 상관없는 화면으로 가면 사라진다. 메뉴로 들어오면 뜨지 않는다. 판정은 lib(nextArrival)에 있다.
// 바탕을 덮지 않아 펴 둔 채로 입력할 수 있다. 오른쪽에서 패널(464px)이 열리면 그 왼쪽으로 비켜 선다. 머리 줄을 끌어 옮길 수 있다.
// 패널 바탕창(z-[5]) · 패널(z-10)보다 위(z-40)라 바탕창이 떠도 카드는 읽고 접을 수 있다 — 패널을 연 채 가이드를 보게 일부러 그렇다.
// 모양은 떠 있는 것이라 팝업 그림자 하나(DESIGN.md Elevation), 꼬리표는 시작 가이드와 같은 포인트 파랑이다.

/** 문구 안 <u>…</u> 만 밑줄 — 놓치면 안 되는 말만 짚는다(시작 가이드 화면과 같이 쓴다, 2026-11-11 사용자 지정). 다른 태그는 글자 그대로다 */
export function underlined(text: string) {
  return text.split(/<u>(.*?)<\/u>/).map((piece, i) => (i % 2 === 1 ? <u key={i}>{piece}</u> : piece));
}

/** 카드 폭 · 머리 줄 높이 — 창을 줄였을 때 머리 줄이 화면 안에 남게 붙잡는 데 쓴다 */
const CARD_WIDTH = 420;
const HEAD_HEIGHT = 46;

export function GuideMiniCardSlot() {
  const pathname = usePathname();
  const params = useSearchParams();
  const panelOpen = usePanelOpen();
  const asked = params.get("guide");
  // 넘어온 가이드 — 주소에서 guide 가 빠져도 그 단계의 화면에 있는 동안 남긴다(nextArrival)
  const [arrival, setArrival] = useState<GuideArrival>({ guide: null, seen: null });
  const [open, setOpen] = useState(true);
  // 사용자가 머리 줄을 끌어 옮긴 자리(왼쪽 위 기준, px) — 없으면 오른쪽 아래 기본 자리(2026-11-11 사용자 지정)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const boxRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const collapseRef = useRef<HTMLButtonElement>(null);
  const screen = stripBp(pathname);

  // 주소 · 화면이 바뀔 때마다 렌더 중 이전 값과 견줘 맞춘다(effect 대신, React 권장). 새로 넘어오면 펼치고 옮긴 자리도 처음(오른쪽 아래)으로
  const next = nextArrival(arrival, asked, screen);
  if (next !== arrival) {
    if (next.seen !== arrival.seen && next.guide) {
      setOpen(true);
      setPos(null);
    }
    setArrival(next);
  }

  // 옮긴 뒤 창을 줄이면 카드가 화면 밖에 갇혀 [접기] · [×]를 누를 수 없었다 — 창 크기가 바뀌면 머리 줄이 보이게 다시 붙잡는다(코드 리뷰)
  useEffect(() => {
    const clamp = () =>
      setPos((p) => p && { left: Math.max(0, Math.min(p.left, window.innerWidth - CARD_WIDTH)), top: Math.max(0, Math.min(p.top, window.innerHeight - HEAD_HEIGHT)) });
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, []);

  /** 접기 · 펼치기 뒤 포커스를 반대쪽 버튼으로 옮긴다 — 언마운트로 포커스가 body 로 빠지지 않게(공통 패널이 연 버튼으로 돌려주는 것과 같은 뜻, 코드 리뷰) */
  const toggle = (next: boolean) => {
    setOpen(next);
    requestAnimationFrame(() => (next ? collapseRef : pillRef).current?.focus());
  };

  /** 머리 줄을 잡고 끌면 카드를 옮긴다 — 화면 가장자리 안에서만 움직인다. 머리 줄의 버튼([접기] · [×])을 누른 것은 끌기가 아니다 */
  const handleDragStart = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const left = Math.min(Math.max(ev.clientX - dx, 0), window.innerWidth - rect.width);
      const top = Math.min(Math.max(ev.clientY - dy, 0), window.innerHeight - rect.height);
      setPos({ left, top });
    };
    const end = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", end);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
    e.preventDefault();
  };

  const parsed = parseGuide(next.guide);
  if (!parsed) return null;
  const parts = partsOnScreen(parsed, screen);
  if (parts.length === 0) return null;
  const stepTitle = GUIDE_STEPS[parsed.track].find((s) => s.label === `STEP ${parsed.step}`)?.title ?? "";
  const back = `/start-guide?track=${parsed.track}&step=${parsed.step}`;
  // 기본 자리는 오른쪽 아래, 오른쪽 패널(464px)이 열려 있으면 그 왼쪽 24px. 사용자가 옮겼으면 그 자리(패널이 열려도 그대로)
  const place = pos ? "" : `${panelOpen ? "right-[488px]" : "right-[24px]"} bottom-[24px]`;
  const placeStyle = pos ? { left: pos.left, top: pos.top } : undefined;

  if (!open)
    return (
      <button
        ref={pillRef}
        type="button"
        aria-expanded={false}
        onClick={() => toggle(true)}
        style={placeStyle}
        className={`fixed ${place} z-40 flex h-[40px] items-center gap-[8px] rounded-full border border-erp-brand bg-white px-[16px] text-[14px] font-medium text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] transition-colors duration-150 ease-out hover:bg-erp-point-subtle`}
      >
        <span className="flex h-[20px] items-center rounded-full bg-erp-point-bg px-[8px] text-[11px] font-semibold text-erp-point">
          STEP {parsed.step}
        </span>
        시작 가이드 펼치기
      </button>
    );

  return (
    <aside
      ref={boxRef}
      aria-label="시작 가이드"
      style={placeStyle}
      className={`fixed ${place} z-40 flex max-h-[calc(100dvh-160px)] w-[420px] flex-col rounded-[6px] border border-erp-brand bg-white shadow-[0_2px_6px_rgba(40,47,55,0.08)]`}
    >
      {/* 머리 줄을 잡고 끌어 옮긴다(이동 커서) — touch-none 이라 터치로 끌어도 화면이 스크롤되지 않는다 */}
      <header
        onPointerDown={handleDragStart}
        title="끌어서 옮길 수 있습니다"
        className="flex h-[46px] shrink-0 cursor-move touch-none items-center gap-[8px] border-b border-erp-panel-line px-[16px] select-none"
      >
        <span className="flex h-[20px] items-center rounded-full bg-erp-point-bg px-[8px] text-[11px] font-semibold text-erp-point">
          STEP {parsed.step}
        </span>
        <b className="min-w-0 flex-1 truncate text-[15px] font-semibold text-erp-ink">{stepTitle}</b>
        <button ref={collapseRef} type="button" aria-expanded onClick={() => toggle(false)} className="text-[13px] text-erp-label hover:text-erp-ink">
          접기
        </button>
        <button type="button" aria-label="시작 가이드 닫기" onClick={() => setArrival({ ...next, guide: null })} className="text-[16px] leading-none text-erp-label hover:text-erp-ink">
          ×
        </button>
      </header>
      <div className="flex min-h-0 flex-col gap-[16px] overflow-y-auto px-[16px] py-[14px]">
        {parts.map((part) => (
          <section key={part.title} className="flex flex-col gap-[8px]">
            <h3 className="flex items-baseline gap-[6px] text-[15px] font-semibold text-erp-ink">
              {part.label && <span className="text-erp-point">{part.label}</span>}
              {part.title}
            </h3>
            <ol className="flex list-decimal flex-col gap-[4px] pl-[18px] text-[14px] leading-[1.6] text-erp-ink">
              {part.actions.map((a) => (
                <li key={a} className="whitespace-pre-line">
                  {underlined(a)}
                </li>
              ))}
            </ol>
            {part.tip?.split("\n\n").map((t) => (
              <p key={t} className="flex items-start gap-[6px] whitespace-pre-line text-[14px] leading-[1.6] font-medium text-erp-ink">
                <span className="mt-[2px] flex shrink-0">
                  <GuideIcon offset />
                </span>
                {t}
              </p>
            ))}
          </section>
        ))}
      </div>
      <footer className="flex shrink-0 justify-end border-t border-erp-panel-line px-[16px] py-[10px]">
        <Link href={back} className="text-[14px] font-medium text-erp-point hover:underline">
          ‹ 가이드로 돌아가기
        </Link>
      </footer>
    </aside>
  );
}
