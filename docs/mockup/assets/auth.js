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
   data-agree               약관 묶음. 전체 동의와 개별 항목을 서로 맞춘다. [data-opt] 줄은 선택 약관이라 가입 조건에서 뺀다.
   data-terms-doc="키"       약관 전문 화면에 TERMS 문구를 펼친다.
   data-addr                주소 검색 묶음. [data-addr-q] 검색어, [data-addr-go] 검색 버튼, .addr__list 결과 목록,
                            [data-addr-zip]·[data-addr-base]·[data-addr-detail] 채울 칸.
   data-spick               관리 점포 고르기. data-pool="코드|점포명|유형;…" 은 고를 수 있는 점포(내 관리 범위),
                            data-picked="코드 코드" 는 처음 골라 둔 점포. 넷째 칸(코드|점포명|유형|사유)이 있으면
                            후보에 흐리게 보이되 고를 수 없다(예: 다른 가맹 마스터가 맡은 점포 — ‘ongifm 담당’).
                            위 [data-spick-q] 자동완성에서 고르면
                            아래 [data-spick-list] 에 더하고, 줄의 × 로 하나씩, [data-spick-clear] 로 모두 뺀다.
   data-same-as="id" data-same-to="id"  ‘기본정보와 동일’ 체크. 켜면 원본 값(칸이 여럿이면 - 로 이어)을 대상 칸에
                            채우고 잠그며, 끄면 잠금만 푼다.
   data-terms="use|privacy|marketing|location|policy" 약관·방침 전문 팝업을 연다. 문구는 아래 TERMS 한 곳에만 두고
                            회원가입·강제 변경·약관 전문 화면이 같이 쓴다.
                            use·privacy 는 가입 화면에서, marketing·location 은 직원 근무 앱에서 받는다.
                            use·privacy·marketing 은 타사 비교 표준안 초안(docs/raw/2026-09-29-약관3종-표준안.md), location 은 출퇴근 설계(GPS 판정, 좌표 미저장)로 쓴 초안이다.
                            법무 검토 전이며 실제 약관은 약관 콘텐츠(F-OFBCVL)에서 온다. [ ] 는 회사가 채울 값이다. */
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
    /* [data-agree] 묶음이 있으면 필수 약관도 모두 체크해야 통과. 선택 약관([data-opt])은 보지 않는다. */
    document.querySelectorAll("[data-agree] .agree:not(.agree--all):not([data-opt]) .check").forEach(function (c) {
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
      title: "웨일ERP 서비스 이용약관",
      ver: "v0.7 · 시행일 미정 (초안)",
      body: [
        ["제1조 (목적)", "이 약관은 주식회사 인터플러그(이하 “회사”)가 제공하는 웨일ERP 서비스(이하 “서비스”)의 이용과 관련하여 회사와 회원 사이의 권리, 의무 및 책임사항과 그 밖에 필요한 사항을 정합니다."],
        ["제2조 (정의)", ["“서비스”란 회사가 클라우드 방식으로 제공하는 점포·직원·근태·급여 관리 등 웨일ERP 의 모든 기능을 말합니다.", "“회원”이란 이 약관에 동의하고 회사와 이용계약을 체결한 사업자를 말합니다.", "“BP”란 서비스에서 회원을 식별하는 사업자 단위를 말하며, 하나의 BP 는 여러 점포를 둘 수 있습니다.", "“BP 마스터”란 BP 를 대표하여 이용계약을 체결하고 BP 안의 권한을 관리하는 계정을 말합니다.", "“이용자”란 회원이 서비스에 등록하여 이용하게 한 관리자와 직원을 말합니다.", "“계정”이란 이용자를 식별하기 위한 아이디와 비밀번호의 조합을 말합니다.", "“회원 데이터”란 회원과 이용자가 서비스에 입력하거나 서비스 이용 중 생성한 모든 정보를 말합니다."]],
        ["제3조 (약관의 게시와 개정)", ["회사는 이 약관을 서비스 초기 화면과 홈페이지에 게시합니다.", "회사는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며, 적용일 7일 전부터 공지합니다. 회원에게 불리한 개정은 적용일 30일 전부터 공지하고 등록된 이메일로 따로 알립니다.", "회원이 적용일까지 거부 의사를 밝히지 않으면 개정 약관에 동의한 것으로 봅니다. 동의하지 않는 회원은 이용계약을 해지할 수 있습니다."]],
        ["제4조 (이용계약의 성립)", ["이용계약은 가입 신청자가 이 약관과 개인정보 수집·이용에 동의하고 가입을 신청한 뒤 회사가 승낙하면 성립합니다.", "회사나 회원이 대신 등록한 계정은 이용자가 최초 로그인 때 이 약관에 동의하면 그 이용자에게 효력이 생깁니다.", "회사는 타인의 명의나 허위 정보로 신청한 경우, 이전에 이 약관 위반으로 계약이 해지된 경우, 그 밖에 관련 법령을 위반한 경우 승낙하지 않거나 사후에 이용계약을 해지할 수 있습니다."]],
        ["제5조 (회원 정보의 변경)", "회원은 등록한 정보가 바뀌면 지체 없이 서비스에서 수정해야 합니다. 수정하지 않아 생긴 불이익은 회원이 부담합니다."],
        ["제6조 (회사의 의무)", ["회사는 관련 법령과 이 약관이 금지하는 행위를 하지 않으며, 서비스를 안정적으로 제공하기 위해 노력합니다.", "회사는 회원 데이터를 보호하기 위해 보안 체계를 갖추고, 개인정보처리방침을 공개하고 지킵니다.", "회사는 회원의 정당한 의견이나 불만을 신속히 처리하고 처리 결과를 알립니다."]],
        ["제7조 (회원과 이용자의 의무)", ["회원과 이용자는 계정을 제3자에게 알리거나 빌려주어서는 안 되며, 계정 관리 소홀로 생긴 책임을 집니다.", "회원은 서비스에 직원 등 제3자의 개인정보를 입력할 때 관련 법령에 따른 동의나 법적 근거를 스스로 갖추어야 합니다.", "회원과 이용자는 허위 정보 등록, 서비스의 역설계·무단 복제, 서비스 운영 방해, 타인의 권리 침해, 그 밖에 법령에 어긋나는 행위를 해서는 안 됩니다."]],
        ["제8조 (서비스의 제공과 변경)", ["회사는 연중무휴 1일 24시간 서비스를 제공하는 것을 원칙으로 합니다.", "회사는 서비스의 내용을 바꿀 수 있으며, 회원에게 중대한 영향을 주는 변경은 7일 전에 공지합니다."]],
        ["제9조 (서비스의 중단)", ["회사는 설비 점검·교체·장애, 통신 두절, 천재지변 등 부득이한 사유가 있으면 서비스를 일시 중단할 수 있습니다.", "계획된 중단은 미리 공지하고, 미리 알릴 수 없는 경우에는 사후에 알립니다."]],
        ["제10조 (이용 요금)", ["서비스의 요금과 결제 방법은 홈페이지의 요금 안내에 따릅니다. [요금 체계·결제 방식은 아직 확정 전이며, 부가서비스 구독·정산 기능도 1차 범위에 포함되지 않습니다.]", "회사가 무료로 제공하던 서비스를 유료로 바꾸는 경우 적용일 30일 전에 공지하고 개별 통지합니다. 회원은 유료 전환에 동의하지 않으면 이용계약을 해지할 수 있습니다."]],
        ["제11조 (이용 제한)", ["회사는 회원이나 이용자가 제7조를 위반하면 경고, 일시 정지, 이용계약 해지의 순서로 이용을 제한할 수 있습니다.", "명백한 불법 행위나 보안 위협이 있는 경우에는 즉시 제한할 수 있습니다.", "회사는 제한 사유와 기간을 알리고, 회원은 이의를 제기할 수 있습니다."]],
        ["제12조 (계약 해지)", ["BP 마스터는 언제든지 MY PAGE 의 회원 탈퇴로 이용계약을 해지할 수 있습니다.", "회사는 제4조 제3항이나 제11조에 해당하면 이용계약을 해지할 수 있습니다."]],
        ["제13조 (회원 데이터의 소유와 처리)", ["회원 데이터의 권리는 회원에게 있습니다.", "회원 데이터 가운데 개인정보에 대해서는 회원이 개인정보처리자이고, 회사는 회원의 위탁을 받아 서비스 제공에 필요한 범위에서만 처리하는 수탁자입니다. 세부 사항은 개인정보 처리위탁 계약에 따릅니다.", "회사는 개인을 알아볼 수 없도록 가공한 통계 정보를 서비스 개선에 쓸 수 있습니다.", "이용계약이 끝나면 회원은 [30]일 동안 회원 데이터를 내려받을 수 있으며, 회사는 그 기간이 지나면 회원 데이터를 파기합니다. 다만 법령이 보존을 요구하는 정보는 정해진 기간 동안 분리 보관합니다."]],
        ["제14조 (개인정보 처리위탁)", ["회원이 서비스에 등록한 이용자(직원 등)의 개인정보에 대하여, 회사는 회원의 위탁을 받아 근태·근무스케줄·급여명세서 등 인사 정보의 저장·관리를 포함한 서비스 제공에 필요한 범위의 업무를 처리합니다.", "회사는 위탁받은 업무의 범위를 넘어 개인정보를 이용하거나 제3자에게 제공하지 않습니다.", "회사는 위탁받은 업무를 제3자에게 재위탁하지 않습니다. 다만 클라우드 인프라 등 서비스 운영에 반드시 필요한 처리를 위해 재위탁하는 경우에는 개인정보처리방침에 그 사실을 알립니다.", "회사는 위탁받은 개인정보를 안전하게 처리하기 위해 접근 권한 제한, 암호화, 접속 기록 보관 등 안전성 확보조치를 취합니다.", "회사가 위탁받은 업무를 처리하는 과정에서 고의 또는 과실로 개인정보를 분실·도난·유출·위조·변조 또는 훼손한 경우 회원과 이용자에게 생긴 손해를 배상하며, 배상 범위는 제17조를 따릅니다.", "회원과 회사가 개인정보 처리위탁에 관해 별도로 계약을 체결한 경우에는 그 계약을 우선합니다."]],
        ["제15조 (개인정보 보호)", "회사는 관련 법령과 개인정보처리방침에 따라 이용자의 개인정보를 보호합니다."],
        ["제16조 (지식재산권)", "서비스와 관련된 소프트웨어, 디자인, 상표 등 지식재산권은 회사에 있습니다. 회원은 이 약관이 허용한 범위에서만 서비스를 이용할 수 있습니다."],
        ["제17조 (손해배상)", ["회사나 회원이 이 약관을 위반하여 상대방에게 손해를 입히면 그 손해를 배상합니다.", "회사의 고의나 중대한 과실로 인한 손해가 아니면, 회사의 배상액은 손해가 발생하기 전 [12]개월 동안 회원이 낸 이용 요금 합계를 넘지 않습니다."]],
        ["제18조 (면책)", ["회사는 다음 사유로 생긴 손해에 대해서는 책임지지 않습니다. 다만 회사에 고의나 중대한 과실이 있으면 그렇지 않습니다.", "천재지변이나 이에 준하는 불가항력", "회원이나 이용자의 귀책사유로 인한 이용 장애", "회원이 입력한 정보의 오류", "제3자가 제공하는 서비스(국세청 사업자등록정보 진위확인 등)의 장애", "회원 사이, 회원과 이용자 사이의 분쟁"]],
        ["제19조 (통지)", ["회사는 회원이 등록한 이메일과 서비스 안 알림으로 회원에게 통지합니다. 회원에게 가는 통지는 1차 범위에서 문자메시지를 쓰지 않습니다.", "전체 회원에 대한 통지는 서비스 공지사항에 7일 이상 게시하는 것으로 갈음할 수 있습니다."]],
        ["제20조 (양도 금지)", "회원은 이용계약상의 지위나 권리·의무를 회사의 동의 없이 제3자에게 양도하거나 담보로 제공할 수 없습니다."],
        ["제21조 (분리 가능성)", "이 약관의 일부가 무효가 되어도 나머지 조항은 효력을 유지합니다."],
        ["제22조 (준거법과 관할)", "이 약관은 대한민국 법률에 따르며, 분쟁에 관한 소송은 민사소송법에 따른 관할 법원에 제기합니다."],
        ["제23조 (문의)", "서비스 문의: [고객센터 이메일] · [전화번호]"],
        ["부칙", "이 약관은 [2026년 0월 0일]부터 시행합니다."]
      ]
    },
    useStaff: {
      title: "웨일ERP 직원 근무 앱 이용약관",
      ver: "v0.8 · 시행일 미정 (수정 초안) · 직원 근무 앱",
      body: [
        ["제1조 (목적)", "이 약관은 주식회사 인터플러그(이하 “회사”)가 제공하는 웨일ERP 직원 근무 앱(이하 “근무 앱”)의 이용과 관련하여 회사와 직원 사이의 권리, 의무 및 책임사항과 그 밖에 필요한 사항을 정합니다."],
        ["제2조 (정의)", ["“근무 앱”이란 회사가 제공하는 웨일ERP 서비스 중 직원이 출퇴근 기록, 근무스케줄, 할 일(TO-DO), 급여명세서 등을 확인하거나 관리할 수 있는 모바일 애플리케이션을 말합니다.", "“소속 사업장”이란 웨일ERP를 이용하는 사업자 회원(BP) 중 직원이 근로계약을 맺고 소속되어 있는 사업장을 말합니다.", "“직원”이란 소속 사업장의 초대를 받아 근무 앱에 가입한 이용자를 말하며, 소속이 종료된 후 계정을 유지하는 이용자를 포함합니다.", "“계정”이란 직원이 근무 앱을 이용하기 위해 등록한 식별정보와 인증정보 등을 말합니다.", "“직원 데이터”란 직원 또는 소속 사업장이 근무 앱에 입력하거나 근무 앱 이용 과정에서 생성되는 직원 관련 정보를 말합니다.", "“소속 사업장 관리자”란 소속 사업장으로부터 직원의 소속 및 이용 권한 등을 관리할 권한을 부여받은 사람을 말합니다."]],
        ["제3조 (약관의 게시와 개정)", ["회사는 직원이 이 약관을 쉽게 확인할 수 있도록 근무 앱의 가입 화면 및 설정 화면 등에 게시합니다.", "회사는 관련 법령을 위반하지 않는 범위에서 이 약관을 개정할 수 있습니다.", "회사는 약관을 개정하는 경우 개정 내용, 개정 사유 및 적용일을 명시하여 적용일 7일 전부터 공지합니다. 직원에게 불리하거나 직원의 권리·의무에 중대한 영향을 미치는 개정은 적용일 30일 전부터 공지하고, 제14조에 따른 방법으로 개별 통지합니다.", "회사가 개정 약관을 알리면서 적용일까지 거부 의사를 표시하지 않으면 동의한 것으로 본다는 뜻과 거부 방법을 명확하게 개별 통지한 경우, 직원이 해당 기간 내에 거부 의사를 표시하지 않으면 개정 약관에 동의한 것으로 봅니다. 다만, 관련 법령에 따라 명시적인 동의가 필요한 경우에는 별도로 동의를 받습니다.", "직원은 개정 약관에 동의하지 않는 경우 적용일 전까지 회사에 거부 의사를 표시하거나 이용계약을 해지할 수 있습니다. 회사는 기존 약관에 따른 서비스 제공이 어려운 경우 그 사유와 이용계약 종료 예정일을 사전에 알리고 이용계약을 종료할 수 있습니다."]],
        ["제4조 (이용계약의 성립 및 소속 관리)", ["이용계약은 소속 사업장의 초대를 받은 사람이 이 약관에 동의하고, 회사가 안내하는 본인확인 및 가입 절차를 완료하여 회사가 가입을 승인하면 성립합니다. 개인정보 처리에 별도의 동의가 필요한 경우 회사는 해당 동의를 구분하여 받습니다.", "직원 계정은 만 19세 이상인 사람만 만들 수 있습니다. 본인확인 결과 만 19세 미만인 경우 가입이 제한되며, 해당 직원의 근무관리는 소속 사업장이 근무 앱 외의 방법으로 처리합니다.", "직원의 소속 및 사업장별 이용 권한은 소속 사업장 관리자가 관리합니다. 여러 사업장에 소속되거나 소속 사업장을 변경하는 경우에는 회사가 안내하는 절차에 따릅니다.", "이미 가입한 직원이 다른 사업장의 초대를 받은 경우에는 기존 계정을 이용하여 소속 추가 또는 변경 절차를 진행할 수 있습니다.", "소속의 추가 또는 변경만으로 이전 사업장의 업무기록이 다른 사업장에 제공되지는 않습니다."]],
        ["제5조 (계정관리 및 직원의 의무)", ["직원은 자신의 계정과 인증정보를 안전하게 관리해야 하며, 이를 제3자에게 공유하거나 계정을 양도·대여해서는 안 됩니다.", "직원은 계정 도용 또는 무단 이용 사실을 알게 된 경우 지체 없이 회사에 알리고, 피해를 줄이기 위한 조치에 협조해야 합니다.", "직원은 가입 및 근무 앱 이용 과정에서 정확한 정보를 제공해야 하며, 다른 사람을 사칭하거나 근무기록 등을 허위로 입력해서는 안 됩니다.", "직원은 다른 사람의 정보를 무단으로 열람·수집·이용하거나, 접근 권한을 우회하거나, 근무 앱의 정상적인 운영을 방해해서는 안 됩니다.", "직원의 고의 또는 과실로 계정이 부정하게 이용되어 손해가 발생한 경우 책임은 관련 법령에 따라 정합니다."]],
        ["제6조 (회사의 의무)", ["회사는 관련 법령과 이 약관을 준수하고, 근무 앱을 안정적으로 제공하기 위해 노력합니다.", "회사는 개인정보를 보호하기 위해 관련 법령에 따른 기술적·관리적·물리적 안전조치를 시행하고, 개인정보처리방침을 공개하고 준수합니다.", "회사는 근무 앱 이용과 관련하여 직원이 제기한 정당한 의견이나 불만을 처리하고, 즉시 처리가 어려운 경우 그 사유와 처리 예정 일정을 안내합니다.", "회사는 직원 데이터에 대한 접근 권한을 업무상 필요한 범위로 관리하고, 무단 접근 및 유출을 방지하기 위한 조치를 시행합니다."]],
        ["제7조 (서비스의 제공과 변경)", ["회사는 연중무휴 1일 24시간 근무 앱을 제공하는 것을 원칙으로 합니다. 다만, 제8조에 따른 중단이 발생할 수 있습니다.", "직원이 이용할 수 있는 기능과 정보의 범위는 소속 사업장의 서비스 이용 범위 및 직원에게 부여된 권한에 따라 달라질 수 있습니다.", "회사는 서비스 개선, 보안 강화, 기술적 필요 또는 관련 법령의 변경 등 합리적인 사유가 있는 경우 근무 앱의 기능이나 제공 방식을 변경할 수 있습니다.", "회사는 직원의 이용에 중대한 영향을 미치는 변경이 있는 경우 변경 내용, 사유 및 적용일을 7일 전까지 공지합니다. 다만, 긴급한 보안 조치 등 사전에 공지하기 어려운 경우에는 변경 후 지체 없이 알립니다.", "근무기록의 승인, 근무스케줄의 편성, 급여 산정 및 지급 등 인사·노무 관련 사항은 소속 사업장이 담당합니다. 직원은 해당 내용의 확인이나 정정이 필요한 경우 소속 사업장에 요청할 수 있으며, 회사는 시스템 오류 등 회사가 담당하는 사항에 대해 필요한 조치를 합니다."]],
        ["제8조 (서비스의 중단)", ["회사는 설비 점검·교체, 시스템 장애, 통신 두절, 천재지변 등 부득이한 사유가 있는 경우 근무 앱의 전부 또는 일부를 일시 중단할 수 있습니다.", "계획된 중단은 중단 사유, 예정 시간 및 영향을 받는 기능을 미리 공지합니다. 사전에 알리기 어려운 경우에는 중단 후 지체 없이 알립니다.", "회사는 중단 사유가 해소되면 서비스를 신속하게 복구하기 위해 노력하고, 필요한 경우 복구 진행 상황을 안내합니다."]],
        ["제9조 (이용 제한)", ["회사는 직원이 제5조를 위반한 경우 위반의 내용, 정도 및 반복 여부 등을 고려하여 경고, 일시적인 이용 정지 또는 이용계약 해지 등의 조치를 할 수 있습니다.", "회사는 원칙적으로 이용 제한 사유, 범위, 기간 및 이의제기 방법을 사전에 통지합니다. 다만, 개인정보 유출, 계정 도용 또는 서비스에 대한 중대한 침해를 막기 위해 긴급한 조치가 필요한 경우에는 먼저 이용을 제한하고 지체 없이 통지할 수 있습니다.", "직원은 이용 제한 조치에 대해 회사가 안내하는 방법으로 이의를 제기할 수 있습니다. 회사는 이의제기 내용을 검토하고 그 결과를 알리며, 제한 사유가 해소되거나 조치가 잘못된 것으로 확인된 경우 필요한 조치를 합니다.", "소속 사업장과의 근로관계가 종료되면 해당 사업장에 대한 접근 권한은 종료됩니다. 다른 소속 사업장이 없는 경우 사업장 관련 기능의 이용은 제한되지만, 제10조에 따른 회원 탈퇴 등 계정관리 절차는 이용할 수 있습니다."]],
        ["제10조 (이용계약의 해지 및 소속 종료)", ["직원은 언제든지 근무 앱의 회원 탈퇴 기능을 통해 이용계약을 해지할 수 있습니다. 해당 기능을 이용하기 어려운 경우 회사가 안내하는 고객지원 창구를 통해 탈퇴를 요청할 수 있습니다.", "회사는 직원의 탈퇴 의사를 확인한 후 지체 없이 탈퇴를 처리합니다.", "소속 사업장과의 근로관계 종료는 근무 앱의 회원 탈퇴와 구분됩니다. 직원이 탈퇴하지 않은 경우 계정은 개인정보처리방침에 안내된 보유 기준에 따라 유지되며, 다른 사업장의 초대를 받아 소속 등록 절차를 완료하면 사업장 관련 기능을 다시 이용할 수 있습니다.", "회원 탈퇴 또는 소속 종료에 따른 데이터 처리는 제11조에 따릅니다.", "회사는 소속 종료, 소속 추가·변경 및 탈퇴에 관한 세부 절차를 근무 앱에서 안내합니다. 세부 절차는 관련 법령과 이 약관에 반할 수 없으며, 직원의 권리·의무에 중대한 영향을 미치는 변경은 제3조에 따라 처리합니다."]],
        ["제11조 (직원 데이터 및 개인정보의 처리)", ["소속 사업장은 근태, 근무스케줄, 업무 수행 및 급여 관련 기록을 인사·노무 관리 등의 목적으로 관련 법령에 따라 처리합니다.", "회사는 계정관리 및 서비스 제공을 위해 직접 처리하는 개인정보와 소속 사업장으로부터 위탁받아 처리하는 개인정보를 구분하여 관리합니다. 각 개인정보의 처리 목적, 항목, 보유기간 및 권리 행사 방법은 해당 개인정보처리방침과 필요한 동의서 등을 통해 안내합니다.", "회사가 소속 사업장으로부터 개인정보 처리 업무를 위탁받는 경우에는 위탁받은 업무의 범위에서만 해당 개인정보를 처리하며, 관련 법령에서 허용하는 경우를 제외하고 이를 다른 목적으로 이용하거나 제3자에게 제공하지 않습니다.", "회사는 이용계약 종료, 보유기간 경과 또는 처리 목적 달성 등으로 개인정보가 불필요하게 된 경우 지체 없이 파기합니다. 다만, 다른 법령에 따라 보존해야 하는 경우에는 해당 기간 동안 다른 개인정보와 분리하여 보관하고, 기간이 끝나면 파기합니다.", "직원의 회원 탈퇴 또는 소속 종료만으로 소속 사업장이 적법하게 보유하는 인사·노무 관련 기록이 모두 삭제되는 것은 아닙니다. 해당 기록의 보유 및 파기는 관련 법령과 소속 사업장의 적법한 처리 기준에 따르며, 회사가 위탁받아 보관하는 기록은 법령 및 위탁계약에 따라 처리합니다.", "직원은 관련 법령에 따라 개인정보의 열람, 정정·삭제, 처리정지 등을 요청할 수 있습니다. 회사는 직접 처리하는 개인정보에 관한 요청을 처리하고, 소속 사업장이 담당하는 개인정보에 관한 요청은 해당 사업장에 요청할 수 있도록 안내하거나 필요한 범위에서 협조합니다.", "이 약관에 대한 동의만으로 직원 데이터에 관한 법률상 권리가 회사 또는 소속 사업장에 이전되는 것은 아닙니다."]],
        ["제12조 (지식재산권)", ["근무 앱에 관한 소프트웨어, 디자인, 상표 등 지식재산권은 회사 또는 정당한 권리자에게 있습니다.", "직원은 근무 앱 이용에 필요한 범위에서 해당 소프트웨어와 콘텐츠를 이용할 수 있으며, 회사 또는 권리자의 허락 없이 이를 복제·배포·판매하는 등 권리를 침해해서는 안 됩니다.", "직원 데이터에 관한 권리와 처리는 제11조 및 관련 법령에 따릅니다."]],
        ["제13조 (손해배상 및 책임)", ["회사 또는 직원이 고의 또는 과실로 관련 법령이나 이 약관을 위반하여 상대방에게 손해를 입힌 경우, 관련 법령에 따라 그 손해를 배상합니다.", "회사는 천재지변 등 불가항력으로 서비스를 제공할 수 없는 경우 회사의 귀책사유 없이 발생한 손해에 대해서는 책임을 지지 않습니다.", "직원의 귀책사유 또는 제3자가 제공하는 서비스의 장애로 발생한 손해에 대한 책임은 손해의 발생 원인과 각 당사자의 귀책 여부에 따라 정합니다.", "이 약관은 관련 법령에 따라 회사가 부담하는 책임이나 직원이 가지는 권리를 부당하게 배제하거나 제한하는 것으로 해석되지 않습니다."]],
        ["제14조 (통지)", ["회사는 직원이 등록한 이메일 주소, 휴대전화번호 또는 앱 내 알림 등으로 직원에게 통지할 수 있습니다.", "직원은 통지를 받을 수 있도록 연락처 등 계정정보를 최신 상태로 유지해야 합니다.", "회사는 전체 직원에게 공통으로 적용되는 일반적인 안내를 근무 앱 내 공지로 전달할 수 있습니다. 다만, 약관의 불리한 개정, 이용 제한, 이용계약 종료 등 직원의 권리·의무에 중대한 영향을 미치는 사항은 이 약관에서 정한 방법으로 개별 통지합니다."]],
        ["제15조 (분쟁해결 및 관할법원)", ["회사와 직원은 근무 앱 이용과 관련하여 분쟁이 발생한 경우 이를 원만하게 해결하기 위해 협의합니다.", "이 약관과 근무 앱 이용에 관한 분쟁에는 대한민국 법률을 적용합니다.", "분쟁에 관한 소송은 민사소송법에 따른 관할 법원에 제기합니다."]],
        ["부칙", "이 약관은 [시행일 확정 후 기재]부터 시행합니다."]
      ]
    },
    privacy: {
      title: "[필수] 개인정보 수집·이용 동의",
      ver: "v0.7 · 시행일 미정 (초안)",
      body: [
        ["", "주식회사 인터플러그는 웨일ERP 회원가입과 서비스 제공을 위해 아래와 같이 개인정보를 수집·이용합니다."],
        ["수집·이용 내역", { head: ["수집 목적", "수집 항목", "보유·이용 기간"], rows: [
          ["회원 식별, 가입 의사 확인, 로그인", "아이디, 비밀번호, 이름, 휴대전화번호, 이메일", "회원 탈퇴 시까지"],
          ["BP 생성과 관리", "상호명", "회원 탈퇴 시까지"],
          ["계정 찾기, 임시 비밀번호 발송, 서비스 안내", "이메일", "회원 탈퇴 시까지"],
          ["부정 이용 방지, 보안 감사", "접속 일시, 접속 IP, 로그인 기록 (서비스 이용 중 자동 생성)", "[1년]"]
        ]}],
        ["사업자정보 인증 시", "사업자정보 인증을 하는 경우 사업자등록번호, 대표자명, 개업일자를 국세청 진위확인에 쓰고 회원 탈퇴 시까지 보관합니다."],
        ["선택 입력 항목", "대표자 연락처, 대표자 이메일, 사업장 주소, 업태, 종목은 사업장 정보 관리와 정산·신고 서류 작성을 위해 회원이 직접 입력한 경우에만 수집하며, 회원 탈퇴 시까지 보관합니다. 입력하지 않아도 회원가입과 기본 서비스 이용에 제한이 없고, MY PAGE 에서 언제든지 지울 수 있습니다."],
        ["법령에 따른 보존", ["전자상거래법에 따른 계약·결제 기록: 5년", "전자상거래법에 따른 소비자 불만·분쟁 처리 기록: 3년", "통신비밀보호법에 따른 접속 기록: 3개월"]],
        ["동의를 거부할 권리", "귀하는 동의를 거부할 권리가 있습니다. 다만 필수 항목에 동의하지 않으면 회원가입과 서비스 이용이 불가합니다."]
      ]
    },
    marketing: {
      title: "[선택] 마케팅 정보 수신을 위한 개인정보 이용 동의",
      ver: "v0.7 · 시행일 미정 (초안) · 직원 근무 앱",
      body: [
        ["", "주식회사 인터플러그는 웨일ERP 직원 근무 앱의 새 기능, 이벤트, 혜택 정보를 보내기 위해 아래와 같이 개인정보를 이용합니다."],
        ["이용 내역", { head: ["이용 목적", "이용 항목", "보유·이용 기간"], rows: [
          ["신규 기능·서비스 안내, 이벤트·프로모션 안내, 맞춤형 혜택 제공, 서비스 만족도 조사", "이름, 휴대전화번호, 이메일, 앱 푸시 토큰", "직원 계정 삭제 또는 동의 철회 시까지"]
        ]}],
        ["수신 채널", "앱 푸시, 문자 메시지(SMS·알림톡), 이메일 가운데 동의한 채널로만 보냅니다. 채널마다 따로 동의하거나 철회할 수 있습니다."],
        ["동의를 거부할 권리", "귀하는 동의를 거부할 권리가 있으며, 동의하지 않아도 출퇴근·근무스케줄·급여명세서 등 근무 앱 이용에는 제한이 없습니다. 다만 이벤트·혜택 안내를 받을 수 없습니다."],
        ["철회와 재확인", ["동의는 언제든지 앱의 설정 > 알림 설정이나 수신한 메시지의 수신 거부 링크로 철회할 수 있습니다.", "회사는 동의한 날부터 2년마다 수신 동의 여부를 다시 확인하여 알려 드립니다.", "오후 9시부터 다음 날 오전 8시 사이에는 광고성 정보를 보내지 않습니다. 야간 발송이 필요하면 별도 동의를 받습니다.", "이 동의는 회사(웨일ERP)의 광고성 정보에 관한 것이며, 소속 사업장(고용주)에는 동의 여부를 제공하지 않습니다.", "근무스케줄 확정, TO-DO 배정, 급여명세서 발행 같은 업무 알림은 이 동의와 관계없이 발송됩니다."]]
      ]
    },
    location: {
      title: "[필수] 위치정보 수집·이용 동의",
      ver: "v0.7 · 시행일 미정 (초안) · 직원 근무 앱",
      body: [
        ["", "주식회사 인터플러그는 직원 근무 앱의 출퇴근 등록에서 근무지 도착 여부를 확인하기 위해 아래와 같이 개인위치정보를 수집·이용합니다. 이 동의는 첫 출퇴근 등록 때 받습니다."],
        ["수집·이용 내역", { head: ["이용 목적", "수집 항목", "보유·이용 기간"], rows: [
          ["출근·퇴근 등록 때 근무지 반경 안에 있는지 판정", "출근·퇴근 버튼을 누른 순간의 단말기 위치(GPS)", "판정 직후 파기 — 좌표는 저장하지 않음"],
          ["출퇴근 기록 관리와 확인", "판정 결과(반경 안 · 확인 필요), 위치 오차", "출퇴근 기록 보존 기간 동안 [근로기준법상 3년]"]
        ]}],
        ["수집 방법과 시점", ["출근·퇴근 버튼을 누를 때만 한 번 위치를 확인합니다.", "앱을 쓰지 않는 동안이나 근무 중에 위치를 계속 추적하지 않습니다.", "근무지 반경은 기본 100m 이며, 지하·실내 근무지는 관리자가 넓힐 수 있습니다."]],
        ["위치정보 이용·제공 사실 확인자료", "위치정보의 보호 및 이용 등에 관한 법률에 따라 위치정보 이용·제공 사실 확인자료를 [6개월] 동안 보관합니다."],
        ["판정 결과의 제공", "판정 결과(반경 안 · 확인 필요)와 등록 시각은 출퇴근 관리를 위해 소속 사업장의 관리자에게 보입니다. 좌표는 제공하지 않습니다. [제3자 제공 해당 여부와 즉시 통보 방식은 법무 확인]"],
        ["개인위치정보주체의 권리", ["언제든지 동의의 전부나 일부를 철회할 수 있습니다.", "위치정보 이용·제공 사실 확인자료의 열람이나 고지를 요구할 수 있고, 오류가 있으면 정정을 요구할 수 있습니다.", "권리는 앱의 설정 > 위치정보 또는 아래 담당자에게 요청해 행사할 수 있습니다."]],
        ["동의를 거부할 권리", "귀하는 동의를 거부하거나 철회할 수 있습니다. 이 경우 GPS 출퇴근 등록을 할 수 없으며, 출퇴근은 소속 사업장 관리자에게 등록을 요청해야 합니다. [대체 수단은 확정 전]"],
        ["사업자 정보", "주식회사 인터플러그 · [주소] · 위치정보관리책임자 [이름] · [이메일] · [전화번호]"]
      ]
    },
    privacyStaff: {
      title: "[필수·안] 직원 개인정보 수집·이용 동의",
      ver: "v0.1 · 시행일 미정 (초안) · 직원 근무 앱 · 법무 검토 전",
      body: [
        ["", "주식회사 인터플러그는 직원 근무 앱 가입과 서비스 제공을 위해 아래와 같이 개인정보를 수집·이용합니다. 소속 사업장(BP)이 개인정보처리자이고, 회사는 소속 사업장의 위탁을 받아 서비스 제공에 필요한 범위에서만 처리하는 수탁자입니다. 자세한 위탁 관계는 플랫폼 이용약관(직원앱 회원가입용) 제11조를 따릅니다."],
        ["수집·이용 내역", { head: ["수집 목적", "수집 항목", "보유·이용 기간"], rows: [
          ["계정 생성, 본인 확인, 로그인", "이름, 휴대전화번호, 이메일", "근무 앱 회원 탈퇴 시까지"],
          ["근로계약 체결 및 이력 관리", "생년월일, 계약 조건(급여 형태·소정근로시간·주휴일·임금지급일·4대보험 가입 여부), 전자서명(날인 이미지)", "퇴직일로부터 [3]년"],
          ["출퇴근 등록 및 근태 관리", "출퇴근 시각, 출퇴근 위치 판정 결과(좌표 자체는 저장하지 않음)", "근로기준법에 따른 근로자명부 보존 기간 [3]년"],
          ["근무스케줄·할 일(TO-DO) 배정 확인", "근무스케줄 배정 내역, TO-DO 배정 내역", "생성일로부터 [3]년"],
          ["급여명세서 확인", "급여명세서의 지급·공제 내역", "근로기준법에 따른 임금대장 보존 기간 [3]년"]
        ]}],
        ["법령에 따라 별도로 수집하는 항목", "주민등록번호는 이 동의와 별도로, 근로계약 날인을 마친 뒤 직원 근무 앱의 4대보험·급여 신고 정보 단계에서 직원 본인이 직접 입력합니다. 국민연금법·고용보험법 등 4대보험 취득신고와 소득세법에 따른 원천징수에 필요한 범위에서만 이용하며, 개인정보보호법 제24조의2 에 따라 법령이 정한 목적으로만 수집하므로 별도 동의 없이 목적만 알려 드립니다. 관리자 화면에는 마스킹 처리로만 보이고, 저장 시 암호화합니다. 보유기간은 퇴직일로부터 [3]년입니다."],
        ["급여 계좌 정보", "급여 계좌(은행명·계좌번호)는 주민등록번호와 같은 신고 정보 화면에서 직원 본인이 입력합니다. 근로계약 이행(임금 지급)을 근거로 수집하며, 법령 근거로 수집하는 주민등록번호와는 수집 근거가 다릅니다. 보유기간은 근무 앱 회원 탈퇴 시까지입니다. [계좌 정보 안내 문구를 주민등록번호와 분리해 표시할지는 법무 검토 후 정합니다.]"],
        ["소속 사업장 자료 다운로드", "소속 사업장(BP 마스터·가맹 마스터)이 직원 자료를 내려받는 경우 근로계약서·출퇴근 기록·급여명세서·근무스케줄만 담기며, 주민등록번호·4대보험 신고 정보·위치정보 이용·제공 사실 확인자료·약관 동의 기록은 포함하지 않습니다."],
        ["동의를 거부할 권리", "귀하는 동의를 거부할 권리가 있습니다. 다만 이 동의는 근무 앱의 기본 기능(근태·근무스케줄·급여명세서 확인) 이용에 필요한 필수 항목이므로, 거부하시면 근무 앱 가입과 이용이 제한됩니다. 법령에 따라 수집하는 주민등록번호는 동의 대상이 아니며, 입력하지 않으면 4대보험 취득신고 등 관련 절차를 진행할 수 없습니다."],
        ["참고 — 이 동의에 포함되지 않는 것", "가맹 점포 직원의 개인 기록을 본사(BP 마스터·BP 관리자)에게 보이도록 하는 「본사 제공 동의」는 이 문서가 아니라 별도 동의로 받습니다. 마케팅 수신 동의와 위치정보 수집·이용 동의도 각각 별도 문서(③·⑤·⑥ 탭)로 받습니다."]
      ]
    },
    policy: {
      title: "개인정보처리방침",
      ver: "v0.7 · 시행일 미정 (초안) · 법무 검토 전",
      body: [
        ["총칙", "주식회사 인터플러그(이하 “회사”)는 웨일ERP 이용자의 개인정보를 소중히 다루며, 개인정보 보호법 등 관련 법령을 지킵니다. 이 방침은 회사가 어떤 개인정보를 왜 수집하고 어떻게 보호하는지 알려 드립니다."],
        ["1. 처리하는 개인정보 항목", ["회원 가입: 아이디, 비밀번호, 이름, 휴대전화번호, 이메일, 상호명", "사업자정보 인증: 사업자등록번호, 대표자명, 개업일자", "서비스 이용 중 자동 생성: 접속 일시, 접속 IP, 로그인 기록, 쿠키"]],
        ["2. 처리 목적", ["회원 관리와 본인 확인, 계정 찾기", "서비스 제공과 운영 안내", "보안 사고 예방과 부정 이용 방지"]],
        ["3. 보유 및 파기", "개인정보는 수집·이용 목적을 이루면 지체 없이 파기합니다. 탈퇴한 회원의 이름·연락처·이메일은 탈퇴 즉시 삭제하며, 법령이 보존을 요구하는 거래 기록은 정해진 기간 동안 분리 보관한 뒤 복구할 수 없는 방법으로 파기합니다."],
        ["4. 제3자 제공", "회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 따른 요청이 있는 경우는 예외로 합니다."],
        ["5. 위탁받아 처리하는 개인정보", "회사는 회원(BP)의 위탁을 받아 그 소속 직원의 근태·근무스케줄·급여명세서 등 인사 정보를 처리합니다. 이 경우 개인정보의 처리자는 위탁한 회원이며, 회사는 위탁받은 범위에서만 개인정보를 처리하는 수탁자입니다. 위탁받아 처리하는 개인정보는 이용계약이나 위탁이 끝나면 지체 없이 파기합니다. 위탁 업무의 내용과 수탁자의 의무는 웨일ERP 서비스 이용약관 제14조(개인정보 처리위탁)를 따릅니다."],
        ["6. 개인위치정보의 처리", "회사는 직원 근무 앱의 출퇴근 등록 기능에서 위치정보의 보호 및 이용 등에 관한 법률에 따라 개인위치정보를 수집·이용합니다. 수집 목적, 수집 항목과 보유기간은 직원 근무 앱의 위치정보 수집·이용 동의 전문을 따릅니다. 개인위치정보주체는 언제든지 동의의 전부나 일부를 철회하거나 위치정보 이용·제공 사실 확인자료의 열람·정정을 요구할 수 있습니다."],
        ["7. 제3자 위탁 처리", ["메일 발송: [발송 대행 업체명, 선정 전]", "사업자정보 진위확인: 국세청 사업자등록정보 진위확인 API"]],
        ["8. 이용자의 권리", "이용자는 언제든지 자신의 개인정보를 조회·수정하거나 처리 정지와 삭제를 요청할 수 있습니다. MY PAGE 에서 직접 처리하거나 아래 담당자에게 요청해 주세요."],
        ["9. 안전성 확보 조치", ["비밀번호는 복호화할 수 없는 방식으로 암호화해 저장합니다.", "개인정보를 다루는 인원을 최소한으로 제한하고 접근 기록을 보관합니다."]],
        ["10. 개인정보 보호책임자", "책임자: [담당자 이름] ([담당 부서]) · [이메일] · [전화번호]"],
        ["부칙", "이 방침은 [시행일 확정 후 기재]부터 적용합니다."]
      ]
    }
  };

  /* [ ] 로 감싼 자리는 회사가 아직 정하지 못한 값이다(손해배상 개월수, 보관기간, 연락처 등).
     약관 문구 안에서만 빨강으로 눈에 띄게 하고, 다른 화면 문구에는 손대지 않는다. */
  function markTBD(html) {
    return String(html).replace(/\[([^\]]+)\]/g, '<span class="term-tbd">[$1]</span>');
  }

  /* 절은 [제목, 내용]. 내용은 문장, 문장 배열(번호 목록), 또는 {head, rows} 표다. 제목이 빈 절은 머리말이다. */
  function termsBody(key) {
    return TERMS[key].body.map(function (sec) {
      var v = sec[1], content;
      if (Array.isArray(v)) content = "<ol>" + v.map(function (li) { return "<li>" + li + "</li>"; }).join("") + "</ol>";
      else if (v && v.rows) content = "<table><thead><tr>" + v.head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr></thead><tbody>" +
        v.rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
      else content = "<p>" + v + "</p>";
      return "<section>" + (sec[0] ? "<h3>" + sec[0] + "</h3>" : "") + markTBD(content) + "</section>";
    }).join("");
  }

  function termsHTML(key) {
    var t = TERMS[key];
    var body = termsBody(key);
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

  /* 약관 전문 화면 — [data-terms-doc="키"] 자리에 같은 TERMS 문구를 제목·버전과 함께 펼친다. */
  document.querySelectorAll("[data-terms-doc]").forEach(function (el) {
    var t = TERMS[el.dataset.termsDoc];
    if (!t) return;
    el.innerHTML =
      '<div class="inline"><h2 class="t-h2">' + t.title + '</h2><span class="badge badge--quiet">' + t.ver + "</span></div>" +
      '<div class="terms">' + termsBody(el.dataset.termsDoc) + "</div>";
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
    var pool = (box.dataset.pool || "").split(";").filter(Boolean).map(function (t) { var a = t.split("|"); return { code: a[0], name: a[1], type: a[2] || "", lock: a[3] || "" }; });
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
          return '<div class="spick__opt' + (s.lock ? " is-off" : "") + '" role="option" aria-selected="false"' + (s.lock ? ' aria-disabled="true"' : "") + ' id="' + list.id + "-" + i + '" data-i="' + i + '"><span>' + hi(s.name, t) + '</span><span class="mono spick__code">' + hi(s.code, t) + '</span><span class="spick__type">' + esc(s.lock ? s.type + " · " + s.lock : s.type) + "</span></div>";
        }).join("");
      }
      list.hidden = false;
      q.setAttribute("aria-expanded", "true");
      if (found.length) mark(0);
    }
    function add(i) {
      var s = found[i]; if (!s || s.lock) return;
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
    ["ST000001", "모리커피 서초점", "직영점포"], ["ST000002", "모리커피 성수점", "직영점포"],
    ["ST000003", "온기식당 판교점", "직영점포"], ["ST000004", "온기식당 광화문점", "직영점포"],
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
