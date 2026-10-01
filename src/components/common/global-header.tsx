"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode, type SyntheticEvent } from "react";
import { useDismiss } from "./popup";
import { EASE_OUT } from "./theme";

export type HeaderMenu = { label: string; items: { label: string; href: string }[] };

// 1depth 를 누르면 2depth 줄이 열리고, 같은 메뉴를 다시 누르거나 헤더 바깥을 누르거나 Esc 로 닫힌다.
// ref 는 헤더 전체에 단다.
function useHeaderMenu() {
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
  const isOpen = (i: number) => open && menu === i;
  return { ref, open, menu, shown, setShown, setOpen, toggle, isOpen };
}

// 2depth 줄. 높이 41 = 위아래 12 + 글자 16 + 테두리 1.
// 자주 여닫는 메뉴라 200ms 로 짧게 펼친다. 줄 높이가 본문을 밀어내야 해서 grid 행 높이를 전환한다.
function SubMenu({
  menus,
  state: { open, menu, shown, setShown, setOpen },
}: {
  menus: HeaderMenu[];
  state: Omit<ReturnType<typeof useHeaderMenu>, "ref">;
}) {
  const settle = (e: SyntheticEvent) => {
    if (e.target === e.currentTarget && shown !== menu) setShown(menu);
  };
  return (
    <div
      inert={!open}
      className={`grid transition-[grid-template-rows] duration-200 ${EASE_OUT} motion-reduce:transition-none ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">
        <ul
          onTransitionEnd={settle}
          onTransitionCancel={settle}
          className={`flex gap-[24px] border-b border-erp-bar-line py-[12px] pl-[24px] text-[13.5px] leading-[16px] text-erp-sub transition-opacity ease-out ${
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
  );
}

function Logo() {
  return (
    <Link href="/" className="flex w-[177px] shrink-0 items-center gap-[10px]">
      <Image src="/icons/logo-whale.svg" alt="" width={53} height={40} />
      <p className="leading-[1.3] text-[#252525]">
        <span className="block text-[16px] font-extrabold uppercase">Whale ERP</span>
        <span className="block text-[12px]">Management System</span>
      </p>
    </Link>
  );
}

// Figma Info on. 아이콘 아래 뜨는 흰 알약 모양 툴팁. 아래쪽이 짙은 메뉴 줄에 걸치므로 테두리로 경계를 남긴다.
// 떠오를 때 4px 아래에서 올라오고, 동작 줄이기 설정이면 올라오지 않고 나타나기만 한다.
function Tip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute top-[calc(100%+10px)] left-1/2 z-20 -translate-x-1/2 translate-y-[4px] rounded-[100px] border border-[#ebebeb] bg-white px-[12px] py-[10px] text-[14px] leading-[2] whitespace-nowrap text-erp-brand opacity-0 transition-[opacity,translate] duration-150 ease-out [text-box:trim-both_cap_alphabetic] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:translate-y-0">
      <span className="absolute -top-[5px] left-1/2 size-[8px] -translate-x-1/2 -rotate-45 rounded-tr-[1px] border-t border-r border-[#ebebeb] bg-white" />
      {label}
    </span>
  );
}

// size- 와 w- 를 같이 쓰면 둘 다 width 를 정해 어느 쪽이 이길지 보장되지 않는다. 높이만 여기서 정하고 폭은 링크마다 준다.
const ICON_HOVER = "group relative grid h-[32px] place-items-center rounded-full [&>img]:transition-opacity [&>img]:duration-150 hover:[&>img]:opacity-70 [&>span:first-child]:transition-opacity hover:[&>span:first-child]:opacity-70";

// Figma Top2 의 서비스 바로가기. 둥근 테두리 안에 세 아이콘을 두고, 올리면 이름 툴팁이 뜬다.
export function ServiceLinks({ hrefs = {} }: { hrefs?: { erp?: string; addon?: string; platform?: string } }) {
  return (
    <div className="flex h-[42px] shrink-0 items-center gap-[18px] rounded-full border border-erp-field-line bg-white px-[24px]">
      <span className="text-[15px] font-medium whitespace-nowrap text-erp-ink">서비스 바로가기</span>
      <div className="flex items-center gap-[12px]">
        <Link href={hrefs.erp ?? "#"} aria-label="웨일ERP" className={`${ICON_HOVER} w-[32px]`}>
          <Image src="/icons/service-erp.svg" alt="" width={32} height={32} />
          <Tip label="웨일ERP" />
        </Link>
        <Link href={hrefs.addon ?? "#"} aria-label="부가서비스 현황" className={`${ICON_HOVER} w-[32px] bg-white`}>
          <Image src="/icons/service-chat.svg" alt="" width={19} height={19} />
          <Tip label="부가서비스 현황" />
        </Link>
        <Link href={hrefs.platform ?? "#"} aria-label="플랫폼관리" className={`${ICON_HOVER} w-[14px]`}>
          <span className="grid grid-cols-3 gap-[2.5px]">
            {Array.from({ length: 9 }, (_, i) => (
              <Image key={i} src="/icons/dot.svg" alt="" width={3} height={3} />
            ))}
          </span>
          <Tip label="플랫폼관리" />
        </Link>
      </div>
    </div>
  );
}

// 알림 버튼. 빨간 점이 아이콘에 들어 있어 늘 보인다.
// ponytail: 읽지 않은 알림 여부를 받지 않는다. 알림 API 가 붙으면 unread prop 으로 점을 따로 그린다.
export function AlarmLink({ href }: { href: string }) {
  return (
    <Link href={href} aria-label="알림" className="shrink-0 rounded-full transition-opacity duration-150 ease-out hover:opacity-70">
      <Image src="/icons/alarm.svg" alt="" width={42} height={42} />
    </Link>
  );
}

// Figma Top2. 흰 윗줄(로고 + 오른쪽 컨트롤), 짙은 1depth 메뉴 줄, 그 아래 펼쳐지는 2depth 줄.
// right 에는 StoreSelect, ServiceLinks, AlarmLink, UserPop 을 차례로 넣는다.
// StoreSelect 가 남는 폭을 차지해 나머지를 오른쪽으로 민다.
export function GlobalHeader({ menus, right }: { menus: HeaderMenu[]; right?: ReactNode }) {
  const { ref, ...state } = useHeaderMenu();

  return (
    <header ref={ref} className="bg-white">
      <div className="flex h-[70px] items-center gap-[34px] px-[24px]">
        <Logo />
        {right && <div className="flex flex-1 items-center gap-[12px]">{right}</div>}
      </div>
      <nav className="flex h-[52px] items-center gap-[54px] bg-erp-nav px-[24px]">
        {menus.map((m, i) => (
          <button
            key={m.label}
            type="button"
            aria-expanded={state.isOpen(i)}
            onClick={() => state.toggle(i)}
            className={`flex h-[52px] shrink-0 items-center text-[16px] font-semibold whitespace-nowrap transition-colors duration-150 ease-out hover:text-erp-brand-soft ${
              i === 0 ? "pr-[20px]" : "px-[20px]"
            } ${state.isOpen(i) ? "text-erp-brand-soft" : "text-white"}`}
          >
            {m.label}
          </button>
        ))}
      </nav>
      <SubMenu menus={menus} state={state} />
    </header>
  );
}
