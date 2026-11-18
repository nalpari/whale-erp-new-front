import { notFound } from "next/navigation";
import { Badge, DetailTable, DetailValues, NoticeBand, Tag, type DetailRow } from "@/components/common";
import { getEnum } from "@/lib/api";
import { formatDateTime, formatPhone, wasUpdated } from "@/lib/format";
import { storeImageFailureText } from "@/lib/store-image";
import { getStore } from "@/lib/stores";
import { CodeLabel } from "@/components/site/code-label";
import { LocationApplyTip } from "@/components/site/location-apply-field";
import { formatBizNumber, hasStoreCoordinates } from "@/lib/store-view";
import { StoreCardBody, StoreDenied, StoreFrame, storeDenied } from "../store-frame";
import { StoreFloorLabel } from "../store-floor-label";
import { LineIcon, StoreStatusBadge } from "../store-parts";
import { backHrefOf } from "../stores-query";
import { HistoryButton } from "./history-dialog";
import { ImageFailedNotice } from "./image-failed-notice";
import { StoreDetailActions } from "./store-detail-actions";
import { StorePhotoViewer } from "./store-photo-viewer";

const muted = (text: string) => <span className="text-erp-muted">{text}</span>;
const orDash = (v: string | null | undefined) => (v ? v : muted("-"));
/** 기본정보 표의 라벨 칸 — 「출퇴근 위치적용」 + 도움말 i 가 한 줄에 들도록 110 → 140(2026-11-18 사용자 지정 · 1260 작업) */
const BASIC_LABEL_WIDTH = "w-[140px]";
/** DetailValues 로 값을 여럿 늘어놓는 줄들의 첫 칸 너비 — 사업자등록번호 · 대표자정보처럼 같은 표 안에서 짝을 이루는 줄들이
 * 값이 비어 있을 때도 구분선(|)이 들쑥날쑥하지 않게 맞춘다(2026-10-19 점검 — 실사용자 확인). */
const FIRST_COLUMN_WIDTH = "inline-block min-w-[140px]";
/** 위치정보 줄의 위도 — 고정폭 없이 값만큼(약 98px). 전엔 변경이력 줄의 구분선과 맞추려 100px 고정이었는데, 그 줄을 따로 상자로 빼(2026-11-18) 맞출 줄이 없어졌고 2px 이 1366 창 한 줄을 막았다 */
const LAT_WIDTH = "whitespace-nowrap";
/** 대표 이미지 — 194px(2026-11-03 사용자 지정 — 206 에서 조금 줄임). 사진 옆은 여섯 줄(46px × 6 = 276)이라 칸 세로 가운데에 둔다(2026-11-18 — 출퇴근 위치적용을 따로 한 줄로) */
const PHOTO_BOX = "size-[194px]";
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
    getStore(storeId).catch(storeDenied(storeId)),
    getEnum("StoreOperationRequirement").catch((error: unknown) => {
      console.error("운영 조건 한글 조회 실패", storeId, error);
      return [];
    }),
  ]);
  if ("denied" in store) return <StoreDenied message={store.denied} />;

  const b = store.business;
  // 대표 이미지는 점포 기본정보 카드 안 왼쪽에 둔다 — 머리 카드의 72px 은 작다는 의견이 있었다(2026-11-03 사용자 지정, 전엔 2026-10-19 머리 카드).
  // 표 맨 위는 점포상태다 — 점포명 줄에는 상태 배지가 없어(정보 중복으로 뺐다) 이 표가 유일하게 상태를 보여준다.
  const basicRows: DetailRow[] = [
    { label: "점포상태", value: <StoreStatusBadge status={store.storeStatusCode} /> },
    { label: "점포 연락처", value: store.phone ? formatPhone(store.phone) : muted("-") },
    { label: "점포주소", value: addressLines(store.zipCode, store.address, store.addressDetail), multiline: true },
    {
      label: "위치정보",
      // 위도 · 경도 각각 라벨과 같은 회색 글자를 앞에 둔다. 출퇴근 위치적용은 아래 따로 한 줄 — 한 줄에 셋을 두면 1536 창 좌우 배치에서
      // 칸 밖으로 밀려 안 보였다(2026-11-18 사용자 지정 · 1260 작업). 등록 · 수정 화면에서도 따로 있는 칸이다.
      // 값 칸에 「위도 … | 경도 …」가 다 안 들어갈 때만(1260 창 좌우 배치) 경도가 아랫줄로 내려간다(flex-wrap). 구분선은 항목마다 앞에 붙이고
      // 줄 왼쪽 끝으로 밀어 잘라 내므로(-ml-[11px] + overflow-hidden), 줄 첫 항목 앞에는 구분선이 보이지 않는다
      multiline: true,
      value: (
        <span className="block w-full min-w-0 overflow-hidden">
          <span className="-ml-[11px] flex flex-wrap items-center gap-x-[10px]">
            {[
              <span key="lat" className={LAT_WIDTH}>
                <span className="mr-[10px] text-erp-label">위도</span>
                {store.latitude !== null ? store.latitude.toFixed(6) : muted("-")}
              </span>,
              <span key="lng" className="whitespace-nowrap">
                <span className="mr-[10px] text-erp-label">경도</span>
                {store.longitude !== null ? store.longitude.toFixed(6) : muted("-")}
              </span>,
            ].map((item) => (
              <span key={item.key} className="flex items-center gap-[10px]">
                {/* #d9d9d9 — DESIGN.md 의 값 구분선, Figma 전용 색이라 토큰이 없다 */}
                <span className="h-[11px] w-px shrink-0 bg-[#d9d9d9]" />
                {item}
              </span>
            ))}
          </span>
        </span>
      ),
    },
    {
      label: "출퇴근 위치적용",
      // 라벨 옆 도움말 i — 등록 · 수정 화면과 같은 사용 · 미사용 표(2026-11-17 사용자 지정)
      help: <LocationApplyTip />,
      // 좌표가 없으면 저장된 값과 상관없이 미사용으로 보인다 — 주소가 아니라 좌표로 가린다(수정 화면 · bodyOf 와 같은 규칙, 2026-10-19 점검 —
      // 실사용자 확인, 코드 리뷰로 주소에서 좌표로 바꿈)
      value: hasStoreCoordinates(store.latitude, store.longitude) && store.isLocationApplied ? "사용" : "미사용",
    },
    { label: "재직직원", value: <span>{store.staffCount.toLocaleString("ko-KR")}명</span> },
  ];
  // 등록 · 최종수정 — 기본정보 카드에서 빼 사업자정보 아래 따로 둔 상자(2026-11-18 사용자 지정 · 1260 작업, 전엔 기본정보 사진 아래 「변경이력」 줄).
  // [변경이력] 버튼은 위 제목 줄의 [상태 변경] [삭제] [수정] [목록] 앞에 있다. 고친 적 없으면(최종수정일시가 등록일시와 같으면, wasUpdated)
  // 최종수정 값은 「-」(화면 정의서 · 2026-10-27 사용자 요청)
  const historyRows: DetailRow[] = [
    { label: "등록", value: `${formatDateTime(store.createdAt)} · ${store.createdByName ?? "-"}` },
    {
      label: "최종수정",
      value: wasUpdated(store.createdAt, store.updatedAt) ? `${formatDateTime(store.updatedAt)} · ${store.updatedByName ?? "-"}` : muted("-"),
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
  // 사진이 없으면 원래 쓰던 회색 바탕 · 점포 아이콘(2026-11-03 사용자 지정)
  const noPhoto = (
    <span role="img" aria-label="대표 이미지 없음" className={`grid shrink-0 place-items-center rounded-[8px] bg-erp-thead-bg text-erp-label ${PHOTO_BOX}`}>
      <LineIcon name="store" size={48} />
    </span>
  );

  return (
    <StoreFrame>
      <StoreCardBody>
        <div className="flex flex-col gap-[12px]">
          {/* 소속 BP 가 미사용인지 탈퇴인지 상태 이름(공통코드 ACCOUNT_STATUS)으로 밝힌다(2026-10-28 사용자 지정 — 전엔 늘 「미사용」). 문구는 「이 점포가 속한 BP가 … 상태로, 조회 기능만 이용할 수 있습니다.」(사용자 지정).
              미사용 · 탈퇴 BP 의 점포는 플랫폼 사용자만 열 수 있어 그들에게만 보인다 — 점포명 머리 카드 위에 둔다(2026-10-28 사용자 지정) */}
          {bpInactive && <NoticeBand title={<>이 점포가 속한 BP가 <CodeLabel group="ACCOUNT_STATUS" value={store.bpAccountStatusCode} /> 상태로, 조회 기능만 이용할 수 있습니다.</>} />}
          {/* 점포명 · 점포코드 · 유형 · 폐점일 · 실행 버튼을 한 줄에 묶는다(2026-10-19 점검 — 실사용자 확인). 운영 상태는 아래 점포 기본정보 표의
              점포상태 줄로만 보인다. 대표 이미지는 점포 기본정보 카드로 옮기고, 테두리를 빼고 점포명을 20px 로 키웠다(2026-11-03 사용자 지정). */}
          <div className="flex items-center gap-[18px] py-[6px]">
            {/* 점포명과 점포코드 줄 사이는 6px — 12px 는 떨어져 보였다(2026-10-23 사용자 요청) */}
            <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
              <h2 className="truncate text-[20px] font-semibold text-erp-ink">{store.name}</h2>
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
          {/* 폐점 안내는 한 줄로(2026-11-03 사용자 지정) */}
          {store.storeStatusCode === "CLOSED" && <NoticeBand tone="info" title="폐점 점포는 조회만 할 수 있습니다. 영업을 다시 시작하려면 신규 점포로 등록해 주세요." />}
          {/* 미운영 점포에 "운영으로 바꾸려면 ~ 필요합니다" 띠를 여기 두지 않는다(2026-10-16 디자인 점검으로 뺐다) — 같은
              안내는 상태 변경 팝업(StoreDetailActions)이 이미 운영 조건 체크리스트로 보여준다(2026-10-19 점검 — 실사용자 확인). */}
          {/* 두 줄 두 칸 — 윗줄 기본정보 | 사업자정보, 아랫줄 공간정보 | 변경이력. 줄마다 높이를 맞춰 공간정보 · 변경이력 제목 줄이 같은 높이에
              선다(2026-11-18 사용자 지정 · 1260 작업, 전엔 공간정보가 아래에서 카드 폭을 다 썼다). 1260 창까지 나란히 둔다 — 등록 · 최종수정을
              따로 상자로 빼고 출퇴근 위치적용을 따로 한 줄로 빼니 좁은 창에서도 들어갔다(1366 은 그대로, 1260 은 위치정보의 경도만 아랫줄로).
              창이 1260 미만이면(틀은 1260 으로 가로 스크롤) 기본정보 → 공간정보 → 사업자정보 → 변경이력 순서로 위아래로 쌓는다(order, 사용자 지정).
              유형 태그는 위 점포명 줄로 옮겨 여기서는 다시 적지 않는다. 상태는 배지 대신 표 맨 위 점포상태 줄로 보인다(2026-10-19 점검). */}
          <div className="grid grid-cols-1 items-start gap-[24px] min-[1260px]:grid-cols-2">
            <div className="order-1 min-[1260px]:order-none">
              {/* 사진 칸 — 위쪽에 붙이고, 표와 사이 세로선은 두지 않는다(2026-11-03 사용자 지정). 칸에 맞게 가운데를 잘라 채우고 누르면 원본을 크게 본다 */}
              <DetailTable
                title="점포 기본정보"
                rows={basicRows}
                labelWidth={BASIC_LABEL_WIDTH}
                aside={<div className="flex h-full items-center p-[18px]">{store.image?.url ? <StorePhotoViewer url={store.image.url} name={store.name} boxClass={PHOTO_BOX} fallback={noPhoto} /> : noPhoto}</div>}
              />
            </div>
            <div className="order-3 min-[1260px]:order-none">
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
            <div className="order-2 min-[1260px]:order-none">
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
            </div>
            <div className="order-4 min-[1260px]:order-none">
              {/* 변경이력 상자 — 제목 줄 오른쪽에 [변경이력] 버튼(보기만 하는 버튼이라 흰 바탕 · 브랜드 테두리 outline), 아래 등록 · 최종수정 두 줄
                  (2026-11-18 사용자 지정 — 전엔 기본정보 사진 아래 한 줄 · 버튼은 그 줄 오른쪽 끝) */}
              <DetailTable title="변경이력" action={<HistoryButton storeId={store.storeId} variant="outline" />} rows={historyRows} />
            </div>
          </div>
        </div>
      </StoreCardBody>
    </StoreFrame>
  );
}
