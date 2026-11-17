// 마이페이지 사업자정보의 본사 좌표 · 출퇴근 위치적용 · 「본사 직원 관리」(WHALEERP-724, 2026-11-17 사용자 지정 —
// docs/raw/2026-11-17-근무지-본사근무-정책.md 2절). 본사(인증까지 마친 BP 사업자정보)도 근무지가 되고, 이 좌표가 본사근무
// 직원의 출퇴근 위치 기준이다. 1인 매장이 헷갈리지 않게 본사 기능은 「본사 직원 관리」를 켠 BP 에만 보인다(기본 꺼짐).
// 좌표 규칙은 점포 사업자정보(store-form.ts)와 같다. 사업자정보 폼(bp-profile-form.ts)과 따로 둔다 — 이 칸들은 api 가
// 빼고 보내면 그대로 두는 칸이라(옛 화면이 지우지 않게) 저장 요청에 덧붙이기만 한다.

/** api 응답(BpProfile)의 본사 칸 — 이 칸을 모르는 옛 api 는 싣지 않는다 */
export type HqProfile = {
  latitude?: number | null;
  longitude?: number | null;
  isLocationApplied?: boolean;
  isHqStaffEnabled?: boolean;
};

export type HqForm = {
  /** api 가 본사 칸을 실어 줬는가 — 아니면(옛 api) 화면에 칸을 그리지 않고 저장에도 싣지 않는다 */
  supported: boolean;
  latitude: string;
  longitude: string;
  isLocationApplied: boolean;
  isHqStaffEnabled: boolean;
};

export type HqFormField = "latitude" | "longitude" | "isHqStaffEnabled";

export type HqInput = {
  latitude?: number | null;
  longitude?: number | null;
  isLocationApplied?: boolean;
  isHqStaffEnabled?: boolean;
};

const numText = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));
const decimal = (places: number) => new RegExp(`^-?\\d+(\\.\\d{1,${places}})?$`);

/** 위도 · 경도가 둘 다 있는가 — 출퇴근 위치적용 · 본사 직원 관리의 조건 */
export function hasHqCoordinates(f: Pick<HqForm, "latitude" | "longitude">): boolean {
  return Boolean(f.latitude.trim() && f.longitude.trim());
}

export function hqFormOf(profile: HqProfile): HqForm {
  const supported = profile.isHqStaffEnabled !== undefined;
  const latitude = numText(profile.latitude);
  const longitude = numText(profile.longitude);
  return {
    supported,
    latitude,
    longitude,
    // 좌표 없이 사용으로 저장된 값이 와도 미사용으로 연다 — 점포 formOfStore 와 같은 규칙
    isLocationApplied: Boolean(profile.isLocationApplied) && hasHqCoordinates({ latitude, longitude }),
    isHqStaffEnabled: Boolean(profile.isHqStaffEnabled),
  };
}

/**
 * 저장 전 검사. verifiedAfter — 이 저장 뒤 사업자정보가 인증된 상태인가(저장된 인증이 있거나 이번에 인증했고, 「사용안함」을
 * 누르지 않았다). api(hqStateOf)도 같은 규칙으로 막는다 — 화면은 칸 아래에 먼저 알린다.
 */
export function validateHqForm(f: HqForm, verifiedAfter: boolean): Partial<Record<HqFormField, string>> {
  const errors: Partial<Record<HqFormField, string>> = {};
  if (!f.supported) return errors;
  const lat = f.latitude.trim();
  const lng = f.longitude.trim();
  if (lat && (!decimal(6).test(lat) || Math.abs(Number(lat)) > 90)) errors.latitude = "위도는 -90~90, 소수 6자리까지입니다.";
  if (lng && (!decimal(6).test(lng) || Math.abs(Number(lng)) > 180)) errors.longitude = "경도는 -180~180, 소수 6자리까지입니다.";
  if (Boolean(lat) !== Boolean(lng)) errors[lat ? "longitude" : "latitude"] = "위도와 경도는 함께 입력해 주세요.";
  if (f.isHqStaffEnabled) {
    if (!verifiedAfter) errors.isHqStaffEnabled = "사업자정보를 인증해야 본사 직원 관리를 켤 수 있습니다.";
    else if (!hasHqCoordinates(f)) errors.isHqStaffEnabled = "본사 직원 관리를 사용하려면 본사 위도 · 경도가 필요합니다.";
  }
  return errors;
}

/** 저장 요청에 덧붙일 본사 칸. 좌표가 없으면 위치 적용은 false 로 보낸다. 옛 api 면 싣지 않는다 */
export function toHqInput(f: HqForm): HqInput {
  if (!f.supported) return {};
  const coordinates = hasHqCoordinates(f);
  return {
    latitude: f.latitude.trim() ? Number(f.latitude) : null,
    longitude: f.longitude.trim() ? Number(f.longitude) : null,
    isLocationApplied: coordinates && f.isLocationApplied,
    isHqStaffEnabled: f.isHqStaffEnabled,
  };
}
