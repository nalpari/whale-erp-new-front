"use client";

import type { ReactNode } from "react";
import { useBackdropActive } from "@/components/common";

/**
 * 패널이 아닌 본문(필터 · 표 · 이동 링크)을 바탕창이 뜬 동안 inert 로 막는다 — 바탕창은 클릭만 가로채고 포커스는 가두지
 * 않아, 이것 없이는 Tab 이 뒤 화면으로 새 나간다(slide-panel.tsx useBackdropActive 설명). 페이지가 서버 컴포넌트라
 * 이 조각으로 감싼다. 패널은 본문 안에 있어 통째로 감싸지 못하고, 패널을 뺀 자리마다 감싼다.
 */
export function BackdropInert({ children }: { children: ReactNode }) {
  return (
    <div className="contents" inert={useBackdropActive()}>
      {children}
    </div>
  );
}
