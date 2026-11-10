import Image from "next/image";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import type { components } from "@/lib/api-types.generated";
import type { GuestRoutes } from "./guest-routes";
import { Arrow, FaqItem, GuestButton, GuestPage, SectionTitle, TitleRow, TRIM, GuestTag } from "./guest-ui";
import { Badges, dotDate } from "./notices/notice-views";
import { BUTTON_MOTION, HOVER } from "./theme";

// 섹션 위아래 여백은 모두 100px 로 같다(2026-11-09 사용자 지정).
// 메인은 본문 폭을 1520px 로 묶는다 — 공통 FRAME(최대 1760px)은 100% 배율에서 양옆이 꽉 차 보였다(2026-11-09 사용자 지정).
const FRAME = "mx-auto w-full max-w-[1680px] px-[80px]";

// Figma 「로그인전_Main」(RQmNVgT2NL0njIFXVQPVG6 · 44:2, 로그인전_공유 — 2026-11-06 반영). 1920 폭 데스크톱 시안이다.
// 실제 홈((site)/page.tsx)과 디자인 샘플(design/guest/page.tsx)이 함께 그린다. 링크는 받은 routes 로 건다(guest-routes.ts).

// 「세 단계」 아이콘 — 유리 질감 3D 아이콘 대신 역할 섹션과 같은 선 아이콘(가입 · 매장 · 알림톡 초대). 번호는 STEP 알약 대신 「01」 숫자(2026-11-09 사용자 지정).
function StepIcon({ step }: { step: 0 | 1 | 2 }) {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="h-[74px] w-[74px] shrink-0 text-guest-navy-soft" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {step === 0 && (
        <>
          <circle cx="19" cy="15" r="7" /><path d="M6 40c0-7.2 5.8-13 13-13 3.4 0 6.5 1.3 8.8 3.4" /><path d="M37 28v12M31 34h12" />
        </>
      )}
      {step === 1 && (
        <>
          <path d="M7 18l3-10h28l3 10" /><path d="M7 18c0 3 2.5 5 5.5 5s5.5-2 5.5-5c0 3 2.5 5 6 5s6-2 6-5c0 3 2.5 5 5.5 5S41 21 41 18" /><path d="M10 23v17h28V23" /><path d="M20 40v-9h8v9" />
        </>
      )}
      {step === 2 && (
        <>
          <path d="M8 10h32a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H22l-8 7v-7H8a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z" /><path d="M17 22l5 5 9-9" />
        </>
      )}
    </svg>
  );
}

const HIGHLIGHTS = [
  { no: "01", title: "점포 1개 운영", desc: "무료 제공" },
  { no: "02", title: "직원 5명 초대", desc: "무료 제공" },
  { no: "03", title: "직원 전용 앱", desc: "무료 제공" },
  { no: "04", title: "관리자 등록", desc: "무료 제공" },
  { no: "05", title: "부가서비스", desc: "순차 오픈 예정, 필요한 만큼 구독" },
];

// 머리말(110px)이 Billboard 위에 겹치도록 그만큼 끌어올린다.
// 머리말 아래 빈 하늘 100px 를 잘라 1080 → 980 으로 줄였다(2026-11-09 사용자 지정).
function Billboard({ routes }: { routes: GuestRoutes }) {
  return (
    <section className="relative -mt-[110px] h-[980px] overflow-hidden">
      <Image src="/guest/billboard-bg.png" alt="" fill loading="eager" sizes="100vw" className="object-cover" />
      {/* 정사각 그림을 677×375 에 늘여 채운 것이 시안이다 — object-cover 로 바꾸면 고래가 잘린다.
          시안의 2px 흐림은 너무 뿌옇다는 요청(2026-10-13)으로 뺐다.
          고래는 가운데에서 오른쪽으로 200px 옮겨 왼쪽 슬로건 · 카피와 겹치지 않게 한다(2026-11-09 사용자 지정). */}
      <div className="guest-whale absolute top-[410px] left-[calc(50%+200px)] h-[375px] w-[677px] -translate-1/2">
        <Image src="/guest/billboard-whale.png" alt="" fill loading="eager" sizes="677px" />
      </div>
      {/* 머리말(110px) 아래부터 바닥까지 가운데에 둬 위 · 아래 여백을 같게 한다(2026-11-09 사용자 지정). */}
      <div className="absolute inset-x-0 top-[110px] bottom-0 flex items-center justify-center">
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
                <p className={`text-[22px] leading-[1.5] font-bold whitespace-nowrap ${TRIM}`}>처음 여는 매장도, 오래 운영한 매장도 쉽게 관리하세요</p>
                <p className={`text-[17px] leading-[1.5] whitespace-nowrap ${TRIM}`}>
                  직원 계약부터 근무표·급여, 매출·재무, 가맹점 관리까지
                  <br />
                  여러 서비스를 일일이 알아보고 관리할 필요 없이, 하나로 해결
                </p>
              </div>
            </div>
            {/* 두 버튼 모두 전의 호버 모양(흰 바탕 · 남색 테두리 · 남색 글자)을 기본으로 두고, 호버하면 남색으로 채운다(2026-11-09 사용자 지정). */}
            <div className="flex gap-[8px]">
              <Link
                href={routes.signUp}
                className={`flex h-[48px] w-[176px] items-center justify-center gap-[12px] rounded-[6px] border border-guest-navy bg-white text-[18px] leading-[1.5] font-semibold text-guest-navy hover:bg-[rgba(58,86,112,0.9)] hover:text-white ${BUTTON_MOTION}`}
              >
                무료로 시작하기
                <Arrow />
              </Link>
              <Link
                href={routes.leads}
                className={`flex h-[48px] w-[100px] items-center justify-center rounded-[6px] border border-guest-navy bg-white text-[18px] leading-[1.5] font-semibold text-guest-navy hover:bg-[rgba(58,86,112,0.9)] hover:text-white ${BUTTON_MOTION}`}
              >
                도입문의
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-start gap-[20px]">
            <GuestTag>이용 안내</GuestTag>
          <ul className="flex w-full justify-between border-t border-[rgba(130,151,168,0.15)] pt-[24px] text-guest-navy">
            {HIGHLIGHTS.map((h) => (
              <li key={h.no} className="flex gap-[10px]">
                <span className="text-[16px] leading-[2.3] font-bold">{h.no}</span>
                <span className="leading-[1.6]">
                  <strong className="block text-[22px] font-bold">{h.title}</strong>
                  <span className="text-[17px]">{h.desc}</span>
                </span>
              </li>
            ))}
          </ul>
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
    pitch: "직원 관리부터 급여까지 혼자서도 쉽게",
    features: ["종이 계약서 없이, 앱으로 근로계약서 작성·서명", "직원 출퇴근 기록을 자동으로 확인", "급여명세서도 클릭 한 번으로 발송"],
    cta: "자세히 보기",
    service: "매장운영",
    note: null,
    route: "storeOperations" as const,
  },
  {
    head: "여러 매장을 운영해요",
    pitch: "매장이 늘어도 관리는 한 화면에서",
    features: ["매장별 매출을 한눈에 비교", "매장마다 통장 입출금을 따로 확인", "점장에게 맡길 일만 선택해 권한 부여"],
    cta: "자세히 보기",
    service: "재무관리",
    note: null,
    route: "financeManagement" as const,
  },
  {
    head: "프랜차이즈 본사예요",
    pitch: "가맹점이 많아져도, 본사 관리는 간편하게",
    features: ["가맹계약을 온라인으로 간편하게 체결", "새 메뉴와 가격을 가맹점에 한 번에 전달", "가맹점 점검 결과를 함께 확인"],
    cta: "자세히 보기",
    service: "프랜차이즈",
    note: null,
    route: "franchise" as const,
  },
  {
    head: "가맹점을 운영해요",
    pitch: "본사가 Whale ERP를 쓴다면, 가입 없이 시작",
    features: ["본사 메뉴와 가격이 매장에 바로 반영", "직원 계약과 출퇴근도 앱으로 간편하게", "우리 매장 운영은 내 방식대로 관리"],
    cta: "본사에서 받은 계정으로 로그인",
    service: null,
    // 본사가 Whale ERP를 쓰지 않는 가맹점은 직접 가입해 직영 매장으로 등록하고 매장운영으로 관리하게 이끈다(2026-11-09 사용자 지정).
    note: ["본사가 Whale ERP를 쓰지 않나요?", "직영 매장으로 등록해서 관리하세요"],
    route: "login" as const,
  },
];

function Personas({ routes }: { routes: GuestRoutes }) {
  return (
    <section className="bg-guest-surface py-[100px]">
      <div className={`${FRAME} flex flex-col gap-[60px]`}>
        <SectionTitle oneLine tag="매장 유형별 안내" light="사장님은," bold="어떤 매장을 운영하세요?" />
        <div className="grid grid-cols-4 gap-[16px]">
          {PERSONAS.map((p, i) => (
            <article key={p.head} className="flex flex-col rounded-b-[6px] border border-guest-line bg-white">
              <span className="h-[6px] bg-guest-navy" />
              <div className="flex flex-1 flex-col gap-[32px] p-[34px]">
                <div className="flex flex-col gap-[16px] text-guest-navy">
                  <p className={`text-[16px] leading-[1.6] font-bold ${TRIM}`}>{String(i + 1).padStart(2, "0")}</p>
                  <h3 className={`text-[22px] leading-[1.4] font-bold ${TRIM}`}>{p.head}</h3>
                  <p className={`text-[17px] leading-[1.5] text-guest-body ${TRIM}`}>{p.pitch}</p>
                </div>
                <ul className="flex flex-col gap-[12px] border-t border-[#e7e7e7] pt-[24px] text-[15px] leading-[1.5] text-guest-ink">
                  {p.features.map((line) => (
                    <li key={line} className="flex items-center gap-[10px]">
                      <Image src="/guest/check-circle.svg" alt="" width={18} height={18} />
                      {line}
                    </li>
                  ))}
                </ul>
                {p.note && (
                  <p className="mt-auto text-[16px] leading-[1.5] text-guest-body">
                    {p.note[0]}
                    <br />
                    {p.note[1]}
                  </p>
                )}
                <div className={`${p.note ? "" : "mt-auto "}flex`}>
                  <GuestButton tone="invert" href={p.route && routes[p.route]} arrow grow>
                    {/* 서비스 이름만 굵게, 나머지는 보통 굵기(2026-11-09 사용자 지정). */}
                    <span className="font-normal">
                      {p.service && <strong className="font-bold">{p.service} </strong>}
                      {p.cta}
                    </span>
                  </GuestButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// 누가 어디서 쓰는지 — 사장님(웹) · 관리자(맡은 매장만) · 직원(앱). 아래 「시작 세 단계」와 같은 이야기(가입 → 매장 → 직원)를 두 번 하지 않게 바꿨다(2026-11-09 사용자 지정).
// 같은 세 사람을 「무엇을 하나」가 아니라 「일이 어떻게 이어지나」로 — 매장 유형 섹션과 겹쳐 보여 바꿨다. 카드 사이에 화살표를 둔다(2026-11-10 사용자 지정).
const CONNECTIONS = [
  {
    label: "01",
    where: "관리자 웹",
    title: "사장님이 매장과 직원을 등록해요",
    desc: ["매장과 직원을 등록하고,", "관리자를 지정해 운영을 시작해요."],
    features: ["매장 정보 관리", "관리자 등록 · 권한 설정", "직원 초대 · 근로계약서 · 급여명세서 발송"],
    icon: "web" as const,
  },
  {
    label: "02",
    where: "관리자 웹",
    title: "관리자가 근무 일정을 관리해요",
    desc: ["근무표를 공유하고,", "출퇴근 현황과 할 일을 한눈에 확인해요."],
    features: ["근무표 공유 및 조율", "출퇴근 확인", "할 일 배정"],
    icon: "manager" as const,
  },
  {
    label: "03",
    where: "직원 앱",
    title: "직원은 앱으로 출퇴근해요",
    desc: ["근로계약서에 서명하고,", "근무 일정과 급여명세서를 간편하게 확인해요."],
    features: ["근로계약서 전자 서명", "출퇴근", "급여명세서 확인"],
    icon: "app" as const,
  },
];

// 역할 카드 아이콘 — 생성형 사진 느낌이 강해 선 아이콘으로 바꿨다. 실제 화면 캡처가 준비되면 그것으로 바꾼다(2026-11-09 사용자 지정).
function RoleIcon({ kind }: { kind: "web" | "manager" | "app" }) {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="h-[104px] w-[104px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {kind === "web" && (
        <>
          <rect x="5" y="8" width="38" height="25" rx="2.5" />
          <path d="M18 40h12M24 33v7M5 14h38" />
        </>
      )}
      {kind === "manager" && (
        <>
          <circle cx="18" cy="16" r="6" />
          <path d="M7 38c0-6.1 4.9-11 11-11 2.4 0 4.6.8 6.4 2.1" />
          <path d="M36 25l7 3v5c0 4.4-3 8.2-7 9.5-4-1.3-7-5.1-7-9.5v-5l7-3z" />
          <path d="M33 33l2 2 4-4" />
        </>
      )}
      {kind === "app" && (
        <>
          <rect x="14" y="4" width="20" height="40" rx="3.5" />
          <path d="M21 9h6M19 21l3.5 3.5L29 18" />
          <circle cx="24" cy="38" r="1.2" />
        </>
      )}
    </svg>
  );
}

function Connections() {
  // 검정(#1f1f1f) · 남색 바탕이 페이지에서 혼자 무거워, 옛 서비스 카드의 연한 하늘색(#f1f7fc) 바탕에 흰 칸 · 남색 아이콘으로 바꿨다(2026-11-09 사용자 지정).
  return (
    <section className="bg-[#f1f7fc] py-[100px]">
      <div className={`${FRAME} flex flex-col gap-[60px]`}>
        <SectionTitle oneLine tag="함께 일하는 방식" light="사장님부터 직원까지," bold="매장 업무가 하나로 연결돼요" />
        <div className="grid grid-cols-3 gap-[34px]">
          {CONNECTIONS.map((c, i) => (
            <div key={c.label} className="relative flex flex-col gap-[34px]">
              {i < CONNECTIONS.length - 1 && (
                <span aria-hidden className="absolute top-[110px] -right-[17px] z-10 flex size-[34px] translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-guest-line bg-white text-guest-navy">
                  <Arrow />
                </span>
              )}
              {/* 아이콘만 둔 칸은 220px — 348px 은 비어 보였다. 번호는 칸이 아니라 제목 앞에 둔다(2026-11-09 사용자 지정). */}
              <div className="relative flex h-[220px] items-center justify-center rounded-[16px] bg-white text-guest-navy-soft">
                <span className="absolute top-[18px] left-[18px] rounded-[4px] bg-[#f1f7fc] px-[10px] py-[4px] text-[14px] leading-[1.5] font-semibold text-guest-navy">{c.where}</span>
                <RoleIcon kind={c.icon} />
              </div>
              <div className="flex flex-col gap-[12px] pl-[2px] text-guest-body">
                <p className={`text-[16px] leading-[1.6] font-bold text-guest-navy ${TRIM}`}>{c.label}</p>
                <h3 className="text-[22px] leading-[1.4] font-bold text-guest-ink">{c.title}</h3>
                <p className="text-[17px] leading-[1.6]">
                  {c.desc[0]}
                  <br />
                  {c.desc[1]}
                </p>
                <ul className="flex flex-col gap-[10px] pt-[8px] text-[15px] leading-[1.5] text-guest-ink">
                  {c.features.map((line) => (
                    <li key={line} className="flex items-center gap-[10px]">
                      <Image src="/guest/check-circle.svg" alt="" width={18} height={18} />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 시안이 줄을 직접 나눈 설명은 줄마다 나눠 둔다. 매장은 사업자 진위확인을 마쳐야 운영으로 바뀌고, 운영 중인 매장에서만 직원을 초대할 수 있다 — 길어도 순서를 적어 혼란을 막는다(2026-11-09 사용자 지정).
const STEPS = [
  { title: "사업자 가입하기", desc: ["계정 정보만 넣으면 가입 끝.", "사업자정보는 매장 등록 때 넣어도 돼요"] },
  { title: "첫 매장 등록", desc: ["매장을 등록하고 사업자 진위확인을 마치면", "운영을 시작할 수 있어요"] },
  { title: "직원 초대", desc: ["운영 중인 매장에서 근로계약서를 보내면", "직원에게 카카오 알림톡으로 초대가 가요"] },
];


function Steps({ routes }: { routes: GuestRoutes }) {
  return (
    <section className="bg-guest-surface py-[100px]">
      <div className={`${FRAME} flex flex-col gap-[60px]`}>
        <TitleRow
          oneLine
          tag="시작 방법"
          light="가입부터 직원 초대까지,"
          bold="어렵지 않을까요?"
          action={
            <GuestButton tone="invert" href={routes.signUp} arrow>
              사업자 회원가입하기
            </GuestButton>
          }
        />
        <ol className="grid grid-cols-3 gap-[24px]">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex items-end gap-[42px] rounded-[16px] border border-guest-line bg-white px-[42px] pt-[48px] pb-[42px]">
              <StepIcon step={i as 0 | 1 | 2} />
              <div className="flex flex-1 flex-col items-start gap-[26px]">
                <span className={`text-[16px] leading-[1.6] font-bold text-guest-navy ${TRIM}`}>{String(i + 1).padStart(2, "0")}</span>
                <div className="flex flex-col gap-[20px] pl-[4px] leading-[1.5]">
                  <h3 className={`text-[22px] font-bold text-guest-navy ${TRIM}`}>{s.title}</h3>
                  <p className={`text-[17px] text-guest-body ${TRIM}`}>
                    {/* 시안의 줄바꿈은 1920 폭에서만 둔다. 좁으면 그 줄이 한 번 더 꺾여 「끝.」 같은 낱말이 홀로 남는다. */}
                    {s.desc.map((line, j) => (
                      <Fragment key={line}>
                        {j > 0 && (
                          <>
                            {" "}
                            <br className="hidden min-[1920px]:inline" />
                          </>
                        )}
                        {line}
                      </Fragment>
                    ))}
                  </p>
                </div>
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
export function HomeNewsList({ items, typeLabel, hrefOf }: { items: NoticePost[]; typeLabel: (type: NonNullable<NoticePost["noticeType"]>) => string; hrefOf: (postId: number) => string }) {
  if (!items.length) return <p className="border-t border-guest-list-line py-[18px] text-[15px] text-guest-sub">등록된 공지사항이 없습니다.</p>;
  return (
    <ul className="border-t border-guest-list-line text-[15px] leading-[1.5]">
      {items.map((n) => (
        <li key={n.postId} className="flex items-center gap-[8px] border-b border-guest-list-line py-[18px] last:border-b-0">
          <Badges post={n} typeLabel={typeLabel} />
          <Link href={hrefOf(n.postId)} title={n.title} className={`flex-1 truncate text-guest-ink hover:text-guest-navy ${HOVER}`}>
            {n.title}
          </Link>
          <span className="text-guest-sub">{dotDate(n.postedDate)}</span>
        </li>
      ))}
    </ul>
  );
}

function BoardHead({ text, action, href }: { text: string; action: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-[18px]">
      <p className={`text-[17px] leading-[1.6] font-medium text-guest-ink ${TRIM}`}>{text}</p>
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
          <div className="flex flex-col items-start gap-[24px]">
            {/* 반 폭 두 칸은 큰 제목 없이 띠지만 둔다 — 상자 머리 문장이 제목 역할을 한다(2026-11-09 사용자 지정). */}
            <GuestTag>자주 묻는 질문</GuestTag>
            <div className="flex w-full flex-col gap-[34px] rounded-[6px] border border-guest-line bg-white p-[34px]">
              <BoardHead text="자주 묻는 질문과 답변을 확인해 보세요." action="자주 묻는 질문 보기" href={`${routes.notices}#faq`} />
              {faq}
            </div>
          </div>
        )}
        {news && (
          <div className="flex flex-col items-start gap-[24px]">
            <GuestTag>공지사항</GuestTag>
            <div className="flex w-full flex-1 flex-col gap-[32px] rounded-[6px] border border-guest-line bg-white p-[34px]">
              <BoardHead text="서비스 업데이트와 주요 공지사항을 확인해 보세요." action="공지사항 보기" href={routes.notices} />
              {news}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** faq · news 는 「가장 많이 묻는 질문」 · 「새로운 소식」 칸에 넣을 목록(HomeFaqList · HomeNewsList)이다. 실제 홈은 api 에서, 샘플은 예시로 채운다. */
export function GuestHome({ routes, faq, news }: { routes: GuestRoutes; faq: ReactNode | null; news: ReactNode | null }) {
  return (
    // 맨 아래 구역(회색 바탕)이 푸터에 바로 붙는 시안이라 본문 아래 60px 여백(GuestPage 기본)을 두지 않는다.
    <GuestPage flush>
      <Billboard routes={routes} />
      <Personas routes={routes} />
      <Connections />
      <Steps routes={routes} />
      <Boards routes={routes} faq={faq} news={news} />
    </GuestPage>
  );
}
