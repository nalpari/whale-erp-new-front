/* 1팀 목업(auth/ 인증·계정 · stores/ 점포 관리 · bp/ BP 마스터 계정 관리)의 화면 안 동작. app.js 뒤에 둔다.

   data-pw-toggle           비밀번호 입력의 마스킹을 켜고 끈다 (비밀번호 정책 — 마스킹 해제 제공)
   data-demo="범위id"        목업 상태 전환 줄. 안의 버튼 data-state 를 누르면
                            범위 안의 [data-show] 중 그 상태를 가진 것만 보인다.
                            data-show 는 공백으로 여러 상태를 적는다. "*" 는 늘 보인다.
   ?state=값                 주소로 상태를 골라 들어온다 — 다른 화면이 login.html?state=expired 로 보낸다.
   ?bp=상호명 · 코드          점포 목록에 BP 조건 띠([data-bp-filter])를 보인다 — BP 상세가 stores/index.html?bp=… 로 보낸다.
   data-open="모달id"        모달을 연다. data-close 는 가장 가까운 모달을 닫는다.
   data-reveal="id"         그 요소를 보이게 한다 (사업자 인증 성공 뒤 사업자정보 영역).
   data-view-switch         목록 보기 전환. 안의 [data-view] 를 누르면 [data-view-pane] 중 같은 값만 보인다 (카드형 · 표).
   data-pick                큰 선택 카드. 같은 부모 안에서 누른 것만 aria-checked="true" 가 된다 (점포유형).
   data-conceal="id"        그 요소를 숨긴다. data-clear="id" 는 그 안의 입력칸을 모두 비우고 ‘기본정보와 동일’을 끈다(재인증).
   data-step-to="값"         같은 모달 안의 [data-step] 단계를 바꾼다.
   data-state-go="값"        제출 버튼이 결과 상태로 넘긴다 — 자기를 감싼 상태 범위의 전환 줄을 누른 것과 같다.
   data-dupcheck="id|mail"  칸을 벗어날 때(포커스 아웃) 형식과 중복을 확인해 칸 아래 [data-dup] 결과를 보인다.
                            data-taken 에 적은 값이 목업의 ‘이미 있는 값’이다. 값을 고치면 결과를 지운다.
   data-dupgate             안의 [data-gate=go|block] 을 모든 확인(중복 확인 + [data-agree] 필수 약관)이 통과했을 때만 go 로 바꾼다.
   data-dup-keep            수정 화면용. 원래 값 그대로면 중복 확인 결과를 띄우지 않고 통과로 본다.
   data-enable-when="id"    그 select 에 값이 있을 때만 버튼을 켠다. 고른 option 의 data-needs 칸도 채워져야 한다.
   data-sfilt               공통 점포 검색 필터. [data-sfilt-q] 검색칸, .sfilt__list 자동완성, .sfilt__chips 선택 점포.
   data-agree               약관 묶음. 전체 동의와 개별 항목을 서로 맞춘다.
   data-addr                주소 검색 묶음. [data-addr-q] 검색어, [data-addr-go] 검색 버튼, .addr__list 결과 목록,
                            [data-addr-zip]·[data-addr-base]·[data-addr-detail] 채울 칸.
   data-spick               관리 점포 고르기. data-pool="코드|점포명|유형;…" 은 고를 수 있는 점포(내 관리 범위),
                            data-picked="코드 코드" 는 처음 골라 둔 점포. 위 [data-spick-q] 자동완성에서 고르면
                            아래 [data-spick-list] 에 더하고, 줄의 × 로 하나씩, [data-spick-clear] 로 모두 뺀다.
   data-same-as="id" data-same-to="id"  ‘기본정보와 동일’ 체크. 켜면 원본 값(칸이 여럿이면 - 로 이어)을 대상 칸에
                            채우고 잠그며, 끄면 잠금만 푼다.
   data-terms="use|privacy|policy" 약관·방침 전문 팝업을 연다. 문구는 아래 TERMS 한 곳에만 두고 회원가입·강제 변경이 같이 쓴다.
                            내용은 목업용 자리 채움이다 — 실제 약관은 약관 콘텐츠(F-OFBCVL)에서 온다. */
(function () {
  "use strict";

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-pw-toggle]");
    if (t) {
      var input = t.parentNode.querySelector("input");
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      t.setAttribute("aria-pressed", String(show));
      t.setAttribute("aria-label", show ? "비밀번호 가리기" : "비밀번호 보기");
    }

    var o = e.target.closest("[data-open]");
    if (o) {
      var m = document.getElementById(o.dataset.open);
      if (m) m.hidden = false;
      e.preventDefault();
    }

    var c = e.target.closest("[data-close]");
    if (c) {
      var box = c.closest(".modal");
      if (box) box.hidden = true;
      e.preventDefault();
    }

    var cl = e.target.closest("[data-clear]");
    if (cl) {
      cl.dataset.clear.split(" ").forEach(function (id) {
        var box = document.getElementById(id);
        if (!box) return;
        box.querySelectorAll("input, textarea").forEach(function (i) { i.value = ""; });
        box.querySelectorAll(".check[data-same-as]").forEach(function (c) {
          c.setAttribute("aria-checked", "false");
          var t = document.getElementById(c.dataset.sameTo);
          if (t) t.readOnly = false;
        });
      });
    }

    /* 목록 보기 전환 — 누른 보기의 [data-view-pane] 만 보이고, 고른 값은 브라우저에 기억한다. */
    var vw = e.target.closest("[data-view-switch] [data-view]");
    if (vw) setView(vw.dataset.view, true);

    /* 큰 선택 카드 — 같은 무리 안에서 누른 것 하나만 고른 상태가 된다. */
    var pk = e.target.closest("[data-pick]");
    if (pk) {
      pk.parentNode.querySelectorAll("[data-pick]").forEach(function (o) {
        o.setAttribute("aria-checked", String(o === pk));
      });
    }

    var cc = e.target.closest("[data-conceal]");
    if (cc) {
      cc.dataset.conceal.split(" ").forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.hidden = true;
      });
    }

    var r = e.target.closest("[data-reveal]");
    if (r) {
      r.dataset.reveal.split(" ").forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.hidden = false;
      });
    }

    var g = e.target.closest("[data-state-go]");
    if (g) {
      document.querySelectorAll("[data-demo]").forEach(function (bar) {
        var scope = document.getElementById(bar.dataset.demo);
        if (scope && scope.contains(g)) {
          var b = bar.querySelector('[data-state="' + g.dataset.stateGo + '"]');
          if (b) b.click();
        }
      });
    }

    var s = e.target.closest("[data-step-to]");
    if (s) {
      var scope = s.closest(".modal") || document;
      scope.querySelectorAll("[data-step]").forEach(function (p) {
        p.hidden = p.dataset.step !== s.dataset.stepTo;
      });
      e.preventDefault();
    }
  });

  /* 닫을 수 있는 모달만 바깥을 눌러 닫는다. 닫기 항목이 없는 모달(강제 변경)은 그대로 둔다. */
  document.addEventListener("click", function (e) {
    if (!e.target.classList || !e.target.classList.contains("modal")) return;
    if (e.target.querySelector("[data-close]")) e.target.hidden = true;
  });

  /* ---------- 아이디·이메일 중복 확인 (S-RCJXIG) ---------- */
  var FORMAT = {
    id: /^(?=.*[A-Za-z])[A-Za-z0-9]{4,20}$/,
    mail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  };
  function showDup(inp, st) {
    var f = inp.closest(".field");
    inp.dataset.dupState = st;
    f.querySelectorAll("[data-dup]").forEach(function (el) { el.hidden = el.dataset.dup !== st; });
    var help = f.querySelector(".help");
    if (help) help.hidden = !!st && st !== "keep";
    if (st === "bad" || st === "fmt") inp.setAttribute("aria-invalid", "true");
    else inp.removeAttribute("aria-invalid");
    gate();
  }
  function checkDup(inp) {
    var v = inp.value.trim();
    /* data-dup-keep — 수정 화면에서 원래 값을 그대로 두면 확인 대상이 아니다(내 이메일). 결과를 띄우지 않고 통과로 본다. */
    if (inp.hasAttribute("data-dup-keep") && v === inp.defaultValue) return showDup(inp, "keep");
    if (!v) return showDup(inp, "");
    if (!FORMAT[inp.dataset.dupcheck].test(v)) return showDup(inp, "fmt");
    var taken = (inp.dataset.taken || "").toLowerCase().split(",");
    showDup(inp, taken.indexOf(v.toLowerCase()) > -1 ? "bad" : "ok");
  }
  function gate() {
    var all = [].slice.call(document.querySelectorAll("[data-dupcheck]"));
    var pass = all.length > 0 && all.every(function (i) { return i.dataset.dupState === "ok" || i.dataset.dupState === "keep"; });
    /* [data-agree] 묶음이 있으면 필수 약관도 모두 체크해야 통과 */
    document.querySelectorAll("[data-agree] .agree:not(.agree--all) .check").forEach(function (c) {
      if (c.getAttribute("aria-checked") !== "true") pass = false;
    });
    document.querySelectorAll("[data-dupgate]").forEach(function (g) {
      g.querySelectorAll("[data-gate]").forEach(function (el) {
        el.hidden = (el.dataset.gate === "go") !== pass;
      });
    });
  }
  document.addEventListener("focusout", function (e) {
    var inp = e.target.closest && e.target.closest("[data-dupcheck]");
    if (inp) checkDup(inp);
  });
  document.addEventListener("input", function (e) {
    var inp = e.target.closest && e.target.closest("[data-dupcheck]");
    if (inp && inp.dataset.dupState) showDup(inp, "");
  });
  /* 목업은 값이 채워진 채 열리므로 이미 한 번 확인한 상태로 보인다. */
  document.querySelectorAll("[data-dupcheck]").forEach(checkDup);

  /* ---------- 고른 값이 있어야 켜지는 버튼 ----------
     data-enable-when="select-id" — 그 select 에 값이 골라져 있을 때만 버튼을 켠다(회원 탈퇴 사유).
     고른 option 에 data-needs="칸id" 가 있으면 그 칸도 채워져야 켠다(직접입력 → 상세 사유 필수). */
  function syncEnable() {
    document.querySelectorAll("[data-enable-when]").forEach(function (b) {
      var sel = document.getElementById(b.dataset.enableWhen);
      var opt = sel && sel.selectedOptions[0];
      var need = opt && opt.dataset.needs && document.getElementById(opt.dataset.needs);
      b.disabled = !(sel && sel.value) || !!(need && !need.value.trim());
    });
  }
  document.addEventListener("change", syncEnable);
  document.addEventListener("input", syncEnable);
  syncEnable();

  /* ---------- 약관 전체 동의 ----------
     [data-agree] 안에서 .agree--all 을 누르면 나머지가 같이 바뀌고, 나머지가 모두 체크되면 전체 동의도 켜진다.
     app.js 가 체크 상태를 먼저 뒤집으므로 바뀐 뒤에 읽는다. */
  function syncAgree(e) {
    if (e.type === "keydown" && e.key !== " " && e.key !== "Enter") return;
    var c = e.target.closest && e.target.closest("[data-agree] .check");
    if (!c) return;
    setTimeout(function () {
      var box = c.closest("[data-agree]");
      var all = box.querySelector(".agree--all .check");
      var items = [].slice.call(box.querySelectorAll(".agree:not(.agree--all) .check"));
      if (c === all) {
        var on = all.getAttribute("aria-checked");
        items.forEach(function (i) { i.setAttribute("aria-checked", on); });
      } else if (all) {
        all.setAttribute("aria-checked", String(items.every(function (i) { return i.getAttribute("aria-checked") === "true"; })));
      }
      gate();
    }, 0);
  }
  document.addEventListener("click", syncAgree);
  document.addEventListener("keydown", syncAgree);

  /* ---------- 기본정보와 동일 ---------- */
  function valueOf(id) {
    var el = document.getElementById(id);
    if (!el) return "";
    if (el.tagName === "INPUT") return el.value.trim();
    return [].slice.call(el.querySelectorAll("input")).map(function (i) { return i.value.trim(); }).filter(Boolean).join("-");
  }
  /* 체크 상태는 app.js 가 뒤집는데, 그 처리기는 이 파일보다 늦게 붙는다. 한 틱 뒤에 읽는다. */
  document.addEventListener("click", function (e) {
    var c = e.target.closest(".check[data-same-as]");
    if (!c) return;
    e.preventDefault(); /* 라벨 안에 있어 입력칸으로 초점이 옮겨 가지 않게 */
    setTimeout(function () {
      var to = document.getElementById(c.dataset.sameTo);
      if (!to) return;
      var on = c.getAttribute("aria-checked") === "true";
      if (on) to.value = valueOf(c.dataset.sameAs);
      to.readOnly = on;
    }, 0);
  });

  /* ---------- 약관 전문 팝업 ---------- */
  var TERMS = {
    use: {
      title: "웨일ERP 이용약관",
      ver: "v1.0 · 2026-09-01 시행",
      body: [
        ["제1조 (목적)", "이 약관은 주식회사 인터플러그(이하 “회사”)가 제공하는 웨일ERP 서비스(이하 “서비스”)의 이용과 관련하여 회사와 회원의 권리, 의무 및 책임사항을 정하는 것을 목적으로 합니다."],
        ["제2조 (정의)", ["“회원”이란 이 약관에 동의하고 서비스 이용 계약을 체결한 사업자와 그 사업자가 등록한 관리자를 말합니다.", "“BP”란 서비스에 가입한 사업자 단위를 말하며, 하나의 BP 는 여러 점포를 둘 수 있습니다.", "“계정”이란 회원이 서비스에 로그인하기 위해 사용하는 아이디와 비밀번호의 조합을 말합니다."]],
        ["제3조 (약관의 효력과 변경)", "회사는 관련 법령을 위반하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 내용은 시행일 7일 전부터 서비스 화면에 공지합니다. 회원에게 불리한 변경은 30일 전부터 공지합니다."],
        ["제4조 (이용 계약의 성립)", "이용 계약은 가입을 신청한 자가 이 약관과 개인정보 수집·이용에 동의하고 회사가 이를 승낙함으로써 성립합니다. 플랫폼이 등록한 계정은 최초 로그인 시 본인이 동의함으로써 성립합니다."],
        ["제5조 (회원의 의무)", ["회원은 계정 정보를 제3자에게 알리거나 빌려주어서는 안 됩니다.", "회원은 등록한 정보가 바뀐 경우 지체 없이 수정해야 합니다.", "회원은 서비스를 이용해 법령이나 이 약관이 금지하는 행위를 해서는 안 됩니다."]],
        ["제6조 (서비스의 중단)", "회사는 설비 점검, 교체, 장애 등 부득이한 사유가 있으면 서비스 제공을 일시적으로 중단할 수 있으며, 미리 공지할 수 없는 경우에는 사후에 알립니다."],
        ["제7조 (계약 해지)", "BP 마스터는 언제든지 MY PAGE 의 회원 탈퇴로 이용 계약을 해지할 수 있습니다. 탈퇴 후 데이터의 보존과 삭제는 회사의 보존 정책을 따릅니다."],
        ["부칙", "이 약관은 2026년 9월 1일부터 시행합니다."]
      ]
    },
    privacy: {
      title: "개인정보 수집·이용 동의",
      ver: "v1.0 · 2026-09-01 시행",
      body: [
        ["1. 수집하는 항목", ["필수: 아이디, 비밀번호, 이름, 휴대전화번호, 이메일, 상호명", "사업자정보 인증 시: 사업자등록번호, 대표자명, 개업일자", "선택: 대표자 연락처, 대표자 이메일, 사업장 주소, 업태, 종목"]],
        ["2. 수집·이용 목적", ["회원 식별과 로그인, 계정 찾기와 임시 비밀번호 발송", "서비스 제공에 필요한 안내 메일 발송", "부정 이용 방지와 보안 감사"]],
        ["3. 보유·이용 기간", "회원 탈퇴 시까지 보유합니다. 다만 관계 법령이 정한 기간 동안 보존해야 하는 정보와 회사의 보안 이력 보존 정책이 정한 기록은 그 기간까지 보관한 뒤 파기합니다."],
        ["4. 동의를 거부할 권리", "필수 항목의 수집·이용에 동의하지 않을 수 있습니다. 다만 동의하지 않으면 서비스에 가입하거나 이용할 수 없습니다."],
        ["5. 문의", "개인정보 관련 문의는 privacy@whale-erp.example 로 보내 주세요."]
      ]
    },
    policy: {
      title: "개인정보처리방침",
      ver: "v1.0 · 2026-09-01 시행",
      body: [
        ["총칙", "주식회사 인터플러그(이하 “회사”)는 웨일ERP 이용자의 개인정보를 소중히 다루며, 개인정보 보호법 등 관련 법령을 지킵니다. 이 방침은 회사가 어떤 개인정보를 왜 수집하고 어떻게 보호하는지 알려 드립니다."],
        ["1. 처리하는 개인정보 항목", ["회원 가입: 아이디, 비밀번호, 이름, 휴대전화번호, 이메일, 상호명", "사업자정보 인증: 사업자등록번호, 대표자명, 개업일자", "서비스 이용 중 자동 생성: 접속 일시, 접속 IP, 로그인 기록, 쿠키"]],
        ["2. 처리 목적", ["회원 관리와 본인 확인, 계정 찾기", "서비스 제공과 운영 안내", "보안 사고 예방과 부정 이용 방지"]],
        ["3. 보유 및 파기", "개인정보는 수집·이용 목적을 이루면 지체 없이 파기합니다. 탈퇴한 회원의 이름·연락처·이메일은 탈퇴 즉시 삭제하며, 법령이 보존을 요구하는 거래 기록은 정해진 기간 동안 분리 보관한 뒤 복구할 수 없는 방법으로 파기합니다."],
        ["4. 제3자 제공", "회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 따른 요청이 있는 경우는 예외로 합니다."],
        ["5. 처리 위탁", ["메일 발송: 발송 대행 업체(선정 예정)", "사업자정보 진위확인: 국세청 사업자등록정보 진위확인 API"]],
        ["6. 이용자의 권리", "이용자는 언제든지 자신의 개인정보를 조회·수정하거나 처리 정지와 삭제를 요청할 수 있습니다. MY PAGE 에서 직접 처리하거나 아래 담당자에게 요청해 주세요."],
        ["7. 안전성 확보 조치", ["비밀번호는 복호화할 수 없는 방식으로 암호화해 저장합니다.", "개인정보를 다루는 인원을 최소한으로 제한하고 접근 기록을 보관합니다."]],
        ["8. 개인정보 보호책임자", "책임자: 홍길동 (개인정보보호팀) · privacy@whale-erp.example · 02-0000-0000"],
        ["부칙", "이 방침은 2026년 9월 1일부터 적용합니다."]
      ]
    }
  };

  function termsHTML(key) {
    var t = TERMS[key];
    var body = t.body.map(function (sec) {
      var content = Array.isArray(sec[1])
        ? "<ol>" + sec[1].map(function (li) { return "<li>" + li + "</li>"; }).join("") + "</ol>"
        : "<p>" + sec[1] + "</p>";
      return "<section><h3>" + sec[0] + "</h3>" + content + "</section>";
    }).join("");
    return (
      '<div class="modal__box modal__box--wide">' +
      '<div class="modal__head"><h2 class="t-h2" id="terms-t">' + t.title + "</h2>" +
      '<span class="badge badge--quiet">' + t.ver + "</span>" +
      '<button class="iconbtn" type="button" data-close aria-label="닫기">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="modal__body"><div class="modal__scroll"><div class="terms">' + body + "</div></div></div>" +
      '<div class="modal__foot"><button class="btn btn--primary" type="button" data-close>확인</button></div>' +
      "</div>"
    );
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-terms]");
    if (!link || !TERMS[link.dataset.terms]) return;
    e.preventDefault();
    /* 화면 틀 안에서 연다 — 왼쪽 메뉴는 계속 누를 수 있다. 틀이 없으면 문서 전체에 띄운다. */
    var host = link.closest(".screen") || document.body;
    var m = host.querySelector(":scope > .modal[data-terms-pop]");
    if (!m) {
      m = document.createElement("div");
      m.className = "modal" + (host === document.body ? "" : " modal--inset");
      m.setAttribute("data-terms-pop", "");
      m.setAttribute("role", "dialog");
      m.setAttribute("aria-modal", "true");
      m.setAttribute("aria-labelledby", "terms-t");
      host.appendChild(m);
    }
    m.innerHTML = termsHTML(link.dataset.terms);
    m.hidden = false;
    var ok = m.querySelector(".modal__foot .btn");
    if (ok) ok.focus();
  });

  /* Esc 로 닫을 수 있는 팝업(닫기 항목이 있는 것)만 닫는다. 강제 변경 팝업은 그대로 둔다. */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var open = [].slice.call(document.querySelectorAll(".modal:not([hidden])")).filter(function (m) {
      return m.querySelector("[data-close]");
    });
    if (open.length) open[open.length - 1].hidden = true;
  });

  /* 한 화면에 전환 줄이 둘이면(역할 · 목록 상태) data-demo-key="role" 인 줄은 [data-show-role] 을 맡는다.
     요소는 자기가 가진 data-show* 모두가 지금 상태와 맞을 때만 보인다 — 한 줄을 눌러도 다른 줄의 선택이 살아 있다. */
  function attrOf(bar) {
    return bar.dataset.demoKey ? "data-show-" + bar.dataset.demoKey : "data-show";
  }
  function refresh(scope) {
    var bars = [].slice.call(document.querySelectorAll("[data-demo]")).filter(function (b) {
      return (document.getElementById(b.dataset.demo) || document) === scope && b.dataset.current;
    });
    var sel = bars.map(function (b) { return "[" + attrOf(b) + "]"; }).join(",");
    if (!sel) return;
    scope.querySelectorAll(sel).forEach(function (el) {
      el.hidden = !bars.every(function (b) {
        var v = el.getAttribute(attrOf(b));
        if (v === null) return true;
        var keys = v.split(" ");
        return keys.indexOf("*") > -1 || keys.indexOf(b.dataset.current) > -1;
      });
    });
  }
  function applyState(bar, state) {
    bar.dataset.current = state;
    bar.querySelectorAll("[data-state]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.state === state));
    });
    refresh(document.getElementById(bar.dataset.demo) || document);
  }

  document.querySelectorAll("[data-demo]").forEach(function (bar) {
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-state]");
      if (b) applyState(bar, b.dataset.state);
    });
    var first = bar.querySelector('[aria-pressed="true"]') || bar.querySelector("[data-state]");
    if (first) applyState(bar, first.dataset.state);
  });

  /* ?role=값 — 화면 팝업이 목록의 목업 권한을 넘긴다 */
  var wantRole = new URLSearchParams(location.search).get("role");
  if (wantRole) {
    var rb = document.querySelector('[data-demo][data-demo-key="role"] [data-state="' + wantRole + '"]');
    if (rb) rb.click();
  }
  var want = new URLSearchParams(location.search).get("state");
  if (want) {
    var btn = document.querySelector('[data-demo] [data-state="' + want + '"]');
    if (btn) btn.click();
  }

  var VIEW_KEY = "whale-mockup-view:" + location.pathname;
  function setView(v, save) {
    var sw = document.querySelector("[data-view-switch]");
    if (!sw) return;
    sw.querySelectorAll("[data-view]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.view === v));
    });
    document.querySelectorAll("[data-view-pane]").forEach(function (el) {
      el.classList.toggle("is-view-off", el.dataset.viewPane !== v);
    });
    if (save) { try { localStorage.setItem(VIEW_KEY, v); } catch (err) {} }
  }
  var savedView = null;
  try { savedView = localStorage.getItem(VIEW_KEY); } catch (err) {}
  var viewSw = document.querySelector("[data-view-switch]");
  if (viewSw) {
    var first = viewSw.querySelector("[data-view]").dataset.view;
    setView(savedView && viewSw.querySelector('[data-view="' + savedView + '"]') ? savedView : first, false);
  }

  /* ?bp=상호명 · 코드 — BP 상세의 소속 점포 수가 점포 목록을 그 BP 로 좁혀 연다. 검색 칸 대신 조건 띠를 보인다. */
  var bp = new URLSearchParams(location.search).get("bp");
  if (bp) {
    document.querySelectorAll("[data-bp-filter]").forEach(function (el) { el.hidden = false; });
    document.querySelectorAll("[data-bp-filter-name]").forEach(function (el) { el.textContent = bp; });
  }

  /* ---------- 주소 검색 (S-LEAAUT) ----------
     data-addr 칸 묶음. 검색어를 넣고 검색(또는 Enter)하면 주소 API 를 부른 것처럼 잠깐 기다린 뒤
     결과를 입력칸 아래 목록으로 펼친다. 하나를 고르면 [data-addr-zip]·[data-addr-base] 에 들어가고
     [data-addr-detail] 로 초점이 간다. data-addr-lat / data-addr-lng 에 칸 id 를 주면 좌표도 채운다.
     목업 규칙: 검색어에 ‘오류’가 들어가면 API 실패 문구를 보인다. */
  var ADDR = [
    ["04007", "서울 마포구 망원로 42", "서울 마포구 망원동 412-3", "", 37.556312, 126.901845],
    ["04008", "서울 마포구 망원로 42-1", "서울 마포구 망원동 412-5", "", 37.556401, 126.902017],
    ["04009", "서울 마포구 망원로 48", "서울 마포구 망원동 415-1", "망원빌딩", 37.556688, 126.902451],
    ["03991", "서울 마포구 동교로 256", "서울 마포구 연남동 239-1", "", 37.562104, 126.925631],
    ["03992", "서울 마포구 동교로 262", "서울 마포구 연남동 240-7", "연남하우스", 37.562571, 126.925902],
    ["06236", "서울 강남구 테헤란로 152", "서울 강남구 역삼동 737", "강남파이낸스센터", 37.500025, 127.036508],
    ["06164", "서울 강남구 테헤란로 521", "서울 강남구 삼성동 159", "파르나스타워", 37.508453, 127.061102],
    ["13529", "경기 성남시 분당구 판교역로 166", "경기 성남시 분당구 백현동 532", "카카오판교아지트", 37.395341, 127.110284],
    ["13487", "경기 성남시 분당구 판교역로 235", "경기 성남시 분당구 삼평동 681", "에이치스퀘어", 37.400946, 127.108552],
    ["48058", "부산 해운대구 해운대해변로 264", "부산 해운대구 우동 1411-1", "", 35.160113, 129.160384],
    ["61475", "광주 동구 금남로 245", "광주 동구 금남로1가 1-1", "", 35.149441, 126.919813],
  ];
  function norm(t) { return String(t || "").replace(/\s+/g, "").toLowerCase(); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  document.querySelectorAll("[data-addr]").forEach(function (box, n) {
    var q = box.querySelector("[data-addr-q]");
    var go = box.querySelector("[data-addr-go]");
    var list = box.querySelector(".addr__list");
    if (!q || !list) return;
    list.id = list.id || "addr-list-" + n;
    q.setAttribute("aria-controls", list.id);
    var found = [], at = -1, timer = 0;

    function close() {
      clearTimeout(timer);
      list.hidden = true;
      list.innerHTML = "";
      q.setAttribute("aria-expanded", "false");
      q.removeAttribute("aria-activedescendant");
      found = []; at = -1;
    }
    function note(text, cls) {
      list.innerHTML = '<div class="addr__note' + (cls ? " " + cls : "") + '">' + text + "</div>";
      list.hidden = false;
      q.setAttribute("aria-expanded", "true");
    }
    function mark(i) {
      at = i;
      [].forEach.call(list.querySelectorAll(".addr__opt"), function (o, k) {
        o.setAttribute("aria-selected", String(k === i));
        if (k === i) { o.scrollIntoView({ block: "nearest" }); q.setAttribute("aria-activedescendant", o.id); }
      });
    }
    function pick(i) {
      var a = found[i];
      if (!a) return;
      var set = function (el, v) { if (typeof el === "string") el = document.getElementById(el); if (el) el.value = v; };
      set(box.querySelector("[data-addr-zip]"), a[0]);
      set(box.querySelector("[data-addr-base]"), a[1] + (a[3] ? " (" + a[3] + ")" : ""));
      if (box.dataset.addrLat) set(box.dataset.addrLat, a[4].toFixed(6));
      if (box.dataset.addrLng) set(box.dataset.addrLng, a[5].toFixed(6));
      close();
      q.value = "";
      var d = box.querySelector("[data-addr-detail]");
      if (d) { d.value = ""; d.focus(); }
    }
    function search() {
      clearTimeout(timer);
      var t = norm(q.value);
      found = []; at = -1;
      if (t.length < 2) { note("검색어를 두 글자 이상 입력해 주세요."); return; }
      note('<span class="addr__spin" aria-hidden="true"></span>주소를 찾는 중입니다…');
      timer = setTimeout(function () {
        if (t.indexOf("오류") > -1) { note("주소 검색 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.", "is-risk"); return; }
        found = ADDR.filter(function (a) { return norm(a[1] + a[2] + a[3]).indexOf(t) > -1 || norm(a[1]).indexOf(t) > -1; });
        if (!found.length) { note("검색 결과가 없습니다. 도로명·건물명·지번을 다시 확인해 주세요."); return; }
        list.innerHTML = '<div class="addr__count">검색 결과 ' + found.length + "건</div>" + found.map(function (a, i) {
          return '<div class="addr__opt" role="option" aria-selected="false" id="' + list.id + "-" + i + '" data-i="' + i + '">' +
            '<span class="addr__zip mono">' + a[0] + "</span>" +
            '<span class="addr__txt"><b>' + esc(a[1]) + (a[3] ? ' <span class="addr__bld">' + esc(a[3]) + "</span>" : "") + "</b>" +
            '<span class="addr__jibun"><span class="addr__tag">지번</span>' + esc(a[2]) + "</span></span></div>";
        }).join("");
        list.hidden = false;
        q.setAttribute("aria-expanded", "true");
        mark(0);
      }, 450);
    }

    if (go) go.addEventListener("click", search);
    q.addEventListener("keydown", function (e) {
      var open = !list.hidden && found.length;
      if (e.key === "Enter") { e.preventDefault(); if (open && at > -1) pick(at); else search(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (list.hidden) search(); else if (open) mark(Math.min(at + 1, found.length - 1)); }
      else if (e.key === "ArrowUp" && open) { e.preventDefault(); mark(Math.max(at - 1, 0)); }
      else if (e.key === "Escape" && !list.hidden) { e.preventDefault(); close(); }
    });
    q.addEventListener("input", function () { if (!list.hidden) close(); });
    list.addEventListener("mousedown", function (e) { e.preventDefault(); }); /* 고르기 전에 입력칸 초점이 빠지지 않게 */
    list.addEventListener("click", function (e) {
      var o = e.target.closest(".addr__opt");
      if (o) pick(+o.dataset.i);
    });
    list.addEventListener("mousemove", function (e) {
      var o = e.target.closest(".addr__opt");
      if (o && +o.dataset.i !== at) mark(+o.dataset.i);
    });
    document.addEventListener("click", function (e) { if (!box.contains(e.target)) close(); });
  });

  /* ---------- 관리 점포 고르기 ----------
     찾는 곳(위 자동완성)과 고른 곳(아래, 옆으로 나열)을 나눈다. 입력칸에 초점이 가면 아직 고르지 않은 점포가 셀렉트처럼 펼쳐지고,
     글자를 넣으면 점포명·점포코드로 좁힌다. 고른 점포는 후보에서 빠지고 선택한 점포 맨 앞에 붙는다. */
  document.querySelectorAll("[data-spick]").forEach(function (box, n) {
    var q = box.querySelector("[data-spick-q]");
    var list = box.querySelector(".spick__list");
    var out = box.querySelector("[data-spick-list]");
    var empty = box.querySelector("[data-spick-empty]");
    var count = box.querySelector("[data-spick-count]");
    var clear = box.querySelector("[data-spick-clear]");
    if (!q || !list || !out) return;
    var pool = (box.dataset.pool || "").split(";").filter(Boolean).map(function (t) { var a = t.split("|"); return { code: a[0], name: a[1], type: a[2] || "" }; });
    var picked = (box.dataset.picked || "").split(/\s+/).filter(Boolean);
    var added = {};
    var found = [], at = -1;
    list.id = list.id || "spick-list-" + n;
    q.setAttribute("aria-controls", list.id);
    function byCode(c) { for (var i = 0; i < pool.length; i++) if (pool[i].code === c) return pool[i]; }
    function hi(text, t) {
      if (!t) return esc(text);
      var i = text.toLowerCase().indexOf(t);
      return i < 0 ? esc(text) : esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + t.length)) + "</mark>" + esc(text.slice(i + t.length));
    }
    function draw() {
      out.innerHTML = picked.map(function (c) {
        var s = byCode(c); if (!s) return "";
        return '<li class="spick__item" data-code="' + c + '"><span class="k">' + esc(s.name) + '</span><span class="mono spick__code">' + c + "</span>" +
          (added[c] ? '<span class="badge badge--info">추가</span>' : "") + '<span class="spick__type">' + esc(s.type) + "</span>" +
          '<button class="spick__rm" type="button" aria-label="' + esc(s.name) + ' 빼기" title="빼기"><svg width="14" height="14" aria-hidden="true"><use href="#i-x"/></svg></button></li>';
      }).join("");
      if (empty) empty.hidden = picked.length > 0;
      out.hidden = !picked.length;
      if (count) count.textContent = picked.length + "개점";
      if (clear) clear.hidden = !picked.length;
    }
    function close() { list.hidden = true; list.innerHTML = ""; q.setAttribute("aria-expanded", "false"); q.removeAttribute("aria-activedescendant"); found = []; at = -1; }
    function mark(i) {
      at = i;
      [].forEach.call(list.querySelectorAll(".spick__opt"), function (o, k) {
        o.setAttribute("aria-selected", String(k === i));
        if (k === i) { o.scrollIntoView({ block: "nearest" }); q.setAttribute("aria-activedescendant", o.id); }
      });
    }
    function open() {
      var t = q.value.trim().toLowerCase();
      found = pool.filter(function (s) { return picked.indexOf(s.code) < 0 && (!t || (s.name + " " + s.code).toLowerCase().indexOf(t) > -1); });
      var left = pool.length - picked.length;
      if (!found.length) {
        list.innerHTML = '<div class="addr__note">' + (left ? "‘" + esc(q.value.trim()) + "’에 맞는 점포가 없습니다. 내 관리 점포 안에서만 찾습니다." : "고를 수 있는 점포를 모두 골랐습니다.") + "</div>";
      } else {
        list.innerHTML = '<div class="addr__count">' + (t ? "맞는 점포 " + found.length + "곳" : "고를 수 있는 점포 " + found.length + "곳") + "</div>" + found.map(function (s, i) {
          return '<div class="spick__opt" role="option" aria-selected="false" id="' + list.id + "-" + i + '" data-i="' + i + '"><span>' + hi(s.name, t) + '</span><span class="mono spick__code">' + hi(s.code, t) + '</span><span class="spick__type">' + esc(s.type) + "</span></div>";
        }).join("");
      }
      list.hidden = false;
      q.setAttribute("aria-expanded", "true");
      if (found.length) mark(0);
    }
    function add(i) {
      var s = found[i]; if (!s) return;
      picked.unshift(s.code); added[s.code] = 1;
      q.value = ""; draw(); open();
    }
    q.addEventListener("focus", open);
    q.addEventListener("click", function () { if (list.hidden) open(); });
    q.addEventListener("input", open);
    q.addEventListener("keydown", function (e) {
      var on = !list.hidden && found.length;
      if (e.key === "Enter") { e.preventDefault(); if (on && at > -1) add(at); }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (list.hidden) open(); else if (on) mark(Math.min(at + 1, found.length - 1)); }
      else if (e.key === "ArrowUp" && on) { e.preventDefault(); mark(Math.max(at - 1, 0)); }
      else if (e.key === "Escape" && !list.hidden) { e.preventDefault(); close(); }
      else if (e.key === "Tab") close();
    });
    list.addEventListener("mousedown", function (e) { e.preventDefault(); });
    list.addEventListener("click", function (e) { var o = e.target.closest(".spick__opt"); if (o) add(+o.dataset.i); });
    list.addEventListener("mousemove", function (e) { var o = e.target.closest(".spick__opt"); if (o && +o.dataset.i !== at) mark(+o.dataset.i); });
    out.addEventListener("click", function (e) {
      var b = e.target.closest(".spick__rm"); if (!b) return;
      var li = b.closest("[data-code]"), c = li.dataset.code;
      var next = li.nextElementSibling || li.previousElementSibling;
      picked = picked.filter(function (x) { return x !== c; }); delete added[c];
      var nc = next && next.dataset.code;
      draw();
      var f = nc && out.querySelector('[data-code="' + nc + '"] .spick__rm');
      (f || q).focus();
      if (!f) close();
    });
    if (clear) clear.addEventListener("click", function () { picked = []; added = {}; draw(); q.focus(); });
    document.addEventListener("click", function (e) { if (!box.querySelector(".spick__q").contains(e.target)) close(); });
    draw();
  });

  /* ---------- 공통 점포 검색 필터 (S-WDJFWH) ----------
     [data-sfilt] 묶음. 입력란을 누르면 글자 수 제한 없이 곧바로 고를 수 있는 점포 전체를 검색창 바로 아래에 펴고,
     점포코드나 점포명을 치면 그 글자로 좁힌다. 이미 고른 점포는 목록에 다시 나오지 않는다.
     목록에서 고르면 아래에 Chip 으로 쌓이고(여러 개), 검색창은 비우지 않아 이어서 고를 수 있다.
     Chip 의 X 는 그 점포만 뺀다. 고르거나 빼는 즉시 조회 조건에 들어간 것으로 본다(목업은 요약 문구만 바뀐다).
     같은 패널의 초기화를 누르면 선택을 모두 비운다. 목업 점포는 ㈜한강상회 12곳이다. */
  var SP_STORES = [
    ["ST000001", "모리커피 서초점", "일반점포"], ["ST000002", "모리커피 성수점", "일반점포"],
    ["ST000003", "온기식당 판교점", "일반점포"], ["ST000004", "온기식당 광화문점", "일반점포"],
    ["ST000005", "모리커피 을지로점", "가맹점포"], ["ST000006", "모리커피 연남점", "가맹점포"],
    ["ST000007", "모리커피 청담점", "가맹점포"], ["ST000008", "모리커피 부평점", "가맹점포"],
    ["ST000009", "온기식당 둔산점", "가맹점포"], ["ST000010", "온기식당 서면점", "가맹점포"],
    ["ST000011", "온기식당 일산점", "가맹점포"], ["ST000012", "모리커피 합정점", "가맹점포", "폐점"]
  ];

  document.querySelectorAll("[data-sfilt]").forEach(function (box, n) {
    var q = box.querySelector("[data-sfilt-q]");
    var list = box.querySelector(".sfilt__list");
    var chips = box.querySelector(".sfilt__chips");
    var sum = box.querySelector(".sfilt__sum");
    if (!q || !list || !chips) return;
    list.id = list.id || "sfilt-list-" + n;
    q.setAttribute("aria-controls", list.id);
    var picked = [], found = [], at = -1, timer = 0;

    function close() {
      clearTimeout(timer);
      list.hidden = true;
      list.innerHTML = "";
      q.setAttribute("aria-expanded", "false");
      q.removeAttribute("aria-activedescendant");
      found = []; at = -1;
    }
    function note(text) {
      list.innerHTML = '<div class="addr__note">' + text + "</div>";
      list.hidden = false;
      q.setAttribute("aria-expanded", "true");
    }
    function renderChips() {
      chips.innerHTML = picked.map(function (s) {
        return '<span class="chip" title="' + s[0] + '">' + esc(s[1]) +
          '<button type="button" class="chip__x" data-code="' + s[0] + '" aria-label="' + esc(s[1]) + ' 빼기">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></span>';
      }).join("");
      chips.hidden = !picked.length;
      if (sum) sum.textContent = picked.length ? "선택 점포 " + picked.length + "곳 · 조회 조건에 반영됨" : "선택하지 않으면 접근할 수 있는 점포 전체";
    }
    function isPicked(code) { return picked.some(function (s) { return s[0] === code; }); }
    function renderList() {
      list.innerHTML = '<div class="addr__count">' + (norm(q.value) ? "검색 결과 " : "고를 수 있는 점포 ") + found.length + "곳 · 여러 곳을 고를 수 있습니다</div>" + found.map(function (s, i) {
        return '<div class="addr__opt sfilt__opt" role="option" aria-selected="' + (i === at) + '" id="' + list.id + "-" + i + '" data-i="' + i + '">' +
          '<span class="addr__zip mono">' + s[0] + "</span>" +
          '<span class="addr__txt"><b>' + esc(s[1]) + "</b>" +
          '<span class="addr__jibun">' + s[2] + (s[3] ? " · " + s[3] : "") + "</span></span></div>";
      }).join("");
      list.hidden = false;
      q.setAttribute("aria-expanded", "true");
    }
    function mark(i) {
      at = i;
      [].forEach.call(list.querySelectorAll(".sfilt__opt"), function (o, k) {
        o.setAttribute("aria-selected", String(k === i));
        if (k === i) { o.scrollIntoView({ block: "nearest" }); q.setAttribute("aria-activedescendant", o.id); }
      });
    }
    function toggle(i) {
      var s = found[i];
      if (!s || isPicked(s[0])) return;
      picked.push(s);
      renderChips();
      search(Math.min(i, found.length - 2));
      q.focus(); /* 검색창은 그대로 두고 이어서 고른다 */
    }
    /* 글자 수 제한 없음 — 비어 있으면 고를 수 있는 점포 전체, 치면 그 글자로 좁힌다. 고른 점포는 뺀다 */
    function search(keepAt) {
      clearTimeout(timer);
      var t = norm(q.value);
      found = SP_STORES.filter(function (s) {
        return !isPicked(s[0]) && (!t || norm(s[0]).indexOf(t) > -1 || norm(s[1]).indexOf(t) > -1);
      });
      at = -1;
      if (!found.length) {
        note(t ? "검색 조건에 맞는 점포가 없습니다." : "고를 수 있는 점포를 모두 골랐습니다.");
        return;
      }
      renderList();
      mark(typeof keepAt === "number" && keepAt > -1 ? keepAt : 0);
    }

    q.addEventListener("input", function () { search(); });
    q.addEventListener("focus", function () { search(); });
    q.addEventListener("click", function () { if (list.hidden) search(); });
    q.addEventListener("keydown", function (e) {
      var open = !list.hidden && found.length;
      if (e.key === "Enter") { e.preventDefault(); if (open && at > -1) toggle(at); }
      else if (e.key === "ArrowDown" && open) { e.preventDefault(); mark(Math.min(at + 1, found.length - 1)); }
      else if (e.key === "ArrowUp" && open) { e.preventDefault(); mark(Math.max(at - 1, 0)); }
      else if (e.key === "Escape" && !list.hidden) { e.preventDefault(); close(); }
    });
    list.addEventListener("mousedown", function (e) { e.preventDefault(); });
    list.addEventListener("click", function (e) {
      var o = e.target.closest(".sfilt__opt");
      if (o) toggle(+o.dataset.i);
    });
    chips.addEventListener("click", function (e) {
      var x = e.target.closest(".chip__x");
      if (!x) return;
      picked = picked.filter(function (p) { return p[0] !== x.dataset.code; });
      renderChips();
      if (!list.hidden) search();
    });
    document.addEventListener("click", function (e) {
      /* 고르면 목록을 다시 그려 누른 줄이 문서에서 빠진다 — 그런 클릭은 바깥 클릭으로 보지 않는다 */
      if (e.target.isConnected && !box.contains(e.target)) close();
      /* 같은 검색 패널의 초기화 — 선택 점포와 검색어를 비운다 */
      var reset = e.target.closest && e.target.closest("[data-sfilt-reset], [data-state-go='base']");
      var panel = box.closest(".panel");
      if (reset && panel && panel.contains(reset)) { picked = []; q.value = ""; renderChips(); close(); }
    });
    renderChips();
  });
})();
