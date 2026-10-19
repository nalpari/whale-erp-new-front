import { apiError, baseUrl } from "./api";

// 약관 조회(로그인 없이 열리는 공개 API — 전례 /public-code-items). 약관 전문 화면(/terms)과 약관 팝업(TermsLink)이 쓴다.
// 문구 원본은 api DB(terms_versions)다. 유형은 공통코드 TERMS_TYPE 6종을 그대로 키로 쓴다(2026-10-19 재영).

// shortcut: api 의 /public-terms-versions 가 아직 openapi 에 없어 손으로 적은 모양이다 — api 가 `pnpm openapi:export` 한 뒤
// `pnpm openapi:types` 로 다시 만들고 components["schemas"]["TermsVersionResponseDto"] 등으로 바꾼다.
export interface TermsVersion {
  termsTypeCode: string;
  /** 탭 이름(공통코드 TERMS_TYPE 의 label) */
  label: string;
  /** 본문 제목 */
  title: string;
  version: string;
  /** 시행일 `2026-10-01` */
  effectiveDate: string;
}
export interface TermsVersionDetail extends TermsVersion {
  /** Markdown(제목 ## · 문단 · 1. 목록 · GFM 표). HTML 은 그리지 않는다. */
  content: string;
}

// 약관 전문 화면(/terms)은 읽기만 하므로 getEnum 처럼 한 시간 캐시한다 — 개정 뒤 늦어도 한 시간 안에 화면에 반영된다.
// 동의를 받는 팝업(강제 비밀번호 변경 · 회원가입 내용보기, terms-actions.ts)은 fresh 로 캐시 없이 받는다 — 보여 준 버전과
// api 가 동의를 기록하는 사용 중 버전이 어긋나지 않게.
// request() 는 cache: "no-store" 를 고정해 캐시 옵션과 함께 쓸 수 없어 fetch 를 직접 쓴다.
async function getTerms<T>(path: string, fresh: boolean): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, fresh ? { cache: "no-store" } : { next: { revalidate: 3600 } });
  if (!response.ok) throw await apiError(response);
  return (await response.json()) as T;
}

/** GET /public-terms-versions — 사용 중인 약관 6종, TERMS_TYPE 정렬 순서. 한 시간 캐시. 응답에 items 배열이 없으면 던진다. */
export async function getTermsVersions(): Promise<TermsVersion[]> {
  const body = await getTerms<{ items?: unknown }>("/public-terms-versions", false);
  // 모양이 어긋난 응답(프록시 오류 화면 · api 변경)이 화면 그리기까지 가서 터지지 않게 여기서 막는다 — 부르는 쪽이 안내로 바꾼다.
  if (!Array.isArray(body?.items)) throw new Error("GET /public-terms-versions 응답에 items 배열이 없습니다");
  return body.items as TermsVersion[];
}

/** GET /public-terms-versions/{termsTypeCode} — 사용 중인 버전 하나와 본문. 없으면 404(ApiError). fresh 면 캐시 없이 받는다. */
export async function getTermsVersion(termsTypeCode: string, { fresh = false } = {}): Promise<TermsVersionDetail> {
  return getTerms(`/public-terms-versions/${encodeURIComponent(termsTypeCode)}`, fresh);
}
