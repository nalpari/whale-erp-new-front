"use client";

import { useState } from "react";
import { Checkbox, FilterPanel, FilterSection, SearchField } from "@/components/common";
import { STORE_STATUSES, STORE_TYPES } from "@/lib/store-types";
import { useCodeLabel } from "@/components/site/code-label";
import { useStoreListNavigation } from "./store-list-navigation";
import { StorePicker, type PickedStore } from "./store-picker";
import { DEFAULT_STORES_QUERY, withStoreFilter, type StoresQuery } from "./stores-query";

const toggle = <T,>(list: readonly T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

/**
 * 점포 목록 왼쪽 필터(데모 stores/index). 조건은 모두 AND 이고, 값은 URL 에만 둔다 — 바꾸면 URL 을 바꾸고 서버가 목록을 다시 그린다.
 * 점포는 고르는 즉시, 사업자등록번호는 Enter · 돋보기에 건다. 처음엔 폐점을 뺀다.
 * 고른 점포의 이름은 URL 에 없어(storeIds 만) 서버가 찾아 picked 로 넘긴다. 고르는 즉시 칩이 서도록 이 안에서도 쥔다.
 */
export function StoreFilter({ picked }: { picked: PickedStore[] }) {
  const statusLabel = useCodeLabel("STORE_STATUS");
  const typeLabel = useCodeLabel("STORE_TYPE");
  const { current, navigate } = useStoreListNavigation();
  const [chips, setChips] = useState(picked);
  // 서버가 새로 찾아 준 이름으로 맞춘다(뒤로 가기 · 링크 이동으로 URL 이 바뀐 때)
  const [shownPicked, setShownPicked] = useState(picked);
  if (picked !== shownPicked) {
    setShownPicked(picked);
    setChips(picked);
  }
  const [resets, setResets] = useState(0);
  const go = (next: Partial<StoresQuery>) => navigate(withStoreFilter(current, next));

  return (
    <FilterPanel
      onReset={() => {
        setResets((n) => n + 1);
        setChips([]);
        navigate({ ...DEFAULT_STORES_QUERY, view: current.view, pageSize: current.pageSize });
      }}
    >
      <FilterSection label="점포" tight>
        <StorePicker
          picked={chips}
          onChange={(next) => {
            setChips(next);
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
