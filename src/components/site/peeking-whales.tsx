import type { CSSProperties } from "react";

// 시작 가이드 상자 · 버튼 위로 고개를 내민 고래(2026-11-25 사용자 지정 — Orca 새 기능 안내 창의 캐릭터를 본떴다).
// 몸통은 상자 위 테두리에서 평평하게 끊겨 창 뒤에 숨은 것처럼 보이고, 두 지느러미만 테두리 위에 걸친다. 엄마 고래 옆에는 꼬리를 붙여
// 몸이 창 뒤로 이어진 것처럼 둔다. 색은 이 그림에만 나와 토큰으로 두지 않는다 — 엄마 밝은 파랑 #6B8FC7, 아기 · 물줄기 하늘색 #B3D0F4,
// 배 크림 #F3EAD8 · #F7F1E4, 눈 #1B2335, 볼 #F2A7B0(DESIGN.md 「시작 가이드」 고래 예외).
// PeekingWhales 는 감싸는 상자가 position 이 있는 상자(relative · absolute · fixed)여야 하고 overflow 를 감추면 안 된다. HoverBabyWhale 은 스스로
// 자르기 칸을 둔다. 그림은 누르는 데 끼어들지 않는다.

const MOM = "#6b8fc7";
const BABY = "#b3d0f4";
const EYE = "#1b2335";
const CHEEK = "#f2a7b0";

// 고래 그림 viewBox 는 120 × 84 — 몸 아래 평평한 선(y=78)이 상자 위 테두리 바깥 선에 오고, 지느러미(가운데 y=78, 위아래 6.5 남짓)가 테두리를 가운데 두고 걸친다.
// 꼬리 viewBox 는 60 × 40 — 아래 평평한 선(y=40)이 테두리 바깥 선이고, tilt 만큼 밑동을 축으로 기울여 몸에서 뻗은 느낌을 준다. 테두리 1px 을 더해 위로 올린다.
const whaleBox = (left: number, width: number): CSSProperties => ({ left, width, height: (width * 84) / 120, top: -((width * 78) / 120) - 1 });
const tailBox = (left: number, width: number, tilt: number): CSSProperties => ({
  left,
  width,
  height: (width * 40) / 60,
  top: -((width * 40) / 60) - 1,
  transform: `rotate(${tilt}deg)`,
  // 밑동 가운데를 축으로 돌려 평평한 밑선이 테두리에서 뜨지 않게(리뷰)
  transformOrigin: "47.5% 100%",
});

function Mom({ style }: { style: CSSProperties }) {
  return (
    <svg viewBox="0 0 120 84" className="absolute overflow-visible" style={style}>
      {/* 물줄기 */}
      <path d="M58 16 C55 8 50 6 46 7 M60 15 C60 6 62 2 66 1 M62 16 C66 9 71 8 75 10" stroke={BABY} strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="45" cy="7" r="2.4" fill={BABY} />
      <circle cx="66" cy="1.8" r="2.4" fill={BABY} />
      <circle cx="76" cy="10.5" r="2.4" fill={BABY} />
      <path d="M14 78 C10 44 30 20 60 20 C90 20 110 44 106 78 Z" fill={MOM} />
      <path d="M30 78 C30 60 44 52 60 52 C76 52 90 60 90 78 Z" fill="#f3ead8" />
      <circle cx="44" cy="46" r="5" fill={EYE} />
      <circle cx="45.6" cy="44.4" r="1.6" fill="#fff" />
      <circle cx="76" cy="46" r="5" fill={EYE} />
      <circle cx="77.6" cy="44.4" r="1.6" fill="#fff" />
      <ellipse cx="35" cy="55" rx="5" ry="3" fill={CHEEK} opacity=".8" />
      <ellipse cx="85" cy="55" rx="5" ry="3" fill={CHEEK} opacity=".8" />
      <path d="M55 55 Q60 59 65 55" stroke={EYE} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* 테두리를 잡은 지느러미 */}
      <ellipse cx="30" cy="78" rx="10" ry="6.5" fill={MOM} transform="rotate(-10 30 78)" />
      <ellipse cx="90" cy="78" rx="10" ry="6.5" fill={MOM} transform="rotate(10 90 78)" />
    </svg>
  );
}

function Baby({ style }: { style: CSSProperties }) {
  return (
    <svg viewBox="0 0 120 84" className="absolute overflow-visible" style={style}>
      <path d="M14 78 C10 44 30 20 60 20 C90 20 110 44 106 78 Z" fill={BABY} />
      <path d="M30 78 C30 60 44 52 60 52 C76 52 90 60 90 78 Z" fill="#f7f1e4" />
      <circle cx="44" cy="47" r="4.6" fill={EYE} />
      <circle cx="45.4" cy="45.5" r="1.5" fill="#fff" />
      <circle cx="76" cy="47" r="4.6" fill={EYE} />
      <circle cx="77.4" cy="45.5" r="1.5" fill="#fff" />
      <ellipse cx="35" cy="56" rx="5" ry="3" fill={CHEEK} opacity=".8" />
      <ellipse cx="85" cy="56" rx="5" ry="3" fill={CHEEK} opacity=".8" />
      <ellipse cx="60" cy="57" rx="3.2" ry="2.4" fill={EYE} />
      <ellipse cx="30" cy="78" rx="10" ry="6.5" fill={BABY} transform="rotate(-10 30 78)" />
      <ellipse cx="90" cy="78" rx="10" ry="6.5" fill={BABY} transform="rotate(10 90 78)" />
    </svg>
  );
}

function Tail({ style }: { style: CSSProperties }) {
  return (
    <svg viewBox="0 0 60 40" className="absolute overflow-visible" style={style}>
      <path
        d="M24 40 C24 32 23 26 19 22 C12 19 3 17 2 9 C2 5 7 4 11 7 C16 10 22 14 27 18 C30 12 36 6 44 4 C49 3 52 7 49 12 C45 18 37 21 34 25 C32 29 33 34 33 40 Z"
        fill={MOM}
      />
    </svg>
  );
}

/**
 * 헤더 「시작 가이드」 버튼에 마우스를 올리면(키보드 포커스 포함) 버튼 뒤에서 아기 고래가 위로 쏙 고개를 내민다(2026-11-25 사용자 지정 —
 * 옆으로 눕힌 안은 얼굴이 반만 보이고 왼쪽 점포 칸에 붙어 위로 정했다). 버튼에 `group` 이 있어야 한다. 버튼 위 끝에서 몸을 끊는 자르기 칸
 * (overflow hidden) 안에서 아래 → 위로 200ms 올라오고, 떼거나 눌러 목록이 열리면 다시 숨는다. 헤더 줄 위쪽
 * 여유(18px) 안에 들어가게 28px 로 둔다. 동작 줄이기 설정이면 움직이지 않는다.
 */
export function HoverBabyWhale({ open }: { open: boolean }) {
  // 28px 고래: 그림 높이 19.6px, 몸 아래 선(y=78)은 18.2px — 칸을 2px 내려 몸 아래 선이 버튼 위 끝보다 0.6px 안쪽에 오고, 지느러미는 버튼 위 끝 안쪽에 보인다
  return (
    <span aria-hidden className="pointer-events-none absolute bottom-[calc(100%-2px)] left-[14px] h-[20px] w-[28px] overflow-hidden">
      <span
        className={`absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${open ? "" : "group-hover:translate-y-0 group-focus-visible:translate-y-0"}`}
      >
        <Baby style={{ position: "relative", display: "block", width: 28, height: (28 * 84) / 120 }} />
      </span>
    </span>
  );
}

/**
 * 시작 가이드 상자 위 고래 — 왼쪽 끝에서 24px 부터 선다(접은 알약 `baby` 만 22px). 크기는 폭이고 높이는 폭 × 0.7 이다.
 * - `family`: 미니 카드 — 아기 → 엄마 → 꼬리(꼬리는 엄마 몸 뒤에 살짝 겹친다)
 * - `baby`: 접은 미니 카드 알약 — 아기 고래 한 마리(40px, 알약 둥근 끝을 피해 왼쪽 22px)
 */
export function PeekingWhales({ variant }: { variant: "family" | "baby" }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0">
      {variant === "baby" ? (
        <Baby style={whaleBox(22, 40)} />
      ) : (
        <>
          <Baby style={whaleBox(24, 56)} />
          <Tail style={tailBox(158, 36, 8)} />
          <Mom style={whaleBox(86, 84)} />
        </>
      )}
    </span>
  );
}
