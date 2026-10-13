import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { HOVER } from "./theme";

// Figma 의 회사 정보 그대로다. 「상호」가 두 번 나오는 둘째 칸은 기획 확정 전 자리값이다.
const INFO_ROWS = [
  ["상호: 인터플러그", "상호: 인터플러그", "주소: 03787 서울특별시 서대문구 연세로 5다길 22-3, 발리빌딩 3층"],
  ["이메일: help@interplug.co.kr", "전화번호: 6923-0028", "사업자등록번호 : 1233467890"],
  ["통신판매업신고번호: 2021-00000000000"],
];

const SNS = [
  { name: "Instagram", src: "/guest/sns-instagram.svg", width: 23.9859, height: 23.9953 },
  { name: "YouTube", src: "/guest/sns-youtube.svg", width: 24, height: 16.8797 },
  { name: "TikTok", src: "/guest/sns-tiktok.svg", width: 24, height: 24 },
];

function Bar() {
  return <span className="h-[8px] w-px bg-[#ddd]" />;
}

export function GuestFooter() {
  return (
    <footer className="bg-white pt-[60px]">
      <div className="flex items-center justify-between border-t border-guest-line px-[80px] pt-[38px] pb-[32px]">
        <div className="flex items-start gap-[100px]">
          <span className="relative h-[50px] w-[80px]">
            <Image src="/guest/footer-logo.svg" alt="인터플러그" width={80} height={49.9939} className="absolute top-0 left-0" />
            <Image src="/guest/footer-logo-text.svg" alt="" width={61.6474} height={5.57821} className="absolute top-[42.71px] left-[3.28px]" />
          </span>
          <div className="flex flex-col gap-[8px] text-[16px] leading-[1.6] text-guest-sub">
            <div className="flex flex-col gap-[2px]">
              <div className="flex items-center gap-[8px] leading-[1.5]">
                <Link href="#" className={`hover:text-guest-ink ${HOVER}`}>
                  이용약관
                </Link>
                <Bar />
                <Link href="#" className={`hover:text-guest-ink ${HOVER}`}>
                  개인정보처리방침
                </Link>
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
        <div className="flex gap-[8px]">
          {SNS.map((sns) => (
            <Link
              key={sns.name}
              href="#"
              aria-label={sns.name}
              className={`flex size-[44px] items-center justify-center rounded-full bg-[#ddd] hover:bg-guest-navy-soft ${HOVER}`}
            >
              <Image src={sns.src} alt="" width={sns.width} height={sns.height} />
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
