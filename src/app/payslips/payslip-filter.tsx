"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Checkbox, FilterPanel, FilterSection, SearchField } from "@/components/common";
import { useStores } from "@/components/site/session-gate";
import { labelOf, type EnumValue } from "@/lib/enums";
import { PAYSLIP_STATUSES, type PayslipListQuery } from "@/lib/payslips";
import { storeIdsByName } from "@/lib/staff-members";
import { usePayslipListNavigation } from "./payslip-list-controls";
import { MAX_KEYWORD_LENGTH, defaultPayslipListQuery, toPayslipListSearch, withFilter } from "./payslip-list-query";

const toggle = <T,>(list: readonly T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

// 급여명세서 목록 왼쪽 필터: 점포 · 직원명 · 명세서 상태. 급여 기간(달)은 목록 위 달 이동이 정한다 — 초기화해도 달은 그대로다.
// 점포 · 직원명 검색칸은 직원 목록 필터(staff-filter.tsx)와 같다 — Enter 나 돋보기로 반영하고, 점포명은 로그인 정보의 관리 점포에서
// 맞는 점포 id 를 찾아 함께 URL 에 둔다(api 는 storeIds 만 받는다). key 에 URL 값과 초기화 횟수를 넣어 초기화 · 링크 이동 때 칸도
// 따라 바뀌게 한다. 직원명으로 거르면 본사 역할에게 가린 줄(본사 제공 동의 없음)은 api 가 목록 · 상태 건수에서 뺀다.
export function PayslipFilter({ query, today, statusLabels }: { query: PayslipListQuery; today: string; statusLabels: EnumValue[] }) {
  const router = useRouter();
  const stores = useStores();
  const { current, navigate } = usePayslipListNavigation(query);
  const [resets, setResets] = useState(0);
  const go = (next: Partial<PayslipListQuery>) => navigate(withFilter(current, next));
  const reset = () => {
    setResets((n) => n + 1);
    navigate({ ...defaultPayslipListQuery(today), month: current.month });
  };
  // 점포명만 있고 점포 id 가 없는 주소(손으로 친 주소 등)는 들어오자마자 점포 목록에서 채운다 — 그대로 두면 api 를 부르지 않아 0건이다.
  useEffect(() => {
    if (query.store && query.storeIds === null)
      router.replace(`/payslips${toPayslipListSearch({ ...query, storeIds: storeIdsByName(stores, query.store) })}`, { scroll: false });
  }, [query, router, stores]);

  return (
    <FilterPanel onReset={reset}>
      <FilterSection label="점포" tight>
        <SearchField
          key={`store-${current.store}-${resets}`}
          defaultValue={current.store}
          placeholder="점포명"
          aria-label="점포"
          maxLength={MAX_KEYWORD_LENGTH}
          onSearch={(value) => go({ store: value.trim(), storeIds: value.trim() ? storeIdsByName(stores, value) : [] })}
        />
      </FilterSection>
      <FilterSection label="직원명" tight>
        <SearchField
          key={`staffName-${current.staffName}-${resets}`}
          defaultValue={current.staffName}
          placeholder="직원명"
          aria-label="직원명"
          // api 상한(50자)을 넘기면 400 으로 목록 전체가 오류 화면이 된다
          maxLength={MAX_KEYWORD_LENGTH}
          onSearch={(value) => go({ staffName: value.trim() })}
        />
      </FilterSection>
      <FilterSection label="명세서 상태" last>
        {PAYSLIP_STATUSES.map((status) => (
          <Checkbox
            key={status}
            label={labelOf(statusLabels, status)}
            checked={current.statuses.includes(status)}
            onChange={() => go({ statuses: toggle(current.statuses, status) })}
          />
        ))}
      </FilterSection>
    </FilterPanel>
  );
}
