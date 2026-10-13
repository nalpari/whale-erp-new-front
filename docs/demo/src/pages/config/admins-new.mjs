// BP 관리자 등록. 목업 docs/mockup/config/admins-new.html 의 기본 상태(입력 · BP 관리자 · 전체 점포)를 BP 마스터로 본 것.
// 제목 줄의 [취소][등록]은 폼 아래 버튼 줄로 내렸다.
// 목록(config/admins.html)에서 슬라이드 패널로 연다(BP 마스터 계정 관리와 같다) — 전체 화면은 그대로 두고 직접 들어와도 쓸 수 있게 둔다.
import * as ui from "../../ui.mjs";
import * as c from "../../config-parts.mjs";
import { erpHeader, link, STORES } from "../../site.mjs";

export function adminNewBody(A, R, { panel = false } = {}) {
  // 패널(464px)에서는 두 칸 줄을 한 칸씩 세로로 쌓는다
  const row = panel ? (...cells) => cells.filter((x) => x !== c.blank).join("") : c.row;

  const basic = ui.formGroup(
    "기본정보",
    row(
      ui.field(
        c.req("아이디"),
        ui.textField({ value: "hgcs", maxlength: 20, placeholder: "영문 또는 영문·숫자 조합으로 4~20자 입력해 주세요." }),
      ),
      ui.field(c.req("이름"), ui.textField({ value: "문가은", maxlength: 20, placeholder: "한글 또는 영문 2~20자" })),
    ),
    row(
      ui.field(c.req("휴대전화번호"), c.tel("010", "3308", "6214")),
      ui.field(c.req("이메일"), ui.textField({ value: "gaeun.moon@hangang.co.kr", maxlength: 100 })),
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
    "대상 점포",
    row(ui.field(c.req("범위"), ui.select(["전체 점포", "일부 점포"], { value: "일부 점포", "data-spick-scope": true })), c.blank),
    // 수정 화면의 대상 점포와 같다 — 범위가 전체 점포면 숨는다(erp.js)
    c.storePicker(A, {
      clearLabel: "전체 제거",
      bulk: [...STORES].sort((a, b) => a[0].localeCompare(b[0])).map(([code, name, type]) => [name, code, type]),
      picked: [],
    }),
  );

  const cancel = panel ? ui.button("취소", { variant: "off", "data-close": true }) : ui.button("취소", { variant: "off", href: link(R, "config/admins.html") });
  // 저장하면 상세 화면이 아니라 상세 슬라이드로 간다 — 패널은 등록 패널을 닫고 상세 패널을 열고(erp.js data-save-panel),
  // 전체 화면은 목록으로 가서 상세 패널을 연다(?panel=).
  const save = panel
    ? ui.button("저장", { "data-save-panel": "admin-detail-panel" })
    : ui.button("저장", { href: `${link(R, "config/admins.html")}?panel=admin-detail-panel` });
  return basic + role + stores + c.band("초기 비밀번호는 등록 이메일로 갑니다") + c.buttons(cancel, save);
}

export function adminNewPanel(A, R) {
  return ui.slidePanel("admin-new-panel", "관리자 등록", ui.sectionHead("관리자 등록") + adminNewBody(A, R, { panel: true }));
}

export default ({ A, R }) => {
  const body = ui.detailBody(ui.sectionHead("관리자 등록") + adminNewBody(A, R));
  return { title: "관리자 등록", html: ui.erpFrame({ header: erpHeader(A, R), title: "BP 관리자 관리", body }) };
};
