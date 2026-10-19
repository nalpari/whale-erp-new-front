// 약관 전문 화면(/terms)의 고른 탭. 주소 해시가 약관 유형 코드 그대로다(#TERMS_SERVICE). 모르는 해시·해시 없음은 첫 탭.
// next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.
export function tabOfHash(hash: string, codes: readonly string[]): string | undefined {
  return codes.find((code) => `#${code}` === hash) ?? codes[0];
}

export interface SettledTerms<T> {
  /** 받은 본문을 목록 순서대로. 하나도 없으면 null — 화면은 안내 문구를 보인다. */
  terms: T[] | null;
  /** 받지 못한 본문의 유형 코드와 원인. 로그에 남기고, terms 가 있으면 「일부를 불러오지 못했다」고 알린다. */
  failed: { code: string; reason: unknown }[];
}

// 약관 전문 화면은 본문 여섯 개를 allSettled 로 받는다. 실패한 본문은 그 탭만 빼고, 목록이 비었거나 모두 실패했을 때만 안내로 간다.
export function settleTerms<T>(codes: readonly string[], results: readonly PromiseSettledResult<T>[]): SettledTerms<T> {
  const terms: T[] = [];
  const failed: SettledTerms<T>["failed"] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") terms.push(result.value);
    else failed.push({ code: codes[i], reason: result.reason });
  });
  return { terms: terms.length > 0 ? terms : null, failed };
}
