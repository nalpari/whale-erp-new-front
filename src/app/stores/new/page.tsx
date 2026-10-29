import { NoticeBand } from "@/components/common";
import { getStoreImageTypes } from "@/lib/stores";
import { StoreCardBody, StoreFrame } from "../store-frame";
import { StoreFormView } from "../store-form-view";
import { StorePermission } from "../store-permission";
import { backHrefOf } from "../stores-query";

// 점포 등록(S-ALHLHW). 목록 옆 패널이 아니라 별도 화면이다(재영 결정). 미운영으로 생기고 점포코드는 서버가 매긴다.
// 가맹 마스터 · 가맹 관리자는 등록하지 못한다 — 화면은 메뉴 등록 권한만 보고, 역할 판정은 api 가 403 으로 막는다.
export default async function NewStorePage({ searchParams }: PageProps<"/stores/new">) {
  const search = await searchParams;
  const imageTypes = await getStoreImageTypes();
  return (
    <StoreFrame>
      <StoreCardBody>
        <StorePermission action="create" fallback={<NoticeBand title="점포를 등록할 권한이 없습니다." />}>
          <StoreFormView mode="create" backHref={backHrefOf(search.back)} imageTypes={imageTypes} />
        </StorePermission>
      </StoreCardBody>
    </StoreFrame>
  );
}
