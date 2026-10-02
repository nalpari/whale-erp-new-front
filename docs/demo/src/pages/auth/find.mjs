// 아이디·비밀번호 찾기. 목업 docs/mockup/auth/find.html. 한 화면 두 탭이고 #id · #pw 로 해당 탭을 연다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../public.mjs";
import { link } from "../../site.mjs";

export default ({ A, R }) => {
  const id =
    ui.field("이름 *", ui.textField({ value: "정하윤" })) +
    ui.field("이메일 *", ui.textField({ type: "email", value: "hayoon@hangang.co.kr" }) + p.help("둘 중 하나라도 비어 있으면 찾기를 누를 수 없습니다.")) +
    p.block(ui.button("아이디 찾기"));
  const pw =
    ui.field("이름 *", ui.textField({ value: "정하윤" })) +
    ui.field("아이디 *", ui.textField({ value: "hangang01" })) +
    ui.field("이메일 *", ui.textField({ type: "email", value: "hayoon@hangang.co.kr" })) +
    p.block(ui.button("임시 비밀번호 받기")) +
    p.note("받은 뒤에도 지금 비밀번호로 로그인할 수 있습니다. 임시 비밀번호로 들어오면 새 비밀번호를 정해야 ERP 를 쓸 수 있습니다.");
  const card =
    p.cardTitle("아이디·비밀번호 찾기", "가입할 때 등록한 이름과 이메일로 확인합니다.") +
    `<div class="flex flex-col gap-[18px] [&_[role=tabpanel]]:gap-[18px]">${x.tabs([
      { id: "id", label: "아이디 찾기", html: id },
      { id: "pw", label: "비밀번호 찾기", html: pw },
    ])}</div>` +
    p.linkRow(p.quietLink("로그인으로 돌아가기", link(R, "auth/login.html")), p.quietLink("회원가입", link(R, "auth/signup.html")));
  return { title: "아이디·비밀번호 찾기", html: p.authPage(A, R, { card }) };
};
