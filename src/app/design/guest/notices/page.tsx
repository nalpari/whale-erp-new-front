import type { Metadata } from "next";
import Link from "next/link";
import { FaqItem } from "../guest-ui";
import { SAMPLE_ROUTES } from "../guest-routes";
import { HOVER } from "../theme";
import { SAMPLE_NOTICES, sampleTypeLabel } from "./notice-sample";
import { NoticeRows, NoticesScreen, Pager } from "./notice-views";

export const metadata: Metadata = { title: "Whale ERP · 공지사항 · FAQ" };

const STRONG = "font-semibold text-guest-ink";

export default function NoticesPage() {
  const notices = (
    <>
      <NoticeRows items={SAMPLE_NOTICES} typeLabel={sampleTypeLabel} hrefOf={() => `${SAMPLE_ROUTES.notices}/detail`} />
      <Pager page={1} total={30} pageSize={10} hrefOf={() => SAMPLE_ROUTES.notices} />
    </>
  );

  const faq = (
    <div className="flex flex-col gap-[8px] pt-[24px]">
      <FaqItem q="가입은 누가 할 수 있나요?" category="가입·계정" open>
        식당·카페를 직접 운영하는 <b className={STRONG}>일반 BP</b>와 가맹점을 두는 <b className={STRONG}>본사 BP</b>가 직접 가입합니다. 가맹점은 가입하지 않고,
        본사가 만들어 준 관리자 계정으로 로그인합니다.
      </FaqItem>
      <FaqItem q="직원도 이 사이트로 로그인하나요?" category="가입·계정">
        아닙니다. 직원은 <b className={STRONG}>직원 전용 앱</b>으로 들어갑니다. 관리자가 근로계약서 초안을 저장하면 초대가 문자로 나가고, 직원은 앱에서 가입과 계약서
        날인을 합니다.
      </FaqItem>
      <FaqItem q="점포가 여러 개면 어떻게 보나요?" category="점포·설비">
        화면 위쪽에서 조회 범위를 고릅니다. 전체·직영·가맹 또는 점포 하나를 고르면 그 뒤의 모든 조회가 그 범위로 맞춰집니다.
      </FaqItem>
      <FaqItem q="급여를 계산해 주나요?" category="직원·근로">
        근로계약과 출퇴근 기록을 참조해 <b className={STRONG}>초안</b>을 만들어 드립니다. 4대보험 같은 공제는 관리자가 직접 넣고, 급여 지급 자체는 제공하지 않습니다.
      </FaqItem>
      <FaqItem q="요금은 어떻게 되나요?" category="요금·구독">
        점포 수와 직원 수에 따른 요금 PLAN이 있고, POS·KIOSK 같은 부가서비스는 따로 구독합니다. 자세한 내용은{" "}
        <Link href={SAMPLE_ROUTES.inquiry} className={`font-semibold text-guest-navy underline underline-offset-[3px] hover:text-guest-ink ${HOVER}`}>
          도입문의
        </Link>
        로 물어보실 수 있습니다.
      </FaqItem>
    </div>
  );

  return <NoticesScreen inquiryHref={SAMPLE_ROUTES.inquiry} notices={notices} faq={faq} />;
}
