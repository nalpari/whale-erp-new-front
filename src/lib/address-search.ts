// 주소 검색 — 행정안전부 도로명주소 검색 API(business.juso.go.kr addrLinkApi). 우편번호 · 도로명 · 지번을 함께 준다.
// 승인키(JUSO_API_KEY)는 서버에만 둔다 — 브라우저는 server action 을 거쳐 부른다. 개발용 키는 juso.go.kr 에서 바로 받는다.
// 이 함수는 서버에서만 부른다(server action · 서버 컴포넌트). 클라이언트가 값을 import 하면 빌드가 멈춘다(server-only) —
// 타입만은 import type 으로 가져가도 된다.
// 좌표 — 카카오 로컬 API 「주소 검색」(KAKAO_REST_API_KEY, 서버에서만). 아래 getAddressCoordinate.
// 키가 없거나 승인키 · 앱 설정이 틀리면 서버 로그(error)에 남기고, 사용자에게는 환경 변수 이름 대신 할 일을 보인다.
import "server-only";
import { cleanAddressKeyword } from "./address-keyword";
import { coordinateOfKakao } from "./kakao-coordinate";

const ENDPOINT = "https://business.juso.go.kr/addrlink/addrLinkApi.do";
export const ADDRESS_PAGE_SIZE = 10;

export type AddressItem = {
  zipCode: string;
  /** 도로명주소(참고항목 포함) */
  roadAddress: string;
  /** 도로명주소(참고항목 뺌) — 좌표를 물을 때 쓴다. 괄호 속 동 이름이 붙으면 카카오가 찾지 못한다 */
  roadAddressBase: string;
  jibunAddress: string;
  /** 건물명. 없으면 빈 문자열 */
  buildingName: string;
};

export type AddressSearchResult = { ok: true; items: AddressItem[]; total: number } | { ok: false; message: string };

type JusoResponse = {
  results?: {
    common?: { errorCode?: string; errorMessage?: string; totalCount?: string };
    juso?: { zipNo?: string; roadAddr?: string; roadAddrPart1?: string; jibunAddr?: string; bdNm?: string }[] | null;
  };
};

export async function searchAddresses(rawKeyword: string, page = 1): Promise<AddressSearchResult> {
  const key = process.env.JUSO_API_KEY;
  if (!key) {
    console.error("JUSO_API_KEY 가 설정되지 않아 주소를 검색하지 못합니다");
    return { ok: false, message: "지금은 주소를 검색할 수 없습니다. 계속되면 관리자에게 알려 주세요." };
  }
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
    if (!common) {
      // 응답 모양이 바뀌었다 — 검색어 탓이 아니므로 원인을 남긴다
      console.error("주소 검색 응답 모양이 다릅니다", body);
      return { ok: false, message: "주소를 검색하지 못했습니다. 잠시 후 다시 시도해 주세요." };
    }
    if (common.errorCode === "E0001" || common.errorCode === "E0014") {
      // 승인키 오류(E0001) · 기간이 지난 개발 승인키(E0014) — 매번 실패하는 설정 오류다. 사용자가 고칠 수 없으니 juso 원문을 보이지 않는다
      console.error("주소 검색 승인키 오류", common.errorCode, common.errorMessage);
      return { ok: false, message: "지금은 주소를 검색할 수 없습니다. 계속되면 관리자에게 알려 주세요." };
    }
    if (common.errorCode?.startsWith("-")) {
      // juso 시스템 오류(-999 등) — 검색어 탓이 아니다
      console.error("주소 검색 시스템 오류", common.errorCode, common.errorMessage);
      return { ok: false, message: "주소를 검색하지 못했습니다. 잠시 후 다시 시도해 주세요." };
    }
    if (common.errorCode !== "0") {
      // E0005 검색어 없음 · E0006 시도 · 시군구만 · E0008 한 글자 · E0009 숫자만 · E0012 특수문자 · E0013 SQL 예약어 등 — 검색어를 고치면 된다
      console.warn("주소 검색 API 오류", common.errorCode, common.errorMessage);
      return { ok: false, message: common.errorMessage || "주소를 검색하지 못했습니다." };
    }
    return {
      ok: true,
      total: Number(common.totalCount) || 0,
      items: (body.results?.juso ?? []).map((j) => ({
        zipCode: j.zipNo ?? "",
        roadAddress: j.roadAddr ?? "",
        // 참고항목이 붙은 roadAddr 로 대신하지 않는다(카카오가 못 찾는다) — 없으면 비우고 지번주소로 묻는 데 맡긴다
        roadAddressBase: j.roadAddrPart1 ?? "",
        jibunAddress: j.jibunAddr ?? "",
        buildingName: j.bdNm ?? "",
      })),
    };
  } catch (error) {
    console.error("주소 검색 실패", error);
    return { ok: false, message: "주소 검색 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

const COORDINATE_ENDPOINT = "https://dapi.kakao.com/v2/local/search/address.json";
const TYPE_BY_HAND = "위도 · 경도를 직접 적어 주세요.";

export type AddressCoordinateResult = { ok: true; latitude: number; longitude: number } | { ok: false; message: string };

/**
 * 주소 글자로 위도 · 경도를 찾는다 — 카카오 로컬 API 「주소 검색」(dapi.kakao.com). 화면 없이 서버끼리 JSON 만 주고받는다.
 * REST API 키(KAKAO_REST_API_KEY)는 서버에만 둔다. queries 를 차례로 묻고 처음 찾은 좌표를 돌려준다(호출 쪽이 도로명 → 지번 순으로 준다).
 * 찾은 것이 없으면 다음 것을 묻고, HTTP 오류나 응답 모양이 다르면 더 묻지 않고 실패를 돌려준다. 응답 해석은 kakao-coordinate.ts.
 */
export async function getAddressCoordinate(queries: string[]): Promise<AddressCoordinateResult> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    console.error("KAKAO_REST_API_KEY 가 설정되지 않아 좌표를 가져오지 못합니다");
    return { ok: false, message: `지금은 좌표를 자동으로 가져올 수 없습니다. ${TYPE_BY_HAND}` };
  }
  try {
    for (const query of queries.filter(Boolean)) {
      const params = new URLSearchParams({ query, size: "1" });
      const response = await fetch(`${COORDINATE_ENDPOINT}?${params}`, {
        headers: { Authorization: `KakaoAK ${key}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        // 401 키 오류 · 403 앱에 카카오맵 사용 설정이 꺼짐은 매번 실패하는 설정 오류다. 429 는 사용량 초과(잠시 뒤 풀림)
        const detail = await response.text().catch(() => "");
        if (response.status === 401 || response.status === 403) console.error("카카오 주소 검색 설정 오류", response.status, detail);
        else console.warn("카카오 주소 검색 오류", response.status, detail);
        return { ok: false, message: `좌표를 가져오지 못했습니다. ${TYPE_BY_HAND}` };
      }
      const body: unknown = await response.json().catch(() => null);
      const coordinate = coordinateOfKakao(body);
      if (coordinate.kind === "found") return { ok: true, latitude: coordinate.latitude, longitude: coordinate.longitude };
      if (coordinate.kind === "malformed") {
        console.error("카카오 주소 검색 응답 모양이 다릅니다", body);
        return { ok: false, message: `좌표를 가져오지 못했습니다. ${TYPE_BY_HAND}` };
      }
    }
    return { ok: false, message: `이 주소의 위도 · 경도를 찾지 못했습니다. ${TYPE_BY_HAND}` };
  } catch (error) {
    console.error("좌표 조회 실패", error);
    return { ok: false, message: `좌표 서버에 연결하지 못했습니다. ${TYPE_BY_HAND}` };
  }
}
