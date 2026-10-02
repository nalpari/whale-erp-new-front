// 회원 탈퇴. 목업 docs/mockup/mypage/withdraw.html 의 기본 상태(조건 모두 충족)를 BP 마스터로 본 것.
// 화면에 들어오면 비밀번호 확인 창이 먼저 뜬다. 맞으면 닫히고 탈퇴 화면을 쓴다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as f from "../../biz-form.mjs";
import { BP, erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const pwId = x.dialogId();
  const confirmId = x.dialogId();
  const doneId = x.dialogId();
  const notice = (title, text, danger) =>
    `<div class="rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[16px] text-[14px]"><p class="font-semibold ${danger ? "text-[#e93737]" : "text-erp-ink"}">${title}</p><p class="mt-[6px] leading-[1.6] text-erp-ink">${text}</p></div>`;

  const warn = notice(
    "탈퇴하면 웨일ERP 를 더 이상 이용할 수 없습니다",
    `${BP.name}의 이용이 끝나고, 같은 BP 의 관리자·가맹 계정 <b class="font-semibold">6개</b>도 함께 탈퇴되어 로그인할 수 없게 됩니다. 모든 계정의 이름·연락처·이메일과 대표자 연락처·이메일은 바로 지우고 아이디만 남깁니다. 직원·계약·정산 기록과 변경 이력은 보존 정책대로 보존합니다. 탈퇴한 계정은 되살릴 수 없습니다.`,
    true, // #e93737: DESIGN.md 의 위험 글자색
  );

  const muted = (t) => `<span class="text-erp-label">${t}</span>`;
  const conditions = ui.dataTable(
    [{ header: "조건", width: "w-[240px]" }, { header: "내용", align: "left" }, { header: "상태", width: "w-[120px]" }],
    [
      ["부가서비스 구독 해지", muted("1차 범위 밖 — 1차에서는 확인하지 않습니다."), muted("1차 범위 밖")],
      ["미정산 금액 없음", muted("1차 범위 밖 — 1차에서는 확인하지 않습니다."), muted("1차 범위 밖")],
      ["진행 중인 근로계약 없음", "진행 중인 근로계약이 없습니다.", ui.badge("on", "충족")],
    ],
  );

  const reason = ui.formGroup(
    "탈퇴 사유",
    ui.field(
      f.req("탈퇴 사유"),
      `<div class="w-[360px]">${ui.select(["탈퇴 사유를 선택하세요", "폐업·사업 종료", "다른 서비스 이용", "비용 부담", "기능 부족", "이용이 어려움", "직접입력"])}</div>` +
        f.help("선택지는 공통코드 ‘탈퇴 사유’에서 가져옵니다."),
    ),
    ui.field(
      "상세 사유 (선택 · 직접입력을 고르면 필수)",
      ui.textarea({ rows: 4, maxlength: 500, placeholder: "직접입력을 고른 경우 탈퇴 사유를 적어 주세요. 그 밖에는 서비스 개선에 참고하겠습니다." }) +
        f.help("직접입력을 고르면 상세 사유를 적어야 회원 탈퇴 버튼이 켜집니다."),
    ),
  );

  const cancel = ui.button("취소", { variant: "off", "data-close": true });
  const dialogs =
    x.dialog(
      pwId,
      "비밀번호 확인",
      `<p>회원 탈퇴를 하려면 현재 비밀번호를 입력해 주세요.</p><div class="mt-[12px]">${ui.field("현재 비밀번호", ui.textField({ type: "password", value: "whale-2026!", autocomplete: "current-password" }))}</div>`,
      ui.button("취소", { variant: "off", href: link(R, "mypage/profile.html") }) + ui.button("확인", { "data-close": true }),
    ) +
    x.dialog(
      confirmId,
      "회원 탈퇴",
      `<p>회원 탈퇴 시 웨일ERP를 더 이상 이용할 수 없습니다. 탈퇴하시겠습니까?</p><p class="mt-[6px] text-erp-label">같은 BP 의 다른 관리자 계정 6개도 함께 탈퇴되어 개인정보가 지워지고, 점포 11개가 폐점으로 바뀝니다.</p>`,
      cancel + ui.button("회원 탈퇴", { "data-close": true, "data-dialog": doneId }),
    ) +
    x.dialog(doneId, "회원 탈퇴가 완료되었습니다.", `<p class="text-erp-label">등록한 이메일로 탈퇴 완료 안내를 보냈습니다. 웨일ERP 첫 화면으로 이동합니다.</p>`, ui.button("확인", { href: link(R, "home/index.html") }));

  const body = ui.detailBody(
    warn +
      `<div class="flex flex-col gap-[12px]">${ui.sectionHead(`탈퇴 조건<span class="ml-[10px] inline-flex align-middle">${ui.badge("on", "모두 충족")}</span>`)}${conditions}</div>` +
      notice("점포 11개가 폐점으로 바뀝니다", "점포는 탈퇴를 막는 조건이 아닙니다. 탈퇴를 처리하면서 운영·미운영 점포를 폐점 조건 확인 없이 모두 폐점으로 바꿉니다.") +
      reason +
      f.formButtons(ui.button("취소", { variant: "off", href: link(R, "mypage/profile.html") }), x.dialogTrigger("회원 탈퇴", confirmId)) +
      dialogs +
      `<script>document.getElementById("${pwId}").showModal()</script>`,
  );

  return { title: "회원 탈퇴", html: ui.erpFrame({ header: erpHeader(A, R), title: "회원 탈퇴", body }) };
};
