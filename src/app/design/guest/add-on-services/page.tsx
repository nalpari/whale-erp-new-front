import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { type IconPart, InventoryIcon, KioskIcon, LayeredIcon, OrderIcon, RecipeIcon, STAFF_ICON } from "../guest-icons";
import { GuestButton, GuestPage, ICON_GRADIENT, SectionTitle } from "../guest-ui";

export const metadata: Metadata = { title: "Whale ERP · 부가서비스" };

// Figma 「로그인전_부가서비스」(8QSOuwFFBfCbFWR6RBUlps · 1:1083).

const ASSET = "/guest/add-on-services";

// 유리판 아이콘 조각 — 흰 반투명 판에 그림자와 안쪽 밝은 테두리를 준다.
const GLASS = "bg-white/40 shadow-[0_1.3px_13px_rgba(0,0,0,0.09),inset_0_5.2px_4px_rgba(255,255,255,0.55)] backdrop-blur-[4.9px]";

function PickupIcon() {
  return (
    <span className="relative block h-[74px] w-[62px]">
      <Image src={`${ASSET}/pickup.svg`} alt="" width={87.9649} height={99.9648} className="absolute top-[-11.68px] left-[-12.98px] max-w-none" />
    </span>
  );
}

function PosIcon() {
  return (
    <span className="relative block h-[74px] w-[70px]">
      <span
        className="absolute top-[39px] left-0 h-[35px] w-[70px] rounded-[8px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25)]"
        style={{ backgroundImage: ICON_GRADIENT }}
      />
      <span className="absolute top-[65px] left-[23px] h-[2px] w-[24px] rounded-full bg-white/90" />
      <span className="absolute top-0 left-[7px] h-[60px] w-[56px] rounded-[10px] bg-white/40 shadow-[0_1.9px_18.7px_rgba(0,0,0,0.09),inset_0_7.5px_5.8px_rgba(255,255,255,0.5)] backdrop-blur-[4.2px]" />
      <span className="absolute top-[5px] left-[12px] h-[39px] w-[46px] rounded-[10px] bg-white/10 shadow-[0_1.9px_18.7px_rgba(0,0,0,0.03),inset_0_7.5px_5.8px_rgba(255,255,255,0.5)] backdrop-blur-[4.2px]" />
      <Image src={`${ASSET}/pos-chart.svg`} alt="" width={26.9342} height={20} className="absolute top-[13px] left-[20.29px] max-w-none" />
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

// 시안의 「Sun」은 그라데이션을 흰 바탕 위에 겹친 글자다.
function CalendarIcon() {
  return (
    <span className="relative block h-[74px] w-[56.8px] font-[family-name:var(--font-inter)] leading-[normal] font-bold tracking-normal">
      <span
        className="absolute top-[6.82px] left-0 h-[35.38px] w-[56.8px] rounded-[9.4px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25)]"
        style={{ backgroundImage: ICON_GRADIENT }}
      />
      <span className={`absolute top-[22.39px] left-0 h-[51.61px] w-[56.8px] rounded-[9.4px] ${GLASS}`} />
      <span
        className="absolute top-[30.78px] left-[16.12px] bg-clip-text text-[12px] text-transparent"
        style={{ backgroundImage: `${ICON_GRADIENT}, linear-gradient(#fff, #fff)` }}
      >
        Sun
      </span>
      <span className="absolute top-[42.19px] left-[21.42px] bg-clip-text text-[20.77px] text-transparent" style={{ backgroundImage: ICON_GRADIENT }}>
        8
      </span>
      <span className="absolute top-0 left-[13.31px] h-[14.61px] w-[5.52px] rounded-full bg-white shadow-[0_1.3px_1.9px_rgba(0,0,0,0.1)]" />
      <span className="absolute top-0 left-[37.97px] h-[14.61px] w-[5.52px] rounded-full bg-white shadow-[0_1.3px_1.9px_rgba(0,0,0,0.1)]" />
    </span>
  );
}

type Service = { name: string; desc: string[]; badges: string[]; icon: ReactNode };

// 구독 단위(사업자·점포 구독)는 주황, 나머지 조건은 회색 꼬리표다. 셋째 꼬리표는 남는 폭을 채운다.
function Badges({ badges }: { badges: string[] }) {
  return (
    <div className="flex gap-[4px]">
      {badges.map((badge, i) => (
        <span
          key={badge}
          className={`flex h-[30px] items-center justify-center rounded-[3px] px-[10px] text-[14px] leading-[1.4] font-semibold whitespace-nowrap ${
            badge.endsWith("구독") ? "bg-[#ffeded] text-[#db8233]" : "bg-[#f5f5f5] text-[#999]"
          } ${i === 2 ? "flex-1" : ""}`}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

// 부가서비스·구독 안내 카드. 시안의 큰 카드는 30px 로 둥글다.
const CARD = "rounded-[30px] border border-guest-line bg-white px-[32px] py-[40px] shadow-[0_8px_24px_rgba(0,0,0,0.02)]";

function ServiceSection({
  light,
  desc,
  services,
  last = false,
}: {
  light: string;
  desc: [string, string];
  services: Service[];
  last?: boolean;
}) {
  return (
    <section className={`flex flex-col gap-[60px] px-[80px] pt-[120px] ${last ? "pb-[120px]" : ""}`}>
      <div className="flex items-end justify-between gap-[18px]">
        <div className="flex flex-col gap-[18px]">
          <SectionTitle light={light} bold="부가서비스" />
          <p className="text-[18px] leading-[1.5] font-medium text-guest-ink">
            {desc[0]}
            <br />
            {desc[1]}
          </p>
        </div>
        <div className="flex gap-[8px]">
          <GuestButton tone="navy" arrow>
            요금 안내 보기
          </GuestButton>
          <GuestButton tone="soft">도입문의</GuestButton>
        </div>
      </div>
      <ul className="grid grid-cols-5 gap-[16px]">
        {services.map((s) => (
          <li key={s.name} className={`flex flex-col gap-[4px] ${CARD}`}>
            <span className="flex h-[88px] items-center pb-[14px]">{s.icon}</span>
            <div className="flex flex-col gap-[10px]">
              <h3 className="text-[22px] leading-[1.5] font-extrabold text-[#222]">{s.name}</h3>
              <div className="flex flex-col gap-[18px]">
                <p className="text-[16px] leading-[1.5] text-[#505050]">
                  {s.desc.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
                <Badges badges={s.badges} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const MEMBERSHIP = ["점포 구독", "비회원 이용", "전화번호 포인트"];

const SALES: Service[] = [
  { name: "Pick up Order", desc: ["손님은 앱으로 미리 주문·결제하고, 도착하자마자 받아갑니다."], badges: ["점포 구독", "일반 회원 전용", "앱 주문 결제"], icon: <PickupIcon /> },
  { name: "POS", desc: ["카운터 주문과 카드·간편결제를 빠르게.", "판매 기록은 매출 조회로 바로 이어집니다."], badges: MEMBERSHIP, icon: <PosIcon /> },
  { name: "KIOSK", desc: ["손님이 직접 주문하고 결제하니, 바쁜 시간에도 직원은 음식과 서비스에 집중합니다."], badges: MEMBERSHIP, icon: <KioskIcon /> },
  { name: "Table Order", desc: ["자리에 앉아 바로 주문하고, 추가 주문도 편하게. 직원을 부를 필요가 없습니다."], badges: MEMBERSHIP, icon: <TableOrderIcon /> },
  { name: "QR Order", desc: ["테이블 QR만 찍으면 앱 설치 없이 내 폰으로 주문 끝."], badges: MEMBERSHIP, icon: <QrOrderIcon /> },
];

const MANAGEMENT: Service[] = [
  {
    name: "레시피 관리",
    desc: ["레시피와 재료 사용량을 기록해 두면, 누가 만들어도 어느 매장에서도 같은 맛."],
    badges: ["사업자 구독", "점포 구독", "상품 정보 연동"],
    icon: <RecipeIcon bookmark={`${ASSET}/recipe-bookmark.svg`} />,
  },
  {
    name: "발주 관리",
    desc: ["점포는 필요한 자재를 본사에 바로 주문하고 결제까지 끝냅니다."],
    badges: ["사업자 구독", "자재 정보 연동"],
    icon: <OrderIcon back={`${ASSET}/order-mail-back.svg`} front={`${ASSET}/order-mail-front.svg`} />,
  },
  {
    name: "점포 재고 관리",
    desc: ["다 떨어지고 나서 알게 되는 재고는 이제 그만. 부족한 품목을 미리 확인하세요."],
    badges: ["점포 구독"],
    icon: <InventoryIcon src={`${ASSET}/inventory.svg`} />,
  },
  { name: "대기 순번 관리", desc: ["줄 선 손님에게 차례를 알려드려, 기다리는 시간도 기분 좋게 만듭니다."], badges: ["점포 구독"], icon: <WaitingIcon /> },
  { name: "예약 관리", desc: ["방문 예약을 날짜·시간별로 한눈에. 놓치는 예약 없이 손님을 맞이하세요."], badges: ["점포 구독"], icon: <CalendarIcon /> },
];

const EXPANSIONS: { name: string; desc: string; icon: IconPart[] }[] = [
  {
    name: "점포수 추가",
    desc: "사업자 구독 · 기본 점포 1개",
    icon: [
      { src: `${ASSET}/store-1.svg`, width: 57.3333, height: 17.3333, left: 3.33, top: 3.33 },
      { src: `${ASSET}/store-2.svg`, width: 46.6667, height: 30.6667, left: 8.67, top: 30 },
      { src: `${ASSET}/store-3.svg`, width: 20, height: 20, left: 22, top: 40.67 },
      { src: `${ASSET}/store-4.svg`, width: 57.3333, height: 4, left: 3.33, top: 16.67 },
      { src: `${ASSET}/store-5.svg`, width: 57.3333, height: 17.3333, left: 3.33, top: 16.67 },
    ],
  },
  { name: "직원수 추가", desc: "사업자·점포 구독 · 기본 직원 5명", icon: STAFF_ICON },
  {
    name: "재무관리",
    desc: "사업자·점포 구독",
    icon: [
      { src: `${ASSET}/finance-1.svg`, width: 57.3333, height: 57.3333, left: 3.33, top: 3.33 },
      { src: `${ASSET}/finance-2.svg`, width: 25.3333, height: 25.3333, left: 19.33, top: 19.33 },
      { src: `${ASSET}/finance-3.svg`, width: 4, height: 36, left: 30, top: 14 },
    ],
  },
];

function Expansions() {
  return (
    <section className="relative flex flex-col gap-[60px] overflow-hidden bg-guest-ink px-[80px] py-[120px]">
      <Image src="/guest/store-operations/flow-bg.png" alt="" fill sizes="100vw" className="object-cover object-bottom" />
      <span className="absolute inset-0 bg-[rgba(37,37,37,0.8)]" />
      {/* 이 섹션만 굵은 줄이 위에 온다. */}
      <h2 className="relative text-[52px] leading-[1.2] tracking-[-0.025em] text-white">
        <span className="block font-bold">확장 옵션</span>
        <span className="block font-normal">매장이 커지는 만큼 한도를 늘리세요</span>
      </h2>
      <ul className="relative grid grid-cols-3 gap-[28px]">
        {EXPANSIONS.map((e) => (
          <li key={e.name} className="flex gap-[24px] rounded-[16px] border border-white/10 px-[48px] py-[42px] backdrop-blur-[12px]">
            <LayeredIcon parts={e.icon} />
            <div className="flex flex-1 flex-col gap-[8px] leading-[1.5]">
              <h3 className="text-[24px] font-semibold text-[#fafafa]">{e.name}</h3>
              <p className="text-[18px] text-[#ccc]">{e.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const SUBSCRIPTION = [
  { title: "기본은 점포 단위", desc: ["부가서비스는 점포마다 필요한 것만 구독합니다.", "발주 관리와 점포수 추가는 사업자(본사) 단위로 구독합니다."] },
  { title: "권한은 자동으로", desc: ["구독하는 순간 대표자와 해당 매장의 가맹점주에게 관리 권한이 자동으로 열립니다.", "따로 설정할 필요가 없습니다."] },
  { title: "계약 기간 유지", desc: ["구독 기간은 원하는 만큼 선택할 수 있고, 선택한 기간 동안은 중도 해약", "없이 유지됩니다."] },
];

function Subscription() {
  return (
    <section className="flex flex-col gap-[60px] px-[80px] pt-[120px]">
      <SectionTitle light="WHALE ERP" bold="구독 안내" />
      <ul className="grid grid-cols-3 gap-[16px]">
        {SUBSCRIPTION.map((s) => (
          <li key={s.title} className={`flex flex-col gap-[10px] ${CARD}`}>
            <h3 className="text-[22px] leading-[1.5] font-extrabold text-[#222]">{s.title}</h3>
            <p className="text-[16px] leading-[1.5] text-[#505050]">
              {s.desc.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function AddOnServicesPage() {
  return (
    <GuestPage>
      <ServiceSection light="판매용" desc={["카운터, 테이블, 손님의 스마트폰까지.", "손님이 편한 방식으로 주문하고, 매출은 자동으로 한곳에 모입니다."]} services={SALES} />
      <ServiceSection
        light="관리용"
        desc={["보이지 않는 곳에서 매장을 받쳐주는 기능들.", "매장이 커지면 점포·직원 한도도 함께 늘리세요."]}
        services={MANAGEMENT}
        last
      />
      <Expansions />
      <Subscription />
    </GuestPage>
  );
}
