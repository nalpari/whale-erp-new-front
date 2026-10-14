"use server";

import { searchAddresses, type AddressSearchResult } from "@/lib/address-search";

// 주소 검색. 플랫폼 화면의 주소 칸들이 같이 쓴다. 승인키를 브라우저에 내보내지 않으려고 서버를 거친다.
// TODO(로그인): 로그인이 생기면 세션이 있을 때만 부르게 한다 — 지금은 누구나 부를 수 있는 공개 엔드포인트다.
export async function searchAddressAction(keyword: string, page: number): Promise<AddressSearchResult> {
  if (typeof keyword !== "string") return { ok: true, items: [], total: 0 };
  return searchAddresses(keyword, Number.isInteger(page) && page >= 1 && page <= 100 ? page : 1);
}
