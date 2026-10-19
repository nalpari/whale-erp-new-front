"use client";

import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { Checkbox, FilterPanel, FilterSection, SearchField, Select } from "@/components/common";
import { useStores } from "@/components/site/session-gate";
import { EMPLOYMENT_TYPES, JOIN_GROUPS, storeIdsByName, type EmploymentStatusFilter, type StaffListQuery } from "@/lib/staff-members";
import { DEFAULT_STAFF_LIST_QUERY, MAX_KEYWORD_LENGTH, toStaffListSearch, withFilter } from "./staff-list-query";
import { EMPLOYMENT_TYPE_LABELS, JOIN_GROUP_LABELS } from "./staff-row";

const toggle = <T,>(list: readonly T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

// 직원 목록 왼쪽 필터. 값은 URL 에만 둔다 — 바꾸면 URL 을 바꾸고 서버가 목록을 다시 그린다.
// 다음 URL 은 낙관적 쿼리에서 만든다. 받은 query 는 서버가 새 화면을 돌려줘야 바뀌므로, 그 전에 체크를 하나 더 누르면
// 앞의 변경이 사라진다. 체크도 누르는 즉시 바뀌어 보인다.
// 검색칸은 Enter 나 돋보기를 눌렀을 때 반영한다. key 에 URL 값과 초기화 횟수를 넣어 초기화하거나 URL 이 바뀔 때(링크 이동 등) 칸도 따라 바뀌게 한다
// (이미 기본값인 URL 에서 초기화하면 URL 이 그대로라 횟수가 없으면 친 글자가 남는다).
// 점포명은 로그인 정보의 관리 점포에서 맞는 점포 id 를 찾아 함께 URL 에 둔다 — api 는 storeIds 만 받고, 점포 목록 api 는
// 「점포 정보 관리」 메뉴 권한이 있어야 열린다(storeIdsByName).
export function StaffFilter({ query }: { query: StaffListQuery }) {
  const router = useRouter();
  const stores = useStores();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const [resets, setResets] = useState(0);
  const navigate = (next: StaffListQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.replace(`/staff-members${toStaffListSearch(next)}`, { scroll: false });
    });
  const go = (next: Partial<StaffListQuery>) => navigate(withFilter(current, next));
  // 점포명만 있고 점포 id 가 없는 주소(storeIds 를 싣기 전의 북마크 · 손으로 친 주소)는 들어오자마자 점포 목록에서 채운다.
  // 그대로 두면 api 를 부르지 않아 검색칸에 점포명이 있는데도 0건으로 보인다. 쪽은 그대로 둔다 — 같은 조건이다.
  useEffect(() => {
    if (query.store && query.storeIds === null)
      router.replace(`/staff-members${toStaffListSearch({ ...query, storeIds: storeIdsByName(stores, query.store) })}`, { scroll: false });
  }, [query, router, stores]);
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
          maxLength={MAX_KEYWORD_LENGTH}
          onSearch={(value) => go({ store: value.trim(), storeIds: value.trim() ? storeIdsByName(stores, value) : [] })}
        />
      </FilterSection>
      <FilterSection label="이름·휴대전화번호" tight>
        <SearchField
          key={`keyword-${current.keyword}-${resets}`}
          defaultValue={current.keyword}
          placeholder="이름 또는 번호"
          aria-label="이름·휴대전화번호"
          // api 상한(50자)을 넘기면 400 으로 목록 전체가 오류 화면이 된다
          maxLength={MAX_KEYWORD_LENGTH}
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
