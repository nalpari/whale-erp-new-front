"use client";

import { useRef, type ReactNode } from "react";

// DataTable scroll 의 머리 표 · 본문 표 상자. 본문만 스크롤하므로, 열 폭 합이 칸보다 넓어 본문을 가로로 밀면 머리도 같은 만큼
// 따라가게 맞춘다 — 안 그러면 머리 글자와 그 아래 값이 엇갈린다(플랫폼 공통코드 상세 코드, ip-code-review 로 찾음 2026-10-26).
// 머리 상자는 overflow-hidden 이라 사용자가 직접 밀 수 없고, 본문의 scrollLeft 만 따라간다.
// DataTable 은 서버 컴포넌트에서도 쓰여 이 조각만 클라이언트로 둔다(표 내용은 이미 그려진 요소로 받는다).
export function ScrollHeadSync({ head, body }: { head: ReactNode; body: ReactNode }) {
  const headRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div ref={headRef} aria-hidden="true" className="shrink-0 overflow-hidden [scrollbar-gutter:stable]">
        {head}
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]"
        onScroll={(e) => {
          if (headRef.current) headRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }}
      >
        {body}
      </div>
    </>
  );
}
