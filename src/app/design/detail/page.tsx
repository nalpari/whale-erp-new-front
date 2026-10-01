import { AlarmLink, Button, DetailTable, GlobalHeader, PageBar, ServiceLinks, StoreSelect, UserPop } from "@/components/common";
import { CONTRACT_ROWS, MENUS, STORES, USER_ITEMS } from "../sample";

// Figma 03.프레임_상세(점포정보 관리 상세). 목록에서 계약서보기를 누르면 들어오는 화면이다.
// 머리말은 목록과 같고, 본문만 한 건을 세로로 펼친 표로 바꾼다. 표가 길어지므로 본문 영역만 세로로 스크롤한다.
export default function DesignDetailPage() {
  return (
    <div className="h-[100dvh] overflow-x-auto overflow-y-hidden bg-erp-thead-bg">
      <div className="flex h-full min-w-[1720px] flex-col">
        <GlobalHeader
          menus={MENUS}
          right={
            <>
              <StoreSelect options={STORES} />
              <ServiceLinks />
              <AlarmLink href="#" />
              <UserPop name="김지영 (admin)" items={USER_ITEMS} />
            </>
          }
        />
        <PageBar title="점포정보 관리" />
        {/* Figma 기준 흰 카드가 남는 높이를 모두 차지한다. 표가 길어지면 이 영역만 세로로 스크롤한다. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
          <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-end gap-[6px]">
                <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">전자 계약서</h2>
                <Button variant="soft">삭제</Button>
                <Button variant="soft">수정</Button>
                <Button href="/design/full">목록</Button>
              </div>
              <DetailTable title="가맹점 계약" rows={CONTRACT_ROWS} />
            </div>
            <DetailTable title="가맹점 계약" rows={CONTRACT_ROWS} />
          </div>
        </div>
      </div>
    </div>
  );
}
