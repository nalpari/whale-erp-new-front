"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Checkbox, FilterPanel, FilterSection, SearchField } from "@/components/common";
import { STORE_STATUSES, STORE_TYPES } from "@/lib/store-types";
import { useCodeLabel } from "@/components/site/code-label";
import { useScope, useStorePicks, useStores } from "@/components/site/session-gate";
import { scopeStores } from "@/lib/store-scope";
import { useStoreListNavigation } from "./store-list-navigation";
import { StorePicker, type PickedStore } from "./store-picker";
import { DEFAULT_STORES_QUERY, withStoreFilter, type StoresQuery } from "./stores-query";

/** 이 필터의 목록 메뉴 url(store-scope.ts 의 STORE_SCOPE_LIST_URLS) */
const LIST_URL = "/stores";

const toggle = <T,>(list: readonly T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

/**
 * 점포 목록 왼쪽 필터(데모 stores/index). 조건은 모두 AND 이고, 값은 URL 에만 둔다 — 바꾸면 URL 을 바꾸고 서버가 목록을 다시 그린다.
 * 점포는 고르는 즉시, 사업자등록번호는 Enter · 돋보기에 건다. 처음엔 폐점을 뺀다.
 * 고른 점포의 이름은 URL 에 없어(storeIds 만) 서버가 찾아 picked 로 넘긴다. 고르는 즉시 칩이 서도록 이 안에서도 쥔다.
 * 목록에 들어올 때 주소에 고른 점포가 없으면 헤더 점포 범위의 점포로 채워 다시 검색한다(store-scope.ts). 목록에서 점포를 바꾸면
 * (더하기 · 빼기 · 모두 지우기) 이 탭에 기억해(store-picks) 상세 · 등록 · 수정을 오가다 어느 길로 돌아와도 그 값을 쓴다 — 사용자가
 * 바꾼 것은 헤더 범위를 다시 따르지 않는다. 헤더 범위를 새로 고르거나 다른 메뉴로 나가면 잊는다(admin-header.tsx). 초기화는 헤더 범위로 돌아간다.
 */
export function StoreFilter({ picked }: { picked: PickedStore[] }) {
  const statusLabel = useCodeLabel("STORE_STATUS");
  const typeLabel = useCodeLabel("STORE_TYPE");
  const { current, navigate } = useStoreListNavigation();
  const [scope] = useScope();
  const [picks, setPicks] = useStorePicks();
  const stores = useStores();
  const scoped = () => scopeStores(scope, stores).map(({ storeId, name, storeCode }) => ({ storeId, name, storeCode }));
  // 헤더 메뉴 링크 · 범위 바꾸기는 처음부터 storeIds 를 싣는다. 이것은 그 밖의 길(주소 직접 입력 · 홈 바로가기 · 등록 뒤 상세의 [목록])로 온 때다.
  // 들어올 때 한 번만 정한다 — 사용자가 고른 점포가 있으면 그것을, 없으면 범위의 점포를 칩으로 그리고, 주소는 마운트 뒤에 바꿔 다시 검색한다.
  const [fill] = useState(() => {
    if (current.storeIds.length) return [];
    return picks?.url === LIST_URL ? picks.stores : scoped();
  });
  const [chips, setChips] = useState(fill.length ? fill : picked);
  // 서버가 새로 찾아 준 이름으로 맞춘다(뒤로 가기 · 링크 이동으로 URL 이 바뀐 때)
  const [shownPicked, setShownPicked] = useState(picked);
  if (picked !== shownPicked) {
    setShownPicked(picked);
    setChips(picked);
  }
  const [resets, setResets] = useState(0);
  const go = (next: Partial<StoresQuery>) => navigate(withStoreFilter(current, next));
  const searchFill = useEffectEvent(() => {
    if (fill.length) go({ storeIds: fill.map((s) => s.storeId) });
  });
  useEffect(() => searchFill(), []);

  return (
    <FilterPanel
      onReset={() => {
        const next = scoped();
        setPicks(null);
        setResets((n) => n + 1);
        setChips(next);
        navigate({ ...DEFAULT_STORES_QUERY, storeIds: next.map((s) => s.storeId), view: current.view, pageSize: current.pageSize });
      }}
    >
      <FilterSection label="점포" tight>
        <StorePicker
          picked={chips}
          onChange={(next) => {
            setChips(next);
            setPicks({ url: LIST_URL, stores: next.map(({ storeId, name, storeCode }) => ({ storeId, name, storeCode })) });
            go({ storeIds: next.map((s) => s.storeId) });
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
          onSearch={(value) => go({ bizRegistrationNumber: value.replace(/[^0-9]/g, "").slice(0, 10) })}
        />
      </FilterSection>
      <FilterSection label="점포상태">
        {STORE_STATUSES.map((status) => (
          <Checkbox
            key={status}
            label={statusLabel(status)}
            checked={current.statuses.includes(status)}
            onChange={() => go({ statuses: toggle(current.statuses, status) })}
          />
        ))}
      </FilterSection>
      <FilterSection label="점포유형" last>
        {STORE_TYPES.map((type) => (
          <Checkbox
            key={type}
            label={typeLabel(type)}
            checked={current.storeTypes.includes(type)}
            onChange={() => go({ storeTypes: toggle(current.storeTypes, type) })}
          />
        ))}
      </FilterSection>
    </FilterPanel>
  );
}
