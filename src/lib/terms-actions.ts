"use server";

import { getTermsVersion, type TermsVersionDetail } from "./terms";

// 약관 팝업(TermsLink · 회원가입 TermsDialog)이 열 때 본문을 받는 server action. 동의를 받는 자리라 캐시 없이 사용 중 버전을 받는다. 팝업이 클라이언트 컴포넌트라 api 를 바로 부를 수 없어 서버를 거친다.
// 공개 약관만 돌려주므로 로그인 확인은 하지 않는다(api 도 @Public). 실패는 던지지 않고 null — 팝업이 안내 문구를 보인다.
export async function getTermsVersionAction(termsTypeCode: string): Promise<TermsVersionDetail | null> {
  try {
    return await getTermsVersion(termsTypeCode, { fresh: true });
  } catch (error) {
    console.error(`약관 「${termsTypeCode}」을 받지 못했습니다`, error);
    return null;
  }
}
