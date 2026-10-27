"use client";

import { useState, type ReactNode } from "react";
import { Checkbox, FilterPanel, FilterSection, SearchField } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import { GROUP_OWNERS, ownerQuery, type GroupOwner, type OwnerFilter } from "@/lib/code-drafts";

/** 공통코드 그룹 검색 조건 — 그룹 코드 · 그룹명(일부 일치 · 대소문자 무시) · 관리주체(하나만 고른 때만 값, 비면 전체). api 가 거른다. */
export type CodeGroupSearch = { groupCode: string; groupName: string; manageOwnerCode?: OwnerFilter };

/** 검색 결과가 없을 때 그룹 목록의 빈 칸 문구(두 줄). 검색하지 않았으면 undefined — 부르는 쪽 문구를 쓴다. */
export function searchedEmpty({ groupCode, groupName, manageOwnerCode: owner }: CodeGroupSearch, ownerLabel?: string): ReactNode {
  // 관리주체를 둘 다 끄면(NONE) 고른 관리주체가 없어 결과가 없다(2026-10-27 사용자 지정)
  if (owner === "NONE")
    return (
      <>
        선택한 관리주체가 없어 표시할 공통코드 그룹이 없습니다.
        <br />
        관리주체를 하나 이상 선택해 주세요.
      </>
    );
  const manageOwnerCode = ownerQuery(owner);
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
// 관리주체는 체크박스로 고르는 즉시 건다. 하나만 고르면 그 관리주체만, 둘 다 고르면 전체, 둘 다 끄면 결과 없음이다
// (2026-10-27 사용자 지정 — 그 전엔 둘 다 끄면 전체로 보였다).
// 체크 모양은 주소(?manageOwnerCode — 하나만 고름은 그 값, 둘 다 끔은 NONE, 둘 다 고름은 없음)에서 읽는다 — 칸이 다시 그려져도 남는다. 기본은 둘 다.
// 관리주체 칸은 플랫폼 공통코드 관리에만 둔다(showOwner) — BP 공통코드 관리는 그룹 코드 · 그룹명만(2026-10-27 사용자 지정).
export function CodeGroupFilter({
  groupCode,
  groupName,
  manageOwnerCode,
  showOwner = false,
  ownerLabels,
  onSearch,
}: CodeGroupSearch & { showOwner?: boolean; ownerLabels?: Record<string, string>; onSearch: (next: CodeGroupSearch) => void }) {
  const [code, setCode] = useState(groupCode);
  const [name, setName] = useState(groupName);
  // 관리주체 한글 — 화면이 넘긴 값(플랫폼 공통코드가 서버에서 받은 MANAGE_OWNER)을 먼저, 없으면 로그인 공통코드
  const codeLabel = useCodeLabel("MANAGE_OWNER");
  const ownerLabel = (o: GroupOwner) => ownerLabels?.[o] ?? codeLabel(o);
  const search = (next: CodeGroupSearch) =>
    onSearch({ groupCode: next.groupCode.trim(), groupName: next.groupName.trim(), manageOwnerCode: next.manageOwnerCode });
  const owners: GroupOwner[] = manageOwnerCode === "NONE" ? [] : manageOwnerCode ? [manageOwnerCode] : [...GROUP_OWNERS];
  const toggleOwner = (o: GroupOwner, checked: boolean) => {
    const next = GROUP_OWNERS.filter((x) => (x === o ? checked : owners.includes(x)));
    const value: OwnerFilter | undefined = next.length === 0 ? "NONE" : next.length === 1 ? next[0] : undefined;
    search({ groupCode: code, groupName: name, manageOwnerCode: value });
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
            <Checkbox key={o} label={ownerLabel(o)} checked={owners.includes(o)} onChange={(e) => toggleOwner(o, e.target.checked)} />
          ))}
        </FilterSection>
      )}
    </FilterPanel>
  );
}
