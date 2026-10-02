// 가입 연결 확인. 목업 docs/mockup/staff/invites-holds.html 의 기본 상태(하준서 번호 불일치 선택)를 BP 마스터로 본 것.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  const approveId = x.dialogId();
  const reinviteId = x.dialogId();

  const head = ui.sectionHead(
    `보류 중인 가입 <span class="pl-[6px] text-[14px] font-normal text-erp-label">보류 중 <b class="font-semibold text-erp-ink">2</b>건 · 최장 <b class="font-semibold text-erp-ink">4</b>일 경과</span>`,
    ui.button("목록", { href: L("staff/index.html") }),
  );
  const list = p.section(
    "보류 목록",
    p.tag("risk", "2건"),
    p.bar(p.radios("hold-reason", ["전체", "번호 불일치", "이름 불일치"])),
    ui.dataTable(
      [
        { header: "초안의 직원", width: "w-[120px]", align: "left" },
        { header: "점포" },
        { header: "초대 발송", width: "w-[100px]" },
        { header: "사유", width: "w-[130px]" },
        { header: "", width: "w-[110px]" },
      ],
      [
        ["하준서", "모리커피 성수점", "08-31", p.tag("risk", "번호 불일치"), ui.button("확인", { variant: "off" })],
        ["정유담", "온기식당 판교점", "09-02", p.tag("warn", "이름 불일치"), ui.button("확인", { variant: "off" })],
      ],
      "보류 중인 가입이 없습니다.",
    ),
  );
  const selected = p.section(
    "하준서 · 번호 불일치",
    p.tag("risk", "4일 경과"),
    ui.detailTable("가입 정보", [
      ["초안에 적은 번호", "010-3392-4418"],
      ["가입자가 인증한 번호", "010-****-4418"],
      ["가입자 실명", p.sub("표시하지 않음")],
      ["다른 소속", p.sub("표시하지 않음")],
      ["초대 발송", "2026-08-31 09:12"],
      ["가입 완료", "2026-08-31 21:40"],
    ]),
    `<div class="flex justify-end gap-[6px]">${x.dialogTrigger("번호 수정 후 재초대", reinviteId, "soft")}${x.dialogTrigger("이 계정으로 연결 승인", approveId)}</div>`,
  );

  const dialogs =
    x.dialog(
      approveId,
      "이 계정으로 연결하시겠습니까?",
      "하준서 님의 직원 레코드에 이 계정을 연결하고, 멈춰 있던 근로계약서를 발송합니다.",
      ui.button("취소", { variant: "off", "data-close": true }) + ui.button("연결 승인", { "data-close": true }),
    ) +
    x.dialog(
      reinviteId,
      "번호 수정 후 재초대",
      ui.field("휴대전화번호", ui.textField({ value: "010-3392-4418", inputmode: "tel" })),
      ui.button("취소", { variant: "off", "data-close": true }) + ui.button("재초대", { "data-close": true }),
    );
  const body = ui.detailBody(
    `<div class="flex flex-col gap-[12px]">${head}</div>${p.cols(list, selected)}${dialogs}`,
  );
  return { title: "가입 연결 확인", html: ui.erpFrame({ header: erpHeader(A, R), title: "가입 연결 확인", body }) };
};
