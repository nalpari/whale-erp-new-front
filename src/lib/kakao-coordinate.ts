// 카카오 로컬 API 「주소 검색」 응답에서 위도 · 경도를 읽는다. 응답은 x 가 경도, y 가 위도다(뒤바뀌면 출퇴근 반경 판정이 통째로 틀린다).
// address-search.ts 는 server-only 라 node --test 가 부를 수 없어, 응답 해석만 여기 순수 함수로 둔다(상대 경로 + .ts).

/** 위도 · 경도는 소수 6자리까지 저장한다(점포 칸 규칙 · 약 10cm) */
const DECIMALS = 6;

export type KakaoCoordinate =
  | { kind: "found"; latitude: number; longitude: number }
  /** 이 주소로는 찾은 것이 없다 — 다음 주소(지번)로 다시 묻는다 */
  | { kind: "none" }
  /** 응답 모양이 다르다(documents 가 배열이 아니거나, x · y 가 십진수 글자가 아니거나 범위 밖이다) — 로그를 남긴다 */
  | { kind: "malformed" };

/**
 * 십진수 글자만 받는다 — Number() 는 "" · " " 을 0 으로, "0x10" 을 16 으로 읽는다. (0, 0) 같은 틀린 좌표는 운영 조건을
 * 통과해 출퇴근 반경 판정을 통째로 틀리게 하므로, 빈 값보다 위험하다.
 */
const DECIMAL = /^-?\d+(\.\d+)?$/;

function decimalOf(value: unknown, limit: number): number | null {
  if (typeof value !== "string" || !DECIMAL.test(value)) return null;
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

export function coordinateOfKakao(body: unknown): KakaoCoordinate {
  const documents = (body as { documents?: unknown } | null)?.documents;
  if (!Array.isArray(documents)) return { kind: "malformed" };
  const first = documents[0] as { x?: unknown; y?: unknown } | undefined;
  if (!first) return { kind: "none" };
  const latitude = decimalOf(first.y, 90);
  const longitude = decimalOf(first.x, 180);
  if (latitude === null || longitude === null) return { kind: "malformed" };
  return { kind: "found", latitude: Number(latitude.toFixed(DECIMALS)), longitude: Number(longitude.toFixed(DECIMALS)) };
}
