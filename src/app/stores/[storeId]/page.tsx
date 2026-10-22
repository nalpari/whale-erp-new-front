import { notFound } from "next/navigation";
import { Badge, DetailTable, DetailValues, Tag, type DetailRow } from "@/components/common";
import { getEnum } from "@/lib/api";
import { formatDateTime, formatPhone } from "@/lib/format";
import { storeImageFailureText } from "@/lib/store-image";
import { getStore } from "@/lib/stores";
import { CodeLabel } from "@/components/site/code-label";
import { formatBizNumber, hasStoreCoordinates } from "@/lib/store-view";
import { StoreCardBody, StoreDenied, StoreFrame, storeDenied } from "../store-frame";
import { StoreFloorLabel } from "../store-floor-label";
import { NoticeBand, StoreImage, StoreStatusBadge } from "../store-parts";
import { backHrefOf } from "../stores-query";
import { HistoryButton } from "./history-dialog";
import { ImageFailedNotice } from "./image-failed-notice";
import { StoreDetailActions } from "./store-detail-actions";

const muted = (text: string) => <span className="text-erp-muted">{text}</span>;
const orDash = (v: string | null | undefined) => (v ? v : muted("-"));
/** DetailValues 로 값을 여럿 늘어놓는 줄들의 첫 칸(들) 너비 — 사업자등록번호 · 대표자정보, 위치정보의
 * 위도 · 경도처럼 같은 표 안에서 짝을 이루는 줄들이 값이 비어 있을 때도 구분선(|)이 들쑥날쑥하지 않게 맞춘다
 * (2026-10-19 점검 — 실사용자 확인). 변경이력 줄은 이 너비를 쓰지 않는다 — flex-1 + 말줄임으로 따로 맞춘다
 * (아래 변경이력 주석 참고). */
const FIRST_COLUMN_WIDTH = "inline-block min-w-[140px]";
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
    getStore(storeId).catch(storeDenied),
    getEnum("StoreOperationRequirement").catch((error: unknown) => {
      console.error("운영 조건 한글 조회 실패", storeId, error);
      return [];
    }),
  ]);
  if ("denied" in store) return <StoreDenied message={store.denied} />;

  const b = store.business;
  // 대표 이미지만 표에 두지 않고 제목 줄의 머리 카드로 옮겼다(2026-10-19 점검 — 실사용자 확인, 디자인 데모
  // 1안 채택). 표 맨 위는 점포코드에서 점포상태로 바꿨다 — 머리 카드에는 더는 상태 배지가 없어(정보 중복으로
  // 뺐다) 이 표가 유일하게 상태를 보여준다.
  const basicRows: DetailRow[] = [
    { label: "점포상태", value: <StoreStatusBadge status={store.storeStatusCode} /> },
    { label: "점포 연락처", value: store.phone ? formatPhone(store.phone) : muted("-") },
    { label: "점포주소", value: addressLines(store.zipCode, store.address, store.addressDetail), multiline: true },
    {
      label: "위치정보",
      // 변경이력과 같은 모양 — 위도 · 경도 · 출퇴근 위치 적용 여부 각각 라벨과 같은 회색 글자를 앞에 둔다.
      // 위도 · 경도 칸은 변경이력 줄의 등록 칸과 너비를 맞춰, 둘 다 비어 있을 때도 구분선(|)이 들쑥날쑥하지
      // 않게 한다(2026-10-19 점검 — 실사용자 확인).
      value: (
        <DetailValues
          items={[
            <span key="lat" className={FIRST_COLUMN_WIDTH}>
              <span className="mr-[10px] text-erp-label">위도</span>
              {store.latitude !== null ? store.latitude.toFixed(6) : muted("-")}
            </span>,
            <span key="lng" className={FIRST_COLUMN_WIDTH}>
              <span className="mr-[10px] text-erp-label">경도</span>
              {store.longitude !== null ? store.longitude.toFixed(6) : muted("-")}
            </span>,
            <span key="loc">
              <span className="mr-[10px] text-erp-label">출퇴근 위치 적용 여부</span>
              {/* 좌표가 없으면 저장된 값과 상관없이 미사용으로 보인다 — 주소가 아니라 좌표로 가린다(수정 화면 ·
                  bodyOf 와 같은 규칙, 2026-10-19 점검 — 실사용자 확인, 코드 리뷰로 주소에서 좌표로 바꿈). */}
              {hasStoreCoordinates(store.latitude, store.longitude) && store.isLocationApplied ? "사용" : "미사용"}
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
      // 등록 · 최종수정은 DetailValues(inline-block) 대신 flex-1 + truncate 로 직접 그린다 — 처리자 이름이
      // 길면(예: 테스트 계정명) 고정폭을 넘어 [변경이력] 버튼을 dd 밖으로 밀어내 잘리는 문제가 있었다. 두 값이
      // 남는 폭을 반씩 나눠 가지며 길면 말줄임되므로 버튼은 항상 자리를 지킨다(2026-10-19 점검 — 실사용자 확인).
      value: (
        <span className="flex w-full items-center gap-[12px]">
          <span className="flex min-w-0 flex-1 items-center gap-[10px]">
            <span className="min-w-0 flex-1 truncate">
              <span className="mr-[10px] text-erp-label">등록</span>
              {formatDateTime(store.createdAt)} · {store.createdByName ?? "-"}
            </span>
            {/* #d9d9d9 — DESIGN.md 의 값 구분선, Figma 전용 색이라 토큰이 없다 */}
            <span className="h-[11px] w-px shrink-0 bg-[#d9d9d9]" />
            <span className="min-w-0 flex-1 truncate">
              <span className="mr-[10px] text-erp-label">최종수정</span>
              {store.updatedByName ? `${formatDateTime(store.updatedAt)} · ${store.updatedByName}` : muted("-")}
            </span>
          </span>
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
      // 첫 칸은 대표자정보 줄의 "대표자 이름 …" 칸과 너비를 맞춰, 둘 다 비어 있을 때도 세로선(|) 위치가
      // 들쑥날쑥하지 않게 한다(2026-10-19 점검 — 실사용자 확인, FIRST_COLUMN_WIDTH 참고).
      value: (
        <DetailValues
          items={[
            <span key="n" className={FIRST_COLUMN_WIDTH}>
              {b.bizRegistrationNumber ? formatBizNumber(b.bizRegistrationNumber) : muted("-")}
            </span>,
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
            <span key="name" className={FIRST_COLUMN_WIDTH}>
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
    {
      label: "업태 · 종목",
      value:
        b.category || b.item ? (
          <span className="inline-flex items-center gap-[10px]">
            {b.category || muted("-")}
            {/* #d9d9d9 — DESIGN.md 의 값 구분선, Figma 전용 색이라 토큰이 없다 */}
            <span className="h-[11px] w-px bg-[#d9d9d9]" />
            {b.item || muted("-")}
          </span>
        ) : (
          muted("-")
        ),
    },
    { label: "사업자주소", value: addressLines(b.zipCode, b.address, b.addressDetail), multiline: true },
  ];

  const bpInactive = store.bpAccountStatusCode !== "ACTIVE";
  const imageFailure = storeImageFailureText(search.imageFailed);

  return (
    <StoreFrame>
      <StoreCardBody>
        <div className="flex flex-col gap-[12px]">
          {/* 대표 이미지 · 점포명 · 점포코드 · 유형 · 폐점일 · 실행 버튼을 한 머리 카드에 묶는다(2026-10-19 점검 —
              실사용자 확인, 디자인 데모 1안 채택). 운영 상태는 아래 점포 기본정보 표의 점포상태 줄로만 보인다
              (바로 아래 주석 참고). 이미지가 없으면 48px 아이콘(목록 카드와 같은 크기)을 그대로 쓴다 — 머리 카드
              전용 72px 칸 안에 작게 보인다. */}
          <div className="flex items-center gap-[18px] rounded-[4px] border border-erp-panel-line bg-white p-[18px]">
            {store.image ? (
              <StoreImage size={72} url={store.image.url} name={store.name} />
            ) : (
              <StoreImage size={48} />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-[12px]">
              <h2 className="truncate text-[18px] font-semibold text-erp-ink">{store.name}</h2>
              {/* 운영 상태 배지는 여기 두지 않는다 — 점포 기본정보 표의 점포상태 줄과 정보가 겹쳐 보였다
                  (2026-10-19 점검 — 실사용자 확인). */}
              <div className="flex items-center gap-[10px] text-[14px] font-medium text-erp-label">
                <span>점포코드 {store.storeCode}</span>
                {/* #d9d9d9 — DESIGN.md 의 값 구분선, Figma 전용 색이라 토큰이 없다 */}
                <span className="h-[11px] w-px bg-[#d9d9d9]" />
                <Tag><CodeLabel group="STORE_TYPE" value={store.storeTypeCode} /></Tag>
                {store.closedDate && <span>폐점일 {store.closedDate}</span>}
              </div>
            </div>
            <div className="flex shrink-0 gap-[6px]">
              <StoreDetailActions store={store} backHref={backHref} requirementLabels={requirementLabels} />
            </div>
          </div>
          <ImageFailedNotice message={imageFailure} />
          {bpInactive && <NoticeBand title="소속 BP 가 미사용 상태여서 이 업무를 할 수 없습니다." detail="조회만 됩니다. 등록 · 수정 · 상태 변경 · 삭제는 BP 를 다시 사용하면 할 수 있습니다." />}
          {store.storeStatusCode === "CLOSED" && (
            <NoticeBand tone="info" title="폐점한 점포는 조회만 가능하며, 수정할 수 없습니다. 다시 운영하려면 신규 점포로 등록해 주세요." />
          )}
          {/* 미운영 점포에 "운영으로 바꾸려면 ~ 필요합니다" 띠를 여기 두지 않는다(2026-10-16 디자인 점검으로 뺐다) — 같은
              안내는 상태 변경 팝업(StoreDetailActions)이 이미 운영 조건 체크리스트로 보여준다(2026-10-19 점검 — 실사용자 확인). */}
          <div className="grid grid-cols-2 items-start gap-[24px]">
            {/* 유형 태그는 위 머리 카드로 옮겨 여기서는 다시 적지 않는다. 상태는 배지 대신 표 맨 위 점포상태
                줄로 보인다(2026-10-19 점검). */}
            <DetailTable title="점포 기본정보" rows={basicRows} />
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
              : [{ label: "층구분", value: muted("등록한 층별 정보가 없습니다.") }]
          }
        />
      </StoreCardBody>
    </StoreFrame>
  );
}
