"use client";

import { useState } from "react";
import { Checkbox, FilterPanel, FilterSection, Radio, SearchField, Select } from "@/components/common";
import { BP_MASTER_SEARCH_TYPES, BP_MASTER_STATUSES, type BpMasterSearchType, type BpMasterStatusValue, type BpMasterVerification } from "@/lib/bp-master-paging";
import type { BpMastersQuery } from "./bp-masters-href";

// 왼쪽 필터(S-ALHCJS). 검색 기준 하나를 고르고 검색어 하나를 넣어 Enter · 돋보기로 건다. 상태(여럿)와 사업자정보 인증(BP-2)은 고르는 즉시 건다.
// 조건은 모두 AND 다. 처음엔 조건 없이 전체(미사용 · 탈퇴 포함)를 본다.
type Filters = Pick<BpMastersQuery, "searchType" | "keyword" | "statuses" | "verification">;

const STATUS_LABEL: Record<BpMasterStatusValue, string> = { ACTIVE: "사용", INACTIVE: "미사용", WITHDRAWN: "탈퇴" };
const VERIFICATIONS: { value: BpMasterVerification | undefined; label: string }[] = [
  { value: undefined, label: "전체" },
  { value: "VERIFIED", label: "인증완료" },
  { value: "UNVERIFIED", label: "미인증" },
];

export function BpMasterFilter({ query, onApply }: { query: BpMastersQuery; onApply: (filters: Filters) => void }) {
  const current: Filters = { searchType: query.searchType, keyword: query.keyword, statuses: query.statuses, verification: query.verification };
  const [searchType, setSearchType] = useState<BpMasterSearchType>(query.searchType);
  const [keyword, setKeyword] = useState(query.keyword ?? "");
  // 초기화 · 뒤로 가기로 주소의 검색 조건이 바뀌면 칸도 따라간다
  const [shown, setShown] = useState({ searchType: query.searchType, keyword: query.keyword });
  if (shown.searchType !== query.searchType || shown.keyword !== query.keyword) {
    setShown({ searchType: query.searchType, keyword: query.keyword });
    setSearchType(query.searchType);
    setKeyword(query.keyword ?? "");
  }

  const apply = (patch: Partial<Filters>) => onApply({ ...current, ...patch });

  // 상태는 빈 목록이 전체다. 마지막 하나를 끄면 셋 다 켜진 모양(전체)으로 돌아온다 — 빈 목록을 조건으로 만들지 않는다.
  const shows = (s: BpMasterStatusValue) => !query.statuses.length || query.statuses.includes(s);
  const toggle = (s: BpMasterStatusValue, checked: boolean) => apply({ statuses: BP_MASTER_STATUSES.filter((x) => (x === s ? checked : shows(x))) });

  return (
    <FilterPanel
      onReset={() => {
        // 검색하지 않은 채 바꾼 기준 · 검색어는 주소에 없어 위 따라가기로 지워지지 않는다 — 칸도 직접 비운다
        setSearchType("BP_CODE");
        setKeyword("");
        onApply({ searchType: "BP_CODE", keyword: undefined, statuses: [], verification: undefined });
      }}
    >
      <FilterSection label="검색" tight>
        <div className="flex flex-col gap-[6px]">
          <Select
            aria-label="검색 기준"
            value={searchType}
            onChange={(e) => {
              const next = e.target.value as BpMasterSearchType;
              setSearchType(next);
              // 검색어가 걸려 있으면 바꾼 기준으로 바로 다시 찾는다
              if (query.keyword) apply({ searchType: next });
            }}
          >
            {BP_MASTER_SEARCH_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
          <SearchField
            value={keyword}
            onValueChange={setKeyword}
            onSearch={(v) => apply({ searchType, keyword: v.trim() || undefined })}
            placeholder="검색어 입력"
            aria-label="검색어"
            maxLength={50}
          />
        </div>
      </FilterSection>
      <FilterSection label="상태">
        {BP_MASTER_STATUSES.map((s) => (
          <Checkbox key={s} label={STATUS_LABEL[s]} checked={shows(s)} onChange={(e) => toggle(s, e.target.checked)} />
        ))}
      </FilterSection>
      <FilterSection label="사업자정보 인증" last>
        {VERIFICATIONS.map((v) => (
          <Radio
            key={v.label}
            name="bp-master-verification"
            label={v.label}
            checked={query.verification === v.value}
            onChange={() => apply({ verification: v.value })}
          />
        ))}
      </FilterSection>
    </FilterPanel>
  );
}
