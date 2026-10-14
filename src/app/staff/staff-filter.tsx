"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { Checkbox, FilterPanel, FilterSection, SearchField, Select } from "@/components/common";
import { EMPLOYMENT_TYPES, JOIN_GROUPS, type EmploymentStatusFilter, type StaffListQuery } from "@/lib/staff-members";
import { DEFAULT_STAFF_LIST_QUERY, toStaffListSearch, withFilter } from "./staff-list-query";
import { EMPLOYMENT_TYPE_LABELS, JOIN_GROUP_LABELS } from "./staff-row";

const toggle = <T,>(list: readonly T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

// 직원 목록 왼쪽 필터. 값은 URL 에만 둔다 — 바꾸면 URL 을 바꾸고 서버가 목록을 다시 그린다.
// 다음 URL 은 낙관적 쿼리에서 만든다. 받은 query 는 서버가 새 화면을 돌려줘야 바뀌므로, 그 전에 체크를 하나 더 누르면
// 앞의 변경이 사라진다. 체크도 누르는 즉시 바뀌어 보인다.
// 검색칸은 Enter 나 돋보기를 눌렀을 때 반영한다. key 에 URL 값과 초기화 횟수를 넣어 초기화하거나 URL 이 바뀔 때(링크 이동 등) 칸도 따라 바뀌게 한다
// (이미 기본값인 URL 에서 초기화하면 URL 이 그대로라 횟수가 없으면 친 글자가 남는다).
export function StaffFilter({ query }: { query: StaffListQuery }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const [resets, setResets] = useState(0);
  const navigate = (next: StaffListQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.replace(`/staff${toStaffListSearch(next)}`, { scroll: false });
    });
  const go = (next: Partial<StaffListQuery>) => navigate(withFilter(current, next));
  const reset = () => {
    setResets((n) => n + 1);
    navigate(DEFAULT_STAFF_LIST_QUERY);
  };

  return (
    <FilterPanel onReset={reset}>
      <FilterSection label="점포" tight>
        <SearchField
          key={`store-${current.store}-${resets}`}
          defaultValue={current.store}
          placeholder="점포명"
          aria-label="점포"
          onSearch={(value) => go({ store: value.trim() })}
        />
      </FilterSection>
      <FilterSection label="이름·휴대전화번호" tight>
        <SearchField
          key={`keyword-${current.keyword}-${resets}`}
          defaultValue={current.keyword}
          placeholder="이름 또는 번호"
          aria-label="이름·휴대전화번호"
          onSearch={(value) => go({ keyword: value.trim() })}
        />
      </FilterSection>
      <FilterSection label="고용형태">
        {EMPLOYMENT_TYPES.map((type) => (
          <Checkbox
            key={type}
            label={EMPLOYMENT_TYPE_LABELS[type]}
            checked={current.employmentTypes.includes(type)}
            onChange={() => go({ employmentTypes: toggle(current.employmentTypes, type) })}
          />
        ))}
      </FilterSection>
      <FilterSection label="가입·인증">
        {JOIN_GROUPS.map((group) => (
          <Checkbox
            key={group}
            label={JOIN_GROUP_LABELS[group]}
            checked={current.joinGroups.includes(group)}
            onChange={() => go({ joinGroups: toggle(current.joinGroups, group) })}
          />
        ))}
      </FilterSection>
      <FilterSection label="재직 상태" tight last>
        <Select
          aria-label="재직 상태"
          value={current.employmentStatus}
          onChange={(e) => go({ employmentStatus: e.target.value as EmploymentStatusFilter })}
        >
          <option value="EMPLOYED">재직</option>
          <option value="RETIRED">퇴직</option>
          <option value="ALL">전체</option>
        </Select>
      </FilterSection>
    </FilterPanel>
  );
}
