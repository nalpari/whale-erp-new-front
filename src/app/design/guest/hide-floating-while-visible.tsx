"use client";

import { type ReactNode, useEffect, useRef } from "react";

// 감싼 구역이 화면에 보이는 동안 떠 있는 무료 가입 띠(FloatingActions)를 내려 감춘다(globals.css `[data-guest-hero]`).
// 홈 첫 화면의 핵심기능 판을 감싼다 — 흔한 노트북 화면(1366 · 1440 · 1536)에서 띠가 핵심기능 카드를 가렸다. 판이 화면 위로 지나가면 띠가 아래에서 올라온다(2026-11-13 사용자 지정).
// 서버가 그린 처음 화면부터 감춘 상태다 — 구역에 `data-passed` 가 없으면 감추고, 구역이 화면을 벗어났을 때만 붙인다. body 속성을 스크립트로 붙이면 첫 화면을 열 때마다 띠가 보였다 사라졌다(PR 리뷰).
export function HideFloatingWhileVisible({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 빠르게 스크롤하면 기록이 여럿 묶여 오므로 마지막 것을 본다
    const observer = new IntersectionObserver((entries) => {
      if (entries[entries.length - 1].isIntersecting) delete el.dataset.passed;
      else el.dataset.passed = "";
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} data-guest-hero="">
      {children}
    </div>
  );
}
