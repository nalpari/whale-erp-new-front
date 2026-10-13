"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EASE_OUT } from "@/components/common/theme";
import { HOVER } from "./theme";

// 아직 화면이 없는 메뉴는 href 가 "#" 다. 화면이 생기면 경로를 채운다.
const MENUS = [
  { label: "매장운영", href: "/design/guest/store-operations" },
  { label: "재무관리", href: "#" },
  { label: "프랜차이즈", href: "#" },
  { label: "부가 서비스", href: "/design/guest/add-on-services" },
];

// 비로그인 화면 머리말. 스크롤해도 위에 붙어 있다.
// fixed 가 아니라 sticky 다 — 화면이 1720 보다 좁으면 가로로 스크롤하는데, fixed 는 가로로 따라오지 않아 오른쪽이 잘린다.
// 맨 위에서는 시안대로 바탕 없이 Billboard 위에 겹치고, 스크롤하면 흰 바탕과 선을 깔아 어두운 섹션 위에서도 글자가 보이게 한다.
export function GuestHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // 로그인·계정 찾기는 본문 왼쪽 그림과 머리말이 같은 흰 바탕이라 맨 위에서도 선을 그어 구분한다.
  const lined = pathname === "/design/guest/login" || pathname === "/design/guest/find-account";
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
      <Link href="/design/guest" className="flex items-center gap-[8px] py-[5px]">
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
          const current = menu.href === pathname;
          return (
            <Link
              key={menu.label}
              href={menu.href}
              aria-current={current ? "page" : undefined}
              className={`text-[20px] leading-[1.5] font-semibold text-guest-ink hover:text-guest-navy aria-[current=page]:text-guest-navy ${HOVER}`}
            >
              {menu.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-[34px] text-[20px] font-semibold text-[#999]">
        <Link href="/design/guest/login" className={`flex items-center gap-[6px] uppercase hover:text-guest-ink ${HOVER}`}>
          {/* 아이콘을 마스크로 그려 글자색을 따르게 한다 — 호버하면 글자와 함께 먹색으로 바뀐다(Figma 1:1855). */}
          <span aria-hidden className={`size-[24px] bg-current mask-[url(/guest/user-circle.svg)] mask-contain mask-center mask-no-repeat ${HOVER}`} />
          Login
        </Link>
        <Link href="#" className={`hover:text-guest-ink ${HOVER}`}>
          도입문의
        </Link>
        <Link href="#" className={`hover:text-guest-ink ${HOVER}`}>
          공지사항
        </Link>
      </div>
    </header>
  );
}
