// 데모 전체가 같이 쓰는 것: 로그인한 사람, 헤더 메뉴, 범위 선택기 값.
// ERP 화면은 목업의 ERP 콘솔(BP 마스터 기준)을 따른다. 플랫폼 화면은 PLATFORM 쪽을 쓴다.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as ui from "./ui.mjs";

const pages = join(dirname(fileURLToPath(import.meta.url)), "pages");
// 아직 만들지 않은 화면은 # 로 둔다. 링크가 죽은 페이지로 가지 않게.
const to = (R, path) => {
  if (!path) return "#";
  const [file, hash = ""] = path.split("#");
  return existsSync(join(pages, file.replace(/\.html$/, ".mjs"))) ? `${R}${file}${hash && `#${hash}`}` : "#";
};

const ERP_MENUS = [
  ["기초정보관리", [["상품 정보 관리"], ["가격 정보 관리"], ["카테고리 정보 관리"], ["자재 정보 관리"]]],
  ["점포관리", [["점포 정보 관리", "stores/index.html"], ["계약서 템플릿 관리"], ["계약서 관리"], ["시설물 및 장비 관리"], ["점검표 템플릿 관리"], ["점검 결과 관리"]]],
  [
    "직원관리",
    [
      ["직원 정보 관리", "staff/index.html"],
      ["근로계약 관리", "staff/contracts.html"],
      ["급여명세서 관리", "staff/payslips.html"],
      ["근무스케줄 관리", "staff/work-schedules.html"],
      ["출·퇴근 현황 조회", "staff/attendance.html"],
      ["TO-DO 리스트 관리", "staff/todos.html"],
    ],
  ],
  ["매출조회", [["매출 조회"], ["매출 통계"]]],
  ["재무관리", [["입·출금 관리"], ["매출/매입 거래 등록"], ["계정별 현황 조회"]]],
  ["환경설정", [["BP 관리자 관리", "config/admins.html"], ["BP 권한 그룹 관리", "config/roles.html"], ["BP 공통코드 관리", "config/codes.html"], ["BP 휴일 관리", "config/holidays.html"]]],
  ["고객지원", [["부가서비스 구독 관리"], ["구독료 청구 및 납부 현황"], ["결제수단 관리"], ["정산 현황 조회"], ["공지사항", "support/notices.html"], ["FAQ", "support/faq.html"], ["문의하기", "support/inquiries.html"]]],
];

// 목업 점포 목록의 BP(㈜한강상회)와 점포들. 서초점은 점포 목록 목업에 없지만 홈·직원·환경설정·알림 목업이 쓰는 점포라 더했다(2026-10-02 재영: 데이터는 한쪽으로 맞춘다). 재직 직원 합계 63명. 줄: 코드·이름·유형·상태·사업자등록번호·연락처·근무직원수·등록일·지역·대표 이미지(assets/img, 없으면 빈칸). 범위 선택기는 1팀 공통정책 2번의 표기를 따른다.
export const BP = { name: "㈜한강상회", code: "BP000017" };
export const STORES = [
  ["ST000007", "모리커피 청담점", "가맹점포", "미운영", "-", "02-514-2270", 0, "2026-09-10", "서울 강남구", ""],
  ["ST000011", "온기식당 일산점", "가맹점포", "운영", "128-27-90456", "031-906-4415", 5, "2026-02-23", "경기 고양시", "store-photo-2.jpg"],
  ["ST000010", "온기식당 서면점", "가맹점포", "운영", "602-19-33845", "051-803-7712", 6, "2026-01-09", "부산 부산진구", "store-photo-3.jpg"],
  ["ST000009", "온기식당 둔산점", "가맹점포", "운영", "305-14-72210", "042-485-3390", 6, "2025-11-18", "대전 서구", ""],
  ["ST000008", "모리커피 부평점", "가맹점포", "운영", "122-31-60021", "032-512-6604", 5, "2025-10-06", "인천 부평구", "store-photo-4.jpg"],
  ["ST000006", "모리커피 연남점", "가맹점포", "운영", "105-22-81934", "02-322-1180", 6, "2025-08-01", "서울 마포구", "store-photo-1.jpg"],
  ["ST000005", "모리커피 을지로점", "가맹점포", "운영", "201-12-34567", "02-2265-0917", 5, "2025-07-15", "서울 중구", "store-photo-5.jpg"],
  ["ST000004", "온기식당 광화문점", "일반점포", "운영", "104-81-55120", "02-734-5528", 6, "2025-06-02", "서울 종로구", "store-photo-6.jpg"],
  ["ST000003", "온기식당 판교점", "일반점포", "운영", "131-81-44710", "031-8017-2231", 7, "2025-05-20", "경기 성남시", "store-ongi.svg"],
  ["ST000002", "모리커피 성수점", "일반점포", "운영", "101-81-22302", "02-462-7719", 8, "2025-04-11", "서울 성동구", "store-mori.svg"],
  ["ST000001", "모리커피 서초점", "일반점포", "운영", "114-81-90215", "02-3474-1290", 9, "2025-03-17", "서울 서초구", "store-bread.svg"],
];
const SCOPES = [
  `전체 ${STORES.length}개점`,
  `일반점포 전체 ${STORES.filter((s) => s[2] === "일반점포").length}개점`,
  `가맹점포 전체 ${STORES.filter((s) => s[2] === "가맹점포").length}개점`,
  ...STORES.map((s) => s[1]),
];

export const USER = "정하윤 (BP 마스터)";

export function erpHeader(A, R) {
  const menus = ERP_MENUS.map(([label, items]) => ({ label, items: items.map(([l, p]) => ({ label: l, href: to(R, p) })) }));
  const user = [
    { label: "내정보 관리", href: to(R, "mypage/profile.html") },
    { label: "비밀번호 변경", href: to(R, "mypage/password.html") },
    { label: "회원 탈퇴", href: to(R, "mypage/withdraw.html") },
    { label: "로그아웃", href: to(R, "auth/login.html"), danger: true },
  ];
  return ui.globalHeader(
    A,
    menus,
    ui.storeSelect(A, SCOPES) +
      ui.serviceLinks(A, { erp: to(R, "home/signed-in.html"), platform: to(R, "bp/index.html") }) +
      ui.alarmLink(A, to(R, "notify/index.html")) +
      ui.userPop(A, USER, user),
    to(R, "home/signed-in.html"),
  );
}

export const link = to;

// 플랫폼 콘솔(목업 Platform). 상단 선택칸은 BP 를 고른다(1팀 공통정책 2번의 BP 변경).
const PLATFORM_MENUS = [
  ["회원관리", [["회원 정보 관리"]]],
  ["BP 마스터 계정 관리", [["BP 마스터 계정 목록", "bp/index.html"]]],
  ["서비스정산관리", [["부가서비스 주문 내역"], ["부가서비스 정산"]]],
  ["부가서비스관리", [["부가 서비스 정보 관리"]]],
  ["프로모션관리", [["쿠폰 관리"], ["포인트 관리"]]],
  [
    "시스템관리",
    [
      ["플랫폼 관리자 관리", "system/admins.html"],
      ["플랫폼 권한 관리", "system/roles.html"],
      ["플랫폼 메뉴 관리", "system/menus.html"],
      ["플랫폼 공통코드 관리", "system/codes.html"],
      ["플랫폼 휴일 관리", "system/holidays.html"],
    ],
  ],
  [
    "커뮤니티관리",
    [
      ["공지사항", "support/community-notices.html"],
      ["FAQ", "support/community-faq.html"],
      ["문의사항", "support/community-asks.html"],
      ["도입문의", "support/community-leads.html"],
    ],
  ],
];
const BPS = ["BP 선택", `${BP.name} · ${BP.code}`, "㈜모리푸드 · BP000021", "㈜온기에프앤비 · BP000009"];
export const PLATFORM_USER = "김지영 (플랫폼 관리자)";
export const PLATFORM_MASTER = "김서연 (플랫폼 마스터)"; // system/admins 목록의 platkim

// master: true 면 플랫폼 마스터로 로그인한 헤더(마스터 기준 화면용).
export function platformHeader(A, R, { master = false } = {}) {
  const menus = PLATFORM_MENUS.map(([label, items]) => ({ label, items: items.map(([l, p]) => ({ label: l, href: to(R, p) })) }));
  const user = [
    { label: "내정보 관리", href: to(R, "mypage/profile.html") },
    { label: "비밀번호 변경", href: to(R, "mypage/password.html") },
    { label: "로그아웃", href: to(R, "auth/login.html"), danger: true },
  ];
  return ui.globalHeader(
    A,
    menus,
    ui.storeSelect(A, BPS, BPS[0], "BP") +
      ui.serviceLinks(A, { erp: to(R, "home/signed-in.html"), platform: to(R, "bp/index.html") }) +
      ui.alarmLink(A, "#") +
      ui.userPop(A, master ? PLATFORM_MASTER : PLATFORM_USER, user),
    to(R, "bp/index.html"),
  );
}
