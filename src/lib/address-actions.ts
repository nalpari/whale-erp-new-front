"use server";

import { getSession, request } from "./api";
import { getAddressCoordinate, searchAddresses, type AddressCoordinateResult, type AddressSearchResult } from "./address-search";

// 주소 검색 · 좌표 조회 server action. 공용 주소 칸(components/address-field.tsx)과 점포 폼이 같이 쓰므로 app 이 아니라 lib 에 둔다.
// 승인키(행정안전부 · 카카오)를 브라우저에 내보내지 않으려고 서버를 거친다.
// server action 은 어느 주소로 POST 해도 실행되는 공개 엔드포인트다. 다른 액션은 토큰을 api 에 실어 api 가 판정하지만,
// 이 둘은 api 를 거치지 않고 서버 키를 바로 쓰므로 키를 쓰기 전에 토큰을 api 로 확인한다.
const LOGIN_REQUIRED = "로그인이 필요합니다. 다시 로그인해 주세요.";

// 확인한 토큰 → 확인 시각. 주소 칸은 칠 때마다 부르므로 같은 토큰은 잠시 다시 묻지 않는다.
// 쿠키는 모양만 보면 꾸밀 수 있어(session.ts parseSession) api 가 받아 준 토큰만 담는다.
const VERIFIED_FOR_MS = 5 * 60_000;
const VERIFIED_MAX = 500;
const verifiedTokens = new Map<string, number>();

/** 로그인 세션의 토큰이 api 에서 통하는지. 실패(401 · 403 · 연결 실패)는 모두 아님으로 본다 — 키를 쓰지 않는 쪽이 안전하다. */
async function hasValidSession(): Promise<boolean> {
  const token = (await getSession())?.accessToken;
  if (!token) return false;
  const now = Date.now();
  const at = verifiedTokens.get(token);
  if (at !== undefined && now - at < VERIFIED_FOR_MS) return true;
  try {
    // 관리자 토큰을 받는 가장 가벼운 조회다. 강제 비밀번호 변경 전 계정도 통과한다(@AllowPasswordChangePending).
    await request("/auth/admin/login-info", { headers: { Authorization: `Bearer ${token}` } });
  } catch (error) {
    verifiedTokens.delete(token);
    if (process.env.NODE_ENV === "development") console.warn("주소 액션 — 세션 확인 실패", error);
    return false;
  }
  if (verifiedTokens.size >= VERIFIED_MAX) {
    for (const [key, time] of verifiedTokens) if (now - time >= VERIFIED_FOR_MS) verifiedTokens.delete(key);
    if (verifiedTokens.size >= VERIFIED_MAX) verifiedTokens.clear();
  }
  verifiedTokens.set(token, now);
  return true;
}

export async function searchAddressAction(keyword: string, page: number): Promise<AddressSearchResult> {
  if (!(await hasValidSession())) return { ok: false, message: LOGIN_REQUIRED };
  if (typeof keyword !== "string") return { ok: true, items: [], total: 0 };
  return searchAddresses(keyword, Number.isInteger(page) && page >= 1 && page <= 100 ? page : 1);
}

/**
 * 고른 주소의 위도 · 경도 — 도로명주소(참고항목을 뺀 AddressItem.roadAddressBase), 못 찾으면 지번주소로.
 * 브라우저가 보낸 값이라 글자 · 길이를 보고 넘긴다.
 */
export async function getAddressCoordinateAction(roadAddressBase: string, jibunAddress: string): Promise<AddressCoordinateResult> {
  if (!(await hasValidSession())) return { ok: false, message: LOGIN_REQUIRED };
  const queries = [roadAddressBase, jibunAddress].filter((q): q is string => typeof q === "string" && q.trim().length >= 2 && q.length <= 200);
  if (!queries.length) return { ok: false, message: "이 주소의 위도 · 경도를 찾지 못했습니다. 직접 적어 주세요." };
  return getAddressCoordinate(queries.map((q) => q.trim()));
}
