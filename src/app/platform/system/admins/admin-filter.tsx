"use client";

import { useState } from "react";
import { Checkbox, FilterPanel, FilterSection, SearchField, Select } from "@/components/common";
import type { AdminStatus, PlatformRoleGroup } from "@/lib/platform-admins";
import type { AdminsQuery } from "./admins-href";

// 왼쪽 필터(데모와 같다). 아이디 · 이름은 포함 검색으로 Enter · 돋보기에 걸고, 권한 · 상태는 고르는 즉시 건다.
// 조건은 모두 AND 다(S-YTKWGG). 등록일시 검색은 두지 않는다(2026-10-08 데모 결정).
type Filters = Pick<AdminsQuery, "keyword" | "roleGroupId" | "status">;

export function AdminFilter({
  query,
  roleGroups,
  onApply,
}: {
  query: AdminsQuery;
  roleGroups: PlatformRoleGroup[];
  onApply: (filters: Filters) => void;
}) {
  const current: Filters = { keyword: query.keyword, roleGroupId: query.roleGroupId, status: query.status };
  const [keyword, setKeyword] = useState(query.keyword ?? "");
  // 초기화 · 뒤로 가기로 주소의 검색어가 바뀌면 칸도 따라간다
  const [shownKeyword, setShownKeyword] = useState(query.keyword);
  if (query.keyword !== shownKeyword) {
    setShownKeyword(query.keyword);
    setKeyword(query.keyword ?? "");
  }

  const apply = (patch: Filters) => onApply({ ...current, ...patch });

  // 상태는 하나만 고른 때만 조건이 된다. 둘 다 고른 것과 둘 다 끈 것은 모두 전체로 본다 —
  // 마지막 하나를 끄면 둘 다 켜진 모양으로 돌아온다(빈 목록을 조건으로 만들지 않는다).
  const shows = (s: AdminStatus) => !query.status || query.status === s;
  const toggle = (s: AdminStatus, checked: boolean) => {
    const next = (["ACTIVE", "INACTIVE"] as const).filter((x) => (x === s ? checked : shows(x)));
    apply({ status: next.length === 1 ? next[0] : undefined });
  };

  return (
    // 세 키를 명시해 비운다 — 받는 쪽은 지금 조건 위에 덮어쓰므로 빈 객체로는 아무것도 풀리지 않는다
    <FilterPanel onReset={() => onApply({ keyword: undefined, roleGroupId: undefined, status: undefined })}>
      <FilterSection label="아이디 · 이름" tight>
        <SearchField
          value={keyword}
          onValueChange={setKeyword}
          onSearch={(v) => apply({ keyword: v.trim() || undefined })}
          placeholder="아이디 또는 이름 일부"
          aria-label="아이디 · 이름"
          maxLength={20}
        />
      </FilterSection>
      <FilterSection label="사용자 권한" tight>
        <Select
          aria-label="사용자 권한"
          value={query.roleGroupId ? String(query.roleGroupId) : ""}
          onChange={(e) => apply({ roleGroupId: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">전체</option>
          {roleGroups.map((r) => (
            <option key={r.roleGroupId} value={r.roleGroupId}>
              {r.name}
            </option>
          ))}
        </Select>
      </FilterSection>
      <FilterSection label="계정 상태" last>
        <Checkbox label="사용" checked={shows("ACTIVE")} onChange={(e) => toggle("ACTIVE", e.target.checked)} />
        <Checkbox label="미사용" checked={shows("INACTIVE")} onChange={(e) => toggle("INACTIVE", e.target.checked)} />
      </FilterSection>
    </FilterPanel>
  );
}
