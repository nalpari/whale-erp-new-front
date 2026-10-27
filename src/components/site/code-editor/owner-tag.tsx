import type { ReactNode } from "react";

// 공통코드 관리주체 꼬리표 — 플랫폼 · BP 공통코드 관리가 같이 쓴다. 글자 · 선 · 모양은 공통 Tag 그대로이고 바탕만 가른다:
// 플랫폼고정은 연한 파랑(erp-on-bg, 「등록」 배지 바탕), 플랫폼제공 · BP전용은 Tag 의 표 머리 회색(2026-10-27 사용자 지정).
export function OwnerTag({ code, children }: { code: string; children: ReactNode }) {
  const bg = code === "PLATFORM_FIXED" ? "bg-erp-on-bg" : "bg-erp-thead-bg";
  return (
    <span className={`inline-block rounded-[2px] border border-erp-thead-line px-[4px] py-px text-[14px] font-medium whitespace-nowrap text-erp-sub ${bg}`}>
      {children}
    </span>
  );
}
