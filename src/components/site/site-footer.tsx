import { TermsLink } from "./terms-link";

// 1팀 Figma 푸터(데모 public.mjs siteFoot). 로고·소셜 아이콘 자산이 없어 인라인 SVG 로 그렸다.
// 이용약관·개인정보처리방침은 페이지가 아니라 로그인 화면과 같은 팝업으로 연다(2026-10-12).
const SEP = <span className="h-[11px] w-px bg-[#d9d9d9]" />; // #d9d9d9: DetailTable 값 구분선과 같은 색(DESIGN.md)

function Row({ items }: { items: React.ReactNode[] }) {
  return (
    // <p> 가 아니라 <div>: 약관 <dialog> 는 <p> 안에 둘 수 없어 hydration 오류가 난다
    <div className="flex flex-wrap items-center gap-[10px] text-[13px] text-erp-label">
      {items.map((it, i) => (
        <span key={i} className="contents">
          {i > 0 && SEP}
          {it}
        </span>
      ))}
    </div>
  );
}

function Social({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <a href="#" aria-label={label} className="grid size-[32px] shrink-0 place-items-center rounded-full bg-[#d9dbe0] text-white transition-colors duration-150 ease-out hover:bg-erp-brand">
      <svg viewBox="0 0 24 24" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-erp-bar-line bg-white">
      <div className="mx-auto flex w-[1200px] items-start justify-between gap-[24px] px-[24px] py-[32px]">
        <div className="flex items-start gap-[18px]">
          <div className="flex flex-col items-center gap-[4px]">
            <svg viewBox="0 0 32 32" className="size-[32px] shrink-0" aria-hidden="true">
              <circle cx="16" cy="16" r="16" fill="#1a1a1a" />
              <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">im</text>
            </svg>
            <span className="text-[11px] whitespace-nowrap text-erp-label">INTERPLUG Co., Ltd.</span>
          </div>
          <div className="flex flex-col gap-[6px]">
            <Row items={[<TermsLink key="u" kind="use">이용약관</TermsLink>, <TermsLink key="p" kind="policy">개인정보처리방침</TermsLink>]} />
            <Row items={["상호: 인터플러그", "주소: 03787 서울특별시 서대문구 연세로 5다길 22-3, 발리빌딩 3층"]} />
            <Row items={["이메일: help@interplug.co.kr", "전화번호: 6923-0028", "사업자등록번호 : 1233467890"]} />
            <Row items={["통신판매업신고번호: 2021-00000000000"]} />
            <p className="mt-[6px] text-[12px] text-erp-muted">Copyrights© 2026 INTERPLUG. All Rights Reserved.</p>
          </div>
        </div>
        <div className="flex items-center gap-[10px]">
          <Social label="인스타그램">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
          </Social>
          <Social label="유튜브">
            <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
            <path d="M10.5 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" />
          </Social>
          <Social label="틱톡">
            <path d="M14 3v10.2a3.3 3.3 0 1 1-3.3-3.3c.3 0 .6 0 .9.1V7.4a5.9 5.9 0 1 0 5 5.8V8.6c1 .7 2.2 1.1 3.4 1.1V7.1A5.9 5.9 0 0 1 16 3z" fill="currentColor" stroke="none" />
          </Social>
        </div>
      </div>
    </footer>
  );
}
