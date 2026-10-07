// BP 관리자 등록. 목업 docs/mockup/config/admins-new.html 의 기본 상태(입력 · BP 관리자 · 전체 점포)를 BP 마스터로 본 것.
// 제목 줄의 [취소][등록]은 폼 아래 버튼 줄로 내렸다.
// 목록(config/admins.html)에서 슬라이드 패널로 연다(BP 마스터 계정 관리와 같다) — 전체 화면은 그대로 두고 직접 들어와도 쓸 수 있게 둔다.
import * as ui from "../../ui.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export function adminNewBody(A, R, { panel = false } = {}) {
  // 패널(464px)에서는 두 칸 줄을 한 칸씩 세로로 쌓는다
  const row = panel ? (...cells) => cells.filter((x) => x !== c.blank).join("") : c.row;

  const basic = ui.formGroup(
    `기본정보${c.sub("네 항목 모두 필수")}`,
    row(
      ui.field(
        c.req("아이디"),
        c.stack(ui.textField({ value: "hgcs", maxlength: 20, placeholder: "영문 또는 영문·숫자 조합으로 4~20자 입력해 주세요." }), c.help("등록 뒤에는 바꾸지 못합니다")),
      ),
      ui.field(c.req("이름"), c.stack(ui.textField({ value: "문가은", maxlength: 20 }), c.help("한글 또는 영문 2~20자"))),
    ),
    row(
      ui.field(c.req("휴대전화번호"), c.tel("010", "3308", "6214")),
      ui.field(c.req("이메일"), c.stack(ui.textField({ value: "gaeun.moon@hangang.co.kr", maxlength: 100 }), c.help("이메일 형식 · 100자 이하 · 초기 비밀번호를 받는 주소"))),
    ),
  );

  // 계정 역할 · 권한 그룹 — 안내 문구 없이. 패널에서는 다른 칸처럼 한 칸씩 세로로 쌓는다
  const role = ui.formGroup(
    "계정 역할",
    row(
      ui.field(c.req("계정 역할"), ui.select(["BP 관리자", "가맹 마스터"])),
      ui.field(
        c.req("권한 그룹"),
        ui.select(["운영 총괄 · BA000003", "인사 담당 · BA000004", "정산 조회 · BA000005", "고객응대 · BA000006", "점포 조회 전용 · BA000007"], { value: "고객응대 · BA000006" }),
      ),
    ),
  );

  const stores = ui.formGroup(
    `관리 점포${c.sub("등록자 범위 · 전체 점포 11개점")}`,
    row(ui.field(c.req("범위"), c.stack(ui.select(["전체 점포", "일부 점포"]), c.help("㈜한강상회의 모든 점포를 관리합니다."))), c.blank),
  );

  const cancel = panel ? ui.button("닫기", { variant: "off", "data-close": true }) : ui.button("취소", { variant: "off", href: link(R, "config/admins.html") });
  return basic + role + stores + c.band("초기 비밀번호는 등록 이메일로 갑니다") + c.buttons(cancel, ui.button("저장", { href: link(R, "config/admins-detail.html") }));
}

export function adminNewPanel(A, R) {
  return ui.slidePanel("admin-new-panel", "관리자 등록", ui.sectionHead("관리자 등록") + adminNewBody(A, R, { panel: true }));
}

export default ({ A, R }) => {
  const body = ui.detailBody(ui.sectionHead("관리자 등록") + adminNewBody(A, R));
  return { title: "관리자 등록", html: ui.erpFrame({ header: erpHeader(A, R), title: "BP 관리자 관리", body }) };
};
