import Image from "next/image";
import Link from "next/link";

// 로그인 전 상단 메뉴(1팀 Figma GNB, 데모 public.mjs siteNav). 구획 메뉴는 홈의 구획으로 내려간다.
// 오른쪽 묶음은 버튼이 아니라 조용한 글자 링크다. 주소는 데모와 같다(okf/home.md) — 도입문의·공지사항 화면은 아직 없다.
const SECTIONS = [
  ["ops", "매장운영"],
  ["finance", "재무관리"],
  ["franchise", "프랜차이즈"],
  ["addons", "요금안내"],
] as const;

const QUIET = "flex items-center gap-[4px] text-[14px] font-medium text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-10 flex h-[70px] items-center gap-[54px] border-b border-erp-bar-line bg-white px-[24px]">
      <Link href="/" className="flex items-center gap-[10px]">
        <Image src="/icons/logo-whale.svg" alt="" width={53} height={40} />
        <p className="leading-[1.3] text-[#252525]">
          <span className="block text-[16px] font-extrabold uppercase">Whale ERP</span>
          <span className="block text-[12px]">Management System</span>
        </p>
      </Link>
      <nav aria-label="서비스 안내" className="flex flex-1 gap-[34px]">
        {SECTIONS.map(([id, label]) => (
          <Link key={id} href={`/#${id}`} className="text-[15px] font-medium text-erp-ink transition-colors duration-150 ease-out hover:text-erp-brand">
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-[24px]">
        <Link href="/login" className={QUIET}>
          <svg viewBox="0 0 24 24" className="size-[16px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="3.4" />
            <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
          </svg>
          LOGIN
        </Link>
        <Link href="/inquiry" className={QUIET}>도입문의</Link>
        <Link href="/notices" className={QUIET}>공지사항</Link>
      </div>
    </header>
  );
}
