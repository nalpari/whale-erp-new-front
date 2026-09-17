import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const SWAP_OFF = "transition-opacity duration-150 ease-out group-hover:opacity-0 group-focus-visible:opacity-0";
const SWAP_ON = "absolute opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100";

function Dots({ on }: { on?: boolean }) {
  return (
    <span className={`grid grid-cols-3 gap-[2.5px] ${on ? SWAP_ON : SWAP_OFF}`}>
      {Array.from({ length: 9 }, (_, i) => (
        <Image key={i} src={on ? "/icons/dot-on.svg" : "/icons/dot.svg"} alt="" width={3} height={3} />
      ))}
    </span>
  );
}

// 아이콘에 올리면 아이콘이 채워지고 아래에 이름 툴팁이 뜬다. 키보드 포커스에도 같은 상태를 보여 준다.
// 툴팁은 어느 아이콘에서 열리든 가운데 아이콘 아래 중앙에 뜬다(Figma 기준).
// 그래서 링크 자체는 위치 기준이 되지 않고, 툴팁은 아이콘 묶음(relative)을 기준으로 놓인다.
function ServiceLink({ label, href, boxed, off, on }: { label: string; href: string; boxed?: boolean; off: ReactNode; on: ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`group grid size-[34px] place-items-center rounded-[2px] ${
        boxed
          ? "border border-erp-brand bg-white transition-colors duration-150 ease-out hover:bg-erp-brand focus-visible:bg-erp-brand"
          : ""
      }`}
    >
      <span className="relative grid place-items-center">
        {off}
        {on}
      </span>
      <span className="pointer-events-none absolute top-[calc(100%+12px)] left-1/2 z-20 min-w-[110px] -translate-x-1/2 rounded-[2px] border border-erp-brand bg-white px-[11px] py-[9px] text-center text-[14px] leading-[2] whitespace-nowrap text-erp-brand opacity-0 transition-opacity duration-150 ease-out [text-box:trim-both_cap_alphabetic] group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="absolute -top-[5px] left-1/2 size-[8px] -translate-x-1/2 -rotate-45 rounded-tr-[1px] border-t border-r border-erp-brand bg-white" />
        {label}
      </span>
    </Link>
  );
}

// Figma Services. 서비스 바로가기 세 아이콘은 고정이고 링크만 바꿔 끼운다.
export function ServiceLinks({ hrefs = {} }: { hrefs?: { erp?: string; addon?: string; platform?: string } }) {
  return (
    <div className="flex items-center gap-[18px]">
      <span className="text-[15px] font-medium text-erp-ink">서비스 바로가기</span>
      <div className="relative flex gap-[6px]">
        <ServiceLink
          label="웨일ERP"
          href={hrefs.erp ?? "#"}
          off={<Image src="/icons/service-1.svg" alt="" width={34} height={34} className={SWAP_OFF} />}
          on={<Image src="/icons/service-1-on.svg" alt="" width={34} height={34} className={SWAP_ON} />}
        />
        <ServiceLink
          label="부가서비스 현황"
          href={hrefs.addon ?? "#"}
          boxed
          off={<Image src="/icons/service-2.svg" alt="" width={18} height={18} className={SWAP_OFF} />}
          on={<Image src="/icons/service-2-on.svg" alt="" width={18} height={18} className={SWAP_ON} />}
        />
        <ServiceLink label="플랫폼관리" href={hrefs.platform ?? "#"} boxed off={<Dots />} on={<Dots on />} />
      </div>
    </div>
  );
}

// Figma Utill. 페이지 제목 줄. 오른쪽은 기본으로 서비스 바로가기를 두고, children 으로 바꿀 수 있다.
export function PageBar({ title, children = <ServiceLinks /> }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex h-[59px] items-center border-b border-erp-bar-line bg-erp-bar px-[24px]">
      <h1 className="flex-1 text-[22px] font-semibold text-erp-ink">{title}</h1>
      {children}
    </div>
  );
}
