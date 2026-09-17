import { Checkbox, DateField, FilterPanel, FilterSection, SearchField } from "@/components/common";

// Figma 01.프레임_기본의 점포 필터. 두 샘플 페이지가 같이 쓴다.
export function StoreFilter() {
  return (
    <FilterPanel>
      <FilterSection label="점포명">
        <Checkbox label="을지로3가점" defaultChecked />
        <Checkbox label="무교점" />
        <Checkbox label="신촌점" />
      </FilterSection>
      <FilterSection label="대표자명" tight>
        <SearchField placeholder="대표자명 입력" aria-label="대표자명" />
      </FilterSection>
      <FilterSection label="점포상태">
        <Checkbox label="운영" defaultChecked />
        <Checkbox label="미운영" />
        <Checkbox label="폐점" />
      </FilterSection>
      <FilterSection label="점포유형">
        <Checkbox label="일반점포" defaultChecked />
        <Checkbox label="가맹점포" />
      </FilterSection>
      <FilterSection label="등록일" tight last>
        <DateField aria-label="등록일 시작" defaultValue="2020-08-28" />
        <DateField aria-label="등록일 끝" defaultValue="2020-08-28" />
      </FilterSection>
    </FilterPanel>
  );
}
