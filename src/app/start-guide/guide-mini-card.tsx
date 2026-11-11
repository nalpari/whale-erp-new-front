"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { GuideIcon, usePanelOpen } from "@/components/common";
import { GUIDE_STEPS, type GuideTrack, guideDetailOf } from "@/lib/start-guide";

// 시작 가이드 미니 카드(2026-11-11 사용자 지정) — 시작 가이드의 [OO로 가기]로 넘어온 실제 화면 오른쪽 아래에 그 단계의 순서 · 안내를 작게 띄운다.
// 넘어와서 「무엇을 입력하랬지, 무엇이 중요했지」를 잊지 않게 하려는 것이다. AdminFrame 에 한 번만 두고, 지금 화면 주소(탭 BP 접두를 뗀 것)와
// 가이드 칸의 화면 주소(part.path)가 같은 칸들을 보인다 — 화면 파일(1팀 · 3팀)은 건드리지 않는다.
// 주소의 ?guide=<갈래>-<단계>(예: STORE-1)로 넘어올 때만 뜨고, 넘어온 화면을 기억해 그 화면에 있는 동안(검색 · 쪽 넘김으로 주소의 guide 가
// 빠져도) 남는다. 다른 화면으로 가면 사라진다. 메뉴로 들어오면 뜨지 않는다.
// 바탕을 덮지 않아 펴 둔 채로 입력할 수 있다. 오른쪽에서 패널(464px)이 열리면 그 왼쪽으로 비켜 선다.
// 모양은 떠 있는 것이라 팝업 그림자 하나(DESIGN.md Elevation), 꼬리표는 시작 가이드와 같은 포인트 파랑이다.

const TRACKS: GuideTrack[] = ["STORE", "HQ", "FRANCHISEE"];

/** guide 값(「STORE-1」)을 갈래 · 단계로 — 모르는 값이면 null(카드를 띄우지 않는다) */
function parseGuide(guide: string | null): { track: GuideTrack; step: string } | null {
  const m = guide?.match(/^([A-Z]+)-(\d+)$/);
  if (!m || !TRACKS.includes(m[1] as GuideTrack)) return null;
  const track = m[1] as GuideTrack;
  return GUIDE_STEPS[track].some((s) => s.label === `STEP ${m[2]}`) ? { track, step: m[2] } : null;
}

/** 탭 BP 접두(/bp/{id})를 뗀 화면 주소 — 가이드 칸의 path 는 접두 없이 적혀 있다 */
const screenPathOf = (pathname: string) => pathname.replace(/^\/bp\/\d+(?=\/)/, "");

/** 문구 안 <u>…</u> 만 밑줄 — 시작 가이드 화면과 같다 */
function underlined(text: string) {
  return text.split(/<u>(.*?)<\/u>/).map((piece, i) => (i % 2 === 1 ? <u key={i}>{piece}</u> : piece));
}

export function GuideMiniCardSlot() {
  const pathname = usePathname();
  const params = useSearchParams();
  const panelOpen = usePanelOpen();
  const asked = params.get("guide");
  // 넘어온 가이드와 그 화면 — 주소에서 guide 가 빠져도 같은 화면에 있는 동안 남긴다
  const [active, setActive] = useState<{ guide: string; path: string } | null>(null);
  const [open, setOpen] = useState(true);
  const [seen, setSeen] = useState<string | null>(null);
  const path = screenPathOf(pathname);

  // 가이드에서 새로 넘어오면(주소의 guide · 화면이 바뀌면) 그 단계로 바꾸고 펼친다 — effect 가 아니라 렌더 중 이전 값과 견줘 맞춘다(React 권장)
  const arrival = asked && parseGuide(asked) ? `${asked}|${path}` : null;
  if (arrival && arrival !== seen) {
    setSeen(arrival);
    setActive({ guide: asked as string, path });
    setOpen(true);
  }

  if (!active || active.path !== path) return null;
  const parsed = parseGuide(active.guide);
  if (!parsed) return null;
  const parts = guideDetailOf(parsed.track, parsed.step).parts.filter((p) => p.path === path);
  if (parts.length === 0) return null;
  const stepTitle = GUIDE_STEPS[parsed.track].find((s) => s.label === `STEP ${parsed.step}`)?.title ?? "";
  const back = `/start-guide?track=${parsed.track}&step=${parsed.step}`;
  // 오른쪽 패널(464px)이 열려 있으면 그 왼쪽 24px 에 선다
  const right = panelOpen ? "right-[488px]" : "right-[24px]";

  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed ${right} bottom-[24px] z-40 flex h-[40px] items-center gap-[8px] rounded-full border border-erp-brand bg-white px-[16px] text-[14px] font-medium text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] transition-colors duration-150 ease-out hover:bg-erp-point-subtle`}
      >
        <span className="flex h-[20px] items-center rounded-full bg-erp-point-bg px-[8px] text-[11px] font-semibold text-erp-point">
          STEP {parsed.step}
        </span>
        시작 가이드 펼치기
      </button>
    );

  return (
    <aside
      aria-label="시작 가이드"
      className={`fixed ${right} bottom-[24px] z-40 flex max-h-[calc(100dvh-160px)] w-[420px] flex-col rounded-[6px] border border-erp-brand bg-white shadow-[0_2px_6px_rgba(40,47,55,0.08)]`}
    >
      <header className="flex h-[46px] shrink-0 items-center gap-[8px] border-b border-erp-panel-line px-[16px]">
        <span className="flex h-[20px] items-center rounded-full bg-erp-point-bg px-[8px] text-[11px] font-semibold text-erp-point">
          STEP {parsed.step}
        </span>
        <b className="min-w-0 flex-1 truncate text-[15px] font-semibold text-erp-ink">{stepTitle}</b>
        <button type="button" onClick={() => setOpen(false)} className="text-[13px] text-erp-label hover:text-erp-ink">
          접기
        </button>
        <button type="button" aria-label="시작 가이드 닫기" onClick={() => setActive(null)} className="text-[16px] leading-none text-erp-label hover:text-erp-ink">
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
