"use client";

import { type RefObject, useEffect } from "react";

// 소개 화면의 붙는 구역(intro-features-sticky · accordion)은 창 높이를 꽉 채워 머리말 아래에 붙는다. 그동안 화면 아래 떠 있는 무료 가입 띠(FloatingActions)가
// 구역 아래쪽 목록 · 그림을 가리고 클릭도 가로챘다(PR 리뷰) — 구역이 붙어 있는 동안만 body 에 data-guest-pinned 를 달아 띠를 내린다(globals.css). 구역을 지나면 다시 뜬다.
const HEADER = 110;

export function usePinnedHidesFloating(sectionRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    function update() {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pinned = rect.top <= HEADER + 1 && rect.bottom >= window.innerHeight - 1;
      if (pinned) document.body.dataset.guestPinned = "";
      else delete document.body.dataset.guestPinned;
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      delete document.body.dataset.guestPinned;
    };
  }, [sectionRef]);
}
