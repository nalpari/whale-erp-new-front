import { AlarmLink, GlobalHeader, PageBar, ServiceLinks, StoreSelect, UserPop } from "@/components/common";
import { MENUS, STORES, USER_ITEMS } from "../../design/sample";
import { ContractForm } from "./contract-form";
import { loadFormData } from "./load-form-data";

// 근로계약서 초안 작성. docs/demo/staff/contracts-new.html 을 공통 컴포넌트로 옮겼다.
// 머리글의 메뉴·점포·사용자는 아직 디자인 견본 값이다(1팀 로그인 · 범위 선택기가 생기면 바꾼다).
export default async function NewContractPage() {
  const { stores, labels, signedIn } = await loadFormData();

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
        <PageBar title="근로계약서 초안 작성" />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
          <div className="rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
            <ContractForm stores={stores} labels={labels} signedIn={signedIn} />
          </div>
        </div>
      </div>
    </div>
  );
}
