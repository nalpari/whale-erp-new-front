"use client";

import { useRouter } from "next/navigation";
import { Checkbox, FilterPanel, FilterSection, SearchField, Select } from "@/components/common";
import { EMPLOYMENT_TYPES, JOIN_GROUPS, type EmploymentStatusFilter, type StaffListQuery } from "@/lib/staff-members";
import { toStaffListSearch, withFilter } from "./staff-list-query";
import { EMPLOYMENT_TYPE_LABELS, JOIN_GROUP_LABELS } from "./staff-row";

const toggle = <T,>(list: readonly T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

// 직원 목록 왼쪽 필터. 값은 URL 에만 둔다 — 바꾸면 URL 을 바꾸고 서버가 목록을 다시 그린다.
// 검색칸은 Enter 나 돋보기를 눌렀을 때 반영한다. key 에 URL 값을 넣어 초기화 · 뒤로 가기 때 칸도 따라 바뀌게 한다.
export function StaffFilter({ query }: { query: StaffListQuery }) {
  const router = useRouter();
  const go = (next: Partial<StaffListQuery>) =>
    router.replace(`/staff-members${toStaffListSearch(withFilter(query, next))}`, { scroll: false });

  return (
    <FilterPanel onReset={() => router.replace("/staff-members", { scroll: false })}>
      <FilterSection label="점포" tight>
        <SearchField
          key={`store-${query.store}`}
          defaultValue={query.store}
          placeholder="점포명"
          aria-label="점포"
          onSearch={(value) => go({ store: value.trim() })}
        />
      </FilterSection>
      <FilterSection label="이름·휴대전화번호" tight>
        <SearchField
          key={`keyword-${query.keyword}`}
          defaultValue={query.keyword}
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
            checked={query.employmentTypes.includes(type)}
            onChange={() => go({ employmentTypes: toggle(query.employmentTypes, type) })}
          />
        ))}
      </FilterSection>
      <FilterSection label="가입·인증">
        {JOIN_GROUPS.map((group) => (
          <Checkbox
            key={group}
            label={JOIN_GROUP_LABELS[group]}
            checked={query.joinGroups.includes(group)}
            onChange={() => go({ joinGroups: toggle(query.joinGroups, group) })}
          />
        ))}
      </FilterSection>
      <FilterSection label="재직 상태" tight last>
        <Select
          aria-label="재직 상태"
          value={query.employmentStatus}
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
