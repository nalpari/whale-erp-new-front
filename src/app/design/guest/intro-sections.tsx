import Image from "next/image";
import type { ReactNode } from "react";
import { FeatureShortcuts } from "./feature-shortcuts";
import { type IconPart, LayeredIcon } from "./guest-icons";
import type { GuestRoutes } from "./guest-routes";
import { GuestButton, SectionTitle, TitleRow, TRIM } from "./guest-ui";
import { FRAME } from "./theme";

// 메뉴 소개 화면(매장운영 · 재무관리)이 함께 쓰는 네 구역. 시안(로그인전_공유 44:661 · 44:1412)이 같은 틀에 글·그림만 바꿔 넣은 것이라
// 구역은 여기서 그리고, 화면마다 내용 표만 넘긴다. 데모(docs/demo/src/guest-intro.mjs)도 같은 구성이다.
// 프랜차이즈(44:1035)도 같은 틀이다 — 사진이 배경 없는 그림이라 회색 바탕을 깔지 않고(backdrop), 부가서비스 카드에 옅은 그림자가 있다(raised).

// BEFORE → 도입 후 화살표. 마지막 칸 화살표는 끝 칸 모양에 맞춘 다른 그림이다(Figma Frame 56 · 57).
const ARROW = "/guest/store-operations";

export type Moment = { before: { title: string; desc: string }; after: { title: string; desc: string } };

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

export function IntroMoments({ routes, light, bold, items }: { routes: GuestRoutes; light: string; bold: string; items: Moment[] }) {
  return (
    <section className={`${FRAME} flex flex-col gap-[60px] pt-[120px]`}>
      <TitleRow
        light={light}
        bold={bold}
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
        {items.map((m, i) => (
          <div key={m.before.title} className="relative flex flex-col">
            <MomentBox kicker="BEFORE" {...m.before} after={false} />
            <MomentBox kicker="WHALE ERP 도입 후" {...m.after} after />
            <Image
              src={`${ARROW}/${i === items.length - 1 ? "arrow-down-circle-last.svg" : "arrow-down-circle.svg"}`}
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

export type Feature = { id: string; photo: string; tab: string; no: string; title: string[]; lead: string[]; points: string[] };

function Lines({ lines }: { lines: string[] }) {
  return lines.map((line) => (
    <span key={line} className="block">
      {line}
    </span>
  ));
}

export function IntroFeatures({ light, bold, items, backdrop = true }: { light: string; bold: string; items: Feature[]; backdrop?: boolean }) {
  return (
    <section className={`${FRAME} flex flex-col gap-[60px] py-[120px]`}>
      <TitleRow light={light} bold={bold} action={<FeatureShortcuts items={items.map(({ id, tab }) => ({ id, tab }))} />} />
      <div className="flex flex-col gap-[120px]">
        {items.map((f, i) => (
          // 사진과 글이 번갈아 좌우를 바꾼다. 바로가기로 내려왔을 때 위에 붙는 머리말(110px)에 가리지 않게 띄운다.
          <article key={f.id} id={f.id} className={`flex scroll-mt-[130px] justify-center gap-[100px] ${i % 2 ? "flex-row-reverse" : ""}`}>
            {/* 사진 둘레가 비면 옅은 회색이 보이게 깐다(시안 그대로). 배경 없는 그림이면 깔지 않는다. */}
            <div className={`relative h-[540px] w-[400px] shrink-0 ${backdrop ? "bg-[#f5f5f5]" : ""}`}>
              <Image src={f.photo} alt="" fill sizes="400px" className="object-cover" />
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

export type FlowStep = { title: string; desc: string; icon: IconPart[] };

export function IntroFlow({ light, bold, steps }: { light: string; bold: string; steps: FlowStep[] }) {
  return (
    <section className="relative overflow-hidden bg-guest-ink py-[120px]">
      <Image src="/guest/store-operations/flow-bg.png" alt="" fill sizes="100vw" className="object-cover object-bottom" />
      <span className="absolute inset-0 bg-guest-scrim" />
      {/* 배경 그림은 구역 전체를 채우고, 내용만 1760 틀에 담는다. */}
      <div className={`${FRAME} relative flex flex-col gap-[60px]`}>
        <SectionTitle light={light} bold={bold} dark />
        <ol className="grid grid-cols-5 gap-[32px]">
          {steps.map((step) => (
            <li key={step.title} className="flex flex-col items-center gap-[24px] rounded-[16px] bg-white/10 py-[42px] text-center">
              <LayeredIcon parts={step.icon} />
              <div className="flex flex-col gap-[8px] leading-[1.5]">
                <h3 className="text-[24px] font-semibold text-[#fafafa]">{step.title}</h3>
                <p className="text-[18px] text-[#ccc]">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export type AddOn = { name: string; desc: string; icon: ReactNode };

// 맨 아래 회색 구역이 푸터에 바로 붙는다 — 화면은 GuestPage flush 로 감싼다.
export function IntroAddOns({ routes, items, raised = false }: { routes: GuestRoutes; items: AddOn[]; raised?: boolean }) {
  return (
    <section className="bg-guest-surface pt-[120px] pb-[60px]">
      <div className={`${FRAME} flex flex-col gap-[60px]`}>
        <TitleRow
          light="함께 쓰면"
          bold="더 편해지는 부가서비스"
          action={
            <GuestButton tone="navy" href={routes.addOnServices} arrow>
              부가서비스 전체 보기
            </GuestButton>
          }
        />
        <ul className="grid grid-cols-3 gap-[16px]">
          {items.map(({ name, desc, icon }) => (
            <li
              key={name}
              className={`flex items-center gap-[24px] rounded-[16px] border border-guest-line bg-white px-[42px] pt-[40px] pb-[28px] ${raised ? "shadow-[0_8px_24px_rgba(0,0,0,0.02)]" : ""}`}
            >
              <span className="flex w-[74px] shrink-0 items-center">{icon}</span>
              <div className="flex flex-col gap-[2px] leading-[1.5] text-guest-ink">
                <h3 className="text-[22px] font-bold">{name}</h3>
                <p className="text-[16px]">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
