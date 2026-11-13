import { notFound, unstable_rethrow } from "next/navigation";
import { NoticeBand } from "@/components/common";
import { getEnum } from "@/lib/api";
import { getFacility, getFacilityManagerOptions } from "@/lib/facilities";
import { facilityDenied } from "../../facility-denied";
import { FacilityFormView } from "../../facility-form";
import { backHrefOf } from "../../facility-list-query";
import { FacilityCardBody, FacilityFrame, FacilityPermission } from "../../facility-parts";

// 시설물 및 장비 수정(목업 facilities-edit). 등록과 같은 폼을 상세 값으로 연다. 점포는 바꿀 수 없다(PL-1).
// 폐점 점포의 것은 조회만 된다 — 폼 대신 안내를 두고, api 도 409 로 막는다. 지운 것 · 범위 밖은 404.
export default async function EditFacilityPage({ params, searchParams }: PageProps<"/facilities/[facilityId]/edit">) {
  const [{ facilityId: raw }, search] = await Promise.all([params, searchParams]);
  const facilityId = /^\d{1,9}$/.test(raw) ? Number(raw) : 0;
  if (facilityId < 1) notFound();
  const [loaded, kindLabels] = await Promise.all([
    getFacility(facilityId).catch(facilityDenied(facilityId)),
    getEnum("FacilityDocumentKind").catch((error: unknown) => {
      console.error("문서 종류 한글 조회 실패", error);
      return [];
    }),
  ]);
  const body = async () => {
    if ("denied" in loaded) return <NoticeBand title={loaded.denied} />;
    if (loaded.store.isClosed) return <NoticeBand tone="info" title="폐점 점포의 시설물·장비는 조회만 할 수 있습니다." />;
    // 관리 담당자 선택지 — 못 받아도 폼은 연다(지금 담당자는 그대로 남는다)
    const managerOptions = await getFacilityManagerOptions(loaded.store.storeId).catch((error: unknown) => {
      unstable_rethrow(error);
      console.error("관리 담당자 조회 실패", facilityId, error);
      return [];
    });
    return (
      <FacilityPermission action="update" fallback={<NoticeBand title="시설물·장비를 수정할 권한이 없습니다." />}>
        <FacilityFormView mode="edit" facility={loaded} managerOptions={managerOptions} backHref={backHrefOf(search.back)} kindLabels={kindLabels} />
      </FacilityPermission>
    );
  };
  return (
    <FacilityFrame>
      <FacilityCardBody>{await body()}</FacilityCardBody>
    </FacilityFrame>
  );
}
