import type { ReactNode } from "react";
import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  DateField,
  GlobalHeader,
  ListToolbar,
  PageBar,
  Radio,
  SearchField,
  Select,
  StoreSelect,
  UserPop,
} from "@/components/common";
import { MENUS, STORE_COLUMNS, STORE_ROWS, STORES, USER_ITEMS } from "./sample";
import { SamplePagination } from "./sample-pagination";
import { StoreFilter } from "./store-filter";

const COLORS = [
  ["erp-ink", "bg-erp-ink", "#3C4046"],
  ["erp-brand", "bg-erp-brand", "#6B7988"],
  ["erp-brand-soft", "bg-erp-brand-soft", "#8F9EAF"],
  ["erp-label", "bg-erp-label", "#888888"],
  ["erp-thead-text", "bg-erp-thead-text", "#858B94"],
  ["erp-field-line", "bg-erp-field-line", "#EDEDEE"],
  ["erp-button-line", "bg-erp-button-line", "#E5E5E5"],
  ["erp-thead-line", "bg-erp-thead-line", "#E9EDF5"],
  ["erp-thead-bg", "bg-erp-thead-bg", "#F8F9FB"],
  ["erp-subtle", "bg-erp-subtle", "#F0F1F3"],
  ["erp-bar", "bg-erp-bar", "#F0F2F3"],
  ["erp-on", "bg-erp-on", "#5E8CE9"],
  ["erp-off", "bg-erp-off", "#EF6363"],
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-erp-panel-line py-10">
      <h2 className="mb-6 text-[13px] font-semibold tracking-normal text-erp-label uppercase">{title}</h2>
      {children}
    </section>
  );
}

// 공통 컴포넌트(@/components/common)를 하나씩 보여 준다.
export default function DesignUnitsPage() {
  return (
    <main className="mx-auto max-w-[1680px] px-6 py-12 sm:px-10">
      <h1 className="mb-2 text-[28px] font-bold">기본 유닛</h1>
      <p className="mb-10 text-[14px] text-erp-label">2026 Whale ERP 1차수정 · @/components/common</p>

      <Section title="Color">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {COLORS.map(([name, bg, hex]) => (
            <li key={name}>
              <div className={`h-14 rounded-[2px] border border-erp-panel-line ${bg}`} />
              <p className="mt-2 text-[13px] font-medium">{name}</p>
              <p className="text-[12px] text-erp-label">{hex}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Type · Pretendard">
        <div className="space-y-4">
          <p className="text-[22px] font-semibold">페이지 제목 22 SemiBold</p>
          <p className="text-[16px] font-semibold">메뉴 16 SemiBold</p>
          <p className="text-[15px] font-semibold">패널 제목 15 SemiBold</p>
          <p className="text-[14px]">본문 14 Regular</p>
          <p className="text-[14px] font-medium text-erp-label">폼 라벨 14 Medium</p>
        </div>
      </Section>

      <Section title="Button · hover">
        <div className="flex flex-wrap gap-2">
          <Button>신규 등록</Button>
          <Button variant="soft">신규 등록</Button>
          <Button variant="off">취소</Button>
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex gap-2">
          <Badge tone="on">운영</Badge>
          <Badge tone="off">미운영</Badge>
        </div>
      </Section>

      <Section title="SearchField · Select · DateField">
        <div className="grid max-w-[640px] gap-4 sm:grid-cols-3">
          <SearchField placeholder="대표자명 입력" aria-label="대표자명" />
          <Select aria-label="페이지당 건수" defaultValue="50">
            <option>20</option>
            <option>50</option>
            <option>100</option>
          </Select>
          <DateField aria-label="등록일" defaultValue="2020-08-28" />
        </div>
      </Section>

      <Section title="Checkbox · Radio">
        <div className="flex gap-6">
          <Checkbox label="선택됨" defaultChecked />
          <Checkbox label="선택 안 됨" />
        </div>
        <div role="radiogroup" aria-label="점포 구분" className="mt-4 flex gap-6">
          <Radio name="sample-radio" label="프랜차이즈" defaultChecked />
          <Radio name="sample-radio" label="개인점포" />
        </div>
      </Section>

      <Section title="StoreSelect · UserPop">
        {/* 팝업이 섹션 아래로 펼쳐질 자리를 남긴다. */}
        <div className="flex flex-wrap items-center gap-6 pb-[160px]">
          <StoreSelect options={STORES} />
          <UserPop name="김지영 (admin)" items={USER_ITEMS} />
        </div>
      </Section>

      <Section title="FilterPanel · FilterSection">
        <StoreFilter />
      </Section>

      <Section title="ListToolbar · DataTable · Pagination">
        <div className="flex flex-col gap-3 overflow-x-auto">
          <ListToolbar total={100}>
            <Button>신규 등록</Button>
          </ListToolbar>
          <div className="min-w-[1280px]">
            <DataTable columns={STORE_COLUMNS} rows={STORE_ROWS.slice(0, 3)} rowKey={(r) => r.no} />
          </div>
          <DataTable columns={STORE_COLUMNS.slice(0, 3)} rows={[]} rowKey={(r) => r.no} />
          <SamplePagination totalPages={10} />
        </div>
      </Section>

      <Section title="GlobalHeader · PageBar">
        {/* 가로 스크롤 영역은 세로로도 잘라내므로, 툴팁과 헤더 팝업이 펼쳐질 자리를 아래에 남긴다. */}
        <div className="overflow-x-auto pb-[220px]">
          <div className="min-w-[1720px] border border-erp-panel-line">
            <GlobalHeader
              menus={MENUS}
              right={
                <>
                  <StoreSelect options={STORES} />
                  <UserPop name="김지영 (admin)" items={USER_ITEMS} />
                </>
              }
            />
            <PageBar title="점포정보 관리" />
          </div>
        </div>
      </Section>
    </main>
  );
}
