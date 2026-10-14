// 주소 검색어 다듬기. 승인키를 읽는 address-search.ts 는 server-only 라 node --test 에서 불러올 수 없어 따로 둔다.

/**
 * 검색어 다듬기. 행정안전부 도로명주소 API 안내대로 특수문자와 SQL 예약어처럼 보이는 낱말은 빼고 보낸다 —
 * 그대로 보내면 API 가 오류(E0012 특수문자 · E0013 SQL 예약어)로 돌려준다. 두 글자 미만이면 검색하지 않는다.
 */
export function cleanAddressKeyword(raw: string): string {
  return raw
    .replace(/[%=><[\]\\'";]/g, " ")
    .replace(/\b(OR|SELECT|INSERT|DELETE|UPDATE|CREATE|DROP|EXEC|UNION|FETCH|DECLARE|TRUNCATE)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
