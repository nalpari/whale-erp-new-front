"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EASE_OUT } from "@/components/common/theme";
import { type GuestRoutes, SAMPLE_ROUTES, SITE_ROUTES } from "./guest-routes";
import { HOVER } from "./theme";

// 아직 화면이 없는 메뉴는 href 가 "#" 다. 화면이 생기면 GuestRoutes 에 더하고 키를 채운다.
const MENUS: { label: string; route?: keyof GuestRoutes }[] = [
  { label: "매장운영", route: "storeOperations" },
  { label: "재무관리", route: "financeManagement" },
  { label: "프랜차이즈", route: "franchise" },
  { label: "부가 서비스", route: "addOnServices" },
];

const SIDE_MENUS: { label: string; route: keyof GuestRoutes }[] = [
  { label: "도입문의", route: "leads" },
  { label: "공지사항", route: "notices" },
];

// 비로그인 화면 머리말. 스크롤해도 위에 붙어 있다.
// fixed 가 아니라 sticky 다 — 화면이 최소폭(1280)보다 좁으면 가로로 스크롤하는데, fixed 는 가로로 따라오지 않아 오른쪽이 잘린다.
// 맨 위에서는 시안대로 바탕 없이 Billboard 위에 겹치고, 스크롤하면 흰 바탕과 선을 깔아 어두운 섹션 위에서도 글자가 보이게 한다.
// homeHref: 로그인한 채 실제 비로그인 화면을 열면 (site)/layout.tsx 가 세션의 홈을 넘긴다 — 그때는 Login 대신 「홈으로」다(PR #44).
// 이 화면들은 로그인 전용이 아니라 세션이 있는 채로도 연다(예: 다른 계정으로 로그인해 둔 채 새로 가입). Login 을 그대로 두면 눌러도
// proxy.ts 의 "로그인한 채 /login 에 오면 자기 홈"에 걸려 아무 설명 없이 자기 홈으로 돌아가 로그인이 안 되는 것처럼 보인다(2026-10-16).
// 세션이 있으면 실제로 가는 곳(자기 홈)을 그대로 보인다 — 다른 계정으로 로그인하려면 먼저 로그아웃해야 하는 건 여기서 바꾸지 않는다.
// 디자인 샘플(design/guest/layout.tsx)은 넘기지 않아 늘 Login 이다.
export function GuestHeader({ homeHref }: { homeHref?: string }) {
  const pathname = usePathname();
  // 실제 라우트와 디자인 샘플이 이 머리말을 함께 쓴다. 샘플 안에서는 링크도 샘플로 건다(guest-routes.ts).
  const routes = pathname.startsWith(SAMPLE_ROUTES.home) ? SAMPLE_ROUTES : SITE_ROUTES;
  const [scrolled, setScrolled] = useState(false);
  // 맨 위에서 Billboard 그림 위에 겹치는 화면(메인·매장운영·재무관리·프랜차이즈·부가서비스) 말고는 본문이 머리말과 같은 흰 바탕이라
  // 맨 위에서도 선을 그어 구분한다 — 로그인·계정 찾기·회원가입·가입 완료·도입문의·공지사항.
  const lined = ![routes.home, routes.storeOperations, routes.financeManagement, routes.franchise, routes.addOnServices].includes(pathname);
  const onMenu = MENUS.some((menu) => menu.route && routes[menu.route] === pathname);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      // 화면을 옮기는 동안 머리말은 기준점으로 제자리에 둔다(globals.css 의 guest-header).
      style={{ viewTransitionName: "guest-header" }}
      className={`sticky top-0 z-20 grid h-[110px] grid-cols-[1fr_auto_1fr] items-center gap-[clamp(24px,2.5vw,48px)] border-b px-[clamp(40px,4.2vw,80px)] transition-[background-color,border-color] duration-150 ${EASE_OUT} motion-reduce:transition-none ${
        scrolled ? "border-guest-line bg-white/95 backdrop-blur-[8px]" : lined ? "border-guest-line" : "border-transparent"
      }`}
    >
      <Link href={routes.home} className="flex items-center gap-[8px] justify-self-start py-[5px]">
        <span className="relative size-[50px] opacity-95">
          <Image src="/guest/logo-whale.svg" alt="" width={49.6875} height={37.4997} className="absolute top-[12.5px] left-0" />
          <Image src="/guest/logo-star.svg" alt="" width={24.1664} height={17.5001} className="absolute top-0 left-[7.57px]" />
        </span>
        {/* 로고 글자는 WHALE ERP 한 줄만 — 아랫줄 「STORE MANAGEMENT SYSTEM」은 뺐다. 한글로 바꾸니 위 영문과 볼륨이 맞지 않았고, 「매장 통합관리 서비스」는 첫 화면 큰 제목이 맡는다(2026-11-12 사용자 지정). */}
        <span className="flex flex-col leading-[1.4] [text-box:trim-both_cap_alphabetic]">
          <span className="font-[family-name:var(--font-rem)] text-[24px] font-extrabold tracking-normal text-guest-ink uppercase">
            whale ERP
          </span>
        </span>
      </Link>
      {/* 메뉴 화면(매장운영 등)에서는 지금 메뉴만 먹색이고 나머지는 #999 로 물러난다. 고른 메뉴가 없는 화면(메인 · 로그인 · 공지사항 …)은
          네 메뉴 모두 먹색이고 호버하면 남색이다(Figma 로그인전_공유 44:1794 · 44:2, 2026-11-06). */}
      {/* 글자는 세 단계(2026-11-12 사용자 지정, 정리안) — 로고 24px 800 · 주요 메뉴 18px 600 먹색 · 보조 링크 16px 500 회색(세로선 없음). 전엔 메뉴와 보조 링크가 같은 20px 600 이라 위계가 없었다.
          세 칸 격자(1fr · 메뉴 · 1fr)라 메뉴 묶음은 로고 · 보조 링크 폭과 상관없이 화면 정가운데에 선다.
          창을 줄이면(1920 → 1260) 양옆 여백 · 메뉴 사이 · 보조 링크 사이를 같은 비율로 함께 줄인다 — 고정 값일 땐 1300px 아래에서 메뉴가 보조 링크에 붙고 공지사항이 잘렸다. */}
      <nav className="flex justify-center gap-[clamp(36px,3.9vw,64px)]">
        {MENUS.map((menu) => {
          const href = menu.route ? routes[menu.route] : "#";
          const current = href === pathname;
          return (
            <Link
              key={menu.label}
              href={href}
              aria-current={current ? "page" : undefined}
              className={`text-[18px] leading-[1.5] font-semibold ${
                onMenu ? "text-[#999] hover:text-guest-ink aria-[current=page]:text-guest-ink" : "text-guest-ink hover:text-guest-navy"
              } ${HOVER}`}
            >
              {menu.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center justify-end gap-[clamp(16px,1.7vw,24px)] text-[16px] font-medium whitespace-nowrap text-[#777]">
        <Link href={homeHref ?? routes.login} className={`flex items-center gap-[6px] hover:text-guest-ink ${HOVER}`}>
          {/* 아이콘을 마스크로 그려 글자색을 따르게 한다 — 호버하면 글자와 함께 먹색으로 바뀐다(Figma 1:1855). */}
          <span aria-hidden className={`size-[20px] bg-current mask-[url(/guest/user-circle.svg)] mask-contain mask-center mask-no-repeat ${HOVER}`} />
          {/* 「LOGIN」 영문 대문자 대신 다른 링크와 같은 한글(2026-11-12 사용자 지정) */}
          {homeHref ? "홈으로" : "로그인"}
        </Link>
        {SIDE_MENUS.map((menu) => (
          <Link
            key={menu.route}
            href={routes[menu.route]}
            // 공지사항 상세(/notices/{id})에서도 공지사항을 켠다. 켜진 글자는 메뉴와 같이 먹색이다.
            aria-current={pathname === routes[menu.route] || pathname.startsWith(`${routes[menu.route]}/`) ? "page" : undefined}
            className={`hover:text-guest-ink aria-[current=page]:text-guest-ink ${HOVER}`}
          >
            {menu.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
