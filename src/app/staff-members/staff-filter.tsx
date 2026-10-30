"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useOptimistic, useState, useTransition } from "react";
import { Checkbox, FilterPanel, FilterSection, SearchField, Select, useToast } from "@/components/common";
import { useScope, useStores } from "@/components/site/session-gate";
import { StorePicker, type PickedStore } from "@/components/site/store-picker";
import { EMPLOYMENT_TYPES, JOIN_GROUPS, pickedStoreIdsOf, type EmploymentStatusFilter, type StaffListQuery } from "@/lib/staff-members";
import { isUnusableScope, scopeStores, toPickedStore } from "@/lib/store-scope";
import { fillScopeOf } from "../stores/stores-query";
import { DEFAULT_STAFF_LIST_QUERY, MAX_KEYWORD_LENGTH, toStaffListSearch, withFilter, withPickedStores, withScopeCondition } from "./staff-list-query";
import { EMPLOYMENT_TYPE_LABELS, JOIN_GROUP_LABELS } from "./staff-row";

const toggle = <T,>(list: readonly T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

// 직원 목록 왼쪽 필터. 값은 URL 에만 둔다 — 바꾸면 URL 을 바꾸고 서버가 목록을 다시 그린다.
// 다음 URL 은 낙관적 쿼리에서 만든다. 받은 query 는 서버가 새 화면을 돌려줘야 바뀌므로, 그 전에 체크를 하나 더 누르면
// 앞의 변경이 사라진다. 체크도 누르는 즉시 바뀌어 보인다.
// 검색칸은 Enter 나 돋보기를 눌렀을 때 반영한다. key 에 URL 값과 초기화 횟수를 넣어 초기화하거나 URL 이 바뀔 때(링크 이동 등) 칸도 따라 바뀌게 한다
// (이미 기본값인 URL 에서 초기화하면 URL 이 그대로라 횟수가 없으면 친 글자가 남는다).
// 점포 칸은 공통 점포 고르기(StorePicker)이고 상단 점포 범위와 잇는다 — 근로계약 목록 contract-filters.tsx 와 같은 규칙: 고른 점포가 있으면
// 그것을, 없으면 헤더가 실어 온 범위(scope)를 칩으로 그린다. 칩 이름은 로그인 정보의 점포(useStores)에서 찾는다 — 점포 목록 api 는
// 「점포 정보 관리」 메뉴 권한이 있어야 열린다. 직영 · 가맹 범위의 칩은 폐점을 뺀 점포이고, api 도 그 유형의 폐점 점포를 뺀다(storeTypes).
// 점포 조건이 주소에 없으면(주소 직접 입력 · 즐겨찾기 · 예전 점포명 주소) 헤더 범위로 채운다. 고른 점포가 로그인 정보에 없으면(이 탭이
// 아직 맞추지 못한 점포 · 다른 탭에서 복사한 주소) 「점포 {id}」 칩으로 그린다 — 조건에서 빼면 api 가 볼 수 있는 점포까지 잃고, 칩이 없으면 보이지
// 않는 조건이 된다. 업무 범위 밖 id 는 api 가 조용히 뺀다. 주소의 범위를 이 탭에서 쓸 수 없으면(isUnusableScope) 「전체」로 바꾸고 알린다.
export function StaffFilter({ query }: { query: StaffListQuery }) {
  const router = useRouter();
  const stores = useStores();
  const [headerScope] = useScope();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const [resets, setResets] = useState(0);
  const navigate = (next: StaffListQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.replace(`/staff-members${toStaffListSearch(next)}`, { scroll: false });
    });
  const go = (next: Partial<StaffListQuery>) => navigate(withFilter(current, next));

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
  // 점포 조건이 주소에 없으면 그때의 헤더 범위로 채운다 — 다시 채울지는 주소의 조건 유무로만 정한다(store-filter.tsx 와 같은 까닭)
  const noCondition = !current.storeIds.length && !current.storesCleared && !current.scope;
  const fill = useEffectEvent(() => {
    const scope = fillScopeOf(current, headerScope);
    if (scope) navigate(withScopeCondition(current, scope));
  });
  useEffect(() => fill(), [noCondition]);
  // 주소의 범위를 이 탭에서 쓸 수 없으면 칩도 없이 걸러진 0건이 되므로 「전체」로 바꾸고 알린다(헤더도 따르지 않는다)
  const unusable = !!current.scope && isUnusableScope(current.scope, stores);
  const dropUnusable = useEffectEvent(() => {
    if (!unusable) return;
    toast("상단 범위에 해당하는 점포가 이 탭에 없어 전체로 조회합니다.");
    navigate(withPickedStores(current, []));
  });
  useEffect(() => dropUnusable(), [unusable]);
  // 초기화는 헤더 범위로 돌아간다
  const reset = () => {
    setResets((n) => n + 1);
    navigate(withScopeCondition(DEFAULT_STAFF_LIST_QUERY, headerScope));
  };

  return (
    <FilterPanel onReset={reset}>
      <FilterSection label="점포" tight>
        <StorePicker picked={chips} onChange={(next) => navigate(withPickedStores(current, next.map((s) => s.storeId)))} />
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
