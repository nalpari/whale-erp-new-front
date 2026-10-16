import { notFound } from "next/navigation";
import { DataTable, DetailTable, DetailValues, type DetailRow } from "@/components/common";
import { ApiError, getEnum } from "@/lib/api";
import { formatDateTime, formatPhone } from "@/lib/format";
import { storeImageFailureText } from "@/lib/store-image";
import type { StoreFloor } from "@/lib/store-types";
import { getStore, getStoreHistories } from "@/lib/stores";
import { CodeLabel } from "@/components/site/code-label";
import { formatBizNumber, missingForOperationText } from "@/lib/store-view";
import { StoreCardBody, StoreFrame } from "../store-frame";
import { StoreFloorLabel } from "../store-floor-label";
import { NoticeBand, StoreImage, StoreStatusBadge } from "../store-parts";
import { backHrefOf } from "../stores-query";
import { ImageFailedNotice } from "./image-failed-notice";
import { StoreDetailActions } from "./store-detail-actions";
import { StoreHistories } from "./store-histories";

const muted = (text: string) => <span className="text-erp-muted">{text}</span>;
const orDash = (v: string | null | undefined) => (v ? v : muted("-"));
/** 주소 세 줄 — 우편번호 · 기본주소 · 상세주소. 없으면 「-」 */
const addressLines = (zip: string | null, address: string | null, detail: string | null) => {
  const lines = [zip, address, detail].filter((line): line is string => Boolean(line));
  return lines.length ? <span className="flex flex-col">{lines.map((line, i) => <span key={i}>{line}</span>)}</span> : muted("-");
};
/** 파일 크기 — 1MB 이상은 MB 소수 1자리, 그 밖은 KB */
const fileSizeText = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`);
const whoAndWhen = (at: string | null, who: string | null) => (at ? <DetailValues items={[formatDateTime(at), who ?? "-"]} /> : muted("-"));

// 점포 상세(S-AGGZZG · 상태 변경 S-MNRZOM). 데모 docs/demo/stores/detail.html 의 틀 — 제목 줄 + 기본정보 · 사업자정보 나란히,
// 그 아래 기타 정보 · 층별과 변경 이력. 상태 변경 · 삭제는 이 화면의 팝업이다. 지운 점포 · 범위 밖은 404.
// 대표 이미지는 기본정보 첫 줄에 184px 로 둔다(없으면 48px 아이콘과 「등록한 이미지가 없습니다」). 등록 직후 이미지만 실패했으면 `?imageFailed=상태` 로 와서 띠를 보인다.
export default async function StoreDetailPage({ params, searchParams }: PageProps<"/stores/[storeId]">) {
  const [{ storeId: raw }, search] = await Promise.all([params, searchParams]);
  const storeId = /^\d{1,9}$/.test(raw) ? Number(raw) : 0;
  if (storeId < 1) notFound();
  const backHref = backHrefOf(search.back);

  // 이력만 실패하면 상세는 그대로 보이고 이력 칸에만 알린다(전체를 오류 화면으로 보내지 않는다)
  // 운영 조건 한글(GET /enums/StoreOperationRequirement)을 못 받아도 상세는 연다 — 문구가 값 그대로 보일 뿐이다
  const [store, histories, requirementLabels] = await Promise.all([
    getStore(storeId),
    getStoreHistories(storeId).catch((error: unknown) => {
      console.error("점포 변경 이력 조회 실패", storeId, error);
      return null;
    }),
    getEnum("StoreOperationRequirement").catch((error: unknown) => {
      console.error("운영 조건 한글 조회 실패", error);
      return [];
    }),
  ]).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });

  const b = store.business;
  const basicRows: DetailRow[] = [
    {
      label: "대표 이미지",
      value: store.image ? (
        <span className="flex items-end gap-[12px]">
          <StoreImage size={184} url={store.image.url} name={store.name} />
          <span className="flex min-w-0 flex-col gap-[4px] text-[13px] text-erp-label">
            <span className="truncate">{store.image.fileName}</span>
            <span>{fileSizeText(store.image.sizeBytes)}</span>
            {!store.image.url && <span>이미지 저장소를 지금 쓸 수 없어 미리보기를 보이지 못합니다.</span>}
          </span>
        </span>
      ) : (
        <span className="flex items-center gap-[10px]">
          <StoreImage size={48} />
          {muted("등록한 이미지가 없습니다")}
        </span>
      ),
      multiline: true,
    },
    { label: "점포코드", value: store.storeCode },
    { label: "점포유형", value: <CodeLabel group="STORE_TYPE" value={store.storeTypeCode} /> },
    {
      label: "점포상태",
      value: (
        <DetailValues
          items={[<StoreStatusBadge key="s" status={store.storeStatusCode} />, ...(store.closedDate ? [`폐점일 ${store.closedDate}`] : [])]}
        />
      ),
    },
    {
      label: "근무직원 수",
      value: (
        <span>
          {store.staffCount.toLocaleString("ko-KR")}명 <span className="text-erp-label">재직 직원</span>
        </span>
      ),
    },
    { label: "점포 연락처", value: store.phone ? formatPhone(store.phone) : muted("-") },
    { label: "주소", value: addressLines(store.zipCode, store.address, store.addressDetail), multiline: true },
    {
      label: "위도 · 경도",
      value: store.latitude !== null && store.longitude !== null ? <DetailValues items={[store.latitude.toFixed(6), store.longitude.toFixed(6)]} /> : muted("-"),
    },
    { label: "위치 적용 여부", value: store.isLocationApplied ? "사용" : "미사용" },
    { label: "등록일시", value: whoAndWhen(store.createdAt, store.createdByName) },
    // 고친 적 없으면 「-」(화면 정의서)
    { label: "최종수정일시", value: store.updatedByName ? whoAndWhen(store.updatedAt, store.updatedByName) : muted("-") },
  ];
  // 미인증이면 진위확인 세 값은 「-」다. 상호명 · 연락처 · 주소 · 업태 · 종목은 인증과 상관없이 적어 둘 수 있다
  const bizRows: DetailRow[] = [
    { label: "사업자등록번호", value: b.bizRegistrationNumber ? formatBizNumber(b.bizRegistrationNumber) : muted("-") },
    { label: "대표자명", value: orDash(b.ceoName) },
    { label: "상호명", value: orDash(b.tradeName) },
    { label: "사업자주소", value: addressLines(b.zipCode, b.address, b.addressDetail), multiline: true },
    { label: "업태 · 종목", value: b.category || b.item ? <DetailValues items={[b.category ?? "-", b.item ?? "-"]} /> : muted("-") },
    { label: "개업일자", value: orDash(b.openDate) },
    { label: "대표자 연락처", value: b.ceoPhone ? formatPhone(b.ceoPhone) : muted("-") },
    { label: "최종 인증일시", value: b.verifiedAt ? formatDateTime(b.verifiedAt) : muted("-") },
  ];

  const bpInactive = store.bpAccountStatusCode !== "ACTIVE";
  const imageFailure = storeImageFailureText(search.imageFailed);
  const operationHint = store.storeStatusCode === "NOT_OPERATING" ? missingForOperationText(store.transitions.missingForOperation, requirementLabels) : null;

  return (
    <StoreFrame>
      <StoreCardBody>
        <div className="flex flex-col gap-[12px]">
          <div className="flex items-center gap-[6px]">
            <h2 className="flex min-w-0 flex-1 items-center gap-[10px] text-[18px] font-semibold text-erp-ink">
              <span className="truncate">{store.name}</span>
              <span className="shrink-0 text-[14px] font-medium text-erp-label"><CodeLabel group="STORE_TYPE" value={store.storeTypeCode} /></span>
            </h2>
            <StoreDetailActions store={store} backHref={backHref} requirementLabels={requirementLabels} />
          </div>
          <ImageFailedNotice message={imageFailure} />
          {bpInactive && <NoticeBand title="소속 BP 가 미사용 상태여서 이 업무를 할 수 없습니다." detail="조회만 됩니다. 등록 · 수정 · 상태 변경 · 삭제는 BP 를 다시 사용하면 할 수 있습니다." />}
          {store.storeStatusCode === "CLOSED" && (
            <NoticeBand tone="info" title="폐점 점포는 수정할 수 없고 조회만 됩니다." detail="다시 운영하려면 새 점포로 등록하세요." />
          )}
          {!bpInactive && operationHint && <NoticeBand tone="info" title={operationHint} detail="수정 화면에서 채운 뒤 상태 변경으로 운영으로 바꿀 수 있습니다." />}
          <div className="grid grid-cols-2 items-start gap-[24px]">
            <DetailTable title="점포 기본정보" rows={basicRows} />
            <DetailTable title={`점포 사업자정보 · ${b.isVerified ? "인증 완료" : "미인증"}`} rows={bizRows} />
          </div>
        </div>
        <div className="flex flex-col gap-[12px]">
          <h3 className="text-[18px] font-semibold text-erp-ink">기타 정보 · 층별</h3>
          <DataTable<StoreFloor>
            columns={[
              { header: "층", cell: (f) => <StoreFloorLabel floor={f} /> },
              { header: "매장평수", cell: (f) => (f.floorAreaPyeong === null ? "-" : `${f.floorAreaPyeong}평`) },
              { header: "전용면적", cell: (f) => (f.floorAreaSqm === null ? "-" : `${f.floorAreaSqm}㎡`) },
              { header: "좌석수", cell: (f) => (f.seatCount === null ? "-" : `${f.seatCount.toLocaleString("ko-KR")}석`) },
            ]}
            rows={store.floors}
            rowKey={(f) => String(f.storeFloorId)}
            empty="등록한 층별 정보가 없습니다."
          />
        </div>
        <StoreHistories key={histories?.items[0]?.changeId ?? 0} storeId={store.storeId} initial={histories} />
      </StoreCardBody>
    </StoreFrame>
  );
}
