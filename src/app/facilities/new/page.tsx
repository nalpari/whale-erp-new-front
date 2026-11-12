import { NoticeBand } from "@/components/common";
import { deniedMessageOf, getEnum } from "@/lib/api";
import { getFacilityStoreOptions } from "@/lib/facilities";
import { FacilityFormView } from "../facility-form";
import { backHrefOf } from "../facility-list-query";
import { FacilityCardBody, FacilityFrame, FacilityPermission } from "../facility-parts";

// 시설물 및 장비 등록. 목록 옆 패널이 아니라 별도 화면이다(목업 facilities-new). 점포 선택지는 GET /facilities/store-options(폐점 제외).
// 등록 권한이 없으면 폼 대신 안내를 둔다 — 막는 것은 api 다.
export default async function NewFacilityPage({ searchParams }: PageProps<"/facilities/new">) {
  const search = await searchParams;
  const [storeOptions, kindLabels] = await Promise.all([
    getFacilityStoreOptions(false).catch((e: unknown) => {
      const notice = deniedMessageOf(e);
      if (notice === null) throw e;
      return { notice };
    }),
    getEnum("FacilityDocumentKind").catch((error: unknown) => {
      console.error("문서 종류 한글 조회 실패", error);
      return [];
    }),
  ]);
  return (
    <FacilityFrame>
      <FacilityCardBody>
        {"notice" in storeOptions ? (
          <NoticeBand title={storeOptions.notice} />
        ) : (
          <FacilityPermission action="create" fallback={<NoticeBand title="시설물·장비를 등록할 권한이 없습니다." />}>
            <FacilityFormView mode="create" storeOptions={storeOptions} backHref={backHrefOf(search.back)} kindLabels={kindLabels} />
          </FacilityPermission>
        )}
      </FacilityCardBody>
    </FacilityFrame>
  );
}
