"use client";

import { useState, type ReactNode } from "react";
import { FilterPanel, FilterSection, SearchField } from "@/components/common";

/** 공통코드 그룹 검색 조건 — 그룹 코드 · 그룹명(일부 일치 · 대소문자 무시, api 가 거른다). */
export type CodeGroupSearch = { groupCode: string; groupName: string };

/** 검색 결과가 없을 때 그룹 목록의 빈 칸 문구(두 줄). 검색하지 않았으면 undefined — 부르는 쪽 문구를 쓴다. */
export function searchedEmpty({ groupCode, groupName }: CodeGroupSearch): ReactNode {
  if (!groupCode && !groupName) return undefined;
  const terms = [groupCode && `그룹 코드 ‘${groupCode}’`, groupName && `그룹명 ‘${groupName}’`].filter(Boolean).join(" · ");
  return (
    <>
      {terms}에 맞는 공통코드 그룹이 없습니다.
      <br />
      그룹 코드나 그룹명을 바꿔 다시 검색해 주세요.
    </>
  );
}

// 왼쪽 필터 — 플랫폼 공통코드 관리와 BP 공통코드 관리가 함께 쓴다. 어느 칸에서 Enter · 돋보기를 눌러도 두 칸 값으로 함께 검색한다.
// 어디로 갈지(주소 · 저장 안 한 변경 확인)는 부르는 쪽이 onSearch 로 정한다. 값은 앞뒤 공백을 빼서 넘긴다.
export function CodeGroupFilter({ groupCode, groupName, onSearch }: CodeGroupSearch & { onSearch: (next: CodeGroupSearch) => void }) {
  const [code, setCode] = useState(groupCode);
  const [name, setName] = useState(groupName);
  const search = (next: CodeGroupSearch) => onSearch({ groupCode: next.groupCode.trim(), groupName: next.groupName.trim() });

  return (
    <FilterPanel
      onReset={() => {
        setCode("");
        setName("");
        search({ groupCode: "", groupName: "" });
      }}
    >
      <FilterSection label="그룹 코드" tight>
        <SearchField
          value={code}
          onValueChange={setCode}
          onSearch={(value) => search({ groupCode: value, groupName: name })}
          placeholder="예: EMP_TYPE"
          aria-label="그룹 코드"
          maxLength={20}
        />
      </FilterSection>
      <FilterSection label="그룹명" tight last>
        <SearchField
          value={name}
          onValueChange={setName}
          onSearch={(value) => search({ groupCode: code, groupName: value })}
          placeholder="예: 고용 형태"
          aria-label="그룹명"
          maxLength={50}
        />
      </FilterSection>
    </FilterPanel>
  );
}
