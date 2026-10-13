import Link from "next/link";
import { Badge, DetailValues, type Column, type DetailRow, type HeaderMenu, type UserPopItem } from "@/components/common";

// /design 샘플 화면에 넣는 더미 데이터와, 그 값을 그리는 데 필요한 만큼의 표현(배지·링크). Figma 시안의 값을 그대로 옮겼다.

// 화면이 생긴 메뉴만 실제 주소로 잇는다. 나머지는 아직 시안이라 "#".
const ROUTES: Record<string, string> = {
  "직원 정보 관리": "/staff-members",
  "근로계약 관리": "/contracts",
};

const menu = (label: string, items: string[]): HeaderMenu => ({
  label,
  items: items.map((item) => ({ label: item, href: ROUTES[item] ?? "#" })),
});

export const MENUS: HeaderMenu[] = [
  menu("기초정보관리", ["상품 정보 관리", "가격 정보 관리", "카테고리 정보 관리", "자재 정보 관리"]),
  menu("점포관리", ["점포 정보 관리", "계약서 템플릿 관리", "계약서 관리", "시설물 및 장비 관리", "점검표 템플릿 관리", "점검 결과 관리"]),
  menu("직원관리", ["직원 정보 관리", "근로계약 관리", "급여명세서 관리", "근무 스케줄 관리", "출·퇴근 현황 조회", "TO-DO List 관리"]),
  menu("매출조회", ["매출 조회", "매출 통계", "매출 분석"]),
  menu("재무관리", ["입·출금 관리", "매출/매입 거래 등록", "계정별 현황 조회"]),
  menu("환경설정", ["관리자 관리", "권한 관리", "공통코드 관리", "휴일 관리"]),
  menu("고객지원", ["부가서비스 구독 관리", "구독료 청구 및 납부 현황", "결제수단 관리", "정산 현황 조회", "공지사항", "문의하기"]),
];

export const STORES = [
  "힘이나는커피생활 종로점 BP1234",
  "(상담중) 동해에서잡아온- BIM1234",
  "(운영) 동해물과 – BIM1111",
  "(종료) 동해횟집 – BIM0012",
];

export const USER_ITEMS: UserPopItem[] = [
  { label: "내정보 관리", href: "#" },
  { label: "비밀번호 변경", href: "#" },
  // 샘플이라 실제 로그아웃(logoutAction)을 연결하지 않는다. 실제 화면에서는 action: logoutAction(@/app/login/actions) 을 넘긴다.
  { label: "로그아웃", href: "#", danger: true },
];

export type StoreRow = {
  no: number;
  bpName: string;
  on: boolean;
  type: string;
  store: string;
  phone: string;
  owner: string;
  contract: string;
  createdAt: string;
};

export const STORE_ROWS: StoreRow[] = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((no) => ({
  no,
  bpName: "주식회사 따름인",
  on: [10, 8, 4, 3, 1].includes(no),
  type: "일반점포",
  store: "힘이나는커피생활 종로점",
  phone: "02 324 0328",
  owner: "홍길동",
  contract: "계약서보기",
  createdAt: "2025.08.28",
}));

export const STORE_COLUMNS: Column<StoreRow>[] = [
  { header: "번호", width: "w-[60px]", cell: (r) => r.no },
  { header: "BP 상호명", align: "left", cell: (r) => r.bpName },
  { header: "점포상태", width: "w-[98px]", cell: (r) => <Badge tone={r.on ? "on" : "off"}>{r.on ? "운영" : "미운영"}</Badge> },
  { header: "점포유형", width: "w-[180px]", cell: (r) => r.type },
  { header: "점포명", width: "w-[320px]", align: "left", cell: (r) => r.store },
  { header: "점포 연락처", cell: (r) => r.phone },
  { header: "대표자명", cell: (r) => r.owner },
  {
    // 링크 이름이 행마다 같으면 읽기 도구의 링크 목록에서 "계약서보기"만 열 개가 늘어선다. 점포명을 붙여 구분한다.
    header: "계약여부",
    cell: (r) => (
      <Link href="/design/detail" aria-label={`${r.store} ${r.contract}`} className="text-erp-link hover:underline">
        {r.contract}
      </Link>
    ),
  },
  { header: "등록일", cell: (r) => r.createdAt },
];

// Figma 03.프레임_상세 전자 계약서 영역의 "가맹점 계약" 표 행. 값이 여럿인 칸은 DetailValues 로 세로선을 넣는다.
export const CONTRACT_ROWS: DetailRow[] = [
  { label: "계약 당사자", value: <DetailValues items={["힘이나는 커피생활", "을지로3가점"]} /> },
  { label: "점포명/계약관리 번호", value: <DetailValues items={["힘이나는 커피생활 을지로3가점", "(주) 따름인 힘이나는 커피생활"]} /> },
  { label: "계약정보", value: <DetailValues items={["을지로3가점 가맹 계약서", "계약서 완료"]} /> },
  { label: "계약준비 및 체결일", value: <DetailValues items={["2026.02.08", "2026.02.28"]} /> },
  { label: "서명 정보", value: <DetailValues items={["홍길동", "010 2222 3333", "010 2222 3333"]} /> },
  {
    label: "계약서(날인본)",
    value: (
      <Link href="#" className="text-erp-link hover:underline">
        을지로3가점 가맹 계약서.pdf
      </Link>
    ),
  },
];

// 디자인 샘플 화면 목록(유닛 맨 위 표). 화면을 더하면 여기에도 한 줄 더한다.
type PageLink = { group: string; name: string; href: string; source: string; entry: string };
export const PAGE_LINKS: PageLink[] = [
  { group: "관리자", name: "기본 유닛", href: "/design", source: "Figma 2026 1차 수정 · 공통 컴포넌트", entry: "샘플 이동 메뉴 「유닛」" },
  { group: "관리자", name: "점포정보 관리 목록", href: "/design/full", source: "Figma 2026 1차 수정", entry: "샘플 이동 메뉴 「전체 페이지」" },
  { group: "관리자", name: "상세", href: "/design/detail", source: "Figma 03.프레임_상세", entry: "목록의 계약서보기 · 샘플 이동 메뉴 「상세 페이지」" },
  { group: "비로그인", name: "메인", href: "/design/guest", source: "Figma 로그인전_Main (1:2)", entry: "샘플 이동 메뉴 「비로그인」 · 머리말 로고" },
  { group: "비로그인", name: "매장운영", href: "/design/guest/store-operations", source: "Figma 로그인전_Sub (1:688)", entry: "머리말 매장운영 · 메인 매장운영 카드" },
  { group: "비로그인", name: "부가서비스", href: "/design/guest/add-on-services", source: "Figma 로그인전_부가서비스 (1:1083)", entry: "머리말 부가 서비스 · 메인 「부가서비스 둘러보기」" },
  { group: "비로그인", name: "로그인", href: "/design/guest/login", source: "Figma 로그인전_로그인 (1:1615)", entry: "머리말 Login · 메인 「본사 계정으로 로그인」" },
  { group: "비로그인", name: "아이디/비밀번호 찾기", href: "/design/guest/find-account", source: "Figma 아이디/비밀번호 찾기 (1:1811)", entry: "로그인 「아이디/비밀번호 찾기」" },
  { group: "비로그인", name: "회원가입", href: "/design/guest/sign-up", source: "기획 시안(Claude 아티팩트) + Figma 폼 규격", entry: "로그인 「사업자 회원가입」 · 계정 찾기 「회원가입」" },
  { group: "비로그인", name: "가입 완료", href: "/design/guest/sign-up/complete", source: "기획 시안(Claude 아티팩트 signup-done)", entry: "회원가입 완료 후" },
];
export const PAGE_LINK_COLUMNS: Column<PageLink>[] = [
  { header: "구분", width: "w-[100px]", cell: (r) => r.group },
  { header: "화면", width: "w-[200px]", align: "left", cell: (r) => r.name },
  {
    header: "경로",
    width: "w-[320px]",
    align: "left",
    cell: (r) => (
      <Link href={r.href} className="text-erp-link hover:underline">
        {r.href}
      </Link>
    ),
  },
  { header: "출처", align: "left", cell: (r) => r.source },
  { header: "들어가는 곳", align: "left", cell: (r) => r.entry },
];
