import Image from "next/image";
import { ICON_GRADIENT } from "./guest-ui";

// 재고 아이콘(InventoryIcon)만 Figma 에서 받은 SVG 경로를 받고, 레시피 · 발주 아이콘은 그라데이션 · 유리판 조각으로 그린다(2026-11-12).
// SVG 는 화면마다 Figma 에서 따로 받은 파일이라 경로를 받는다.

export function InventoryIcon({ src }: { src: string }) {
  return (
    <span className="relative block h-[74px] w-[67px]">
      <Image src={src} alt="" width={83.3356} height={91.3557} className="absolute top-[-9.18px] left-[-12.98px] max-w-none" />
    </span>
  );
}

// 발주 관리 — 본사에서 자재를 싣고 오는 배송 트럭. 짐칸 옆에 유리판 주문서를 붙인다(2026-11-12 사용자 지정 — 전엔 편지 봉투라 메일처럼 읽혔다).
export function OrderIcon() {
  return (
    <span className="relative block h-[74px] w-[76px]">
      <span className="absolute top-[18px] left-0 h-[38px] w-[48px] rounded-[6px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25)]" style={{ backgroundImage: ICON_GRADIENT }} />
      <span className="absolute top-[30px] left-[50px] h-[26px] w-[26px] rounded-[4px] rounded-tr-[12px] opacity-85" style={{ backgroundImage: ICON_GRADIENT }} />
      <span className={`absolute top-[8px] left-[6px] h-[24px] w-[34px] rounded-[5px] ${GLASS}`} />
      <span className="absolute top-[15px] left-[12px] h-[2px] w-[20px] rounded-full bg-[#3a6a96]" />
      <span className="absolute top-[21px] left-[12px] h-[2px] w-[13px] rounded-full bg-[#3a6a96]/60" />
      <span className="absolute top-[52px] left-[10px] size-[16px] rounded-full border-[3px] border-[#3a6a96] bg-white" />
      <span className="absolute top-[52px] left-[54px] size-[16px] rounded-full border-[3px] border-[#3a6a96] bg-white" />
    </span>
  );
}

// 레시피 관리 — 그릇 위 저울 눈금(유리판에 「120g」). 재료 사용량 · 맛의 기준을 숫자로 맞춘다는 뜻이다(2026-11-12 사용자 지정 — 전엔 + 상자와 책갈피라 무엇인지 읽히지 않았다).
// 그릇 · 받침은 다른 아이콘과 같은 그라데이션, 눈금판은 유리판(GLASS) 위에 그라데이션 글자다(CalendarIcon 의 날짜와 같은 방식).
export function RecipeIcon() {
  return (
    <span className="relative block h-[74px] w-[72px] font-[family-name:var(--font-inter)] leading-[normal] font-bold tracking-normal">
      <span
        className="absolute top-[30px] left-[4px] h-[30px] w-[64px] rounded-t-[6px] rounded-b-[32px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25)]"
        style={{ backgroundImage: ICON_GRADIENT }}
      />
      <span className="absolute top-[64px] left-[12px] h-[8px] w-[48px] rounded-full opacity-70" style={{ backgroundImage: ICON_GRADIENT }} />
      <span className={`absolute top-0 left-[14px] h-[34px] w-[44px] rounded-[8px] ${GLASS}`} />
      <span className="absolute top-[9px] left-[14px] w-[44px] bg-clip-text text-center text-[13px] text-transparent" style={{ backgroundImage: ICON_GRADIENT }}>
        120g
      </span>
    </span>
  );
}

// 유리판 아이콘 조각 — 흰 반투명 판에 그림자와 안쪽 밝은 테두리를 준다(부가서비스 · 매장운영 아이콘이 함께 쓴다).
export const GLASS = "bg-white/40 shadow-[0_1.3px_13px_rgba(0,0,0,0.09),inset_0_5.2px_4px_rgba(255,255,255,0.55)] backdrop-blur-[4.9px]";

// 시안의 「Sun」은 그라데이션을 흰 바탕 위에 겹친 글자다.
export function CalendarIcon() {
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
