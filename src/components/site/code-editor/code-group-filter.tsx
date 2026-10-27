"use client";

import { useState, type ReactNode } from "react";
import { Checkbox, FilterPanel, FilterSection, SearchField } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import { GROUP_OWNERS, type GroupOwner } from "@/lib/code-drafts";

/** 공통코드 그룹 검색 조건 — 그룹 코드 · 그룹명(일부 일치 · 대소문자 무시) · 관리주체(하나만 고른 때만 값, 비면 전체). api 가 거른다. */
export type CodeGroupSearch = { groupCode: string; groupName: string; manageOwnerCode?: GroupOwner };

/** 검색 결과가 없을 때 그룹 목록의 빈 칸 문구(두 줄). 검색하지 않았으면 undefined — 부르는 쪽 문구를 쓴다. */
export function searchedEmpty({ groupCode, groupName, manageOwnerCode }: CodeGroupSearch, ownerLabel?: string): ReactNode {
  if (!groupCode && !groupName && !manageOwnerCode) return undefined;
  const terms = [groupCode && `그룹 코드 ‘${groupCode}’`, groupName && `그룹명 ‘${groupName}’`, manageOwnerCode && `관리주체 ‘${ownerLabel ?? manageOwnerCode}’`]
    .filter(Boolean)
    .join(" · ");
  return (
    <>
      {terms}에 맞는 공통코드 그룹이 없습니다.
      <br />
      검색 조건을 바꿔 다시 검색해 주세요.
    </>
  );
}

// 왼쪽 필터 — 플랫폼 공통코드 관리와 BP 공통코드 관리가 함께 쓴다. 어느 칸에서 Enter · 돋보기를 눌러도 두 칸 값으로 함께 검색한다.
// 어디로 갈지(주소 · 저장 안 한 변경 확인)는 부르는 쪽이 onSearch 로 정한다. 값은 앞뒤 공백을 빼서 넘긴다.
// 관리주체는 체크박스로 고르는 즉시 건다(플랫폼 관리자 관리의 계정 상태와 같다). 하나만 고른 때만 조건이 되고, 둘 다 고른 것과
// 둘 다 끈 것은 모두 전체로 본다 — 마지막 하나를 끄면 둘 다 켜진 모양으로 돌아온다(2026-10-27 사용자 요청, 기본은 둘 다).
// 관리주체 칸은 플랫폼 공통코드 관리에만 둔다(showOwner) — BP 공통코드 관리는 그룹 코드 · 그룹명만(2026-10-27 사용자 지정).
export function CodeGroupFilter({
  groupCode,
  groupName,
  manageOwnerCode,
  showOwner = false,
  onSearch,
}: CodeGroupSearch & { showOwner?: boolean; onSearch: (next: CodeGroupSearch) => void }) {
  const [code, setCode] = useState(groupCode);
  const [name, setName] = useState(groupName);
  const ownerLabel = useCodeLabel("MANAGE_OWNER");
  const search = (next: CodeGroupSearch) =>
    onSearch({ groupCode: next.groupCode.trim(), groupName: next.groupName.trim(), manageOwnerCode: next.manageOwnerCode });
  const shows = (o: GroupOwner) => !manageOwnerCode || manageOwnerCode === o;
  const toggleOwner = (o: GroupOwner, checked: boolean) => {
    const next = GROUP_OWNERS.filter((x) => (x === o ? checked : shows(x)));
    search({ groupCode: code, groupName: name, manageOwnerCode: next.length === 1 ? next[0] : undefined });
  };

  return (
    <FilterPanel
      onReset={() => {
        setCode("");
        setName("");
        search({ groupCode: "", groupName: "" }); // 관리주체도 둘 다로 돌아간다
      }}
    >
      <FilterSection label="그룹 코드" tight>
        <SearchField
          value={code}
          onValueChange={setCode}
          onSearch={(value) => search({ groupCode: value, groupName: name, manageOwnerCode })}
          placeholder="예: EMP_TYPE"
          aria-label="그룹 코드"
          maxLength={20}
        />
      </FilterSection>
      <FilterSection label="그룹명" tight last={!showOwner}>
        <SearchField
          value={name}
          onValueChange={setName}
          onSearch={(value) => search({ groupCode: code, groupName: value, manageOwnerCode })}
          placeholder="예: 고용 형태"
          aria-label="그룹명"
          maxLength={50}
        />
      </FilterSection>
      {showOwner && (
        <FilterSection label="관리주체" last>
          {GROUP_OWNERS.map((o) => (
            <Checkbox key={o} label={ownerLabel(o)} checked={shows(o)} onChange={(e) => toggleOwner(o, e.target.checked)} />
          ))}
        </FilterSection>
      )}
    </FilterPanel>
  );
}
