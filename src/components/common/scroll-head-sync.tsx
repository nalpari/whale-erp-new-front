"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

// DataTable scroll 의 머리 표 · 본문 표 상자. 본문만 스크롤하므로, 열 폭 합이 칸보다 넓어 본문을 가로로 밀면 머리도 같은 만큼
// 따라가게 맞춘다 — 안 그러면 머리 글자와 그 아래 값이 엇갈린다(플랫폼 공통코드 상세 코드, ip-code-review 로 찾음 2026-10-26).
// 머리 상자는 overflow-hidden 이라 사용자가 직접 밀 수 없고, 본문의 scrollLeft 만 따라간다.
// DataTable 은 서버 컴포넌트에서도 쓰여 이 조각만 클라이언트로 둔다(표 내용은 이미 그려진 요소로 받는다).
// 표의 좌우 선 · 머리 위아래 선은 두 상자가 긋는다 — 표 양쪽 끝이 카드 안쪽 여백에 똑같이 닿는다. 머리 상자 바탕은 머리 줄과 같게 칠한다(headClass).
// 본문 상자는 줄 높이만큼만 차지하고(늘리지 않는다) 넘치면 줄어 그 안에서 스크롤한다 — 줄이 적으면 아래 빈 곳에 선이 그어지지 않는다.
// 세로 스크롤바 자리는 본문에 스크롤바가 실제로 생겼을 때만 머리 오른쪽에 그만큼 비워 열을 맞춘다 — 늘 비워 두면(scrollbar-gutter: stable)
// 스크롤이 없는 표도 줄 밑선이 오른쪽 끝 10px 앞에서 끊겼다(2026-11-18 사용자 지정, 전엔 표가 선을 그어 오른쪽만 스크롤바 자리만큼 안으로 들어왔다)
// fill 이면 본문 상자가 남는 높이를 채우고 아래 선으로 닫는다 — 줄이 적어도 표 틀이 목록 영역 끝(쪽 이동 위)까지 서고 줄은 위에서부터 채운다.
// 가로 스크롤 막대도 그 아래 끝에 붙는다. 데이터가 없을 때의 빈 표(fillEmpty)와 같은 높이다(2026-11-19 사용자 지정)
export function ScrollHeadSync({ head, body, headClass = "", fill = false }: { head: ReactNode; body: ReactNode; headClass?: string; fill?: boolean }) {
  const headRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const headBox = headRef.current;
    const bodyBox = bodyRef.current;
    if (!headBox || !bodyBox) return;
    const sync = () => {
      const style = getComputedStyle(bodyBox);
      const scrollbar = bodyBox.offsetWidth - bodyBox.clientWidth - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth);
      headBox.style.paddingRight = `${Math.max(0, scrollbar)}px`;
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(bodyBox);
    // 줄이 늘고 줄어 세로 스크롤바가 생기거나 사라질 때도 맞춘다 — 본문 상자 크기가 그대로여도 안의 표 높이는 바뀐다
    if (bodyBox.firstElementChild) observer.observe(bodyBox.firstElementChild);
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <div ref={headRef} aria-hidden="true" className={`shrink-0 overflow-hidden rounded-t-[2px] border border-erp-thead-line ${headClass}`}>
        {head}
      </div>
      <div
        ref={bodyRef}
        className={`min-h-0 overflow-y-auto border-x border-erp-thead-line ${fill ? "flex-1 rounded-b-[2px] border-b [&>table]:-mb-px" : ""}`}
        onScroll={(e) => {
          if (headRef.current) headRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }}
      >
        {body}
      </div>
    </>
  );
}
