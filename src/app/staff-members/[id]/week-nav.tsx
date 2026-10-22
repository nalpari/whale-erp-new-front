import Image from "next/image";
import Link from "next/link";
import { shiftDate, weekHref, weekRangeText } from "./summary-view";

// 급여명세서 목록의 달 넘김(payslip-list-controls.tsx)과 같은 모양이다.
const ICON_LINK =
  "grid size-[34px] shrink-0 place-items-center rounded-[2px] border border-erp-button-line bg-white transition-[border-color] duration-150 ease-out hover:border-erp-brand";

/**
 * 근무스케줄 영역의 주 넘김(데모 weekNav). 주소의 weekStart 를 한 주씩 옮긴다 — 기록을 쌓지 않고(replace) 스크롤도 그대로 둔다.
 * 데모의 「가운데 주 이름을 눌러 달력에서 고르기」는 아직 없다(WHALEERP-185 에서 근무스케줄 표와 함께 본다).
 */
export function WeekNav({ monday, search }: { monday: string; search: Record<string, string | string[] | undefined> }) {
  return (
    <span className="flex items-center gap-[6px]">
      <Link href={weekHref(search, shiftDate(monday, -7))} replace scroll={false} aria-label="이전 주" className={ICON_LINK}>
        <Image src="/icons/prev.svg" alt="" width={16} height={16} />
      </Link>
      <span className="flex h-[34px] min-w-[190px] items-center justify-center rounded-[2px] border border-erp-button-line bg-white px-[12px] text-[14px] font-semibold text-erp-ink">
        {weekRangeText(monday)}
      </span>
      <Link href={weekHref(search, shiftDate(monday, 7))} replace scroll={false} aria-label="다음 주" className={ICON_LINK}>
        <Image src="/icons/next.svg" alt="" width={16} height={16} />
      </Link>
    </span>
  );
}
