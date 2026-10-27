import { Fragment, type ReactNode } from "react";

/**
 * 제목 옆(공통코드 상세 코드 머리) 또는 이름 아랫줄(관리자 상세 머리)에 다는 값 줄 — 「라벨 값 | 라벨 값 | 띠지」. 라벨은 회색, 값은 굵게, 라벨이 없는 칸(상태 배지 · 관리주체 띠지)은 그대로 둔다.
 * 구분선은 상세 표 값 구분선(11px #d9d9d9)과 같다. 공통코드 상세 코드 머리(GroupHead)와 관리자 상세 머리가 같이 쓴다(2026-10-27 사용자 지정).
 * 글자 크기는 감싸는 쪽이 정한다 — 18px 제목 옆에서는 14px 보통 굵기 span 안에 둔다.
 */
export function HeadValues({ items }: { items: { label?: string; value: ReactNode }[] }) {
  // 제목과 같은 글자 기준선에 선다 — 가운데 맞춤이면 18px 제목 옆에서 위아래로 어긋나 보였다. 구분선만 가운데
  const bar = <span aria-hidden="true" className="h-[11px] w-px shrink-0 self-center bg-[#d9d9d9]" />;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-[10px] align-baseline">
      {items.map((item, i) => (
        <Fragment key={item.label ?? i}>
          {i > 0 && bar}
          {item.label ? (
            <span className="inline-flex items-baseline gap-[6px]">
              <span className="text-erp-label">{item.label}</span>
              <b className="font-semibold text-erp-ink">{item.value}</b>
            </span>
          ) : (
            item.value
          )}
        </Fragment>
      ))}
    </span>
  );
}
