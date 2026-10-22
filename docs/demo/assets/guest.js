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

  // 아이디/비밀번호 찾기: 탭을 바꾸면 그 탭의 칸만 보이고 입력값과 결과를 비운다. 주소 #id · #pw 로 탭을 연다.
  // 데모라 요청은 보내지 않는다. 칸을 채워 제출하면 그 탭의 결과 안내를 보인다.
  const tabs = $$("[data-find-tab]");
  if (tabs.length) {
    const form = document.querySelector("[data-find-form]");
    const submit = form.querySelector("[data-find-submit]");
    const toPassword = form.querySelector("[data-find-to-password]");
    let current = "id";
    const showResult = (key) => {
      form.querySelector("[data-find-fields]").hidden = Boolean(key);
      submit.hidden = Boolean(key);
      form.querySelector("[data-find-actions]").classList.toggle("grid-cols-3", !key);
      form.querySelector("[data-find-actions]").classList.toggle("grid-cols-2", Boolean(key));
      for (const el of $$("[data-find-result]", form)) el.hidden = el.dataset.findResult !== key;
      toPassword.hidden = key !== "id";
    };
    const select = (key) => {
      current = key;
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
      submit.textContent = key === "id" ? "아이디 확인" : "임시 비밀번호 받기";
      document.querySelector("[data-find-lead]").textContent =
        key === "id" ? "회원가입 시 등록한 이름, 이메일 주소를 입력해 주세요." : "회원가입 시 등록한 이름, 아이디, 이메일 주소를 입력해 주세요.";
      showResult(null);
    };
    for (const t of tabs) t.addEventListener("click", () => select(t.dataset.findTab));
    // 「비밀번호도 잊으셨나요?」는 비밀번호 탭 버튼을 누른 것과 같다(탭 줄 색은 erp.js 가 클릭으로 바꾼다).
    toPassword.addEventListener("click", () => tabs.find((t) => t.dataset.findTab === "password").click());
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      showResult(current);
    });
    select(location.hash === "#pw" ? "password" : "id");
  }

  // 입력 검사: 브라우저 말풍선 대신 칸 아래 붉은 글씨로 알린다. 제출을 막는 것은 브라우저 검사가 그대로 맡는다.
  // data-guest-validate 를 단 폼(3팀 도입문의)에만 건다. 1팀 회원가입 · 찾기 · 로그인은 자기 안내 문구가 따로 있다.
  const guestForm = (el) => el.closest?.("form[data-guest-validate]");
  // 글씨는 칸을 감싼 묶음(관심 서비스 fieldset · 연락처 group · 세로 label) 맨 아래에 둔다.
  // 체크 상자 한 줄(개인정보 동의)은 가로 label 이라 문구 오른쪽에 붙는다.
  const errorOf = (el) => {
    const host = el.closest("fieldset") ?? el.closest("[role=group]")?.parentElement ?? el.closest("label") ?? el.parentElement;
    let p = host.querySelector(":scope > [data-field-error]");
    if (!p) {
      p = document.createElement("span");
      p.dataset.fieldError = "";
      p.className = `${el.type === "checkbox" && host.tagName === "LABEL" ? "ml-[4px]" : "-mt-[2px]"} text-[14px] leading-[1.5] text-[#e93737]`;
      host.append(p);
    }
    return p;
  };
  // 안내가 한 번 뜬 칸(aria-invalid 가 붙은 칸)만 다시 본다. 묶음은 아직 틀린 칸 하나의 안내를 보인다.
  const syncError = (el, failed = false) => {
    const scope = el.closest("fieldset, [role=group]");
    if (failed) el.setAttribute("aria-invalid", "true");
    const marked = (scope ? $$("input, select, textarea", scope) : [el]).filter((x) => x.hasAttribute("aria-invalid"));
    if (!marked.length) return;
    for (const x of marked) x.setAttribute("aria-invalid", String(!x.validity.valid));
    const bad = marked.find((x) => !x.validity.valid);
    const p = errorOf(el);
    p.textContent = bad?.validationMessage ?? "";
    p.hidden = !bad;
  };
  document.addEventListener(
    "invalid",
    (e) => {
      if (!guestForm(e.target)) return;
      e.preventDefault();
      // 말풍선을 끄면 브라우저가 첫 틀린 칸으로 옮겨 주지 않는다. 처음 걸린 칸으로 옮긴다.
      if (!document.activeElement?.matches(":invalid")) e.target.focus();
      syncError(e.target, true);
    },
    true,
  );
  // 고치면 바로 지운다.
  for (const type of ["input", "change"]) document.addEventListener(type, (e) => guestForm(e.target) && syncError(e.target));
  document.addEventListener("reset", (e) => {
    if (!e.target.matches("form[data-guest-validate]")) return;
    for (const p of $$("[data-field-error]", e.target)) p.hidden = true;
    for (const el of $$("[aria-invalid]", e.target)) el.removeAttribute("aria-invalid");
  });

  // 고르는 칸에서 「기타」를 고르면 같은 폼의 직접 입력칸을 아래에 연다(도입문의 업종).
  for (const sel of $$("[data-other-select]")) {
    const input = sel.form.querySelector("[data-other-input]");
    sel.addEventListener("change", () => {
      const other = sel.value === "기타";
      input.disabled = !other;
      input.closest("[data-other-wrap]").hidden = !other;
      if (other) input.focus();
      else input.value = "";
    });
  }

  // 하나 이상 고르기(도입문의 관심 서비스): 하나도 안 골랐으면 첫 체크 상자에 검사 오류를 걸어 제출을 막는다.
  for (const group of $$("[data-check-group]")) {
    const boxes = $$('input[type="checkbox"]', group);
    const sync = () => boxes[0].setCustomValidity(boxes.some((b) => b.checked) ? "" : group.dataset.checkGroup);
    for (const b of boxes) b.addEventListener("change", sync);
    // 폼을 비우면(reset) 체크가 풀린 뒤에 다시 건다. reset 이벤트는 값을 되돌리기 전에 오므로 한 틱 미룬다.
    group.form?.addEventListener("reset", () => setTimeout(sync));
    sync();
  }

  // 데모 접수(도입문의): 브라우저 검사를 통과하면 보내지 않고 완료 팝업만 띄운다. [확인]은 팝업을 닫고 폼을 비운다.
  for (const form of $$("[data-demo-submit]")) {
    const done = form.querySelector("[data-demo-done]");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      done.showModal();
    });
    done.querySelector("[data-dialog-close]").addEventListener("click", () => {
      done.close();
      form.reset();
      for (const input of $$("[data-other-input]", form)) {
        input.disabled = true;
        input.closest("[data-other-wrap]").hidden = true;
      }
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

    // 사업자정보 인증(S-VRNTHD). 진위확인은 보내지 않고 세 칸이 다 맞으면 인증된 것으로 잠근다.
    // 빈 칸은 「·」로 묶어 버튼 위 한 줄, 번호는 하이픈을 빼고 10자리인지 본다. 인증하면 잠그고 [재인증]으로 연다.
    const biz = signup.querySelector("[data-biz]");
    const bizInputs = $$("input", biz);
    const [bizNumber, bizCeo, bizOpen] = bizInputs;
    const bizVerify = biz.querySelector("[data-biz-verify]");
    const bizClear = biz.querySelector("[data-biz-clear]");
    const bizLine = biz.querySelector("[data-biz-line]");
    const bizStatus = biz.querySelector("[data-biz-status]");
    let bizVerified = false;
    const showLine = (text) => {
      bizLine.textContent = text;
      bizLine.hidden = !text;
    };
    const syncBiz = () => {
      for (const i of bizInputs) i.readOnly = bizVerified;
      bizVerify.textContent = bizVerified ? "재인증" : "인증하기";
      bizClear.hidden = !(bizVerified || bizInputs.some((i) => i.value));
      bizStatus.textContent = bizVerified ? `인증 완료 · ${new Date().toISOString().slice(0, 10)}` : "미인증";
      bizStatus.className = `text-[16px] font-medium ${bizVerified ? "text-guest-navy" : "text-[#e93737]"}`;
    };
    bizNumber.addEventListener("input", () => (bizNumber.value = bizNumber.value.replace(/[^0-9-]/g, "").slice(0, 12)));
    for (const i of bizInputs) i.addEventListener("input", () => (showLine(""), syncBiz()));
    bizVerify.addEventListener("click", () => {
      if (bizVerified) {
        bizVerified = false;
        return syncBiz();
      }
      const missing = [
        [bizNumber.value.replace(/[^0-9]/g, ""), "사업자등록번호"],
        [bizCeo.value.trim(), "대표자명"],
        [bizOpen.value, "개업일자"],
      ]
        .filter(([v]) => !v)
        .map(([, label]) => label);
      if (missing.length) return showLine(`${missing.join("·")} 항목을 입력해 주세요.`);
      if (bizNumber.value.replace(/[^0-9]/g, "").length !== 10) return showLine("사업자등록번호는 숫자 10자리입니다.");
      showLine("");
      bizVerified = true;
      syncBiz();
    });
    bizClear.addEventListener("click", () => {
      for (const i of bizInputs) i.value = "";
      bizVerified = false;
      showLine("");
      syncBiz();
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
