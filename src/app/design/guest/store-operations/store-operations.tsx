import Image from "next/image";
import { type IconPart, InventoryIcon, KioskIcon, LayeredIcon, OrderIcon, RecipeIcon, STAFF_ICON } from "../guest-icons";
import type { GuestRoutes } from "../guest-routes";
import { GuestButton, GuestPage, SectionTitle, TitleRow, TRIM } from "../guest-ui";
import { FeatureShortcuts } from "./feature-shortcuts";

// Figma 「로그인전_Sub」(8QSOuwFFBfCbFWR6RBUlps · 1:688). 비로그인 메인의 매장운영 소개 화면이다.
// 실제 라우트((site))와 디자인 샘플이 함께 그린다. 링크는 받은 routes 로 건다(guest-routes.ts).

const ASSET = "/guest/store-operations";

const MOMENTS = [
  {
    before: { title: "계약서 쓸 틈도 없이 시작된 첫 출근", desc: "첫 출근은 했는데, 계약서는 아직" },
    after: { title: "출근 전, 휴대폰으로 계약서 서명 완료", desc: "휴대폰으로 간편하게 근로계약서 서명을 마치세요." },
    arrow: "arrow-down-circle.svg",
  },
  {
    before: { title: "파트타이머 급여 계산할 때마다 한숨", desc: "근무시간 확인부터 급여 계산까지 막막" },
    after: { title: "출퇴근 기록 그대로, 정확한 급여명세서", desc: "기록된 근무시간을 반영해 급여 내역을 정리하세요." },
    arrow: "arrow-down-circle.svg",
  },
  {
    before: { title: "고장 난 장비, 지난 수리 기록은 어디에?", desc: "또 고장 난 장비, 지난 수리 기록은 어디에?" },
    after: { title: "장비별 수리 이력으로 바로 대응", desc: "이전 수리 내역을 확인하고 고장에 빠르게 대응하세요." },
    arrow: "arrow-down-circle-last.svg",
  },
];

function MomentBox({ kicker, title, desc, after }: { kicker: string; title: string; desc: string; after: boolean }) {
  return (
    <div className={`flex flex-col gap-[10px] pt-[34px] pr-[34px] pb-[42px] pl-[44px] ${after ? "bg-guest-slate text-white" : "bg-guest-card text-guest-slate"}`}>
      <div className="flex flex-col gap-[4px]">
        <p className="text-[16px] leading-[1.5] font-semibold">{kicker}</p>
        <p className="text-[28px] leading-[1.4] font-bold">{title}</p>
      </div>
      <p className={`text-[16px] leading-[1.5] ${TRIM}`}>{desc}</p>
    </div>
  );
}

function Moments({ routes }: { routes: GuestRoutes }) {
  return (
    <section className="flex flex-col gap-[60px] px-[80px] pt-[120px]">
      <TitleRow
        light="사장님,"
        bold="이런 순간 있으셨죠?"
        action={
          <div className="flex gap-[8px]">
            <GuestButton tone="navy" href={routes.signUp} arrow>
              사업자 회원가입
            </GuestButton>
            <GuestButton tone="soft" href={routes.leads}>
              도입문의
            </GuestButton>
          </div>
        }
      />
      {/* 세 칸 사이 1px 흰 틈은 gap 으로, 바깥 네 모서리만 둥글게 감싼다. */}
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[16px]">
        {MOMENTS.map((m) => (
          <div key={m.before.title} className="relative flex flex-col">
            <MomentBox kicker="BEFORE" {...m.before} after={false} />
            <MomentBox kicker="WHALE ERP 도입 후" {...m.after} after />
            <Image
              src={`${ASSET}/${m.arrow}`}
              alt=""
              width={66}
              height={66}
              className="absolute top-[calc(50%+9px)] left-1/2 -translate-1/2"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  {
    id: "store",
    tab: "점포 관리",
    no: "01 점포 관리",
    title: ["매장 정보,", "찾지 말고 바로 꺼내세요"],
    lead: ["사업자번호, 계약 기간, 평수와 좌석 수까지 한곳에 정리됩니다.", "서류함을 뒤지던 시간이 사라집니다."],
    points: ["운영·폐점 상태까지 한눈에 보는 점포 정보", "가맹계약 기간과 상태 정리", "평수·좌석 수·주요 장비 기록"],
  },
  {
    id: "inspection",
    tab: "점검 · 시설물",
    no: "02 점검 · 시설물",
    title: ["고장 나기 전에,", "점검 기록이 먼저 알려줍니다"],
    lead: ["위생·운영 점검 결과를 기록하고 직원과 바로 공유하세요.", "장비별 수리 이력이 남아 같은 고장에 두 번 당황하지 않습니다."],
    points: ["템플릿으로 빠르게 끝내는 점검표", "시설물·장비 정보를 한곳에", "수리 이력과 수리비까지 재무에 연결"],
  },
  {
    id: "contract",
    tab: "근로계약 · 급여",
    no: "03 근로계약 · 급여",
    title: ["계약서와 급여명세서,", "더는 미루지 마세요"],
    lead: ["직원 앱으로 근로계약서를 보내면 직원이 휴대폰으로 바로 서명합니다.", "급여명세서도 빠짐없이 발급해 노무 걱정을 덜어드립니다."],
    points: ["정직원·파트타이머 전자 근로계약서", "급여명세서·연장근무 수당명세서", "직원 앱으로 명세서 바로 발송"],
  },
  {
    id: "attendance",
    tab: "근무 · 출퇴근",
    no: "04 근무 · 출퇴근",
    title: ["몇 시에 왔더라?", "이제 기록이 답합니다"],
    lead: ["직원은 매장 QR만 찍으면 출퇴근 끝.", "근무표와 실제 출근 기록을 나란히 보고, 오늘 할 일은", "TO-DO로 전달하세요."],
    points: ["주간 근무 스케줄 공유", "QR 한 번으로 출퇴근 기록", "직원별 TO-DO 리스트"],
  },
];

function Lines({ lines }: { lines: string[] }) {
  return lines.map((line) => (
    <span key={line} className="block">
      {line}
    </span>
  ));
}

function Features() {
  return (
    <section className="flex flex-col gap-[60px] px-[80px] py-[120px]">
      <TitleRow
        light="매장운영,"
        bold="이렇게 달라집니다"
        action={
          <FeatureShortcuts items={FEATURES.map(({ id, tab }) => ({ id, tab }))} />
        }
      />
      <div className="flex flex-col gap-[120px]">
        {FEATURES.map((f, i) => (
          // 사진과 글이 번갈아 좌우를 바꾼다. 바로가기로 내려왔을 때 위에 붙는 머리말(110px)에 가리지 않게 띄운다.
          <article key={f.id} id={f.id} className={`flex scroll-mt-[130px] justify-center gap-[100px] ${i % 2 ? "flex-row-reverse" : ""}`}>
            <div className="relative h-[540px] w-[400px] shrink-0">
              <Image src={`${ASSET}/feature-photo.jpg`} alt="" fill sizes="400px" className="object-cover" />
            </div>
            <div className="flex flex-col gap-[64px] pt-[44px] text-guest-ink">
              <span className="h-[5px] w-[80px] bg-guest-ink" />
              <div className="flex flex-col gap-[32px]">
                <div className="flex flex-col gap-[18px]">
                  <div className="flex flex-col gap-[8px]">
                    <p className="text-[20px] leading-[1.5] font-semibold">{f.no}</p>
                    <h3 className="text-[34px] leading-[1.4] font-bold">
                      <Lines lines={f.title} />
                    </h3>
                  </div>
                  <p className={`text-[18px] leading-[1.5] font-semibold ${TRIM}`}>
                    <Lines lines={f.lead} />
                  </p>
                </div>
                <p className={`text-[18px] leading-[1.5] text-guest-body ${TRIM}`}>
                  <Lines lines={f.points} />
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const FLOW = [
  {
    title: "01 직원 초대",
    desc: "카톡·문자로 가입 링크 전송",
    icon: STAFF_ICON,
  },
  { title: "02 계약서 서명", desc: "지원자 휴대폰으로 바로 전자서명", icon: [{ src: `${ASSET}/flow-sign.svg`, width: 64, height: 64, left: 0, top: 0 }] },
  {
    title: "03 근무표 공유",
    desc: "나의 이번 주 스케줄을 한눈에",
    icon: [
      { src: `${ASSET}/flow-schedule-1.svg`, width: 57.3682, height: 30.6686, left: 3.34, top: 3.33 },
      { src: `${ASSET}/flow-schedule-2.svg`, width: 57.3334, height: 17.3282, left: 3.33, top: 30 },
      { src: `${ASSET}/flow-schedule-2.svg`, width: 57.3334, height: 17.3282, left: 3.33, top: 43.33 },
    ],
  },
  {
    title: "04 QR 출퇴근",
    desc: "도착 후 매장 QR만 찍으면 끝",
    icon: [
      { src: `${ASSET}/flow-clock-1.svg`, width: 57.3333, height: 57.3333, left: 3.33, top: 3.33 },
      { src: `${ASSET}/flow-clock-2.svg`, width: 14.6671, height: 25.3338, left: 30, top: 14 },
    ],
  },
  { title: "05 급여 명세서", desc: "근무 기록 그대로 정확하게", icon: [{ src: `${ASSET}/flow-payslip.svg`, width: 64, height: 64, left: 0, top: 0 }] },
] satisfies { title: string; desc: string; icon: IconPart[] }[];

function Flow() {
  return (
    <section className="relative flex flex-col gap-[60px] overflow-hidden bg-guest-ink px-[80px] py-[120px]">
      <Image src={`${ASSET}/flow-bg.png`} alt="" fill sizes="100vw" className="object-cover object-bottom" />
      <span className="absolute inset-0 bg-[rgba(37,37,37,0.8)]" />
      <div className="relative">
        <SectionTitle light="채용부터 월급날까지," bold="끊김 없이" dark />
      </div>
      <ol className="relative grid grid-cols-5 gap-[32px]">
        {FLOW.map((step) => (
          <li
            key={step.title}
            className="flex flex-col items-center gap-[24px] rounded-[16px] border border-white/10 py-[42px] text-center backdrop-blur-[12px]"
          >
            <LayeredIcon parts={step.icon} />
            <div className="flex flex-col gap-[8px] leading-[1.5]">
              <h3 className="text-[24px] font-semibold text-[#fafafa]">{step.title}</h3>
              <p className="text-[18px] text-[#ccc]">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const ADD_ONS = [
  { name: "KIOSK", desc: "고객이 직접 터치로 주문·결제하는 비대면 무인 단말기", icon: <KioskIcon /> },
  { name: "재고 관리", desc: "매장 내 식자재, 소모품 등의 재고를 실시간 확인 및 관리", icon: <InventoryIcon src={`${ASSET}/addon-inventory.svg`} /> },
  {
    name: "발주 관리",
    desc: "필요한 식자재나 물품을 본사나 거래처별로 손쉽게 발주",
    icon: <OrderIcon back={`${ASSET}/addon-mail-back.svg`} front={`${ASSET}/addon-mail-front.svg`} />,
  },
  { name: "레시피 관리", desc: "가맹점의 메뉴 정보와 레시피를 본사에서 관리", icon: <RecipeIcon bookmark={`${ASSET}/addon-bookmark.svg`} /> },
];

function AddOns({ routes }: { routes: GuestRoutes }) {
  return (
    <section className="flex flex-col gap-[60px] px-[80px] pt-[120px]">
      <TitleRow
        light="함께 쓰면"
        bold="더 편해지는 부가서비스"
        action={
          <GuestButton tone="navy" href={routes.addOnServices} arrow>
            부가서비스 전체 보기
          </GuestButton>
        }
      />
      <ul className="grid grid-cols-4 gap-[16px]">
        {ADD_ONS.map(({ name, desc, icon }) => (
          <li
            key={name}
            className="flex flex-col gap-[4px] rounded-[16px] border border-guest-line bg-white px-[42px] py-[40px] shadow-[0_8px_24px_rgba(0,0,0,0.02)]"
          >
            <span className="flex h-[88px] items-center pb-[14px]">
              {icon}
            </span>
            <div className="flex flex-col gap-[10px] leading-[1.5]">
              <h3 className="text-[22px] font-bold text-[#222]">{name}</h3>
              <p className="text-[16px] text-guest-body">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StoreOperations({ routes }: { routes: GuestRoutes }) {
  return (
    <GuestPage>
      <Moments routes={routes} />
      <Features />
      <Flow />
      <AddOns routes={routes} />
    </GuestPage>
  );
}
