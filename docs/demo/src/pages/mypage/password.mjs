// 비밀번호 변경. 목업 docs/mockup/mypage/password.html 의 기본 상태(입력)를 BP 마스터로 본 것.
import * as ui from "../../ui.mjs";
import * as f from "../../biz-form.mjs";
import { erpHeader } from "../../site.mjs";

// 비밀번호 칸 + [보기]. 1팀 컴포넌트에 비밀번호 칸이 없어 TextField 위에 글자 버튼을 겹쳤다.
const pw = (label, value, autocomplete, helpText) =>
  f.group(
    f.req(label),
    `<div class="relative">${ui.textField({ type: "password", value, autocomplete, "aria-label": label })}<button type="button" aria-pressed="false" aria-label="비밀번호 보기" class="absolute top-0 right-0 h-[34px] px-[10px] text-[13px] text-erp-label hover:text-erp-ink" onclick="const i=this.previousElementSibling,on=i.type==='password';i.type=on?'text':'password';this.setAttribute('aria-pressed',on);this.textContent=on?'숨기기':'보기'">보기</button></div>` +
      f.help(helpText),
  );

export default ({ A, R }) => {
  const form = ui.formGroup(
    "새 비밀번호 설정",
    pw("현재 비밀번호", "whale-2026!", "current-password", "지금 쓰고 있는 비밀번호를 입력하세요"),
    pw("새 비밀번호", "hangang-0922#", "new-password", "영문·숫자·특수문자 각 1자 이상 8~20자 · 아이디·현재 비밀번호와 달라야 함 · 특수문자는 ! @ # $ % ^ &amp; * ( ) - _ = + [ ] { } ? 만, 공백 불가"),
    pw("새 비밀번호 확인", "hangang-0922#", "new-password", "새 비밀번호를 한 번 더 입력하세요"),
    f.help("현재 비밀번호를 모르면 로그아웃한 뒤 로그인 화면의 비밀번호 찾기를 이용하세요."),
    `<div class="flex justify-end">${ui.button("비밀번호 변경")}</div>`,
  );

  const body = ui.detailBody(`<div class="w-[560px]">${form}</div>`);
  return { title: "비밀번호 변경", html: ui.erpFrame({ header: erpHeader(A, R), title: "비밀번호 변경", body }) };
};
