// 비로그인 화면(src/guest.mjs 로 그린 화면)의 동작. 앱 src/app/design/guest 의 React 상태를 마크업 단서로 옮겼다.
// 여기 적은 클래스 문자열은 guest.mjs 와 같아야 한다.
(() => {
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // 머리말: 스크롤하면 흰 바탕과 선을 깐다. 본문이 흰 화면(data-lined)은 맨 위에서도 선이 있다.
  const header = document.querySelector("[data-guest-header]");
  if (header) {
    const lined = header.hasAttribute("data-lined");
    const update = () => {
      const scrolled = window.scrollY > 0;
      header.classList.toggle("bg-white/95", scrolled);
      header.classList.toggle("backdrop-blur-[8px]", scrolled);
      header.classList.toggle("border-guest-line", scrolled || lined);
      header.classList.toggle("border-transparent", !scrolled && !lined);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  // 비밀번호 보기·숨기기. 버튼 안 두 그림 중 지금 상태를 바꾸는 쪽 하나만 보인다.
  for (const btn of $$("[data-password-toggle]")) {
    const input = btn.closest("label, span").querySelector("input");
    const name = btn.dataset.passwordToggle;
    btn.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", String(show));
      btn.setAttribute("aria-label", `${name} ${show ? "숨기기" : "보기"}`);
      const [on, off] = btn.querySelectorAll("img");
      on.hidden = show;
      off.hidden = !show;
    });
  }

  // 입력 지우기 버튼: 값이 있을 때만 보인다.
  for (const btn of $$("[data-clear]")) {
    const input = btn.closest("label").querySelector("input");
    const sync = () => (btn.hidden = !input.value);
    input.addEventListener("input", sync);
    btn.addEventListener("click", () => {
      input.value = "";
      sync();
      input.focus();
    });
    sync();
  }

  // 같은 화면의 설명으로 부드럽게 내려가는 바로가기. 주소(#)를 바꾸지 않아 방문 기록이 쌓이지 않는다.
  for (const btn of $$("[data-scroll-to]")) {
    btn.addEventListener("click", () => {
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(btn.dataset.scrollTo)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });
  }

  // 아이디/비밀번호 찾기: 탭을 바꾸면 그 탭의 칸만 보이고 입력값과 남은 시간을 비운다. 주소 #id · #pw 로 탭을 연다.
  const tabs = $$("[data-find-tab]");
  if (tabs.length) {
    const form = document.querySelector("[data-find-form]");
    const timerText = form.querySelector("[data-timer]");
    let left = null;
    let timer;
    const showTime = () => {
      timerText.hidden = left === null;
      if (left === null) return;
      const mm = String(Math.floor(left / 60)).padStart(2, "0");
      const ss = String(left % 60).padStart(2, "0");
      timerText.textContent = left > 0 ? `남은 시간 ${mm}:${ss}` : "인증 시간이 지났습니다. 인증번호를 다시 받아 주세요.";
    };
    const stop = () => {
      clearInterval(timer);
      left = null;
      showTime();
    };
    const select = (key) => {
      for (const t of tabs) {
        const on = t.dataset.findTab === key;
        // 클릭 때는 erp.js 가 data-on · data-off 로 이미 바꿔 두어 여기서 바뀌는 것이 없다. 주소 #pw 로 처음 열 때
        // 탭 줄을 맞추려고 둔다(find 탭은 aria-controls 가 없어 erp.js 가 해시를 보지 않는다).
        t.setAttribute("aria-selected", String(on));
        t.className = t.className.replace(on ? t.dataset.off : t.dataset.on, on ? t.dataset.on : t.dataset.off);
      }
      form.reset();
      for (const el of $$("[data-find-only]", form)) {
        el.hidden = el.dataset.findOnly !== key;
        el.querySelector("input").disabled = el.hidden;
      }
      form.querySelector("[data-find-submit]").textContent = key === "id" ? "아이디 확인" : "비밀번호 재설정";
      stop();
    };
    for (const t of tabs) t.addEventListener("click", () => select(t.dataset.findTab));
    form.querySelector("[data-send-code]").addEventListener("click", () => {
      clearInterval(timer);
      left = 180; // 인증번호 유효 시간 3분
      showTime();
      timer = setInterval(() => {
        left -= 1;
        showTime();
        if (left <= 0) clearInterval(timer);
      }, 1000);
    });
    form.addEventListener("submit", (e) => e.preventDefault());
    select(location.hash === "#pw" ? "password" : "id");
  }

  // 고르는 칸에서 「직접입력」을 고르면 같은 폼의 직접 입력칸 잠금을 푼다(도입문의 업종).
  for (const sel of $$("[data-other-select]")) {
    const input = sel.form.querySelector("[data-other-input]");
    sel.addEventListener("change", () => {
      const other = sel.value === "직접입력";
      input.disabled = !other;
      if (other) input.focus();
      else input.value = "";
    });
  }

  // 하나 이상 고르기(도입문의 관심 서비스): 하나도 안 골랐으면 첫 체크 상자에 검사 오류를 걸어 제출을 막는다.
  for (const group of $$("[data-check-group]")) {
    const boxes = $$('input[type="checkbox"]', group);
    const sync = () => boxes[0].setCustomValidity(boxes.some((b) => b.checked) ? "" : group.dataset.checkGroup);
    for (const b of boxes) b.addEventListener("change", sync);
    sync();
  }

  // 데모 접수(도입문의): 브라우저 검사를 통과하면 보내지 않고 접수 안내만 보인다.
  for (const form of $$("[data-demo-submit]")) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const done = form.querySelector("[data-demo-done]");
      done.hidden = false;
      done.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  }

  // 가입 완료: 회원가입 폼이 주소로 넘긴 값을 보인다. 바로 열면 시안의 예시 값이 남는다.
  const query = new URLSearchParams(location.search);
  for (const el of $$("[data-query]")) {
    const v = query.get(el.dataset.query);
    if (v) el.textContent = v;
  }

  // ── 회원가입(auth/signup.html). 앱 sign-up-form.tsx 의 상태를 옮겼다. ──
  const signup = document.querySelector("[data-signup-form]");
  if (signup) {
    // 아이디·이메일 중복 확인. 중복 확인 API 가 없어 앱과 같은 샘플 목록으로 판정한다.
    const TAKEN = { loginId: ["admin", "whaleadmin", "hangang01"], email: ["help@interplug.co.kr", "hayoon@hangang.co.kr"] };
    const TAKEN_MESSAGE = { loginId: "이미 사용 중인 아이디입니다.", email: "이미 가입된 이메일입니다." };
    for (const input of $$("[data-check]", signup)) {
      const kind = input.dataset.check;
      const status = document.getElementById(`${kind}-status`);
      const show = (state) => {
        status.hidden = state === "idle";
        status.querySelector("[data-check-ok]").hidden = state !== "ok";
        status.querySelector("[data-check-taken]").hidden = state !== "taken";
      };
      // 다시 고치면 표시를 지운다.
      input.addEventListener("input", () => {
        input.setCustomValidity("");
        show("idle");
      });
      // 칸을 벗어날 때 형식이 맞으면 확인한다. 이미 쓰는 값이면 제출을 막는다.
      input.addEventListener("blur", () => {
        if (!input.value || !input.checkValidity()) return;
        const ok = !TAKEN[kind].includes(input.value.trim().toLowerCase());
        input.setCustomValidity(ok ? "" : TAKEN_MESSAGE[kind]);
        show(ok ? "ok" : "taken");
      });
    }

    // 사업자정보 인증. 진위확인은 보내지 않고 세 칸이 다 맞으면 인증된 것으로 잠근다.
    const biz = signup.querySelector("[data-biz]");
    const bizInputs = $$("input", biz);
    const setVerified = (on) => {
      for (const i of bizInputs) i.disabled = on;
      biz.querySelector("[data-biz-badge]").hidden = !on;
      biz.querySelector("[data-biz-verify]").hidden = on;
      biz.querySelector("[data-biz-reverify]").hidden = !on;
      biz.querySelector("[data-biz-clear]").hidden = !on;
    };
    biz.querySelector("[data-biz-verify]").addEventListener("click", () => {
      const bad = bizInputs.find((i) => !i.value.trim() || !i.checkValidity());
      if (bad) bad.focus();
      else setVerified(true);
    });
    biz.querySelector("[data-biz-reverify]").addEventListener("click", () => setVerified(false));
    biz.querySelector("[data-biz-clear]").addEventListener("click", () => {
      for (const i of bizInputs) i.value = "";
      setVerified(false);
    });

    // 약관: 모두 동의와 개별 동의를 맞춘다.
    const all = signup.querySelector("[data-agree-all]");
    const each = $$("[data-agree]", signup);
    all.addEventListener("change", () => each.forEach((c) => (c.checked = all.checked)));
    for (const c of each) c.addEventListener("change", () => (all.checked = each.every((x) => x.checked)));

    // 약관 내용보기. 네이티브 dialog 라 Esc 닫기는 브라우저가 맡는다.
    for (const btn of $$("[data-terms-open]", signup)) {
      btn.addEventListener("click", () => signup.querySelector(`[data-terms="${btn.dataset.termsOpen}"]`).showModal());
    }
    for (const btn of $$("[data-dialog-close]", signup)) btn.addEventListener("click", () => btn.closest("dialog").close());

    // 제출: 브라우저 기본 검사를 통과한 뒤 비밀번호 확인과 필수 약관만 따로 본다.
    // 가입 API 가 없어 완료 화면에 보일 값을 주소로 넘긴다.
    const error = signup.querySelector("[data-signup-error]");
    const fail = (msg) => {
      error.textContent = msg;
      error.hidden = !msg;
    };
    signup.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = new FormData(signup);
      if (form.get("password") !== form.get("passwordConfirm")) return fail("비밀번호가 서로 다릅니다.");
      if (!each.every((c) => c.checked)) return fail("이용약관과 개인정보 수집·이용에 모두 동의해 주세요.");
      fail("");
      const shown = new URLSearchParams({ companyName: form.get("companyName"), loginId: form.get("loginId"), email: form.get("email") });
      location.href = `${signup.dataset.done}?${shown}`;
    });
  }
})();
