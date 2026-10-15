import Image from "next/image";
import { Fragment } from "react";
import { HOVER } from "@/app/design/guest/theme";
import { TermsLink } from "./terms-link";

// 1팀 Figma 푸터(데모 guest.mjs footer, src/app/design/guest/guest-footer.tsx 샘플과 같은 모양) — 로그인 전 화면 전체가 공유한다.
// 이용약관·개인정보처리방침은 페이지가 아니라 TermsLink 팝업으로 연다(2026-10-12). 자리값("상호" 둘째 칸 중복)은 Figma 원본 그대로다.
const INFO_ROWS = [
  ["상호: 인터플러그", "상호: 인터플러그", "주소: 03787 서울특별시 서대문구 연세로 5다길 22-3, 발리빌딩 3층"],
  ["이메일: help@interplug.co.kr", "전화번호: 6923-0028", "사업자등록번호 : 1233467890"],
  ["통신판매업신고번호: 2021-00000000000"],
];

function Bar() {
  return <span className="h-[8px] w-px bg-[#ddd]" />;
}

export function SiteFooter() {
  return (
    <footer className="bg-white">
      <div className="border-t border-guest-line px-[80px] pt-[38px] pb-[32px]">
        <div className="flex items-start gap-[100px]">
          <span className="relative h-[50px] w-[80px]">
            <Image src="/guest/footer-logo.svg" alt="인터플러그" width={80} height={49.9939} className="absolute top-0 left-0" />
            <Image src="/guest/footer-logo-text.svg" alt="" width={61.6474} height={5.57821} className="absolute top-[42.71px] left-[3.28px]" />
          </span>
          <div className="flex flex-col gap-[8px] text-[16px] leading-[1.6] text-guest-sub">
            <div className="flex flex-col gap-[2px]">
              {/* <p> 가 아니라 <div>: 약관 <dialog> 는 <p> 안에 둘 수 없어 hydration 오류가 난다 */}
              <div className={`flex items-center gap-[8px] leading-[1.5] ${HOVER}`}>
                <TermsLink kind="use">이용약관</TermsLink>
                <Bar />
                <TermsLink kind="policy">개인정보처리방침</TermsLink>
              </div>
              {INFO_ROWS.map((row, i) => (
                <div key={i} className="flex items-center gap-[8px]">
                  {row.map((text, j) => (
                    <Fragment key={j}>
                      {j > 0 && <Bar />}
                      <span>{text}</span>
                    </Fragment>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-[#888]">Copyrights© 2026 INTERPLUG. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
