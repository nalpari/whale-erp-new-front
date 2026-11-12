import Image from "next/image";
import Link from "next/link";
import { type ReactNode, ViewTransition } from "react";
import type { GuestRoutes } from "./guest-routes";
import { ARROW_NUDGE, ARROW_NUDGE_BACK, BUTTON_MOTION, HOVER } from "./theme";

// 비로그인 화면들이 함께 쓰는 조각 — 섹션 제목, 버튼, 화살표, 글자 위아래 여백 자르기.

export const TRIM = "[text-box:trim-both_cap_alphabetic]";
// 시안의 제목은 모두 「옅은 첫 줄 + 굵은 둘째 줄」 52px 두 줄이다.
// 띠지(알약) — 시작 세 단계의 STEP 꼬리표와 같은 모양이다. 홈 「매장 유형별 안내」 · 「기본 제공 혜택」이 쓴다(2026-11-09 사용자 지정).
export function GuestTag({ children }: { children: ReactNode }) {
  // 알약 띠지 대신 제목 위 작은 회색 글자 — 참고 사이트의 「Point 1」처럼 가볍게(2026-11-11 사용자 지정).
  return <span className={`text-[16px] leading-[1.5] font-bold tracking-normal text-guest-navy-soft ${TRIM}`}>{children}</span>;
}

// tag 는 제목 위 띠지(GuestTag). oneLine 은 얇은 앞말 · 굵은 뒷말을 한 줄로 잇는다 — 홈 화면 섹션 제목(2026-11-09 사용자 지정).
export function SectionTitle({ light, bold, dark = false, tag, oneLine = false }: { light: string; bold: string; dark?: boolean; tag?: string; oneLine?: boolean }) {
  const part = oneLine ? "" : "block ";
  const title = (
    <h2 className={`text-[52px] leading-[1.2] tracking-[-0.025em] ${oneLine ? "whitespace-nowrap " : ""}${dark ? "text-[#f5f5f5]" : "text-guest-ink"}`}>
      <span className={`${part}font-normal`}>{light}</span>
      {oneLine && " "}
      <span className={`${part}font-bold`}>{bold}</span>
    </h2>
  );
  if (!tag) return title;
  return (
    // 제목 위 작은 회색 글자와 제목 사이는 붙인다(12px, 2026-11-11 사용자 지정 — 전엔 알약 띠지 · 24px).
    <div className="flex flex-col items-start gap-[12px]">
      <GuestTag>{tag}</GuestTag>
      {title}
    </div>
  );
}

// 화살표는 SVG 를 마스크로 써서 글자색을 따른다 — 호버로 글자색이 바뀌면 화살표도 같이 바뀐다.
// back 은 시안의 「로그인 이동」처럼 같은 화살표를 좌우로 뒤집은 것이다.
export function Arrow({ back = false }: { back?: boolean }) {
  return (
    <span
      aria-hidden
      className={`h-[15.0674px] w-[16.7004px] shrink-0 bg-current mask-[url(/guest/arrow.svg)] mask-contain mask-center mask-no-repeat ${back ? `-scale-x-100 ${ARROW_NUDGE_BACK}` : ARROW_NUDGE}`}
    />
  );
}

// 호버는 ERP 버튼처럼 흰 바탕 + 남색 테두리·글자로 바꾼다. 테두리는 처음부터 같은 굵기로 깔아 크기가 흔들리지 않는다.
const BUTTON_TONE = {
  navy: "border-guest-navy bg-guest-navy text-white hover:bg-white hover:text-guest-navy",
  soft: "border-guest-navy-soft bg-guest-navy-soft text-white hover:border-guest-navy hover:bg-white hover:text-guest-navy",
  outline: "border-guest-button-line bg-white text-guest-ink hover:border-guest-navy hover:text-guest-navy",
  line: "border-guest-navy-soft bg-white text-guest-navy hover:border-guest-navy",
  // 흰 바탕 · 남색 테두리 · 남색 글자, 호버하면 남색으로 채운다 — 첫 화면에 있던 [무료로 시작하기] · [도입문의](2026-11-11 뺐다)와 같은 모양. 메인 사장님 유형 카드 버튼(2026-11-09 사용자 지정).
  invert: "border-guest-navy bg-white text-guest-navy hover:bg-[rgba(58,86,112,0.9)] hover:text-white",
};
export function GuestButton({
  tone,
  href = "#",
  submit = false,
  onClick,
  arrow = false,
  grow = false,
  tall = false,
  children,
}: {
  tone: keyof typeof BUTTON_TONE;
  href?: string;
  // true 면 <Link> 대신 <button type="submit"> 로 그린다 — 감싼 <form action>(서버 액션)을 부를 때 쓴다
  // (href 는 이때 쓰지 않는다). signup/done 의 「웨일ERP 시작하기」처럼 이동이 아니라 동작일 때.
  submit?: boolean;
  // 주면 <button type="button"> 으로 그린다 — 「다시 시도」처럼 화면을 옮기지 않는 동작(클라이언트 컴포넌트에서만 넘길 수 있다).
  onClick?: () => void;
  // true 는 글 뒤에 나아가는 화살표, "back" 은 글 앞에 되돌아가는 화살표.
  arrow?: boolean | "back";
  grow?: boolean;
  // 폼 아래 버튼 줄은 66px 이다.
  tall?: boolean;
  children: ReactNode;
}) {
  const className = `flex ${tall ? "h-[66px]" : "h-[48px]"} shrink-0 items-center justify-center gap-[12px] rounded-[6px] border px-[18px] text-[18px] leading-[1.5] font-semibold whitespace-nowrap ${BUTTON_MOTION} ${grow ? "flex-1" : ""} ${BUTTON_TONE[tone]}`;
  const content = (
    <>
      {arrow === "back" && <Arrow back />}
      {children}
      {arrow === true && <Arrow />}
    </>
  );
  if (submit || onClick)
    return (
      <button type={submit ? "submit" : "button"} onClick={onClick} className={className}>
        {content}
      </button>
    );
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

export function TitleRow({ light, bold, action, oneLine = false, tag }: { light: string; bold: string; action: ReactNode; oneLine?: boolean; tag?: string }) {
  return (
    <div className="flex items-end justify-between">
      <SectionTitle light={light} bold={bold} oneLine={oneLine} tag={tag} />
      {action}
    </div>
  );
}

// 시안의 아이콘 그라데이션(옅은 회청 → 진한 청). 달력·봉투·책갈피 아이콘이 함께 쓴다.
export const ICON_GRADIENT = "linear-gradient(114deg, rgba(174,190,206,0.8) 8.98%, rgba(32,96,154,0.8) 94.82%)";

// 비로그인 화면 사이를 옮길 때 본문을 겹쳐 바꾼다(globals.css 의 guest-page). 레이아웃은 화면을 옮겨도 남아 있어
// 들어오고 나가는 순간이 생기지 않으므로 각 page 가 이것으로 본문을 감싼다. 머리말은 움직이지 않는다.
// 본문과 푸터 사이는 시안대로 60px 띄운다. 로그인처럼 푸터가 본문에 바로 붙는 화면은 flush 를 준다.
export function GuestPage({ children, flush = false }: { children: ReactNode; flush?: boolean }) {
  return (
    <ViewTransition enter="guest-page" exit="guest-page" default="none">
      <div className={flush ? "" : "pb-[60px]"}>{children}</div>
    </ViewTransition>
  );
}

// 고래 그림 아랫단의 구름색 — 판이 늘어난 곳의 바탕과 그림 아랫단 흐림이 같은 색이어야 경계가 보이지 않는다(2026-11-12)
const CLOUD_BG = "bg-[#eceef2]";
const CLOUD_TO = "to-[#eceef2]";

// 로그인·계정 찾기 왼쪽 칸 — 구름 위 고래 그림에 영문 머리말, 큰 제목, 안내 두 줄을 아래쪽에 얹는다.
export function GuestVisual({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children: ReactNode }) {
  return (
    // 로그인 · 계정 찾기 · 가입 완료를 오갈 때 튕기지 않게(2026-11-12 사용자 지정) — 그림과 글은 늘 높이 755px(로그인 화면 높이) 판에 그려 같은 자리 · 같은 크기로 둔다.
    // 오른쪽 폼이 더 길어지면(비밀번호 찾기 탭 · 결과 안내) 칸만 아래로 늘고, 늘어난 곳은 그림 아랫단과 같은 구름색(#eceef2)이 이어진다 — 전엔 칸 높이를 따라 고래가 커졌다 작아졌다.
    // 같은 그림이 다시 떠오르지 않게 이름(guest-visual)을 따로 줘 본문 전환(guest-page)에서 뺀다(globals.css).
    <div style={{ viewTransitionName: "guest-visual" }} className={`relative overflow-hidden ${CLOUD_BG}`}>
      <div className="relative flex h-[755px] flex-col justify-end gap-[32px] px-[60px] py-[74px]">
        {/* 16:9 그림이 높이 755px 판을 채우느라 폭 1300px 가까이로 그려진다. sizes 를 칸 폭(50vw)으로 주면
            작은 사본을 받아 늘려 그려 흐려지므로, 실제로 그려지는 폭을 알려 준다. 아랫단은 구름색으로 옅게 이어 칸이 늘어도 경계가 보이지 않게 한다. */}
        <Image src="/guest/login/visual.png" alt="" fill loading="eager" sizes="max(50vw, 1300px)" className="object-cover" />
        <span aria-hidden className={`absolute inset-x-0 bottom-0 h-[120px] bg-gradient-to-b from-transparent ${CLOUD_TO}`} />
        <div className="relative flex flex-col gap-[34px] uppercase">
          {eyebrow && <p className={`font-[family-name:var(--font-rem)] text-[24px] leading-none font-medium tracking-[-0.025em] text-[rgba(58,86,112,0.5)] ${TRIM}`}>{eyebrow}</p>}
          {title}
        </div>
        {/* 한글 두 줄은 위 영문 제목과 같은 시작선에 둔다 — 전엔 10px 안쪽에서 시작해 시작선이 둘이었다(2026-11-10 사용자 지정). */}
        <p className={`relative text-[17px] leading-[1.4] text-[rgba(58,86,112,0.6)] ${TRIM}`}>{children}</p>
      </div>
    </div>
  );
}

// 자주 묻는 질문 한 줄(메인 · 공지사항 FAQ). name 을 같이 준 <details> 라 하나를 열면 나머지가 닫힌다.
// 펼침 움직임은 globals.css 의 details[name="guest-faq"] 가 맡는다.
// 여백은 박스가 아니라 질문 줄(summary)에 둬서 박스 거의 전체가 눌린다. 박스에는 아래 4px 만 남긴다(위 22 · 아래 22 를 맞추려고).
// 답변 간격도 margin 이 아니라 padding 이어야 펼침 높이에 함께 들어간다 — margin 이면 열 때 튄다.
// category 는 질문 앞의 카테고리 이름(공지사항 FAQ #294). 답변 평문의 줄바꿈은 그대로 살린다.
export function FaqItem({ q, category, open = false, children }: { q: string; category?: string; open?: boolean; children?: ReactNode }) {
  return (
    <details name="guest-faq" open={open} className="group rounded-[3px] bg-guest-surface pb-[4px] open:bg-[#f5f5f5]">
      <summary className={`flex cursor-pointer px-[20px] pt-[22px] pb-[18px] list-none items-center gap-[11px] text-[17px] leading-[1.5] font-semibold text-guest-ink hover:text-guest-navy ${HOVER} [&::-webkit-details-marker]:hidden`}>
        <span className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-guest-navy text-[18px] font-bold tracking-normal text-white">Q</span>
        {category && <span className="shrink-0 text-[15px] font-medium text-guest-sub">{category}</span>}
        <span className="flex-1">{q}</span>
        <Image src="/guest/faq-plus.svg" alt="" width={28} height={28} className="group-open:hidden" />
        <Image src="/guest/faq-close.svg" alt="" width={28} height={28} className="hidden group-open:block" />
      </summary>
      {children && <p className="pr-[20px] pb-[18px] pl-[60px] text-[16px] leading-[1.5] whitespace-pre-line text-guest-sub">{children}</p>}
    </details>
  );
}

// 화면 아래에 늘 떠 있는 무료 가입 띠 — 페이히어 소개의 아래 상담 띠처럼 스크롤해도 따라온다(2026-11-11 사용자 지정). 홈과 소개 화면(매장운영 · 재무관리 · 프랜차이즈 · 부가서비스)이 함께 쓴다(2026-11-12 사용자 지정).
// 짙은 남색 반투명 판(뒤 화면이 비친다 · 흐림 처리) 왼쪽에 「가입 즉시 무료 이용」 꼬리표 + 무료 혜택 셋, 오른쪽에 [무료로 시작] · [도입문의]. 떠 있는 것이라 옅은 그림자를 준다.
// 「우리 매장 관리를 시작해 보세요.」 대신 혜택을 두고, 첫 화면의 「가입 즉시 무료 이용」 줄을 이리로 옮겼다(2026-11-12 사용자 지정).
// 「직원 5명 초대」 · 「직원 전용 앱」은 한 뜻이라 합쳤고(「앱 초대」만 쓰면 ERP 앱처럼 읽혀 용어집 이름 「직원 근무 앱」을 쓴다), 관리자는 「계정 자유롭게 추가」로 말한다(2026-11-12 사용자 지정).
const FREE_BENEFITS = ["점포 1개 운영", "직원 5명 근무 앱 초대", "관리자 계정 자유롭게 추가"] as const;

export function FloatingActions({ routes }: { routes: GuestRoutes }) {
  return (
    <div className="guest-floating pointer-events-none fixed inset-x-0 bottom-[24px] z-30 flex justify-center">
      <div className="pointer-events-auto flex max-w-[calc(100vw-32px)] items-center gap-[40px] rounded-[20px] bg-[rgba(28,38,48,0.7)] py-[14px] pr-[14px] pl-[32px] shadow-[0_12px_32px_rgba(28,38,48,0.25)] backdrop-blur-[2px]">
        <p className="flex items-center text-[18px] leading-[1.5] font-semibold whitespace-nowrap text-white">
          {/* 띠의 제목이라 꼬리표(알약)로 — 연하늘 바탕 · 짙은 남색 글자(2026-11-12 사용자 지정). 화면 읽기는 꼬리표 뒤 쌍점으로 끊어 읽고 가운뎃점은 읽지 않는다 */}
          <span className="flex h-[34px] items-center rounded-full bg-[#9cc3ff] px-[14px] text-[15px] font-bold text-[#1c2630]">가입 즉시 무료 이용</span>
          <span className="sr-only">: </span>
          {/* 띠는 화면에 고정되어 창보다 넓으면 양옆이 잘린다 — 1400px 아래 창에서는 혜택 셋을 숨기고 꼬리표 · 버튼만 남긴다(PR 리뷰) */}
          <span className="ml-[18px] flex items-center max-[1400px]:hidden">
            {FREE_BENEFITS.map((benefit, i) => (
              <span key={benefit} className="flex items-center">
                {i > 0 && (
                  <span aria-hidden className="mx-[10px] text-white/50">
                    ·
                  </span>
                )}
                {benefit}
              </span>
            ))}
          </span>
        </p>
        <div className="flex gap-[8px]">
          <Link
            href={routes.signUp}
            className={`flex h-[60px] items-center justify-center gap-[10px] rounded-[12px] bg-white px-[36px] text-[19px] leading-[1.5] font-semibold text-guest-navy hover:bg-[#e9eef3] ${BUTTON_MOTION}`}
          >
            무료로 시작
            <Arrow />
          </Link>
          <Link
            href={routes.leads}
            className={`flex h-[60px] items-center justify-center rounded-[12px] border border-white/50 px-[36px] text-[19px] leading-[1.5] font-semibold text-white hover:bg-white/15 ${BUTTON_MOTION}`}
          >
            도입문의
          </Link>
        </div>
      </div>
    </div>
  );
}
