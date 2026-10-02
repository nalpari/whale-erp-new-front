// BP 관리자 등록. 목업 docs/mockup/config/admins-new.html 의 기본 상태(입력 · BP 관리자 · 전체 점포)를 BP 마스터로 본 것.
// 목업대로 별도 화면이다. 제목 줄의 [취소][등록]은 폼 아래 버튼 줄로 내렸다.
import * as ui from "../../ui.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const basic = ui.formGroup(
    `기본정보${c.sub("네 항목 모두 필수")}`,
    c.row(
      ui.field(c.req("아이디"), c.stack(ui.textField({ value: "hgcs", maxlength: 20 }), c.help("영문 또는 영문·숫자 4~20자 · 등록 뒤에는 바꾸지 못합니다"))),
      ui.field(c.req("이름"), c.stack(ui.textField({ value: "문가은", maxlength: 20 }), c.help("한글 또는 영문 2~20자"))),
    ),
    c.row(
      ui.field(c.req("휴대전화번호"), c.stack(c.tel("010", "3308", "6214"), c.help("세 칸을 합친 숫자 10~11자리"))),
      ui.field(c.req("이메일"), c.stack(ui.textField({ value: "gaeun.moon@hangang.co.kr", maxlength: 100 }), c.help("이메일 형식 · 100자 이하 · 초기 비밀번호를 받는 주소"))),
    ),
  );

  const role = ui.formGroup(
    "계정 역할",
    c.row(
      ui.field(c.req("계정 역할"), c.stack(ui.select(["BP 관리자", "가맹 마스터"]), c.help("가맹 관리자는 가맹 마스터만 등록해 여기 없습니다."))),
      ui.field(
        c.req("권한 그룹"),
        c.stack(
          ui.select(["운영 총괄 · BA000003", "인사 담당 · BA000004", "정산 조회 · BA000005", "고객응대 · BA000006", "점포 조회 전용 · BA000007"], { value: "고객응대 · BA000006" }),
          c.help("BP 관리자 그룹이 모두 나옵니다 — 권한 그룹에는 사용 상태가 없습니다."),
        ),
      ),
    ),
    `<p class="text-[13px]">${ui.link("권한 그룹 구성은 BP 권한 그룹 관리에서", link(R, "config/roles.html"))}</p>`,
  );

  const stores = ui.formGroup(
    `관리 점포${c.sub("등록자 범위 · 전체 점포 11개점")}`,
    c.row(ui.field(c.req("범위"), c.stack(ui.select(["전체 점포", "일부 점포"]), c.help("㈜한강상회의 모든 점포를 관리합니다."))), c.blank),
  );

  const body = ui.detailBody(
    ui.sectionHead("관리자 등록") +
      basic +
      role +
      stores +
      c.band("초기 비밀번호는 등록 이메일로 갑니다") +
      c.buttons(ui.button("취소", { variant: "off", href: link(R, "config/admins.html") }), ui.button("등록", { href: link(R, "config/admins-detail.html") })),
  );

  return { title: "관리자 등록", html: ui.erpFrame({ header: erpHeader(A, R), title: "BP 관리자 관리", body }) };
};
