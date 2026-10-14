import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ErpRoot } from "@/components/common";
import { LoginPendingLink } from "./login-pending";

// 로그인 전 공개 화면 틀 — 위에 GNB(로고·서비스 메뉴·LOGIN/도입문의/공지사항), 아래에 푸터.
// docs/demo/src/public.mjs 의 sitePage · siteNav · siteFoot 과 같다(1팀 Figma 2026_Whale-ERP node 1-689, 2026-10-07).
// 회원가입·가입 완료가 도입문의와 같은 틀을 쓴다(2026-10-13 피드백).
// 홈·로그인·도입문의·공지사항 화면이 아직 없어 메뉴는 누르면 개발 예정 안내창을 띄운다(login-pending.tsx).
// 그 화면들이 생기면 LoginPendingLink 를 next/link 로 바꾼다.
const PAGE_PENDING = "준비 중인 화면입니다.";

const SECTIONS = ["매장운영", "재무관리", "프랜차이즈", "요금안내"];

const QUIET = "flex items-center gap-[4px] text-[14px] font-medium text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink";

// 로고는 회원가입으로 간다 — 실제 홈 화면이 아직 없고, 디자인 샘플(/design/guest)로 보내면
// 거기서 다시 돌아올 길이 없어 회원가입이 막다른 길이 된다(2026-10-14 피드백).
function Brand() {
  return (
    <Link href="/auth/signup" className="flex items-center gap-[10px] text-left">
      <Image src="/icons/logo-whale.svg" alt="" width={53} height={40} />
      <span className="block leading-[1.3] text-[#252525]">
        <span className="block text-[16px] font-extrabold uppercase">Whale ERP</span>
        <span className="block text-[12px]">Management System</span>
      </span>
    </Link>
  );
}

const PersonIcon = (
  <svg viewBox="0 0 24 24" className="size-[16px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
  </svg>
);

function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-[70px] items-center gap-[54px] border-b border-erp-bar-line bg-white px-[24px]">
      <Brand />
      <nav aria-label="서비스 안내" className="flex flex-1 gap-[34px]">
        {SECTIONS.map((label) => (
          <LoginPendingLink
            key={label}
            message={PAGE_PENDING}
            className="text-[15px] font-medium text-erp-ink transition-colors duration-150 ease-out hover:text-erp-brand"
          >
            {label}
          </LoginPendingLink>
        ))}
      </nav>
      <div className="flex items-center gap-[24px]">
        {/* 로그인 화면이 없고, 디자인 샘플(/design/guest/login)로 보내면 돌아올 길이 없어 다시
            안내창으로 되돌린다(2026-10-14 피드백). */}
        <LoginPendingLink className={QUIET}>
          {PersonIcon}
          LOGIN
        </LoginPendingLink>
        <LoginPendingLink message={PAGE_PENDING} className={QUIET}>
          도입문의
        </LoginPendingLink>
        <LoginPendingLink message={PAGE_PENDING} className={QUIET}>
          공지사항
        </LoginPendingLink>
      </div>
    </header>
  );
}

// 인터플러그 로고·소셜 아이콘 자산이 없어 인라인 SVG 로 그렸다(데모와 같음).
const SOCIAL: { label: string; path: ReactNode }[] = [
  {
    label: "인스타그램",
    path: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    label: "유튜브",
    path: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path d="M10.5 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    label: "틱톡",
    path: (
      <path
        d="M14 3v10.2a3.3 3.3 0 1 1-3.3-3.3c.3 0 .6 0 .9.1V7.4a5.9 5.9 0 1 0 5 5.8V8.6c1 .7 2.2 1.1 3.4 1.1V7.1A5.9 5.9 0 0 1 16 3z"
        fill="currentColor"
        stroke="none"
      />
    ),
  },
];

// 11px 세로선(#d9d9d9, DetailTable 값 구분선과 같은 것)으로 나눈 한 줄
function FootRow({ items }: { items: ReactNode[] }) {
  return (
    <p className="flex flex-wrap items-center gap-[10px] text-[13px] text-erp-label">
      {items.map((item, i) => (
        <span key={i} className="contents">
          {i > 0 ? <span className="h-[11px] w-px bg-[#d9d9d9]" /> : null}
          {item}
        </span>
      ))}
    </p>
  );
}

const FOOT_LINK = "text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink";

function SiteFooter() {
  return (
    <footer className="border-t border-erp-bar-line bg-white">
      <div className="mx-auto flex w-[1200px] items-start justify-between gap-[24px] px-[24px] py-[32px]">
        <div className="flex items-start gap-[18px]">
          <div className="flex flex-col items-center gap-[4px]">
            <svg viewBox="0 0 32 32" className="size-[32px] shrink-0" aria-hidden>
              <circle cx="16" cy="16" r="16" fill="#1a1a1a" />
              <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">
                im
              </text>
            </svg>
            <span className="text-[11px] whitespace-nowrap text-erp-label">INTERPLUG Co., Ltd.</span>
          </div>
          <div className="flex flex-col gap-[6px]">
            <FootRow
              items={[
                <LoginPendingLink key="use" message={PAGE_PENDING} className={FOOT_LINK}>
                  이용약관
                </LoginPendingLink>,
                <LoginPendingLink key="privacy" message={PAGE_PENDING} className={FOOT_LINK}>
                  개인정보처리방침
                </LoginPendingLink>,
              ]}
            />
            <FootRow items={["상호: 인터플러그", "주소: 03787 서울특별시 서대문구 연세로 5다길 22-3, 발리빌딩 3층"]} />
            <FootRow items={["이메일: help@interplug.co.kr", "전화번호: 6923-0028", "사업자등록번호 : 1233467890"]} />
            <FootRow items={["통신판매업신고번호: 2021-00000000000"]} />
            <p className="mt-[6px] text-[12px] text-erp-muted">Copyrights© 2026 INTERPLUG. All Rights Reserved.</p>
          </div>
        </div>
        <div className="flex items-center gap-[10px]">
          {SOCIAL.map(({ label, path }) => (
            <LoginPendingLink
              key={label}
              label={label}
              message={PAGE_PENDING}
              className="grid size-[32px] shrink-0 place-items-center rounded-full bg-[#d9dbe0] text-white transition-colors duration-150 ease-out hover:bg-erp-brand"
            >
              <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {path}
              </svg>
            </LoginPendingLink>
          ))}
        </div>
      </div>
    </footer>
  );
}

export function SitePage({ children }: { children: ReactNode }) {
  return (
    <ErpRoot>
      <div className="h-[100dvh] overflow-y-auto bg-white">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </div>
    </ErpRoot>
  );
}
