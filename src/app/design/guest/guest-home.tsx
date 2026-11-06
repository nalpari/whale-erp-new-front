import Image from "next/image";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import type { components } from "@/lib/api-types.generated";
import type { GuestRoutes } from "./guest-routes";
import { Arrow, FaqItem, GuestButton, GuestPage, SectionTitle, TitleRow, TRIM } from "./guest-ui";
import { Badges, dotDate } from "./notices/notice-views";
import { BUTTON_MOTION, FRAME, HOVER } from "./theme";

// Figma 「로그인전_Main」(RQmNVgT2NL0njIFXVQPVG6 · 44:2, 로그인전_공유 — 2026-11-06 반영). 1920 폭 데스크톱 시안이다.
// 실제 홈((site)/page.tsx)과 디자인 샘플(design/guest/page.tsx)이 함께 그린다. 링크는 받은 routes 로 건다(guest-routes.ts).

// 세로선(11px)으로 나눈 짧은 낱말 줄 — 부가서비스 이름 등. 글자 위아래 여백 자르기(TRIM)는 flex 줄에 걸면 듣지 않아 낱말마다 건다.
// 사이 간격은 1920 에서 12px, 1720 에서 9px 로 줄여 좁은 카드(가맹점주)에서도 한 줄에 든다. 더 좁으면 줄을 바꾼다.
function Divided({ items, className }: { items: string[]; className: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-[clamp(9px,calc(1.5vw-16.8px),12px)] gap-y-[10px] leading-[1.6] font-medium whitespace-nowrap ${className}`}>
      {items.map((item, i) => (
        <Fragment key={item}>
          {i > 0 && <span className="h-[11px] w-px shrink-0 bg-current" />}
          <span className={TRIM}>{item}</span>
        </Fragment>
      ))}
    </div>
  );
}


// 「세 단계」 아이콘. 회청 그라데이션 면 위에 반투명 유리 면(SVG)과 흰 + 를 겹친다. 자리는 Figma 82×74 칸 기준이다(44:338 · 44:355 · 44:372).
// 유리 SVG 는 안쪽 그림자 · 흐림 여백만큼 칸 밖으로 넘친다 — 왼쪽 · 위가 음수인 까닭이다.
const STEP_ICON_BASE = "/guest/home";
function Plus({ x, y }: { x: number; y: number }) {
  return (
    <>
      <span className="absolute h-[2px] w-[17px] rounded-[3.815px] bg-white/90" style={{ left: x, top: y + 7 }} />
      <span className="absolute h-[17px] w-[2px] rounded-[3.815px] bg-white/90" style={{ left: x + 8, top: y }} />
    </>
  );
}
function StepIcon({ step }: { step: 0 | 1 | 2 }) {
  return (
    <span className="relative block h-[74px] w-[82px] shrink-0">
      {step === 0 && (
        <>
          <span
            className="absolute top-0 left-[20.91px] h-[52.33px] w-[54.09px] rounded-[8.942px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25)]"
            style={{ backgroundImage: "linear-gradient(106deg, rgba(174,190,206,0.8) 8.98%, rgba(32,96,154,0.8) 94.82%)" }}
          />
          <Image src={`${STEP_ICON_BASE}/step-signup-glass.svg`} alt="" width={80.0558} height={89.4992} className="absolute top-[-1.21px] left-[-5.98px] max-w-none" />
          <Plus x={26.05} y={33.94} />
        </>
      )}
      {step === 1 && (
        <>
          <Image src={`${STEP_ICON_BASE}/step-store-back.svg`} alt="" width={68} height={54.4419} className="absolute top-[0.98px] left-[7px] max-w-none" />
          <Image src={`${STEP_ICON_BASE}/step-store-glass.svg`} alt="" width={79.9649} height={82.5263} className="absolute top-[5.75px] left-[1.02px] max-w-none" />
          <Plus x={32} y={35.14} />
        </>
      )}
      {step === 2 && (
        <>
          <Image src={`${STEP_ICON_BASE}/step-staff-person.svg`} alt="" width={56.49} height={63.3369} className="absolute top-[5.25px] left-[5.93px] max-w-none" />
          <Image src={`${STEP_ICON_BASE}/step-staff-glass.svg`} alt="" width={69.5281} height={70.1473} className="absolute top-[15.31px] left-[21.74px] max-w-none" />
          <Plus x={48} y={41.14} />
        </>
      )}
    </span>
  );
}

const HIGHLIGHTS = [
  { no: "01", title: "점포 1개", desc: "가입 즉시 사용" },
  { no: "02", title: "직원 5명", desc: "기본 제공" },
  { no: "03", title: "부가서비스 10종", desc: "필요할 때 더하는 부가서비스" },
  { no: "04", title: "All in One", desc: "매장 운영의 모든 것" },
];

// 머리말(110px)이 Billboard 위에 겹치도록 그만큼 끌어올린다.
function Billboard({ routes }: { routes: GuestRoutes }) {
  return (
    <section className="relative -mt-[110px] h-[1080px] overflow-hidden">
      <Image src="/guest/billboard-bg.png" alt="" fill loading="eager" sizes="100vw" className="object-cover" />
      {/* 정사각 그림을 677×375 에 늘여 채운 것이 시안이다 — object-cover 로 바꾸면 고래가 잘린다.
          시안의 2px 흐림은 너무 뿌옇다는 요청(2026-10-13)으로 뺐다. */}
      <div className="guest-whale absolute top-1/2 left-1/2 h-[375px] w-[677px] -translate-1/2">
        <Image src="/guest/billboard-whale.png" alt="" fill loading="eager" sizes="677px" />
      </div>
      <div className="absolute top-[478px] left-1/2 flex w-[1520px] -translate-x-1/2 flex-col gap-[80px]">
        <div className="flex items-end justify-between">
          <div className="flex w-[445px] flex-col gap-[48px]">
            <p className="flex flex-col gap-[23px] font-[family-name:var(--font-rem)] font-black text-transparent">
              <span className={`bg-gradient-to-r from-[rgba(58,86,112,0.5)] to-[rgba(58,86,112,0.22)] bg-clip-text text-[70px] tracking-[-0.025em] ${TRIM}`}>WHALE</span>
              <span className={`bg-gradient-to-r from-[rgba(58,86,112,0.8)] to-[rgba(58,86,112,0.36)] bg-clip-text text-[216px] tracking-[-0.025em] ${TRIM}`}>ERP</span>
            </p>
            <div className="flex flex-col gap-[24px] pl-[12px] text-guest-navy">
              <p className={`font-[family-name:var(--font-inter-tight)] text-[32px] leading-[1.5] font-bold tracking-normal capitalize ${TRIM}`}>
                your smart choice
              </p>
              <p className={`text-[17px] leading-[1.4] ${TRIM}`}>
                매장에서 챙겨야 할 일, 이제 하나로 끝내세요.
                <br />
                직원 계약부터 매출·재무, 가맹점 관리까지 식당·카페 사장님을 위한
                <br />
                올인원 플랫폼입니다.
              </p>
            </div>
          </div>
          <div className="flex gap-[8px]">
            <Link
              href={routes.signUp}
              className={`flex h-[48px] w-[176px] items-center justify-center gap-[12px] rounded-[6px] border border-transparent bg-[rgba(58,86,112,0.9)] text-[18px] leading-[1.5] font-semibold text-white hover:border-guest-navy hover:bg-white hover:text-guest-navy ${BUTTON_MOTION}`}
            >
              무료로 시작하기
              <Arrow />
            </Link>
            <Link
              href={routes.leads}
              className={`flex h-[48px] w-[100px] items-center justify-center rounded-[6px] border border-transparent bg-white/90 text-[18px] leading-[1.5] font-semibold text-guest-navy hover:border-guest-navy hover:bg-white ${BUTTON_MOTION}`}
            >
              도입문의
            </Link>
          </div>
        </div>
        <ul className="flex justify-center gap-[280px] border-t border-[rgba(130,151,168,0.15)] pt-[24px] pl-[2px] text-guest-navy">
          {HIGHLIGHTS.map((h) => (
            <li key={h.no} className="flex gap-[10px]">
              <span className="text-[16px] leading-[2.3] font-bold">{h.no}</span>
              <span className="leading-[1.6]">
                <strong className="block text-[24px] font-bold">{h.title}</strong>
                <span className="text-[18px]">{h.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// 아이콘은 정사각 그림을 칸 크기(폭은 카드마다 다르고 높이 148)에 늘여 채운 것이 시안이다.
const FEATURES: { title: string; route?: keyof GuestRoutes; lines: string[]; icon: { src: string; width: number } }[] = [
  { title: "매장운영", route: "storeOperations", icon: { src: "feature-store.png", width: 169 }, lines: ["매장·장비 정보를 한곳에", "종이 없는 근로계약·급여명세서", "근무표 공유와 QR 출퇴근"] },
  { title: "재무관리", route: "financeManagement", icon: { src: "feature-finance.png", width: 156 }, lines: ["통장 입출금을 한눈에", "현금 거래까지 빠짐없이", "돈이 나가는 곳을 비율로"] },
  { title: "프랜차이즈", route: "franchise", icon: { src: "feature-franchise.png", width: 147 }, lines: ["온라인으로 끝내는 가맹계약", "신메뉴·가격 한 번에 배포", "현장 점검 결과 바로 공유"] },
  { title: "부가서비스", route: "addOnServices", icon: { src: "feature-add-on.png", width: 164 }, lines: ["POS · KIOSK 주문·결제", "테이블·픽업·QR 주문", "발주·재고·레시피 관리"] },
];

function Features({ routes }: { routes: GuestRoutes }) {
  return (
    <section className={`${FRAME} flex flex-col gap-[60px] pt-[160px] pb-[80px]`}>
      <SectionTitle light="매장 운영," bold="네 가지면 충분합니다" />
      <div className="grid grid-cols-4 gap-[16px]">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex flex-col gap-[32px] rounded-[16px] bg-[#f1f7fc] py-[38px] pl-[72px] text-guest-navy">
            <Image src={`/guest/home/${f.icon.src}`} alt="" width={f.icon.width} height={148} sizes={`${f.icon.width}px`} className="h-[148px] max-w-none" style={{ width: f.icon.width }} />
            <div className="flex flex-col items-start">
              <h3 className="text-[32px] leading-[1.6] font-bold">{f.title}</h3>
              <p className="pb-[20px] text-[18px] leading-[1.7]">
                {f.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <GuestButton tone="steel" href={f.route && routes[f.route]} arrow>
                자세히 보기
              </GuestButton>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const PERSONAS = [
  {
    head: "매장 하나를 운영해요",
    kind: "1인·소규모 매장",
    pitch: ["혼자 챙기기 벅찬 매장 일,", "한 곳에서 끝내세요"],
    features: ["전자 근로계약서와 급여명세서", "근무표 공유와 QR 출퇴근", "오늘 매출 한눈에 확인"],
    services: ["POS", "QR Order", "예약 관리"],
    cta: "매장운영 상세보기",
    route: "storeOperations" as const,
  },
  {
    head: "여러 매장을 직접 운영해요",
    kind: "직영 다점포",
    pitch: ["매장이 늘어도,", "관리는 한 화면에서"],
    features: ["매장별 매출 비교와 통계", "매장별 직원·근무 현황", "매장별 관리자 지정과 권한 분리"],
    services: ["점포수 추가", "직원수 추가", "재무관리"],
    cta: "재무관리 자세히 보기",
    route: "financeManagement" as const,
  },
  {
    head: "프랜차이즈 본사예요",
    kind: "가맹 사업 운영",
    pitch: ["가맹점이 늘어도,", "본사는 가벼워집니다"],
    features: ["온라인으로 끝내는 가맹계약", "신메뉴·가격 전 가맹점 일괄 배포", "가맹점 점검과 정보공개서 자료"],
    services: ["발주 관리", "레시피 관리", "점포수 추가"],
    cta: "프랜차이즈 자세히 보기",
    route: "franchise" as const,
  },
  {
    head: "가맹점을 운영해요",
    kind: "가맹점주",
    pitch: ["본사와 연결된 매장,", "운영은 더 간단하게"],
    features: ["본사가 발급한 계정으로 바로 로그인", "본사 메뉴·가격이 매장에 그대로", "직원 계약·출퇴근은 직접 관리"],
    services: ["POS · KIOSK", "점포 재고 관리", "대기 순번 관리"],
    cta: "본사 계정으로 로그인",
    route: "login" as const,
  },
];

function Personas({ routes }: { routes: GuestRoutes }) {
  return (
    <section className="bg-guest-surface pt-[125px] pb-[80px]">
      <div className={`${FRAME} flex flex-col gap-[60px]`}>
        <SectionTitle light="당신은," bold="어떤 사장님이신가요?" />
        <div className="grid grid-cols-4 gap-x-[16px] gap-y-[38px]">
          {PERSONAS.map((p, i) => (
            <div key={p.head} className="flex gap-[10px] pl-[2px] text-guest-ink">
              <span className="text-[16px] leading-[2.3] font-bold">{String(i + 1).padStart(2, "0")}</span>
              <span className="leading-[1.6]">
                <strong className="block text-[24px] font-bold">{p.head}</strong>
                <span className="text-[18px]">{p.kind}</span>
              </span>
            </div>
          ))}
          {PERSONAS.map((p) => (
            <article key={p.cta} className="flex flex-col rounded-b-[6px] border border-guest-line bg-white">
              <span className="h-[6px] bg-guest-navy" />
              {/* 내용은 띠 바로 아래부터 채우고 버튼만 바닥에 붙인다. 어느 카드의 줄이 꺾여도 제목 줄과 버튼 줄이 카드끼리 맞는다. */}
              <div className="flex flex-1 flex-col gap-[30px] px-[34px] pt-[80px] pb-[34px]">
                <div className={`flex flex-col gap-[25px] font-semibold text-guest-navy`}>
                  <p className={`text-[16px] leading-[1.6] ${TRIM}`}>{p.kind}</p>
                  {/* 카드 안쪽 폭(1920 에서 360px)에 맞춰 줄인다 — 1920 에서 32px, 1720 에서 27.6px. 안 줄이면 첫 줄이 넘쳐 세 줄이 된다. */}
                  <p className={`text-[clamp(26px,calc(2.222vw-10.67px),32px)] leading-[1.3] ${TRIM}`}>
                    {p.pitch[0]}
                    <br />
                    {p.pitch[1]}
                  </p>
                </div>
                <div className="flex flex-1 flex-col gap-[32px]">
                  <div className="flex flex-col gap-[24px] text-[16px]">
                    <div className="flex flex-col gap-[22px]">
                      <p className={`leading-[1.6] font-semibold text-guest-ink ${TRIM}`}>이런 기능부터 써보세요</p>
                      <p className={`leading-[1.6] text-guest-body ${TRIM}`}>
                        {p.features.map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))}
                      </p>
                    </div>
                    <div className="flex flex-col gap-[22px] border-t border-[#e7e7e7] pt-[24px]">
                      <p className={`leading-[1.6] font-semibold text-guest-ink ${TRIM}`}>함께 쓰면 좋은 부가서비스</p>
                      <Divided items={p.services} className="text-guest-body" />
                    </div>
                  </div>
                  <div className="mt-auto flex">
                    <GuestButton tone="navy" href={p.route && routes[p.route]} arrow grow>
                      {p.cta}
                    </GuestButton>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const CONNECTIONS = [
  {
    label: "01 BUSINESS PARTNER",
    title: "사장님이 가입하면",
    desc: ["대표자 계정에 모든 관리 권한이 자동으로 주어집니다.", "점장·가맹점주 계정도 필요한 만큼 만들 수 있어요."],
    tags: ["대표자 권한", "관리자 추가", "가맹주 계정"],
    photo: "connect-partner.png",
  },
  {
    label: "02 STORE",
    title: "내 매장이 등록되고",
    desc: ["직영점도 가맹점도 같은 화면에서 관리합니다.", "가맹계약서만 연결하면 가맹점 관리가 바로 시작됩니다."],
    tags: ["직영점", "가맹점", "시설물·점검"],
    photo: "connect-store.png",
  },
  {
    label: "03 STAFF & CUSTOMER",
    title: "직원과 손님이 이어집니다",
    desc: ["직원은 전용 앱으로 계약서 서명과 출퇴근을, 손님은 키오스크·QR로", "주문과 결제를 편하게."],
    tags: ["직원 앱", "POS·KIOSK", "Pick up·QR Order"],
    photo: "connect-staff.png",
  },
];

function Connections() {
  return (
    <section className="bg-[#1f1f1f] py-[120px]">
      <div className={`${FRAME} flex flex-col gap-[80px]`}>
        <SectionTitle light="가입 한 번으로," bold="매장 전체가 연결됩니다" dark />
        <div className="grid grid-cols-3 gap-[34px]">
          {CONNECTIONS.map((c) => (
            <div key={c.label} className="flex flex-col gap-[34px]">
              {/* 사진 뒤에 옅은 흰 면을 깔아, 사진이 덜 찬 곳도 어두운 바탕과 갈린다. */}
              <div className="relative flex h-[348px] items-end overflow-hidden rounded-[16px] bg-white/10 pb-[22px] pl-[26px]">
                <Image src={`/guest/home/${c.photo}`} alt="" fill sizes="33vw" className="object-cover" />
                <span className="relative text-[24px] leading-[1.6] font-bold tracking-normal text-[#f5f5f5]">{c.label}</span>
              </div>
              <div className="flex flex-col gap-[8px] pl-[2px] text-[17px] text-[#999]">
                <h3 className="text-[24px] leading-[1.6] font-semibold text-[#f5f5f5]">{c.title}</h3>
                <p className="leading-[1.5]">
                  {c.desc[0]}
                  <br />
                  {c.desc[1]}
                </p>
                <Divided items={c.tags} className="pt-[8px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 시안이 줄을 직접 나눈 설명은 줄마다 나눠 둔다.
const STEPS = [
  { title: "사업자 가입하기", desc: ["휴대폰 본인인증과 계정 정보만 입력하면 끝.", "사업자등록번호는 나중에 입력해도 됩니다."] },
  { title: "첫 매장 등록", desc: ["매장 이름, 주소, 사업자등록번호를 입력하면 첫 매장이 열리고 대표자 계정에 관리 권한이 주어집니다."] },
  { title: "직원 초대", desc: ["직원 휴대폰으로 초대 링크를 보내면, 앱 가입부터", "근로계약서 서명까지 자연스럽게 이어집니다."] },
];


function Steps({ routes }: { routes: GuestRoutes }) {
  return (
    <section className="bg-guest-surface pt-[120px] pb-[80px]">
      <div className={`${FRAME} flex flex-col gap-[60px]`}>
        <TitleRow
          light="시작은"
          bold="세 단계면 충분합니다"
          action={
            <GuestButton tone="navy" href={routes.signUp} arrow>
              가입하고 시작하기
            </GuestButton>
          }
        />
        <ol className="grid grid-cols-3 gap-[24px]">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex items-end gap-[42px] rounded-[16px] border border-guest-line bg-white px-[42px] pt-[48px] pb-[42px]">
              <StepIcon step={i as 0 | 1 | 2} />
              <div className="flex flex-1 flex-col items-start gap-[26px]">
                <span className={`rounded-full bg-guest-step px-[14px] py-[12px] text-[16px] leading-[1.5] font-bold tracking-normal text-white ${TRIM}`}>
                  STEP {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-[20px] pl-[4px] leading-[1.5]">
                  <h3 className={`text-[24px] font-semibold text-guest-navy ${TRIM}`}>{s.title}</h3>
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

const PLANS = [
  {
    kicker: "STARTER",
    cta: "사업자 회원가입",
    route: "signUp" as const,
    name: "기본 제공",
    summary: "가입하면 바로 쓰는 기본 범위",
    listTitle: "가입 시 제공",
    note: null,
    items: ["점포 1곳 · 직원 5명", "점포 관리 · 점검 · 시설물", "근로계약 · 급여명세서 · 출퇴근", "매출 조회 · 직원 전용 앱"],
  },
  {
    kicker: "ADD-ONS",
    cta: "부가서비스 둘러보기",
    route: "addOnServices" as const,
    name: "부가서비스",
    summary: "매장에 필요한 서비스만 골라서",
    listTitle: "점포별 월 구독",
    note: "요금 확정 예정",
    items: ["POS · KIOSK · Table Order", "Pick up Order · QR Order", "레시피 · 발주 · 재고 관리", "대기 순번 · 예약 관리"],
  },
];

function Plans({ routes }: { routes: GuestRoutes }) {
  return (
    <section className={`${FRAME} flex flex-col gap-[60px] pt-[120px] pb-[80px]`}>
      {/* 「요금제 자세히 보기」는 요금제 화면이 없어 시안에서 감췄다(2026-11-06). */}
      <SectionTitle light="처음엔 가볍게," bold="필요할 때 더하세요" />
      <div className="grid grid-cols-2 gap-[16px]">
        {PLANS.map((plan) => (
          <article key={plan.kicker} className="flex flex-col gap-[48px] rounded-b-[6px] border border-guest-line pb-[34px]">
            <span className="h-[6px] bg-guest-navy" />
            <div className="flex flex-col gap-[34px] px-[34px]">
              <div>
                <div className="flex items-center justify-between gap-[18px]">
                  <p className={`text-[16px] leading-[1.6] font-semibold tracking-normal text-guest-navy ${TRIM}`}>{plan.kicker}</p>
                  <GuestButton tone="outline" href={plan.route && routes[plan.route]} arrow>
                    {plan.cta}
                  </GuestButton>
                </div>
                <div className="flex flex-col gap-[22px] text-guest-navy">
                  <h3 className={`text-[32px] leading-[1.3] font-semibold ${TRIM}`}>{plan.name}</h3>
                  <p className={`text-[16px] leading-[1.6] font-medium ${TRIM}`}>{plan.summary}</p>
                </div>
              </div>
              <div className="flex flex-col gap-[18px]">
                <div className="flex h-[17px] items-center gap-[14px] whitespace-nowrap">
                  <h4 className={`text-[24px] leading-[1.6] font-semibold text-guest-ink ${TRIM}`}>{plan.listTitle}</h4>
                  {plan.note && <span className="text-[16px] leading-[1.5] font-medium text-[#e0914a]">{plan.note}</span>}
                </div>
                <ul className="flex flex-col gap-[12px] border-t border-guest-list-line pt-[24px] text-[17px] leading-[1.5] text-[#222]">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-center gap-[11px] px-px">
                      <Image src="/guest/check-circle.svg" alt="" width={18} height={18} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

type NoticePost = Pick<components["schemas"]["PublishedPostResponseDto"], "postId" | "title" | "isPinned" | "noticeType" | "postedDate">;

/** 메인 「가장 많이 묻는 질문」 목록. open 을 준 질문만 펼쳐 둔다 — 샘플은 시안대로 둘째를 펼치고, 실제 홈은 모두 닫는다. */
export function HomeFaqList({ items }: { items: { key: string | number; q: string; a: string | null; open?: boolean }[] }) {
  if (!items.length) return <p className="py-[18px] text-[17px] text-guest-sub">등록된 질문이 없습니다.</p>;
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
  if (!items.length) return <p className="border-t border-guest-list-line py-[18px] text-[17px] text-guest-sub">등록된 공지사항이 없습니다.</p>;
  return (
    <ul className="border-t border-guest-list-line text-[17px] leading-[1.5]">
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
      <p className={`text-[22px] leading-[1.6] font-medium text-guest-ink ${TRIM}`}>{text}</p>
      <GuestButton tone="outline" href={href} arrow>
        {action}
      </GuestButton>
    </div>
  );
}

// 받지 못한 쪽(null)은 칸째 감춘다(#289) — 남은 하나가 폭을 다 쓰고, 둘 다 없으면 이 구역이 없다.
function Boards({ routes, faq, news }: { routes: GuestRoutes; faq: ReactNode | null; news: ReactNode | null }) {
  if (!faq && !news) return null;
  return (
    <section className="bg-guest-surface pt-[120px] pb-[60px]">
      <div className={`${FRAME} grid gap-[16px] ${faq && news ? "grid-cols-2" : "grid-cols-1"}`}>
        {faq && (
          <div className="flex flex-col gap-[60px]">
            <SectionTitle light="시작 전에," bold="가장 많이 묻는 질문" />
            <div className="flex flex-col gap-[34px] rounded-[6px] border border-guest-line bg-white p-[34px]">
              <BoardHead text="궁금한 점이 더 있다면 언제든 편하게 물어보세요." action="전체 질문 보기" href={`${routes.notices}#faq`} />
              {faq}
            </div>
          </div>
        )}
        {news && (
          <div className="flex flex-col gap-[60px]">
            <SectionTitle light="Whale ERP" bold="새로운 소식 안내" />
            <div className="flex flex-1 flex-col gap-[32px] rounded-[6px] border border-guest-line bg-white p-[34px]">
              <BoardHead text="Whale ERP의 새로운 소식을 알려 드립니다." action="전체 보기" href={routes.notices} />
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
      <Features routes={routes} />
      <Personas routes={routes} />
      <Connections />
      <Steps routes={routes} />
      <Plans routes={routes} />
      <Boards routes={routes} faq={faq} news={news} />
    </GuestPage>
  );
}
