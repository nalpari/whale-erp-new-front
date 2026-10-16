import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getStore, getStoreImageTypes } from "@/lib/stores";
import { StoreCardBody, StoreFrame } from "../../store-frame";
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

  const [store, imageTypes] = await Promise.all([
    getStore(storeId).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) notFound();
      throw error;
    }),
    getStoreImageTypes(),
  ]);

  return (
    <StoreFrame>
      <StoreCardBody>
        <StorePermission action="update" fallback={<NoticeBand title="점포를 수정할 권한이 없습니다." />}>
          <StoreFormView mode="edit" store={store} backHref={backHrefOf(search.back)} imageTypes={imageTypes} />
        </StorePermission>
      </StoreCardBody>
    </StoreFrame>
  );
}
