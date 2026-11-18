// 위도 · 경도 · 출퇴근 위치적용 입력칸의 검사와 요청 값 — 마이페이지 BP 사업자정보 · 플랫폼 BP 마스터 폼이 같이 쓴다.
// 본사 점포(stores.is_hq)의 좌표가 이 값이다: 본사근무 직원의 출퇴근 위치 확인 기준이고, 좌표가 있어야 본사 점포가 운영으로 바뀐다
// (본사 점포 설계 · 근무지 · 본사근무 정책, 2026-11-17). 규칙은 점포 등록(store-form.ts)과 같다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.

export type CoordinateForm = { latitude: string; longitude: string; isLocationApplied: boolean };
export type CoordinateField = "latitude" | "longitude";

export const EMPTY_COORDINATE: CoordinateForm = { latitude: "", longitude: "", isLocationApplied: false };

const SIGNED_6 = /^-?\d+(\.\d{1,6})?$/;

/** 위도 · 경도가 둘 다 채워졌는가 — 선택칸 표시값과 저장 값이 같은 규칙을 쓴다(store-form.ts hasCoordinateInput 과 같다) */
export const hasCoordinate = (f: Pick<CoordinateForm, "latitude" | "longitude">) => Boolean(f.latitude.trim() && f.longitude.trim());

/** 받은 값 → 입력칸. 좌표가 없으면 위치적용은 미사용으로 보인다 */
export function coordinateFormOf(v: { latitude?: number | null; longitude?: number | null; isLocationApplied?: boolean }): CoordinateForm {
  const latitude = v.latitude == null ? "" : String(v.latitude);
  const longitude = v.longitude == null ? "" : String(v.longitude);
  return { latitude, longitude, isLocationApplied: Boolean(latitude && longitude && v.isLocationApplied) };
}

/** 칸별 오류 — 점포 등록과 같은 문구 */
export function coordinateErrors(f: CoordinateForm): Partial<Record<CoordinateField, string>> {
  const errors: Partial<Record<CoordinateField, string>> = {};
  const lat = f.latitude.trim();
  const lng = f.longitude.trim();
  if (lat && (!SIGNED_6.test(lat) || Math.abs(Number(lat)) > 90)) errors.latitude = "위도는 -90~90, 소수 6자리까지입니다.";
  if (lng && (!SIGNED_6.test(lng) || Math.abs(Number(lng)) > 180)) errors.longitude = "경도는 -180~180, 소수 6자리까지입니다.";
  if (Boolean(lat) !== Boolean(lng)) errors[lat ? "longitude" : "latitude"] = "위도와 경도는 함께 적습니다.";
  return errors;
}

/** 요청 값 — 비운 좌표는 null 로 보내 지운다. 좌표 없이 위치적용 사용을 보내지 않는다(점포 bodyOf 와 같은 마지막 막기) */
export function coordinateBody(f: CoordinateForm): { latitude: number | null; longitude: number | null; isLocationApplied: boolean } {
  const lat = f.latitude.trim();
  const lng = f.longitude.trim();
  return { latitude: lat ? Number(lat) : null, longitude: lng ? Number(lng) : null, isLocationApplied: hasCoordinate(f) ? f.isLocationApplied : false };
}

/**
 * 저장에 실을 좌표 — 불러온 값(saved)과 보낼 값이 같으면 싣지 않는다. api 는 셋을 함께 생략하면 그대로 둔다.
 * 좌표를 건드리지 않은 저장이 그사이 다른 화면에서 바꾼 좌표를 덮어쓰지 않고, 좌표 칸을 모르는 옛 api(모르는 칸이면 400)에도 저장이 막히지 않는다.
 */
export function coordinateChange(current: CoordinateForm, saved: CoordinateForm): Partial<ReturnType<typeof coordinateBody>> {
  const next = coordinateBody(current);
  const before = coordinateBody(saved);
  const same = next.latitude === before.latitude && next.longitude === before.longitude && next.isLocationApplied === before.isLocationApplied;
  return same ? {} : next;
}

/** 손으로 적는 좌표 — 숫자 · 마침표 · 마이너스만 받는다(점포 등록과 같다) */
export const coordinateText = (value: string) => value.replace(/[^0-9.-]/g, "");
