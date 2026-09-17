import {
  Button,
  DataTable,
  GlobalHeader,
  ListToolbar,
  PageBar,
  Select,
  StoreSelect,
  UserPop,
} from "@/components/common";
import { MENUS, STORE_COLUMNS, STORE_ROWS, STORES, USER_ITEMS } from "../sample";
import { SamplePagination } from "../sample-pagination";
import { StoreFilter } from "../store-filter";

// Figma 01.프레임_기본(점포정보 관리 목록)을 공통 컴포넌트로 조합한 임시 페이지.
// 화면 높이에 맞춰 두고, 넘치는 내용은 필터와 목록 안에서만 스크롤해 body 스크롤이 생기지 않게 한다.
// 1720 보다 좁은 창에서는 body 가 아니라 이 바깥 영역이 가로로 스크롤한다.
export default function DesignFullPage() {
  return (
    <div className="h-[100dvh] overflow-x-auto overflow-y-hidden bg-erp-thead-bg">
      <div className="flex h-full min-w-[1720px] flex-col">
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
        <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
          <StoreFilter />
          <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
            <ListToolbar total={100}>
              <Button>신규 등록</Button>
              <div className="w-[80px] shrink-0">
                <Select aria-label="페이지당 건수" defaultValue="50">
                  <option>20</option>
                  <option>50</option>
                  <option>100</option>
                </Select>
              </div>
            </ListToolbar>
            <DataTable columns={STORE_COLUMNS} rows={STORE_ROWS} rowKey={(r) => r.no} />
            <div className="pt-[14px]">
              <SamplePagination totalPages={10} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
