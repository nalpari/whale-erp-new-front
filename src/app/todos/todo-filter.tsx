"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { Checkbox, DateField, FilterPanel, FilterSection, Select } from "@/components/common";
import { useStores } from "@/components/site/session-gate";
import type { EnumValue } from "@/lib/enums";
import { DEFAULT_TODO_LIST_QUERY, toTodoListSearch, withFilter, type TodoAssigneeType, type TodoListQuery, type TodoStatus } from "./todo-list-query";

const toggle = <T,>(list: readonly T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

// TO-DO 목록 왼쪽 필터 — 근무지 · 상태 · 담당(목업 TO-DO 탭) · 긴급 · 수행 예정 기간(계획 문서). 값은 URL 에만 둔다.
// 직원 목록 필터와 같이 낙관적 쿼리로 다음 URL 을 만든다 — 응답 전에 하나 더 눌러도 앞의 변경이 사라지지 않는다.
// 근무지는 로그인 정보의 관리 점포(useStores)에서 고른다 — 점포 목록 api 는 「점포 정보 관리」 권한이 있어야 열린다.
export function TodoFilter({ query, statusLabels, assigneeTypeLabels }: { query: TodoListQuery; statusLabels: EnumValue[]; assigneeTypeLabels: EnumValue[] }) {
  const router = useRouter();
  const stores = useStores();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const navigate = (next: TodoListQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.replace(`/todos${toTodoListSearch(next)}`, { scroll: false });
    });
  const go = (next: Partial<TodoListQuery>) => navigate(withFilter(current, next));

  return (
    <FilterPanel onReset={() => navigate(DEFAULT_TODO_LIST_QUERY)}>
      <FilterSection label="근무지" tight>
        <Select
          aria-label="근무지"
          value={current.storeId ?? ""}
          onChange={(e) => go({ storeId: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">전체</option>
          {stores.map((s) => (
            <option key={s.storeId} value={s.storeId}>
              {s.name}
            </option>
          ))}
        </Select>
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
