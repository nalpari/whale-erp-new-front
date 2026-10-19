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
  { label: "재무관리" },
  { label: "프랜차이즈" },
  { label: "부가 서비스", route: "addOnServices" },
];

const SIDE_MENUS: { label: string; route: keyof GuestRoutes }[] = [
  { label: "도입문의", route: "inquiry" },
  { label: "공지사항", route: "notices" },
];

// 비로그인 화면 머리말. 스크롤해도 위에 붙어 있다.
// fixed 가 아니라 sticky 다 — 화면이 1720 보다 좁으면 가로로 스크롤하는데, fixed 는 가로로 따라오지 않아 오른쪽이 잘린다.
// 맨 위에서는 시안대로 바탕 없이 Billboard 위에 겹치고, 스크롤하면 흰 바탕과 선을 깔아 어두운 섹션 위에서도 글자가 보이게 한다.
export function GuestHeader() {
  const pathname = usePathname();
  // 실제 라우트와 디자인 샘플이 이 머리말을 함께 쓴다. 샘플 안에서는 링크도 샘플로 건다(guest-routes.ts).
  const routes = pathname.startsWith(SAMPLE_ROUTES.home) ? SAMPLE_ROUTES : SITE_ROUTES;
  const [scrolled, setScrolled] = useState(false);
  // 맨 위에서 Billboard 그림 위에 겹치는 화면(메인·매장운영·부가서비스) 말고는 본문이 머리말과 같은 흰 바탕이라
  // 맨 위에서도 선을 그어 구분한다 — 로그인·계정 찾기·회원가입·가입 완료·도입문의·공지사항.
  const lined = ![routes.home, routes.storeOperations, routes.addOnServices].includes(pathname);
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
      className={`sticky top-0 z-20 flex h-[110px] items-center border-b px-[80px] transition-[background-color,border-color] duration-150 ${EASE_OUT} motion-reduce:transition-none ${
        scrolled ? "border-guest-line bg-white/95 backdrop-blur-[8px]" : lined ? "border-guest-line" : "border-transparent"
      }`}
    >
      <Link href={routes.home} className="flex items-center gap-[8px] py-[5px]">
        <span className="relative size-[50px] opacity-95">
          <Image src="/guest/logo-whale.svg" alt="" width={49.6875} height={37.4997} className="absolute top-[12.5px] left-0" />
          <Image src="/guest/logo-star.svg" alt="" width={24.1664} height={17.5001} className="absolute top-0 left-[7.57px]" />
        </span>
        <span className="flex flex-col leading-[1.4] [text-box:trim-both_cap_alphabetic]">
          <span className="font-[family-name:var(--font-rem)] text-[20px] font-extrabold tracking-normal text-guest-ink uppercase">
            whale ERP
          </span>
          <span className="font-[family-name:var(--font-inter-tight)] text-[13px] tracking-normal text-[#353535]">
            STORE MANAGEMENT SYSTEM
          </span>
        </span>
      </Link>
      <nav className="flex flex-1 justify-center gap-[80px]">
        {MENUS.map((menu) => {
          const href = menu.route ? routes[menu.route] : "#";
          const current = href === pathname;
          return (
            <Link
              key={menu.label}
              href={href}
              aria-current={current ? "page" : undefined}
              className={`text-[20px] leading-[1.5] font-semibold text-guest-ink hover:text-guest-navy aria-[current=page]:text-guest-navy ${HOVER}`}
            >
              {menu.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-[34px] text-[20px] font-semibold text-[#999]">
        <Link href={routes.login} className={`flex items-center gap-[6px] uppercase hover:text-guest-ink ${HOVER}`}>
          {/* 아이콘을 마스크로 그려 글자색을 따르게 한다 — 호버하면 글자와 함께 먹색으로 바뀐다(Figma 1:1855). */}
          <span aria-hidden className={`size-[24px] bg-current mask-[url(/guest/user-circle.svg)] mask-contain mask-center mask-no-repeat ${HOVER}`} />
          Login
        </Link>
        {SIDE_MENUS.map((menu) => (
          <Link
            key={menu.route}
            href={routes[menu.route]}
            aria-current={routes[menu.route] === pathname ? "page" : undefined}
            className={`hover:text-guest-ink aria-[current=page]:text-guest-navy ${HOVER}`}
          >
            {menu.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
