import { notFound } from "next/navigation";
import { getEnum } from "@/lib/api";
import { getStore, getStoreImageTypes } from "@/lib/stores";
import { StoreCardBody, StoreDenied, StoreFrame, storeDenied } from "../../store-frame";
import { StoreFormView } from "../../store-form-view";
import { NoticeBand } from "../../store-parts";
import { StorePermission } from "../../store-permission";
import { backHrefOf } from "../../stores-query";

// 점포 수정(S-JEPOMK). 등록과 같은 폼을 상세 값으로 연다. 폐점 점포 · 소속 BP 미사용은 폼이 막고, api 도 409 로 막는다.
// 지운 점포 · 범위 밖은 404.
export default async function EditStorePage({ params, searchParams }: PageProps<"/stores/[storeId]/edit">) {
  const [{ storeId: raw }, search] = await Promise.all([params, searchParams]);
  const storeId = /^\d{1,9}$/.test(raw) ? Number(raw) : 0;
  if (storeId < 1) notFound();

  const [store, imageTypes, requirementLabels] = await Promise.all([
    getStore(storeId).catch(storeDenied(storeId)),
    getStoreImageTypes(),
    // 운영 조건 한글(GET /enums/StoreOperationRequirement) — 못 받아도 화면은 연다, 문구가 값 그대로 보일 뿐이다
    getEnum("StoreOperationRequirement").catch((error: unknown) => {
      console.error("운영 조건 한글 조회 실패", storeId, error);
      return [];
    }),
  ]);
  if ("denied" in store) return <StoreDenied message={store.denied} />;

  return (
    <StoreFrame>
      <StoreCardBody>
        <StorePermission action="update" fallback={<NoticeBand title="점포를 수정할 권한이 없습니다." />}>
          <StoreFormView mode="edit" store={store} backHref={backHrefOf(search.back)} imageTypes={imageTypes} requirementLabels={requirementLabels} />
        </StorePermission>
      </StoreCardBody>
    </StoreFrame>
  );
}
