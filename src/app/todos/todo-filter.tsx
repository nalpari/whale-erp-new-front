"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useOptimistic, useTransition } from "react";
import { Checkbox, DateField, FilterPanel, FilterSection, Select, useToast } from "@/components/common";
import { useScope, useStores } from "@/components/site/session-gate";
import { StorePicker } from "@/components/site/store-picker";
import type { EnumValue } from "@/lib/enums";
import { isUnusableScope, scopeStores, toPickedStore } from "@/lib/store-scope";
import { fillScopeOf } from "../stores/stores-query";
import {
  DEFAULT_TODO_LIST_QUERY,
  toTodoListSearch,
  withFilter,
  withPickedStores,
  withScopeCondition,
  type TodoAssigneeType,
  type TodoListQuery,
  type TodoStatus,
} from "./todo-list-query";

const toggle = <T,>(list: readonly T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

// TO-DO 목록 왼쪽 필터 — 근무지 · 상태 · 담당(목업 TO-DO 탭) · 긴급 · 수행 예정 기간(계획 문서). 값은 URL 에만 둔다.
// 직원 목록 필터와 같이 낙관적 쿼리로 다음 URL 을 만든다 — 응답 전에 하나 더 눌러도 앞의 변경이 사라지지 않는다.
// 근무지는 점포 목록과 같은 점포 고르기(StorePicker)로 고르고 주소의 storeIds 에 둔다. 고른 점포가 없으면 헤더가 실어 온 범위(scope)를 칩으로
// 그리고, 점포 조건이 주소에 없으면(주소 직접 입력 · 즐겨찾기 · 그런 주소로 뒤로 가기) 헤더 범위로 채운다(store-filter.tsx 와 같다).
// 칩 이름은 로그인 정보의 관리 점포(useStores)에서 찾는다 — 점포 목록 api 는 「점포 정보 관리」 권한이 있어야 열려 서버가 찾지 않는다.
// 그래서 로그인 정보에 없는 점포(다른 BP 탭에서 복사한 주소 · 지운 점포)는 조건에서 빼고 알린다. 쓸 수 없는 범위는 「전체」로 바꾸고 알린다.
export function TodoFilter({ query, statusLabels, assigneeTypeLabels }: { query: TodoListQuery; statusLabels: EnumValue[]; assigneeTypeLabels: EnumValue[] }) {
  const router = useRouter();
  const stores = useStores();
  const [headerScope] = useScope();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const navigate = (next: TodoListQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.replace(`/todos${toTodoListSearch(next)}`, { scroll: false });
    });
  const go = (next: Partial<TodoListQuery>) => navigate(withFilter(current, next));

  // 칩 — 고른 점포는 그 순서대로, 없으면 범위(정해지지 않았으면 채울 헤더 범위)의 점포
  const found = current.storeIds.map((id) => stores.find((s) => s.storeId === id)).filter((s) => s !== undefined);
  const shownScope = fillScopeOf(current, headerScope) ?? current.scope;
  const chips = (current.storeIds.length ? found : shownScope ? scopeStores(shownScope, stores) : []).map(toPickedStore);
  // 점포 조건이 주소에 없으면 그때의 헤더 범위로 채운다 — 다시 채울지는 주소로만 정한다(store-filter.tsx 와 같은 까닭)
  const noCondition = !current.storeIds.length && !current.storesCleared && !current.scope;
  const fill = useEffectEvent(() => {
    const s = fillScopeOf(current, headerScope);
    if (s) navigate(withScopeCondition(current, s));
  });
  useEffect(() => fill(), [noCondition]);
  // 로그인 정보에 없는 점포를 고른 주소면 빼고 알린다. 범위를 이 탭에서 쓸 수 없으면(고를 점포가 없다) 「전체」로 바꾸고 알린다
  const missingCount = current.storeIds.length - found.length;
  const unusable = !!current.scope && isUnusableScope(current.scope, stores);
  const dropUnknown = useEffectEvent(() => {
    if (missingCount > 0) {
      toast(`고른 점포 ${missingCount}곳을 찾을 수 없어 조건에서 뺐습니다.`);
      navigate(withPickedStores(current, found.map((s) => s.storeId)));
    } else if (unusable) {
      toast("상단 범위에 해당하는 점포가 이 탭에 없어 전체로 조회합니다.");
      navigate(withPickedStores(current, []));
    }
  });
  useEffect(() => dropUnknown(), [missingCount, unusable]);

  return (
    <FilterPanel onReset={() => navigate({ ...DEFAULT_TODO_LIST_QUERY, scope: headerScope })}>
      <FilterSection label="근무지" tight>
        <StorePicker picked={chips} onChange={(next) => navigate(withPickedStores(current, next.map((s) => s.storeId)))} />
      </FilterSection>
      <FilterSection label="상태">
        {statusLabels.map((s) => (
          <Checkbox
            key={s.value}
            label={s.label}
            checked={current.statuses.includes(s.value as TodoStatus)}
            onChange={() => go({ statuses: toggle(current.statuses, s.value as TodoStatus) })}
          />
        ))}
      </FilterSection>
      <FilterSection label="담당" tight>
        <Select aria-label="담당" value={current.assigneeType} onChange={(e) => go({ assigneeType: e.target.value as TodoAssigneeType | "" })}>
          <option value="">전체</option>
          {assigneeTypeLabels.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </FilterSection>
      <FilterSection label="긴급">
        <Checkbox label="긴급만" checked={current.urgentOnly} onChange={(e) => go({ urgentOnly: e.target.checked })} />
      </FilterSection>
      <FilterSection label="수행 예정" tight last>
        <div className="flex flex-col gap-[6px]">
          <DateField aria-label="수행 예정 시작" value={current.dueDateFrom} onChange={(v) => go({ dueDateFrom: v })} />
          <DateField aria-label="수행 예정 끝" value={current.dueDateTo} onChange={(v) => go({ dueDateTo: v })} />
        </div>
      </FilterSection>
    </FilterPanel>
  );
}
