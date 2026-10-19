import type { Metadata } from "next";
import { connection } from "next/server";
import { TermsMarkdown } from "@/components/site/terms-markdown";
import { getTermsVersion, getTermsVersions, type TermsVersionDetail } from "@/lib/terms";
import { TermsTabs } from "./terms-tabs";

export const metadata: Metadata = { title: "약관 전문 · Whale ERP" };

// 약관 목록과 여섯 본문을 한 번에 받는다 — 본문이 작고, 탭을 바꿀 때 기다리지 않게. 받은 응답은 lib/terms.ts 가 한 시간 캐시한다.
// 실패(api 장애 · 사용 중 버전 없음 404)는 화면을 깨지 않고 본문 자리에 안내를 둔다. 원인은 서버 로그에 남긴다.
async function loadTerms(): Promise<TermsVersionDetail[] | null> {
  try {
    const versions = await getTermsVersions();
    return await Promise.all(versions.map((v) => getTermsVersion(v.termsTypeCode)));
  } catch (error) {
    console.error("약관을 받지 못했습니다", error);
    return null;
  }
}

// 약관 전문(데모 auth/terms.html). 푸터의 이용약관·개인정보처리방침이 #TERMS_SERVICE · #PRIVACY_COLLECT 로 들어온다.
// Figma 시안이 없어 데모처럼 비로그인 디자인(회원가입·공지사항과 같은 틀)으로 맞췄다. 문구 원본은 api(terms_versions)다.
export default async function TermsPage() {
  // 요청마다 그린다 — 빌드 때 api 가 없어 안내 화면이 정적 페이지로 굳지 않게. api 응답 캐시(한 시간)는 그대로 쓴다.
  await connection();
  const terms = await loadTerms();

  return (
    <section className="mx-auto flex w-[1200px] flex-col gap-[40px] pt-[80px] pb-[60px] text-guest-ink">
      <div className="flex flex-col gap-[8px]">
        <h1 className="text-[28px] leading-[1.2] font-bold">약관 전문</h1>
        <p className="text-[16px] leading-[1.5]">Whale ERP 서비스 이용에 적용되는 약관과 개인정보 처리 기준입니다.</p>
      </div>
      {terms ? (
        <TermsTabs
          tabs={terms.map((t) => ({
            code: t.termsTypeCode,
            label: t.label,
            panel: (
              <div className="flex flex-col gap-[32px]">
                <div className="flex flex-col gap-[8px] border-b border-[#ebebeb] pb-[24px]">
                  <h2 className="text-[22px] leading-[1.4] font-semibold text-guest-ink">{t.title}</h2>
                  <p className="text-[15px] text-[#767676]">
                    {t.version} · 시행일 {t.effectiveDate}
                  </p>
                </div>
                <div className="text-[16px] leading-[1.7] text-guest-body [&_h3]:text-[17px] [&_h3]:text-guest-ink">
                  <TermsMarkdown content={t.content} />
                </div>
              </div>
            ),
          }))}
        />
      ) : (
        // #999 빈 값 회색: DESIGN.md Neutral 의 「데이터가 없을 때의 안내 문구」
        <p role="alert" className="border-y border-[#ebebeb] py-[60px] text-center text-[16px] text-[#999]">
          약관을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.
        </p>
      )}
    </section>
  );
}
