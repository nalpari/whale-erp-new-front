// 점포 등록 · 수정 폼의 칸 값 · 검증 · 요청 만들기. 화면 칸은 모두 문자열로 쥐고, 보낼 때 숫자 · null 로 바꾼다.
// 규칙은 okf stores.md · api 계약(2026-10-14)과 같다 — 서버가 다시 보지만 저장 전에 칸 아래에서 먼저 알린다.
// node --test 가 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import { finalJosa } from "./store-view.ts";
import type {
  CreateStoreInput,
  FloorType,
  StoreBusinessInput,
  StoreDetail,
  StoreStatus,
  StoreType,
  UpdateStoreInput,
} from "./store-types.ts";

export type PhoneParts = [string, string, string];

export type FloorRow = {
  /** 화면에서 줄을 가르는 키 — 보내지 않는다 */
  key: string;
  /** 층 구분 — "" 는 없음. 저장된 줄은 화면이 모르는 값(공통코드에 새로 더해진 값)도 그대로 쥐어 조용히 지우지 않는다 */
  floorTypeCode: string;
  floorNumber: string;
  floorAreaPyeong: string;
  floorAreaSqm: string;
  seatCount: string;
  /** 서버에 저장돼 있던 줄 — 숫자 칸이 모두 비어도(층 구분만 있어도) 지우지 않고 그대로 보낸다 */
  isSaved?: boolean;
};

export type StoreForm = {
  storeTypeCode: StoreType | "";
  /** 수정에서만 쓴다 */
  storeStatus: StoreStatus;
  name: string;
  phone: PhoneParts;
  zipCode: string;
  address: string;
  addressDetail: string;
  latitude: string;
  longitude: string;
  isLocationApplied: boolean;
  /** 사업자등록번호가 저장돼 있으면 인증 완료다. 번호 · 개업일자는 바꿀 수 없고 대표자명만 재인증으로 바뀐다 */
  savedBizNumber: string;
  /** 저장된 대표자명 — 재인증 없이 대표자명만 고친 것을 저장 전에 알아채는 데 쓴다 */
  savedCeoName: string;
  /** 진위확인 칸 — 인증하기를 누르기 전의 값 */
  bizNumber: string;
  ceoName: string;
  openDate: string;
  /**
   * 이번 화면에서 진위확인을 통과한 값. 지금 칸 값과 같을 때만 인증으로 본다(currentVerification) — 기다리는 사이 칸을 고쳤는데
   * 늦게 온 응답이 옛 값을 넣어도 저장에는 쓰이지 않는다. 저장할 때만 businessVerification 으로 보낸다
   */
  verified: { bizNumber: string; ceoName: string; openDate: string } | null;
  tradeName: string;
  ceoPhone: PhoneParts;
  /** 사업자주소를 점포 주소와 같게 둔다 */
  bizSameAsStore: boolean;
  bizZipCode: string;
  bizAddress: string;
  bizAddressDetail: string;
  bizCategory: string;
  bizItem: string;
  floors: FloorRow[];
};

export type StoreFormField =
  | "storeTypeCode"
  | "storeStatus"
  | "name"
  | "phone"
  | "addressDetail"
  | "latitude"
  | "longitude"
  | "bizNumber"
  | "ceoName"
  | "openDate"
  | "tradeName"
  | "ceoPhone"
  | "bizAddressDetail"
  | "bizCategory"
  | "bizItem"
  | "floors";

export type StoreFormErrors = Partial<Record<StoreFormField, string>>;

let floorSeq = 0;
/** 새 층 한 줄 — 키는 화면에서 줄을 가르는 데만 쓴다 */
export const newFloorRow = (): FloorRow => ({
  // 저장된 줄(saved-{id})과 접두를 나눠 키가 겹치지 않게 한다 — 겹치면 한 줄을 고치거나 지울 때 다른 줄도 같이 바뀐다
  key: `new-${++floorSeq}`,
  floorTypeCode: "GROUND",
  floorNumber: "",
  floorAreaPyeong: "",
  floorAreaSqm: "",
  seatCount: "",
});

export const EMPTY_STORE_FORM: StoreForm = {
  storeTypeCode: "",
  storeStatus: "NOT_OPERATING",
  name: "",
  phone: ["", "", ""],
  zipCode: "",
  address: "",
  addressDetail: "",
  latitude: "",
  longitude: "",
  // 새 점포는 주소가 없어 좌표도 없다 — 출퇴근 위치 적용 여부는 미사용이 기본이다(2026-10-19 점검 — 실사용자 확인).
  isLocationApplied: false,
  savedBizNumber: "",
  savedCeoName: "",
  bizNumber: "",
  ceoName: "",
  openDate: "",
  verified: null,
  tradeName: "",
  ceoPhone: ["", "", ""],
  bizSameAsStore: true,
  bizZipCode: "",
  bizAddress: "",
  bizAddressDetail: "",
  bizCategory: "",
  bizItem: "",
  floors: [],
};

/** 하이픈 없는 전화번호를 세 칸으로. 02 국번은 2자리, 그 밖은 3자리 + 가운데 3~4자리 + 끝 4자리 */
export function splitPhone(value: string | null | undefined): PhoneParts {
  const d = (value ?? "").replace(/[^0-9]/g, "");
  if (!d) return ["", "", ""];
  const head = d.startsWith("02") ? 2 : 3;
  return [d.slice(0, head), d.slice(head, d.length - 4), d.slice(d.length - 4)];
}

const joinPhone = (p: PhoneParts) => p.map((x) => x.trim()).join("");
const text = (v: string | null | undefined) => v ?? "";
const numText = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));

/** 상세 값으로 수정 칸을 채운다 */
export function formOfStore(d: StoreDetail): StoreForm {
  const b = d.business;
  // 사업자주소가 비어 있으면 「같음」으로 보지 않는다 — 같음으로 두면 저장(상태 변경 포함) 때 점포 주소가 사업자주소로 들어간다
  const sameAddress =
    Boolean(b.zipCode || b.address || b.addressDetail) &&
    b.zipCode === d.zipCode &&
    b.address === d.address &&
    b.addressDetail === d.addressDetail;
  return {
    storeTypeCode: d.storeTypeCode,
    storeStatus: d.storeStatusCode,
    name: d.name,
    phone: splitPhone(d.phone),
    zipCode: text(d.zipCode),
    address: text(d.address),
    addressDetail: text(d.addressDetail),
    latitude: numText(d.latitude),
    longitude: numText(d.longitude),
    // 주소 없이 사용으로 저장된 옛 데이터가 있을 수 있다 — 주소가 없으면 저장값과 상관없이 미사용으로 연다
    // (상세 화면과 같은 규칙, 2026-10-19 점검 — 실사용자 확인. 수정 화면을 새로 열 때마다 바로잡힌다).
    isLocationApplied: d.address ? d.isLocationApplied : false,
    savedBizNumber: text(b.bizRegistrationNumber),
    savedCeoName: text(b.ceoName),
    bizNumber: text(b.bizRegistrationNumber),
    ceoName: text(b.ceoName),
    openDate: text(b.openDate),
    verified: null,
    tradeName: text(b.tradeName),
    ceoPhone: splitPhone(b.ceoPhone),
    bizSameAsStore: sameAddress,
    bizZipCode: text(b.zipCode),
    bizAddress: text(b.address),
    bizAddressDetail: text(b.addressDetail),
    bizCategory: text(b.category),
    bizItem: text(b.item),
    floors: d.floors.map((f) => ({
      key: `saved-${f.storeFloorId}`,
      floorTypeCode: f.floorTypeCode ?? "",
      floorNumber: numText(f.floorNumber),
      floorAreaPyeong: numText(f.floorAreaPyeong),
      floorAreaSqm: numText(f.floorAreaSqm),
      seatCount: numText(f.seatCount),
      isSaved: true,
    })),
  };
}

const PHONE_PATTERN = /^[0-9]{9,11}$/;
// api save-store.dto 와 같은 검사 — 휴대전화로 좁히면 api 로 저장된 유선 번호 점포를 고칠 수 없다
const CEO_PHONE_PATTERN = /^[0-9]{10,11}$/;
const BIZ_NUMBER_PATTERN = /^[0-9]{10}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** 소수 자릿수 상한까지의 숫자(음수 허용 여부는 따로) */
const decimal = (places: number, signed = false) => new RegExp(`^${signed ? "-?" : ""}\\d+(\\.\\d{1,${places}})?$`);

/** 진위확인에 보낼 값 — 지금 칸 값을 다듬은 것. 저장된 번호가 있으면 번호는 그것을 쓴다(번호 · 개업일자는 바꿀 수 없다) */
export function verificationValuesOf(f: Pick<StoreForm, "savedBizNumber" | "bizNumber" | "ceoName" | "openDate">) {
  return { bizNumber: (f.savedBizNumber || f.bizNumber).replace(/-/g, "").trim(), ceoName: f.ceoName.trim(), openDate: f.openDate };
}

type VerificationForm = Pick<StoreForm, "savedBizNumber" | "bizNumber" | "ceoName" | "openDate" | "verified">;

/** 이번 화면의 인증 결과 — 지금 칸 값과 같을 때만. 다르면(인증 뒤 고침 · 늦게 온 응답) 없는 것으로 본다 */
export function currentVerification(f: VerificationForm): StoreForm["verified"] {
  const now = verificationValuesOf(f);
  const v = f.verified;
  return v && v.bizNumber === now.bizNumber && v.ceoName === now.ceoName && v.openDate === now.openDate ? v : null;
}

/** 사업자 인증이 끝났는가 — 저장된 번호가 있거나 이번 화면에서 지금 칸 값으로 통과했다 */
export const isBusinessVerified = (f: VerificationForm) => Boolean(f.savedBizNumber || currentVerification(f));

/**
 * 진위확인 칸을 고쳤는데 인증하지 않았는가. 그 값은 인증을 거쳐야만 저장되므로(businessVerification), 그대로 저장하면
 * 성공 토스트 뒤 값이 원래대로 돌아간다 — 저장 전에 막는다. 저장된 번호가 있으면 대표자명만, 없으면 세 칸 중 하나라도 적었을 때.
 */
export function hasUnverifiedChange(f: VerificationForm & Pick<StoreForm, "savedCeoName">): boolean {
  if (currentVerification(f)) return false;
  if (f.savedBizNumber) return f.ceoName.trim() !== f.savedCeoName.trim();
  return Boolean(f.bizNumber.trim() || f.ceoName.trim() || f.openDate.trim());
}

/** 진위확인 세 칸의 오류(인증하기를 누를 때). 저장된 번호가 있으면 대표자명만 본다(재인증) */
export function verificationErrors(f: Pick<StoreForm, "savedBizNumber" | "bizNumber" | "ceoName" | "openDate">): StoreFormErrors {
  const errors: StoreFormErrors = {};
  const number = f.bizNumber.replace(/-/g, "").trim();
  if (!f.savedBizNumber && !BIZ_NUMBER_PATTERN.test(number))
    errors.bizNumber = number ? "사업자등록번호는 숫자 10자리입니다." : "사업자등록번호를 입력해 주세요.";
  if (!f.ceoName.trim()) errors.ceoName = "대표자명을 입력해 주세요.";
  else if (f.ceoName.trim().length > 50) errors.ceoName = "대표자명은 50자까지입니다.";
  if (!f.savedBizNumber && !DATE_PATTERN.test(f.openDate)) errors.openDate = f.openDate ? "개업일자는 YYYY-MM-DD 입니다." : "개업일자를 입력해 주세요.";
  return errors;
}

/** 칸별 오류. 없으면 빈 객체 */
export function validateStoreForm(f: StoreForm, mode: "create" | "edit"): StoreFormErrors {
  const errors: StoreFormErrors = {};
  if (mode === "create" && !f.storeTypeCode) errors.storeTypeCode = "점포유형을 골라 주세요.";

  const name = f.name.trim();
  if (!name) errors.name = "점포명을 입력해 주세요.";
  else if (name.length > 50) errors.name = "점포명은 50자까지입니다.";

  const phone = joinPhone(f.phone);
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = "점포 연락처는 숫자 9~11자리입니다.";

  if (f.addressDetail.trim().length > 100) errors.addressDetail = "상세주소는 100자까지입니다.";
  else if (f.addressDetail.trim() && !f.address) errors.addressDetail = "주소를 먼저 검색해 주세요.";

  const lat = f.latitude.trim();
  const lng = f.longitude.trim();
  if (lat && (!decimal(6, true).test(lat) || Math.abs(Number(lat)) > 90)) errors.latitude = "위도는 -90~90, 소수 6자리까지입니다.";
  if (lng && (!decimal(6, true).test(lng) || Math.abs(Number(lng)) > 180)) errors.longitude = "경도는 -180~180, 소수 6자리까지입니다.";
  if (Boolean(lat) !== Boolean(lng)) errors[lat ? "longitude" : "latitude"] = "위도와 경도는 함께 적습니다.";

  if (f.tradeName.trim().length > 50) errors.tradeName = "상호명은 50자까지입니다.";
  const ceoPhone = joinPhone(f.ceoPhone);
  if (ceoPhone && !CEO_PHONE_PATTERN.test(ceoPhone)) errors.ceoPhone = "대표자 연락처는 숫자 10~11자리입니다.";
  if (!f.bizSameAsStore) {
    if (f.bizAddressDetail.trim().length > 100) errors.bizAddressDetail = "상세주소는 100자까지입니다.";
    else if (f.bizAddressDetail.trim() && !f.bizAddress) errors.bizAddressDetail = "사업자주소를 먼저 검색해 주세요.";
  }
  if (f.bizCategory.trim().length > 50) errors.bizCategory = "업태는 50자까지입니다.";
  if (f.bizItem.trim().length > 50) errors.bizItem = "종목은 50자까지입니다.";
  if (hasUnverifiedChange(f)) errors[f.savedBizNumber ? "ceoName" : "bizNumber"] = "인증하기를 눌러 사업자정보를 확인해 주세요.";

  const badFloor = f.floors.find(
    (r) =>
      (r.floorNumber && !/^[1-9]\d{0,2}$/.test(r.floorNumber)) ||
      (r.floorAreaPyeong && !decimal(1).test(r.floorAreaPyeong)) ||
      (r.floorAreaSqm && !decimal(2).test(r.floorAreaSqm)) ||
      (r.seatCount && !/^\d{1,6}$/.test(r.seatCount)),
  );
  if (badFloor) errors.floors = "층수는 1 이상의 정수, 매장평수는 소수 1자리, 전용면적은 소수 2자리, 좌석수는 0 이상의 정수입니다.";

  // 운영은 사업자정보 인증 · 좌표가 있어야 한다(S-MNRZOM). 서버도 다시 본다. 모자란 것을 한 문장에 모아
  // 보인다 — 상태 변경 팝업(missingForOperationText)과 같은 문구 꼴이다(2026-10-19 점검 — 실사용자 확인).
  if (mode === "edit" && f.storeStatus === "OPERATING") {
    const missing = [!isBusinessVerified(f) && "사업자정보 인증", (!lat || !lng) && "위치정보(위도 · 경도)"].filter((v): v is string => Boolean(v));
    if (missing.length) {
      const text = missing.join(" · ");
      errors.storeStatus = `운영으로 바꾸려면 ${text}${finalJosa(text)} 필요합니다.`;
      if (!lat || !lng) errors.latitude ??= "운영 점포는 위도 · 경도가 있어야 합니다.";
    }
  }
  return errors;
}

/** 선택 칸 — 비우면 null 로 보내 지운다 */
const optional = (value: string) => value.trim() || null;
const optionalNumber = (value: string) => (value.trim() ? Number(value) : null);

function businessOf(f: StoreForm): StoreBusinessInput {
  return {
    tradeName: optional(f.tradeName),
    ceoPhone: optional(joinPhone(f.ceoPhone)),
    zipCode: f.bizSameAsStore ? optional(f.zipCode) : optional(f.bizZipCode),
    address: f.bizSameAsStore ? optional(f.address) : optional(f.bizAddress),
    addressDetail: f.bizSameAsStore ? optional(f.addressDetail) : optional(f.bizAddressDetail),
    category: optional(f.bizCategory),
    item: optional(f.bizItem),
  };
}

function bodyOf(f: StoreForm) {
  return {
    name: f.name.trim(),
    phone: optional(joinPhone(f.phone)),
    zipCode: optional(f.zipCode),
    address: optional(f.address),
    addressDetail: optional(f.addressDetail),
    latitude: optionalNumber(f.latitude),
    longitude: optionalNumber(f.longitude),
    isLocationApplied: f.isLocationApplied,
    // 새로 더했는데 칸이 모두 빈 줄은 보내지 않는다. 저장돼 있던 줄은 그대로 둔다(층 구분만 있는 줄이 지워지지 않게)
    floors: f.floors
      .filter((r) => r.isSaved || r.floorNumber || r.floorAreaPyeong || r.floorAreaSqm || r.seatCount)
      .map((r) => ({
        // 받은 글자를 그대로 돌려보낸다 — 화면이 모르는 값(공통코드에 새로 더해진 값)도 지우지 않는다. api 가 받지 않는 값이면 400 으로 알린다
        floorTypeCode: (r.floorTypeCode || null) as FloorType | null,
        floorNumber: optionalNumber(r.floorNumber),
        floorAreaPyeong: optionalNumber(r.floorAreaPyeong),
        floorAreaSqm: optionalNumber(r.floorAreaSqm),
        seatCount: optionalNumber(r.seatCount),
      })),
    business: businessOf(f),
    // 이번 화면에서 지금 칸 값으로 진위확인을 통과한 값만 보낸다 — 서버가 저장할 때 국세청에 다시 확인한다
    ...verificationBodyOf(f),
  };
}

function verificationBodyOf(f: StoreForm) {
  const v = currentVerification(f);
  return v ? { businessVerification: { bizRegistrationNumber: v.bizNumber, ceoName: v.ceoName, openDate: v.openDate } } : {};
}

/**
 * 등록 요청. 점포유형이 비어 있으면 던진다 — validateStoreForm 을 먼저 통과해야 부른다.
 * bpCodeId 는 이 탭의 BP(로그인 정보) — 플랫폼 계정은 BP 를 고른 탭에서만 점포 메뉴를 열고, api 가 꼭 받는다. BP 계정은 소속 BP 와 같다.
 * 빈 값(0 · undefined)이면 싣지 않는다 — 그러면 api 가 BP 계정은 소속 BP 로 등록하고 플랫폼 계정은 400 으로 막는다.
 */
export function toCreateStoreInput(f: StoreForm, bpCodeId?: number): CreateStoreInput {
  const storeTypeCode = f.storeTypeCode;
  if (!storeTypeCode) throw new Error("점포유형 없이 등록 요청을 만들 수 없습니다");
  return { storeTypeCode, ...(bpCodeId ? { bpCodeId } : {}), ...bodyOf(f) };
}

export function toUpdateStoreInput(f: StoreForm, updatedAt: string): UpdateStoreInput {
  return { ...bodyOf(f), storeStatus: f.storeStatus, updatedAt };
}

/**
 * api 가 거절한 이유를 붙일 칸. 한 칸의 것이 아니면 null(폼 위 띠로 보인다).
 * api 는 오류에 칸 이름을 싣지 않아 문구로 가른다 — 400 · 409 만 보고, 사업자번호 중복은 진위확인 칸에 붙인다.
 */
export function storeServerErrorField(status: number | undefined, message: string): StoreFormField | null {
  if (status !== 400 && status !== 409) return null;
  // 운영 조건 미충족 — 문구에 「좌표(위도 · 경도)」가 들어 있어도 점포상태 칸의 것이다
  if (message.includes("운영으로 바꾸려면")) return "storeStatus";
  if (message.includes("사업자등록번호")) return "bizNumber";
  if (message.includes("대표자명")) return "ceoName";
  if (message.includes("개업일자")) return "openDate";
  if (message.includes("점포명")) return "name";
  if (message.includes("경도") && !message.includes("위도")) return "longitude";
  if (message.includes("위도") || message.includes("좌표")) return "latitude";
  return null;
}

/**
 * api 오류 문장들(검증 실패면 여러 개)을 칸별로 나눈다. 같은 칸에 여럿이면 이어 붙이고, 칸을 못 찾은 문장은 rest 로 남겨 띠에 보인다.
 */
export function storeServerErrors(status: number | undefined, messages: readonly string[]): { fields: StoreFormErrors; rest: string[] } {
  const fields: StoreFormErrors = {};
  const rest: string[] = [];
  for (const message of messages) {
    const field = storeServerErrorField(status, message);
    if (field) fields[field] = fields[field] ? `${fields[field]} ${message}` : message;
    else rest.push(message);
  }
  return { fields, rest };
}
