import type { ReactNode } from "react";
import { Arrow, SectionTitle, TRIM } from "./guest-ui";
import { FRAME } from "./theme";

// 메뉴 소개 화면(매장운영 · 재무관리)이 함께 쓰는 네 구역. 시안(로그인전_공유 44:661 · 44:1412)이 같은 틀에 글·그림만 바꿔 넣은 것이라
// 구역은 여기서 그리고, 화면마다 내용 표만 넘긴다. 데모(docs/demo/src/guest-intro.mjs)도 같은 구성이다.
// 프랜차이즈(44:1035)도 같은 틀이다 — 사진이 배경 없는 그림이라 회색 바탕을 깔지 않고(backdrop), 부가서비스 카드에 옅은 그림자가 있다(raised).

export type Moment = { before: { title: string; desc: string }; after: { title: string; desc: string } };

// 칸마다 「도입 전 · 도입 후」를 되풀이하지 않는다 — 표 왼쪽 줄 이름 칸이 한 번씩만 말한다. 도입 후 칸 위 가운데에 흰 동그라미 화살표(2026-11-10 사용자 지정).
function MomentBox({ title, desc, after }: { title: string; desc: string; after: boolean }) {
  return (
    <div className={`relative flex flex-col gap-[10px] px-[28px] pt-[34px] pb-[42px] ${after ? "bg-guest-slate text-white" : "bg-guest-card text-guest-slate"}`}>
      {after && (
        <span aria-hidden className="absolute top-0 left-1/2 z-10 flex size-[52px] -translate-1/2 items-center justify-center rounded-full border-4 border-white bg-guest-navy text-white shadow-[0_6px_16px_rgba(58,86,112,0.35)]">
          <span className="flex rotate-90">
            <Arrow />
          </span>
        </span>
      )}
      {/* 제목은 줄바꿈 표시가 있는 자리에서만 줄을 바꾼다 — 칸이 넷인 매장운영은 두 줄로 나누고, 칸이 셋인 재무관리 · 프랜차이즈는 한 줄이다(2026-11-10 사용자 지정). */}
      <p className="text-[22px] leading-[1.4] font-bold">
        {title.split("\n").map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
      <p className={`text-[16px] leading-[1.5] ${TRIM}`}>{desc}</p>
    </div>
  );
}

// 제목 옆 [사업자 회원가입] · [도입문의] 버튼은 뺐다 — 머리말에 도입문의가 있고 소개 페이지는 읽는 곳이다(2026-11-10 사용자 지정).
export function IntroMoments({ light, bold, items }: { light: string; bold: string; items: Moment[] }) {
  // 왼쪽 줄 이름 칸(도입 전 · 도입 후) + 순간 수만큼의 칸(매장운영은 넷). 두 줄은 줄마다 높이가 같고, 칸 사이 1px 흰 틈은 gap 으로, 바깥 네 모서리만 둥글게 감싼다.
  const rowLabel = (label: string, after: boolean) => (
    <div className={`flex items-center justify-center text-[18px] leading-[1.4] font-bold ${after ? "bg-guest-slate text-white" : "bg-guest-card text-guest-slate"}`}>{label}</div>
  );
  return (
    <section className={`${FRAME} flex flex-col gap-[60px] py-[100px]`}>
      <SectionTitle oneLine light={light} bold={bold} />
      <div className="grid gap-px overflow-hidden rounded-[16px]" style={{ gridTemplateColumns: `88px repeat(${items.length}, minmax(0, 1fr))` }}>
        {rowLabel("도입 전", false)}
        {items.map((m) => (
          <MomentBox key={m.before.title} {...m.before} after={false} />
        ))}
        {rowLabel("도입 후", true)}
        {items.map((m) => (
          <MomentBox key={m.after.title} {...m.after} after />
        ))}
      </div>
    </section>
  );
}

export type Feature = { id: string; photo: string; tab: string; no: string; title: string[]; lead: string[]; points: string[] };

// 한 줄 흐름 — 번호 동그라미 다섯 개를 선 하나로 잇고 아래에 단계 이름 · 한 줄. 카드 없이 흰 바탕이라 위 「이렇게 달라집니다」 뒤의 가벼운 마무리다.
// 「끊김 없이」를 선으로 보인다(매장운영, 2026-11-10 사용자 지정 — 전엔 어두운 바탕 아이콘 카드 IntroFlow). 글자는 메인 카드와 같은 22px 남색 · 17px 본문색.
// 동그라미 안은 단계 아이콘(남색 선, 28px)이고 번호는 단계 이름 앞에 연한 남색으로 붙인다 — 번호만 있던 동그라미는 심심했다(2026-11-10 사용자 지정).
export function IntroTimeline({ light, bold, steps }: { light: string; bold: string; steps: { title: string; desc: string; icon: ReactNode }[] }) {
  return (
    <section className={`${FRAME} flex flex-col gap-[60px] py-[100px]`}>
      <SectionTitle oneLine light={light} bold={bold} />
      <ol className="grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, i) => (
          <li key={step.title} className="relative flex flex-col items-center gap-[24px] px-[12px] text-center">
            {/* 동그라미 사이를 물결로 잇는다 — 칸마다 위 · 아래로 번갈아 휘어 다섯 칸이 한 물결이 된다. 점선이 흐르고 동그라미가 차례로 떠올라 생동감을 준다(globals.css guest-wave-flow · guest-float, 2026-11-10 사용자 지정). */}
            {i < steps.length - 1 && (
              <svg aria-hidden className="absolute top-[40px] left-1/2 h-[40px] w-full -translate-y-1/2" viewBox="0 0 100 40" preserveAspectRatio="none" fill="none">
                <path d={i % 2 === 0 ? "M0 20 C 30 -4, 70 -4, 100 20" : "M0 20 C 30 44, 70 44, 100 20"} stroke="#93a2b1" strokeWidth="2" vectorEffect="non-scaling-stroke" className="guest-wave-flow" />
              </svg>
            )}
            <span className="guest-float relative flex size-[80px] items-center justify-center rounded-full border border-[#e3ebf3] bg-[#f1f7fc] text-guest-navy" style={{ animationDelay: `${i * 0.35}s` }}>
              {step.icon}
            </span>
            <div className="flex flex-col gap-[8px]">
              <h3 className="text-[22px] leading-[1.4] font-bold text-guest-navy">
                <span className="mr-[8px] text-guest-navy-soft">{String(i + 1).padStart(2, "0")}</span>
                {step.title}
              </h3>
              <p className="text-[17px] leading-[1.6] text-guest-body">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
