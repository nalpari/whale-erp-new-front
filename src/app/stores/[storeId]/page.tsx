import { notFound } from "next/navigation";
import { Badge, DetailTable, DetailValues, Tag, type DetailRow } from "@/components/common";
import { ApiError, getEnum } from "@/lib/api";
import { formatDateTime, formatPhone } from "@/lib/format";
import { storeImageFailureText } from "@/lib/store-image";
import { getStore } from "@/lib/stores";
import { CodeLabel } from "@/components/site/code-label";
import { formatBizNumber } from "@/lib/store-view";
import { StoreCardBody, StoreFrame } from "../store-frame";
import { StoreFloorLabel } from "../store-floor-label";
import { NoticeBand, StoreImage, StoreStatusBadge } from "../store-parts";
import { backHrefOf } from "../stores-query";
import { HistoryButton } from "./history-dialog";
import { ImageFailedNotice } from "./image-failed-notice";
import { StoreDetailActions } from "./store-detail-actions";

const muted = (text: string) => <span className="text-erp-muted">{text}</span>;
const orDash = (v: string | null | undefined) => (v ? v : muted("-"));
/** 주소 한 줄 — 「[ 우편번호 04104 ] 기본주소(볼드), 상세주소」. 괄호·라벨은 라벨 색, 번호는 기존 데이터 색(검정)이다.
 * 없으면 「-」(2026-10-19 점검 — 두 줄이던 걸 한 줄로, 번호 색·괄호 안쪽 띄어쓰기는 뒤이은 요청으로 다시 손봄) */
const addressLines = (zip: string | null, address: string | null, detail: string | null) => {
  if (!zip && !address && !detail) return muted("-");
  return (
    <span>
      {zip && (
        <span className="mr-[10px]">
          <span className="text-erp-label">[ 우편번호</span> {zip} <span className="text-erp-label">]</span>
        </span>
      )}
      {address && <b className="font-semibold">{address}</b>}
      {address && detail && ", "}
      {detail}
    </span>
  );
};
/** 파일 크기 — 1MB 이상은 MB 소수 1자리, 그 밖은 KB */

// 점포 상세(S-AGGZZG · 상태 변경 S-MNRZOM). 데모 docs/demo/stores/detail.html 의 틀 — 제목 줄 + 기본정보 · 사업자정보 나란히,
// 그 아래 기타 정보 · 층별. 변경이력은 기본정보의 버튼을 눌러 팝업으로 본다(2026-10-16 점검). 상태 변경 · 삭제는 이
// 화면의 팝업이다. 지운 점포 · 범위 밖은 404.
// 대표 이미지는 기본정보 첫 줄에 184px 로 둔다(없으면 48px 아이콘과 「등록한 이미지가 없습니다」). 등록 직후 이미지만 실패했으면 `?imageFailed=상태` 로 와서 띠를 보인다.
export default async function StoreDetailPage({ params, searchParams }: PageProps<"/stores/[storeId]">) {
  const [{ storeId: raw }, search] = await Promise.all([params, searchParams]);
  const storeId = /^\d{1,9}$/.test(raw) ? Number(raw) : 0;
  if (storeId < 1) notFound();
  const backHref = backHrefOf(search.back);

  // 운영 조건 한글(GET /enums/StoreOperationRequirement)을 못 받아도 상세는 연다 — 문구가 값 그대로 보일 뿐이다
  const [store, requirementLabels] = await Promise.all([
    getStore(storeId),
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
        <StoreImage size={184} url={store.image.url} name={store.name} />
      ) : (
        <span className="flex items-center gap-[10px]">
          <StoreImage size={48} />
          {muted("등록한 이미지가 없습니다")}
        </span>
      ),
      multiline: true,
    },
    { label: "점포코드", value: store.storeCode },
    { label: "점포 연락처", value: store.phone ? formatPhone(store.phone) : muted("-") },
    { label: "점포 주소", value: addressLines(store.zipCode, store.address, store.addressDetail), multiline: true },
    {
      label: "좌표정보",
      // 변경이력과 같은 모양 — 위도 · 경도 · 출퇴근 위치 적용 여부 각각 라벨과 같은 회색 글자를 앞에 둔다.
      value: (
        <DetailValues
          items={[
            <span key="lat">
              <span className="mr-[10px] text-erp-label">위도</span>
              {store.latitude !== null ? store.latitude.toFixed(6) : muted("-")}
            </span>,
            <span key="lng">
              <span className="mr-[10px] text-erp-label">경도</span>
              {store.longitude !== null ? store.longitude.toFixed(6) : muted("-")}
            </span>,
            <span key="loc">
              <span className="mr-[10px] text-erp-label">출퇴근 위치 적용 여부</span>
              {store.isLocationApplied ? "사용" : "미사용"}
            </span>,
          ]}
        />
      ),
    },
    { label: "재직직원", value: <span>{store.staffCount.toLocaleString("ko-KR")}명</span> },
    {
      label: "변경이력",
      // 고친 적 없으면 최종수정 값은 「-」(화면 정의서). 등록 · 최종수정 글자는 라벨과 같은 회색이다. [변경이력
      // 보기] 버튼은 DetailValues 밖에 따로 두어 앞에 구분선(|)이 안 붙게 하고, justify-between 으로 칸 맨
      // 오른쪽에 고정한다 — 칸 자체의 12px 오른쪽 여백(DetailTable dd)이 있어 따로 더 주지 않는다(2026-10-16 점검).
      value: (
        <span className="flex w-full items-center justify-between gap-[12px]">
          <DetailValues
            items={[
              <span key="c">
                <span className="mr-[10px] text-erp-label">등록</span>
                {formatDateTime(store.createdAt)} · {store.createdByName ?? "-"}
              </span>,
              <span key="u">
                <span className="mr-[10px] text-erp-label">최종수정</span>
                {store.updatedByName ? `${formatDateTime(store.updatedAt)} · ${store.updatedByName}` : muted("-")}
              </span>,
            ]}
          />
          <HistoryButton storeId={store.storeId} />
        </span>
      ),
    },
  ];
  // 미인증이면 진위확인 세 값은 「-」다. 상호명 · 연락처 · 주소 · 업태 · 종목은 인증과 상관없이 적어 둘 수 있다
  const bizRows: DetailRow[] = [
    { label: "상호명", value: orDash(b.tradeName) },
    {
      label: "사업자등록번호",
      // 번호가 마지막으로 언제 인증됐는지 바로 옆에서 보이게 한 행으로 묶었다(2026-10-16 점검).
      value: (
        <DetailValues
          items={[
            b.bizRegistrationNumber ? formatBizNumber(b.bizRegistrationNumber) : muted("-"),
            <span key="v">
              <span className="mr-[10px] text-erp-label">최종 인증일시</span>
              {b.verifiedAt ? formatDateTime(b.verifiedAt) : muted("-")}
            </span>,
          ]}
        />
      ),
    },
    {
      label: "대표자정보",
      value: (
        <DetailValues
          items={[
            <span key="name">
              <span className="mr-[10px] text-erp-label">대표자 이름</span>
              {orDash(b.ceoName)}
            </span>,
            <span key="phone">
              <span className="mr-[10px] text-erp-label">대표자 연락처</span>
              {b.ceoPhone ? formatPhone(b.ceoPhone) : muted("-")}
            </span>,
          ]}
        />
      ),
    },
    { label: "개업일자", value: orDash(b.openDate) },
    { label: "업태 · 종목", value: b.category || b.item ? <DetailValues items={[b.category ?? "-", b.item ?? "-"]} /> : muted("-") },
    { label: "사업자주소", value: addressLines(b.zipCode, b.address, b.addressDetail), multiline: true },
  ];

  const bpInactive = store.bpAccountStatusCode !== "ACTIVE";
  const imageFailure = storeImageFailureText(search.imageFailed);

  return (
    <StoreFrame>
      <StoreCardBody>
        <div className="flex flex-col gap-[12px]">
          <div className="flex items-center gap-[6px]">
            <h2 className="flex min-w-0 flex-1 items-center gap-[10px] text-[18px] font-semibold text-erp-ink">
              <span className="truncate">{store.name}</span>
            </h2>
            <StoreDetailActions store={store} backHref={backHref} requirementLabels={requirementLabels} />
          </div>
          <ImageFailedNotice message={imageFailure} />
          {bpInactive && <NoticeBand title="소속 BP 가 미사용 상태여서 이 업무를 할 수 없습니다." detail="조회만 됩니다. 등록 · 수정 · 상태 변경 · 삭제는 BP 를 다시 사용하면 할 수 있습니다." />}
          {store.storeStatusCode === "CLOSED" && (
            <NoticeBand tone="info" title="폐점한 점포는 조회만 가능하며, 수정할 수 없습니다. 다시 운영하려면 신규 점포로 등록해 주세요." />
          )}
          {/* 미운영 점포에 "운영으로 바꾸려면 ~ 필요합니다" 띠를 여기 두지 않는다(2026-10-16 디자인 점검으로 뺐다) — 같은
              안내는 상태 변경 팝업(StoreDetailActions)이 이미 missingForOperationText 로 보여준다. */}
          <div className="grid grid-cols-2 items-start gap-[24px]">
            <DetailTable
              title={
                <>
                  점포 기본정보
                  <span className="ml-[18px] inline-flex items-center gap-[8px] align-middle text-[14px] font-medium text-erp-label">
                    <Tag><CodeLabel group="STORE_TYPE" value={store.storeTypeCode} /></Tag>
                    <StoreStatusBadge status={store.storeStatusCode} />
                    {store.closedDate && <span>폐점일 {store.closedDate}</span>}
                  </span>
                </>
              }
              rows={basicRows}
            />
            <DetailTable
              title={
                <>
                  사업자정보
                  <span className="ml-[10px] inline-flex align-middle">
                    <Badge tone={b.isVerified ? "on" : "off"}>{b.isVerified ? "인증 완료" : "미인증"}</Badge>
                  </span>
                </>
              }
              rows={bizRows}
            />
          </div>
        </div>
        {/* 점포 기본정보 · 사업자정보와 같은 DetailTable — 라벨은 "층구분"이고, 지상 1층 같은 값도 매장평수(평) ·
            전용면적(㎡) · 좌석 수와 함께 오른쪽 데이터 줄에 구분선(|)으로 나열한다. 매장평수와 전용면적은 같은
            면적의 단위 차이가 아니라 서로 다른 두 항목이라(okf/stores.md S-ALHLHW) 값마다 단위를 그대로 적어
            둔다(2026-10-16 점검). */}
        <DetailTable
          title="점포 공간정보"
          rows={
            store.floors.length
              ? store.floors.map((f) => ({
                  label: "층구분",
                  value: (
                    <DetailValues
                      items={[
                        <StoreFloorLabel key="type" floor={f} />,
                        f.floorAreaPyeong === null ? muted("-") : `${f.floorAreaPyeong}평`,
                        f.floorAreaSqm === null ? muted("-") : `${f.floorAreaSqm}㎡`,
                        f.seatCount === null ? muted("-") : `${f.seatCount.toLocaleString("ko-KR")}석`,
                      ]}
                    />
                  ),
                }))
              : [{ label: "-", value: muted("등록한 층별 정보가 없습니다.") }]
          }
        />
      </StoreCardBody>
    </StoreFrame>
  );
}
