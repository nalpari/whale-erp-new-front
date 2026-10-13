import type { Metadata } from "next";
import Link from "next/link";
import { GuestButton, GuestPage, GuestVisual, TRIM } from "../../guest-ui";
import { HOVER } from "../../theme";

export const metadata: Metadata = { title: "Whale ERP · 가입 완료" };

// 사업자 회원가입 완료. 기획 시안(Claude 아티팩트 「Whale ERP 회원가입」의 signup-done)을 로그인 화면과 같은 두 칸 틀로 옮겼다.
// 가입 API 가 없어 회원가입 폼이 주소로 넘긴 값을 보인다. 바로 열면 시안의 예시 값을 쓴다.
export default async function SignUpCompletePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const value = (key: string, fallback: string) => (typeof query[key] === "string" && query[key]) || fallback;
  const companyName = value("companyName", "㈜한강상회");
  const loginId = value("loginId", "hangang01");
  const email = value("email", "hayoon@hangang.co.kr");

  return (
    <GuestPage flush>
      <section className="grid min-h-[730px] grid-cols-2">
        <GuestVisual
          eyebrow="Business membership"
          title={<p className={`text-[42px] leading-normal font-extrabold tracking-[-0.025em] text-[rgba(58,86,112,0.6)] ${TRIM}`}>내 매장의 첫 페이지를 열어보세요</p>}
        >
          가입하고 오늘부터 바로 매장 관리를 시작하세요.
        </GuestVisual>
        <div className="flex items-center justify-center px-[200px] py-[80px] text-guest-ink">
          <div className="flex w-full flex-col items-center gap-[32px] text-center">
            <div className="flex flex-col items-center gap-[12px]">
              <h1 className="text-[28px] leading-[1.2] font-bold">가입을 환영합니다</h1>
              <p className="text-[18px] leading-[1.5] font-medium">
                {companyName} · 아이디 {loginId}
              </p>
              <p className="text-[16px] leading-[1.5] text-[#767676]">
                가입 안내 메일을 <strong className="font-semibold text-guest-ink">{email}</strong>로 보냈습니다.
              </p>
            </div>
            {/* 시작하기는 로그인 화면으로 간다. 가입한 아이디로 로그인해 들어온다. */}
            <div className="grid w-[280px]">
              <GuestButton tone="navy" href="/design/guest/login" arrow tall>
                웨일ERP 시작하기
              </GuestButton>
            </div>
            <p className="w-full rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.4] text-guest-navy">
              이 화면은 10분 동안만 열립니다.
              <br />
              시간이 지나면{" "}
              <Link href="/design/guest/login" className={`font-semibold underline underline-offset-[3px] hover:text-guest-ink ${HOVER}`}>
                로그인 화면
              </Link>
              에서 가입한 아이디로 들어오세요.
            </p>
          </div>
        </div>
      </section>
    </GuestPage>
  );
}
