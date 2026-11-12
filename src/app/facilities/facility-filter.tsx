"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useOptimistic, useState, useTransition } from "react";
import { FilterPanel, FilterSection, SearchField, Select, useToast } from "@/components/common";
import { SMALL_BUTTON } from "@/components/common/theme";
import { useCodes, useCurrentBp, useScope, useStores } from "@/components/site/session-gate";
import { StoreBulkDialog } from "@/components/site/store-mapping-picker";
import { StorePicker } from "@/components/site/store-picker";
import { bpPath } from "@/lib/bp-path";
import type { AdminStore } from "@/lib/session";
import { isUnusableScope, scopeStores, toPickedStore } from "@/lib/store-scope";
import type { FacilityStoreOption } from "@/lib/facilities";
import { fillScopeOf } from "../stores/stores-query";
import { FACILITY_GROUPS, STATUS_GROUP, isFacilityGroup } from "./facility-form-model";
import {
  DEFAULT_FACILITY_LIST_QUERY,
  facilityListHref,
  needsScopeStores,
  withFilter,
  withPickedStores,
  withScopeCondition,
  type FacilityListQuery,
} from "./facility-list-query";

/**
 * 시설물 · 장비 목록 왼쪽 필터(데모 stores/facilities.mjs) — 점포 · 운영상태 · 그룹 · 분류 · 시설물/장비명. 조건은 모두 AND 이고 값은 URL 에만 둔다.
 * 점포는 점포 정보 관리 목록과 같은 점포 고르기(여러 곳 · [일괄검색])이고, 후보는 GET /facilities/store-options?includeClosed=true —
 * 폐점 점포도 고를 수 있다(PL-1). 고르지 않으면 조회 범위 안 전체다.
 * 점포 조건이 주소에 없으면 헤더 범위로 채운다(TO-DO 목록과 같다). api 에 점포유형 조건이 없어 직영 · 가맹 범위는 그 유형의 점포(로그인 정보,
 * 폐점 제외)로 풀어 storeIds 로 바꾼다 — 그 전까지 목록은 조회하지 않는다(facility-list-query.ts 의 facilityListApiSearch).
 * 분류는 그룹을 골라야 그 그룹의 상세 코드가 나오고, 그룹이 「전체」면 막는다. 그룹을 바꾸면 「전체」로 돌아간다(PL-3).
 */
export function FacilityFilter({ query, storeOptions }: { query: FacilityListQuery; storeOptions: FacilityStoreOption[] }) {
  const router = useRouter();
  const bp = useCurrentBp().bpCodeId;
  const loginStores = useStores();
  const [headerScope] = useScope();
  const toast = useToast();
  const statuses = useCodes(STATUS_GROUP);
  const facilityCategories = useCodes("STORE_FACILITY");
  const equipmentCategories = useCodes("STORE_EQUIPMENT");
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [resets, setResets] = useState(0);
  const navigate = (next: FacilityListQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.replace(bpPath(bp, facilityListHref(next)), { scroll: false });
    });
  const handleFilterChange = (next: Partial<FacilityListQuery>) => navigate(withFilter(current, next));

  // 후보 점포 — 일괄검색 창이 점포유형으로 묶어 고르므로 유형은 로그인 정보에서 찾아 붙인다(store-options 에는 유형이 없다)
  const typeOf = new Map(loginStores.map((s) => [s.storeId, s.storeTypeCode]));
  const pool: AdminStore[] = storeOptions.map((s) => ({ storeId: s.storeId, storeCode: s.storeCode, name: s.name, storeStatusCode: s.storeStatusCode, storeTypeCode: typeOf.get(s.storeId) ?? "" }));

  // 칩 — 고른 점포는 그 순서대로, 없으면 범위(정해지지 않았으면 채울 헤더 범위)의 점포
  const found = current.storeIds.map((id) => pool.find((s) => s.storeId === id)).filter((s) => s !== undefined);
  const shownScope = fillScopeOf(current, headerScope) ?? current.scope;
  const chips = (current.storeIds.length ? found : shownScope ? scopeStores(shownScope, loginStores) : []).map(toPickedStore);

  // 점포 조건이 주소에 없으면 그때의 헤더 범위로 채운다. 직영 · 가맹 범위는 그 점포들로 풀어 storeIds 로 바꾼다(api 에 유형 조건이 없다)
  const scopeToApply = fillScopeOf(current, headerScope) ?? (needsScopeStores(current) ? current.scope : null);
  const applyScope = useEffectEvent(() => {
    if (!scopeToApply) return;
    if (scopeToApply.type !== "DIRECT" && scopeToApply.type !== "FRANCHISE") return navigate(withScopeCondition(current, scopeToApply));
    // 후보(store-options)에 있는 점포만 — 로그인 정보와 범위가 어긋나면 바로 뒤 「찾을 수 없어 뺐습니다」 토스트가 엉뚱하게 뜬다(리뷰 반영)
    const poolIds = new Set(pool.map((p) => p.storeId));
    const ids = scopeStores(scopeToApply, loginStores)
      .map((s) => s.storeId)
      .filter((id) => poolIds.has(id));
    // 그 유형의 점포가 이 탭에 없으면(폐점만 남음 등) 「전체」로 바꾸고 알린다 — 빈 storeIds 는 전체 조회가 되어 범위와 어긋난다
    if (!ids.length) toast("상단 범위에 해당하는 점포가 이 탭에 없어 전체로 조회합니다.");
    navigate({ ...withPickedStores(current, ids), page: current.page });
  });
  const scopeKey = scopeToApply ? JSON.stringify(scopeToApply) : "";
  useEffect(() => applyScope(), [scopeKey]);

  // 후보에 없는 점포를 고른 주소면 빼고 알린다. 범위를 이 탭에서 쓸 수 없으면(고를 점포가 없다) 「전체」로 바꾸고 알린다
  const missingCount = current.storeIds.length - found.length;
  const unusable = !!current.scope && current.scope.type === "STORE" && isUnusableScope(current.scope, loginStores);
  const dropUnknown = useEffectEvent(() => {
    if (missingCount > 0) {
      toast(`선택한 점포 ${missingCount}곳을 찾을 수 없어 조건에서 뺐습니다.`);
      navigate(withPickedStores(current, found.map((s) => s.storeId)));
    } else if (unusable) {
      toast("상단 범위에 해당하는 점포가 이 탭에 없어 전체로 조회합니다.");
      navigate(withPickedStores(current, []));
    }
  });
  useEffect(() => dropUnknown(), [missingCount, unusable]);

  const categories = current.group === "STORE_FACILITY" ? facilityCategories : current.group === "STORE_EQUIPMENT" ? equipmentCategories : [];
  const handleStoresPick = (ids: number[]) => navigate(withPickedStores(current, ids));

  return (
    <FilterPanel
      onReset={() => {
        // 초기화 — 고른 점포 · 그룹 · 분류도 비우고 헤더 범위로 돌아간다. 이름 칸은 key 로 다시 그려 비운다
        setResets((n) => n + 1);
        navigate({ ...DEFAULT_FACILITY_LIST_QUERY, scope: headerScope, pageSize: current.pageSize });
      }}
    >
      <FilterSection
        label="점포"
        tight
        action={
          <button type="button" onClick={() => setBulkOpen(true)} className={SMALL_BUTTON}>
            일괄검색
          </button>
        }
      >
        <StorePicker pool={pool} picked={chips} onChange={(next) => handleStoresPick(next.map((s) => s.storeId))} />
        <StoreBulkDialog
          open={bulkOpen}
          options={pool}
          picked={chips}
          onCancel={() => setBulkOpen(false)}
          onApply={(next) => {
            setBulkOpen(false);
            // 창은 새로 넣은 점포를 앞에 둔다 — 필터는 찾아 고르기처럼 남긴 칩 뒤에 붙인다(점포 목록 필터와 같다)
            const nextIds = new Set(next.map((s) => s.storeId));
            const chipIds = new Set(chips.map((s) => s.storeId));
            handleStoresPick([...chips.filter((s) => nextIds.has(s.storeId)), ...next.filter((s) => !chipIds.has(s.storeId))].map((s) => s.storeId));
          }}
        />
      </FilterSection>
      <FilterSection label="운영상태" tight>
        <Select aria-label="운영상태" value={current.status} onChange={(e) => handleFilterChange({ status: e.target.value })}>
          <option value="">전체</option>
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </FilterSection>
      <FilterSection label="그룹" tight>
        <Select aria-label="그룹" value={current.group} onChange={(e) => handleFilterChange({ group: isFacilityGroup(e.target.value) ? e.target.value : "" })}>
          <option value="">전체</option>
          {FACILITY_GROUPS.map((g) => (
            <option key={g.code} value={g.code}>
              {g.label}
            </option>
          ))}
        </Select>
      </FilterSection>
      <FilterSection label="분류" tight>
        {/* 그룹을 골라야 그 그룹의 분류가 나온다 — 「전체」면 막아 둔다(PL-3) */}
        <Select
          aria-label="분류"
          value={current.category}
          disabled={!current.group}
          title={current.group ? undefined : "그룹을 먼저 선택해 주세요."}
          onChange={(e) => handleFilterChange({ category: e.target.value })}
        >
          <option value="">전체</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </FilterSection>
      <FilterSection label="시설물/장비명" tight last>
        <SearchField
          key={`keyword-${current.keyword}-${resets}`}
          defaultValue={current.keyword}
          placeholder="이름으로 찾기"
          aria-label="시설물/장비명"
          maxLength={100}
          onSearch={(value) => handleFilterChange({ keyword: value.trim() })}
          onClear={() => handleFilterChange({ keyword: "" })}
        />
      </FilterSection>
    </FilterPanel>
  );
}
