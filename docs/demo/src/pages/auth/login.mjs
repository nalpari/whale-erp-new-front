// 로그인. 목업 docs/mockup/auth/login.html 의 기본 상태.
import * as ui from "../../ui.mjs";
import * as p from "../../public.mjs";
import { link } from "../../site.mjs";

export default ({ A, R }) => {
  const card =
    p.cardTitle("웨일ERP 로그인") +
    ui.field("아이디", ui.textField({ autocomplete: "username", placeholder: "아이디", value: "hangang01" })) +
    ui.field("비밀번호", ui.textField({ type: "password", autocomplete: "current-password", value: "whale-2026!" })) +
    ui.checkbox(A, "아이디 저장", true) +
    p.block(ui.button("로그인", { href: link(R, "home/signed-in.html") })) +
    p.linkRow(
      p.quietLink("아이디 찾기", link(R, "auth/find.html#id")),
      p.quietLink("비밀번호 찾기", link(R, "auth/find.html#pw")),
      p.quietLink("사업자회원가입", link(R, "auth/signup.html")),
    );
  return { title: "로그인", html: p.authPage(A, R, { card, foot: p.legalFoot() }) };
};
