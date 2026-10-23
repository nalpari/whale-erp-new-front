"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useOptimistic, useTransition } from "react";
import { Checkbox, FilterPanel, FilterSection, SearchField, Select, useToast } from "@/components/common";
import { useScope, useStores } from "@/components/site/session-gate";
import { StorePicker } from "@/components/site/store-picker";
import type { EnumValue } from "@/lib/enums";
import { isUnusableScope, scopeStores, toPickedStore } from "@/lib/store-scope";
import { fillScopeOf } from "../stores/stores-query";
import {
  DAY_STATUSES,
  defaultQuery,
  EMPLOYMENT_LABELS,
  EMPLOYMENT_TYPES,
  EMPLOYMENTS,
  ENTRY_KIND_LABELS,
  ENTRY_KINDS,
  REVIEW_REASONS,
  toAttendanceSearch,
  type AttendanceQuery,
  type Employment,
} from "./attendance-query";

const toggle = <T,>(list: readonly T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

// 출·퇴근 현황 왼쪽 필터 7개(데모 staff-sections.mjs attendFilter, STAFF-31 2026-10-08 재영) — 점포 · 직원 · 고용형태 · 출퇴근 상태 ·
// 확인 필요 사유 · 기록 구분 · 재직 상태. 값은 주소에만 두고 화면을 떠나면 처음 값으로 돌아간다(유지 안 함). 근태 요약에는 점포 ·
// 고용형태 · 재직 상태만 걸린다(page.tsx). 점포는 TO-DO 목록 필터와 같은 점포 고르기(StorePicker) — 고른 점포가 없으면 헤더 범위를 칩으로
// 그리고, 점포 조건이 주소에 없으면 헤더 범위로 채운다. 데모의 「점포명」 검색칸 대신 앱의 점포 고르기를 쓴다.
export function AttendanceFilter({
  query,
  today,
  statusLabels,
  reasonLabels,
  employmentTypeLabels,
}: {
  query: AttendanceQuery;
  today: string;
  statusLabels: EnumValue[];
  reasonLabels: EnumValue[];
  employmentTypeLabels: EnumValue[];
}) {
  const router = useRouter();
  const stores = useStores();
  const [headerScope] = useScope();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const navigate = (next: AttendanceQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.replace(`/attendance-records${toAttendanceSearch(next, today)}`, { scroll: false });
    });
  const go = (next: Partial<AttendanceQuery>) => navigate({ ...current, ...next });
  const withPicked = (ids: number[]) => go({ storeIds: ids, storesCleared: !ids.length, scope: null });

  // 칩 — 고른 점포는 그 순서대로, 없으면 범위(정해지지 않았으면 채울 헤더 범위)의 점포
  const found = current.storeIds.map((id) => stores.find((s) => s.storeId === id)).filter((s) => s !== undefined);
  const shownScope = fillScopeOf(current, headerScope) ?? current.scope;
  const chips = (current.storeIds.length ? found : shownScope ? scopeStores(shownScope, stores) : []).map(toPickedStore);
  const noCondition = !current.storeIds.length && !current.storesCleared && !current.scope;
  const fill = useEffectEvent(() => {
    const s = fillScopeOf(current, headerScope);
    if (s) go({ storeIds: [], storesCleared: false, scope: s });
  });
  useEffect(() => fill(), [noCondition]);
  const missingCount = current.storeIds.length - found.length;
  const unusable = !!current.scope && isUnusableScope(current.scope, stores);
  const dropUnknown = useEffectEvent(() => {
    if (missingCount > 0) {
      toast(`고른 점포 ${missingCount}곳을 찾을 수 없어 조건에서 뺐습니다.`);
      withPicked(found.map((s) => s.storeId));
    } else if (unusable) {
      toast("상단 범위에 해당하는 점포가 이 탭에 없어 전체로 조회합니다.");
      withPicked([]);
    }
  });
  useEffect(() => dropUnknown(), [missingCount, unusable]);

  const labelOf = (labels: EnumValue[], value: string) => labels.find((l) => l.value === value)?.label ?? value;

  return (
    <FilterPanel
      onReset={() => {
        const d = defaultQuery(today);
        navigate({ ...d, scope: headerScope, date: current.date, week: current.week, fixFrom: current.fixFrom, fixTo: current.fixTo });
      }}
    >
      <FilterSection label="점포" tight>
        <StorePicker picked={chips} onChange={(next) => withPicked(next.map((s) => s.storeId))} />
      </FilterSection>
      <FilterSection label="직원" tight>
        <SearchField
          key={current.staff}
          defaultValue={current.staff}
          placeholder="이름 또는 번호"
          aria-label="직원"
          maxLength={50}
          onSearch={(v: string) => go({ staff: v.trim() })}
        />
      </FilterSection>
      <FilterSection label="고용형태">
        {EMPLOYMENT_TYPES.map((t) => (
          <Checkbox
            key={t}
            label={labelOf(employmentTypeLabels, t)}
            checked={current.employmentTypes.includes(t)}
            onChange={() => go({ employmentTypes: toggle(current.employmentTypes, t) })}
          />
        ))}
      </FilterSection>
      <FilterSection label="출퇴근 상태">
        {DAY_STATUSES.map((s) => (
          <Checkbox key={s} label={labelOf(statusLabels, s)} checked={current.statuses.includes(s)} onChange={() => go({ statuses: toggle(current.statuses, s) })} />
        ))}
      </FilterSection>
      <FilterSection label="확인 필요 사유">
        {REVIEW_REASONS.map((r) => (
          <Checkbox key={r} label={labelOf(reasonLabels, r)} checked={current.reasons.includes(r)} onChange={() => go({ reasons: toggle(current.reasons, r) })} />
        ))}
      </FilterSection>
      <FilterSection label="기록 구분">
        {ENTRY_KINDS.map((e) => (
          <Checkbox key={e} label={ENTRY_KIND_LABELS[e]} checked={current.entries.includes(e)} onChange={() => go({ entries: toggle(current.entries, e) })} />
        ))}
      </FilterSection>
      <FilterSection label="재직 상태" tight last>
        <Select aria-label="재직 상태" value={current.employment} onChange={(e) => go({ employment: e.target.value as Employment })}>
          {EMPLOYMENTS.map((e) => (
            <option key={e} value={e}>
              {EMPLOYMENT_LABELS[e]}
            </option>
          ))}
        </Select>
      </FilterSection>
    </FilterPanel>
  );
}
