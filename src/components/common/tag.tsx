import type { ReactNode } from "react";

// 구분을 붙이는 꼬리표(관리 주체 · 적용 범위 등). 기본은 색이 없는 표 머리 바탕 · 선만 쓴다 —
// 상태를 색으로 말하는 Badge(운영 / 미운영)와 다르다.
// sky = 연한 파랑 바탕(erp-on-bg)에 파랑 글자(erp-on) — 같은 자리에 꼬리표 두 가지가 섞여 회색끼리 갈리지 않을 때 한쪽에 쓴다
// (공통코드 관리주체의 플랫폼고정, 2026-10-27 사용자 지정). 글자는 늘 함께 둔다(색만으로 말하지 않는다).
const TONE = {
  default: "border-erp-thead-line bg-erp-thead-bg text-erp-sub",
  sky: "border-erp-on-bg bg-erp-on-bg text-erp-on",
};

export function Tag({ children, tone = "default" }: { children: ReactNode; tone?: keyof typeof TONE }) {
  return (
    <span className={`inline-block rounded-[2px] border px-[4px] py-px text-[14px] font-medium whitespace-nowrap ${TONE[tone]}`}>
      {children}
    </span>
  );
}
