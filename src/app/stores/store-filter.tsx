"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Checkbox, FilterPanel, FilterSection, SearchField, useToast } from "@/components/common";
import { STORE_STATUSES, STORE_TYPES } from "@/lib/store-types";
import { useCodeLabel } from "@/components/site/code-label";
import { useScope, useStores } from "@/components/site/session-gate";
import { StorePicker, type PickedStore } from "@/components/site/store-picker";
import type { Scope } from "@/lib/browser-storage";
import { isUnusableScope, scopeKeyOf, scopeStores, toPickedStore } from "@/lib/store-scope";
import { useStoreListNavigation } from "./store-list-navigation";
import { DEFAULT_STORES_QUERY, fillScopeOf, withPickedStores, withScopeCondition, withStatuses, withStoreFilter } from "./stores-query";

const toggle = <T,>(list: readonly T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

/**
 * 점포 목록 왼쪽 필터(데모 stores/index). 조건은 모두 AND 이고, 값은 URL 에만 둔다 — 바꾸면 URL 을 바꾸고 서버가 목록을 다시 그린다.
 * 점포는 고르는 즉시, 사업자등록번호는 Enter · 돋보기에 건다. 처음엔 폐점을 뺀다.
 * 점포 칸은 목록에서 고른 점포(storeIds — 이름은 서버가 찾아 picked 로 넘긴다)를, 없으면 헤더가 실어 온 범위(scope)를 칩으로 그린다.
 * 직영 · 가맹 범위의 칩은 로그인 정보의 점포(폐점 제외)에서 만든다 — api 에는 점포유형으로 보내므로, 로그인 뒤 생긴 점포나 「폐점」을
 * 켰을 때의 그 유형 폐점 점포는 목록에 나와도 칩에는 없다(받아들인 차이). 고르는 즉시 칩이 서도록 이 안에서도 쥔다.
 * 점포 조건이 주소에 없으면(주소 직접 입력 · 즐겨찾기 · 그런 주소로 뒤로 가기) 헤더 범위로 채워 다시 검색한다. 상세 · 등록 · 수정을 오갈 때는
 * 목록 주소를 ?back= 으로 넘겨 고른 점포가 그대로 돌아온다. 다른 메뉴로 갔다 헤더로 다시 들어오면 헤더 범위를 따른다.
 * 초기화는 헤더 범위로 돌아간다. 고른 점포에 폐점이 있으면 점포상태 기본값이 「전체」다 — 폐점 여부는 서버가 지금 상태로 센다.
 * 주소의 범위를 이 탭에서 쓸 수 없으면(다른 BP 탭에서 복사한 주소 — 고를 점포가 없다) 「전체」로 바꾸고 알린다.
 */
export function StoreFilter({ picked, scope }: { picked: PickedStore[]; scope: Scope | null }) {
  const statusLabel = useCodeLabel("STORE_STATUS");
  const typeLabel = useCodeLabel("STORE_TYPE");
  const { current, navigate } = useStoreListNavigation();
  const [headerScope] = useScope();
  const stores = useStores();
  const toast = useToast();
  /** 범위의 칩 — 로그인 정보의 점포에서 만든다 */
  const scopeChips = (s: Scope): PickedStore[] => scopeStores(s, stores).map(toPickedStore);
  /** 서버가 그린 조건의 칩 — 고른 점포 · 점포 하나 범위는 서버가 찾은 이름(picked), 직영 · 가맹 범위는 로그인 정보에서 */
  const chipsOf = (s: Scope | null): PickedStore[] => (s && (s.type === "DIRECT" || s.type === "FRANCHISE") ? scopeChips(s) : picked);
  // 서버가 새로 그린 값(고른 점포 · 범위)이 바뀌면 칩을 그 값으로 맞춘다(뒤로 가기 · 링크 이동 · 헤더 범위 변경)
  const shownKey = `${picked.map((p) => p.storeId).join(",")}|${scope ? scopeKeyOf(scope) : ""}`;
  // 점포 조건이 주소에 없으면(주소 직접 입력 · 즐겨찾기) 헤더 범위로 채운다 — 칩은 처음부터 그 범위로 그리고, 검색은 마운트 뒤에 다시 건다
  const [fillScope] = useState(() => fillScopeOf(current, headerScope));
  const [chips, setChips] = useState(() => (fillScope ? scopeChips(fillScope) : chipsOf(scope)));
  const [chipsKey, setChipsKey] = useState(shownKey);
  if (chipsKey !== shownKey) {
    setChipsKey(shownKey);
    setChips(chipsOf(scope));
  }
  const [resets, setResets] = useState(0);
  // 점포상태를 사용자가 고치지 않았으면 서버가 그 범위에 맞는 기본값을 정한다(statusesDefault).
  // 마운트 뒤에도 점포 조건이 없는 주소로 오면(뒤로 · 앞으로 가기는 이 화면을 다시 그리지 않는다) 그때의 헤더 범위로 다시 채운다.
  // 다시 채울지는 주소(점포 조건이 있나)로만 정한다 — 헤더 범위가 바뀐 것으로 돌면 헤더의 이동(다른 조건 초기화 · 기록)을 이 replace 가 덮는다.
  const noCondition = !current.storeIds.length && !current.scope;
  const fill = useEffectEvent(() => {
    const s = fillScopeOf(current, headerScope);
    if (s) navigate(withScopeCondition(current, s));
  });
  useEffect(() => fill(), [noCondition]);
  // 주소의 범위를 이 탭에서 쓸 수 없으면(고를 점포가 없다) 칩도 없이 걸러진 0건이 되므로 「전체」로 바꾸고 알린다(헤더도 따르지 않는다)
  const unusable = !!scope && isUnusableScope(scope, stores);
  const dropUnusable = useEffectEvent(() => {
    if (!unusable) return;
    toast("상단 범위에 해당하는 점포가 이 탭에 없어 전체로 조회합니다.");
    navigate(withPickedStores(current, []));
  });
  useEffect(() => dropUnusable(), [unusable]);

  return (
    <FilterPanel
      onReset={() => {
        setResets((n) => n + 1);
        setChips(scopeChips(headerScope));
        navigate({
          ...DEFAULT_STORES_QUERY,
          scope: headerScope.type === "ALL" ? { type: "ALL" } : headerScope,
          view: current.view,
          pageSize: current.pageSize,
        });
      }}
    >
      <FilterSection label="점포" tight>
        <StorePicker
          picked={chips}
          onChange={(next) => {
            setChips(next);
            navigate(withPickedStores(current, next.map((s) => s.storeId)));
          }}
        />
      </FilterSection>
      <FilterSection label="사업자등록번호" tight>
        <SearchField
          key={`biz-${current.bizRegistrationNumber}-${resets}`}
          defaultValue={current.bizRegistrationNumber}
          placeholder="하이픈 없이 10자리"
          aria-label="사업자등록번호"
          inputMode="numeric"
          maxLength={12}
          onSearch={(value) => navigate(withStoreFilter(current, { bizRegistrationNumber: value.replace(/[^0-9]/g, "").slice(0, 10) }))}
        />
      </FilterSection>
      <FilterSection label="점포상태">
        {STORE_STATUSES.map((status) => (
          <Checkbox
            key={status}
            label={statusLabel(status)}
            checked={current.statuses.includes(status)}
            onChange={() => navigate(withStatuses(current, toggle(current.statuses, status)))}
          />
        ))}
      </FilterSection>
      <FilterSection label="점포유형" last>
        {STORE_TYPES.map((type) => (
          <Checkbox
            key={type}
            label={typeLabel(type)}
            checked={current.storeTypes.includes(type)}
            onChange={() => navigate(withStoreFilter(current, { storeTypes: toggle(current.storeTypes, type) }))}
          />
        ))}
      </FilterSection>
    </FilterPanel>
  );
}
