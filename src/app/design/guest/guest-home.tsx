import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, type ReactNode } from "react";
import type { components } from "@/lib/api-types.generated";
import type { GuestRoutes } from "./guest-routes";
import { Arrow, FaqItem, GuestButton, GuestPage, SectionTitle, TRIM } from "./guest-ui";
import { Badges, dotDate } from "./notices/notice-views";
import { AttendanceMock, MOCK, MOCK_BUTTON, MockField, MockRow, StaffAppHomeMock, StoreCardMock } from "./screen-mocks";
import { BUTTON_MOTION, FRAME, HOVER } from "./theme";

// 카드 번호(01)는 따로 줄을 두지 않고 제목 앞에 연한 남색으로 붙인다(2026-11-10 사용자 지정).
// 섹션 위아래 여백은 모두 100px 로 같다. 카드 제목 · 상자 머리 글자는 바탕색과 상관없이 남색, 섹션 제목만 먹색(2026-11-10 사용자 지정).

// Figma 「로그인전_Main」(RQmNVgT2NL0njIFXVQPVG6 · 44:2, 로그인전_공유 — 2026-11-06 반영). 1920 폭 데스크톱 시안이다.
// 실제 홈((site)/page.tsx)과 디자인 샘플(design/guest/page.tsx)이 함께 그린다. 링크는 받은 routes 로 건다(guest-routes.ts).

const HIGHLIGHTS = [
  { no: "01", title: "점포 1개 운영" },
  { no: "02", title: "직원 5명 초대" },
  { no: "03", title: "직원 전용 앱" },
  { no: "04", title: "관리자 등록" },
] as const;

// 유료 부가서비스 — 오픈 전이라 판 안에서 아이콘 + 글자가 흐른다. 아이콘은 연한 남색 선(2026-11-10 사용자 지정).
const PANEL_ICON = {
  storeAdd: '<path d="M7 18l3-10h28l3 10"/><path d="M7 18c0 3 2.5 5 5.5 5s5.5-2 5.5-5c0 3 2.5 5 6 5s6-2 6-5c0 3 2.5 5 5.5 5S41 21 41 18"/><path d="M10 23v17h28V23"/><path d="M24 27v10M19 32h10"/>',
  staff: '<circle cx="19" cy="15" r="7"/><path d="M6 40c0-7.2 5.8-13 13-13 3.4 0 6.5 1.3 8.8 3.4"/><path d="M37 28v12M31 34h12"/>',
  pickup: '<path d="M11 11h26v5H11z"/><path d="M14 16l3 27h14l3-27"/><path d="M15.6 27h16.8"/><path d="M20 11l1-5h6l1 5"/>',
  stock: '<path d="M24 5l17 9v20l-17 9-17-9V14l17-9z"/><path d="M7 14l17 9 17-9M24 23v20"/>',
  recipe: '<path d="M8 8h13a5 5 0 0 1 5 5v28a4 4 0 0 0-4-4H8V8z"/><path d="M40 8H27a5 5 0 0 0-5 5v28a4 4 0 0 1 4-4h14V8z"/>',
} as const;

// 메뉴 · 가격 관리는 마스터 관리로 무료 제공이라 유료 부가서비스 목록에 넣지 않는다(2026-11-10 사용자 지정).
const ADD_ONS_SOON = [
  { icon: "storeAdd", title: "점포수 추가" },
  { icon: "staff", title: "직원수 추가" },
  { icon: "pickup", title: "픽업 오더" },
  { icon: "stock", title: "발주 · 재고 관리" },
  { icon: "recipe", title: "레시피 관리" },
] as const;

// 아이콘은 부가서비스 판에만, 번호(01~04)와 칸 사이 세로선은 무료 판에만 둔다(2026-11-10 사용자 지정).
function HeroPanel({ tag, items, soon = false }: { tag: string; items: readonly { icon?: keyof typeof PANEL_ICON; no?: string; title: string }[]; soon?: boolean }) {
  const item = (it: (typeof items)[number], key: string, hidden = false) => (
    <li key={key} aria-hidden={hidden || undefined} className={`flex items-center gap-[12px] ${soon ? "shrink-0 pr-[48px]" : "flex-1 border-l border-[rgba(130,151,168,0.3)] pl-[28px]"}`}>
      {it.icon && (
        <svg
          aria-hidden
          viewBox="0 0 48 48"
          className="size-[24px] shrink-0 text-guest-navy-soft"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          dangerouslySetInnerHTML={{ __html: PANEL_ICON[it.icon] }}
        />
      )}
      {it.no && <span className="-mr-[4px] text-guest-navy-soft">{it.no}</span>}
      {it.title}
    </li>
  );
  // 두 판은 높이(76px)를 같게 고정한다 — 글자 크기가 달라 높이가 다르면 같은 24px 모서리도 다르게 둥글어 보였다(2026-11-10 사용자 지정).
  // 무료 · 유료 두 판 모두 바탕 · 테두리 없이 글만 고래 배경 위에 둔다(2026-11-11 사용자 지정).
  return (
    <div className={`flex h-[76px] items-center rounded-[24px] px-[28px]`}>
      {/* 판 이름은 알약 띠지 대신 글자만 — 판 안에서 알약이 무거웠다(2026-11-10 사용자 지정). */}
      <span className="w-[220px] shrink-0 text-[17px] leading-[1.5] font-bold text-guest-step">{tag}</span>
      {soon ? (
        // 부가서비스는 띠처럼 왼쪽으로 흐른다(2026-11-11 사용자 지정 — 전엔 사진 띠와 반대로 오른쪽) — 사진 띠와 같은 움직임(묶음 네 번, 절반 가면 처음과 같은 그림). 양 끝은 판 안에서 흐리게(2026-11-10 사용자 지정).
        <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <ul className="guest-photo-roll flex w-max items-center text-[17px] leading-[1.6] font-semibold text-guest-navy-soft" style={{ animationDuration: "30s" }}>
            {[0, 1, 2, 3].map((round) => items.map((it) => item(it, `${round}-${it.title}`, round > 0)))}
          </ul>
        </div>
      ) : (
        <ul className="flex flex-1 items-center text-[22px] leading-[1.6] font-bold text-guest-navy">{items.map((it) => item(it, it.title))}</ul>
      )}
    </div>
  );
}

// 머리말(110px)이 Billboard 위에 겹치도록 그만큼 끌어올린다.
// 머리말 아래 빈 하늘 100px 를 잘라 1080 → 980 으로 줄였다(2026-11-09 사용자 지정).
function Billboard() {
  return (
    <section className="relative -mt-[110px] overflow-hidden pt-[210px] pb-[100px]">
      <Image src="/guest/billboard-bg.png" alt="" fill loading="eager" sizes="100vw" className="object-cover" />
      {/* 정사각 그림을 677×375 에 늘여 채운 것이 시안이다 — object-cover 로 바꾸면 고래가 잘린다.
          시안의 2px 흐림은 너무 뿌옇다는 요청(2026-10-13)으로 뺐다.
          고래는 가운데에서 오른쪽으로 200px 옮겨 왼쪽 슬로건 · 카피와 겹치지 않게 한다(2026-11-09 사용자 지정). */}
      <div className="guest-whale absolute top-[410px] left-[max(calc(50%+200px),940px)] h-[375px] w-[677px] -translate-1/2">
        <Image src="/guest/billboard-whale.png" alt="" fill loading="eager" sizes="677px" />
      </div>
      {/* 높이를 980px 로 고정하지 않고 글 묶음 높이에 맞춘다 — 머리말(110px) 아래 위 여백 100px · 아래 여백 100px 로 다른 섹션과 같게(2026-11-10 사용자 지정). */}
      <div className="relative">
        {/* 가로 틀은 아래 섹션과 같은 FRAME — 글 · 띠지 · 네 칸의 왼쪽 시작선을 아래 섹션 제목과 맞춘다(2026-11-09 사용자 지정). */}
        <div className={`${FRAME} flex flex-col gap-[80px]`}>
          <div className="flex items-end justify-between">
            <div className="flex w-[445px] flex-col gap-[48px]">
              {/* 영문 WHALE ERP 자리에 슬로건(윗줄 48px · 아랫줄 86px). 한글은 REM 글꼴에 없어 기본 글꼴(Pretendard) 800 으로 그린다.
                  칸(445px)보다 넓은 줄은 w-max 로 상자를 글자 폭만큼 넓혀야 그라데이션이 끝 글자까지 칠해진다. 큰 글자는 글자 앞 여백도 커서 안으로 들어가 보여 음수 여백(-0.05em · -0.03em)으로 아래 줄 시작선에 맞춘다.
                  글자 칠은 배경을 글자 모양으로 오린 것이라 TRIM 으로 줄 상자를 대문자 높이까지 깎으면 한글 위아래가 잘려,
                  이 두 줄만 TRIM 없이 줄 높이로 간격을 둔다(2026-11-09 사용자 지정). */}
              <p className="flex flex-col gap-[4px] font-extrabold text-transparent">
                <span className="-ml-[0.03em] w-max bg-gradient-to-r from-[rgba(58,86,112,0.7)] to-[rgba(58,86,112,0.35)] bg-clip-text text-[48px] leading-[1.3] tracking-[-0.025em] whitespace-nowrap">
                  식당·카페 사장님의
                </span>
                <span className="-ml-[0.05em] w-max bg-gradient-to-r from-[rgba(58,86,112,0.8)] to-[rgba(58,86,112,0.36)] bg-clip-text text-[86px] leading-[1.25] tracking-[-0.025em] whitespace-nowrap">
                  든든한 파트너
                </span>
              </p>
              <div className="flex flex-col gap-[24px] text-guest-navy">
                <p className={`text-[22px] leading-[1.5] font-bold whitespace-nowrap ${TRIM}`}>복잡한 매장 운영, WHALE ERP 하나로 쉬워집니다</p>
                <p className={`text-[17px] leading-[1.5] whitespace-nowrap ${TRIM}`}>
                  직원 계약·근무표·급여, 매출·재무, 가맹점 관리까지
                  <br />
                  여러 서비스를 일일이 알아보고 관리할 필요 없이 플랫폼 하나로 해결
                </p>
              </div>
            </div>
            {/* 첫 화면의 [무료로 시작하기] · [도입문의] 버튼은 뺐다 — 머리말에 도입문의 · 로그인이 있고, 아래 「시작 방법」에 회원가입 버튼이 있다(2026-11-11 사용자 지정). */}
          </div>
          {/* 가입 즉시 무료 이용 · 부가서비스 — 같은 반투명 흰 판 두 장을 같은 틀(띠지 칸 220px + 네 칸)로 쌓아, 아래 칸이 위 칸과 세로로 맞는다.
              부가서비스는 오픈 전이라 글자를 17px 연한 남색으로 줄여 무료보다 한 단계 작게 둔다. 판 높이 · 모서리 · 띠지는 같게 — 판만 낮추면 둥근 모서리가 달라 보였다(2026-11-10 사용자 지정). */}
          <div className="flex flex-col gap-[12px]">
            <HeroPanel tag="가입 즉시 무료 이용" items={HIGHLIGHTS} />
            <HeroPanel tag="유료 부가서비스 순차 오픈" items={ADD_ONS_SOON} soon />
          </div>
        </div>
      </div>
    </section>
  );
}

// 사장님 유형 카드 — 「누구 → 한 문장 → 핵심 세 개 → 버튼」만 둔다. 배민 · 쿠팡이츠 사장님 사이트처럼 쉽고 짧게(2026-11-09 사용자 지정).
// 전엔 카드 위 유형 줄 · 작은 글 · 두 줄 한마디 · 「이런 기능부터 써보세요」 · 「함께 쓰면 좋은 부가서비스」까지 일곱 덩어리였다.
const PERSONAS = [
  {
    head: "매장 하나를 운영해요",
    pitch: "혼자 운영해도 직원 관리는 쉽게",
    features: ["종이 계약서 없이, 앱으로 근로계약서 작성·서명", "직원 출퇴근 기록을 자동으로 확인", "급여명세서도 클릭 한 번으로 발송"],
    cta: " 자세히 보기",
    service: "매장운영",
    route: "storeOperations" as const,
  },
  {
    head: "여러 매장을 운영해요",
    pitch: "매장이 늘어도 관리는 한곳에서",
    features: ["매장별 매출을 한눈에 비교", "매장마다 통장 입출금을 따로 확인", "점장에게 맡길 일만 선택해 권한 부여"],
    cta: " 자세히 보기",
    service: "재무관리",
    route: "financeManagement" as const,
  },
  {
    head: "프랜차이즈 본사예요",
    pitch: "가맹점이 늘어도 본사 업무는 간편하게",
    features: ["가맹계약을 온라인으로 간편하게 체결", "새 메뉴와 가격을 가맹점에 한 번에 적용", "정보공개서 자료까지 한 번에 다운로드"],
    cta: " 자세히 보기",
    service: "프랜차이즈",
    route: "franchise" as const,
  },
  {
    head: "가맹점을 운영해요",
    pitch: "본사에서 받은 계정으로 바로 시작",
    features: ["본사 메뉴와 가격이 매장에 바로 적용", "휴일 · 권한 등 기본 설정은 본사가 미리 준비", "점포 정보도 본사가 대신 관리"],
    cta: "으로 로그인",
    service: "본사에서 받은 계정",
    route: "login" as const,
  },
];

function Personas({ routes }: { routes: GuestRoutes }) {
  return (
    <section className="bg-guest-surface py-[100px]">
      <div className={`${FRAME} flex flex-col gap-[60px]`}>
        <SectionTitle oneLine light="사장님은," bold="어떤 매장을 운영하세요?" />
        <div className="grid grid-cols-4 gap-[16px]">
          {PERSONAS.map((p, i) => (
            // 남색 띠 · 6px 모서리 대신 시작 방법 카드와 같은 크게 둥근 흰 카드(24px) — 페이지 카드 모양을 하나로. 화면에 들어오면 차례로 올라오고(guest-reveal), 마우스를 올리면 떠오른다(2026-11-10 사용자 지정).
            <article key={p.head} style={{ "--reveal-delay": `${i * 8}%` } as CSSProperties} className="guest-reveal flex flex-col rounded-[24px] border border-[#e3ebf3] bg-white transition-[translate,box-shadow,border-color] duration-300 ease-out hover:-translate-y-[6px] hover:border-guest-navy-soft hover:shadow-[0_16px_32px_rgba(58,86,112,0.12)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
              {/* 제목 ↔ 구분선 · 구분선 ↔ 한 문장 · 체크 목록 ↔ 버튼을 모두 24px 로 같게(2026-11-10 사용자 지정). */}
              <div className="flex flex-1 flex-col gap-[24px] p-[34px]">
                <h3 className="text-[22px] leading-[1.4] font-bold text-guest-navy">
                  <span className="mr-[8px] text-guest-navy-soft">{String(i + 1).padStart(2, "0")}</span>
                  {p.head}
                </h3>
                {/* 한 문장은 제목 아래가 아니라 구분선 아래 체크 목록 머리로 — 제목은 유형만, 선 아래가 「무엇이 좋은지」(2026-11-10 사용자 지정). */}
                <div className="flex flex-col gap-[16px] border-t border-[#e7e7e7] pt-[24px]">
                  <p className="text-[17px] leading-[1.5] font-semibold text-guest-navy">{p.pitch}</p>
                  <ul className="flex flex-col gap-[12px] text-[15px] leading-[1.5] text-guest-ink">
                  {p.features.map((line) => (
                    <li key={line} className="flex items-center gap-[10px]">
                      <Image src="/guest/check-circle.svg" alt="" width={18} height={18} />
                      {line}
                    </li>
                  ))}
                  </ul>
                </div>
                <div className="mt-auto flex">
                  <GuestButton tone="invert" href={p.route && routes[p.route]} arrow grow>
                    {/* 서비스 이름만 굵게, 나머지는 보통 굵기(2026-11-09 사용자 지정). */}
                    <span className="font-normal">
                      <strong className="font-bold">{p.service}</strong>
                      {p.cta}
                    </span>
                  </GuestButton>
                </div>
              </div>
            </article>
          ))}
        </div>
        {/* 가맹점 안내는 04 카드 안이 아니라 카드 줄 아래 한 줄로 — 카드 높이가 고르고, 본사가 쓰지 않는 가맹점주에게 따로 말한다(2026-11-10 사용자 지정). */}
        <p className="-mt-[32px] flex items-center gap-[8px] text-[16px] leading-[1.5] text-guest-body">
          <span aria-hidden className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-guest-navy-soft text-[11px] leading-none font-bold text-white">
            !
          </span>
          <b className="font-semibold text-guest-navy">프랜차이즈 본사가 Whale ERP를 쓰지 않나요?</b>
          직접 사업자 회원으로 가입하고 내 매장을 관리하세요
        </p>
      </div>
    </section>
  );
}




const WEB_ROLES = [
  { title: "매장 · 직원 등록", desc: "매장 정보와 관리자 권한을 한곳에서" },
  { title: "근로계약 · 급여명세서", desc: "서명 요청부터 명세서 발송까지" },
  { title: "근무 일정 관리", desc: "근무표 공유 · 출퇴근 확인 · 할 일 배정" },
];
const APP_ROLES = [
  { title: "전자 서명", desc: "근로계약서를 앱에서 바로 서명" },
  { title: "위치 출퇴근", desc: "매장에 도착하면 앱으로 출퇴근" },
  { title: "일정 · 급여 확인", desc: "근무 일정과 급여명세서를 앱에서" },
];

function RoleList({ label, items }: { label: string; items: { title: string; desc: string }[] }) {
  return (
    <div className="flex flex-col">
      <p className="pb-[16px] text-[15px] font-semibold text-white/55">{label}</p>
      {items.map((r) => (
        <div key={r.title} className="flex flex-col gap-[6px] border-t border-white/15 py-[24px] first-of-type:border-t-0">
          <h3 className="text-[24px] leading-[1.4] font-bold text-white">{r.title}</h3>
          <p className="text-[17px] leading-[1.6] text-white/70">{r.desc}</p>
        </div>
      ))}
    </div>
  );
}

// 메이트 포스 소개처럼 — 가운데 큰 그림(관리자 웹 화면 + 직원 앱 휴대폰), 왼쪽 관리자 웹 · 오른쪽 직원 앱이 하는 일을 가는 선으로 나눠 둔다(2026-11-11 사용자 지정 — 전엔 흐르는 사진 띠 + 세 흐름).
function Connections() {
  return (
    // 바탕은 짙은 남색 그라데이션 + 기기 뒤 은은한 푸른 빛, 글은 흰색 — 밋밋한 연하늘 대신 홈에서 이 구역만 어둡게 강조한다(2026-11-11 사용자 지정).
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1c2630] via-[#243444] to-[#2c3e50] py-[100px]">
      <span aria-hidden className="absolute top-1/2 left-1/2 h-[720px] w-[900px] -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(94,140,233,0.28),transparent)]" />
      <div className={`${FRAME} relative flex flex-col gap-[60px]`}>
        <SectionTitle oneLine dark light="사장님부터 직원까지," bold="매장 업무가 하나로 연결됩니다" />
        <div className="grid grid-cols-[1fr_clamp(460px,34vw,560px)_1fr] items-center gap-[clamp(24px,3vw,48px)]">
          <RoleList label="관리자 웹" items={WEB_ROLES} />
          {/* 메이트 포스 소개처럼 입체로 — 원근(perspective) 안에서 모니터 · 휴대폰을 비스듬히 돌리고, 금속 느낌 테두리 · 가장자리 빛 · 바닥 그림자를 준다(2026-11-11 사용자 지정). */}
          <div className="relative h-[520px] [perspective:1600px] max-[1600px]:origin-center max-[1600px]:scale-[0.85]">
            {/* 바닥 그림자 */}
            <span aria-hidden className="absolute bottom-[6px] left-1/2 h-[40px] w-[460px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(0,0,0,0.45),transparent)]" />
            {/* 관리자 웹 — 모니터 + 받침 */}
            <div className="absolute top-[10px] left-[10px] [transform:rotateY(18deg)_rotateX(4deg)] [transform-style:preserve-3d]">
              <div className="rounded-[22px] bg-gradient-to-br from-[#4a5866] via-[#1f2831] to-[#0e1419] p-[12px] shadow-[0_30px_60px_rgba(28,38,48,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-white/25">
                <div className="overflow-hidden rounded-[12px] bg-[#f4f6fa] p-[14px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]">
                  <AttendanceMock />
                </div>
              </div>
              <div className="mx-auto h-[46px] w-[64px] bg-gradient-to-b from-[#c9d2db] to-[#8d99a5]" />
              <div className="mx-auto h-[14px] w-[220px] rounded-[8px] bg-gradient-to-b from-[#e3e8ee] to-[#9aa6b2] shadow-[0_10px_20px_rgba(28,38,48,0.25)]" />
            </div>
            {/* 직원 앱 — 휴대폰을 오른쪽 아래에 겹친다. 짙은 바탕에 맞춰 검은 테두리를 두르고 폰답게 작게(72%) 둔다, 기울기는 없다(2026-11-11 사용자 지정) */}
            <div className="absolute right-0 bottom-0 origin-bottom-right scale-[0.72]">
              <div className="rounded-[44px] bg-[#2a3440] p-[8px] shadow-[0_24px_48px_rgba(0,0,0,0.45)] ring-1 ring-white/15">
                <StaffAppHomeMock />
              </div>
            </div>
          </div>
          <RoleList label="직원 앱" items={APP_ROLES} />
        </div>
      </div>
    </section>
  );
}

// 「회원가입하면 이런 화면이 있구나」를 보여 주는 시작 방법 카드 — 토스 비즈니스 소개처럼 큰 흰 카드 위쪽에 실제 화면 일부를 작게 다시 그리고(첫 화면과 같은 구름 바탕),
// 아래에 단계 이름 + 한 줄. 네 장을 본문 폭 안에 나란히 둔다(2026-11-10 사용자 지정).
// 화면 조각은 캡처가 아니라 HTML 로 그린 것이다 — 선명하고, 실제 화면 문구가 바뀌면 여기서 맞춘다. 상호 · 주소 · 연락처는 인터플러그(푸터와 같다), 직원 이름 · 금액은 예시다.
// 매장은 사업자 진위확인을 마쳐야 운영으로 바뀌고, 운영 중인 매장에서만 직원을 초대할 수 있다 — 순서를 그대로 따른다.
const STEPS = [
  { key: "signup", title: "사업자 회원가입", desc: "계정 정보만 입력하면 가입 완료" },
  { key: "store", title: "매장 등록", desc: "매장 등록 · 사업자 확인으로 운영 준비 완료" },
  { key: "contract", title: "직원 초대", desc: "근로계약서를 보내면 직원 초대도 완료" },
  { key: "attendance", title: "첫 출근", desc: "직원이 앱으로 출근하면 근무 기록이 쌓여요" },
] as const;

function StepMock({ kind }: { kind: (typeof STEPS)[number]["key"] }) {
  // 사업자 회원가입 — 실제 회원가입 화면(signup)의 제목 · 안내 · 「기본정보」 칸을 그대로 옮겼다(2026-11-10 사용자 지정).
  if (kind === "signup")
    return (
      <div className={MOCK}>
        <p className="text-[15px] font-bold">회원가입</p>
        <p className="mt-[2px] text-[12px] text-guest-sub">사업자 계정을 만들고 매장 관리를 시작하세요.</p>
        <p className="mt-[14px] border-t border-guest-list-line pt-[12px] text-[13px] font-semibold">기본정보</p>
        <div className="mt-[8px] flex flex-col gap-[8px]">
          <MockField label="아이디" value="interplug" />
          <MockField label="이메일" value="master@interplug.co.kr" />
          <MockField label="상호명" value="인터플러그" />
        </div>
        <div className={MOCK_BUTTON}>회원가입</div>
      </div>
    );
  // 매장 등록 — 앞 가운데에 점포 정보 관리 카드 보기(StoreCard) 모양, 뒤 오른쪽에 점포 등록 화면(「점포 기본정보」 · [등록])을 흐리게 겹친다.
  // 「등록하면 이런 카드가 생긴다」가 보이게(2026-11-10 사용자 지정).
  if (kind === "store")
    return (
      <div className="relative h-[320px] w-[290px]">
        <div aria-hidden className={`${MOCK} absolute top-0 left-[20px] scale-90 opacity-60 blur-[1.5px]`}>
          <p className="text-[15px] font-bold">점포 등록</p>
          <div className="mt-[12px] flex flex-col gap-[8px] border-t border-guest-list-line pt-[12px]">
            <MockField label="점포명" value="인터플러그 신촌점" />
            <MockField label="점포 연락처" value="02-6928-0028" />
            <MockField label="점포 주소" value="서울 서대문구 연세로5다길 22-3" />
          </div>
          <div className={`${MOCK_BUTTON} mt-[12px]`}>등록</div>
        </div>
        <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2">
          <StoreCardMock />
        </div>
      </div>
    );
  // 직원 초대 — 관리자 웹 근로계약 상세의 「계약 내용」 칸(직원 · 근무지 · 고용 형태 · 직무 · 계약 기간 · 시급)과 상태 이름(직원 서명 대기)을 그대로 옮겼다(2026-11-10 사용자 지정).
  if (kind === "contract")
    return (
      <div className={MOCK}>
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-bold">근로계약서</p>
          <span className="rounded-[4px] bg-[#eef4ff] px-[8px] py-[2px] text-[12px] font-semibold text-[#4a7ae0]">직원 서명 대기</span>
        </div>
        <div className="mt-[14px] flex flex-col gap-[8px] border-t border-guest-list-line pt-[14px]">
          <MockRow k="직원" v="이웨일" />
          <MockRow k="근무지" v="인터플러그 신촌점" />
          <MockRow k="고용 형태" v="파트타이머" />
          <MockRow k="직무" v="홀 서빙" />
          <MockRow k="계약 기간" v="2026.11.10 ~ 2027.02.09" />
          <MockRow k="시급" v="10,500원" />
        </div>
        <div className={MOCK_BUTTON}>서명 요청</div>
      </div>
    );
  // 첫 출근 — 토스 소개처럼 휴대폰 잠금화면(얇은 검은 테두리, 2026-11-11)(연한 하늘 그라데이션, 아래로 갈수록 흐려짐)에 Whale ERP 알림 한 장(2026-11-10 사용자 지정).
  return (
    <div className="flex h-[320px] w-[290px] flex-col items-center rounded-t-[36px] border-[6px] border-b-0 border-[#2a3440] bg-gradient-to-b from-[#a9c8e8] via-[#cddff1] to-[#eef3f8] px-[12px] pt-[44px] [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
      <p className="text-[13px] text-white">11월 10일 월요일</p>
      <p className="text-[56px] leading-[1.1] font-light tracking-tight text-white/90">08:57</p>
      {/* 알림 두 장 — 근로계약서 · 급여명세서가 직원 앱으로 도착한다(2026-11-11 사용자 지정) */}
      <div className="mt-[20px] flex w-full flex-col gap-[6px]">
        {[
          { text: "근로계약서가 도착했습니다.", time: "지금" },
          { text: "11월 급여명세서가 도착했습니다.", time: "어제" },
        ].map((n) => (
          <div key={n.text} className="flex w-full items-center gap-[8px] rounded-[12px] bg-white/90 p-[8px] text-left text-guest-ink">
            <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-white">
              <Image src="/guest/logo-whale.svg" alt="" width={22} height={22} className="h-[18px] w-auto" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center justify-between gap-[4px]">
                <b className="truncate text-[12px] font-semibold">인터플러그 신촌점</b>
                <span className="shrink-0 text-[10px] text-guest-sub">{n.time}</span>
              </span>
              <span className="truncate text-[10px] text-guest-sub">{n.text}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 흰 카드(매장 유형 · 시작 방법 · 질문 · 공지)는 연한 하늘 1px 선(#e3ebf3)으로 두른다 — 매장운영 소개 그림 카드와 같다(2026-11-10 사용자 지정).
function Steps({ routes }: { routes: GuestRoutes }) {
  return (
    <section className="flex flex-col gap-[60px] bg-guest-surface py-[100px]">
      {/* 제목 바로 아래 작은 안내 — 시작 절차는 매장 유형(직영 · 가맹 등)에 따라 다를 수 있다(2026-11-10 사용자 지정). */}
      <div className={`${FRAME} flex flex-col gap-[16px]`}>
        {/* 오른쪽 [사업자 회원가입하기] 버튼은 뺐다 — 화면 아래 떠 있는 [무료로 시작하기]가 같은 일을 한다(2026-11-11 사용자 지정). */}
        <SectionTitle oneLine light="우리 매장," bold="어떻게 시작하면 될까요?" />
        {/* 느낌표 안내 두 곳(매장 유형 아래 · 시작 방법 아래)은 같은 크기 — 16px 본문색 · 아이콘 16px · 간격 8px(2026-11-11 사용자 지정). */}
        <p className="flex items-center gap-[8px] text-[16px] leading-[1.5] text-guest-body">
          <span aria-hidden className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-guest-navy-soft text-[11px] leading-none font-bold text-white">
            !
          </span>
          매장 유형에 따라 시작 절차가 달라질 수 있어요. 자세한 내용은
          <Link href={routes.leads} className={`font-semibold text-guest-navy underline underline-offset-4 hover:text-guest-ink ${HOVER}`}>
            도입 문의
          </Link>
          를 통해 확인해 주세요.
        </p>
      </div>
      {/* 네 장을 본문 폭(1520 틀) 안에 나란히 둔다 — 가로 스크롤 없이 한눈에(2026-11-10 사용자 지정). */}
      <div className={FRAME}>
        <ol className="grid grid-cols-4 gap-[20px]">
          {STEPS.map((s, i) => (
            <li key={s.key} className="min-w-0 rounded-[32px] border border-[#e3ebf3] bg-white p-[12px] transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-[6px] hover:shadow-[0_16px_32px_rgba(58,86,112,0.12)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
              {/* 바탕은 첫 화면과 같은 구름 그림 — 카드마다 그림의 다른 쪽을 보여 이어지는 하늘처럼 보이게 한다. */}
              <div className="relative flex h-[380px] items-center justify-center overflow-hidden rounded-[24px] bg-[#e9eff6]">
                <Image src="/guest/billboard-bg.png" alt="" fill sizes="360px" className="object-cover" style={{ objectPosition: `${15 + i * 25}% 60%` }} />
                <span className="absolute inset-0 bg-white/20" />
                {/* 화면 조각은 카드마다 차례로 살짝 떠올랐다 내려앉고(guest-float), 카드에 마우스를 올리면 카드가 6px 떠오른다 — 매장운영 흐름과 같은 생동감(2026-11-10 사용자 지정). */}
                <div className="guest-float relative max-[1600px]:scale-[0.75]" style={{ animationDelay: `${i * 0.4}s` }}>
                  <StepMock kind={s.key} />
                </div>
              </div>
              {/* 제목 · 설명은 매장 유형 카드와 같은 형식 — 「01 단계 이름」 22px 굵게(번호는 연한 남색) + 설명 17px(2026-11-10 사용자 지정). */}
              <div className="flex flex-col gap-[10px] px-[22px] pt-[26px] pb-[22px] text-guest-navy">
                <h3 className="text-[22px] leading-[1.4] font-bold">
                  <span className="mr-[8px] text-guest-navy-soft">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h3>
                <p className="text-[17px] leading-[1.6] text-guest-body">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

type NoticePost = Pick<components["schemas"]["PublishedPostResponseDto"], "postId" | "title" | "isPinned" | "noticeType" | "postedDate">;

/** 메인 「가장 많이 묻는 질문」 목록. open 을 준 질문만 펼쳐 둔다 — 샘플은 시안대로 둘째를 펼치고, 실제 홈은 모두 닫는다. */
export function HomeFaqList({ items }: { items: { key: string | number; q: string; a: string | null; open?: boolean }[] }) {
  if (!items.length) return <p className="border-t border-guest-list-line py-[18px] text-[15px] text-guest-sub">등록된 질문이 없습니다.</p>;
  return (
    <div className="flex flex-col gap-[8px]">
      {items.map((faq) => (
        <FaqItem key={faq.key} q={faq.q} open={faq.open}>
          {faq.a}
        </FaqItem>
      ))}
    </div>
  );
}

/** 메인 「새로운 소식」 목록. 배지 · 날짜 표기는 공지사항 목록(notice-views.tsx)과 같다. */
// 새로운 소식 줄은 옆 「자주 묻는 질문」 줄과 같은 글자(17px 굵게 먹색) · 같은 줄 간격(78px)으로 맞춰 두 칸 줄이 나란히 선다(2026-11-11 사용자 지정).
export function HomeNewsList({ items, typeLabel, hrefOf }: { items: NoticePost[]; typeLabel: (type: NonNullable<NoticePost["noticeType"]>) => string; hrefOf: (postId: number) => string }) {
  if (!items.length) return <p className="border-t border-guest-list-line py-[18px] text-[15px] text-guest-sub">등록된 공지사항이 없습니다.</p>;
  return (
    <ul className="border-t border-guest-list-line text-[17px] leading-[1.5]">
      {items.map((n) => (
        <li key={n.postId} className="flex h-[78px] items-center gap-[8px] border-b border-guest-list-line last:border-b-0">
          <Badges post={n} typeLabel={typeLabel} />
          <Link href={hrefOf(n.postId)} title={n.title} className={`flex-1 truncate font-semibold text-guest-ink hover:text-guest-navy ${HOVER}`}>
            {n.title}
          </Link>
          <span className="text-[15px] text-guest-sub">{dotDate(n.postedDate)}</span>
        </li>
      ))}
    </ul>
  );
}

// 상자 머리 — 이름(「자주 묻는 질문」 · 「공지사항」)을 흰 상자 안 왼쪽 위에 두고 오른쪽에 바로가기 버튼. 밖의 큰 제목 · 안내 문장은 뺐다(2026-11-11 사용자 지정).
function BoardHead({ title, action, href }: { title: string; action: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-[18px]">
      <h2 className="text-[32px] leading-[1.3] font-bold tracking-[-0.025em] text-guest-ink">{title}</h2>
      <GuestButton tone="invert" href={href} arrow>
        {action}
      </GuestButton>
    </div>
  );
}

// 받지 못한 쪽(null)은 칸째 감춘다(#289) — 남은 하나가 폭을 다 쓰고, 둘 다 없으면 이 구역이 없다.
function Boards({ routes, faq, news }: { routes: GuestRoutes; faq: ReactNode | null; news: ReactNode | null }) {
  if (!faq && !news) return null;
  return (
    <section className="bg-[#f1f7fc] py-[100px]">
      <div className={`${FRAME} grid gap-[16px] ${faq && news ? "grid-cols-2" : "grid-cols-1"}`}>
        {faq && (
          <div className="flex w-full flex-col gap-[34px] rounded-[24px] border border-[#e3ebf3] bg-white p-[34px]">
            <BoardHead title="자주 묻는 질문" action="자주 묻는 질문 보기" href={`${routes.notices}#faq`} />
            {faq}
          </div>
        )}
        {news && (
          <div className="flex w-full flex-col gap-[34px] rounded-[24px] border border-[#e3ebf3] bg-white p-[34px]">
            <BoardHead title="공지사항" action="공지사항 보기" href={routes.notices} />
            {news}
          </div>
        )}
      </div>
    </section>
  );
}

/** faq · news 는 「가장 많이 묻는 질문」 · 「새로운 소식」 칸에 넣을 목록(HomeFaqList · HomeNewsList)이다. 실제 홈은 api 에서, 샘플은 예시로 채운다. */
// 화면 아래에 늘 떠 있는 [무료로 시작하기] · [도입문의] — 페이히어 소개의 아래 상담 띠처럼 스크롤해도 따라온다(2026-11-11 사용자 지정).
// 짙은 남색 반투명 판(뒤 화면이 비친다 · 흐림 처리) 왼쪽에 한 줄 안내, 오른쪽에 두 버튼. 떠 있는 것이라 옅은 그림자를 준다.
function FloatingActions({ routes }: { routes: GuestRoutes }) {
  return (
    <div className="guest-floating pointer-events-none fixed inset-x-0 bottom-[24px] z-30 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-[40px] rounded-[20px] bg-[rgba(28,38,48,0.7)] py-[14px] pr-[14px] pl-[32px] shadow-[0_12px_32px_rgba(28,38,48,0.25)] backdrop-blur-[2px]">
        <p className="text-[18px] leading-[1.5] font-semibold text-white">
          <span className="text-[#9cc3ff]">가입 즉시 무료</span> <span className="mx-[6px] text-white/50">·</span> 우리 매장 관리를 시작해 보세요.
        </p>
        <div className="flex gap-[8px]">
          <Link
            href={routes.signUp}
            className={`flex h-[60px] items-center justify-center gap-[10px] rounded-[12px] bg-white px-[36px] text-[19px] leading-[1.5] font-semibold text-guest-navy hover:bg-[#e9eef3] ${BUTTON_MOTION}`}
          >
            무료로 시작하기
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

export function GuestHome({ routes, faq, news }: { routes: GuestRoutes; faq: ReactNode | null; news: ReactNode | null }) {
  return (
    // 맨 아래 구역(회색 바탕)이 푸터에 바로 붙는 시안이라 본문 아래 60px 여백(GuestPage 기본)을 두지 않는다.
    <GuestPage flush>
      <Billboard />
      <Personas routes={routes} />
      <Connections />
      <Steps routes={routes} />
      <Boards routes={routes} faq={faq} news={news} />
      <FloatingActions routes={routes} />
    </GuestPage>
  );
}
