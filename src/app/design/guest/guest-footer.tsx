import Image from "next/image";
import { Fragment } from "react";
import { SITE_ROUTES } from "./guest-routes";
import { HOVER } from "./theme";

// 비로그인 화면 전체(실제 라우트·디자인 샘플)가 함께 쓰는 푸터. 이용약관·개인정보처리방침은 약관 전문 화면(/terms)의 그 탭으로 간다 — 데모 guest.mjs 와 같다(2026-10-19).
// Figma 의 회사 정보 그대로다. 「상호」가 두 번 나오는 둘째 칸은 기획 확정 전 자리값이다.
const INFO_ROWS = [
  ["상호: 인터플러그", "상호: 인터플러그", "주소: 03787 서울특별시 서대문구 연세로 5다길 22-3, 발리빌딩 3층"],
  ["이메일: help@interplug.co.kr", "전화번호: 6923-0028", "사업자등록번호 : 1233467890"],
  ["통신판매업신고번호: 2021-00000000000"],
];

function Bar() {
  return <span className="h-[8px] w-px bg-[#ddd]" />;
}

export function GuestFooter() {
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
              {/* Link 가 아니라 <a>: 약관 화면에서 다른 탭으로 갈 때 Next 는 해시만 pushState 로 바꿔 hashchange 가 나지 않아 탭이 따라오지 않는다. */}
              <div className="flex items-center gap-[8px] leading-[1.5]">
                <a href={`${SITE_ROUTES.terms}#TERMS_SERVICE`} className={`hover:text-guest-ink ${HOVER}`}>
                  이용약관
                </a>
                <Bar />
                {/* 개인정보처리방침은 다른 링크보다 굵게 둔다(okf/auth.md 약관, S-XJDKSI) — 로그인 화면 맨 아래 줄이 이 푸터다.
                    따로 두지 않고 개인정보 수집·이용 동의(BP 사업자 회원가입용, #PRIVACY_COLLECT)를 연다(2026-10-19 재영). */}
                <a href={`${SITE_ROUTES.terms}#PRIVACY_COLLECT`} className={`font-semibold hover:text-guest-ink ${HOVER}`}>
                  개인정보처리방침
                </a>
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
