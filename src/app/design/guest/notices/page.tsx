import type { Metadata } from "next";
import Link from "next/link";
import { FaqItem, GuestButton, GuestPage } from "../guest-ui";
import { HOVER } from "../theme";
import { NoticesBoard } from "./notices-board";

export const metadata: Metadata = { title: "Whale ERP · 공지사항 · FAQ" };

// 구분 배지 색은 메인 「새로운 소식」과 같다. 고정 글은 남색 배지를 앞에 단다.
const BADGE = {
  고정: "bg-guest-navy text-white",
  안내: "bg-[#f2f6ff] text-[#366fe3]",
  점검: "bg-[#e7f7f1] text-[#11b076]",
  기능: "bg-guest-card text-guest-navy",
  약관: "bg-[#f5f5f5] text-guest-sub",
};
type BadgeKind = keyof typeof BADGE;

function Badge({ kind }: { kind: BadgeKind }) {
  return <span className={`flex h-[30px] shrink-0 items-center rounded-[3px] px-[10px] text-[15px] leading-[1.4] font-semibold ${BADGE[kind]}`}>{kind}</span>;
}

// 글은 목업(docs/mockup/home/notices.html)의 예시다. 공지사항 API 가 생기면 비로그인 노출 글을 받아 그린다.
const NOTICES: { pinned?: boolean; kind: BadgeKind; title: string; date: string }[] = [
  { pinned: true, kind: "점검", title: "9월 정기 점검 안내 (09-14 02:00~05:00)", date: "2026.09.05" },
  { kind: "기능", title: "근로계약 전자날인 기능이 열렸습니다", date: "2026.09.01" },
  { kind: "약관", title: "개인정보처리방침 개정 안내", date: "2026.08.25" },
  { kind: "안내", title: "WHALE ERP 1차 오픈 일정 안내", date: "2026.08.19" },
];

const STRONG = "font-semibold text-guest-ink";

export default function NoticesPage() {
  const notices = (
    <ul className="text-[17px] leading-[1.5]">
      {NOTICES.map((n) => (
        <li key={n.title} className="flex items-center gap-[12px] border-b border-guest-list-line px-[10px] py-[22px]">
          {n.pinned && <Badge kind="고정" />}
          <Badge kind={n.kind} />
          <Link href="#" className={`flex-1 truncate text-guest-ink hover:text-guest-navy ${HOVER}`}>
            {n.title}
          </Link>
          <span className="text-guest-sub">{n.date}</span>
        </li>
      ))}
    </ul>
  );

  const faq = (
    <div className="flex flex-col gap-[8px] pt-[24px]">
      <FaqItem q="가입은 누가 할 수 있나요?" open>
        식당·카페를 직접 운영하는 <b className={STRONG}>일반 BP</b>와 가맹점을 두는 <b className={STRONG}>본사 BP</b>가 직접 가입합니다. 가맹점은 가입하지 않고,
        본사가 만들어 준 관리자 계정으로 로그인합니다.
      </FaqItem>
      <FaqItem q="직원도 이 사이트로 로그인하나요?">
        아닙니다. 직원은 <b className={STRONG}>직원 전용 앱</b>으로 들어갑니다. 관리자가 근로계약서 초안을 저장하면 초대가 문자로 나가고, 직원은 앱에서 가입과 계약서
        날인을 합니다.
      </FaqItem>
      <FaqItem q="점포가 여러 개면 어떻게 보나요?">
        화면 위쪽에서 조회 범위를 고릅니다. 전체·직영·가맹 또는 점포 하나를 고르면 그 뒤의 모든 조회가 그 범위로 맞춰집니다.
      </FaqItem>
      <FaqItem q="급여를 계산해 주나요?">
        근로계약과 출퇴근 기록을 참조해 <b className={STRONG}>초안</b>을 만들어 드립니다. 4대보험 같은 공제는 관리자가 직접 넣고, 급여 지급 자체는 제공하지 않습니다.
      </FaqItem>
      <FaqItem q="요금은 어떻게 되나요?">
        점포 수와 직원 수에 따른 요금 PLAN이 있고, POS·KIOSK 같은 부가서비스는 따로 구독합니다. 자세한 내용은{" "}
        <Link href="/design/guest/inquiry" className={`font-semibold text-guest-navy underline underline-offset-[3px] hover:text-guest-ink ${HOVER}`}>
          도입문의
        </Link>
        로 물어보실 수 있습니다.
      </FaqItem>
    </div>
  );

  return (
    <GuestPage>
      <section className="mx-auto flex w-[1200px] flex-col gap-[40px] pt-[80px] text-guest-ink">
        <div className="flex items-end justify-between gap-[24px]">
          <div className="flex flex-col gap-[8px]">
            <h1 className="text-[28px] leading-[1.2] font-bold">공지사항 · FAQ</h1>
            <p className="text-[16px] leading-[1.5]">로그인하지 않아도 볼 수 있는 글만 모았습니다.</p>
          </div>
          <GuestButton tone="outline" href="/design/guest/inquiry" arrow>
            도입문의
          </GuestButton>
        </div>
        <NoticesBoard notices={notices} faq={faq} />
      </section>
    </GuestPage>
  );
}
