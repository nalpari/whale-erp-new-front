"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Checkbox, FilterPanel, FilterSection, SearchField, useToast } from "@/components/common";
import { useScope, useStores } from "@/components/site/session-gate";
import { StorePicker, type PickedStore } from "@/components/site/store-picker";
import { labelOf, type EnumValue } from "@/lib/enums";
import { PAYSLIP_STATUSES, type PayslipListQuery } from "@/lib/payslips";
import { pickedStoreIdsOf } from "@/lib/staff-members";
import { isUnusableScope, scopeStores, toPickedStore } from "@/lib/store-scope";
import { fillScopeOf } from "../stores/stores-query";
import { usePayslipListNavigation } from "./payslip-list-controls";
import { MAX_KEYWORD_LENGTH, defaultPayslipListQuery, withFilter, withPickedStores, withScopeCondition } from "./payslip-list-query";

const toggle = <T,>(list: readonly T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

// 급여명세서 목록 왼쪽 필터: 점포 · 직원명 · 명세서 상태 · 분류(검토 대기만 — 검토 대기는 상태가 아니라 분류다, WHALEERP-234 · 2026-10-26). 급여 기간(달)은 목록 위 달 이동이 정한다 — 초기화해도 달은 그대로다.
// 점포 칸은 공통 점포 고르기(StorePicker)이고 상단 점포 범위와 잇는다 — 직원 목록 staff-filter.tsx 와 같은 규칙: 고른 점포가 있으면 그것을,
// 없으면 헤더가 실어 온 범위(scope)를 칩으로 그린다. 칩 이름은 로그인 정보의 점포(useStores)에서 찾는다 — 점포 목록 api 는 「점포 정보 관리」
// 메뉴 권한이 있어야 열린다. 직영 · 가맹 범위의 칩은 폐점을 뺀 점포이고, api 도 그 유형의 폐점 점포를 뺀다(storeTypes). 점포 조건이 주소에
// 없으면(주소 직접 입력 · 예전 점포명 주소) 헤더 범위로 채우고, 주소의 범위를 이 탭에서 쓸 수 없으면 「전체」로 바꾸고 알린다.
// 직원명 검색칸은 Enter 나 돋보기로 반영한다. key 에 URL 값과 초기화 횟수를 넣어 초기화 · 링크 이동 때 칸도 따라 바뀌게 한다. 직원명으로
// 거르면 본사 역할에게 가린 줄(본사 제공 동의 없음)은 api 가 목록 · 상태 건수에서 뺀다.
export function PayslipFilter({ query, today, statusLabels }: { query: PayslipListQuery; today: string; statusLabels: EnumValue[] }) {
  const stores = useStores();
  const [headerScope] = useScope();
  const toast = useToast();
  const { current, navigate } = usePayslipListNavigation(query);
  const [resets, setResets] = useState(0);
  const go = (next: Partial<PayslipListQuery>) => navigate(withFilter(current, next));

  // 칩 — 고른 점포는 그 순서대로, 없으면 범위(정해지지 않았으면 채울 헤더 범위)의 점포
  const shownScope = fillScopeOf(current, headerScope) ?? current.scope;
  const byId = new Map(stores.map((s) => [s.storeId, s]));
  const chips: PickedStore[] =
    !current.storeIds.length && (shownScope?.type === "DIRECT" || shownScope?.type === "FRANCHISE")
      ? scopeStores(shownScope, stores).map(toPickedStore)
      : pickedStoreIdsOf({ storeIds: current.storeIds, scope: shownScope }).map((id) => {
          const store = byId.get(id);
          return store ? toPickedStore(store) : { storeId: id, name: `점포 ${id}`, storeCode: "" };
        });
  // 점포 조건이 주소에 없으면 그때의 헤더 범위로 채운다 — 다시 채울지는 주소의 조건 유무로만 정한다(직원 목록과 같다)
  const noCondition = !current.storeIds.length && !current.storesCleared && !current.scope;
  const fill = useEffectEvent(() => {
    const scope = fillScopeOf(current, headerScope);
    if (scope) navigate(withScopeCondition(current, scope));
  });
  useEffect(() => fill(), [noCondition]);
  const unusable = !!current.scope && isUnusableScope(current.scope, stores);
  const dropUnusable = useEffectEvent(() => {
    if (!unusable) return;
    toast("상단 범위에 해당하는 점포가 이 탭에 없어 전체로 조회합니다.");
    navigate(withPickedStores(current, []));
  });
  useEffect(() => dropUnusable(), [unusable]);
  // 초기화는 헤더 범위로 돌아간다(달은 그대로)
  const reset = () => {
    setResets((n) => n + 1);
    navigate(withScopeCondition({ ...defaultPayslipListQuery(today), month: current.month }, headerScope));
  };

  return (
    <FilterPanel onReset={reset}>
      <FilterSection label="점포" tight>
        <StorePicker picked={chips} onChange={(next) => navigate(withPickedStores(current, next.map((s) => s.storeId)))} />
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
      <FilterSection label="명세서 상태">
        {PAYSLIP_STATUSES.map((status) => (
          <Checkbox
            key={status}
            label={labelOf(statusLabels, status)}
            checked={current.statuses.includes(status)}
            onChange={() => go({ statuses: toggle(current.statuses, status) })}
          />
        ))}
      </FilterSection>
      <FilterSection label="분류" last>
        <Checkbox label="검토 대기만" checked={current.reviewPending} onChange={() => go({ reviewPending: !current.reviewPending })} />
      </FilterSection>
    </FilterPanel>
  );
}
