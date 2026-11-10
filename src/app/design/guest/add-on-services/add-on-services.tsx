import Image from "next/image";
import type { ReactNode } from "react";
import { CalendarIcon, GLASS, InventoryIcon, OrderIcon, RecipeIcon } from "../guest-icons";
import { GuestPage, ICON_GRADIENT, SectionTitle } from "../guest-ui";
import { FRAME } from "../theme";

// Figma 「로그인전_부가서비스」(RQmNVgT2NL0njIFXVQPVG6 · 44:1792, 로그인전_공유 — 2026-11-06 반영. 처음은 8QSOuwFFBfCbFWR6RBUlps · 1:1083).
// 실제 라우트((site))와 디자인 샘플이 함께 그린다. 본문에 다른 화면으로 가는 링크가 없어 링크 표(routes)를 받지 않는다.

const ASSET = "/guest/add-on-services";

function PickupIcon() {
  return (
    <span className="relative block h-[74px] w-[62px]">
      <Image src={`${ASSET}/pickup.svg`} alt="" width={87.9649} height={99.9648} className="absolute top-[-11.68px] left-[-12.98px] max-w-none" />
    </span>
  );
}

function TableOrderIcon() {
  return (
    <span className="relative block h-[74px] w-[64px]">
      <span
        className="absolute top-[17px] left-0 h-[57px] w-[64px] rounded-[10px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25)]"
        style={{ backgroundImage: ICON_GRADIENT }}
      />
      <span className={`absolute top-0 left-[7px] h-[67px] w-[50px] rounded-[8px] ${GLASS}`} />
      <span className="absolute top-[12px] left-[13px] h-[14px] w-[38px] rounded-[10px] bg-white/15 shadow-[0_1.9px_18.7px_rgba(0,0,0,0.03),inset_0_7.5px_5.8px_rgba(255,255,255,0.5)] backdrop-blur-[4.2px]" />
      <span className="absolute top-[35px] left-[14px] h-[2px] w-[36px] rounded-full bg-white/90" />
      <span className="absolute top-[42px] left-[19px] h-[2px] w-[26px] rounded-full bg-white/60" />
      <span className="absolute top-[49px] left-[24px] h-[2px] w-[16px] rounded-full bg-white/20" />
    </span>
  );
}

function QrOrderIcon() {
  return (
    <span className="relative block h-[74px] w-[61px]">
      <Image src={`${ASSET}/qr-phone.svg`} alt="" width={122.937} height={138.937} className="absolute top-[-23.72px] left-[-37.47px] max-w-none" />
      <span className="absolute top-[67px] left-[9px] h-[3px] w-[30px] rounded-full bg-white/90" />
      <Image src={`${ASSET}/qr-code.svg`} alt="" width={36.85} height={36.85} className="absolute top-[26px] left-[5.2px] max-w-none" />
    </span>
  );
}

function WaitingIcon() {
  return (
    <span className="relative block h-[74px] w-[80.59px]">
      <Image src={`${ASSET}/waiting.svg`} alt="" width={95.7796} height={90.708} className="absolute top-0 left-0 max-w-none" />
    </span>
  );
}

type Service = { name: string; desc: string[]; badges: string[]; icon: ReactNode };

// 꼬리표 — 토스 비즈니스 소개 카드 아래 꼬리표처럼 옅은 회청 바탕 · 회색 글자 · 6px 모서리. 구독 대상(사업자 · 점포 구독)만 글자를 진하게 해 먼저 읽히게 한다
// (2026-11-10 사용자 지정 — 전엔 주황 · 회청 바탕 흰 글자).
function Badges({ badges }: { badges: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-[6px]">
      {badges.map((badge) => (
        <span
          key={badge}
          className={`flex h-[28px] items-center rounded-[6px] px-[10px] text-[13px] leading-[1.4] whitespace-nowrap ${badge.endsWith("구독") ? "bg-guest-navy font-semibold text-white" : "bg-white/80 font-medium text-guest-sub"}`}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}


// 토스 「Group」 구역을 빌렸다 — 가운데 띠지(「판매용 부가서비스」) · 큰 가운데 제목 · 설명, 아래 세 칸 카드는 가운데 칸을 64px 내려 엇갈리게 쌓는다 — translate 가 아니라 위 여백(mt)으로 내려, 구역 아래 100px 여백이 다른 구역과 같게 남는다(2026-11-10 사용자 지정).
// 카드는 40px 로 둥근 구름 바탕(메인 첫 화면 그림)에 옅은 남색 막 15% — 흰 막은 너무 밝았다에 1px 연한 하늘 선 — 흰 틀은 두지 않는다. 가운데 아이콘 + 이름(남색 28px 굵게) · 설명(본문색) · 꼬리표.
// 마우스를 올리면 구름이 살짝 커지고 남색 막이 옅어지며(5%), 이름은 커지고 먹색으로 · 설명은 먹색 500 으로 강조된다(2026-11-10 사용자 지정 — 전엔 남색 막 · 흰 글자).
// 판매용 · 관리용은 바탕으로 구역을 가른다 — 판매용 연하늘(#f1f7fc), 관리용 흰 바탕, 위아래 100px(2026-11-10 사용자 지정).
function ServiceSection({ light, title, desc, services, tinted = false }: { light: string; title: [string, string]; desc: [string, string]; services: Service[]; tinted?: boolean }) {
  return (
    <section className={`py-[100px] ${tinted ? "bg-[#f1f7fc]" : "bg-white"}`}>
    <div className={`${FRAME} flex flex-col gap-[60px]`}>
      {/* 머리는 다른 구역과 같이 왼쪽 정렬 — 띠지(「판매용 부가서비스」) + 한 줄 제목(앞 가는 글씨 · 뒤 굵게) + 설명(2026-11-10 사용자 지정). */}
      <div className="flex flex-col gap-[18px]">
        <SectionTitle oneLine tag={`${light} 부가서비스`} light={title[0]} bold={title[1]} />
        <p className="text-[17px] leading-[1.6] text-guest-body">
          {desc[0]}
          <br />
          {desc[1]}
        </p>
      </div>
      <ul className="grid grid-cols-3 gap-x-[24px] gap-y-[24px]">
        {services.map((s, i) => (
          <li
            key={s.name}
            className={`group relative flex h-[360px] flex-col items-center justify-center gap-[20px] overflow-hidden rounded-[40px] border border-[#e3ebf3] p-[36px] text-center ${i % 3 === 1 ? "mt-[64px]" : ""}`}
          >
            <Image src="/guest/billboard-bg.png" alt="" fill sizes="360px" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none" style={{ objectPosition: `${10 + (i % 5) * 20}% 50%` }} />
            <span className="absolute inset-0 bg-guest-navy/15 transition-colors duration-300 ease-out group-hover:bg-guest-navy/5" />
            {/* 아이콘 · 이름 · 설명 · 꼬리표를 한 묶음으로 카드 세로 가운데에 둔다 — 위아래 여백이 같고 이름과 설명이 붙어 읽힌다(2026-11-10 사용자 지정). */}
            <div className="relative flex flex-col items-center gap-[12px]">
              <span className="flex h-[80px] items-center">{s.icon}</span>
              <h3 className="text-[28px] leading-[1.3] font-bold text-guest-navy transition-[color,scale] duration-300 ease-out group-hover:scale-105 group-hover:text-guest-ink motion-reduce:transition-none motion-reduce:group-hover:scale-100">{s.name}</h3>
            </div>
            <div className="relative flex flex-col items-center gap-[16px]">
              <p className="text-[15px] leading-[1.6] text-guest-body transition-colors duration-300 ease-out group-hover:font-medium group-hover:text-guest-ink">
                {s.desc.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <Badges badges={s.badges} />
            </div>
          </li>
        ))}
      </ul>
    </div>
    </section>
  );
}

const MEMBERSHIP = ["점포 구독", "비회원 이용", "전화번호 포인트"];

// POS · KIOSK 는 제공하지 않아 뺐다(2026-11-10 사용자 지정).
const SALES: Service[] = [
  { name: "픽업 오더", desc: ["손님은 앱으로 미리 주문·결제하고, 도착하자마자 받아갑니다."], badges: ["점포 구독", "일반 회원 전용", "앱 주문 결제"], icon: <PickupIcon /> },
  { name: "테이블 오더", desc: ["직원을 부를 필요 없이 자리에 앉아서 바로 주문합니다."], badges: MEMBERSHIP, icon: <TableOrderIcon /> },
  { name: "QR 오더", desc: ["테이블 QR만 찍으면 앱 설치 없이 손님 휴대폰으로 주문합니다."], badges: MEMBERSHIP, icon: <QrOrderIcon /> },
];

const MANAGEMENT: Service[] = [
  {
    name: "레시피 관리",
    desc: ["레시피부터 재료 사용량까지, 맛의 기준을 하나로 맞추세요."],
    badges: ["사업자 구독", "점포 구독", "상품 정보 연동"],
    icon: <RecipeIcon bookmark={`${ASSET}/recipe-bookmark.svg`} />,
  },
  {
    name: "발주 관리",
    desc: ["필요한 자재는 본사에 바로 주문하고, 결제까지 한 번에 끝내세요."],
    badges: ["사업자 구독", "자재 정보 연동"],
    icon: <OrderIcon back={`${ASSET}/order-mail-back.svg`} front={`${ASSET}/order-mail-front.svg`} />,
  },
  {
    name: "점포 재고 관리",
    desc: ["재고 부족으로 당황하지 않도록, 필요한 품목을 미리 확인하세요."],
    badges: ["점포 구독"],
    icon: <InventoryIcon src={`${ASSET}/inventory.svg`} />,
  },
  { name: "대기 순번 관리", desc: ["손님에게 대기 순서를 알려드려, 기다림의 불편함을 줄여주세요."], badges: ["점포 구독"], icon: <WaitingIcon /> },
  { name: "예약 관리", desc: ["방문 예약을 날짜·시간별로 한눈에. 놓치는 예약 없이 손님을 맞이하세요."], badges: ["점포 구독"], icon: <CalendarIcon /> },
];

// 「기본 + 추가」 그림 — 기본으로 주는 것은 진한 남색, 더하는 것은 연한 남색 점선으로 그리고 사이에 「+」를 둔다(2026-11-10 사용자 지정).
// 점포 수: 점포 1개 + 점포 2개, 직원 수: 사람 5명 + 사람 2명, 재무관리: 점포 3개 중 하나에만 동전 표시(필요한 점포에만).
const STORE = <path d="M3 9 5 4h14l2 5M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 13v7h14v-7M10 20v-4h4v4" />;
const PERSON = (
  <>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
  </>
);

function Glyph({ shape, size, added = false }: { shape: ReactNode; size: number; added?: boolean }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={added ? "2.5 2.5" : undefined} className={added ? "text-guest-navy-soft" : "text-guest-navy"}>
      {shape}
    </svg>
  );
}

function Plus() {
  return <span className="text-[20px] leading-none font-bold text-guest-navy-soft">+</span>;
}

function GrowIcon({ kind }: { kind: "store" | "staff" | "finance" }) {
  if (kind === "store")
    return (
      <>
        <Glyph shape={STORE} size={34} />
        <Plus />
        <Glyph shape={STORE} size={34} added />
        <Glyph shape={STORE} size={34} added />
      </>
    );
  if (kind === "staff")
    return (
      <>
        {[0, 1, 2, 3, 4].map((n) => (
          <Glyph key={n} shape={PERSON} size={22} />
        ))}
        <Plus />
        <Glyph shape={PERSON} size={22} added />
        <Glyph shape={PERSON} size={22} added />
        <Glyph shape={PERSON} size={22} added />
      </>
    );
  return (
    <>
      <Glyph shape={STORE} size={34} added />
      <span className="relative">
        <Glyph shape={STORE} size={34} />
        <span className="absolute -top-[6px] -right-[8px] flex size-[18px] items-center justify-center rounded-full bg-guest-navy text-[11px] font-bold text-white">₩</span>
      </span>
      <Glyph shape={STORE} size={34} added />
    </>
  );
}

const EXPANSIONS: { name: string; desc: string; plan: string[]; icon: ReactNode }[] = [
  { name: "점포 수 추가", plan: ["사업자 구독"], desc: "기본 1개 점포에서 필요한 만큼 추가", icon: <GrowIcon kind="store" /> },
  { name: "직원 수 추가", plan: ["사업자 구독", "점포 구독"], desc: "기본 5명에서 필요한 만큼 추가", icon: <GrowIcon kind="staff" /> },
  { name: "재무관리", plan: ["사업자 구독", "점포 구독"], desc: "필요한 점포에만 재무관리 기능 추가", icon: <GrowIcon kind="finance" /> },
];

// 확장 옵션 — 맨 위 안내 띠(연하늘) · 아래 판매용(연하늘)과 갈리게 흰 바탕, 제목은 먹색. 칸은 카드 없이 세로선으로 나눈다(2026-11-10 사용자 지정 — 전엔 어두운 바탕 · 흰 글자 카드).
function Expansions() {
  return (
    <section className="bg-white py-[100px]">
      <div className={`${FRAME} flex flex-col gap-[60px]`}>
        {/* 다른 구역처럼 띠지 + 한 줄 제목(앞 가는 글씨 · 뒤 굵게, 2026-11-10 사용자 지정 — 전엔 굵은 「확장 옵션,」이 앞). */}
        <SectionTitle oneLine tag="확장 옵션" light="매장 규모에 맞춰," bold="필요한 만큼 확장하세요" />
        {/* 토스페이 비즈니스 소개처럼 카드 없이 칸마다 왼쪽 1px 세로선, 아이콘 동그라미 → 작은 회색 라벨(구독 단위) → 굵은 두 줄(이름 / 얼마나 늘리는지)(2026-11-10 사용자 지정). */}
        <ul className="grid grid-cols-3">
          {EXPANSIONS.map((e) => (
            <li key={e.name} className="flex flex-col items-center gap-[28px] border-l border-[#d5e1ec] px-[24px] text-center first:border-l-0">
              <span className="flex h-[72px] w-fit items-center gap-[6px] rounded-full border border-[#e3ebf3] bg-white px-[22px]">{e.icon}</span>
              {/* 칸 안에서 그림 · 글을 모두 가운데 정렬한다(2026-11-10 사용자 지정). 이름이 제목이라 맨 위(28px 굵게 남색), 설명은 덜 강조(17px 본문색), 구독 대상은 맨 아래 꼬리표(2026-11-10 사용자 지정). */}
              <div className="flex flex-col items-center gap-[8px]">
                <h3 className="text-[28px] leading-[1.4] font-bold text-guest-navy">{e.name}</h3>
                <p className="text-[17px] leading-[1.6] text-guest-body">{e.desc}</p>
                {/* 구독 대상은 판매용 · 관리용 카드와 같은 꼬리표(「사업자 구독」 · 「점포 구독」) — 흰 바탕이라 옅은 회청 바탕 · 남색 글자(2026-11-10 사용자 지정). */}
                <div className="mt-[10px] flex justify-center gap-[6px]">
                  {e.plan.map((plan) => (
                    <span key={plan} className="flex h-[28px] items-center rounded-[6px] bg-[#e9eef3] px-[10px] text-[13px] font-semibold text-guest-navy">
                      {plan}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// 화면 맨 위 안내 띠 — 부가서비스는 아직 하나도 열리지 않은 유료 서비스라(순차 오픈 예정) 그것만 알린다. 홈 「시작 방법」 아래 느낌표 안내와 같은 모양(연하늘 띠 · 15px).
// 구독 단위 · 권한 · 해약 같은 정책이 정해지지 않아 「구독 안내」 카드 세 장은 뺐다(2026-11-10 사용자 지정).
function PaidNotice() {
  return (
    <div className="border-b border-[#e3ebf3] bg-[#f1f7fc]">
      <p className={`${FRAME} flex items-center gap-[8px] py-[16px] text-[15px] leading-[1.5] text-guest-body`}>
        <span aria-hidden className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-guest-navy-soft text-[10px] leading-none font-bold text-white">
          !
        </span>
        <b className="font-semibold text-guest-navy">부가서비스는 순차 오픈 예정인 유료 서비스입니다.</b>
        오픈 일정과 요금은 공지사항을 통해 안내합니다.
      </p>
    </div>
  );
}

export function AddOnServices() {
  return (
    <GuestPage flush>
      <PaidNotice />
      {/* 확장 옵션(점포 · 직원 수 · 재무관리)을 맨 위에 두고, 바탕은 흰색 → 판매용 연하늘 → 관리용 흰색으로 번갈아 둔다(2026-11-10 사용자 지정). */}
      <Expansions />
      <ServiceSection light="판매용" title={["손님이 편한 방식으로,", "주문받으세요"]} desc={["매장 테이블 · 손님 스마트폰 · 픽업 오더 앱 등 어떤 방식으로 주문받아도", "매출은 매출 조회에서 한 번에 확인할 수 있어요."]} services={SALES} tinted />
      <ServiceSection
        light="관리용"
        title={["레시피부터 재고까지,", "꼼꼼하게 챙기세요"]}
        desc={["메뉴 레시피 · 본사 발주 · 매장 재고 · 손님 대기와 예약 등", "매장 운영에 필요한 기능만 선택해 구독할 수 있어요."]}
        services={MANAGEMENT}
      />
    </GuestPage>
  );
}
