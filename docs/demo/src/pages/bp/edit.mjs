// BP 마스터 계정 수정. 목업 docs/mockup/bp/edit.html 의 기본 상태(㈜한강상회 · 사용 · 인증된 BP)를 플랫폼 관리자로 본 것.
// 상세(bp/detail.html)에서 슬라이드 패널로 연다(2026-10-06 피드백) — 전체 화면은 그대로 두고 직접 들어와도 쓸 수 있게 둔다.
import * as ui from "../../ui.mjs";
import * as f from "../../biz-form.mjs";
import { BP, platformHeader, link } from "../../site.mjs";

export function bpEditBody(A, R, { panel = false } = {}) {
  const detail = link(R, "bp/detail.html");

  const status = ui.formGroup(
    "BP 상태",
    `<div class="flex items-center gap-[10px]">${ui.badge("on", "사용")}<span class="text-[13px] text-erp-label">2025-02-03 11:12 부터</span></div>` +
      f.help(`상태는 여기서 바꾸지 않습니다. ${ui.link("BP 마스터 계정 상세", detail)}의 ‘BP 상태 변경’에서 사용·미사용을 바꿉니다. 탈퇴는 BP 마스터가 MY PAGE 에서 직접 회원 탈퇴할 때만 생깁니다.`),
  );

  const basic = ui.formGroup(
    "BP 마스터 기본정보",
    ui.formRow(
<<<<<<< Updated upstream
      ui.field("BP 코드", ui.textField({ value: BP.code, disabled: true })),
      ui.field("아이디", ui.textField({ value: "hangang01", disabled: true })),
      ui.field("가입경로", ui.textField({ value: "회원가입", disabled: true })),
    ),
    ui.field(f.req("이름"), ui.textField({ value: "정하윤" })),
    f.group(f.req("연락처"), f.tel("010", "4821", "7730")),
    ui.field(f.req("이메일"), ui.textField({ value: "hayoon@hangang.co.kr" }) + f.help("형식과 중복만 검사하고 소유 인증은 하지 않습니다.")),
=======
      ui.field("BP 코드", ui.textField({ value: BP.code, readonly: true })),
      ui.field("아이디", ui.textField({ value: "hangang01", readonly: true })),
      ui.field("가입경로", ui.textField({ value: "회원가입", readonly: true })),
    ),
    // 이메일 칸 아래 안내 줄 때문에 칸들이 세로 가운데로 어긋나지 않게 위쪽에 맞춘다
    ui.formRow(
      ui.field(f.req("이름"), ui.textField({ value: "정하윤" })),
      f.group(f.req("연락처"), f.tel("010", "4821", "7730")),
      ui.field(f.req("이메일"), ui.textField({ value: "hayoon@hangang.co.kr" }) + f.help("형식과 중복만 검사하고 소유 인증은 하지 않습니다.")),
    ).replace('class="flex w-full gap-[6px]"', 'class="flex w-full items-start gap-[6px]"'),
>>>>>>> Stashed changes
  );

  const biz = ui.formGroup(
    `${f.titleBadge("BP 사업자정보", "on", "인증완료")}<span class="ml-[10px] text-[13px] font-normal text-erp-label">최종 인증 2026-03-04 10:20</span>`,
    f.help("국세청 API로 사업자등록번호·대표자명·개업일자의 진위만 확인합니다. 인증 결과는 저장을 눌러야 반영됩니다. 상호명은 이 인증으로 채워지지 않습니다."),
    f.bizAuth(A, "ebiz", { start: "done", values: ["211-87-01234", "남도현", "2021-03-15"], input: ["211-87-40981", "남도현", "2026-09-01"] }),
    f.help("세 값은 직접 고칠 수 없고 재인증을 통과해야 바뀝니다. 바꾼 사업자등록번호도 다른 BP 와 겹치는지 검사합니다."),
    ui.field(f.req("상호명"), ui.textField({ value: BP.name, maxlength: 50 })),
    f.group("대표자 연락처", f.tel("010", "5530", "1182")),
    ui.field("대표자 이메일", ui.textField({ value: "ceo@hangang.co.kr" })),
    f.address(A, "사업자주소", { zip: "04007", base: "서울 마포구 망원로 42", detail: "3층" }),
    ui.formRow(ui.field("업태", ui.textField({ value: "도소매업", maxlength: 50 })), ui.field("종목", ui.textField({ value: "식자재 유통", maxlength: 50 }))),
  );

  const cancel = panel ? ui.button("닫기", { variant: "off", "data-close": true }) : ui.button("취소", { variant: "off", href: detail });
  return (
    status +
    basic +
    biz +
    f.help("정보를 고칠 때 사유는 받지 않습니다. 저장하면 바뀐 항목마다 변경 전후 값이 상세의 변경 이력에 쌓입니다. 여럿이 같은 BP 를 고치면 마지막에 저장한 내용이 남습니다.") +
    f.formButtons(cancel, ui.button("저장", { href: detail })) +
    f.SWAP_SCRIPT
  );
}

export function bpEditPanel(A, R) {
  return ui.slidePanel(
    "bp-edit-panel",
    "BP 마스터 계정 수정",
    ui.sectionHead(`BP 마스터 계정 수정 <span class="text-[14px] font-medium text-erp-label">${BP.code} · ${BP.name}</span>`) + bpEditBody(A, R, { panel: true }),
  );
}

export default ({ A, R }) => {
  const body = ui.detailBody(
    ui.sectionHead(`BP 마스터 계정 수정 <span class="text-[14px] font-medium text-erp-label">${BP.code} · ${BP.name}</span>`) + bpEditBody(A, R),
  );
  return { title: "BP 마스터 계정 수정", html: ui.erpFrame({ header: platformHeader(A, R), title: "BP 마스터 계정 관리", body }) };
};
