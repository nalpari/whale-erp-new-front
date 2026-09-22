/* WHALE ERP 디자인 시안 5 "SHIP" — 공용 셸
   Expo 디자인 언어 · 라이트 전용 · 상단 64px 내비 + 좌측 260px 문서형 사이드바

   아이콘 세트와 고래 마크는 시안 3·4 와 같은 것을 쓴다(24 그리드 · stroke 1.5).
   세 시안이 같은 아이콘 문법을 쓰면 비교가 형태가 아니라 구조에서 이뤄진다.
   마크는 Higgsfield 로 생성한 원본을 외곽선 추적해 뽑은 단일 패스다 (시안 4). */
(function () {
  "use strict";

  var ICONS = {
    home: '<path d="M3.2 10.4 12 3.2l8.8 7.2"/><path d="M5.5 9.4V20.3h13V9.4"/><path d="M9.6 20.3v-5.6h4.8v5.6"/>',
    table: '<rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2"/><path d="M3.4 9.6h17.2M3.4 14.6h17.2M9.6 9.6v9.8"/>',
    pin: '<path d="M12 21s-6.6-6.1-6.6-11.2a6.6 6.6 0 0 1 13.2 0C18.6 14.9 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/>',
    image: '<rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2"/><circle cx="9" cy="9.8" r="1.7"/><path d="m20.6 16.2-5-5-8.4 8.2"/>',
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
    mail: '<rect x="3" y="5.4" width="18" height="13.2" rx="1.8"/><path d="m3.6 6.4 8.4 6.6 8.4-6.6"/>',
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
        { key: "home", text: "Home", team: "3팀", items: [
          { text: "영역 개요", href: "home/overview.html", mock: 1 },
          { text: "로그인 후 홈", href: "home/signed-in.html" },
          { key: "home-public", text: "로그인 전 화면", sub: [
            { text: "로그인 전 홈", href: "home/index.html", route: "/" },
            { text: "로그인 · 가입", href: "home/login.html", route: "/login" },
            { text: "공지사항 · FAQ", href: "home/notices.html", route: "/notices" },
            { text: "도입문의", href: "home/inquiry.html", route: "/inquiry" }
          ]}
        ]},

        /* 로그인은 1팀 작업이다 — 인증 및 계정 관리(R-LYZWGG) 명세로 만들었다. 홈 바로 앞 단계라 Home 밑에 둔다.
           Depth 1 “로그인”은 화면으로 보내지 않고 하위만 여닫는다(toggle). 화면은 “로그인 화면”부터 열고,
           그 화면에서 이어지는 화면을 한 층 아래에 둔다.
           로그인 전 화면 묶음의 “로그인 · 가입”은 3팀이 먼저 그린 초안이고, 둘이 다른 곳은 auth 개요의 쟁점에 있다. */
        { key: "auth", text: "로그인", team: "1팀", toggle: 1, items: [
          { text: "영역 개요", href: "auth/overview.html", mock: 1 },
          { key: "auth-screens", text: "로그인 화면", href: "auth/login.html", sub: [
            { text: "아이디·비밀번호 찾기", href: "auth/find.html", route: "/find" },
            { text: "회원가입", href: "auth/signup.html", route: "/signup" },
            { text: "가입 완료", href: "auth/signup-done.html", route: "/signup/done" },
            { text: "강제 비밀번호 변경", href: "auth/force-password.html", route: "팝업" },
            { text: "세션 만료 경고", href: "stores/index.html?session=expired", route: "쓰던 화면" }
          ]}
        ]},

        /* MY PAGE 는 실제로는 상단 이름을 눌러 여는 메뉴다(F-AMTDCK · F-RCHJES). 목업 허브에서 찾기 쉽게 여기에도 둔다. */
        { key: "mypage", text: "MY PAGE", team: "1팀", toggle: 1, items: [
          { text: "영역 개요", href: "mypage/overview.html", mock: 1 },
          { text: "내 정보 관리", href: "mypage/profile.html" },
          { text: "비밀번호 변경", href: "mypage/password.html" },
          { text: "회원 탈퇴", href: "mypage/withdraw.html" }
        ]},

        { key: "master", text: "기초정보관리", team: "1팀", items: [
          { text: "상품 정보 관리", phase: "2" },
          { text: "가격 정보 관리", phase: "2" },
          { text: "카테고리 정보 관리", phase: "2" },
          { text: "자재 정보 관리", phase: "1.5" }
        ]},

        /* 점포 정보 관리는 1팀 명세(R-QTPRUQ 점포 관리)로 만들었다. 로그인과 같이 이름은 하위만 여닫는다. */
        { key: "stores", text: "점포관리", team: "1팀", toggle: 1, items: [
          { text: "영역 개요", href: "stores/overview.html", mock: 1 },
          /* 상세·등록·수정은 메뉴로 나누지 않는다 — 상세·등록은 목록에서, 수정은 상세에서 들어간다. 그 화면들은 이 줄을 켜 둔다. */
          { text: "점포 정보 관리", href: "stores/index.html" },
          { text: "계약서 템플릿 관리", phase: "2" },
          { text: "계약서 관리", phase: "2" },
          { text: "시설물 및 장비 관리", phase: "1.5" },
          { text: "점검표 템플릿 관리", phase: "1.5" },
          { text: "점검 결과 관리", phase: "1.5" }
        ]},

        { key: "staff", text: "직원관리", team: "3팀", items: [
          { text: "영역 개요", href: "staff/overview.html", mock: 1 },
          { key: "staff-info", text: "직원 정보 관리", href: "staff/index.html", sub: [
            { text: "직원 목록", href: "staff/index.html", route: "/staff" },
            { text: "직원 상세", href: "staff/detail.html", route: "/staff/[staffId]" },
            { text: "가입 연결 확인", href: "staff/invites-holds.html", route: "/staff/invites/holds" }
          ]},
          { key: "staff-contracts", text: "근로계약 관리", href: "staff/index.html#contracts", sub: [
            { text: "계약 목록", href: "staff/index.html#contracts", route: "/staff/contracts" },
            { text: "근로계약서 초안 작성", href: "staff/contracts-new.html", route: "/staff/contracts/new" },
            { text: "계약 상세", href: "staff/contracts-detail.html", route: "/staff/contracts/[id]" }
          ]},
          { key: "staff-payrolls", text: "급여명세서 관리", href: "staff/index.html#payroll", sub: [
            { text: "명세서 목록", href: "staff/index.html#payroll", route: "/staff/payrolls" },
            { text: "명세서 검토", href: "staff/payrolls-detail.html", route: "/staff/payrolls/[id]" }
          ]},
          { text: "근무스케줄 관리", href: "staff/index.html#sched" },
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

        /* 환경설정은 1팀 명세(R-DJGLEO BP 환경 설정)의 하위 기능 넷으로 이름을 맞췄다.
           기능당 메뉴 하나다 — 상세·등록·수정은 목록에서 이어 들어가고, 수정은 상세를 거친다. */
        { key: "config", text: "환경설정", team: "1팀", toggle: 1, items: [
          { text: "영역 개요", href: "config/overview.html", mock: 1 },
          { text: "BP 관리자 관리", href: "config/admins.html" },
          { text: "BP 권한 그룹 관리", href: "config/roles.html" },
          { text: "BP 공통코드 관리", href: "config/codes.html" },
          { text: "BP 휴일 관리", href: "config/holidays.html" }
        ]},

        { key: "support", text: "고객지원", team: "3팀", href: "support/index.html", items: [
          { text: "영역 개요", href: "support/overview.html", mock: 1 },
          { text: "부가서비스 구독 관리", phase: "2" },
          { text: "구독료 청구 및 납부 현황", phase: "2" },
          { text: "결제수단 관리", phase: "2" },
          { text: "정산 현황 조회", phase: "2" },
          { text: "공지사항", href: "support/index.html#notices" },
          { text: "문의하기", href: "support/index.html#inquiries" }
        ]},

        { key: "notify", text: "운영 알림", team: "3팀", items: [
          { text: "영역 개요", href: "notify/overview.html", mock: 1 },
          { text: "알림함", href: "notify/index.html" }
        ]}
      ]
    },
    {
      id: "platform", text: "Platform", meta: "전용 상품", gated: 1,
      menus: [
        { key: "members", text: "회원관리", team: "3팀", phase: "2", items: [
          { text: "회원 정보 관리" }
        ]},
        /* BP 마스터 계정 관리는 1팀 명세(R-NMDCYH 플랫폼 BP 관리 · F-EHHJLV)로 만들었다.
           구조도의 휴면 BP 정보 관리는 따로 두지 않는다 — 목록의 상태 조건(미사용·탈퇴)이 맡는다. */
        { key: "bp", text: "BP 마스터 계정 관리", team: "1팀", toggle: 1, items: [
          { text: "영역 개요", href: "bp/overview.html", mock: 1 },
          { key: "bp-master", text: "BP 마스터 계정 목록", href: "bp/index.html", sub: [
            { text: "BP 마스터 계정 상세", href: "bp/detail.html", route: "/platform/bp/BP000017" },
            { text: "BP 마스터 계정 등록", href: "bp/new.html", route: "/platform/bp/new" },
            { text: "BP 마스터 계정 수정", href: "bp/edit.html", route: "/platform/bp/…/edit" }
          ]}
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
        /* 시스템관리는 1팀 명세(R-KJGJXP 플랫폼 시스템 관리)의 하위 기능 다섯으로 이름을 맞췄다.
           구조도의 프로그램 관리가 플랫폼 메뉴 관리다. 권한 팝업의 메뉴는 메뉴 관리의 트리를, 메뉴 관리의 서비스는 공통코드 ‘서비스’를 읽는다. */
        { key: "system", text: "시스템관리", team: "1팀", toggle: 1, items: [
          { text: "영역 개요", href: "system/overview.html", mock: 1 },
          { text: "플랫폼 관리자 관리", href: "system/admins.html" },
          { text: "플랫폼 권한 관리", href: "system/roles.html" },
          { text: "플랫폼 메뉴 관리", href: "system/menus.html" },
          { text: "플랫폼 공통코드 관리", href: "system/codes.html" },
          { text: "플랫폼 휴일 관리", href: "system/holidays.html" }
        ]},
        { key: "community", text: "커뮤니티관리", team: "3팀", items: [
          { key: "cm-notices", text: "공지사항", href: "support/community.html", sub: [
            { text: "공지 목록", href: "support/community.html", route: "/platform/community" },
            { text: "공지·FAQ 편집", href: "support/notice-edit.html", route: "…/notices/[id]" }
          ]},
          { text: "FAQ", href: "support/community.html#faq" },
          { key: "cm-asks", text: "문의사항", href: "support/community.html#asks", sub: [
            { text: "문의 목록", href: "support/community.html#asks", route: "…/inquiries" },
            { text: "문의 상세·답변", href: "support/inquiry-detail.html", route: "…/inquiries/[id]" }
          ]},
          { key: "cm-leads", text: "도입문의", href: "support/community.html#leads", sub: [
            { text: "도입문의 목록", href: "support/community.html#leads", route: "…/leads" },
            { text: "도입문의 상세", href: "support/lead-detail.html", route: "…/leads/[id]" }
          ]}
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

  /* 상단 조회 범위 선택 (F-TLJOCK). 조회 범위는 BP 하나와 그 BP 안의 점포 범위다.
     점포는 일반점포 · 가맹점포 유형 그룹 또는 개별 점포로 여러 개를 고른다. 점포를 고르지 않고 적용하면 그 BP 전체 점포다.
     적용한 범위는 서버에 두지 않고 이 브라우저 세션 동안만 유지한다(sessionStorage) — 로그아웃하면 사라진다.
     목업 전용 주소 값: ?scope=first 는 BP 가 적용되지 않은 플랫폼 사용자의 최초 진입(닫을 수 없는 팝업), ?scope=nostore 는 접근할 점포가 없는 사용자다. */
  var BPS = [
    { code: "BP000017", name: "㈜한강상회", stores: [
      { id: "ST000001", name: "모리커피 서초점", type: "일반점포" },
      { id: "ST000002", name: "모리커피 성수점", type: "일반점포" },
      { id: "ST000003", name: "온기식당 판교점", type: "일반점포" },
      { id: "ST000004", name: "온기식당 광화문점", type: "일반점포" },
      { id: "ST000005", name: "모리커피 을지로점", type: "가맹점포" },
      { id: "ST000006", name: "모리커피 연남점", type: "가맹점포" },
      { id: "ST000007", name: "모리커피 청담점", type: "가맹점포" },
      { id: "ST000008", name: "모리커피 부평점", type: "가맹점포" },
      { id: "ST000009", name: "온기식당 둔산점", type: "가맹점포" },
      { id: "ST000010", name: "온기식당 서면점", type: "가맹점포" },
      { id: "ST000011", name: "온기식당 일산점", type: "가맹점포" }
    ] },
    { code: "BP000003", name: "모리커피 본사", stores: [
      { id: "ST000031", name: "모리커피 강남본점", type: "일반점포" },
      { id: "ST000032", name: "모리커피 합정점", type: "가맹점포" },
      { id: "ST000033", name: "모리커피 수원점", type: "가맹점포" }
    ] },
    { code: "BP000021", name: "㈜바다푸드", stores: [
      { id: "ST000041", name: "바다횟집 광안점", type: "일반점포" },
      { id: "ST000042", name: "바다횟집 해운대점", type: "일반점포", closed: true },
      { id: "ST000043", name: "바다횟집 서면점", type: "가맹점포" }
    ] },
    { code: "BP000024", name: "㈜한강푸드시스템", stores: [
      { id: "ST000051", name: "한강국밥 여의도점", type: "일반점포" },
      { id: "ST000052", name: "한강국밥 마포점", type: "가맹점포" }
    ] },
    { code: "BP000030", name: "온기식당 본사", stores: [
      { id: "ST000061", name: "온기식당 을지로본점", type: "일반점포" }
    ] }
  ];
  var SCOPE_KEY = "whale-mockup-scope";
  var Q0 = new URLSearchParams(location.search);
  var SCOPE_MODE = Q0.get("scope") || "";
  function bpOf(code) {
    for (var i = 0; i < BPS.length; i++) if (BPS[i].code === code) return BPS[i];
    return BPS[0];
  }
  function scopeNow() {
    var v = null;
    try { v = JSON.parse(sessionStorage.getItem(SCOPE_KEY)); } catch (e) {}
    return v && v.bp ? v : { bp: "BP000017", all: true, ids: [] };
  }
  function scopeSave(v) { try { sessionStorage.setItem(SCOPE_KEY, JSON.stringify(v)); } catch (e) {} }
  /* 버튼 한 줄 — 유형 하나를 통째로 고르면 그 유형 이름으로, 한 곳이면 점포명, 여럿이면 “첫 점포 외 N곳”으로 줄인다 */
  function scopeLabel(v) {
    var bp = bpOf(v.bp), open = bp.stores.filter(function (x) { return !x.closed; });
    if (v.all || !v.ids.length) return "전체 " + open.length + "개점";
    var picked = open.filter(function (x) { return v.ids.indexOf(x.id) > -1; });
    if (!picked.length) return "전체 " + open.length + "개점";
    if (picked.length === open.length) return "전체 " + open.length + "개점";
    /* 통째로 고른 유형은 “일반점포 전체”로 묶고, 나머지 개별 점포는 “첫 점포 외 N곳”으로 붙인다 */
    var parts = [], rest = picked.slice();
    ["일반점포", "가맹점포"].forEach(function (t) {
      var all = open.filter(function (x) { return x.type === t; });
      if (all.length && all.every(function (x) { return v.ids.indexOf(x.id) > -1; })) {
        parts.push(t + " 전체");
        rest = rest.filter(function (x) { return x.type !== t; });
      }
    });
    if (rest.length) parts.push(rest[0].name + (rest.length > 1 ? " 외 " + (rest.length - 1) + "곳" : ""));
    return parts.length === 1 && !rest.length ? parts[0] + " " + picked.length + "개점" : parts.join(" · ");
  }

  function topnavHTML() {
    return (
      '<header class="topnav">' +
      '<button class="iconbtn navtoggle" type="button" aria-label="메뉴 열기" aria-expanded="false" data-icon="menu" data-icon-size="18"></button>' +
      '<a class="brand" href="' + url("index.html") + '">' + mark(30) +
      '<span class="brand__name">WHALE <span>ERP</span></span></a>' +
      /* 점포 선택 드롭다운 · BP 변경 (F-TLJOCK) — 업무 화면은 여기 적용한 BP · 점포 범위로 조회한다.
         BP 변경 버튼은 실제로는 플랫폼 마스터 · 플랫폼 관리자에게만 있다. 목업에는 플랫폼 사용자로 들어오는 경로가 없어
         우선 누구에게나 보이고, 팝업 안에 플랫폼 사용자 전용이라는 안내를 둔다. */
      (SCOPE_MODE === "nostore"
        ? '<a class="scopebtn scopebtn--empty" href="' + url("stores/new.html") + '">' + ic("plus", 14) + "<span>접근할 점포가 없습니다 · 점포 등록</span></a>"
        : '<button class="scopebtn" type="button" aria-haspopup="listbox" aria-expanded="false" title="점포 범위 선택">' +
          '<b class="scopebtn__bp"></b><span class="sep">·</span><span class="scopebtn__val"></span>' + ic("selector", 14) + "</button>" +
          '<button class="scopebp" type="button" aria-haspopup="dialog" title="BP 및 점포 선택">' + ic("refresh", 14) + "BP 변경</button>") +
      '<div class="topnav__end">' +
      '<button class="iconbtn bellbtn" type="button" aria-label="알림 3건" aria-haspopup="true" aria-expanded="false" data-dot="1" data-icon="bell" data-icon-size="18"></button>' +
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

  function toggleHTML(key, label, isOpen) {
    return '<button class="side__toggle" type="button" data-menu="' + key +
      '" aria-expanded="' + !!isOpen + '" aria-label="' + label + ' 하위 메뉴">' +
      ic("down", 14) + "</button>";
  }

  /* 하위가 있으면 어느 층이든 같은 규칙으로 여닫는다. */
  function menuHTML(m, on, sub, open) {
    var mh = m.toggle ? "" : menuHref(m);
    var isOpen = open.indexOf(m.key) > -1;
    var html =
      '<div class="side__row">' +
      '<a class="side__item' + (mh || m.toggle ? "" : " is-na") + '"' +
      (m.toggle ? ' href="#" data-toggle-menu="' + m.key + '" aria-expanded="' + isOpen + '"'
        : mh ? ' href="' + url(mh) + '"' : ' href="#" aria-disabled="true" title="이번 목업 범위 밖"') +
      (on ? ' aria-current="page"' : "") + ">" +
      '<span class="side__text">' + m.text + "</span>" +
      (m.team ? badge(m.team, m.team === "1팀" ? "t1" : "t3") : "") +
      (m.phase ? badge(m.phase + "차", m.phase === "1.5" ? "half" : "second") : "") +
      "</a>" +
      (m.items ? toggleHTML(m.key, m.text, isOpen) : "") +
      "</div>";
    if (!m.items) return html;

    html += '<div class="side__sub" data-sub-of="' + m.key + '"' + (isOpen ? "" : " hidden") + ">";
    m.items.forEach(function (it) {
      var ion = !!sub && (it.href === sub || (it.sub || []).some(function (s) { return s.href === sub; }));
      var deepOpen = !!it.sub && (ion || open.indexOf(it.key) > -1);
      html +=
        '<div class="side__row">' +
        "<a" + linkAttrs(it.href) + (ion ? ' aria-current="page"' : "") + ">" +
        "<span>" + it.text + "</span>" + itemEnd(it, m.phase) + "</a>" +
        (it.sub ? toggleHTML(it.key, it.text, deepOpen) : "") +
        "</div>";
      if (!it.sub) return;
      html += '<div class="side__sub side__sub--deep" data-sub-of="' + it.key + '"' +
        (deepOpen ? "" : " hidden") + ">";
      it.sub.forEach(function (s) {
        html +=
          "<a" + linkAttrs(s.href) + (s.href === sub ? ' aria-current="page"' : "") + ">" +
          "<span>" + s.text + "</span>" +
          '<span class="side__route">' + s.route + "</span></a>";
      });
      html += "</div>";
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
        html += menuHTML(m, m.key === page, sub, open);
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
      /* toggle 메뉴는 이름을 눌러도 화면으로 가지 않고 하위만 여닫는다. */
      var name = e.target.closest("[data-toggle-menu]");
      if (name) {
        e.preventDefault();
        var tg = side.querySelector('.side__toggle[data-menu="' + name.dataset.toggleMenu + '"]');
        if (tg) tg.click();
        return;
      }
      var t = e.target.closest(".side__toggle");
      if (!t) return;
      var panel = side.querySelector('[data-sub-of="' + t.dataset.menu + '"]');
      if (!panel) return;
      panel.hidden = !panel.hidden;
      t.setAttribute("aria-expanded", String(!panel.hidden));
      var nm = side.querySelector('[data-toggle-menu="' + t.dataset.menu + '"]');
      if (nm) nm.setAttribute("aria-expanded", String(!panel.hidden));
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
  function wirePop(btn, align, build, onPick, onReady) {
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
      pop.className = "pop" + (btn.classList.contains("scopebtn") ? " pop--scope" : "") +
        (btn.classList.contains("bellbtn") ? " pop--bell" : "");
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
      if (onReady) onReady(pop);
      pop.addEventListener("click", function (ev) { ev.stopPropagation(); });
    });
    document.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* ---------- 점포 선택 드롭다운 · BP 및 점포 선택 팝업 (F-TLJOCK) ----------
     드롭다운은 지금 BP 안의 범위를 그 자리에서 바로 고른다. BP 를 바꿀 때만 BP 변경 버튼(플랫폼 사용자)이 팝업을 연다.
     팝업 구성 — BP 선택(단일) · 점포명 검색 · 유형 그룹(일반점포 · 가맹점포, 그룹 체크와 점포 수) · 개별 점포 체크 · 선택 결과 · 적용 · 취소.
     그룹과 개별 조합, 서로 다른 유형 간 복수 선택이 된다. 폐점 점포도 폐점 표시와 함께 보이되 고르지 않는다.
     최초 진입(플랫폼 사용자 · 적용된 BP 없음)에는 취소 · 닫기가 없다. */
  function wireScope() {
    var btn = document.querySelector("button.scopebtn");
    if (!btn) return;
    var bpBtn = document.querySelector(".scopebp");
    function paint() {
      if (forced) {
        btn.querySelector(".scopebtn__bp").textContent = "BP 미적용";
        btn.querySelector(".scopebtn__val").textContent = "BP 를 고르세요";
        return;
      }
      var v = scopeNow();
      btn.querySelector(".scopebtn__bp").textContent = bpOf(v.bp).name;
      btn.querySelector(".scopebtn__val").textContent = scopeLabel(v);
    }
    paint();
    var m = document.createElement("div");
    m.className = "modal scopepop";
    m.hidden = true;
    m.setAttribute("role", "dialog");
    m.setAttribute("aria-modal", "true");
    m.setAttribute("aria-labelledby", "scp-t");
    document.body.appendChild(m);
    var st = null, forced = false, back = null;
    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function draw(q) {
      q = q || "";
      var bp = bpOf(st.bp);
      var open = bp.stores.filter(function (x) { return !x.closed; });
      var hit = function (x) { return !q || (x.name + x.id).toLowerCase().indexOf(q.toLowerCase()) > -1; };
      var groups = ["일반점포", "가맹점포"].map(function (t) {
        var all = bp.stores.filter(function (x) { return x.type === t; });
        var can = all.filter(function (x) { return !x.closed; }).length;
        var sel = all.filter(function (x) { return !x.closed && st.ids.indexOf(x.id) > -1; }).length;
        var shown = all.filter(hit);
        if (!shown.length) return "";
        var gs = !can ? "false" : sel === can ? "true" : sel ? "mixed" : "false";
        return '<div class="scopepop__grp">' +
          '<label class="scopepop__ghead"><span class="check" role="checkbox" tabindex="0" aria-checked="' + gs + '" aria-label="' + t + ' 전체" data-grp="' + t + '"' + (can ? "" : " disabled") + ">" + ic(gs === "mixed" ? "minus" : "check", 11) + "</span>" +
          "<b>" + t + '</b><span class="subtle">' + all.length + "개점" + (all.length !== can ? " · 폐점 " + (all.length - can) : "") + "</span>" +
          '<span class="scopepop__gsel">' + (sel ? sel + "곳 선택" : "") + "</span></label>" +
          '<div class="scopepop__stores">' + shown.map(function (x) {
            var on = st.ids.indexOf(x.id) > -1 && !x.closed;
            return '<label class="scopepop__store' + (x.closed ? " is-closed" : "") + '"' + (x.closed ? ' title="폐점한 점포는 고를 수 없습니다"' : "") + '><span class="check" role="checkbox" tabindex="' + (x.closed ? "-1" : "0") + '" aria-checked="' + on + '" aria-label="' + esc(x.name) + '" data-id="' + x.id + '"' + (x.closed ? " disabled" : "") + ">" + ic("check", 11) + "</span>" +
              '<span class="scopepop__name">' + esc(x.name) + '</span><span class="mono subtle">' + x.id + "</span>" + (x.closed ? '<span class="badge badge--quiet">폐점</span>' : "") + "</label>";
          }).join("") + "</div></div>";
      }).join("");
      var n = st.ids.length;
      var result = n ? "<b>선택 " + n + "곳</b> · " + esc(scopeLabel({ bp: st.bp, all: false, ids: st.ids })) : "<b>선택 안 함</b> · 적용하면 전체 " + open.length + "개점을 봅니다";
      var noBp = forced && !st.picked;
      /* 목업에는 플랫폼 사용자로 들어오는 경로가 없어 BP 변경 버튼을 늘 보이고, 팝업은 플랫폼 사용자 기준(BP 선택)으로 그린다.
         BP 는 자동완성으로 고른다 — 칸을 누르면 접근할 수 있는 BP 가 펼쳐지고, 상호명 · BP 코드 일부로 좁힌다. */
      var bpField = '<div class="addr__q scopepop__bpq"><span data-icon="search" data-icon-size="15"></span>' +
          '<input class="input" id="scp-bp" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="scp-bplist" autocomplete="off"' +
          ' placeholder="BP 상호명 또는 BP 코드로 찾기" value="' + (noBp ? "" : esc(bp.name + " · " + bp.code)) + '" />' +
          '<div class="addr__list" id="scp-bplist" role="listbox" aria-label="고를 수 있는 BP" hidden></div></div>' +
          '<span class="help">접근 권한이 있는 BP 만 나옵니다. 한 번에 하나만 고르고, 바꾸면 고른 점포는 비워집니다.</span>';
      m.innerHTML = '<div class="modal__box scopepop__box">' +
        '<div class="modal__head"><h2 class="t-h2" id="scp-t">BP 및 점포 선택</h2>' +
        (forced ? "" : '<button class="iconbtn" type="button" data-scp-cancel aria-label="닫기">' + ic("x", 16) + "</button>") + "</div>" +
        '<div class="modal__body">' +
        '<p class="note scopepop__only" style="margin:0">' + ic("lock", 14) + "<span>이 팝업과 BP 변경 버튼은 <b>플랫폼 마스터 · 플랫폼 관리자</b>에게만 노출됩니다. 고객 사용자(BP 측 관리자)는 본인 BP 로 고정되어 점포 선택 드롭다운만 씁니다.</span></p>" +
        (forced ? '<p class="note" style="margin:0">' + ic("info", 14) + "<span>적용된 BP 가 없습니다. BP 와 점포 범위를 골라 적용해야 ERP 화면을 쓸 수 있습니다.</span></p>" : "") +
        '<div class="field"><label for="scp-bp">BP</label>' + bpField + "</div>" +
        (noBp ? '<div class="scopepop__wait">BP 를 고르면 그 BP 의 점포 목록이 나옵니다.</div>' :
          '<div class="field"><label for="scp-q">점포</label><div class="inputwrap">' + ic("search", 15) +
          '<input class="input" id="scp-q" placeholder="점포명으로 찾기" value="' + esc(q) + '" autocomplete="off" /></div>' +
          '<span class="help">유형 전체를 고르거나 점포를 하나씩 고릅니다. 고르지 않고 적용하면 전체 점포입니다.</span></div>' +
          '<div class="scopepop__list">' + (groups || '<p class="scopepop__none">‘' + esc(q) + "’에 맞는 점포가 없습니다.</p>") + "</div>" +
          '<div class="scopepop__result"><span>' + result + "</span>" + (n ? '<button class="tlink" type="button" data-scp-clear>선택 지우기</button>' : "") + "</div>") +
        "</div>" +
        '<div class="modal__foot">' + (forced ? "" : '<button class="btn btn--ghost" type="button" data-scp-cancel>취소</button>') +
        '<button class="btn btn--primary" type="button" data-scp-apply' + (noBp ? " disabled" : "") + ">적용</button></div></div>";
      hydrateIcons(m);
    }
    function openPop(fromBp) {
      var v = scopeNow();
      st = { bp: v.bp, ids: v.all ? [] : v.ids.slice(), picked: !forced };
      back = document.activeElement;
      draw("");
      m.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      var f = (fromBp || forced) ? m.querySelector("#scp-bp") : (m.querySelector("#scp-q") || m.querySelector("#scp-bp"));
      if (f) f.focus();
    }
    function closePop() {
      if (forced) return;
      m.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      if (back && back.focus) back.focus();
    }
    function qNow() { var q = m.querySelector("#scp-q"); return q ? q.value : ""; }
    function toggleCheck(c) {
      if (!c || c.hasAttribute("disabled")) return;
      var bp = bpOf(st.bp), key;
      if (c.dataset.id) {
        var i = st.ids.indexOf(c.dataset.id);
        if (i > -1) st.ids.splice(i, 1); else st.ids.push(c.dataset.id);
        key = '[data-id="' + c.dataset.id + '"]';
      } else {
        var mine = bp.stores.filter(function (x) { return x.type === c.dataset.grp && !x.closed; }).map(function (x) { return x.id; });
        var allOn = mine.every(function (id) { return st.ids.indexOf(id) > -1; });
        st.ids = st.ids.filter(function (id) { return mine.indexOf(id) < 0; });
        if (!allOn) st.ids = st.ids.concat(mine);
        key = '[data-grp="' + c.dataset.grp + '"]';
      }
      draw(qNow());
      var again = m.querySelector(key);
      if (again) again.focus();
    }
    m.addEventListener("click", function (e) {
      if (e.target === m) return closePop();
      if (e.target.closest("[data-scp-cancel]")) return closePop();
      if (e.target.closest("[data-scp-clear]")) { st.ids = []; draw(qNow()); return; }
      if (e.target.closest("[data-scp-apply]")) {
        if (forced && !st.picked) return;
        scopeSave({ bp: st.bp, all: !st.ids.length, ids: st.ids.slice() });
        forced = false;
        paint();
        m.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        toast("조회 범위를 적용했습니다 · " + bpOf(st.bp).name + " · " + scopeLabel(scopeNow()));
        return;
      }
      var lab = e.target.closest("label.scopepop__ghead, label.scopepop__store");
      if (lab) { e.preventDefault(); toggleCheck(lab.querySelector(".check")); }
    });
    m.addEventListener("keydown", function (e) {
      var c = e.target.closest(".check");
      if (c && (e.key === " " || e.key === "Enter")) { e.preventDefault(); toggleCheck(c); }
      if (e.key === "Escape") { e.stopPropagation(); closePop(); }
    });
    m.addEventListener("input", function (e) {
      if (e.target.id !== "scp-q") return;
      var v = e.target.value, pos = e.target.selectionStart;
      draw(v);
      var q = m.querySelector("#scp-q");
      q.focus();
      q.setSelectionRange(pos, pos);
    });
    /* BP 자동완성 */
    var bpFound = [], bpAt = -1;
    function bpList() { return m.querySelector("#scp-bplist"); }
    function bpClose() {
      var l = bpList(), q = m.querySelector("#scp-bp");
      if (l) { l.hidden = true; l.innerHTML = ""; }
      if (q) { q.setAttribute("aria-expanded", "false"); q.removeAttribute("aria-activedescendant"); }
      bpFound = []; bpAt = -1;
    }
    function bpMark(i) {
      bpAt = i;
      [].forEach.call(bpList().querySelectorAll(".spick__opt"), function (o, k) {
        o.setAttribute("aria-selected", String(k === i));
        if (k === i) { o.scrollIntoView({ block: "nearest" }); m.querySelector("#scp-bp").setAttribute("aria-activedescendant", o.id); }
      });
    }
    function bpHi(text, t) {
      var i = t ? text.toLowerCase().indexOf(t) : -1;
      return i < 0 ? esc(text) : esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + t.length)) + "</mark>" + esc(text.slice(i + t.length));
    }
    function bpOpen() {
      var q = m.querySelector("#scp-bp"), l = bpList();
      if (!q || !l) return;
      var cur = bpOf(st.bp), raw = q.value.trim();
      var t = st.picked && raw === cur.name + " · " + cur.code ? "" : raw.toLowerCase();
      bpFound = BPS.filter(function (b) { return !t || (b.name + " " + b.code).toLowerCase().indexOf(t) > -1; });
      l.innerHTML = bpFound.length
        ? '<div class="addr__count">' + (t ? "맞는 BP " : "접근할 수 있는 BP ") + bpFound.length + "곳</div>" + bpFound.map(function (b, i) {
            var n = b.stores.filter(function (x) { return !x.closed; }).length;
            return '<div class="spick__opt" role="option" id="scp-bpo-' + i + '" data-i="' + i + '" aria-selected="false">' +
              "<span>" + bpHi(b.name, t) + '</span><span class="mono spick__code">' + bpHi(b.code, t) + '</span><span class="spick__type">점포 ' + n + "곳" +
              (st.picked && b.code === st.bp ? " · 지금 BP" : "") + "</span></div>";
          }).join("")
        : '<div class="addr__note">‘' + esc(raw) + "’에 맞는 BP 가 없습니다. 접근 권한이 있는 BP 안에서만 찾습니다.</div>";
      l.hidden = false;
      q.setAttribute("aria-expanded", "true");
      if (bpFound.length) bpMark(0);
    }
    function bpPick(i) {
      var b = bpFound[i];
      if (!b) return;
      if (b.code !== st.bp || !st.picked) { st.bp = b.code; st.ids = []; }
      st.picked = true;
      draw("");
      var q = m.querySelector("#scp-q") || m.querySelector("#scp-bp");
      if (q) q.focus();
    }
    m.addEventListener("focusin", function (e) { if (e.target.id === "scp-bp") { e.target.select(); bpOpen(); } });
    m.addEventListener("input", function (e) { if (e.target.id === "scp-bp") bpOpen(); });
    m.addEventListener("keydown", function (e) {
      if (e.target.id !== "scp-bp") return;
      var on = !bpList().hidden && bpFound.length;
      if (e.key === "ArrowDown") { e.preventDefault(); if (bpList().hidden) bpOpen(); else if (on) bpMark(Math.min(bpAt + 1, bpFound.length - 1)); }
      else if (e.key === "ArrowUp" && on) { e.preventDefault(); bpMark(Math.max(bpAt - 1, 0)); }
      else if (e.key === "Enter") { e.preventDefault(); if (on && bpAt > -1) bpPick(bpAt); }
      else if (e.key === "Escape" && !bpList().hidden) { e.preventDefault(); e.stopImmediatePropagation(); bpClose(); }
      else if (e.key === "Tab") bpClose();
    }, true);
    m.addEventListener("mousedown", function (e) { if (e.target.closest("#scp-bplist")) e.preventDefault(); });
    m.addEventListener("mousemove", function (e) {
      var o = e.target.closest("#scp-bplist .spick__opt");
      if (o && +o.dataset.i !== bpAt) bpMark(+o.dataset.i);
    });
    m.addEventListener("click", function (e) {
      var o = e.target.closest("#scp-bplist .spick__opt");
      if (o) { e.stopPropagation(); bpPick(+o.dataset.i); return; }
      if (!e.target.closest(".scopepop__bpq")) bpClose();
    }, true);
    m.addEventListener("focusout", function (e) {
      if (e.target.id !== "scp-bp") return;
      setTimeout(function () {
        if (m.contains(document.activeElement) && document.activeElement.id === "scp-bp") return;
        bpClose();
        var q = m.querySelector("#scp-bp"), cur = bpOf(st.bp);
        if (q && st.picked) q.value = cur.name + " · " + cur.code;   /* 고르지 않고 벗어나면 지금 BP 로 되돌린다 */
      }, 0);
    });
    /* 점포 선택 드롭다운 — 누른 자리에서 바로 펼친다. 지금 적용된 BP 안의 범위만 고르고 BP 는 바꾸지 않는다.
       전체 · 직영 · 가맹 묶음과 직영 점포, 가맹 점포 세 무리로 보이고, 점포가 10곳 이상이면 이름으로 찾는 칸이 붙는다.
       고르면 곧바로 그 범위로 바뀐다. 폐점 점포는 이 목록에 싣지 않는다(팝업에서만 폐점 표시와 함께 보인다). */
    function ddOpt(key, label, meta, on) {
      return '<button type="button" role="option" data-scope="' + key + '" data-q="' + label + " " + meta + '" aria-selected="' + !!on + '">' +
        "<span><b>" + label + "</b><br><span class=\"subtle\" style=\"font-size:11.5px\">" + meta + "</span></span>" +
        (on ? ic("check", 14) : "") + "</button>";
    }
    function ddHTML() {
      var v = scopeNow(), bp = bpOf(v.bp);
      var open = bp.stores.filter(function (x) { return !x.closed; });
      var dir = open.filter(function (x) { return x.type === "일반점포"; });
      var fr = open.filter(function (x) { return x.type === "가맹점포"; });
      var ids = v.all ? [] : v.ids;
      var same = function (list) { return ids.length === list.length && list.every(function (x) { return ids.indexOf(x.id) > -1; }); };
      var cur = !ids.length || same(open) ? "all" : dir.length && same(dir) ? "dir" : fr.length && same(fr) ? "fr" : ids.length === 1 ? ids[0] : "";
      function sect(title, items) {
        return items.length ? '<div class="pop__sect"><div class="pop__label">' + title + "</div>" + items.join("") + "</div>" : "";
      }
      return (open.length >= 10
          ? '<div class="pop__search">' + ic("search", 14) + '<input class="pop__q" type="search" placeholder="점포 이름으로 찾기" aria-label="점포 찾기" /></div>'
          : "") +
        '<div class="pop__list">' +
        sect(bp.name, [ddOpt("all", "전체 " + open.length + "개점", "직영 " + dir.length + " · 가맹 " + fr.length, cur === "all")]
          .concat(dir.length ? [ddOpt("dir", "직영 " + dir.length + "개점", "일반점포 전체", cur === "dir")] : [])
          .concat(fr.length ? [ddOpt("fr", "가맹 " + fr.length + "개점", "가맹점포 전체", cur === "fr")] : [])) +
        sect("직영 " + dir.length, dir.map(function (x) { return ddOpt(x.id, x.name, x.id, cur === x.id); })) +
        sect("가맹 " + fr.length, fr.map(function (x) { return ddOpt(x.id, x.name, x.id, cur === x.id); })) +
        '<p class="pop__none" hidden>맞는 점포가 없습니다.</p>' +
        "</div>" +
        (!v.all && ids.length > 1 && !cur ? '<p class="pop__note">지금 범위는 BP 변경 팝업에서 여러 점포를 골라 적용한 것입니다.</p>' : "");
    }
    function ddPick(key) {
      var v = scopeNow(), bp = bpOf(v.bp);
      var open = bp.stores.filter(function (x) { return !x.closed; });
      var pick = key === "all" ? [] :
        key === "dir" ? open.filter(function (x) { return x.type === "일반점포"; }).map(function (x) { return x.id; }) :
        key === "fr" ? open.filter(function (x) { return x.type === "가맹점포"; }).map(function (x) { return x.id; }) : [key];
      scopeSave({ bp: v.bp, all: !pick.length, ids: pick });
      paint();
      toast("조회 범위를 바꿨습니다 · " + bp.name + " · " + scopeLabel(scopeNow()));
    }
    function ddSearch(pop) {
      var q = pop.querySelector(".pop__q");
      if (!q) return;
      q.addEventListener("input", function () {
        var t = q.value.trim().toLowerCase(), anyAll = false;
        pop.querySelectorAll(".pop__sect").forEach(function (sect) {
          var any = false;
          sect.querySelectorAll("button[role=option]").forEach(function (b) {
            var hit = !t || b.dataset.q.toLowerCase().indexOf(t) > -1;
            b.hidden = !hit;
            if (hit) any = true;
          });
          sect.hidden = !any;
          if (any) anyAll = true;
        });
        pop.querySelector(".pop__none").hidden = anyAll;
      });
      q.focus();
    }
    wirePop(btn, "left", ddHTML, function (i, o) { ddPick(o.dataset.scope); }, ddSearch);
    if (bpBtn) bpBtn.addEventListener("click", function () { openPop(true); });
    if (SCOPE_MODE === "first") { forced = true; paint(); openPop(true); }
  }

  /* 화면 아래 잠깐 뜨는 알림 — 조회 범위를 적용했을 때 */
  function toast(msg) {
    var t = document.createElement("div");
    t.className = "scopetoast";
    t.setAttribute("role", "status");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  /* 종을 누르면 미확인 알림 몇 건이 뜬다 (NOTIFY-2). 눌러 들어가면 그것으로 읽음이다 (NOTIFY-1).
     목업은 BP 마스터 한 사람 기준이라 알림함의 미확인 셋과 같은 것을 보여 준다. */
  var BELL = [
    { tone: "risk", kind: "계약 거부", title: "서지안 님이 근로계약서를 거부했습니다", meta: "사유 · 근무 시작일이 협의한 날과 다릅니다", when: "09-06 09:12", href: "staff/contracts-detail.html" },
    { tone: "ok", kind: "계약 날인", title: "문태경 님이 근로계약서에 날인했습니다", meta: "온기식당 판교점 · 정직원", when: "09-05 18:40", href: "staff/contracts-detail.html" },
    { tone: "info", kind: "문의 답변", title: "문의에 답변이 등록되었습니다", meta: "가맹점 초대 메일이 반송됩니다", when: "09-02 11:05", href: "support/inquiry-mine.html" }
  ];

  function wireBell() {
    var btn = document.querySelector(".bellbtn");
    wirePop(btn, "right", function () {
      return '<div class="pop__label">미확인 알림 ' + BELL.length + "건</div>" +
        BELL.map(function (n) {
          return "<a" + linkAttrs(n.href) + ' class="pop__item">' +
            '<span class="badge badge--dot badge--' + n.tone + '"></span>' +
            '<span class="pop__body"><b>' + n.title + "</b>" +
            "<span>" + n.meta + "</span>" +
            '<span class="mono">' + n.when + " · " + n.kind + "</span></span></a>";
        }).join("") +
        '<hr><a href="' + url("notify/index.html") + '">' + ic("inbox", 14) + "알림함 전체 보기</a>";
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
        '<a href="' + url("mypage/profile.html") + '">내 정보 관리</a>' +
        '<a href="' + url("mypage/password.html") + '">비밀번호 변경</a>' +
        /* 회원 탈퇴는 BP 마스터에게만 보인다 — 목업의 로그인 사용자가 BP 마스터라 늘 보인다. */
        '<a href="' + url("mypage/withdraw.html") + '">회원 탈퇴</a>' +
        /* 로그아웃은 이 브라우저 세션만 끝내고 로그인 화면으로 간다(S-TMRGOG). */
        '<hr><a href="' + url("auth/login.html") + '">' + ic("logout", 14) + "로그아웃</a>";
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
          /* 직계 자식만 건드린다. 탭 안에 탭이 있을 때(근무스케줄의 주간·일간)
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

  /* 메뉴가 #contracts 같은 해시로 보내면 그 탭을 연다.
     같은 페이지 안에서 해시만 바뀔 때도 다시 읽어야 해서 hashchange 를 함께 듣는다. */
  function openTabFromHash() {
    var h = location.hash.slice(1);
    if (!h) return;
    var btn = document.querySelector('[data-tab="' + h + '"]');
    if (btn) btn.click();
  }

  /* ---------- 페이저 (목록 공통 규칙) ----------
     data-pager="총건수" 가 붙은 목록 아래에 선다. 페이지당 건수는 20·50·100 중 고르고
     고른 값은 기억해 모든 목록이 같이 쓴다. 목업이라 줄은 늘 1페이지 표본이고 숫자만 바뀐다. */
  var SIZE_KEY = "whale-mockup-pagesize";
  var SIZES = [20, 50, 100];
  /* 목록이 data-pager-sizes="10,30,50" 로 제 건수를 가지면 그것을 쓴다. 명세가 공통 규칙과 다르게 정한
     목록(1팀 점포 목록)용이다. 그 목록의 선택은 따로 기억해 다른 목록의 20·50·100 을 흔들지 않는다. */
  function sizesOf(el) {
    var own = (el && el.dataset.pagerSizes || "").split(",").map(function (n) { return parseInt(n, 10); }).filter(Boolean);
    return own.length ? own : SIZES;
  }
  function sizeKeyOf(el) {
    return el && el.dataset.pagerSizes ? SIZE_KEY + ":" + el.dataset.pagerSizes : SIZE_KEY;
  }
  function pageSize(el) {
    var v = 0, sizes = sizesOf(el);
    try { v = parseInt(localStorage.getItem(sizeKeyOf(el)) || "", 10); } catch (e) {}
    return sizes.indexOf(v) >= 0 ? v : sizes[0];
  }
  function pagerHTML(total, unit, cur, size, sizes) {
    sizes = sizes || SIZES;
    var last = Math.max(1, Math.ceil(total / size));
    cur = Math.min(cur, last);
    var from = total ? (cur - 1) * size + 1 : 0, to = Math.min(cur * size, total);
    var nums = [];
    for (var i = 1; i <= last; i++) {
      if (last <= 7 || i <= 2 || i > last - 2 || Math.abs(i - cur) <= 1) nums.push(i);
      else if (nums[nums.length - 1] !== "…") nums.push("…");
    }
    var nav = nums.map(function (n) {
      if (n === "…") return '<span class="pager__gap">…</span>';
      return '<button type="button" data-go="' + n + '"' + (n === cur ? ' aria-current="page"' : "") + ">" + n + "</button>";
    }).join("");
    return '<span class="pager__count">총 <b>' + total + "</b>" + unit + " · " + from + "–" + to + "</span>" +
      '<label class="pager__size">페이지당 <select class="select select--sm">' +
      sizes.map(function (n) { return "<option" + (n === size ? " selected" : "") + ">" + n + "</option>"; }).join("") +
      "</select></label>" +
      '<nav class="pager__nav" aria-label="페이지">' +
      '<button type="button" data-go="' + (cur - 1) + '" aria-label="이전"' + (cur <= 1 ? " disabled" : "") + ' data-icon="arrowleft" data-icon-size="14"></button>' +
      nav +
      '<button type="button" data-go="' + (cur + 1) + '" aria-label="다음"' + (cur >= last ? " disabled" : "") + ' data-icon="arrowright" data-icon-size="14"></button>' +
      "</nav>";
  }
  function wirePager() {
    var lists = document.querySelectorAll("[data-pager]");
    if (!lists.length) return;
    function render(el, cur) {
      var bar = el.nextElementSibling;
      if (!bar || !bar.classList.contains("pager")) {
        el.insertAdjacentHTML("afterend", '<div class="pager"></div>');
        bar = el.nextElementSibling;
      }
      bar.dataset.cur = cur;
      bar.innerHTML = pagerHTML(parseInt(el.dataset.pager, 10) || 0, el.dataset.pagerUnit || "건", cur, pageSize(el), sizesOf(el));
      hydrateIcons(bar);
    }
    lists.forEach(function (el) { render(el, 1); });
    document.addEventListener("click", function (e) {
      var b = e.target.closest(".pager [data-go]");
      if (!b || b.disabled) return;
      render(b.closest(".pager").previousElementSibling, parseInt(b.dataset.go, 10));
    });
    document.addEventListener("change", function (e) {
      var sel = e.target.closest(".pager__size select");
      if (!sel) return;
      try { localStorage.setItem(sizeKeyOf(sel.closest(".pager").previousElementSibling), sel.value); } catch (err) {}
      lists.forEach(function (el) { render(el, 1); });
    });
  }

  /* ---------- 바탕을 누르면 누를 수 있는 것이 잠깐 빛난다 (Figma 프로토타입처럼) ---------- */
  var HINT_SEL = 'a[href]:not(.is-na):not([aria-disabled="true"]), button:not([disabled]), .toggle:not([disabled]), .check:not([disabled]), details > summary';
  function wireHint() {
    document.addEventListener("click", function (e) {
      if (e.target.closest(HINT_SEL + ", input, select, textarea, label, .pop")) return;
      document.querySelectorAll(HINT_SEL).forEach(function (el) {
        if (!el.getClientRects().length) return; /* 숨은 탭·메뉴 안은 건너뛴다 */
        el.classList.remove("is-hint");
        void el.offsetWidth; /* 연달아 눌러도 애니메이션이 다시 돈다 */
        el.classList.add("is-hint");
      });
    });
    document.addEventListener("animationend", function (e) {
      if (e.animationName === "hint") e.target.classList.remove("is-hint");
    });
  }

  /* ---------- 말풍선 (data-tip) ---------- */
  function wireTips() {
    var box = null;
    function hide() { if (box) { box.remove(); box = null; } }
    function show(el) {
      hide();
      box = document.createElement("div");
      box.className = "tipbox";
      box.setAttribute("role", "tooltip");
      box.textContent = el.dataset.tip;
      document.body.appendChild(box);
      var r = el.getBoundingClientRect();
      var left = Math.max(8, Math.min(r.left, window.innerWidth - box.offsetWidth - 8));
      box.style.left = left + "px";
      box.style.top = r.bottom + 8 + "px";
      box.style.setProperty("--tip-x", (r.left + r.width / 2 - left) + "px");
    }
    document.addEventListener("mouseover", function (e) {
      var t = e.target.closest("[data-tip]");
      if (t) show(t);
    });
    document.addEventListener("mouseout", function (e) {
      var t = e.target.closest("[data-tip]");
      if (t && !t.contains(e.relatedTarget)) hide();
    });
    document.addEventListener("focusin", function (e) { var t = e.target.closest("[data-tip]"); if (t) show(t); });
    document.addEventListener("focusout", hide);
    document.addEventListener("scroll", hide, true);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
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
    var embed = EMBED;
    if (embed) document.documentElement.classList.add("is-embed");
    if (shell && page && !embed) {
      shell.insertAdjacentHTML("afterbegin", topnavHTML(page) + sideHTML(page, document.body.dataset.sub));
    }
    hydrateIcons(document);
    wireScope();
    wireMe();
    wireBell();
    wireAccordion();
    wireTabs();
    wireStates();
    wireDrawer();
    wirePager();
    wireHint();
    wireTips();
    openTabFromHash();
    window.addEventListener("hashchange", openTabFromHash);
    wireSessionExpiry();
    wirePagePop();
    if (embed) wireEmbed();
  }

  /* ---------- 화면 팝업 (data-pagepop) ----------
     목록에서 등록·상세·수정 화면을 화면 이동 없이 팝업으로 연다. 팝업 안에는 그 화면 파일을 ?embed=1 로 싣는다 —
     메뉴·상단바 없이 제목줄과 본문만 보이고, 화면 파일 하나를 단독 화면과 팝업이 함께 쓴다.
     팝업 안에서 상세 → 수정 → 상세로 가는 링크는 팝업 안에서 이어진다. 목록 화면으로 가는 링크는 팝업을 닫고,
     결과 상태(?state=…)를 달고 있으면(삭제 직후 등) 목록을 그 상태로 다시 연다.
     목록의 목업 권한(data-demo-key="role")은 ?role= 로 팝업 화면에 넘긴다. */
  var EMBED = new URLSearchParams(location.search).get("embed") === "1";
  function roleNow() {
    var bar = document.querySelector('[data-demo][data-demo-key="role"]');
    return bar && bar.dataset.current;
  }
  function withParams(href, extra) {
    var u = new URL(href, location.href);
    Object.keys(extra).forEach(function (k) { if (extra[k]) u.searchParams.set(k, extra[k]); });
    return u.href;
  }
  function wirePagePop() {
    if (EMBED || !document.querySelector("[data-pagepop]")) return;
    var pop = document.createElement("div");
    pop.className = "modal pagepop";
    pop.hidden = true;
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-modal", "true");
    pop.setAttribute("aria-label", "화면 팝업");
    pop.innerHTML = '<div class="modal__box pagepop__box">' +
      '<button class="iconbtn pagepop__x" type="button" data-close aria-label="팝업 닫기">' + ic("x", 16) + "</button>" +
      '<iframe class="pagepop__frame" title="팝업 화면"></iframe></div>';
    document.body.appendChild(pop);
    var frame = pop.querySelector("iframe"), back = null;
    function close() { pop.hidden = true; frame.removeAttribute("src"); if (back) back.focus(); }
    pop.querySelector(".pagepop__x").addEventListener("click", close);
    pop.addEventListener("click", function (e) { if (e.target === pop) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !pop.hidden) close(); });
    frame.addEventListener("load", function () {
      try { frame.title = frame.contentDocument.title || "팝업 화면"; } catch (err) {}
    });
    document.addEventListener("click", function (e) {
      var a = e.target.closest("[data-pagepop]");
      if (!a) return;
      e.preventDefault();
      back = a;
      frame.src = withParams(a.getAttribute("href") || a.dataset.pagepop, { embed: "1", role: roleNow(), from: location.pathname });
      pop.hidden = false;
      pop.querySelector(".pagepop__x").focus();
    });
    window.addEventListener("message", function (e) {
      var d = e.data || {};
      if (d.pagepop !== "close") return;
      close();
      if (d.go) location.href = d.go;
    });
  }
  /* 팝업 안의 화면 — 링크가 목록(부모 화면)으로 가면 팝업을 닫고, 다른 화면으로 가면 팝업 안에서 이어 간다 */
  function wireEmbed() {
    var q = new URLSearchParams(location.search);
    var parentPath = q.get("from") || "", role = q.get("role");
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href]");
      if (!a || a.target || e.defaultPrevented) return;
      var u = new URL(a.getAttribute("href"), location.href);
      if (u.origin !== location.origin && u.protocol !== "file:") return;
      e.preventDefault();
      if (u.pathname === parentPath) {
        var st = u.searchParams.get("state");
        window.parent.postMessage({ pagepop: "close", go: st && !a.classList.contains("iconbtn") ? u.href : "" }, "*");
        return;
      }
      location.href = withParams(u.href, { embed: "1", role: role, from: parentPath });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (document.querySelector(".modal:not([hidden])")) return;
      window.parent.postMessage({ pagepop: "close" }, "*");
    });
  }

  /* ---------- 세션 만료 경고 (1팀 S-QCNVFC) ----------
     갱신 토큰까지 만료되면 로그인 화면으로 바로 보내지 않고, 쓰던 화면 위에 경고창을 한 번 띄운다.
     확인을 누르면 로그인 화면으로 간다. 다시 로그인하면 보던 화면으로 돌아오는 것은 서버 쪽 처리다.
     목업에서는 아무 화면 주소 뒤에 ?session=expired 를 붙이면 뜬다. */
  function wireSessionExpiry() {
    if (new URLSearchParams(location.search).get("session") !== "expired") return;
    document.body.insertAdjacentHTML("beforeend",
      '<div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="sx-t" aria-describedby="sx-d">' +
      '<div class="modal__box" style="max-width: 400px">' +
      '<div class="modal__head"><h2 class="t-h2" id="sx-t">' + ic("clock", 18) + " 세션이 만료되었습니다</h2></div>" +
      '<div class="modal__body"><p id="sx-d" style="margin: 0; font-size: 13.5px">장시간 사용하지 않아 로그아웃되었습니다.</p>' +
      '<p class="subtle" style="margin: 0; font-size: 12.5px">다시 로그인하면 지금 보던 화면으로 돌아옵니다. 저장하지 않은 입력은 복구되지 않습니다.</p></div>' +
      '<div class="modal__foot"><a class="btn btn--primary" href="' + url("auth/login.html") + '">확인</a></div>' +
      "</div></div>");
    var ok = document.querySelector('[aria-labelledby="sx-t"] .btn');
    if (ok) ok.focus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
