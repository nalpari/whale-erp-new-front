import { NoticeBand } from "../store-parts";
import { getStorePermission } from "@/lib/current-permission";
import { StoreCardBody, StoreFrame } from "../store-frame";
import { StoreFormView } from "../store-form-view";
import { backHrefOf } from "../stores-query";
import { getStoreImageTypes } from "@/lib/stores";

// 점포 등록(S-ALHLHW). 목록 옆 패널이 아니라 별도 화면이다(재영 결정). 미운영으로 생기고 점포코드는 서버가 매긴다.
// 가맹 마스터 · 가맹 관리자는 등록하지 못한다 — 화면은 권한(manage)만 보고, 역할 판정은 api 가 403 으로 막는다.
export default async function NewStorePage({ searchParams }: PageProps<"/stores/new">) {
  const search = await searchParams;
  const manage = getStorePermission(search) === "manage";
  const imageTypes = manage ? await getStoreImageTypes() : [];
  return (
    <StoreFrame>
      <StoreCardBody>
        {manage ? (
          <StoreFormView mode="create" backHref={backHrefOf(search.back)} imageTypes={imageTypes} />
        ) : (
          <NoticeBand title="점포를 등록할 권한이 없습니다." />
        )}
      </StoreCardBody>
    </StoreFrame>
  );
}
