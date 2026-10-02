// 근로계약 상세. 목업 docs/mockup/staff/contracts-detail.html(유하람 · 거부)을 BP 마스터로 본 것. 내용은 고치지 않고 상태와 이력을 본다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  const resendId = x.dialogId();

  // 화면 제목은 메뉴 이름(근로계약 관리), 본문 첫 줄에 「근로계약 상세」 + 목록(직원 상세와 같은 틀, 2026-10-02 재영)
  const head = `<div class="flex items-center gap-[6px]"><h2 class="flex-1 text-[18px] font-semibold text-erp-ink">근로계약 상세</h2>${ui.button("목록", { href: L("staff/contracts.html") })}</div>`;
  const refused = p.band("유하람 님이 09-02 에 날인을 거부했습니다", {
    tone: "risk",
    desc: "거부 사유 — “근무 시작 시각이 면접 때 이야기한 것과 다릅니다. 11시가 아니라 13시로 알고 있었습니다.”",
    actions: ui.button("조건 고쳐 새 계약", { variant: "soft", href: L("staff/contracts-new.html") }) + x.dialogTrigger("그대로 재발송", resendId),
  });

  const content = p.section(
    "계약 내용",
    ui.button("원본 내려받기", { variant: "off" }) +
      ui.button("날인본 내려받기", { variant: "off", disabled: true, title: "종이 계약일 때만 쓴다" }),
    ui.detailTable("파트타이머 근로계약", [
      ["직원", ui.detailValues(["유하람", "010-2093-8875"])],
      ["근무지", "모리커피 연남점"],
      ["고용 형태", "파트타이머"],
      ["계약 기간", "2026-08-28 ~ 2027-02-27"],
      ["시급", "10,800"],
      ["소정근로시간", ui.detailValues(["주 15.0시간", "월·수·금 11:00-16:00", `<span class="text-erp-label">휴게 12:00-13:00</span>`])],
      ["주휴일", "일요일"],
      ["임금지급일", "익월 10일"],
      ["4대보험", "고용보험 · 산재보험 · 국민연금 · 건강보험"],
      ["근무 장소", "서울 마포구 연남로 32, 1층"],
    ]),
  );
  const history = p.section(
    "상태 변경 이력",
    p.tag("quiet", "3건"),
    ui.dataTable(
      [{ header: "일시", width: "w-[120px]" }, { header: "변경 전", width: "w-[120px]" }, { header: "변경 후", width: "w-[120px]" }, { header: "처리 주체", align: "left" }],
      [
        ["09-02 19:44", p.tag("warn", "서명 대기"), p.tag("risk", "거부"), "유하람 · 직원 근무 앱"],
        ["08-28 09:31", p.tag("quiet", "발송 대기"), p.tag("warn", "서명 대기"), p.sub("시스템 · 가입 완료로 자동 발송")],
        ["08-28 09:31", "-", p.tag("quiet", "발송 대기"), "정하윤 · 초안 저장"],
      ],
    ),
  );
  const progress = p.section(
    "진행",
    "",
    p.steps([
      ["done", "초안 저장", "08-28 09:31 · 정하윤"],
      ["done", "계약서 자동 발송", "08-28 09:31 · 날인 기한 09-27"],
      ["now", "직원 날인 거부", "09-02 19:44 · 담당 관리자에게 이메일·알림 발송됨"],
    ]),
    ui.detailTable("발송", [
      ["계약 방식", p.tag("quiet", "전자계약")],
      ["발송일", "2026-08-28"],
      ["날인 기한", "2026-09-27"],
      ["최종 처리일", "2026-09-02"],
      ["재발송 횟수", "0"],
    ]),
  );

  const resendDialog = x.dialog(
    resendId,
    "그대로 재발송하시겠습니까?",
    "같은 조건의 계약서를 유하람 님에게 다시 보냅니다. 날인 기한은 발송일로부터 30일입니다.",
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("재발송", { "data-close": true }),
  );
  const body = ui.detailBody(`<div class="flex flex-col gap-[12px]">${head}${refused}</div>${p.cols(content + history, progress)}${resendDialog}`);
  return { title: "근로계약 상세", html: ui.erpFrame({ header: erpHeader(A, R), title: "근로계약 관리", body }) };
};
