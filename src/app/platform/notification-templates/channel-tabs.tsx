import Link from "next/link";
import type { EnumValue } from "@/lib/enums";

// 채널 탭. 공통 컴포넌트에 탭이 없어 데모 extra.mjs 의 tabs 모양을 이 화면 안에 둔다(공통 컴포넌트는 고치지 않는다).
// 탭마다 주소(?channel=)가 달라 링크로 그린다 — 고른 탭은 aria-current 로 알린다.
const ON = "border-erp-brand font-semibold text-erp-ink";
const OFF = "border-transparent font-medium text-erp-label hover:text-erp-ink";

export function ChannelTabs({ channels, selected }: { channels: EnumValue[]; selected: string }) {
  return (
    <nav aria-label="발송 채널" className="flex shrink-0 border-b border-erp-bar-line">
      {channels.map((c) => (
        <Link
          key={c.value}
          href={`/platform/notification-templates?channel=${c.value}`}
          aria-current={c.value === selected ? "page" : undefined}
          className={`-mb-px flex h-[42px] items-center border-b-2 px-[18px] text-[15px] transition-colors duration-150 ease-out ${c.value === selected ? ON : OFF}`}
        >
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
