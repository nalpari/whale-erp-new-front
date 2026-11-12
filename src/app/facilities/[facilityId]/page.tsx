import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Badge, DetailTable, DetailValues, NoticeBand, Tag, type DetailRow } from "@/components/common";
import { getEnum } from "@/lib/api";
import { labelOf } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import { getFacility, type FacilityDetail } from "@/lib/facilities";
import { DOCUMENT_KINDS, phoneText } from "../facility-form-model";
import { backHrefOf } from "../facility-list-query";
import { facilityDenied } from "../facility-denied";
import { MASKED_STAFF } from "../../todos/todo-row";
import { FacilityCardBody, FacilityFrame, FacilityStatusBadge } from "../facility-parts";
import { FacilityDetailActions } from "./facility-detail-actions";

// 시설물 및 장비 상세. 목업 docs/mockup/stores/facilities-detail.html · 데모 stores/facilities-detail.mjs — 이름 줄 + 실행 버튼, 그 아래 상세 표를 반씩
// (왼쪽 기본 정보 · 제품 정보 · 구매 정보, 오른쪽 기한 · 문서 · 관리 · A/S). 모든 항목을 늘 보이고 입력하지 않은 값은 「-」다
// (2026-11-11 사용자 지정 — 전엔 저장된 값이 있는 항목만, PL-5).
// 폐점 점포의 것은 조회만 된다 — 위에 띠를 두고 [목록]만(PL-1). 지운 것 · 범위 밖은 404.

/** 파일 크기 글자 — 공통 첨부 칸(fileSizeLabel)과 같은 셈. 그 함수는 클라이언트 파일("use client")에 있어 서버 화면에서 부를 수 없다 */
const fileSizeLabel = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.ceil(bytes / 1024))}KB`);
const sub = (t: string) => <span className="text-erp-label">{t}</span>;
/** 입력하지 않은 값은 「-」 */
const orDash = (v: string | null | undefined): ReactNode => (v && v.trim() ? v : "-");
/** 미사용으로 바뀐 공통코드 값 — 이름은 그대로, 뒤에 회색 「(미사용)」(PL-3) */
const withUnused = (label: string, active: boolean | null) => (active === false ? <>{label} {sub("(미사용)")}</> : label);
/** 「이름 값」 한 칸 — 구매 금액 · 구매 · 설치일 줄 */
const named = (key: string, name: string, value: ReactNode) => (
  <span key={key}>
    {sub(name)} {value}
  </span>
);


export default async function FacilityDetailPage({ params, searchParams }: PageProps<"/facilities/[facilityId]">) {
  const [{ facilityId: raw }, search] = await Promise.all([params, searchParams]);
  const facilityId = /^\d{1,9}$/.test(raw) ? Number(raw) : 0;
  if (facilityId < 1) notFound();
  const [loaded, kindLabels] = await Promise.all([
    getFacility(facilityId).catch(facilityDenied(facilityId)),
    // 문서 종류 한글(GET /enums/FacilityDocumentKind) — 못 받아도 화면은 연다, 값이 그대로 보일 뿐이다
    getEnum("FacilityDocumentKind").catch((error: unknown) => {
      console.error("문서 종류 한글 조회 실패", error);
      return [];
    }),
  ]);
  if ("denied" in loaded)
    return (
      <FacilityFrame>
        <FacilityCardBody>
          <NoticeBand title={loaded.denied} />
        </FacilityCardBody>
      </FacilityFrame>
    );
  const d = loaded;
  const backHref = backHrefOf(search.back);
  const closed = d.store.isClosed;


  const basic: DetailRow[] = [
    { label: "점포", value: <StoreName facility={d} /> },
    {
      label: "운영상태",
      value: (
        <span className="inline-flex items-center gap-[6px]">
          <FacilityStatusBadge code={d.facilityStatusCode} label={d.facilityStatusLabel} />
          {!d.isFacilityStatusActive && sub("(미사용)")}
        </span>
      ),
    },
    { label: "그룹 · 분류", value: <DetailValues items={[<Tag key="g">{d.facilityGroupLabel}</Tag>, withUnused(d.facilityCategoryLabel, d.isFacilityCategoryActive)]} /> },
    { label: "메모", value: d.memo?.trim() ? <span className="whitespace-pre-line break-all">{d.memo}</span> : "-", multiline: !!d.memo?.trim() },
    {
      label: "변경이력",
      value: (
        <DetailValues
          items={[
            named("c", "등록", `${formatDateTime(d.createdAt)}${d.createdByName ? ` · ${d.createdByName}` : ""}`),
            ...(d.updatedByName ? [named("u", "최종수정", `${formatDateTime(d.updatedAt)} · ${d.updatedByName}`)] : []),
          ]}
        />
      ),
    },
  ];
  const product: DetailRow[] = [
    { label: "브랜드 · 제조사", value: <DetailValues items={[orDash(d.brand), orDash(d.manufacturer)]} /> },
    { label: "Serial number", value: orDash(d.serialNumber) },
    { label: "설치 위치", value: orDash(d.installationLocation) },
  ];
  const won = (n: number | null) => (n === null ? "-" : `${n.toLocaleString("ko-KR")}원`);
  const total = d.totalAmount ?? (d.unitPriceAmount === null ? null : d.unitPriceAmount * d.quantity);
  const purchase: DetailRow[] = [
    { label: "구매처", value: <DetailValues items={[orDash(d.vendorName), orDash(phoneText(d.vendorPhone))]} /> },
    { label: "영업사원", value: <DetailValues items={[orDash(d.salesRepresentativeName), orDash(phoneText(d.salesRepresentativePhone))]} /> },
    // 단가 | 수량 | 총금액 — 구매 · 설치일 줄처럼 이름 · 값을 세로선으로 가른다(2026-11-11 사용자 지정, 전엔 「단가원 × 수량 = 총금액원」)
    {
      label: "구매 금액",
      value: (
        <DetailValues
          items={[
            named("u", "단가", won(d.unitPriceAmount)),
            named("q", "수량", d.quantity.toLocaleString("ko-KR")),
            <span key="t">
              {sub("총금액")} {won(total)} {total !== null && sub(d.isVatIncluded ? "(부가세 포함)" : "(부가세 별도)")}
            </span>,
          ]}
        />
      ),
    },
    { label: "구매 · 설치일", value: <DetailValues items={[named("p", "구매일", orDash(d.purchaseDate)), named("i", "설치일", orDash(d.installationDate))]} /> },
  ];
  // 문서는 공통 첨부 칸의 읽기 전용 모양 — 이름(누르면 내려받기 · 주소는 5분 동안만) · 크기
  const documents: DetailRow[] = [
    { label: "사용 유효기한", value: orDash(d.usageExpiryDate) },
    { label: "품질 보증기한", value: orDash(d.warrantyExpiryDate) },
    ...DOCUMENT_KINDS.map((kind) => {
      const doc = d.documents.find((x) => x.documentKind === kind);
      return {
        label: labelOf(kindLabels, kind),
        value: doc ? (
          <span className="flex min-w-0 items-center gap-[10px]">
            {doc.downloadUrl ? (
              <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" className="truncate text-erp-link hover:underline">
                {doc.fileName}
              </a>
            ) : (
              <span className="truncate">{doc.fileName}</span>
            )}
            <span className="shrink-0 text-erp-label">{fileSizeLabel(doc.sizeBytes)}</span>
          </span>
        ) : (
          "-"
        ),
      };
    }),
  ];
  const address = d.serviceCenterAddress ? (
    <span key="a" className="truncate">
      {sub("[")} {d.serviceCenterZipCode} {sub("]")} {d.serviceCenterAddress}
      {d.serviceCenterAddressDetail ? `, ${d.serviceCenterAddressDetail}` : ""}
    </span>
  ) : (
    "-"
  );
  const manage: DetailRow[] = [
    // 본사 가림(ATT-30)이면 이름 · 번호 대신 가림 문구를 흐린 글자로 — 직원 · TO-DO 화면과 같은 문구
    d.isManagerHidden
      ? { label: "관리 담당자", value: <span className="text-erp-muted">{MASKED_STAFF}</span> }
      : { label: "관리 담당자", value: <DetailValues items={[orDash(d.manager?.name), orDash(phoneText(d.managerPhone))]} /> },
    { label: "점검 주기", value: <DetailValues items={[d.inspectionCycleLabel ? withUnused(d.inspectionCycleLabel, d.isInspectionCycleActive) : "-", orDash(d.inspectionNote)]} /> },
    { label: "A/S센터", value: <DetailValues items={[address, orDash(phoneText(d.serviceCenterPhone))]} /> },
  ];


  return (
    <FacilityFrame>
      <FacilityCardBody>
        <div className="flex flex-col gap-[12px]">
          <div className="flex items-center gap-[18px] py-[6px]">
            <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
              <h2 className="truncate text-[20px] font-semibold text-erp-ink">{d.name}</h2>
              <div className="flex items-center gap-[10px] text-[14px] font-medium text-erp-label">
                <FacilityStatusBadge code={d.facilityStatusCode} label={d.facilityStatusLabel} />
                <span className="h-[11px] w-px bg-[#d9d9d9]" aria-hidden="true" />
                <StoreName facility={d} />
              </div>
            </div>
            <FacilityDetailActions facility={d} backHref={backHref} />
          </div>
          {closed && <NoticeBand tone="info" title="폐점 점포의 시설물·장비는 조회만 할 수 있습니다." />}
          <div className="grid grid-cols-2 items-start gap-[24px]">
            <div className="flex flex-col gap-[24px]">
              <DetailTable title="기본 정보" rows={basic} />
              <DetailTable title="제품 정보" rows={product} />
              <DetailTable title="구매 정보" rows={purchase} />
            </div>
            <div className="flex flex-col gap-[24px]">
              <DetailTable title="기한 · 문서" rows={documents} />
              <DetailTable title="관리 · A/S" rows={manage} />
            </div>
          </div>
        </div>
      </FacilityCardBody>
    </FacilityFrame>
  );
}

function StoreName({ facility }: { facility: FacilityDetail }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-[6px]">
      <span className="truncate">{facility.store.name}</span>
      {facility.store.isClosed && <Badge tone="closed">폐점</Badge>}
    </span>
  );
}
