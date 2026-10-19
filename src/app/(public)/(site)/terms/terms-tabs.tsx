"use client";

import { type KeyboardEvent, type ReactNode, useSyncExternalStore } from "react";
import { HOVER } from "@/app/design/guest/theme";
import { tabOfHash } from "@/lib/terms-tab";

export interface TermsTab {
  code: string;
  label: string;
  /** 서버가 그린 패널(제목 · 버전 · 본문). Markdown 은 서버에서 그려 브라우저로 보내지 않는다. */
  panel: ReactNode;
}

const TAB_ON = "border-guest-navy bg-guest-card font-semibold text-guest-navy";
const TAB_OFF = "border-transparent font-medium text-[#767676] hover:text-guest-ink";

// 고른 탭은 주소의 해시 하나로 둔다 — 푸터 링크(#TERMS_SERVICE · #PRIVACY_COLLECT)로 들어와도, 탭을 눌러도 같은 값을 본다.
// 해시는 브라우저에서만 읽을 수 있어 서버에서 그릴 때는 첫 탭이다.
function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

// 탭을 누르면 해시를 바꾼다. replaceState 라 방문 기록이 쌓이지 않고 패널로 스크롤이 튀지 않는다 — 대신 hashchange 가 나지 않아 직접 알린다.
function selectTab(code: string) {
  history.replaceState(history.state, "", `#${code}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

// 데모 auth/terms.html 처럼 탭 이름이 길고 여섯 개라 왼쪽 세로 목록으로 둔다. 탭 이름은 공통코드 TERMS_TYPE 의 label 이다.
export function TermsTabs({ tabs }: { tabs: TermsTab[] }) {
  const codes = tabs.map((t) => t.code);
  const tab = useSyncExternalStore(subscribeHash, () => tabOfHash(window.location.hash, codes), () => codes[0]);

  // 세로 탭 목록이라 위·아래 화살표로 옮기고 Home·End 로 끝으로 간다(WAI-ARIA 탭 패턴, 고르면 바로 연다).
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = codes.indexOf(tab ?? "");
    const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: codes.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const code = codes[(next + codes.length) % codes.length];
    selectTab(code);
    document.getElementById(`tab-${code}`)?.focus();
  };

  return (
    <div className="flex items-start gap-[60px]">
      {/* top: 머리말(110px) 아래에 붙는다. */}
      <div role="tablist" aria-orientation="vertical" aria-label="약관" onKeyDown={handleKeyDown} className="sticky top-[130px] flex w-[300px] shrink-0 flex-col border-t border-[#ebebeb]">
        {tabs.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            role="tab"
            id={`tab-${code}`}
            aria-controls={`terms-${code}`}
            aria-selected={tab === code}
            tabIndex={tab === code ? 0 : -1}
            onClick={() => selectTab(code)}
            className={`flex min-h-[56px] items-center border-l-2 px-[18px] py-[12px] text-left text-[16px] leading-[1.4] ${HOVER} ${tab === code ? TAB_ON : TAB_OFF}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        {/* 패널 id 는 해시와 다르게 둔다 — 같으면 해시로 들어올 때 브라우저가 패널로 스크롤한다. */}
        {tabs.map(({ code, panel }) => (
          <div key={code} role="tabpanel" id={`terms-${code}`} aria-labelledby={`tab-${code}`} hidden={tab !== code}>
            {panel}
          </div>
        ))}
      </div>
    </div>
  );
}
