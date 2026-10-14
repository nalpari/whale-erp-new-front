"use client";

import { type ReactNode, useState, useSyncExternalStore } from "react";
import { HOVER } from "../theme";

const TABS = [
  { key: "notices", label: "공지사항" },
  { key: "faq", label: "FAQ" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// 탭을 바꾸면 새 패널이 서서히 나타난다. hidden 이 풀려 다시 그려질 때마다 애니메이션이 처음부터 돈다(guest-fade 는 globals.css).
const PANEL = "animate-[guest-fade_220ms_ease] motion-reduce:animate-none";

// 주소의 해시는 브라우저에서만 읽을 수 있다. 서버에서 그릴 때는 공지사항 탭이다.
function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
const hashTab = (): TabKey => (window.location.hash === "#faq" ? "faq" : "notices");

// 공지사항 · FAQ 두 탭. 주소가 #faq 면 FAQ 탭으로 연다(메인 「전체 질문 보기」).
// 탭을 눌러 바꿀 때는 주소를 바꾸지 않는다 — 방문 기록이 쌓이지 않게.
export function NoticesBoard({ notices, faq }: { notices: ReactNode; faq: ReactNode }) {
  const fromHash = useSyncExternalStore(subscribeHash, hashTab, () => "notices" as const);
  const [picked, setPicked] = useState<TabKey | null>(null);
  const tab = picked ?? fromHash;

  return (
    <div>
      <div role="tablist" className="flex border-b border-[#ebebeb]">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-controls={t.key}
            aria-selected={tab === t.key}
            onClick={() => setPicked(t.key)}
            className={`-mb-px w-[200px] border-b-2 p-[10px] text-[22px] leading-[1.4] font-medium ${HOVER} ${
              tab === t.key ? "border-guest-ink text-guest-ink" : "border-[#ebebeb] text-[#999] hover:text-guest-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="notices" aria-labelledby="tab-notices" hidden={tab !== "notices"} className={PANEL}>
        {notices}
      </div>
      <div role="tabpanel" id="faq" aria-labelledby="tab-faq" hidden={tab !== "faq"} className={PANEL}>
        {faq}
      </div>
    </div>
  );
}
