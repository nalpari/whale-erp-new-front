import { Badge, type Column, type HeaderMenu, type UserPopItem } from "@/components/common";

// /design 샘플 화면에 넣는 더미 데이터. Figma 시안의 값을 그대로 옮겼다.

const menu = (label: string, items: string[]): HeaderMenu => ({
  label,
  items: items.map((item) => ({ label: item, href: "#" })),
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
  { header: "계약여부", cell: (r) => r.contract },
  { header: "등록일", cell: (r) => r.createdAt },
];
