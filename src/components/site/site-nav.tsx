import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/api";
import { homeOf } from "@/lib/auth-routes";

// 로그인 전 상단 메뉴(1팀 Figma GNB, 데모 public.mjs siteNav). 구획 메뉴는 홈의 구획으로 내려간다.
// 오른쪽 묶음은 버튼이 아니라 조용한 글자 링크다. 주소는 데모와 같다(okf/home.md) — 도입문의·공지사항 화면은 아직 없다.
const SECTIONS = [
  ["ops", "매장운영"],
  ["finance", "재무관리"],
  ["franchise", "프랜차이즈"],
  ["addons", "요금안내"],
] as const;

const QUIET = "flex items-center gap-[4px] text-[14px] font-medium text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink";

// 이 화면들은 로그인 전용이 아니다 — 세션이 있는 채로도 그대로 연다(예: 다른 계정으로 로그인해 둔 채 새로 가입).
// "LOGIN"을 그대로 두면 눌러도 proxy.ts의 "로그인한 채 /login 에 오면 자기 홈"에 걸려 아무 설명 없이 자기 홈으로
// 돌아가 로그인이 안 되는 것처럼 보인다(2026-10-16). 세션이 있으면 실제로 가는 곳(자기 홈)을 그대로 보인다 —
// 다른 계정으로 로그인하려면 먼저 로그아웃해야 하는 건 여기서 바꾸지 않는다.
export async function SiteNav() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-10 flex h-[70px] items-center gap-[54px] border-b border-erp-bar-line bg-white px-[24px]">
      <Link href="/" className="flex items-center gap-[10px]">
        <Image src="/icons/logo-whale.svg" alt="" width={53} height={40} />
        {/* #252525 로고 글자: 공통 헤더 로고(global-header.tsx)와 같은 Figma 값 */}
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
        <Link href={session ? homeOf(session.roleTypeCode) : "/login"} className={QUIET}>
          <svg viewBox="0 0 24 24" className="size-[16px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="3.4" />
            <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
          </svg>
          {session ? "홈으로" : "LOGIN"}
        </Link>
        <Link href="/inquiry" className={QUIET}>도입문의</Link>
        <Link href="/notices" className={QUIET}>공지사항</Link>
      </div>
    </header>
  );
}
