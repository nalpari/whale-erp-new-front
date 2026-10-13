import { DataTable, FilterPanel, FilterSection, ListToolbar, PageBar, SearchField, type Column } from "@/components/common";

// BP 관리자 관리(데모 config/admins.html). 지금은 레이아웃 확인용 빈 목록 — 필터·목록·슬라이드는 이 화면 작업에서 채운다.
type Row = { loginId: string };
const COLUMNS: Column<Row>[] = [
  { header: "아이디", width: "w-[140px]", align: "left", cell: (r) => r.loginId },
  { header: "이름", width: "w-[110px]", cell: () => null },
  { header: "역할", width: "w-[120px]", cell: () => null },
  { header: "권한 그룹", align: "left", cell: () => null },
  { header: "계정 상태", width: "w-[100px]", cell: () => null },
  { header: "매핑 점포", width: "w-[110px]", cell: () => null },
  { header: "등록일시", width: "w-[160px]", cell: () => null },
  { header: "최근 로그인", width: "w-[160px]", cell: () => null },
];

export default function AdminsPage() {
  return (
    <>
      <PageBar title="BP 관리자 관리" />
      <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
        <FilterPanel>
          <FilterSection label="아이디 · 이름" tight last>
            <SearchField placeholder="아이디 또는 이름 일부를 입력하세요" aria-label="아이디 · 이름" />
          </FilterSection>
        </FilterPanel>
        <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          <ListToolbar total={0} />
          <DataTable columns={COLUMNS} rows={[]} rowKey={(r) => r.loginId} />
        </main>
      </div>
    </>
  );
}
