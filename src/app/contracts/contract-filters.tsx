"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import { Checkbox, FilterPanel, FilterSection, Pagination, SearchField, Select, useToast } from "@/components/common";
import { useScope, useStores } from "@/components/site/session-gate";
import { StorePicker, type PickedStore } from "@/components/site/store-picker";
import type { EnumValue } from "@/lib/enums";
import { scopeStores, toPickedStore } from "@/lib/store-scope";
import { PAGE_SIZES, fillScopeOf, pickedIdsOf, toSearch, unusableScopeOf, withPickedStores, withScopeCondition, type ContractListPage, type ListQuery, type PageSize } from "./contract-list";

// 필터와 페이지는 주소 쿼리에 둔다. 서버 페이지가 그 쿼리로 목록을 다시 받아 그린다.
function useGo() {
  const router = useRouter();
  const pathname = usePathname();
  return {
    push: (q: ListQuery) => router.push(`${pathname}${toSearch(q)}`),
    // 사용자가 고르지 않은 바꿈(헤더 범위로 채우기 · 쓸 수 없는 점포 빼기)은 기록을 쌓지 않는다 — 뒤로 가기가 같은 주소로 되돌아와 다시 바꾸지 않게
    replace: (q: ListQuery) => router.replace(`${pathname}${toSearch(q)}`, { scroll: false }),
  };
}

/**
 * 근로계약 목록 왼쪽 필터. 점포 칸은 공통 점포 고르기(StorePicker)이고 상단 점포 범위와 잇는다(WHALEERP-133, 점포 정보 관리 store-filter.tsx 와 같은
 * 규칙): 고른 점포가 있으면 그것을, 없으면 헤더가 실어 온 범위(scope)를 칩으로 그린다. 칩 이름은 로그인 정보의 점포에서 찾는다 — 직영 · 가맹
 * 범위의 칩은 폐점을 뺀 점포라, api 에 점포 유형으로 보내 나오는 폐점 점포의 계약은 칩에 없다(점포 정보 관리와 같은 받아들인 차이).
 * 점포 조건이 주소에 없으면(주소 직접 입력 · 즐겨찾기) 헤더 범위로 채운다. 고른 점포가 로그인 정보에 없으면(로그인 뒤 맡게 된 점포 · 다른
 * 탭에서 복사한 주소) 이름 대신 「점포 {id}」 칩으로 그린다 — 조건에서 빼면 api 가 볼 수 있는 점포까지 잃고, 칩이 없으면 보이지 않는 조건이
 * 된다. 지울지는 사용자가 정하고, 업무 범위 밖 id 는 api 가 조용히 뺀다. 주소의 범위를 이 탭에서 쓸 수 없으면(unusableScopeOf — 헤더 ·
 * 칩과 같은 판정) 「전체」로 바꾸고 알린다.
 * 상태 체크마다 상태별 개수를 붙인다(WHALEERP-133) — api 가 상태 필터와 상관없이 세고, 본사 역할에게 가려진 가맹 직원 계약도 센다(ATT-30).
 */
export function ContractFilters({
  query,
  statuses,
  statusCounts,
}: {
  query: ListQuery;
  statuses: EnumValue[];
  statusCounts?: ContractListPage["statusCounts"];
}) {
  const go = useGo();
  const toast = useToast();
  const [headerScope] = useScope();
  const stores = useStores();
  const [staffMemberName, setStaffMemberName] = useState(query.staffMemberName);
  // 상태를 하나도 고르지 않은 주소는 「전체」다. 화면에서는 모두 켜진 것으로 보인다.
  const checked = query.status.length ? query.status : statuses.map((s) => s.value);
  const fillScope = fillScopeOf(query, headerScope);
  const shown = fillScope ? withScopeCondition(query, fillScope) : query;
  const byId = new Map(stores.map((s) => [s.storeId, s]));
  const chipsOf = (q: ListQuery): PickedStore[] =>
    q.scope && (q.scope.type === "DIRECT" || q.scope.type === "FRANCHISE")
      ? scopeStores(q.scope, stores).map(toPickedStore)
      : pickedIdsOf(q).map((id) => {
          const store = byId.get(id);
          return store ? toPickedStore(store) : { storeId: id, name: `점포 ${id}`, storeCode: "" };
        });
  // 고르는 즉시 칩이 서도록 쥔다. 주소가 바뀌면 page.tsx 가 key 로 이 필터를 새로 그려 주소 값으로 돌아온다.
  const [chips, setChips] = useState(() => chipsOf(shown));

  // 거르는 조건이 바뀌면 첫 페이지로 간다.
  const apply = (next: Partial<ListQuery>) => go.push({ ...query, staffMemberName, ...next, page: 1 });

  // 점포 조건이 주소에 없으면 헤더 범위로 채워 다시 찾는다(store-filter.tsx 와 같이 주소의 조건 유무로만 돈다).
  // page.tsx 가 주소마다 key 로 이 필터를 새로 그리지만, key 에 기대지 않도록 의존값을 준다.
  const noCondition = !query.storeIds.length && !query.storesCleared && !query.scope;
  const fill = useEffectEvent(() => {
    if (fillScope) go.replace(shown);
  });
  useEffect(() => fill(), [noCondition]);
  // 주소의 범위를 이 탭에서 쓸 수 없으면 칩도 없이 걸러진 0건이 되므로 「전체」로 바꾸고 알린다(헤더도 따르지 않는다)
  const unusable = unusableScopeOf(query, stores);
  const dropUnusable = useEffectEvent(() => {
    if (!unusable) return;
    toast("상단 범위에 해당하는 점포가 이 탭에 없어 전체로 조회합니다.");
    go.replace(withPickedStores(query, []));
  });
  useEffect(() => dropUnusable(), [unusable]);

  const toggle = (value: string, on: boolean) => {
    const next = on ? [...checked, value] : checked.filter((v) => v !== value);
    // 마지막 하나는 끄지 않는다. 빈 목록은 「전체」로 읽혀 끈 것과 반대가 된다.
    if (next.length === 0) return;
    // 다 켜면 쿼리에서 빼 「전체」로 둔다. 새 상태가 생겨도 전체에 들어간다.
    apply({ status: next.length === statuses.length ? [] : statuses.map((s) => s.value).filter((v) => next.includes(v)) });
  };

  return (
    <FilterPanel
      onReset={() => {
        setStaffMemberName("");
        // 초기화는 헤더 범위로 돌아간다
        // 페이지당 건수는 보는 방식이라 그대로 둔다
        const reset = withScopeCondition(
          { page: 1, pageSize: query.pageSize, staffMemberName: "", status: [], storeIds: [], storesCleared: false, scope: null },
          headerScope,
        );
        setChips(chipsOf(reset));
        go.push(reset);
      }}
    >
      <FilterSection label="점포" tight>
        <StorePicker
          picked={chips}
          onChange={(next) => {
            setChips(next);
            // 직원 칸에 쳤지만 찾지 않은 글자는 싣지 않는다 — 찾은 적 없는 이름으로 좁혀지지 않게
            go.push(withPickedStores(query, next.map((s) => s.storeId)));
          }}
        />
      </FilterSection>
      <FilterSection label="직원" tight>
        <SearchField
          placeholder="이름"
          aria-label="이름"
          value={staffMemberName}
          onValueChange={setStaffMemberName}
          onSearch={(v) => apply({ staffMemberName: v.trim() })}
        />
      </FilterSection>
      <FilterSection label="상태" last>
        {statuses.map((s) => (
          <Checkbox
            key={s.value}
            label={statusCounts ? `${s.label} (${(statusCounts[s.value as keyof typeof statusCounts] ?? 0).toLocaleString("ko-KR")})` : s.label}
            checked={checked.includes(s.value)}
            onChange={(e) => toggle(s.value, e.target.checked)}
          />
        ))}
      </FilterSection>
    </FilterPanel>
  );
}

/** 페이지당 건수 — 직원 목록(StaffPageSize)과 같은 선택지. 바꾸면 첫 쪽으로 간다 */
export function ContractPageSize({ query }: { query: ListQuery }) {
  const go = useGo();
  return (
    <div className="w-[80px] shrink-0">
      <Select aria-label="페이지당 건수" value={String(query.pageSize)} onChange={(e) => go.push({ ...query, pageSize: Number(e.target.value) as PageSize, page: 1 })}>
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function ContractPagination({ query, totalPages }: { query: ListQuery; totalPages: number }) {
  const go = useGo();
  return <Pagination page={query.page} totalPages={totalPages} onPageChange={(page) => go.push({ ...query, page })} />;
}
