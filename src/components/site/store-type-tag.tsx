"use client";

import { useStores } from "./session-gate";

// 점포 유형 꼬리표 — 본사 · 직영 · 가맹. 글자 · 테두리는 같고 바탕만 가른다(본사 흰색 · 직영 연한 파랑 · 가맹 회색, 공통코드 관리주체 꼬리표와 같은 방식).
// 홈 「운영 점포별 현황」에서 처음 쓰고(2026-11-18 · 본사 2026-11-19 사용자 지정) 근로계약 상세 「소속 근무지」가 같이 쓴다(2026-11-19 사용자 지정).
export function StoreTypeTag({ isHq, storeTypeCode }: { isHq?: boolean; storeTypeCode: string }) {
  const [label, bg] = isHq ? ["본사", "bg-white"] : storeTypeCode === "DIRECT" ? ["직영", "bg-erp-on-bg"] : ["가맹", "bg-erp-thead-bg"];
  return <span className={`shrink-0 rounded-[2px] border border-erp-thead-line px-[4px] text-[12px] font-medium text-erp-thead-text ${bg}`}>{label}</span>;
}

/**
 * 점포 이름 앞에 유형 꼬리표 — 응답에 유형이 없는 화면(근로계약 상세)이 화면이 받아 둔 점포 목록(로그인 정보의 stores)에서 찾아 붙인다.
 * 목록에 없는 점포(업무 범위 밖 · 그새 바뀜)는 api 가 본사라고 알려 줄 때만 [본사], 아니면 이름만 보인다.
 * 「[본사] 상호」 글자(storeOptionLabel)는 쓰지 않는다 — 꼬리표에 본사가 있어 두 번 보인다(2026-11-19 사용자 지정, WHALEERP-726 · 750 의 목적은 꼬리표가 지킨다).
 */
export function StoreNameWithType({ storeId, name, isHq }: { storeId: number; name: string; isHq?: boolean | null }) {
  const store = useStores().find((s) => s.storeId === storeId);
  // 목록에 없는 점포라도 api 가 본사라고 알려 주면(storeIsHq · store.isHq) [본사] 꼬리표는 붙인다 — 본사 근무지가 본사로 보여야 한다(WHALEERP-726 · 750)
  const hq = store?.isHq ?? isHq ?? false;
  return (
    <span className="flex min-w-0 items-center gap-[6px]">
      {store ? <StoreTypeTag isHq={hq} storeTypeCode={store.storeTypeCode} /> : hq && <StoreTypeTag isHq storeTypeCode="" />}
      <span className="truncate">{name}</span>
    </span>
  );
}
