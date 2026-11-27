"use client";

import { useEffect, useRef } from "react";

// 푸터가 화면에 보이면 떠 있는 무료 가입 띠(FloatingActions)를 내려 감춘다(body[data-guest-footer], globals.css).
// 전에는 띠가 페이지 끝에서 사업자 정보를 가리지 않게 푸터 아래 여백을 136px 늘렸는데, 띠가 없는 순간(감춰졌을 때 · 넓은 창)에는
// 푸터 아래가 휑하게 비어 「간격이 이상하다」고 보였다(2026-11-27 사용자 지정). 푸터가 보일 때는 띠를 내리고 여백은 원래대로 둔다.
// 푸터 안에 빈 표시 하나를 두고, 그 표시가 든 푸터를 지켜본다.
export function HideFloatingAtFooter() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const footer = ref.current?.closest("footer");
    if (!footer) return;
    // 빠르게 스크롤하면 기록이 여럿 묶여 오므로 마지막 것을 본다
    const observer = new IntersectionObserver((entries) => {
      if (entries[entries.length - 1].isIntersecting) document.body.dataset.guestFooter = "";
      else delete document.body.dataset.guestFooter;
    });
    observer.observe(footer);
    return () => {
      observer.disconnect();
      delete document.body.dataset.guestFooter;
    };
  }, []);
  return <span ref={ref} hidden />;
}
