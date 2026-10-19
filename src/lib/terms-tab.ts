// 약관 전문 화면(/terms)의 고른 탭. 주소 해시가 약관 유형 코드 그대로다(#TERMS_SERVICE). 모르는 해시·해시 없음은 첫 탭.
// next/* 를 import 하지 않는다 — node --test 로 바로 돌리기 위해서다.
export function tabOfHash(hash: string, codes: readonly string[]): string | undefined {
  return codes.find((code) => `#${code}` === hash) ?? codes[0];
}
