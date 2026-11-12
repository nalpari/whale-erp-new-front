// 시설물 · 장비 등록 · 수정 폼의 값 · 검사 · api 본문(정책서 PL-1 ~ PL-6, 목업 docs/mockup/stores/facilities-new.html).
// 화면(facility-form.tsx)은 이 파일로 값을 바꾸고 검사한다. next/* 를 import 하지 않는다 — node --test 가 이 파일을 직접 읽는다.
import type { components } from "../../lib/api-types.generated.ts";

type Schemas = components["schemas"];
type FacilityDetail = Schemas["FacilityDetailResponseDto"];
type CreateFacilityInput = Schemas["CreateFacilityDto"];
export type FacilityGroupCode = Schemas["FacilityGroup"];
export type FacilityDocumentKind = Schemas["FacilityDocumentKind"];

/**
 * 그룹 = 공통코드 그룹 두 개(정책서 PL-3, 화면이 고정으로 부른다). 그룹의 이름은 공통코드 그룹명인데 로그인 정보의 공통코드에는
 * 상세 코드만 있어 이름을 여기 적는다 — api 마이그레이션(20261111054736_team1_facilities)의 group_name 과 같다.
 * 목록 · 상세는 api 가 주는 facilityGroupLabel 을 쓴다.
 */
export const FACILITY_GROUPS: readonly { code: FacilityGroupCode; label: string }[] = [
  { code: "STORE_FACILITY", label: "점포 시설물" },
  { code: "STORE_EQUIPMENT", label: "점포 장비" },
];
export const isFacilityGroup = (v: string): v is FacilityGroupCode => FACILITY_GROUPS.some((g) => g.code === v);

/** 공통코드 그룹 — 운영상태(플랫폼고정) · 점검 주기(플랫폼제공) */
export const STATUS_GROUP = "FACILITY_STATUS";
export const CYCLE_GROUP = "INSPECTION_CYCLE";
/** 운영상태의 처음 값(PL-2). 점검 주기는 비워 둔다 — 선택 칸이라 처음 값이 있으면 점검하지 않는 장비도 그 주기로 저장된다(2026-11-11 사용자 지정, 전엔 매일) */
export const DEFAULT_STATUS = "OPERATING";

/** 문서 종류 — 상세 · 폼의 순서(사용 매뉴얼 · 주의사항 · 제품 보증서). 한글은 getEnum("FacilityDocumentKind") 로 받는다 */
export const DOCUMENT_KINDS: readonly FacilityDocumentKind[] = ["USER_MANUAL", "PRECAUTION", "WARRANTY"];

/** 문서 형식 · 크기(PL-5) — 종류마다 1개, JPG · PNG · PDF, 10MB 이하. 종류는 api 가 파일 내용으로 다시 본다 */
export const DOCUMENT_ACCEPT = ".jpg,.jpeg,.png,.pdf";
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_TYPE_ERROR = "JPG, PNG, PDF 파일만 첨부할 수 있습니다.";
export const DOCUMENT_SIZE_ERROR = "10MB 이하 파일만 첨부할 수 있습니다.";
export const DOCUMENT_COUNT_ERROR = "종류마다 1개까지 첨부할 수 있습니다.";

/** 고른 파일 하나의 까닭 — 맞으면 null */
export function documentFileError(file: { name: string; size: number }): string | null {
  if (!/\.(jpe?g|png|pdf)$/i.test(file.name)) return DOCUMENT_TYPE_ERROR;
  if (file.size > DOCUMENT_MAX_BYTES) return DOCUMENT_SIZE_ERROR;
  if (file.size === 0) return "빈 파일은 첨부할 수 없습니다.";
  return null;
}

/** 전화번호 세 칸 — 칸마다 숫자 4자리까지. api 에는 이어 붙인 숫자만 보낸다(하이픈은 서버가 뗀다) */
export type PhoneParts = [string, string, string];
export const EMPTY_PHONE: PhoneParts = ["", "", ""];

/** 숫자만인 전화번호를 세 칸으로 — 02 는 두 자리, 12자리(050X 평생번호)는 4 · 4 · 4, 그 밖은 앞 3자리. 끝 칸은 4자리 */
export function splitPhone(raw: string | null | undefined): PhoneParts {
  const d = (raw ?? "").replace(/[^0-9]/g, "").slice(0, 12);
  if (!d) return [...EMPTY_PHONE];
  const head = d.startsWith("02") ? 2 : d.length >= 12 ? 4 : 3;
  const rest = d.slice(head);
  const mid = Math.max(0, Math.min(4, rest.length - 4));
  return [d.slice(0, head), rest.slice(0, mid), rest.slice(mid)];
}
export const joinPhone = (p: PhoneParts) => p.join("");

/** 화면에 보이는 전화번호 — 세 칸을 하이픈으로 잇는다 */
export const phoneText = (raw: string | null | undefined) => splitPhone(raw).filter(Boolean).join("-");

export type AddressValue = { zipCode: string; address: string; addressDetail: string };

export interface FacilityForm {
  /** 점포 — 등록 화면에서 고른다. 수정은 바꿀 수 없어 보이기만 한다(PL-1) */
  storeId: number | null;
  name: string;
  statusCode: string;
  groupCode: FacilityGroupCode | "";
  categoryCode: string;
  memo: string;
  brand: string;
  manufacturer: string;
  serialNumber: string;
  installationLocation: string;
  vendorName: string;
  vendorPhone: PhoneParts;
  salesRepresentativeName: string;
  salesRepresentativePhone: PhoneParts;
  /** 단가 — 숫자만(쉼표는 화면이 보일 때만 붙인다), 10자리까지 */
  unitPrice: string;
  /** 수량 — 숫자만, 1 ~ 9,999 */
  quantity: string;
  isVatIncluded: boolean;
  purchaseDate: string;
  installationDate: string;
  usageExpiryDate: string;
  warrantyExpiryDate: string;
  managerStaffMemberId: number | null;
  managerPhone: PhoneParts;
  inspectionCycleCode: string;
  inspectionNote: string;
  serviceCenter: AddressValue;
  serviceCenterPhone: PhoneParts;
}

export type FacilityFormField =
  | "store"
  | "name"
  | "status"
  | "group"
  | "category"
  | "memo"
  | "vendorPhone"
  | "salesRepresentativePhone"
  | "unitPrice"
  | "quantity"
  | "installationDate"
  | "managerPhone"
  | "serviceCenterPhone";

/** 칸 이름(전화번호 문구에 쓴다) */
export const PHONE_LABELS = {
  vendorPhone: "구매처",
  salesRepresentativePhone: "영업사원",
  managerPhone: "관리 담당자",
  serviceCenterPhone: "A/S센터",
} as const satisfies Partial<Record<FacilityFormField, string>>;
export type PhoneField = keyof typeof PHONE_LABELS;
export const PHONE_FIELDS = Object.keys(PHONE_LABELS) as PhoneField[];

export const MEMO_MAX = 200;
export const QUANTITY_MAX = 9999;

/** 등록 화면 처음 값 — 운영 · 점검 주기 빈 값 · 수량 1 · 부가세 포함 */
export function initialForm(): FacilityForm {
  return {
    storeId: null,
    name: "",
    statusCode: DEFAULT_STATUS,
    groupCode: "",
    categoryCode: "",
    memo: "",
    brand: "",
    manufacturer: "",
    serialNumber: "",
    installationLocation: "",
    vendorName: "",
    vendorPhone: [...EMPTY_PHONE],
    salesRepresentativeName: "",
    salesRepresentativePhone: [...EMPTY_PHONE],
    unitPrice: "",
    quantity: "1",
    isVatIncluded: true,
    purchaseDate: "",
    installationDate: "",
    usageExpiryDate: "",
    warrantyExpiryDate: "",
    managerStaffMemberId: null,
    managerPhone: [...EMPTY_PHONE],
    inspectionCycleCode: "",
    inspectionNote: "",
    serviceCenter: { zipCode: "", address: "", addressDetail: "" },
    serviceCenterPhone: [...EMPTY_PHONE],
  };
}

/** 수정 화면 처음 값 — 상세 값 그대로. 빈 값은 빈 칸으로 둔다(점검 주기도 비었으면 비운 채로) */
export function formOf(d: FacilityDetail): FacilityForm {
  return {
    storeId: d.store.storeId,
    name: d.name,
    statusCode: d.facilityStatusCode,
    groupCode: isFacilityGroup(d.facilityGroupCode) ? d.facilityGroupCode : "",
    categoryCode: d.facilityCategoryCode,
    memo: d.memo ?? "",
    brand: d.brand ?? "",
    manufacturer: d.manufacturer ?? "",
    serialNumber: d.serialNumber ?? "",
    installationLocation: d.installationLocation ?? "",
    vendorName: d.vendorName ?? "",
    vendorPhone: splitPhone(d.vendorPhone),
    salesRepresentativeName: d.salesRepresentativeName ?? "",
    salesRepresentativePhone: splitPhone(d.salesRepresentativePhone),
    unitPrice: d.unitPriceAmount === null ? "" : String(d.unitPriceAmount),
    quantity: String(d.quantity),
    isVatIncluded: d.isVatIncluded,
    purchaseDate: d.purchaseDate ?? "",
    installationDate: d.installationDate ?? "",
    usageExpiryDate: d.usageExpiryDate ?? "",
    warrantyExpiryDate: d.warrantyExpiryDate ?? "",
    managerStaffMemberId: d.manager?.staffMemberId ?? null,
    // 가려진 담당자(본사 가림 ATT-30)는 번호가 null 로 온다 — 빈 칸으로 두고 그대로 저장하면 서버가 저장된 번호를 지킨다
    managerPhone: splitPhone(d.managerPhone),
    inspectionCycleCode: d.inspectionCycleCode ?? "",
    inspectionNote: d.inspectionNote ?? "",
    serviceCenter: { zipCode: d.serviceCenterZipCode ?? "", address: d.serviceCenterAddress ?? "", addressDetail: d.serviceCenterAddressDetail ?? "" },
    serviceCenterPhone: splitPhone(d.serviceCenterPhone),
  };
}

/** 숫자만 남긴다(max 자리까지) */
export const digitsOf = (v: string, max: number) => v.replace(/[^0-9]/g, "").slice(0, max);
/** 천 단위 쉼표 — 빈 값은 빈 값 */
export const withCommas = (digits: string) => (digits ? Number(digits).toLocaleString("ko-KR") : "");

/** 총금액(단가 × 수량) 글자 — 단가가 없거나 수량이 1 미만이면 빈 값. 서버도 같은 값을 계산한다 */
export function totalText(f: Pick<FacilityForm, "unitPrice" | "quantity">): string {
  const unit = Number(f.unitPrice);
  const qty = Number(f.quantity);
  return f.unitPrice && qty >= 1 ? (unit * qty).toLocaleString("ko-KR") : "";
}

/**
 * [저장] 검사(PL-5) — 걸린 칸과 그 문구. 화면 순서대로 넣는다(첫 오류 칸으로 옮길 때 쓴다).
 * categories 는 고른 그룹의 고를 수 있는 분류(수정 화면의 미사용 지금 값 포함) — 비었으면 분류 문구 대신 공통코드 관리 안내를 화면이 보인다.
 */
export function problems(f: FacilityForm, mode: "create" | "edit"): Partial<Record<FacilityFormField, string>> {
  const out: Partial<Record<FacilityFormField, string>> = {};
  if (mode === "create" && f.storeId === null) out.store = "점포를 선택해 주세요.";
  if (!f.name.trim()) out.name = "시설물/장비명을 입력해 주세요.";
  if (!f.statusCode) out.status = "운영상태를 선택해 주세요.";
  if (!f.groupCode) out.group = "그룹을 선택해 주세요.";
  if (!f.categoryCode) out.category = "분류를 선택해 주세요.";
  if (f.memo.length > MEMO_MAX) out.memo = `메모는 ${MEMO_MAX}자까지 입력할 수 있습니다.`;
  for (const field of ["vendorPhone", "salesRepresentativePhone"] as const) {
    const msg = phoneProblem(f[field], PHONE_LABELS[field]);
    if (msg) out[field] = msg;
  }
  const qty = Number(f.quantity);
  if (!(Number.isInteger(qty) && qty >= 1 && qty <= QUANTITY_MAX)) out.quantity = "수량은 1 ~ 9,999 사이로 입력해 주세요.";
  if (f.purchaseDate && f.installationDate && f.installationDate < f.purchaseDate) out.installationDate = "설치일은 구매일보다 앞설 수 없습니다.";
  for (const field of ["managerPhone", "serviceCenterPhone"] as const) {
    const msg = phoneProblem(f[field], PHONE_LABELS[field]);
    if (msg) out[field] = msg;
  }
  return out;
}

/** 전화번호 — 비었으면 괜찮고, 이은 번호가 9~12자리가 아니면 문구 */
function phoneProblem(p: PhoneParts, label: string): string | null {
  const n = joinPhone(p).length;
  return n === 0 || (n >= 9 && n <= 12) ? null : `${label} 전화번호는 숫자 9~12자리입니다.`;
}

const textOrNull = (v: string) => (v.trim() ? v.trim() : null);
const phoneOrNull = (p: PhoneParts) => joinPhone(p) || null;
const dateOrNull = (v: string) => v || null;

/**
 * 등록 · 수정 공통 본문 — 빈 칸은 null(수정은 화면 전체를 다시 보내 빈 칸이 지워진다, PL-4). 총금액은 보내지 않는다(서버가 계산).
 * 그룹 · 분류는 검사를 통과한 뒤에 부른다.
 */
export function bodyOf(f: FacilityForm): Omit<CreateFacilityInput, "storeId"> {
  const address = f.serviceCenter.address ? f.serviceCenter : null;
  return {
    name: f.name.trim(),
    facilityStatusCode: f.statusCode,
    facilityGroupCode: f.groupCode as FacilityGroupCode,
    facilityCategoryCode: f.categoryCode,
    // 메모는 줄바꿈 · 공백을 그대로 둔다 — 공백만이면 비운다
    memo: f.memo.trim() ? f.memo : null,
    brand: textOrNull(f.brand),
    manufacturer: textOrNull(f.manufacturer),
    serialNumber: textOrNull(f.serialNumber),
    installationLocation: textOrNull(f.installationLocation),
    vendorName: textOrNull(f.vendorName),
    vendorPhone: phoneOrNull(f.vendorPhone),
    salesRepresentativeName: textOrNull(f.salesRepresentativeName),
    salesRepresentativePhone: phoneOrNull(f.salesRepresentativePhone),
    unitPriceAmount: f.unitPrice ? Number(f.unitPrice) : null,
    quantity: Number(f.quantity),
    isVatIncluded: f.isVatIncluded,
    purchaseDate: dateOrNull(f.purchaseDate),
    installationDate: dateOrNull(f.installationDate),
    usageExpiryDate: dateOrNull(f.usageExpiryDate),
    warrantyExpiryDate: dateOrNull(f.warrantyExpiryDate),
    managerStaffMemberId: f.managerStaffMemberId,
    managerPhone: phoneOrNull(f.managerPhone),
    inspectionCycleCode: f.inspectionCycleCode || null,
    inspectionNote: textOrNull(f.inspectionNote),
    serviceCenterZipCode: address?.zipCode || null,
    serviceCenterAddress: address?.address || null,
    serviceCenterAddressDetail: address ? textOrNull(f.serviceCenter.addressDetail) : null,
    serviceCenterPhone: phoneOrNull(f.serviceCenterPhone),
  };
}

/**
 * 상세 정보 네 묶음(제품 정보 / 구매 정보 / 기한 · 문서 / 관리 · A/S)의 「입력 n / 전체」 — 값이 있는 칸을 센다(수량 · 총금액 · 부가세는 세지 않는다).
 * docs 는 종류마다 문서가 있는가(올린 것 · 새로 고른 것).
 */
export function filledCounts(f: FacilityForm, docs: Record<FacilityDocumentKind, boolean>) {
  const has = (v: string | number | null) => v !== null && String(v).trim() !== "";
  const phone = (p: PhoneParts) => joinPhone(p) !== "";
  const count = (list: boolean[]) => ({ filled: list.filter(Boolean).length, total: list.length });
  return {
    product: count([has(f.brand), has(f.manufacturer), has(f.serialNumber), has(f.installationLocation)]),
    purchase: count([has(f.vendorName), phone(f.vendorPhone), has(f.salesRepresentativeName), phone(f.salesRepresentativePhone), has(f.unitPrice), has(f.purchaseDate), has(f.installationDate)]),
    documents: count([has(f.usageExpiryDate), has(f.warrantyExpiryDate), ...DOCUMENT_KINDS.map((k) => docs[k])]),
    manage: count([f.managerStaffMemberId !== null, phone(f.managerPhone), has(f.inspectionCycleCode), has(f.inspectionNote), has(f.serviceCenter.address), phone(f.serviceCenterPhone)]),
  };
}
