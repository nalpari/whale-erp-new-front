// 점포 화면의 표기. 서버 · 클라이언트가 함께 쓰고 node --test 가 직접 읽는다(상대 경로 + .ts).
import { floorTypeOf, type FloorType, type StoreFloor, type StoreStatus, type StoreTransitions } from "./store-types.ts";

// 점포 상태 · 유형 · 층 구분의 한글은 공통코드(STORE_STATUS · STORE_TYPE · FLOOR_TYPE)라 화면이 로그인 정보에서 읽는다
// (components/site/code-label.tsx). 여기에 상수 대응표를 두지 않는다(네이밍 규칙 화면 문구).

/** 지금 상태에서 고를 수 있는 점포상태(현재 상태 포함) — 미운영→운영 · 폐점, 운영→폐점. 되돌리지 않는다(S-MNRZOM) */
export function nextStatuses(current: StoreStatus): StoreStatus[] {
  if (current === "NOT_OPERATING") return ["NOT_OPERATING", "OPERATING", "CLOSED"];
  if (current === "OPERATING") return ["OPERATING", "CLOSED"];
  return ["CLOSED"];
}

/** 하이픈 없는 10자리 → 123-45-67890. 10자리가 아니면 그대로 */
export function formatBizNumber(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/[^0-9]/g, "");
  return digits.length === 10 ? `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}` : (value ?? "");
}

/** 층 한 줄의 층 표기 — 지상 1층 · 지하 2층. 둘 다 없으면 "-". 층 구분 한글은 부르는 쪽이 공통코드에서 준다 */
export function floorLabel(floor: Pick<StoreFloor, "floorTypeCode" | "floorNumber">, floorTypeLabel: (type: FloorType) => string): string {
  if (!floor.floorTypeCode && floor.floorNumber === null) return "-";
  const floorType = floorTypeOf(floor.floorTypeCode);
  const type = floorType ? floorTypeLabel(floorType) : "";
  return `${type} ${floor.floorNumber ?? ""}${floor.floorNumber === null ? "" : "층"}`.trim();
}

/**
 * 「이」· 「가」를 문장 끝 한글 받침으로 가른다 — 받침 있으면 「이」, 없으면 「가」. 괄호 같은 한글이 아닌 글자로
 * 끝나도 그 앞의 마지막 한글 글자를 본다. 한글이 아예 없으면(모르는 값을 코드 그대로 보일 때) 「이(가)」로 그대로 둔다.
 * store-form.ts 의 수정 칸 아래 안내 문구가 쓴다.
 */
export function finalJosa(text: string): string {
  const match = text.match(/[가-힣](?=[^가-힣]*$)/);
  if (!match) return "이(가)";
  return (match[0].charCodeAt(0) - 0xac00) % 28 === 0 ? "가" : "이";
}

/** 폐점 · 삭제를 막는 조건 — 1차에서는 진행 중 근로계약만 본다(구독 · 정산은 범위 밖) */
export function closeBlockText(t: Pick<StoreTransitions, "inProgressContractCount">): string | null {
  return t.inProgressContractCount > 0 ? `진행 중인 근로계약이 ${t.inProgressContractCount.toLocaleString("ko-KR")}건 있습니다.` : null;
}
