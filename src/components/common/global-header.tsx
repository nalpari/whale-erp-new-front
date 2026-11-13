"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type MouseEvent, type ReactNode, type SyntheticEvent } from "react";
import { rem } from "@/app/design/guest/fonts";
import { useDismiss } from "./popup";
import { EASE_OUT } from "./theme";

// href 를 주면 2depth 줄을 열지 않고 바로 그 주소로 간다(하위 메뉴가 없는 1depth).
export type HeaderMenu = { label: string; href?: string; items: { label: string; href: string }[] };

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

// 로고는 로그인 전 화면 머리말과 같은 모양 — 별 + 고래 그림, 글자는 REM 800 「WHALE ERP」 한 줄(2026-11-13 사용자 지정, 전엔 고래 그림 + 「WHALE ERP / Management System」 두 줄). 같은 로고라 글자색도 로그인 전 로고의 `guest-ink`(#0c0c0c)를 쓴다 — erp 토큰 규칙의 예외로 DESIGN.md 「헤더」에 적었다.
// 헤더 줄이 70px 라 로그인 전(50px 그림 · 24px 글자)보다 한 단계 작게 — 그림 42px · 글자 20px. 글자는 머리말 줄의 다른 글자(점포 선택칸 · 시작 가이드 · 서비스 바로가기 · 이름)와 같은 세로 가운데에 두고, 대신 그림을 4px 올려 고래 몸통 가운데를 글자 가운데에 맞춘다 — 그림 상자 위쪽이 별이라 고래가 아래로 처져 보였다(2026-11-13 사용자 지정).
// 플랫폼 탭은 로고 뒤에 「· 플랫폼관리」를 붙여 어느 콘솔인지 알린다(`suffix`) — 플랫폼은 점포 선택칸이 없어 로고 옆이 비어 있었다(2026-11-13 사용자 지정). 로고 폭(177px)은 웨일ERP 탭 점포 선택칸의 시작선을 맞추려는 것이라 이름이 붙으면 늘어나게 둔다.
function Logo({ href = "/", onClick, suffix }: { href?: string; onClick?: (e: MouseEvent<HTMLAnchorElement>) => void; suffix?: string }) {
  return (
    <Link href={href} onClick={onClick} className={`${rem.variable} flex min-w-[177px] shrink-0 items-center gap-[10px]`}>
      <span className="relative size-[42px] shrink-0 -translate-y-[4px] opacity-95">
        <Image src="/guest/logo-whale.svg" alt="" width={41.73} height={31.5} className="absolute top-[10.5px] left-0" />
        <Image src="/guest/logo-star.svg" alt="" width={20.3} height={14.7} className="absolute top-0 left-[6.36px]" />
      </span>
      <span className="font-[family-name:var(--font-rem)] text-[20px] leading-none font-extrabold whitespace-nowrap text-guest-ink uppercase">whale ERP</span>
      {suffix && (
        <span className="flex items-center gap-[10px] text-[18px] leading-none font-semibold whitespace-nowrap text-erp-ink">
          <span aria-hidden className="font-normal text-erp-label">·</span>
          {suffix}
        </span>
      )}
    </Link>
  );
}

// 아이콘 아래 뜨는 알약 모양 툴팁 — 버튼에 마우스를 올린 모양처럼 흰 바탕 · 회청 테두리 · 먹색 글자 500(2026-10-29 사용자 지정, 전엔 Figma Info on 의 연회색 테두리 · 회청 글자).
// 이름은 부모가 aria-label 로 갖는다 — 툴팁은 보이기만 한다(aria-hidden). 모서리는 6px, 꼬리는 없다 — 알약형 · 꼬리는 짙은 메뉴 줄 위에서 거칠게 보였다(2026-10-29 사용자 지적). 부모에 group · relative 를 둔다(서비스 바로가기 · 알림 종 · 마이페이지).
// 위치는 부모 가운데에서 26px 아래 — 부모 높이(아이콘 32 · 종 · 사람 42)가 달라도 헤더 줄 안에서 같은 높이에 뜬다(2026-10-29 사용자 지적).
// 떠오를 때 4px 아래에서 올라오고, 동작 줄이기 설정이면 올라오지 않고 나타나기만 한다.
export function HeaderTip({ label }: { label: string }) {
  return (
    <span data-header-tip aria-hidden className="pointer-events-none absolute top-[calc(50%+26px)] left-1/2 z-20 -translate-x-1/2 translate-y-[4px] rounded-[6px] border border-erp-brand bg-white px-[12px] py-[10px] text-[14px] leading-[2] font-medium whitespace-nowrap text-erp-ink opacity-0 transition-[opacity,translate] duration-150 ease-out [text-box:trim-both_cap_alphabetic] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:translate-y-0">
      {label}
    </span>
  );
}

// size- 와 w- 를 같이 쓰면 둘 다 width 를 정해 어느 쪽이 이길지 보장되지 않는다. 높이만 여기서 정하고 폭은 바로가기마다 준다.
const ICON_HOVER = "group relative grid h-[32px] place-items-center rounded-full [&>img]:transition-opacity [&>img]:duration-150 hover:[&>img]:opacity-70 [&>span:first-child]:transition-opacity hover:[&>span:first-child]:opacity-70";

/** 바로가기 하나가 할 일 — 주소면 링크, 함수면 버튼(팝업을 열거나 전체 로드로 옮길 때). */
type ServiceTarget = string | (() => void);

// 링크와 버튼이 같은 모양 · 같은 툴팁을 쓰게 한다.
function ServiceLink({ target, label, className, children }: { target?: ServiceTarget; label: string; className: string; children: ReactNode }) {
  const body = (
    <>
      {children}
      <HeaderTip label={label} />
    </>
  );
  return typeof target === "function" ? (
    <button type="button" onClick={target} aria-label={label} className={className}>
      {body}
    </button>
  ) : (
    <Link href={target ?? "#"} aria-label={label} className={className}>
      {body}
    </Link>
  );
}

// Figma Top2 의 서비스 바로가기. 둥근 테두리 안에 세 아이콘을 두고, 올리면 이름 툴팁이 뜬다.
// hideAddon — 플랫폼관리 사이트에서는 부가서비스구독관리 아이콘 자리를 없앤다(2026-10-28 사용자 지정).
export function ServiceLinks({ targets = {}, hideAddon = false }: { targets?: { erp?: ServiceTarget; addon?: ServiceTarget; platform?: ServiceTarget }; hideAddon?: boolean }) {
  return (
    // 안의 아이콘(링크 · 버튼 — 부가서비스구독관리는 안내 팝업을 여는 버튼이다)에 마우스를 올리면 알약 테두리도 회청으로 — 마이페이지 · 알림 종과 같은 반응(2026-11-13 사용자 지정). 알약 자체는 누르는 곳이 아니라 아이콘을 가리킬 때만 바뀐다
    <div className="flex h-[42px] shrink-0 items-center gap-[18px] rounded-full border border-erp-field-line bg-white px-[24px] transition-colors duration-150 has-[a:hover,button:hover]:border-erp-brand">
      <span className="text-[15px] font-medium whitespace-nowrap text-erp-ink">서비스 바로가기</span>
      <div className="flex items-center gap-[12px]">
        <ServiceLink target={targets.erp} label="웨일ERP" className={`${ICON_HOVER} w-[32px]`}>
          <Image src="/icons/service-erp.svg" alt="" width={32} height={32} />
        </ServiceLink>
        {!hideAddon && (
          <ServiceLink target={targets.addon} label="부가서비스구독관리" className={`${ICON_HOVER} w-[32px] bg-white`}>
            <Image src="/icons/service-subscription.svg" alt="" width={24} height={24} />
          </ServiceLink>
        )}
        {/* 플랫폼관리는 톱니바퀴(데모 service-platform.svg, 2026-10-20). 아홉 점 아이콘에서 바꿨다.
            플랫폼 계정에게만 보인다 — BP·가맹 계정은 자리 자체를 없앤다(사용자 지적, 2026-10-21).
            칸은 다른 둘과 같은 32px — 20px 칸이라 부가서비스에 붙어 보였다. 톱니바퀴는 22px 로 키워 부가서비스와 무게를 맞춘다(2026-10-29 사용자 지적). */}
        {targets.platform && (
          <ServiceLink target={targets.platform} label="플랫폼관리" className={`${ICON_HOVER} w-[32px] bg-white`}>
            <Image src="/icons/service-platform.svg" alt="" width={22} height={22} />
          </ServiceLink>
        )}
      </div>
    </div>
  );
}

/** 알림 종 선 그림 — 종만 그리고 둘레 원은 감싸는 버튼의 CSS 테두리가 맡는다(SVG 안의 원은 확대 비율에 따라 찌그러져 보였다, 2026-11-13). */
export function BellGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 42 42" className="size-[40px] stroke-erp-brand" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.03 23.33c-.18 1.18.62 1.99 1.6 2.4 3.76 1.55 8.99 1.55 12.75 0 .98-.41 1.78-1.22 1.6-2.4-.11-.72-.66-1.32-1.06-1.9-.53-.78-.58-1.63-.58-2.53a6.34 6.34 0 0 0-12.67 0c0 .9-.05 1.75-.58 2.53-.4.58-.95 1.18-1.06 1.9Z" />
      <path d="M17.63 26.9c.39 1.45 1.75 2.52 3.37 2.52s2.98-1.07 3.37-2.52" />
    </svg>
  );
}

// 알림 버튼(데모 화면용). AccountControls 에 넣는다. 실제 화면의 알림 종(NotificationBell)과 같은 동그라미 · 호버 · 툴팁 「내 알림」.
// ponytail: 읽지 않은 알림 여부를 받지 않아 빨간 점을 늘 그린다. 알림 API 가 붙으면 unread prop 으로 점을 따로 그린다.
export function AlarmLink({ href }: { href: string }) {
  return (
    <Link href={href} aria-label="내 알림" className="group relative grid size-[42px] shrink-0 place-items-center rounded-full border border-erp-field-line bg-white transition-colors duration-150 hover:border-erp-brand">
      <BellGlyph />
      <span aria-hidden className="absolute top-[9px] right-[12px] size-[7px] rounded-full border-[1.5px] border-white bg-[#ff0000]" />
      <HeaderTip label="내 알림" />
    </Link>
  );
}

// 「내 계정」 묶음 — 세로 구분선(1px · 24px, erp-bar-line) 뒤에 알림 종 동그라미와 마이페이지(이름) 알약을 둔다. 둘 다 BP 가 아니라 로그인한
// 계정의 것이라, 플랫폼 계정이 BP 화면으로 넘어가도 종이 앞쪽 BP 컨트롤(범위 선택기 · 시작 가이드 · 서비스 바로가기)과 한 무리로 보이지 않게
// 선으로 가른다(2026-11-13 사용자 지정 — 한 알약에 담아 보니 종 · 이름이 붙어 보여, 모양은 원래대로 두고 구분선만 넣었다). 사이 간격은 헤더의 12px.
// 알림 팝업 · 마이페이지 메뉴는 이 묶음의 오른쪽 끝에 맞춰 뜬다 — 알림 종은 바깥에 relative 를 두지 않아 팝업이 이 묶음의 relative 를 기준으로 선다.
// 어느 하나가 열려 있으면 두 툴팁 모두 감춘다 — 종 팝업이 열린 채 이름 위를 지나면 「마이페이지」 툴팁이 팝업 뒤에 깔려 비어져 보였다(2026-11-13 사용자 지적).
// alarm 이 없으면(로그인 토큰을 읽지 못함) 이름만 둔다.
export function AccountControls({ alarm, user }: { alarm?: ReactNode; user: ReactNode }) {
  return (
    <div className="relative flex shrink-0 items-center gap-[12px] [&:has([aria-expanded=true])_[data-header-tip]]:hidden">
      <span aria-hidden className="h-[24px] w-px bg-erp-bar-line" />
      {alarm}
      {user}
    </div>
  );
}

// Figma Top2. 흰 윗줄(로고 + 오른쪽 컨트롤), 짙은 1depth 메뉴 줄, 그 아래 펼쳐지는 2depth 줄.
// right 에는 StoreSelect, ServiceLinks, AccountControls(알림 종 · UserPop)를 차례로 넣는다. 선택기가 없으면 빈 flex-1 로 자리를 채운다.
// StoreSelect 가 남는 폭을 차지해 나머지를 오른쪽으로 민다.
export function GlobalHeader({
  menus,
  right,
  inert,
  logoHref,
  logoSuffix,
}: {
  menus: HeaderMenu[];
  right?: ReactNode;
  /** 바탕창이 뜬 동안 헤더를 Tab 에서 뺀다 — 바탕창은 클릭만 가로채 포커스를 가두지 않는다(AdminFrame, 코드 리뷰, 2026-10-20) */
  inert?: boolean;
  /** 로고가 갈 주소 — 없으면 "/"(로그인 전 공개 홈, /design 화면 등). 로그인 뒤 화면은 이 탭 서비스의 홈을
   * 준다(AdminHeader) — 이미 그 홈이면 새로고침한다(router.refresh), 로고가 로그인 전 공개 홈으로 가버리던
   * 문제를 고친다(사용자 지적, 2026-10-21). */
  logoHref?: string;
  /** 로고 뒤에 붙는 콘솔 이름 — 플랫폼 탭의 「플랫폼관리」 */
  logoSuffix?: string;
}) {
  const { ref, ...state } = useHeaderMenu();
  const pathname = usePathname();
  const router = useRouter();
  const handleLogoClick = logoHref
    ? (e: MouseEvent<HTMLAnchorElement>) => {
        if (pathname !== logoHref) return;
        e.preventDefault();
        router.refresh();
      }
    : undefined;

  return (
    <header ref={ref} inert={inert} className="bg-white">
      <div className="flex h-[70px] items-center gap-[34px] px-[24px]">
        <Logo href={logoHref} onClick={handleLogoClick} suffix={logoSuffix} />
        {right && <div className="flex flex-1 items-center gap-[12px]">{right}</div>}
      </div>
      <nav className="flex h-[52px] items-center gap-[54px] bg-erp-nav px-[24px]">
        {menus.map((m, i) => {
          const cls = `flex h-[52px] shrink-0 items-center text-[16px] font-semibold whitespace-nowrap transition-colors duration-150 ease-out hover:text-erp-brand-soft ${
            i === 0 ? "pr-[20px]" : "px-[20px]"
          } ${state.isOpen(i) ? "text-erp-brand-soft" : "text-white"}`;
          return m.href ? (
            <Link key={m.label} href={m.href} onClick={() => state.setOpen(false)} className={cls}>
              {m.label}
            </Link>
          ) : (
            <button key={m.label} type="button" aria-expanded={state.isOpen(i)} onClick={() => state.toggle(i)} className={cls}>
              {m.label}
            </button>
          );
        })}
      </nav>
      <SubMenu menus={menus} state={state} />
    </header>
  );
}
