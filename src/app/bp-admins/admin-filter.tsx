"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Checkbox, FilterPanel, FilterSection, SearchField, Select, useToast } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import { useScope, useStores } from "@/components/site/session-gate";
import { StorePicker, type PickedStore } from "@/components/site/store-picker";
import type { Scope } from "@/lib/browser-storage";
import type { BpAdminRoleGroup, BpAdminRoleType, BpAdminStatus } from "@/lib/bp-admins";
import { isUnusableScope, scopeKeyOf, scopeStores, toPickedStore } from "@/lib/store-scope";
import { fillScopeOf } from "@/app/stores/stores-query";
import {
  BP_ADMIN_ROLE_TYPES,
  keepingPanel,
  parseBpAdminsQuery,
  roleGroupOptionsOf,
  showsRoleOf,
  withBpAdminFilter,
  withPickedStores,
  withRoleToggled,
  withScopeCondition,
  type BpAdminsQuery,
} from "./bp-admins-href";

/**
 * 왼쪽 필터(데모 config/admins). 점포 · 아이디 · 이름 · 역할 · 권한명 · 계정상태, 조건은 모두 AND 다(S-AJHXFU).
 * 점포는 고르는 즉시, 아이디 · 이름은 Enter · 돋보기에 걸고, 역할 · 권한명 · 계정상태는 고르는 즉시 건다.
 * 점포 칸은 점포 목록 필터와 같다 — 목록에서 고른 점포(storeIds), 없으면 헤더가 실어 온 범위(scope)를 칩으로 그리고, 점포 조건이 주소에
 * 없으면(주소 직접 입력 · 즐겨찾기) 헤더 범위로 채워 다시 검색한다(stores/store-filter.tsx). 고른 점포를 관리하는 계정을 찾고,
 * 전체 점포 계정은 늘 결과에 나온다(api). 칩 이름은 로그인 정보의 점포에서 찾는다 — 찾지 못한 점포는 조건에서 빼고 알린다.
 */
export function AdminFilter({
  query,
  roleGroups,
  navigate,
}: {
  query: BpAdminsQuery;
  /** null 이면 받지 못했다 — 선택칸을 막고 이유를 단다 */
  roleGroups: BpAdminRoleGroup[] | null;
  navigate: (next: BpAdminsQuery, replace?: boolean) => void;
}) {
  const [headerScope] = useScope();
  const stores = useStores();
  const toast = useToast();
  const roleType = useCodeLabel("ROLE_TYPE");
  // 고른 점포는 고른 순서대로, 범위는 그 범위의 점포(전체면 칩 없음)
  const chipsOf = (q: Pick<BpAdminsQuery, "storeIds" | "scope">): PickedStore[] =>
    q.storeIds.length
      ? q.storeIds.flatMap((id) => stores.filter((s) => s.storeId === id).map(toPickedStore))
      : q.scope
        ? scopeStores(q.scope, stores).map(toPickedStore)
        : [];

  // 주소가 바뀌면(뒤로 가기 · 헤더 범위 변경 · 서버가 뺀 점포) 칩을 그 값으로 맞춘다. 고르는 즉시 칩이 서도록 이 안에서도 쥔다.
  const shownKey = `${query.storeIds.join(",")}|${query.storesCleared}|${query.scope ? scopeKeyOf(query.scope) : ""}`;
  const [fillScope] = useState(() => fillScopeOf(query, headerScope));
  const [chips, setChips] = useState(() => chipsOf(fillScope ? { storeIds: [], scope: fillScope } : query));
  const [chipsKey, setChipsKey] = useState(shownKey);
  if (chipsKey !== shownKey) {
    setChipsKey(shownKey);
    setChips(chipsOf(query));
  }

  // 점포 조건이 주소에 없으면 그때의 헤더 범위로 채운다(뒤로 · 앞으로 가기로 그런 주소에 와도 다시 채운다)
  const noCondition = !query.storeIds.length && !query.storesCleared && !query.scope;
  const fill = useEffectEvent(() => {
    const s = fillScopeOf(query, headerScope);
    if (s) navigate(keepingPanel(query, withScopeCondition(query, s)), true);
  });
  useEffect(() => fill(), [noCondition]);

  // 이 탭의 점포에 없는 점포(지웠거나 다른 BP 탭에서 복사한 주소)는 칩 없이 0건을 만들므로 조건에서 빼고 알린다
  const missing = query.storeIds.filter((id) => !stores.some((s) => s.storeId === id));
  const unusable = !query.storeIds.length && !!query.scope && isUnusableScope(query.scope, stores);
  const dropMissing = useEffectEvent(() => {
    if (unusable) {
      toast("상단 범위에 해당하는 점포가 이 탭에 없어 전체로 조회합니다.");
      navigate(keepingPanel(query, withPickedStores(query, [])), true);
    } else if (missing.length) {
      toast(`고른 점포 ${missing.length}곳을 찾을 수 없어 조건에서 뺐습니다.`);
      navigate(
        keepingPanel(
          query,
          withPickedStores(
            query,
            query.storeIds.filter((id) => !missing.includes(id)),
          ),
        ),
        true,
      );
    }
  });
  useEffect(() => dropMissing(), [missing.length, unusable]);

  const [keyword, setKeyword] = useState(query.keyword ?? "");
  // 초기화 · 뒤로 가기로 주소의 검색어가 바뀌면 칸도 따라간다
  const [shownKeyword, setShownKeyword] = useState(query.keyword);
  if (query.keyword !== shownKeyword) {
    setShownKeyword(query.keyword);
    setKeyword(query.keyword ?? "");
  }

  // 하나만 고르면 그 상태, 둘 다 고르면 전체, 둘 다 끄면 결과 없음(NONE) — 플랫폼 관리자 필터와 같다(2026-10-27 사용자 지정)
  const shows = (s: BpAdminStatus) => query.accountStatus !== "NONE" && (!query.accountStatus || query.accountStatus === s);
  const toggleStatus = (s: BpAdminStatus, checked: boolean) => {
    const next = (["ACTIVE", "INACTIVE"] as const).filter((x) => (x === s ? checked : shows(x)));
    navigate(withBpAdminFilter(query, { accountStatus: next.length === 0 ? "NONE" : next.length === 1 ? next[0] : undefined }));
  };

  // 역할 — 계정상태와 같은 체크박스, 처음엔 모두 켠다. 섞여 보여 정신없다는 의견으로 더했다(2026-10-30 사용자 지정)
  const toggleRole = (r: BpAdminRoleType, checked: boolean) => navigate(withRoleToggled(query, roleGroups, r, checked));
  // 고른 역할의 권한명만 선택지로(2026-10-30)
  const visibleGroups = roleGroups && roleGroupOptionsOf(roleGroups, query.roleTypeCodes);

  return (
    <FilterPanel
      onReset={() => {
        const scope: Scope = headerScope;
        setChips(chipsOf({ storeIds: [], scope }));
        // 초기화는 헤더 범위로 돌아간다. 건수는 그대로 둔다
        navigate({ ...withScopeCondition(parseBpAdminsQuery({}), scope), pageSize: query.pageSize });
      }}
    >
      <FilterSection label="점포" tight>
        <StorePicker
          picked={chips}
          onChange={(next) => {
            setChips(next);
            navigate(
              withPickedStores(
                query,
                next.map((s) => s.storeId),
              ),
            );
          }}
        />
      </FilterSection>
      <FilterSection label="아이디 · 이름" tight>
        <SearchField
          value={keyword}
          onValueChange={setKeyword}
          onSearch={(v) => navigate(withBpAdminFilter(query, { keyword: v.trim().slice(0, 20).trim() || undefined }))}
          placeholder="아이디 또는 이름 일부"
          aria-label="아이디 · 이름"
          maxLength={20}
        />
      </FilterSection>
      <FilterSection label="역할" tight>
        {BP_ADMIN_ROLE_TYPES.map((r) => (
          <Checkbox key={r} label={roleType(r)} checked={showsRoleOf(query.roleTypeCodes, r)} onChange={(e) => toggleRole(r, e.target.checked)} />
        ))}
      </FilterSection>
      {/* 라벨은 목록 열 · 상세 머리와 같은 「권한명」(2026-10-27 사용자 지정 — 전엔 「권한 그룹」) */}
      <FilterSection label="권한명" tight>
        <Select
          aria-label="권한명"
          value={query.roleGroupId ? String(query.roleGroupId) : ""}
          onChange={(e) => navigate(withBpAdminFilter(query, { roleGroupId: e.target.value ? Number(e.target.value) : undefined }))}
          disabled={roleGroups === null}
          title={roleGroups === null ? "권한 그룹 목록을 불러오지 못했습니다. 화면을 새로 고쳐 주세요." : undefined}
        >
          <option value="">{roleGroups === null ? "불러오지 못함" : "전체"}</option>
          {/* 주소의 권한 그룹이 선택지에 없어도(받지 못함 · 고를 수 없는 그룹 · 끈 역할의 그룹 — 북마크 · 뒤로 가기) 걸린 조건을 「전체」로 숨기지 않는다 */}
          {query.roleGroupId && !visibleGroups?.some((r) => r.roleGroupId === query.roleGroupId) && (
            <option value={query.roleGroupId}>선택한 권한명(#{query.roleGroupId})</option>
          )}
          {visibleGroups?.map((r) => (
            <option key={r.roleGroupId} value={r.roleGroupId}>
              {r.name} · {r.roleCode}
            </option>
          ))}
        </Select>
      </FilterSection>
      {/* 체크박스 둘, 처음엔 모두 켠다(플랫폼 관리자와 같다, 2026-10-27 사용자 지정 — 전엔 선택 상자) */}
      <FilterSection label="계정상태" last>
        <Checkbox label="사용" checked={shows("ACTIVE")} onChange={(e) => toggleStatus("ACTIVE", e.target.checked)} />
        <Checkbox label="미사용" checked={shows("INACTIVE")} onChange={(e) => toggleStatus("INACTIVE", e.target.checked)} />
      </FilterSection>
    </FilterPanel>
  );
}
