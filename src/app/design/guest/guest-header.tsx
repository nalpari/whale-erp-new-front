import Image from "next/image";
import Link from "next/link";
import { HOVER } from "./theme";

const MENUS = ["매장운영", "재무관리", "프랜차이즈", "부가 서비스"];

// 비로그인 화면 머리말. 바탕이 없어 Billboard 위에 겹쳐 놓는다.
export function GuestHeader() {
  return (
    <header className="flex h-[110px] items-center px-[80px]">
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
        {MENUS.map((menu) => (
          <Link key={menu} href="#" className={`text-[20px] leading-[1.5] font-semibold text-guest-ink hover:text-guest-navy ${HOVER}`}>
            {menu}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-[34px] text-[20px] font-semibold text-[#999]">
        <Link href="#" className={`flex items-center gap-[6px] uppercase hover:text-guest-ink ${HOVER}`}>
          <Image src="/guest/user-circle.svg" alt="" width={24} height={24} />
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
