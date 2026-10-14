import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { Arrow, FaqItem, GuestButton, GuestPage, ICON_GRADIENT, SectionTitle, TitleRow, TRIM } from "./guest-ui";
import { BUTTON_MOTION, HOVER } from "./theme";

export const metadata: Metadata = { title: "Whale ERP · 비로그인 메인" };

// Figma 「로그인전_Main」(8QSOuwFFBfCbFWR6RBUlps · 1:2). 1920 폭 데스크톱 시안이다.

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


function CalendarIcon() {
  return (
    <span className="relative block h-[150px] w-[114px] font-[family-name:var(--font-inter)] font-bold tracking-normal">
      <span
        className="absolute top-[15.63px] left-0 h-[70.75px] w-[113.6px] rounded-[18.8px] shadow-[inset_0_8px_8px_rgba(255,255,255,0.25)]"
        style={{ backgroundImage: ICON_GRADIENT }}
      />
      <span className="absolute top-[46.79px] left-0 h-[103.21px] w-[113.6px] rounded-[18.8px] border border-[rgba(97,120,141,0.1)] bg-white/40 shadow-[inset_0_10.4px_8px_rgba(255,255,255,0.5)] backdrop-blur-[9.7px]" />
      <span className="absolute top-[67.56px] left-[40.24px] text-[15.58px] text-[#8397a9]">Sun</span>
      <span
        className="absolute top-[86.39px] left-[42.84px] bg-clip-text text-[41.54px] text-transparent"
        style={{ backgroundImage: ICON_GRADIENT }}
      >
        8
      </span>
      <span className="absolute top-[2px] left-[26.61px] h-[29.21px] w-[11.04px] rounded-full bg-white shadow-[0_2.6px_3.8px_rgba(0,0,0,0.1)]" />
      <span className="absolute top-[2px] left-[75.94px] h-[29.21px] w-[11.04px] rounded-full bg-white shadow-[0_2.6px_3.8px_rgba(0,0,0,0.1)]" />
    </span>
  );
}

function MailIcon() {
  return (
    <span className="relative block h-[94px] w-[91.65px] shrink-0">
      <Image src="/guest/mail-back.svg" alt="" width={91.65} height={77.618} className="absolute top-[16.38px] left-0" />
      <span
        className="absolute top-0 left-[13.09px] h-[82.25px] w-[65.13px] rounded-[11.4px] shadow-[inset_0_5px_5px_rgba(255,255,255,0.25)]"
        style={{ backgroundImage: ICON_GRADIENT }}
      />
      <span className="absolute top-[17.78px] left-[26.93px] h-[2.54px] w-[36.84px] rounded-full bg-white/90" />
      <span className="absolute top-[26.67px] left-[26.93px] h-[2.54px] w-[30.49px] rounded-full bg-white/60" />
      <span className="absolute top-[35.56px] left-[26.93px] h-[2.54px] w-[21.6px] rounded-full bg-white/40" />
      <Image src="/guest/mail-front.svg" alt="" width={91.65} height={51.8066} className="absolute top-[42.19px] left-0" />
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
function Billboard() {
  return (
    <section className="relative -mt-[110px] h-[1080px] overflow-hidden">
      <Image src="/guest/billboard-bg.png" alt="" fill loading="eager" sizes="100vw" className="object-cover" />
      {/* 정사각 그림을 677×375 에 늘여 채운 것이 시안이다 — object-cover 로 바꾸면 고래가 잘린다.
          시안의 2px 흐림은 너무 뿌옇다는 요청(2026-10-13)으로 뺐다. */}
      <div className="absolute top-1/2 left-1/2 h-[375px] w-[677px] -translate-1/2">
        <Image src="/guest/billboard-whale.png" alt="" fill loading="eager" sizes="677px" />
      </div>
      <div className="absolute top-[478px] left-1/2 flex w-[1520px] -translate-x-1/2 flex-col gap-[80px]">
        <div className="flex items-end justify-between">
          <div className="flex w-[445px] flex-col gap-[48px]">
            <p className="flex flex-col gap-[23px] bg-gradient-to-r from-[rgba(58,86,112,0.5)] to-[rgba(58,86,112,0.22)] bg-clip-text font-[family-name:var(--font-rem)] font-black text-transparent">
              <span className={`text-[70px] tracking-[-0.025em] ${TRIM}`}>WHALE</span>
              <span className={`text-[216px] tracking-[-0.025em] ${TRIM}`}>ERP</span>
            </p>
            <div className="flex flex-col gap-[24px] pl-[12px] text-[rgba(58,86,112,0.4)]">
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
              href="#"
              className={`flex h-[48px] w-[176px] items-center justify-center gap-[12px] rounded-[6px] border border-transparent bg-[rgba(58,86,112,0.9)] text-[18px] leading-[1.5] font-semibold text-white hover:border-guest-navy hover:bg-white hover:text-guest-navy ${BUTTON_MOTION}`}
            >
              무료로 시작하기
              <Arrow />
            </Link>
            <Link
              href="/design/guest/inquiry"
              className={`flex h-[48px] w-[100px] items-center justify-center rounded-[6px] border border-transparent bg-white/90 text-[18px] leading-[1.5] font-semibold text-guest-navy hover:border-guest-navy hover:bg-white ${BUTTON_MOTION}`}
            >
              도입문의
            </Link>
          </div>
        </div>
        <ul className="flex justify-between border-t border-[rgba(130,151,168,0.15)] pt-[24px] pl-[2px] text-[rgba(58,86,112,0.7)]">
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

const FEATURES = [
  { title: "매장운영", href: "/design/guest/store-operations", lines: ["매장·장비 정보를 한곳에", "종이 없는 근로계약·급여명세서", "근무표 공유와 QR 출퇴근"] },
  { title: "재무관리", lines: ["통장 입출금을 한눈에", "현금 거래까지 빠짐없이", "돈이 나가는 곳을 비율로"] },
  { title: "프랜차이즈", lines: ["온라인으로 끝내는 가맹계약", "신메뉴·가격 한 번에 배포", "현장 점검 결과 바로 공유"] },
  { title: "부가서비스", href: "/design/guest/add-on-services", lines: ["POS · KIOSK 주문·결제", "테이블·픽업·QR 주문", "발주·재고·레시피 관리"] },
];

function Features() {
  return (
    <section className="flex flex-col gap-[60px] bg-white px-[80px] pt-[160px]">
      <SectionTitle light="매장 운영," bold="네 가지면 충분합니다" />
      <div className="grid grid-cols-4 gap-[16px]">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex flex-col gap-[32px] rounded-[16px] bg-guest-card py-[38px] pl-[72px] text-guest-navy">
            <CalendarIcon />
            <div className="flex flex-col items-start">
              <h3 className="text-[32px] leading-[1.6] font-bold">{f.title}</h3>
              <p className="pb-[20px] text-[18px] leading-[1.7]">
                {f.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <GuestButton tone="white" href={f.href} arrow>
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
    href: "/design/guest/store-operations",
  },
  {
    head: "여러 매장을 직접 운영해요",
    kind: "직영 다점포",
    pitch: ["매장이 늘어도,", "관리는 한 화면에서"],
    features: ["매장별 매출 비교와 통계", "매장별 직원·근무 현황", "매장별 관리자 지정과 권한 분리"],
    services: ["점포수 추가", "직원수 추가", "재무관리"],
    cta: "재무관리 자세히 보기",
  },
  {
    head: "프랜차이즈 본사예요",
    kind: "가맹 사업 운영",
    pitch: ["가맹점이 늘어도,", "본사는 가벼워집니다"],
    features: ["온라인으로 끝내는 가맹계약", "신메뉴·가격 전 가맹점 일괄 배포", "가맹점 점검과 정보공개서 자료"],
    services: ["발주 관리", "레시피 관리", "점포수 추가"],
    cta: "프랜차이즈 자세히 보기",
  },
  {
    head: "가맹점을 운영해요",
    kind: "가맹점주",
    pitch: ["본사와 연결된 매장,", "운영은 더 간단하게"],
    features: ["본사가 발급한 계정으로 바로 로그인", "본사 메뉴·가격이 매장에 그대로", "직원 계약·출퇴근은 직접 관리"],
    services: ["POS · KIOSK", "점포 재고 관리", "대기 순번 관리"],
    cta: "본사 계정으로 로그인",
    href: "/design/guest/login",
  },
];

function Personas() {
  return (
    <section className="flex flex-col gap-[60px] px-[80px] pt-[125px] pb-[120px]">
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
          <article key={p.cta} className="flex flex-col rounded-b-[6px] border border-guest-line">
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
                <div className="mt-auto flex gap-[8px]">
                  <GuestButton tone="navy" href={p.href} arrow grow>
                    {p.cta}
                  </GuestButton>
                  <GuestButton tone="soft" href="/design/guest/inquiry">
                    도입문의
                  </GuestButton>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// 둘째·셋째 사진은 시안에서 첫 사진(connect-photo)이 위에 덮여 있다. 시안 그대로 겹쳐 두고, 사진이 정해지면 위 겹을 뺀다.
const CONNECTIONS = [
  {
    label: "01 BUSINESS PARTNER",
    title: "사장님이 가입하면",
    desc: ["대표자 계정에 모든 관리 권한이 자동으로 주어집니다.", "점장·가맹점주 계정도 필요한 만큼 만들 수 있어요."],
    tags: ["대표자 권한", "관리자 추가", "가맹주 계정"],
    under: null,
  },
  {
    label: "02 STORE",
    title: "내 매장이 등록되고",
    desc: ["직영점도 가맹점도 같은 화면에서 관리합니다.", "가맹계약서만 연결하면 가맹점 관리가 바로 시작됩니다."],
    tags: ["직영점", "가맹점", "시설물·점검"],
    under: "/guest/connect-photo-store.png",
  },
  {
    label: "03 STAFF & CUSTOMER",
    title: "직원과 손님이 이어집니다",
    desc: ["직원은 전용 앱으로 계약서 서명과 출퇴근을, 손님은 키오스크·QR로", "주문과 결제를 편하게."],
    tags: ["직원 앱", "POS·KIOSK", "Pick up·QR Order"],
    under: "/guest/connect-photo-staff.png",
  },
];

function Connections() {
  return (
    <section className="relative flex flex-col gap-[80px] overflow-hidden bg-guest-ink px-[80px] py-[120px]">
      <Image src="/guest/connect-bg.png" alt="" fill sizes="100vw" className="object-cover object-bottom" />
      <div className="relative">
        <SectionTitle light="가입 한 번으로," bold="매장 전체가 연결됩니다" dark />
      </div>
      <div className="relative grid grid-cols-3 gap-[34px]">
        {CONNECTIONS.map((c) => (
          <div key={c.label} className="flex flex-col gap-[34px]">
            <div className="relative flex h-[348px] items-end overflow-hidden rounded-[16px] pb-[22px] pl-[26px]">
              {c.under && <Image src={c.under} alt="" fill sizes="33vw" className="object-cover" />}
              <Image src="/guest/connect-photo.png" alt="" fill sizes="33vw" className="object-cover" />
              <span className="relative text-[24px] leading-[1.6] font-bold tracking-normal text-white">{c.label}</span>
            </div>
            <div className="flex flex-col gap-[8px] pl-[2px] text-[17px] text-[#afafaf]">
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
    </section>
  );
}

// 시안이 줄을 직접 나눈 설명은 줄마다 나눠 둔다.
const STEPS = [
  { title: "사업자 가입하기", desc: ["휴대폰 본인인증과 계정 정보만 입력하면 끝.", "사업자등록번호는 나중에 입력해도 됩니다."] },
  { title: "첫 매장 등록", desc: ["매장 이름, 주소, 사업자등록번호를 입력하면 첫 매장이 열리고 대표자 계정에 관리 권한이 주어집니다."] },
  { title: "직원 초대", desc: ["직원 휴대폰으로 초대 링크를 보내면, 앱 가입부터", "근로계약서 서명까지 자연스럽게 이어집니다."] },
];


function Steps() {
  return (
    <section className="flex flex-col gap-[60px] px-[80px] py-[120px]">
      <TitleRow
        light="시작은"
        bold="세 단계면 충분합니다"
        action={
          <GuestButton tone="navy" arrow>
            가입하고 시작하기
          </GuestButton>
        }
      />
      <ol className="grid grid-cols-3 gap-[24px]">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-[42px] rounded-[16px] border border-guest-line bg-white px-[42px] pt-[48px] pb-[42px]">
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
            <span className="self-end">
              <MailIcon />
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

const PLANS = [
  {
    kicker: "STARTER",
    cta: "사업자 회원가입",
    name: "기본 제공",
    summary: "가입하면 바로 쓰는 기본 범위",
    listTitle: "가입 시 제공",
    note: null,
    items: ["점포 1곳 · 직원 5명", "점포 관리 · 점검 · 시설물", "근로계약 · 급여명세서 · 출퇴근", "매출 조회 · 직원 전용 앱"],
  },
  {
    kicker: "ADD-ONS",
    cta: "부가서비스 둘러보기",
    href: "/design/guest/add-on-services",
    name: "부가서비스",
    summary: "매장에 필요한 서비스만 골라서",
    listTitle: "점포별 월 구독",
    note: "요금 확정 예정",
    items: ["POS · KIOSK · Table Order", "Pick up Order · QR Order", "레시피 · 발주 · 재고 관리", "대기 순번 · 예약 관리"],
  },
];

function Plans() {
  return (
    <section className="flex flex-col gap-[60px] px-[80px] pb-[120px]">
      <TitleRow
        light="처음엔 가볍게,"
        bold="필요할 때 더하세요"
        action={
          <GuestButton tone="navy" arrow>
            요금제 자세히 보기
          </GuestButton>
        }
      />
      <div className="grid grid-cols-2 gap-[16px]">
        {PLANS.map((plan) => (
          <article key={plan.kicker} className="flex flex-col gap-[48px] rounded-b-[6px] border border-guest-line pb-[34px]">
            <span className="h-[6px] bg-guest-navy" />
            <div className="flex flex-col gap-[34px] px-[34px]">
              <div>
                <div className="flex items-center justify-between gap-[18px]">
                  <p className={`text-[16px] leading-[1.6] font-semibold tracking-normal text-guest-navy ${TRIM}`}>{plan.kicker}</p>
                  <GuestButton tone="outline" href={plan.href} arrow>
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

// 시안에 답변이 있는 질문은 둘째 하나뿐이다. 나머지 답변은 기획이 정하면 채운다.
const FAQS = [
  { q: "사업자등록번호 없이도 가입할 수 있나요?", a: null },
  {
    q: "가입하면 바로 쓸 수 있는 범위가 있나요?",
    a: "네, 가입할 때는 필요하지 않습니다. 다만 매장을 등록하거나, 직원을 고용하거나, 세금계산서 발행이 필요한 부가서비스를 구독할 때는 사업자등록번호를 입력해야 합니다.",
  },
  { q: "직원도 앱을 설치해야 하나요?", a: null },
  { q: "부가서비스는 중간에 해지할 수 있나요?", a: null },
];

const NEWS = [
  { badge: { text: "안내", className: "bg-[#f2f6ff] text-[#366fe3]" }, title: "WHALE ERP 1차 서비스 오픈 안내" },
  { badge: { text: "점검", className: "bg-[#e7f7f1] text-[#11b076]" }, title: "정기 시스템 점검 (11/05 02:00~04:00)" },
  { badge: null, title: "개인정보처리방침 개정 안내" },
  { badge: null, title: "Pick up Order 서비스 출시 예정 안내" },
  { badge: null, title: "직원 전용 앱 출퇴근 QR 기능 안내" },
  { badge: null, title: "추석 연휴 고객센터 운영 안내" },
];

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

function Boards() {
  return (
    <section className="grid grid-cols-2 gap-[16px] px-[80px]">
      <div className="flex flex-col gap-[60px]">
        <SectionTitle light="시작 전에," bold="가장 많이 묻는 질문" />
        <div className="flex flex-col gap-[34px] rounded-[6px] border border-guest-line bg-white p-[34px]">
          <BoardHead text="궁금한 점이 더 있다면 언제든 편하게 물어보세요." action="전체 질문 보기" href="/design/guest/notices#faq" />
          <div className="flex flex-col gap-[8px]">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} open={faq.a !== null}>
                {faq.a}
              </FaqItem>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[60px]">
        <SectionTitle light="Whale ERP" bold="새로운 소식 안내" />
        <div className="flex flex-1 flex-col gap-[32px] rounded-[6px] border border-guest-line bg-white p-[34px]">
          <BoardHead text="Whale ERP의 새로운 소식을 알려 드립니다." action="전체 보기" href="/design/guest/notices" />
          <ul className="border-t border-guest-list-line text-[17px] leading-[1.5]">
            {NEWS.map((n) => (
              <li key={n.title} className="flex items-center gap-[8px] border-b border-guest-list-line py-[18px] last:border-b-0">
                {n.badge && (
                  <span className={`flex h-[30px] items-center rounded-[3px] px-[10px] text-[15px] leading-[1.4] font-semibold ${n.badge.className}`}>
                    {n.badge.text}
                  </span>
                )}
                <Link href="#" className={`flex-1 text-guest-ink hover:text-guest-navy ${HOVER}`}>
                  {n.title}
                </Link>
                <span className="text-guest-sub">2026.10.30</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function GuestMainPage() {
  return (
    <GuestPage>
      <Billboard />
      <Features />
      <Personas />
      <Connections />
      <Steps />
      <Plans />
      <Boards />
    </GuestPage>
  );
}
