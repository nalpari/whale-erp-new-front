// BP 마스터 계정 등록. 목업 docs/mockup/bp/new.html 의 기본 상태(입력 중 · 인증 안 함)를 플랫폼 관리자로 본 것.
// 목록(bp/index.html)에서 슬라이드 패널로 연다(2026-10-06 피드백) — 전체 화면은 그대로 두고 직접 들어와도 쓸 수 있게 둔다.
import * as ui from "../../ui.mjs";
import * as f from "../../biz-form.mjs";
import { platformHeader, link } from "../../site.mjs";

export function bpNewBody(A, R, { panel = false } = {}) {
  const basic = ui.formGroup(
    "BP 마스터 기본정보",
    ui.field(f.req("아이디"), ui.textField({ value: "bakerylab", placeholder: "영문 또는 영문·숫자 조합으로 4~20자 입력해 주세요." }) + f.help("등록한 뒤에는 바꿀 수 없습니다.")),
    ui.field(f.req("이름"), ui.textField({ value: "오세린" })),
    f.group(f.req("연락처"), f.tel("010", "2291", "7730")),
    ui.field(f.req("이메일"), ui.textField({ value: "serin@breadlab.kr" }) + f.help("초기 비밀번호가 이 주소로 갑니다.")),
    f.help("이 화면에서는 약관 동의를 받지 않습니다. 등록한 BP 마스터가 첫 로그인 때 비밀번호를 바꾸면서 이용약관과 개인정보 수집·이용에 동의합니다. 권한 그룹은 BP 마스터 기본 권한으로 정해집니다."),
  );

  const biz = ui.formGroup(
    "BP 사업자정보",
    f.help("국세청 API로 사업자등록번호·대표자명·개업일자의 진위만 확인합니다."),
    f.bizAuth(A, "pbiz", {
      values: ["214-88-10555", "오세린", "2026-08-20"],
      confirmReauth:
        '<p>지금 인증한 사업자등록번호·대표자명·개업일자가 지워지고 인증 전으로 돌아갑니다.</p><p class="mt-[6px] text-erp-label">기본정보와 상호명, 아래에 적은 사업자정보는 그대로 둡니다. 다시 인증하지 않고 등록해도 됩니다.</p>',
    }),
    ui.field(f.req("상호명"), ui.textField({ value: "브레드랩 2호", maxlength: 50, placeholder: "50자 이내로 입력해 주세요." })),
    f.group("대표자 연락처", f.tel()),
    ui.field("대표자 이메일", ui.textField()),
    f.address(A, "사업자주소"),
    ui.formRow(ui.field("업태", ui.textField({ value: "제과점업", maxlength: 50 })), ui.field("종목", ui.textField({ value: "베이커리", maxlength: 50 }))),
  );

  const cancel = panel ? ui.button("닫기", { variant: "off", "data-close": true }) : ui.button("취소", { variant: "off", href: link(R, "bp/index.html") });
  return basic + biz + f.formButtons(cancel, ui.button("등록", { href: link(R, "bp/detail.html") })) + f.SWAP_SCRIPT;
}

export function bpNewPanel(A, R) {
  return ui.slidePanel("bp-new-panel", "BP 마스터 계정 등록", ui.sectionHead("BP 마스터 계정 등록") + bpNewBody(A, R, { panel: true }));
}

export default ({ A, R }) => {
  const body = ui.detailBody(ui.sectionHead("BP 마스터 계정 등록") + bpNewBody(A, R));
  return { title: "BP 마스터 계정 등록", html: ui.erpFrame({ header: platformHeader(A, R), title: "BP 마스터 계정 관리", body }) };
};
