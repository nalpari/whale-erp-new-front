// BP 관리자 수정. 목업 docs/mockup/config/admins-edit.html 의 기본 상태(hghr 이서아 · 일반)를 BP 마스터로 본 것.
// 목업대로 별도 화면이다. 제목 줄의 [취소][저장]은 폼 아래 버튼 줄로 내렸다. 가맹 마스터 미사용 확인창은 기본 상태가 아니라 뺐다.
import * as ui from "../../ui.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const detail = link(R, "config/admins-detail.html");

  const basic = ui.formGroup(
    `기본정보${c.sub("* 표시가 필수")}`,
    c.row(
      ui.field("아이디", c.stack(ui.textField({ value: "hghr", readonly: true }), c.help("아이디는 바꾸지 않습니다"))),
      ui.field(c.req("이름"), ui.textField({ value: "이서아", maxlength: 20 })),
    ),
    c.row(ui.field(c.req("휴대전화번호"), c.tel("010", "2290", "5173")), ui.field(c.req("이메일"), ui.textField({ value: "seoa.lee@hangang.co.kr", maxlength: 100 }))),
    c.row(ui.field("등록일시", ui.textField({ value: "2025-04-01 09:12", readonly: true })), ui.field("최근 로그인", ui.textField({ value: "2026-09-20 17:55", readonly: true }))),
  );

  const role = ui.formGroup(
    "계정 역할",
    c.row(
      ui.field("계정 역할", ui.textField({ value: "BP 관리자", readonly: true })),
      ui.field(
        "권한 그룹",
        c.stack(
          ui.select(["운영 총괄 · BA000003", "인사 담당 · BA000004", "정산 조회 · BA000005", "고객응대 · BA000006", "점포 조회 전용 · BA000007"], { value: "인사 담당 · BA000004" }),
          c.help("바꾸면 다음 요청부터 새 권한으로 판정합니다."),
        ),
      ),
    ),
    `<p class="text-[13px]">${ui.link("권한 그룹 구성은 BP 권한 그룹 관리에서", link(R, "config/roles.html"))}</p>`,
  );

  const stores = ui.formGroup(
    `점포 매핑${c.sub("수정자 범위 · 전체 점포 11개점")}`,
    c.row(ui.field("범위", c.stack(ui.select(["전체 점포", "일부 점포"], { value: "일부 점포" }), c.help("아래에서 고른 점포만 관리합니다."))), c.blank),
    c.storePicker(A, {
      pool: "㈜한강상회 전체 11개점 중에서",
      hint: "칸을 누르면 고를 수 있는 점포가 펼쳐지고, 글자를 넣으면 좁혀집니다. 고르면 아래 선택한 점포에 더해집니다.",
      picked: [
        ["모리커피 서초점", "ST000001", "일반점포"],
        ["모리커피 성수점", "ST000002", "일반점포"],
        ["온기식당 판교점", "ST000003", "일반점포"],
        ["온기식당 광화문점", "ST000004", "일반점포"],
      ],
    }),
  );

  const state = ui.formGroup("계정 상태", c.row(ui.field(c.req("계정 상태"), ui.select(["사용", "미사용"])), c.blank));

  const body = ui.detailBody(
    ui.sectionHead(`관리자 수정${c.sub("이서아 · hghr · BP 관리자")}`) +
      basic +
      role +
      stores +
      state +
      c.buttons(ui.button("취소", { variant: "off", href: detail }), ui.button("저장", { href: detail })),
  );

  return { title: "관리자 수정", html: ui.erpFrame({ header: erpHeader(A, R), title: "BP 관리자 관리", body }) };
};
