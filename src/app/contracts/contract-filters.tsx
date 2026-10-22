"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import { Checkbox, FilterPanel, FilterSection, Pagination, SearchField, useToast } from "@/components/common";
import { useScope, useStores } from "@/components/site/session-gate";
import { StorePicker, type PickedStore } from "@/components/site/store-picker";
import type { EnumValue } from "@/lib/enums";
import { scopeStores, toPickedStore } from "@/lib/store-scope";
import { fillScopeOf, pickedIdsOf, toSearch, withPickedStores, withScopeCondition, type ListQuery } from "./contract-list";

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
 * 된다. 지울지는 사용자가 정하고, 업무 범위 밖 id 는 api 가 조용히 뺀다. 직영 · 가맹 범위에 해당하는 점포(폐점 포함)가 이 탭에 하나도
 * 없으면 「전체」로 바꾸고 알린다(점포 정보 관리의 isUnusableScope 와 같은 뜻 — 다만 api 가 폐점까지 거르므로 폐점도 센다).
 */
export function ContractFilters({ query, statuses }: { query: ListQuery; statuses: EnumValue[] }) {
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

  // 점포 조건이 주소에 없으면 헤더 범위로 채워 다시 찾는다. 직영 · 가맹 범위의 점포가 이 탭에 없으면 「전체」로 바꾼다.
  const scopeType = query.scope?.type === "DIRECT" || query.scope?.type === "FRANCHISE" ? query.scope.type : null;
  const unusable = !!scopeType && !stores.some((s) => s.storeTypeCode === scopeType);
  const settle = useEffectEvent(() => {
    if (fillScope) return go.replace(shown);
    if (unusable) {
      toast("상단 범위에 해당하는 점포가 이 탭에 없어 전체로 조회합니다.");
      go.replace(withPickedStores(query, []));
    }
  });
  useEffect(() => settle(), []);

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
        const reset = withScopeCondition({ page: 1, staffMemberName: "", status: [], storeIds: [], storesCleared: false, scope: null }, headerScope);
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
            label={s.label}
            checked={checked.includes(s.value)}
            onChange={(e) => toggle(s.value, e.target.checked)}
          />
        ))}
      </FilterSection>
    </FilterPanel>
  );
}

export function ContractPagination({ query, totalPages }: { query: ListQuery; totalPages: number }) {
  const go = useGo();
  return <Pagination page={query.page} totalPages={totalPages} onPageChange={(page) => go.push({ ...query, page })} />;
}
