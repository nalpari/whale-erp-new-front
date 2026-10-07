// 강제 비밀번호 변경. 목업 docs/mockup/auth/force-password.html 은 로그인 직후 홈 위에 닫을 수 없는 팝업이다.
// 데모는 가운데 카드로 그린다(초기 비밀번호 계정 기준).
import * as ui from "../../ui.mjs";
import * as p from "../../public.mjs";
import { link } from "../../site.mjs";

export default ({ A, R }) => {
  const card =
    p.cardTitle("새 비밀번호 설정", "새 비밀번호를 설정해야 웨일ERP 를 이용할 수 있습니다.") +
    ui.field(
      "새 비밀번호",
      ui.textField({ type: "password", autocomplete: "new-password", placeholder: "영문·숫자·특수문자를 조합하여 8~20자 입력해 주세요." }) +
        p.help("아이디와 달라야 함 · 받은 비밀번호와 달라야 함"),
    ) +
    ui.field("새 비밀번호 확인", ui.textField({ type: "password", autocomplete: "new-password" })) +
    p.note("현재 비밀번호는 묻지 않습니다. 바꿔도 이 기기와 다른 기기의 로그인은 모두 그대로 이어집니다.") +
    `<div class="flex items-center justify-between text-[14px]">${p.quietLink("로그아웃", link(R, "home/index.html"))}${ui.button("변경", { href: link(R, "home/signed-in.html") })}</div>`;
  return { title: "새 비밀번호 설정", html: p.authPage(A, R, { card }) };
};
