"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, SubMenu, useHeaderMenu, type HeaderMenu } from "./global-header";

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
export function ServiceLinksV2({ hrefs = {} }: { hrefs?: { erp?: string; addon?: string; platform?: string } }) {
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
// right 에는 StoreSelect(variant="v2"), ServiceLinksV2, AlarmLink, UserPop(variant="v2") 을 차례로 넣는다.
// StoreSelect v2 가 남는 폭을 차지해 나머지를 오른쪽으로 민다.
export function GlobalHeaderV2({ menus, right }: { menus: HeaderMenu[]; right?: ReactNode }) {
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
      <SubMenu menus={menus} state={state} className="pl-[24px] text-erp-sub" />
    </header>
  );
}

// Figma Top2 의 Utill. v1 과 달리 흰 바탕이고 서비스 바로가기는 헤더로 올라갔다. 오른쪽은 children 으로 채운다.
export function PageBarV2({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex h-[59px] items-center border-b border-erp-bar-line bg-white px-[24px]">
      <h1 className="flex-1 text-[22px] font-semibold text-erp-ink">{title}</h1>
      {children}
    </div>
  );
}
