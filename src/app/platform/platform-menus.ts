import type { HeaderMenu } from "@/components/common";

// 임시 — 플랫폼 관리 헤더 메뉴. api 초기 데이터(menus, service_code PLATFORM)의 사용 중 메뉴와 URL 을 손으로 옮겨 적었다.
// TODO(공통 헤더): 공통 헤더 · 공통 레이아웃이 나오면 이 파일은 지운다. 메뉴 목록과 권한별 숨김(조회 권한 없는 메뉴)은
// 공통 쪽이 메뉴 api 응답으로 그린다. 그 전에 메뉴가 바뀌어도 여기만 고친다(layout.tsx 참고).
export const PLATFORM_MENUS: HeaderMenu[] = [
  { label: "BP 마스터 계정 관리", items: [{ label: "BP 마스터 계정 목록", href: "/platform/bp" }] },
  {
    label: "시스템관리",
    items: [
      { label: "플랫폼 관리자 관리", href: "/platform/system/admins" },
      { label: "플랫폼 권한 관리", href: "/platform/system/roles" },
      { label: "플랫폼 메뉴 관리", href: "/platform/system/menus" },
      { label: "플랫폼 공통코드 관리", href: "/platform/system/codes" },
      // 공통코드 관리 다음(NOTIFY-7, 1팀 전달 사항 14번). api 초기 데이터에는 아직 없어 손으로 더했다.
      { label: "알림 템플릿 관리", href: "/platform/notification-templates" },
      { label: "플랫폼 휴일 관리", href: "/platform/system/holidays" },
    ],
  },
  {
    label: "커뮤니티관리",
    items: [
      { label: "공지사항", href: "/platform/community/notices" },
      { label: "FAQ", href: "/platform/community/faq" },
      { label: "문의사항", href: "/platform/community/inquiries" },
      { label: "도입문의", href: "/platform/community/leads" },
    ],
  },
];
