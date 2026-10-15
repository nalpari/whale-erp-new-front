"use server";

import { getSession } from "./api";
import { getAddressCoordinate, searchAddresses, type AddressCoordinateResult, type AddressSearchResult } from "./address-search";

// 주소 검색 · 좌표 조회 server action. 공용 주소 칸(components/address-field.tsx)과 점포 폼이 같이 쓰므로 app 이 아니라 lib 에 둔다.
// 승인키(행정안전부 · 카카오)를 브라우저에 내보내지 않으려고 서버를 거친다.
// server action 은 어느 주소로 POST 해도 실행되는 공개 엔드포인트라, 로그인 세션이 없으면 서버 키를 쓰지 않고 돌려보낸다.
const LOGIN_REQUIRED = "로그인이 필요합니다. 다시 로그인해 주세요.";

export async function searchAddressAction(keyword: string, page: number): Promise<AddressSearchResult> {
  if (!(await getSession())) return { ok: false, message: LOGIN_REQUIRED };
  if (typeof keyword !== "string") return { ok: true, items: [], total: 0 };
  return searchAddresses(keyword, Number.isInteger(page) && page >= 1 && page <= 100 ? page : 1);
}

/**
 * 고른 주소의 위도 · 경도 — 도로명주소(참고항목을 뺀 AddressItem.roadAddressBase), 못 찾으면 지번주소로.
 * 브라우저가 보낸 값이라 글자 · 길이를 보고 넘긴다.
 */
export async function getAddressCoordinateAction(roadAddressBase: string, jibunAddress: string): Promise<AddressCoordinateResult> {
  if (!(await getSession())) return { ok: false, message: LOGIN_REQUIRED };
  const queries = [roadAddressBase, jibunAddress].filter((q): q is string => typeof q === "string" && q.trim().length >= 2 && q.length <= 200);
  if (!queries.length) return { ok: false, message: "이 주소의 위도 · 경도를 찾지 못했습니다. 직접 적어 주세요." };
  return getAddressCoordinate(queries.map((q) => q.trim()));
}
