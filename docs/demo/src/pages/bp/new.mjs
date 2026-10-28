// BP 마스터 계정 등록. 목업 docs/mockup/bp/new.html 의 기본 상태(입력 중 · 인증 안 함)를 플랫폼 관리자로 본 것.
// 목록(bp/index.html)에서 슬라이드 패널로 연다(2026-10-06 피드백) — 전체 화면은 그대로 두고 직접 들어와도 쓸 수 있게 둔다.
import * as ui from "../../ui.mjs";
import * as f from "../../biz-form.mjs";
import { platformHeader, link } from "../../site.mjs";
import { bizAuthBox, bizRest } from "./edit.mjs";

export function bpNewBody(A, R, { panel = false } = {}) {
  const basic = ui.formGroup(
    "BP 마스터 기본정보",
    ui.field(f.req("아이디"), ui.textField({ value: "bakerylab", placeholder: "영문 또는 영문·숫자 조합으로 4~20자 입력해 주세요." }) + f.help("등록한 뒤에는 바꿀 수 없습니다.")),
    ui.field(f.req("이름"), ui.textField({ value: "오세린" })),
    f.group(f.req("연락처"), f.tel("010", "2291", "7730")),
    ui.field(f.req("이메일"), ui.textField({ value: "serin@breadlab.kr" }) + f.help("초기화 비밀번호가 이 주소로 갑니다.")),
    // 등록 안내는 한 줄(앱 bp-master-form-panel.tsx, 2026-10-28 사용자 지정 — 권한 그룹 · 약관 동의 안내 삭제)
    f.help("초기화 비밀번호는 등록한 이메일로 발송됩니다."),
  );

  // 사업자정보 — MY PAGE 와 같은 모양(인증 상자 + 상호명 등 상자), 「기본정보와 동일」은 꺼진 채(앱과 같다, 2026-10-28 사용자 지정)
  const biz =
    `<div class="flex flex-col gap-[18px]">` +
    bizAuthBox(A, { locked: false }) +
    bizRest(A, "pbiz", { tradeName: "브레드랩 2호", same: false, category: "제과점업", item: "베이커리" }) +
    `</div>`;

  const cancel = panel ? ui.button("취소", { variant: "off", "data-close": true }) : ui.button("취소", { variant: "off", href: link(R, "bp/index.html") });
  return basic + biz + f.formButtons(cancel, ui.button("등록", { href: link(R, "bp/detail.html") })) + f.SWAP_SCRIPT;
}

export function bpNewPanel(A, R) {
  return ui.slidePanel("bp-new-panel", "BP 마스터 계정 등록", ui.sectionHead("BP 마스터 계정 등록") + bpNewBody(A, R, { panel: true }));
}

export default ({ A, R }) => {
  const body = ui.detailBody(ui.sectionHead("BP 마스터 계정 등록") + bpNewBody(A, R));
  return { title: "BP 마스터 계정 등록", html: ui.erpFrame({ header: platformHeader(A, R), title: "BP 마스터 계정 관리", body }) };
};
