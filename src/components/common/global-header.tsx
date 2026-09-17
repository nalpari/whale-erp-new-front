"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useDismiss } from "./popup";
import { EASE_OUT } from "./theme";

export type HeaderMenu = { label: string; items: { label: string; href: string }[] };

// Figma Top. 1depth 메뉴와, 그 아래 펼쳐지는 2depth 줄.
// 1depth 를 누르면 열리고, 같은 메뉴를 다시 누르거나 헤더 바깥을 누르거나 Esc 로 닫힌다.
// right 에는 StoreSelect, UserPop 같은 오른쪽 컨트롤을 넣는다.
export function GlobalHeader({ menus, right }: { menus: HeaderMenu[]; right?: ReactNode }) {
  // 어떤 메뉴를 보여줄지와 열려 있는지를 따로 둔다. 닫히는 동안에도 마지막 메뉴의 항목이 남아 있어야
  // 줄이 접히면서 빈 줄로 바뀌지 않는다.
  const [menu, setMenu] = useState(0);
  const [open, setOpen] = useState(false);
  // 화면에 그려진 2depth. 열린 채 다른 메뉴로 바꾸면 이것이 먼저 흐려지고(120ms),
  // 다 흐려진 뒤 새 메뉴로 바뀌어 다시 나타난다(180ms). 연달아 바꿔도 마지막 메뉴로 수렴한다.
  const [shown, setShown] = useState(0);
  const ref = useDismiss<HTMLElement>(open, () => setOpen(false));
  const toggle = (next: number) => {
    // 닫혀 있으면 줄이 보이지 않고, 동작 줄이기 설정이면 페이드를 빼야 하므로 바로 바꾼다.
    // 그 밖에는 흐려짐이 끝나거나 취소된 뒤(onTransitionEnd/Cancel) 바꾼다. 취소를 놓치면 줄이 흐린 채 멈춘다.
    if (!open || matchMedia("(prefers-reduced-motion: reduce)").matches) setShown(next);
    setOpen(!(open && menu === next));
    setMenu(next);
  };

  return (
    <header ref={ref} className="bg-white">
      <div className="flex h-[71px] items-center gap-[54px] border-b border-erp-bar-line px-[24px]">
        <Link href="/" className="flex w-[177px] shrink-0 items-center gap-[10px]">
          <Image src="/icons/logo-whale.svg" alt="" width={53} height={40} />
          <p className="leading-[1.3] text-[#252525]">
            <span className="block text-[16px] font-extrabold uppercase">Whale ERP</span>
            <span className="block text-[12px]">Management System</span>
          </p>
        </Link>
        <nav className="flex flex-1 items-center gap-[44px] pl-[150px]">
          {menus.map((m, i) => (
            <button
              key={m.label}
              type="button"
              aria-expanded={open && menu === i}
              onClick={() => toggle(i)}
              className={`flex h-[52px] shrink-0 items-center text-[16px] font-semibold whitespace-nowrap transition-colors duration-150 ease-out hover:text-erp-brand ${
                i === 0 ? "pr-[20px]" : "px-[20px]"
              } ${open && menu === i ? "text-erp-brand" : "text-erp-ink"}`}
            >
              {m.label}
            </button>
          ))}
        </nav>
        {right && <div className="flex shrink-0 items-center gap-[15px]">{right}</div>}
      </div>
      {/* 2depth 줄. 왼쪽 404px 은 Figma 값이다(1depth 첫 글자는 Figma 와 같이 405px 에서 시작한다). 높이 41 = 위아래 12 + 글자 16 + 테두리 1.
          자주 여닫는 메뉴라 200ms 로 짧게 펼친다. 줄 높이가 본문을 밀어내야 해서 grid 행 높이를 전환한다. */}
      <div
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-200 ${EASE_OUT} motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <ul
            onTransitionEnd={(e) => {
              if (e.target === e.currentTarget && shown !== menu) setShown(menu);
            }}
            onTransitionCancel={(e) => {
              if (e.target === e.currentTarget && shown !== menu) setShown(menu);
            }}
            className={`flex gap-[24px] border-b border-erp-bar-line py-[12px] pl-[404px] text-[13.5px] leading-[16px] text-erp-ink transition-opacity ease-out ${
              shown === menu ? "opacity-100 duration-[180ms]" : "opacity-0 duration-[120ms]"
            }`}
          >
            {menus[shown]?.items.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="whitespace-nowrap transition-colors duration-150 ease-out hover:text-erp-brand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
