---
okf_version: "0.2"
---

# Concepts

* [Whale ERP Frontend](whale-erp-front.md) - Next.js 16 App Router frontend for Whale ERP.
* [홈·계정 진입](home.md) - 로그인 선을 사이에 두고 갈리는 홈 영역. 목업 `docs/mockup/home/` 기준.
* [직원 운영 관리](staff.md) - 직원 초대·근로계약·근무스케줄·출퇴근·급여·TO-DO. 채용은 근로계약서 초안에서 시작한다. 목업 `docs/mockup/staff/` 기준.
* [직원 정보 관리 화면 (구현)](screens/staff-members.md) - `/staff-members` 목록 · 상세를 화면만 목 데이터로 만든 상태. api 를 붙일 때 바꿀 곳과 다시 작업할 것.
* [급여명세서 관리 화면 (구현)](screens/payslips.md) - `/payslips` 목록 · 검토. 급여명세서 api 로 그리고, api 에 칸이 없어 뺀 것과 아직 동작이 없는 버튼.
* [근무스케줄 관리 화면 (구현)](screens/work-schedules.md) - `/work-schedules` 주간 · 월간 보기와 변경 이력 패널. 30분 칸 인원을 한 시간 칸(작은 값)으로 그리고, 가린 직원은 줄만 둔다. 등록 · 복사는 다음 PR.
* [출·퇴근 현황 조회 화면 (구현)](screens/attendance-records.md) - `/attendance-records` 데모 틀 — 필터 7개, 일별 출퇴근 · 근태 요약 두 칸, 보정이 필요한 기록. 점포는 상단 범위 ↔ 필터 점포. 보정 버튼은 다음.
* [고객지원·커뮤니티](support.md) - 사용자가 읽는 고객지원과 운영자가 쓰는 커뮤니티관리. 목업 `docs/mockup/support/` 기준.
* [운영 알림](notify.md) - 문의·계약 사건을 관리자 웹 알림함으로 알린다(메일은 업무 쪽이 따로 보낸다). 목업 `docs/mockup/notify/` 기준.
* [로그인](auth.md) - 로그인·계정 찾기·BP 회원가입·강제 비밀번호 변경·세션 만료. 목업 `docs/mockup/auth/` 기준.
* [마이페이지](mypage.md) - 내 정보·비밀번호 변경·회원 탈퇴·로그아웃. 목업 `docs/mockup/mypage/` 기준.
* [BP 마스터 계정 관리](bp.md) - 플랫폼 사용자가 BP 와 BP 마스터 계정을 조회·등록·수정하고 상태를 바꾼다. 목업 `docs/mockup/bp/` 기준.
* [점포 관리](stores.md) - 점포 등록·조회·수정과 미운영→운영→폐점 상태 전환. 목업 `docs/mockup/stores/` 기준.
* [BP 환경설정](config.md) - BP 의 관리자 계정·권한 그룹·공통코드·휴일. 목업 `docs/mockup/config/` 기준.
* [플랫폼 시스템 관리](system.md) - 플랫폼 계정·권한과 공통 기준정보(메뉴·공통코드·공식 휴일). 목업 `docs/mockup/system/` 기준.
* [네이밍 규칙](conventions/naming.md) - DB·API·FRONT 세 계층의 이름 규칙과 용어집 영문 식별자 대응표. 세 저장소가 함께 쓴다.

# Bundle files

* [log.md](log.md) - Chronological history of this bundle.
