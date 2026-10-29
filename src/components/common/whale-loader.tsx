"use client";

import { useEffect, useId, useRef, type CSSProperties } from "react";
import { jumpPose, planJump, type JumpPlan } from "./whale-loader-math";

// 공통 로딩의 그림 — 네모 파도 위로 고래가 튀어 올랐다 다시 들어간다. 노영주 님 제공 whale-loader(Whale ERP 로고 SVG)를 React 로 옮겼다.
// 그림만 맡는다(띄우고 내리는 일은 LoadGroup · ActionProvider 가 하고, 문구는 LoadingNotice 가 아래에 둔다). 점프 계산은 whale-loader-math.ts.
// 점프 위치는 requestAnimationFrame 으로 직접 옮기므로(마운트 동안만 돈다) 서버 렌더에는 고래가 보이지 않고, 무작위 값은 effect 안에서만 쓴다.
// 파도 · 꼬리 움직임 CSS(wl- 접두어)는 globals.css 에 있다.

/** 크기 값. 화면을 보고 숫자만 바꾸면 된다. 작은 영역에는 고래 로딩을 쓰지 않는다
 * (whaleSize · jumpHeight 는 원본 기본값 38 · 50 에서 더 크게 키웠다 — 사용자 지정, 2026-10-29) */
export const WHALE_LOADER_SIZE = {
  width: 420, // 파도 줄 최대 너비(px)
  whaleSize: 52, // 고래 가로(px)
  jumpHeight: 60, // 수면 위로 뛰어오르는 높이(px)
  squareSize: 7, // 파도 네모 한 변(px)
  lineHeight: 36, // 파도 줄 높이(px)
  swellLow: 6, // 파도가 가라앉는 깊이(px)
  swellHigh: 13, // 파도가 솟는 높이(px)
  dropSize: 5, // 물방울 한 변(px)
} as const;

// 색 · 움직임 시간은 두 크기가 같다(원본 기본값)
const COLORS = {
  whale: "#3A5670",
  waveFrom: "rgba(174,190,206,.9)", // 왼쪽(연한) 네모
  waveTo: "rgba(32,96,154,.9)", // 오른쪽(진한) 네모 · 물방울
};
/** 로딩 덮개 바탕(배경 → 연한 하늘색 원형 그라데이션)과 문구색. LoadingNotice 가 쓴다 */
export const WHALE_LOADER_BACKGROUND = "radial-gradient(60% 70% at 50% 45%, #fff 0, #EEF3F8 75%)";
// 문구 색을 고래 색과 같게 맞췄다(사용자 지정, 2026-10-29 — 전엔 #1F3449 로 고래보다 살짝 더 어두웠다)
export const WHALE_LOADER_TEXT_COLOR = COLORS.whale;
const JUMP_MS = 1500; // 물에서 나와 다시 들어가기까지
const REST_MS = 1100; // 물속에 있다가 다음 점프까지
const JUMP_DISTANCE = [0.32, 0.44] as const; // 한 번에 건너는 거리(파도 줄 너비 대비 최소 · 최대)
const DROP_COUNT = 7;
const SQUARE_COUNT = 24;
const WHALE_RATIO = 37.5 / 49.69; // 고래 세로 / 가로

// Whale ERP 로고의 고래 윤곽선(좌표로 적은 그림). 꼬리는 TAIL 영역만 잘라 따로 움직인다. 원본 문자열 그대로.
const WHALE = "M49.3397 1.17806C49.2304 0.870166 48.4523 -0.676202 48.3108 0.343237C48.209 1.08169 48.3718 1.69748 48.0167 2.44783C47.8822 2.73194 47.7163 2.95911 47.5271 3.1456C47.3379 3.33209 47.1261 3.47728 46.8986 3.59743C46.0519 4.04363 44.9998 4.13437 44.1746 4.68634C43.5221 5.12315 43.0583 5.79276 42.8251 6.53622C42.8151 6.56939 42.7849 6.59067 42.7516 6.59067C42.5511 6.58941 42.4348 6.38102 42.2519 6.28778C41.4405 5.87224 40.6134 5.75459 39.702 5.84971C38.2451 6.00116 37.3319 7.17267 35.7951 6.05185C35.6707 5.9611 34.6437 4.78208 34.5387 5.21577C34.4193 5.71016 34.6537 6.41356 34.836 6.86727C35.0453 7.38231 35.3401 7.88483 35.7241 8.2866C36.2653 8.85421 36.8812 9.3511 37.5506 9.76288C37.7649 9.8943 37.9836 10.0094 38.2049 10.114C38.3004 10.159 38.3966 10.2028 38.4927 10.2448C38.9371 10.44 39.3896 10.6102 39.8397 10.8142C40.2488 11.0001 40.6586 11.1847 41.0678 11.37C41.2783 11.4657 41.4883 11.5633 41.7001 11.6566C41.8195 11.7085 42.015 11.7292 42.0671 11.8637C42.0879 11.9169 42.0885 11.9751 42.0753 12.0314C41.6592 12.7599 41.0778 13.3556 40.355 13.7937C39.7925 14.1335 39.1816 14.3119 38.5606 14.5034C37.4268 14.8538 36.308 15.1248 35.1107 15.0703C33.7254 15.0078 32.2993 14.5716 30.9354 14.3238C29.4251 14.0497 27.9104 13.7618 26.4472 13.2899C23.7898 12.4326 21.1362 11.1528 18.4926 10.3824C17.6027 10.1233 16.4826 10.017 15.6618 9.664C15.3161 9.51506 14.9962 9.23157 14.658 9.07512C13.6694 8.61891 12.5776 8.78474 11.4903 8.54819C9.04913 8.01688 4.98827 6.15948 2.55904 6.82722C1.99778 6.98117 1.61312 7.51623 1.42205 7.57193C1.11094 7.66205 0.880269 7.5106 0.491845 7.72838C-0.37614 8.21463 0.114105 10.0977 0.384368 10.8718C0.997803 12.6291 2.14925 13.4395 3.32269 14.7318C5.19882 16.7976 6.8996 18.9917 9.05102 20.794C9.98248 21.5744 10.9554 22.2527 11.9768 22.8616C11.9208 22.9305 11.8674 23.0012 11.831 23.0807C11.7304 23.2997 11.7624 23.5444 11.731 23.7741C11.6921 24.0607 11.5488 24.2872 11.4168 24.535C11.1484 25.0376 11.3784 25.4669 11.5286 25.9757C11.709 26.5871 11.6845 27.1609 11.5462 27.7767C11.3998 28.4332 11.6235 28.7636 11.8737 29.3475C12.0264 29.7061 12.0931 30.0953 12.1433 30.4796C12.1949 30.8776 12.3055 31.2675 12.401 31.6592C12.4777 31.9734 12.6562 32.1699 12.8215 32.4415C12.9686 32.6831 13.1012 32.9327 13.2458 33.1749C13.5254 33.6443 13.8592 34.1111 14.3651 34.3565C14.7661 34.5505 15.2074 34.5092 15.4682 34.1124C15.7341 33.71 15.5015 33.1211 15.5348 32.6618C15.5782 32.076 15.4871 31.4997 15.4896 30.9177C15.4915 30.3895 15.6008 29.9451 15.7089 29.4339C15.8158 28.9288 15.9289 28.4513 16.1036 27.9638C16.2746 27.487 16.482 27.0652 16.4839 26.5602C16.4858 26.042 16.3318 25.6096 16.1426 25.1352C16.0741 24.9644 16.0056 24.7935 15.949 24.6183L18.1193 25.3361C18.35 25.7929 18.7585 26.1534 19.14 26.5883C19.854 27.4031 20.2273 28.3049 20.4549 29.3519C20.6975 30.4683 21.2795 30.8188 22.0821 31.5422C22.5749 31.9865 22.9564 32.5397 23.3077 33.0973C23.6723 33.6737 24.121 34.1969 24.5484 34.7326C24.8916 35.1625 25.3077 35.3396 25.7564 35.6412C26.1555 35.9091 26.5389 36.2001 26.9349 36.4717C27.7017 36.9967 28.5508 37.4799 29.5062 37.4993C30.2629 37.5143 30.9134 37.1382 31.0328 36.3409C31.1542 35.5317 30.3742 34.7889 30.0982 34.0567C29.7456 33.1236 29.1932 32.2994 28.7802 31.3995C28.4056 30.5847 28.256 29.8219 28.0581 28.9564C27.862 28.1021 27.6942 27.2855 27.615 26.41C27.593 26.1659 27.5785 25.9268 27.5615 25.6915C31.9907 25.0845 36.2401 23.0068 39.5355 20.0393C39.8309 19.7733 40.1131 19.4935 40.3921 19.2101C40.9194 18.675 41.4355 18.1318 41.9986 17.638C42.7258 16.9997 43.3462 16.2099 43.7912 15.3513C44.3241 14.3206 44.5925 13.1729 44.7459 12.0302C44.8075 11.5721 44.805 11.1434 45.101 10.7648C45.353 10.4419 45.7025 10.2016 46.04 9.97565C46.4768 9.6834 46.9771 9.42244 47.3291 9.0238C47.7647 8.53004 48.1625 7.97808 48.5013 7.38669C49.5798 5.50927 50.0713 3.23884 49.3404 1.17806H49.3397ZM17.9552 24.8354C17.2532 24.6371 16.509 24.3824 15.8598 24.137C15.4204 23.9712 15.0245 23.8097 14.714 23.6733C13.8133 23.2772 13.0019 22.8516 12.2552 22.3973C8.96617 20.3972 6.93417 17.8408 4.12029 14.8038C2.81548 13.3957 1.38371 12.3706 0.746395 10.4388C0.478017 9.62395 -0.00908502 8.04254 1.27938 8.04754C2.40694 8.05192 5.3195 9.18213 6.49295 9.62583C8.20189 10.271 11.1302 11.3493 12.3124 12.7104C13.0735 13.5878 13.2263 14.611 13.785 15.5747C14.3149 16.4891 15.0861 17.2895 15.9496 17.8952C16.3462 18.1731 16.7472 18.2582 17.0514 18.6612C17.306 18.9992 17.4562 19.4134 17.5316 19.8265C17.6485 20.4661 17.6058 21.1225 17.6228 21.7721C17.636 22.2878 17.7076 22.7765 17.8729 23.2659C18.0137 23.6821 17.9615 24 17.9364 24.4456C17.9289 24.5845 17.9364 24.7134 17.9559 24.8348L17.9552 24.8354ZM33.792 23.229C31.8091 24.199 29.6759 24.8667 27.5094 25.1471C27.4591 24.7491 27.3742 24.3611 27.1976 23.9768C26.8299 23.1758 26.2838 22.6188 25.6521 22.0212C25.5672 21.9405 25.4824 21.8597 25.3982 21.779C26.8186 22.0024 28.251 22.3278 29.6388 22.4555C29.9147 22.4812 30.1605 22.4943 30.3823 22.4968C31.936 22.5124 32.327 21.9861 33.8763 21.2621C34.8392 20.8121 35.687 20.7777 36.6719 20.5086C37.5694 20.2627 38.313 19.7902 39.1715 19.4973C37.6078 20.9874 35.775 22.259 33.792 23.229Z";
const TAIL = "33,-4 56,-4 56,19 44,19 41,13.2 33,12.5";

export function WhaleLoader() {
  const size = WHALE_LOADER_SIZE;
  // SVG id(symbol · clipPath · mask)는 문서 안에서 유일해야 해서 useId 로 만든다 — 한 화면에 로딩이 둘 이상 떠도 겹치지 않는다(React 19 의 useId 는 "_r_0_" 꼴이라 url(#…) 에 그대로 쓸 수 있다)
  const uid = `wl${useId()}`;
  const lineRef = useRef<HTMLDivElement>(null);
  const riderRef = useRef<HTMLDivElement>(null);

  const whaleH = size.whaleSize * WHALE_RATIO;

  useEffect(() => {
    const line = lineRef.current;
    const rider = riderRef.current;
    if (!line || !rider) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const squares = [...line.querySelectorAll<HTMLElement>(".wl-sq i")];
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    const OFF = size.whaleSize;
    const HALF = size.whaleSize / 2;
    const UNDER = whaleH + 3; // 시작 · 끝에 고래가 물속에 완전히 잠기는 깊이
    // 폭을 알 때까지(처리중 덮개는 자식 effect 가 부모의 showPopover() 보다 먼저 돌아 처음엔 0) 계획을 미루고 고래는 숨겨 둔다
    let plan: JumpPlan | null = null;
    let t0 = 0;
    let out = false;
    let back = false;
    let raf = 0;

    const splash = (x: number) => {
      for (let i = 0; i < DROP_COUNT; i++) {
        const d = document.createElement("span");
        d.className = "wl-drop";
        d.style.left = `${x}px`;
        d.style.setProperty("--dx", `${((i - (DROP_COUNT - 1) / 2) * 7 + (Math.random() * 6 - 3)).toFixed(1)}px`);
        d.style.setProperty("--dy", `${(-14 - Math.random() * 16).toFixed(1)}px`);
        line.appendChild(d);
        later(() => d.remove(), 800);
      }
      for (const e of squares) {
        if (Math.abs(e.offsetLeft + size.squareSize / 2 - x) < 26) {
          e.classList.add("hit");
          later(() => e.classList.remove("hit"), 660);
        }
      }
    };

    const frame = (now: number) => {
      const width = line.clientWidth;
      if (width <= 0) {
        // 아직 자리가 없다 — 보이지 않게 두고 다음 프레임에 다시 본다(점프 시각도 폭이 생긴 때부터 센다)
        rider.style.opacity = "0";
        plan = null;
      } else if (reduce.matches) {
        // 움직임을 줄인 설정 — 점프 없이 가운데에 떠 있고 파도만 천천히 움직인다
        rider.style.opacity = "1";
        rider.style.transform = `translate(${width / 2 + OFF - HALF}px,-14px)`;
      } else {
        if (!plan) {
          plan = planJump(width, JUMP_DISTANCE, Math.random);
          t0 = now;
          out = back = false;
        }
        let el = now - t0;
        if (el > JUMP_MS + REST_MS) {
          t0 = now;
          el = 0;
          plan = planJump(width, JUMP_DISTANCE, Math.random);
          out = back = false;
        }
        if (plan && el <= JUMP_MS) {
          const s = el / JUMP_MS;
          const { x, y, angle } = jumpPose(s, plan, UNDER, size.jumpHeight);
          rider.style.opacity = "1";
          rider.style.transform = `translate(${(x + OFF - HALF).toFixed(1)}px,${y.toFixed(1)}px) rotate(${angle.toFixed(1)}deg)`;
          if (!out && y < 0) {
            out = true;
            splash(x);
          }
          if (out && !back && s > 0.5 && y > 0) {
            back = true;
            splash(x);
          }
        } else rider.style.opacity = "0";
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      for (const id of timers) clearTimeout(id);
      for (const d of line.querySelectorAll(".wl-drop")) d.remove();
      for (const e of squares) e.classList.remove("hit");
    };
  }, [size, whaleH]);

  const rootStyle = {
    "--wl-whale": COLORS.whale,
    "--wl-from": COLORS.waveFrom,
    "--wl-to": COLORS.waveTo,
    "--wl-sq": `${size.squareSize}px`,
    "--wl-swell-low": `${size.swellLow}px`,
    "--wl-swell-high": `-${size.swellHigh}px`,
    "--wl-drop": `${size.dropSize}px`,
    width: `min(100%, ${size.width}px)`,
  } as CSSProperties;
  const lineStyle: CSSProperties = { height: size.lineHeight, marginTop: size.jumpHeight + size.whaleSize + 4 };
  const skyStyle: CSSProperties = {
    left: -size.whaleSize,
    right: -size.whaleSize,
    height: size.jumpHeight + size.whaleSize * 2,
  };
  const riderStyle: CSSProperties = { width: size.whaleSize, height: whaleH };

  return (
    <div aria-hidden="true" className="wl-root" style={rootStyle}>
      <div ref={lineRef} className="wl-line" style={lineStyle}>
        <div className="wl-sq">
          {Array.from({ length: SQUARE_COUNT }, (_, i) => (
            <i key={i} style={{ "--i": i } as CSSProperties} />
          ))}
        </div>
        <div className="wl-sky" style={skyStyle}>
          <div ref={riderRef} className="wl-rider" style={riderStyle}>
            <div className="wl-bob">
              <svg viewBox="0 0 49.6875 37.4997" overflow="visible">
                <defs>
                  <symbol id={`${uid}-whale`} viewBox="0 0 49.6875 37.4997">
                    <path fill="currentColor" d={WHALE} />
                  </symbol>
                  <clipPath id={`${uid}-tail-clip`}>
                    <polygon points={TAIL} />
                  </clipPath>
                  <mask id={`${uid}-body-mask`} maskUnits="userSpaceOnUse" x="-5" y="-5" width="62" height="48">
                    <rect x="-5" y="-5" width="62" height="48" fill="#fff" />
                    <polygon points={TAIL} fill="#000" />
                  </mask>
                </defs>
                <use href={`#${uid}-whale`} width="49.6875" height="37.4997" mask={`url(#${uid}-body-mask)`} />
                <g className="wl-tail">
                  <use href={`#${uid}-whale`} width="49.6875" height="37.4997" clipPath={`url(#${uid}-tail-clip)`} />
                </g>
                <circle cx="42.3" cy="13.9" r="2.3" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
