/* WHALE ERP 디자인 시안 5 "SHIP" — 공용 셸
   Expo 디자인 언어 · 라이트 전용 · 상단 64px 내비 + 좌측 260px 문서형 사이드바

   아이콘 세트와 고래 마크는 시안 3·4 와 같은 것을 쓴다(24 그리드 · stroke 1.5).
   세 시안이 같은 아이콘 문법을 쓰면 비교가 형태가 아니라 구조에서 이뤄진다.
   마크는 Higgsfield 로 생성한 원본을 외곽선 추적해 뽑은 단일 패스다 (시안 4). */
(function () {
  "use strict";

  var ICONS = {
    home: '<path d="M3.2 10.4 12 3.2l8.8 7.2"/><path d="M5.5 9.4V20.3h13V9.4"/><path d="M9.6 20.3v-5.6h4.8v5.6"/>',
    store:
      '<path d="M4.6 9.6v10.7h14.8V9.6"/><path d="M3 9.6 4.7 3.9h14.6L21 9.6"/><path d="M3 9.6a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M9.6 20.3v-6.1h4.8v6.1"/>',
    network:
      '<circle cx="12" cy="4.8" r="2.4"/><circle cx="5.2" cy="19.2" r="2.4"/><circle cx="18.8" cy="19.2" r="2.4"/><path d="M12 7.2v3.6"/><path d="M12 10.8H6.2a1 1 0 0 0-1 1v4.9"/><path d="M12 10.8h5.8a1 1 0 0 1 1 1v4.9"/>',
    layers:
      '<path d="M12 3.4 2.9 7.9 12 12.4l9.1-4.5z"/><path d="M2.9 12.4 12 16.9l9.1-4.5"/><path d="M2.9 16.6 12 21.1l9.1-4.5"/>',
    price:
      '<path d="M11.2 3.2H4.6a1.4 1.4 0 0 0-1.4 1.4v6.6l9.6 9.6a1.4 1.4 0 0 0 2 0l6.6-6.6a1.4 1.4 0 0 0 0-2z"/><circle cx="7.6" cy="7.6" r="1.3"/>',
    ingredient:
      '<path d="M12 3.2c-3.6 0-6.4 2.7-6.4 6.2 0 4.6 4 8.4 6.4 11.4 2.4-3 6.4-6.8 6.4-11.4 0-3.5-2.8-6.2-6.4-6.2z"/><path d="M12 20.8V9.6"/><path d="M12 12.4 9.1 9.5"/><path d="M12 10.6l2.6-2.6"/>',
    users:
      '<circle cx="9.2" cy="8.2" r="3.6"/><path d="M2.6 20.3a6.6 6.6 0 0 1 13.2 0"/><path d="M16.2 5.3a3.6 3.6 0 0 1 0 5.8"/><path d="M17.8 14.4a6.6 6.6 0 0 1 3.6 5.9"/>',
    chart:
      '<path d="M4 3.6v16.8h16.4"/><path d="M7.4 15.3 11 10.6l3.1 2.6 4.8-6"/>',
    wallet:
      '<path d="M3.4 8.4A2.4 2.4 0 0 1 5.8 6h11.4"/><rect x="3.4" y="8.4" width="17.2" height="11.9" rx="1.6"/><circle cx="16.6" cy="14.3" r="1.2" fill="currentColor" stroke="none"/>',
    box: '<path d="M12 3.1 20.6 7.7v8.6L12 20.9l-8.6-4.6V7.7z"/><path d="M3.4 7.7 12 12.3l8.6-4.6"/><path d="M12 12.3v8.6"/>',
    receipt:
      '<path d="M6 3.2h12v17.6l-2.4-1.5-2.4 1.5-2.4-1.5-2.4 1.5L6 20.8z"/><path d="M9.4 8.4h5.2"/><path d="M9.4 12.2h5.2"/>',
    device:
      '<rect x="3.2" y="4.2" width="17.6" height="12.6" rx="1.8"/><path d="M8.4 20.8h7.2"/><path d="M12 16.8v4"/>',
    shield:
      '<path d="M12 3.1 20 6v6.1c0 4.5-3.4 7.9-8 8.9-4.6-1-8-4.4-8-8.9V6z"/><path d="m8.9 12.1 2.1 2.1 4.1-4.2"/>',
    help: '<circle cx="12" cy="12" r="8.8"/><path d="M9.4 9.3a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.3-2.6 4"/><path d="M12 17.3h.01"/>',
    phone:
      '<rect x="6.4" y="2.6" width="11.2" height="18.8" rx="2.4"/><path d="M10.4 18.4h3.2"/>',
    search: '<circle cx="11" cy="11" r="6.6"/><path d="m15.9 15.9 5.1 5.1"/>',
    filter: '<path d="M3.4 5.4h17.2l-6.7 7.7v5.9l-3.8 1.9v-7.8z"/>',
    plus: '<path d="M12 5.2v13.6"/><path d="M5.2 12h13.6"/>',
    minus: '<path d="M5.2 12h13.6"/>',
    down: '<path d="m6.2 9.2 5.8 5.8 5.8-5.8"/>',
    right: '<path d="m9.2 5.8 6.1 6.2-6.1 6.2"/>',
    left: '<path d="m14.8 5.8-6.1 6.2 6.1 6.2"/>',
    up: '<path d="m6.2 14.8 5.8-5.8 5.8 5.8"/>',
    selector: '<path d="m8.2 9.6 3.8-3.8 3.8 3.8"/><path d="m8.2 14.4 3.8 3.8 3.8-3.8"/>',
    dots: '<circle cx="5.2" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="18.8" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
    check: '<path d="m5.2 12.8 4.6 4.6L18.8 6.6"/>',
    x: '<path d="m6.2 6.2 11.6 11.6"/><path d="m17.8 6.2-11.6 11.6"/>',
    warn: '<path d="M12 4.2 21 19.8H3z"/><path d="M12 10.2v3.9"/><path d="M12 17h.01"/>',
    alert: '<circle cx="12" cy="12" r="8.8"/><path d="M12 7.4v5.1"/><path d="M12 16.2h.01"/>',
    info: '<circle cx="12" cy="12" r="8.8"/><path d="M12 11v5.6"/><path d="M12 7.8h.01"/>',
    clock: '<circle cx="12" cy="12" r="8.8"/><path d="M12 6.9v5.4l3.3 2"/>',
    calendar:
      '<rect x="3.4" y="5" width="17.2" height="15.6" rx="1.8"/><path d="M3.4 10.1h17.2"/><path d="M8.2 3v4"/><path d="M15.8 3v4"/>',
    download: '<path d="M12 4v11.2"/><path d="m7.4 10.9 4.6 4.6 4.6-4.6"/><path d="M4.4 19.7h15.2"/>',
    upload: '<path d="M12 19.4V8.2"/><path d="m7.4 12.5 4.6-4.6 4.6 4.6"/><path d="M4.4 4.3h15.2"/>',
    external:
      '<path d="M14.2 4.4h5.4v5.4"/><path d="M19.6 4.4 11 13"/><path d="M18 14.3v5.3H4.4V6h5.4"/>',
    sliders:
      '<path d="M3.6 6.5h9.2"/><path d="M17.4 6.5h3"/><path d="M3.6 12h2.2"/><path d="M10.4 12h10"/><path d="M3.6 17.5h8.2"/><path d="M16.4 17.5h4"/><circle cx="15.1" cy="6.5" r="2.3"/><circle cx="8.1" cy="12" r="2.3"/><circle cx="14.1" cy="17.5" r="2.3"/>',
    bell: '<path d="M18 9a6 6 0 1 0-12 0c0 4.9-2 6.5-2 6.5h16S18 13.9 18 9z"/><path d="M13.8 19a2.1 2.1 0 0 1-3.6 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.6v2.5"/><path d="M12 18.9v2.5"/><path d="m4.9 4.9 1.8 1.8"/><path d="m17.3 17.3 1.8 1.8"/><path d="M2.6 12h2.5"/><path d="M18.9 12h2.5"/><path d="m4.9 19.1 1.8-1.8"/><path d="m17.3 6.7 1.8-1.8"/>',
    moon: '<path d="M20.1 14.6A8.6 8.6 0 0 1 9.4 3.9a8.6 8.6 0 1 0 10.7 10.7z"/>',
    upright: '<path d="M7.2 16.8 16.8 7.2"/><path d="M8.9 7.2h7.9v7.9"/>',
    downright: '<path d="M7.2 7.2 16.8 16.8"/><path d="M16.8 8.9v7.9H8.9"/>',
    arrowright: '<path d="M4.2 12h15.6"/><path d="m13.6 6.4 5.6 5.6-5.6 5.6"/>',
    arrowleft: '<path d="M19.8 12H4.2"/><path d="m10.4 6.4-5.6 5.6 5.6 5.6"/>',
    lock: '<rect x="4.4" y="10" width="15.2" height="10.6" rx="1.8"/><path d="M7.9 10V7.6a4.1 4.1 0 0 1 8.2 0V10"/>',
    edit: '<path d="M4.2 20.2h4L18.6 9.8a2.1 2.1 0 0 0-3-3L5.2 17.2z"/><path d="m14.6 6.4 3 3"/>',
    trash:
      '<path d="M4.4 6.4h15.2"/><path d="M9.6 6.4V4.3h4.8v2.1"/><path d="m6.6 6.4 1 13.6h8.8l1-13.6"/><path d="M10.2 10v6.4"/><path d="M13.8 10v6.4"/>',
    copy: '<rect x="8.6" y="8.6" width="12" height="12" rx="1.8"/><path d="M5.6 15.4H4.4a1 1 0 0 1-1-1V4.4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1.2"/>',
    link: '<path d="M10.4 13.6a4.1 4.1 0 0 0 5.8 0l3-3a4.1 4.1 0 1 0-5.8-5.8l-1.6 1.5"/><path d="M13.6 10.4a4.1 4.1 0 0 0-5.8 0l-3 3a4.1 4.1 0 1 0 5.8 5.8l1.6-1.5"/>',
    branch:
      '<circle cx="7" cy="5.6" r="2.3"/><circle cx="7" cy="18.4" r="2.3"/><circle cx="17" cy="8.6" r="2.3"/><path d="M7 7.9v8.2"/><path d="M17 10.9c0 3.2-2.7 4.6-6.2 5.3"/>',
    building:
      '<path d="M3 20.6h18"/><rect x="5.2" y="3.4" width="9" height="17.2"/><rect x="14.2" y="9" width="5" height="11.6"/><path d="M8 7.4h3.4"/><path d="M8 11.2h3.4"/><path d="M8 15h3.4"/>',
    clipboard:
      '<path d="M9.4 5H7.6a2 2 0 0 0-2 2v12.4a2 2 0 0 0 2 2h8.8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1.8"/><rect x="9.4" y="2.8" width="5.2" height="3.4" rx="1"/><path d="m9.6 13.4 1.9 1.9 3.4-3.6"/>',
    card: '<rect x="2.6" y="5.4" width="18.8" height="13.2" rx="2"/><path d="M2.6 10.1h18.8"/><path d="M6.2 14.7h3.2"/>',
    file: '<path d="M14 3.4H7.2a1.6 1.6 0 0 0-1.6 1.6v14a1.6 1.6 0 0 0 1.6 1.6h9.6a1.6 1.6 0 0 0 1.6-1.6V7.8z"/><path d="M14 3.4v4.4h4.4"/><path d="M8.6 12.6h6.8"/><path d="M8.6 16.1h4.8"/>',
    logout:
      '<path d="M9.2 20.6H5.6A1.6 1.6 0 0 1 4 19V5a1.6 1.6 0 0 1 1.6-1.6h3.6"/><path d="m15.4 16.4 4.4-4.4-4.4-4.4"/><path d="M19.8 12H9.6"/>',
    refresh: '<path d="M20.3 12a8.3 8.3 0 1 1-2.5-5.9"/><path d="M20.3 3.4V9h-5.6"/>',
    inbox:
      '<path d="M3.4 13.6h4.2l1.5 3h5.8l1.5-3h4.2"/><path d="M3.4 13.6 6 5.2h12l2.6 8.4v5.1a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6z"/>',
    megaphone:
      '<path d="M4 10.2v3.6a1.6 1.6 0 0 0 1.6 1.6H8l9 5.2V3.4l-9 5.2H5.6A1.6 1.6 0 0 0 4 10.2z"/><path d="M19.6 9.4a3.6 3.6 0 0 1 0 5.2"/><path d="M8 15.4v4.2h3"/>',
    message:
      '<path d="M4.2 5.4h15.6a1.6 1.6 0 0 1 1.6 1.6v8.8a1.6 1.6 0 0 1-1.6 1.6H9.6l-4.4 3.6v-3.6H4.2a1.6 1.6 0 0 1-1.6-1.6V7a1.6 1.6 0 0 1 1.6-1.6z"/>',
    eye: '<path d="M2.6 12S6.2 5.6 12 5.6 21.4 12 21.4 12 17.8 18.4 12 18.4 2.6 12 2.6 12z"/><circle cx="12" cy="12" r="3"/>',
    menu: '<path d="M3.6 6.6h16.8"/><path d="M3.6 12h16.8"/><path d="M3.6 17.4h16.8"/>',
    grid: '<rect x="3.6" y="3.6" width="7" height="7" rx="1.4"/><rect x="13.4" y="3.6" width="7" height="7" rx="1.4"/><rect x="3.6" y="13.4" width="7" height="7" rx="1.4"/><rect x="13.4" y="13.4" width="7" height="7" rx="1.4"/>',
    list: '<path d="M8.4 6.4h12"/><path d="M8.4 12h12"/><path d="M8.4 17.6h12"/><path d="M3.8 6.4h.01"/><path d="M3.8 12h.01"/><path d="M3.8 17.6h.01"/>',
    qr: '<rect x="3.6" y="3.6" width="6.6" height="6.6" rx="1"/><rect x="13.8" y="3.6" width="6.6" height="6.6" rx="1"/><rect x="3.6" y="13.8" width="6.6" height="6.6" rx="1"/><path d="M13.8 13.8h3v3h-3z"/><path d="M20.4 13.8v3"/><path d="M17.4 20.4h3"/>',
  };
  var WHALE =
    "M68.21 18.21 L79.02 26.51 L80.82 30.50 L76.13 39.25 L68.34 29.15 L68.21 18.28ZM99.55 26.64 L100.00 26.64 L94.14 36.23 L82.18 40.86 L71.24 54.76 L56.95 67.12 L43.69 69.88 L32.75 66.99 L54.38 48.07 L55.41 53.28 L66.09 50.84 L76.45 42.08 L82.37 31.08 L85.91 28.44 L99.49 26.71ZM81.27 44.53 L78.44 52.77 L69.95 64.22 L60.42 66.34 L72.46 55.79 L81.27 44.59ZM6.82 53.28 L46.01 53.35 L30.69 66.67 L26.96 66.67 L22.20 61.97 L0.77 57.27 L6.76 53.35ZM0.06 58.75 L21.36 63.45 L26.25 68.28 L30.50 68.34 L34.62 77.48 L19.37 76.06 L4.31 66.67 L0.00 58.82ZM67.25 66.54 L49.10 76.45 L45.24 71.24 L67.18 66.60ZM32.43 68.60 L43.24 71.43 L50.90 81.72 L43.89 81.79 L36.49 77.61 L32.43 68.66Z";

  function iconSprite() {
    var out = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">';
    for (var k in ICONS) {
      out +=
        '<symbol id="i-' + k +
        '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        ICONS[k] + "</symbol>";
    }
    out +=
      '<symbol id="i-whale" viewBox="-4 14 108 72">' +
      '<path d="' + WHALE + '" fill="currentColor" stroke="currentColor"' +
      ' stroke-width="2.2" stroke-linejoin="round"/></symbol>';
    return out + "</svg>";
  }

  function ic(name, size) {
    var s = size || 16;
    return '<svg width="' + s + '" height="' + s + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  }

  function hydrateIcons(root) {
    (root || document).querySelectorAll("[data-icon]").forEach(function (el) {
      if (el.dataset.iconDone) return;
      el.insertAdjacentHTML("afterbegin", ic(el.dataset.icon, el.dataset.iconSize || 16));
      el.dataset.iconDone = "1";
    });
  }

  function mark(size) {
    return '<span class="wm brand__mark" aria-hidden="true">' + ic("whale", size) + "</span>";
  }

  /* ---------- 내비게이션 ----------
     메뉴는 메뉴구조도(0.웨일ERP_메뉴구조도_v0.9_260819) 슬라이드 1·4 를 그대로 옮겼다.
     상단에는 섹션 탭을 두지 않는다 — 문서(슬라이드 16)는 상단을 BP 고정과
     서비스 바로가기·MY PAGE 에만 쓰고, 메뉴는 전부 좌측 Navigation 에 편다.

       team   업무 분배 — "1팀" 과 "3팀". 우리가 3팀이다.
       phase  범위 — 적지 않으면 1차, "1.5" 와 "2" 는 그 차수.
              Depth 1 에 적으면 그 아래가 전부 같은 차수라는 뜻이다.
       href   목업에 있는 화면. 없으면 링크를 죽인다.
       mock   구조도에 없는 목업 전용 화면. */
  var CONSOLES = [
    {
      id: "erp", text: "ERP", meta: "BP Master 기준",
      menus: [
        { key: "home", text: "Home", team: "3팀" },

        { key: "master", text: "기초정보관리", team: "1팀", items: [
          { text: "상품 정보 관리", phase: "2" },
          { text: "가격 정보 관리", phase: "2" },
          { text: "카테고리 정보 관리", phase: "2" },
          { text: "자재 정보 관리", phase: "1.5" }
        ]},

        { key: "stores", text: "점포관리", team: "1팀", items: [
          { text: "점포 정보 관리" },
          { text: "계약서 템플릿 관리", phase: "2" },
          { text: "계약서 관리", phase: "2" },
          { text: "시설물 및 장비 관리", phase: "1.5" },
          { text: "점검표 템플릿 관리", phase: "1.5" },
          { text: "점검 결과 관리", phase: "1.5" }
        ]},

        { key: "staff", text: "직원관리", team: "3팀", items: [
          { text: "영역 개요", href: "staff/overview.html", mock: 1 },
          { text: "직원 정보 관리", href: "staff/index.html", sub: [
            { text: "직원 목록", href: "staff/index.html", route: "/staff" },
            { text: "직원 상세", href: "staff/detail.html", route: "/staff/[staffId]" },
            { text: "가입 연결 확인", href: "staff/invites-holds.html", route: "/staff/invites/holds" }
          ]},
          { text: "근로계약 관리", href: "staff/index.html#contracts", sub: [
            { text: "계약 목록", href: "staff/index.html#contracts", route: "/staff/contracts" },
            { text: "계약 초안 작성", href: "staff/contracts-new.html", route: "/staff/contracts/new" },
            { text: "계약 상세", href: "staff/contracts-detail.html", route: "/staff/contracts/[id]" }
          ]},
          { text: "급여명세서 관리", href: "staff/index.html#payroll", sub: [
            { text: "명세서 목록", href: "staff/index.html#payroll", route: "/staff/payrolls" },
            { text: "명세서 검토", href: "staff/payrolls-detail.html", route: "/staff/payrolls/[id]" }
          ]},
          { text: "근무 스케줄 관리", href: "staff/index.html#sched" },
          { text: "출·퇴근 현황 조회", href: "staff/index.html#sched" },
          { text: "TO-DO 리스트 관리", href: "staff/index.html#todo" }
        ]},

        { key: "sales", text: "매출조회", team: "3팀", phase: "1.5", items: [
          { text: "매출 조회" },
          { text: "매출 통계" }
        ]},

        { key: "finance", text: "재무관리", team: "3팀", phase: "2", note: "부가서비스 구독 필요", items: [
          { text: "입·출금 관리" },
          { text: "매출/매입 거래 등록" },
          { text: "계정별 현황 조회" }
        ]},

        { key: "config", text: "환경설정", team: "1팀", items: [
          { text: "관리자 관리" },
          { text: "권한 관리" },
          { text: "공통코드 관리" },
          { text: "휴일 관리" }
        ]},

        { key: "support", text: "고객지원", team: "3팀", items: [
          { text: "부가서비스 구독 관리", phase: "2" },
          { text: "구독료 청구 및 납부 현황", phase: "2" },
          { text: "결제수단 관리", phase: "2" },
          { text: "정산 현황 조회", phase: "2" },
          { text: "공지사항" },
          { text: "문의하기" }
        ]}
      ]
    },
    {
      id: "platform", text: "Platform", meta: "전용 상품", gated: 1,
      menus: [
        { key: "members", text: "회원관리", team: "3팀", phase: "2", items: [
          { text: "회원 정보 관리" },
          { text: "휴면 회원 정보 관리" }
        ]},
        { key: "bp", text: "BP 정보관리", team: "1팀", items: [
          { text: "BP Master 정보 관리" },
          { text: "휴면 BP 정보 관리" }
        ]},
        { key: "settle", text: "서비스정산관리", phase: "2", items: [
          { text: "부가서비스 주문 내역" },
          { text: "부가서비스 정산" }
        ]},
        { key: "addons", text: "부가서비스관리", phase: "2", items: [
          { text: "부가 서비스 정보 관리" }
        ]},
        { key: "promo", text: "프로모션관리", phase: "2", items: [
          { text: "쿠폰 관리" },
          { text: "포인트 관리" }
        ]},
        { key: "system", text: "시스템관리", team: "1팀", items: [
          { text: "관리자 관리" },
          { text: "관리자 권한 관리" },
          { text: "프로그램 관리" },
          { text: "공통코드 관리" },
          { text: "휴일 관리" }
        ]},
        { key: "community", text: "커뮤니티관리", team: "3팀", items: [
          { text: "공지사항" },
          { text: "FAQ" },
          { text: "문의사항" },
          { text: "도입문의" }
        ]}
      ]
    }
  ];

  /* 화면은 영역 폴더(staff/ · home/ · support/ …) 아래 한 단계로만 둔다.
     CONSOLES 의 href 는 전부 목업 루트 기준이고, 실제 링크를 쓸 때
     각 화면이 <body data-root="../"> 로 알려준 접두사를 앞에 붙인다.
     루트 index.html 은 data-root 가 없으므로 "" 가 된다. */
  var ROOT = "";

  function url(href) {
    return ROOT + href;
  }

  /* href 가 있는 항목만 만들어 둔 화면이다. 나머지는 맥락을 보여주려고
     메뉴에 남겨두되 갈 곳이 없으므로 링크를 죽이고 흐리게 표시한다. */
  function linkAttrs(href) {
    return href
      ? ' href="' + url(href) + '"'
      : ' href="#" class="is-na" title="이번 목업 범위 밖" aria-disabled="true"';
  }

  function findMenu(page) {
    for (var c = 0; c < CONSOLES.length; c++) {
      var menus = CONSOLES[c].menus;
      for (var m = 0; m < menus.length; m++) {
        if (menus[m].key === page) return { cons: CONSOLES[c], menu: menus[m] };
      }
    }
    return { cons: CONSOLES[0], menu: null };
  }

  /* 점포 선택기는 전역이다 (STAFF-8). 어떤 화면에 있든 조회 범위는 여기서 읽는다. */
  var SCOPES = [
    { label: "전체 11개점", meta: "직영 4 · 가맹 7" },
    { label: "직영 4개점", meta: "㈜한강상회 직영" },
    { label: "가맹 7개점", meta: "모리커피 · 온기식당" },
    { label: "모리커피 서초점", meta: "직영 · POS·KIOSK·QR" },
    { label: "모리커피 을지로점", meta: "가맹 · 미납 1건" },
    { label: "온기식당 둔산점", meta: "가맹 · 미납 1건" }
  ];

  function topnavHTML() {
    return (
      '<header class="topnav">' +
      '<button class="iconbtn navtoggle" type="button" aria-label="메뉴 열기" aria-expanded="false" data-icon="menu" data-icon-size="18"></button>' +
      '<a class="brand" href="' + url("index.html") + '">' + mark(30) +
      '<span class="brand__name">WHALE <span>ERP</span></span></a>' +
      /* BP 고정 옵션 (슬라이드 16 ②) — 모든 검색 옵션이 여기 고른 것으로 고정된다. */
      '<button class="scopebtn" type="button" aria-haspopup="listbox" aria-expanded="false">' +
      "<b>㈜한강상회</b><span class=\"sep\">·</span><span class=\"scopebtn__val\">전체 11개점</span>" +
      ic("selector", 14) + "</button>" +
      '<div class="topnav__end">' +
      '<button class="iconbtn" type="button" aria-label="알림 3건" data-dot="1" data-icon="bell" data-icon-size="18"></button>' +
      '<button class="iconbtn" type="button" aria-label="도움말" data-icon="help" data-icon-size="18"></button>' +
      /* MY PAGE 는 이름을 눌러 들어간다 (슬라이드 4). 1팀 영역이다. */
      '<button class="mebtn" type="button" aria-haspopup="menu" aria-expanded="false">' +
      '<span class="avatar">정</span><span class="mebtn__name">정하윤</span>' +
      ic("selector", 14) + "</button>" +
      "</div></header>"
    );
  }

  function badge(text, kind) {
    return '<span class="side__tag side__tag--' + kind + '">' + text + "</span>";
  }

  /* 오른쪽 끝에 붙는 것 — 차수가 1차가 아니면 차수, 아니면 라우트를 적는다. */
  function itemEnd(it, inherited) {
    var ph = it.phase || inherited;
    if (ph) return badge(ph + "차", ph === "1.5" ? "half" : "second");
    return it.mock ? badge("목업", "mock") : "";
  }

  /* Depth 1 자신은 화면이 아니다. 아래에 만들어 둔 화면이 있으면 그 첫 화면으로 보낸다. */
  function menuHref(m) {
    if (m.href) return m.href;
    var hit = (m.items || []).filter(function (i) { return i.href && !i.mock; })[0];
    return hit ? hit.href : "";
  }

  /* 펼친 메뉴는 페이지를 옮겨도 그대로 남는다. LNB 가 한 벌이면 모습도 한 벌이어야 한다. */
  var OPEN_KEY = "whale-mockup-open";

  function openKeys(page) {
    var list = [];
    try { list = JSON.parse(sessionStorage.getItem(OPEN_KEY) || "[]"); } catch (e) {}
    if (page && list.indexOf(page) < 0) list.push(page); /* 지금 보는 메뉴는 늘 펼친다 */
    return list;
  }

  function saveOpen(list) {
    try { sessionStorage.setItem(OPEN_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function menuHTML(m, on, sub, isOpen) {
    var mh = menuHref(m);
    var html =
      '<div class="side__row">' +
      '<a class="side__item' + (mh ? "" : " is-na") + '"' +
      (mh ? ' href="' + url(mh) + '"' : ' href="#" aria-disabled="true" title="이번 목업 범위 밖"') +
      (on ? ' aria-current="page"' : "") + ">" +
      '<span class="side__text">' + m.text + "</span>" +
      (m.team ? badge(m.team, m.team === "1팀" ? "t1" : "t3") : "") +
      (m.phase ? badge(m.phase + "차", m.phase === "1.5" ? "half" : "second") : "") +
      "</a>" +
      (m.items
        ? '<button class="side__toggle" type="button" data-menu="' + m.key +
          '" aria-expanded="' + !!isOpen + '" aria-label="' + m.text + ' 하위 메뉴">' +
          ic("down", 14) + "</button>"
        : "") +
      "</div>";
    if (!m.items) return html;

    html += '<div class="side__sub" data-sub-of="' + m.key + '"' + (isOpen ? "" : " hidden") + ">";
    m.items.forEach(function (it) {
      var ion = !!sub && (it.href === sub || (it.sub || []).some(function (s) { return s.href === sub; }));
      html +=
        "<a" + linkAttrs(it.href) + (ion ? ' aria-current="page"' : "") + ">" +
        "<span>" + it.text + "</span>" + itemEnd(it, m.phase) + "</a>";
      if (ion && it.sub) {
        html += '<div class="side__sub side__sub--deep">';
        it.sub.forEach(function (s) {
          html +=
            "<a" + linkAttrs(s.href) + (s.href === sub ? ' aria-current="page"' : "") + ">" +
            "<span>" + s.text + "</span>" +
            '<span class="side__route">' + s.route + "</span></a>";
        });
        html += "</div>";
      }
    });
    return html + "</div>";
  }

  /* BP 기능은 모두가 본다. Platform 전용은 그 권한이 있는 사람에게만 한 무리 더 붙는다.
     서비스를 갈아타는 것이 아니라 보이는 범위가 넓어지는 것이다. */
  function sideBodyHTML(page, sub) {
    var open = openKeys(page);
    var html = "";
    CONSOLES.forEach(function (c) {
      html +=
        '<div class="side__group"><div class="side__label">' + c.text + " · " + c.meta +
        (c.gated ? '<span class="side__tag side__tag--gate">권한 필요</span>' : "") + "</div>";
      c.menus.forEach(function (m) {
        html += menuHTML(m, m.key === page, sub, open.indexOf(m.key) > -1);
      });
      html += "</div>";
    });
    return html;
  }

  /* PLAN 사용량은 늘 바닥에 붙는다. 점포 추가가 막히는 이유가 여기 먼저 보여야 한다. */
  function sideFootHTML() {
    return (
      '<div class="side__foot">' +
      "<h3>PLAN 사용량<span class=\"badge badge--dark\">FRANCHISE</span></h3>" +
      '<div class="usage">' +
      usageRow("점포", "11 / 12", 92, false) +
      usageRow("직원", "63 / 100", 63, false) +
      usageRow("부가서비스", "24건", 0, false) +
      "</div>" +
      '<div class="usage__row"><span>08월 청구 예정</span><b>₩2,184,000</b></div>' +
      "</div>"
    );
  }

  function sideHTML(page, sub) {
    return '<aside class="side" id="side" aria-label="메뉴">' +
      sideBodyHTML(page, sub) + sideFootHTML() + "</aside>";
  }

  /* 하위 메뉴는 미리 그려 두고 여닫기만 한다. 여닫은 결과는 세션에 남는다. */
  function wireAccordion() {
    var side = document.getElementById("side");
    if (!side) return;
    side.addEventListener("click", function (e) {
      var t = e.target.closest(".side__toggle");
      if (!t) return;
      var panel = side.querySelector('[data-sub-of="' + t.dataset.menu + '"]');
      if (!panel) return;
      panel.hidden = !panel.hidden;
      t.setAttribute("aria-expanded", String(!panel.hidden));
      var list = [];
      side.querySelectorAll(".side__toggle[aria-expanded=true]").forEach(function (b) {
        list.push(b.dataset.menu);
      });
      saveOpen(list);
    });
  }

  function usageRow(label, val, pct, full) {
    return (
      '<div class="usage__row' + (full ? " is-full" : "") + '"><span>' + label + "</span><b>" + val + "</b></div>" +
      (pct ? '<div class="meter' + (full ? " meter--full" : "") + '"><i style="width:' + pct + '%"></i></div>' : "")
    );
  }

  /* ---------- 팝오버 ----------
     상단의 세 버튼(점포 선택기 · 서비스 바로가기 · MY PAGE)이 같은 것을 쓴다. */
  function wirePop(btn, align, build, onPick) {
    if (!btn) return;
    var pop = null;
    function close() {
      if (pop) { pop.remove(); pop = null; }
      btn.setAttribute("aria-expanded", "false");
    }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (pop) return close();
      pop = document.createElement("div");
      pop.className = "pop";
      pop.innerHTML = build();
      document.body.appendChild(pop);
      var r = btn.getBoundingClientRect();
      pop.style.top = r.bottom + 6 + "px";
      if (align === "left") pop.style.left = r.left + "px";
      else pop.style.right = window.innerWidth - r.right + "px";
      btn.setAttribute("aria-expanded", "true");
      hydrateIcons(pop);
      if (onPick) {
        pop.querySelectorAll("button[role=option]").forEach(function (o, i) {
          o.addEventListener("click", function () { onPick(i, o); close(); });
        });
      }
      pop.addEventListener("click", function (ev) { ev.stopPropagation(); });
    });
    document.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  function optionHTML(label, meta, on, dead) {
    return '<button type="button" ' + (dead ? 'disabled ' : 'role="option" ') +
      'aria-selected="' + !!on + '">' +
      "<span><b>" + label + "</b><br><span class=\"subtle\" style=\"font-size:11.5px\">" + meta + "</span></span>" +
      (on ? ic("check", 14) : "") + "</button>";
  }

  function wireScope() {
    var btn = document.querySelector(".scopebtn");
    if (!btn) return;
    var val = function () { return btn.querySelector(".scopebtn__val").textContent.trim(); };
    wirePop(btn, "left", function () {
      return '<div class="pop__label">조회 범위</div>' +
        SCOPES.map(function (s) { return optionHTML(s.label, s.meta, s.label === val()); }).join("") +
        '<hr><a href="#" class="is-na" aria-disabled="true">' + ic("plus", 14) + "점포 등록</a>";
    }, function (i) {
      btn.querySelector(".scopebtn__val").textContent = SCOPES[i].label;
    });
  }

  function wireMe() {
    var btn = document.querySelector(".mebtn");
    wirePop(btn, "right", function () {
      return '<div class="pop__head">' +
        '<span class="avatar">정</span>' +
        "<div><b>정하윤</b><span>BP Master · ㈜한강상회</span></div>" +
        '<span class="side__tag side__tag--t1">1팀</span></div>' +
        '<div class="pop__label">MY PAGE</div>' +
        '<a href="#" class="is-na" aria-disabled="true">관리자 정보 관리</a>' +
        '<a href="#" class="is-na" aria-disabled="true">비밀번호 변경</a>' +
        '<hr><a href="#" class="is-na" aria-disabled="true">' + ic("logout", 14) + "로그아웃</a>";
    });
  }

  /* ---------- 탭 ---------- */
  function wireTabs() {
    document.querySelectorAll("[data-tabs]").forEach(function (bar) {
      var scope = document.getElementById(bar.dataset.tabs) || document;
      bar.querySelectorAll("[data-tab]").forEach(function (t) {
        t.addEventListener("click", function () {
          bar.querySelectorAll("[data-tab]").forEach(function (o) {
            o.setAttribute("aria-selected", String(o === t));
          });
          /* 직계 자식만 건드린다. 탭 안에 탭이 있을 때(스케줄의 주간·일간)
             바깥 탭이 안쪽 패널까지 숨겨 버리는 것을 막는다. */
          scope.querySelectorAll(":scope > [data-panel]").forEach(function (p) {
            p.hidden = p.dataset.panel !== t.dataset.tab;
          });
        });
      });
    });
  }

  /* ---------- 세그먼티드 · 토글 · 체크 (시안용 상태 전환) ---------- */
  function wireStates() {
    document.querySelectorAll(".seg").forEach(function (seg) {
      seg.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        seg.querySelectorAll("button").forEach(function (o) {
          o.setAttribute("aria-pressed", String(o === b));
        });
      });
    });
    document.addEventListener("click", function (e) {
      var t = e.target.closest(".toggle");
      if (t && !t.hasAttribute("disabled")) {
        t.setAttribute("aria-pressed", t.getAttribute("aria-pressed") === "true" ? "false" : "true");
      }
      var c = e.target.closest(".check");
      if (c && !c.hasAttribute("disabled")) {
        c.setAttribute("aria-checked", c.getAttribute("aria-checked") === "true" ? "false" : "true");
      }
    });
  }

  function wireDrawer() {
    var t = document.querySelector(".navtoggle");
    var side = document.getElementById("side");
    if (!t || !side) return;
    t.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = side.getAttribute("data-open") === "1";
      side.setAttribute("data-open", open ? "0" : "1");
      t.setAttribute("aria-expanded", String(!open));
    });
    document.addEventListener("click", function (e) {
      if (side.getAttribute("data-open") !== "1") return;
      if (!side.contains(e.target)) {
        side.setAttribute("data-open", "0");
        t.setAttribute("aria-expanded", "false");
      }
    });
  }

  function boot() {
    /* 화면이 목업 루트에서 몇 단 아래인지는 각 파일이 알려준다.
       루트 index.html 은 이 속성이 없어 "" 가 되고, 영역 폴더 안은 "../" 다. */
    ROOT = document.body.dataset.root || "";
    document.body.insertAdjacentHTML("afterbegin", iconSprite());
    var page = document.body.dataset.page;
    var shell = document.querySelector(".shell");
    if (shell && page) {
      shell.insertAdjacentHTML("afterbegin", topnavHTML(page) + sideHTML(page, document.body.dataset.sub));
    }
    hydrateIcons(document);
    wireScope();
    wireMe();
    wireAccordion();
    wireTabs();
    wireStates();
    wireDrawer();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
