"use client";

import { BUTTON_MOTION } from "../theme";

// 같은 화면의 기능 설명으로 부드럽게 내려가는 바로가기.
// #주소 링크로 두면 누를 때마다 방문 기록이 쌓여 뒤로가기를 여러 번 눌러야 이전 화면으로 돌아가므로, 주소는 바꾸지 않는다.
// 고정 머리말에 가리지 않게 띄우는 간격은 각 설명의 scroll-mt 가 맡는다. 움직임 줄이기 설정이면 바로 옮긴다.
export function FeatureShortcuts({ items }: { items: { id: string; tab: string }[] }) {
  function handleClick(id: string) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <nav className="flex gap-[8px]">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => handleClick(item.id)}
          className={`flex h-[48px] items-center rounded-[6px] border border-guest-button-line bg-white px-[18px] text-[18px] leading-[1.5] font-semibold text-guest-navy hover:border-guest-navy ${BUTTON_MOTION}`}
        >
          {item.tab}
        </button>
      ))}
    </nav>
  );
}
