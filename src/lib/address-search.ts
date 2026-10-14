// 주소 검색 — 행정안전부 도로명주소 검색 API(business.juso.go.kr addrLinkApi). 우편번호 · 도로명 · 지번을 함께 준다.
// 승인키(JUSO_API_KEY)는 서버에만 둔다 — 브라우저는 server action 을 거쳐 부른다. 개발용 키는 juso.go.kr 에서 바로 받는다.
// 이 함수는 서버에서만 부른다(server action · 서버 컴포넌트). 클라이언트가 값을 import 하면 빌드가 멈춘다(server-only) —
// 타입만은 import type 으로 가져가도 된다.
import "server-only";
import { cleanAddressKeyword } from "./address-keyword";

const ENDPOINT = "https://business.juso.go.kr/addrlink/addrLinkApi.do";
export const ADDRESS_PAGE_SIZE = 10;

export type AddressItem = {
  zipCode: string;
  /** 도로명주소(참고항목 포함) */
  roadAddress: string;
  jibunAddress: string;
  /** 건물명. 없으면 빈 문자열 */
  buildingName: string;
};

export type AddressSearchResult = { ok: true; items: AddressItem[]; total: number } | { ok: false; message: string };

type JusoResponse = {
  results?: {
    common?: { errorCode?: string; errorMessage?: string; totalCount?: string };
    juso?: { zipNo?: string; roadAddr?: string; jibunAddr?: string; bdNm?: string }[] | null;
  };
};

export async function searchAddresses(rawKeyword: string, page = 1): Promise<AddressSearchResult> {
  const key = process.env.JUSO_API_KEY;
  if (!key) return { ok: false, message: "주소 검색 승인키(JUSO_API_KEY)가 설정되지 않았습니다." };
  const keyword = cleanAddressKeyword(rawKeyword);
  if (keyword.length < 2) return { ok: true, items: [], total: 0 };

  const params = new URLSearchParams({
    confmKey: key,
    currentPage: String(page),
    countPerPage: String(ADDRESS_PAGE_SIZE),
    keyword,
    resultType: "json",
  });
  try {
    // 캐시하지 않는다 — 이 API 는 오류도 HTTP 200 으로 주므로, 캐시하면 일시 오류(E9999 등)가 그 검색어에 오래 붙는다.
    // 치는 동안은 화면이 0.3초 쉬었다가 부르므로 부르는 횟수는 많지 않다.
    const response = await fetch(`${ENDPOINT}?${params}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as JusoResponse;
    const common = body.results?.common;
    if (common?.errorCode !== "0") {
      // E0001 승인키 · E0005 검색어 없음 · E0006 시도 · 시군구만 · E0008 한 글자 · E0009 숫자만 · E0012 특수문자 · E0013 SQL 예약어 등
      console.warn("주소 검색 API 오류", common?.errorCode, common?.errorMessage);
      return { ok: false, message: common?.errorMessage || "주소를 검색하지 못했습니다." };
    }
    return {
      ok: true,
      total: Number(common.totalCount) || 0,
      items: (body.results?.juso ?? []).map((j) => ({
        zipCode: j.zipNo ?? "",
        roadAddress: j.roadAddr ?? "",
        jibunAddress: j.jibunAddr ?? "",
        buildingName: j.bdNm ?? "",
      })),
    };
  } catch (error) {
    console.error("주소 검색 실패", error);
    return { ok: false, message: "주소 검색 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
