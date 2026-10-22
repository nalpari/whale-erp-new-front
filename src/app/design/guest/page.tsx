import type { Metadata } from "next";
import { GuestHome, HomeFaqList, HomeNewsList } from "./guest-home";
import { SAMPLE_ROUTES } from "./guest-routes";

export const metadata: Metadata = { title: "Whale ERP · 비로그인 메인" };

// 시안에 답변이 있는 질문은 둘째 하나뿐이다(펼쳐 둔다). 실제 홈은 api 의 FAQ 를 넣는다.
const FAQS = [
  { key: 1, q: "사업자등록번호 없이도 가입할 수 있나요?", a: null },
  {
    key: 2,
    q: "가입하면 바로 쓸 수 있는 범위가 있나요?",
    a: "네, 가입할 때는 필요하지 않습니다. 다만 매장을 등록하거나, 직원을 고용하거나, 세금계산서 발행이 필요한 부가서비스를 구독할 때는 사업자등록번호를 입력해야 합니다.",
    open: true,
  },
  { key: 3, q: "직원도 앱을 설치해야 하나요?", a: null },
  { key: 4, q: "부가서비스는 중간에 해지할 수 있나요?", a: null },
];

const NEWS = [
  { postId: 1, title: "WHALE ERP 1차 서비스 오픈 안내", noticeType: "GENERAL" as const },
  { postId: 2, title: "정기 시스템 점검 (11/05 02:00~04:00)", noticeType: "MAINTENANCE" as const },
  { postId: 3, title: "개인정보처리방침 개정 안내", noticeType: null },
  { postId: 4, title: "Pick up Order 서비스 출시 예정 안내", noticeType: null },
  { postId: 5, title: "직원 전용 앱 출퇴근 QR 기능 안내", noticeType: null },
  { postId: 6, title: "추석 연휴 고객센터 운영 안내", noticeType: null },
].map((n) => ({ ...n, isPinned: false, postedDate: "2026-10-30" }));

const SAMPLE_TYPE_LABEL: Record<string, string> = { GENERAL: "안내", MAINTENANCE: "점검" };

export default function GuestMainPage() {
  return (
    <GuestHome
      routes={SAMPLE_ROUTES}
      faq={<HomeFaqList items={FAQS} />}
      news={<HomeNewsList items={NEWS} typeLabel={(t) => SAMPLE_TYPE_LABEL[t] ?? t} hrefOf={() => SAMPLE_ROUTES.notices} />}
    />
  );
}
