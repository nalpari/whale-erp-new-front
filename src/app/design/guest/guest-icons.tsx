import Image from "next/image";
import { ICON_GRADIENT } from "./guest-ui";

// 비로그인 화면들이 함께 쓰는 아이콘. 시안이 도형과 SVG 를 겹쳐 그린 것이라 같은 자리·크기로 겹친다.
// SVG 는 화면마다 Figma 에서 따로 받은 파일이라 경로를 받는다.

// 선 아이콘 조각. 선 굵기만큼 SVG 가 시안 칸보다 커서, 칸 위치에서 그만큼 당겨 놓은 좌표다.
export type IconPart = { src: string; width: number; height: number; left: number; top: number };

export function LayeredIcon({ parts }: { parts: IconPart[] }) {
  return (
    <span className="relative size-[64px]">
      {parts.map((part, i) => (
        <Image
          key={i}
          src={part.src}
          alt=""
          width={part.width}
          height={part.height}
          className="absolute max-w-none"
          style={{ left: part.left, top: part.top }}
        />
      ))}
    </span>
  );
}

// 직원 두 명 — 매장운영 「직원 초대」와 부가서비스 「직원수 추가」가 같은 그림을 쓴다.
const STAFF = "/guest/store-operations";
export const STAFF_ICON: IconPart[] = [
  { src: `${STAFF}/flow-invite-1.svg`, width: 41.3333, height: 20, left: 3.33, top: 38 },
  { src: `${STAFF}/flow-invite-2.svg`, width: 25.3333, height: 25.3333, left: 11.33, top: 6 },
  { src: `${STAFF}/flow-invite-3.svg`, width: 12.0005, height: 19.6538, left: 48.67, top: 38.35 },
  { src: `${STAFF}/flow-invite-4.svg`, width: 12.0214, height: 24.6676, left: 40.67, top: 6.35 },
];

export function KioskIcon() {
  return (
    <span className="relative block h-[74px] w-[70px]">
      <span
        className="absolute top-0 left-[7px] h-[63px] w-[56px] rounded-[10px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25)]"
        style={{ backgroundImage: ICON_GRADIENT }}
      />
      <span
        className="absolute top-[5px] left-[12px] h-[39px] w-[46px] rounded-[10px] shadow-[inset_0_1px_3.8px_rgba(255,255,255,0.05)]"
        style={{ backgroundImage: "linear-gradient(108deg, rgba(255,255,255,0.04) 8.98%, rgba(255,255,255,0.24) 94.82%)" }}
      />
      <span className="absolute top-[14px] left-[21px] h-[8px] w-[29px] rounded-[2px] bg-white/90" />
      <span className="absolute top-[27px] left-[21px] h-[2px] w-[24px] rounded-full bg-white/60" />
      <span className="absolute top-[33px] left-[21px] h-[2px] w-[17px] rounded-full bg-white/40" />
      <span className="absolute top-[49px] left-0 h-[25px] w-[70px] rounded-[10px] bg-white/40 shadow-[0_1.3px_13px_rgba(0,0,0,0.09),inset_0_5.2px_4px_rgba(255,255,255,0.55)] backdrop-blur-[4.9px]" />
    </span>
  );
}

export function InventoryIcon({ src }: { src: string }) {
  return (
    <span className="relative block h-[74px] w-[67px]">
      <Image src={src} alt="" width={83.3356} height={91.3557} className="absolute top-[-9.18px] left-[-12.98px] max-w-none" />
    </span>
  );
}

export function OrderIcon({ back, front }: { back: string; front: string }) {
  return (
    <span className="relative block h-[74px] w-[72px]">
      <Image src={back} alt="" width={72.15} height={61.1035} className="absolute top-[12.89px] left-0 max-w-none" />
      <span
        className="absolute top-0 left-[10.31px] h-[64.75px] w-[51.27px] rounded-[9px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25)]"
        style={{ backgroundImage: ICON_GRADIENT }}
      />
      <span className="absolute top-[14px] left-[21.2px] h-[2px] w-[29px] rounded-full bg-white/90" />
      <span className="absolute top-[21px] left-[21.2px] h-[2px] w-[24px] rounded-full bg-white/60" />
      <span className="absolute top-[28px] left-[21.2px] h-[2px] w-[17px] rounded-full bg-white/40" />
      <Image src={front} alt="" width={72.15} height={40.7839} className="absolute top-[33.22px] left-0 max-w-none" />
    </span>
  );
}

export function RecipeIcon({ bookmark }: { bookmark: string }) {
  return (
    <span className="relative block h-[74px] w-[68px]">
      <span
        className="absolute top-0 left-[13.87px] h-[52.42px] w-[53.96px] rounded-[8.9px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.25)]"
        style={{ backgroundImage: ICON_GRADIENT }}
      />
      <Image src={bookmark} alt="" width={79.9233} height={83.7806} className="absolute top-[-1.21px] left-[-12.98px] max-w-none" />
      <span className="absolute top-[30px] left-[19px] h-[2px] w-[17px] rounded-full bg-white/90" />
      <span className="absolute top-[23px] left-[26.5px] h-[17px] w-[2px] rounded-full bg-white/90" />
    </span>
  );
}
