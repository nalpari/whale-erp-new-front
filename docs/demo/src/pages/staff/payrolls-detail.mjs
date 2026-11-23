// 급여명세서 상세. 목업 docs/mockup/staff/payrolls-detail.html(서지안 · 2026-08 · 작성 중 · 검토 대기)을 BP 마스터로 본 것.
// 틀은 앱 payslips/[payslipId](page.tsx · payslip-review.tsx)와 같다 — 제목 줄(제목 + 버튼) → 요약 띠 → 7:5 두 단(왼쪽 지급 · 공제 묶음, 오른쪽 둥근 확인 상자)
// (DESIGN.md 「상세 화면 틀」, 2026-11-19 사용자 지정). 표본이 정직원이라 파트타이머 명세서에만 서는 3.3% 원천징수 스위치와 칸은 넣지 않았다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  const confirmId = x.dialogId();
  const attendanceHref = L("staff/attendance-period.html");

  // 금액 칸(앱 AmountField) — 「직접 입력」 · 「비과세」 안내는 두지 않고, 계산값 안내는 칸 아래 황토 글자 + 둥근 꺾은선
  const HELP = "text-[12px] leading-[1.5] text-erp-muted";
  const amount = (label, value, help = "") => {
    const control = value === null ? ui.textField({ placeholder: "직접 입력", inputmode: "numeric" }) : ui.textField({ value, inputmode: "numeric" });
    const helpHtml = !help
      ? ""
      : help.includes("계산값")
        ? `<span class="flex gap-[6px] ${HELP}"><span class="flex flex-1 items-start gap-[4px] text-[#956013]"><span aria-hidden="true" class="mt-[2px] ml-[4px] size-[7px] shrink-0 rounded-bl-[4px] border-b border-l border-[#956013]"></span>${help}</span></span>`
        : `<span class="${HELP}">${help}</span>`;
    return `<div class="relative flex min-w-px flex-1 flex-col gap-[8px] self-start">${ui.field(label, control, "w-full")}${helpHtml}</div>`;
  };
  // 금액 칸은 한 줄 세 칸(칸 사이 24px)
  const rows = (...fields) => `<div class="grid grid-cols-3 gap-x-[24px] gap-y-[16px]">${fields.join("")}</div>`;
  // 지급 · 공제 묶음(앱 GroupBox) — 회색 제목 줄(42px)에 이름과 오른쪽 끝 「합계 N원」만, 스위치 · 불러오기 버튼은 몸통 맨 위 도구 줄
  const group = (title, total, { id = "", tools = "", action = "" } = {}, body = "") =>
    `<section${id ? ` id="${id}"` : ""} class="min-w-0 scroll-mt-[24px]"><div class="flex h-[42px] items-center gap-[10px] rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[16px]"><h3 class="flex-1 text-[15px] font-semibold text-erp-ink">${title}</h3><span class="flex items-baseline gap-[6px]"><span class="text-[13px] font-medium text-erp-label">합계</span><span class="text-[15px] font-semibold text-erp-ink tabular-nums">${total}원</span></span></div><div class="flex flex-col gap-[16px] rounded-b-[2px] border-x border-b border-erp-thead-line bg-white px-[16px] py-[18px]">${
      tools || action
        ? `<div class="flex min-h-[34px] items-center gap-[10px] border-b border-erp-divider pb-[16px]"><div class="flex min-w-0 flex-1 flex-wrap items-center gap-[16px]">${tools}</div>${action}</div>`
        : ""
    }${body}</div></section>`;
  const outlineAsk = (label, title, body, ok) => p.ask(label, "outline", title, body, ok);

  const head = p.detailHead(
    "급여명세서 상세",
    `<span class="flex gap-[6px]">${p.ask("임시저장", "soft", "급여명세서를 임시저장하시겠습니까?", "급여명세서의 상태는 변경되지 않으며, 수정한 내용은 처리내역에 기록됩니다.")}${x.dialogTrigger("확정", confirmId)}${ui.button("목록", { href: L("staff/payslips.html") })}</span>`,
  );
  // 요약 띠 — 성명 · 고용형태 · 급여월 · 근무지(유형 꼬리표) · 상태
  const summary = p.summaryStrip([
    ["성명", "서지안"],
    ["고용형태", "정직원"],
    ["급여월", "2026년 8월"],
    ["근무지", p.storeName("직영", "모리커피 서초점")],
    ["상태", p.tag("quiet", "작성 중")],
  ]);
  // 위쪽 경고 띠 — 건수 한 줄(앱 reviewBand). 사유 내용은 오른쪽 「검토 사유」에만 둔다
  const warn = `<div class="flex min-h-[46px] items-center gap-[12px] rounded-[2px] border border-[#e8a33d]/50 bg-[#fff6e5] px-[16px] py-[12px]"><p class="flex items-center gap-[6px] text-[14px] font-semibold text-[#956013]"><svg aria-hidden="true" viewBox="0 0 20 20" class="size-[18px] shrink-0"><path d="M10 2.5 18.5 17h-17L10 2.5Z" fill="#e8a33d" stroke="#e8a33d" stroke-width="1.2" stroke-linejoin="round"/><path d="M10 8v4" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="14.4" r="1" fill="#fff"/></svg>검토가 필요한 사유가 2건 있습니다.<span class="font-normal">오른쪽 검토 사유를 확인하고, 문제가 없으면 [확정]해 주세요.</span></p></div>`;

  const premiumHelp = p.infoTip(
    "5인 이상 사업장",
    "상시근로자가 5명 이상인 사업장은\n연장 · 야간 · 휴일 근무에 통상시급의 50%를 더해\n지급해야 합니다.\n\n4명 이하인 사업장은 선택입니다.\n단, 근로계약서에 가산수당을 지급하기로 했다면 켜 주세요.\n\n상시근로자 수는 대표자를 빼고\n파트타이머 · 일용직을 포함한 지난 1개월 평균입니다.",
  );
  const earnings = group(
    "지급 항목",
    "2,968,000",
    {
      tools: `<span role="group" aria-label="가산수당 적용" class="flex items-center gap-[6px]">${x.toggle("연장·야간·휴일 가산수당 적용(5인 이상 사업장 필수)", true)}${premiumHelp}</span>`,
      action: outlineAsk(
        "출퇴근 다시 불러오기",
        "출퇴근 기록으로 다시 계산하시겠습니까?",
        `<p>2026-08-01 ~ 08-31 출퇴근 기록을 기준으로 기본급·주휴수당·연장수당을 다시 계산합니다.</p><p class="mt-[6px]">직접 수정한 금액과 임시저장하지 않은 내용은 초기화됩니다.</p>`,
        "다시 계산",
      ),
    },
    rows(
      amount("기본급", "2,840,000", "계산값 2,840,310 을 2,840,000 으로 고침"),
      amount("주휴수당", "0", "계산값"),
      amount("연장수당", "128,000", "계산값 96,000 을 128,000 으로 고침"),
      amount("야간수당", "0"),
      amount("휴일근무수당", "0"),
      amount("추가근무수당", "0"),
      amount("연차수당", "0"),
      amount("상여", "0"),
    ),
  );
  const taxFree = group("지급 항목(비과세)", "58,000", {}, rows(amount("식대", "58,000"), amount("자가운전보조금", "0"), amount("육아수당", "0")));
  // 공제 순서는 국민연금 · 건강보험 · 장기요양보험 · 고용보험 · 소득세 · 지방소득세(앱 sortDeductions)
  const basic = group(
    "공제 항목(4대보험 · 세금)",
    "0",
    {
      id: "deduction-basic",
      action: outlineAsk(
        "지난 명세서에서 불러오기",
        "지난 명세서의 값을 불러오시겠습니까?",
        "해당 직원의 지난 급여명세서에서 공제 내역과 직접 입력한 지급 항목 금액을 불러옵니다. 불러온 내용은 임시저장해야 최종 반영됩니다.",
        "불러오기",
      ),
    },
    rows(amount("국민연금", null), amount("건강보험", null), amount("장기요양보험", null), amount("고용보험", null), amount("소득세", null), amount("지방소득세", null)),
  );
  // 공제 항목 추가 — 팝업을 닫지 않고 여러 개를 체크해 붙인다(앱 「공제 항목 추가」 체크 목록)
  const addable = ["연말(중도)정산", "연말(중도)정산 소득세", "연말(중도)정산 주민세", "건강보험정산", "장기요양보험정산", "고용보험정산", "국민연금정산", "장기요양보험산정", "퇴사자유보금", "스톡옵션"];
  const additional = group("공제 항목(추가)", "0", {
    action: outlineAsk(
      "항목 추가",
      "공제 항목 추가",
      `<ul aria-label="추가 공제 항목" class="max-h-[420px] w-[360px] max-w-full overflow-y-auto rounded-[2px] border border-erp-thead-line">${addable
        .map((name) => `<li class="flex h-[42px] items-center border-b border-erp-divider px-[12px] last:border-b-0">${ui.checkbox(A, name)}</li>`)
        .join("")}</ul>`,
      "추가",
    ),
  });
  // 맨 아래 합계 띠 — 「지급 항목 합계 − 공제 항목 합계 = 실지급액」, 회청 테두리 · 실지급액 칸만 옅은 바탕 · 22px
  const op = (sign) =>
    `<span aria-hidden="true" class="absolute top-1/2 left-0 grid size-[22px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-erp-thead-line bg-white text-[14px] leading-none text-erp-label">${sign}</span>`;
  const totals = `<div class="grid grid-cols-3 rounded-[8px] border border-erp-brand bg-white"><div class="relative flex flex-col justify-center gap-[4px] px-[24px] py-[14px]"><span class="text-[13px] font-medium text-erp-label">지급 항목 합계</span><span class="text-[17px] font-semibold text-erp-ink tabular-nums">3,026,000원</span></div><div class="relative flex flex-col justify-center gap-[4px] border-l border-erp-thead-line px-[24px] py-[14px]">${op("−")}<span class="text-[13px] font-medium text-erp-label">공제 항목 합계</span><span class="text-[17px] font-semibold text-erp-ink tabular-nums">0원</span></div><div class="relative flex flex-col items-end justify-center gap-[4px] rounded-r-[8px] border-l border-erp-thead-line bg-erp-thead-bg px-[24px] py-[14px]">${op("=")}<span class="text-[13px] font-semibold text-erp-ink">실지급액</span><span class="text-[22px] font-semibold text-erp-ink tabular-nums">3,026,000원</span></div></div>`;
  const blank = p.band("입력하지 않은 공제 항목이 6개 있습니다.", {
    tone: "risk",
    desc: "공제 항목을 모두 입력해야 급여명세서를 확정할 수 있습니다. 공제 대상이 아닌 항목에는 0을 입력해 주세요.",
  });
  const preview = `<div class="flex justify-end">${p.ask(
    "미리보기",
    "off",
    "급여명세서 미리보기",
    ui.detailTable("서지안 · 2026-08", [
      ["지급 합계", "3,026,000"],
      ["공제 합계", "0"],
      ["실지급액", "3,026,000"],
    ]),
    "닫기",
  )}</div>`;
  const left = earnings + taxFree + basic + additional + totals + blank + preview;

  // 오른쪽 확인 상자 — 검토 사유 · 급여 산정 기준 · 수정 및 처리내역 · 발송 이력
  const reasons = p.roundBox(
    "검토 사유",
    `<ul class="flex flex-col">${[
      ["출퇴근 누락", p.roundLink("출퇴근 기록 보기", attendanceHref), "출퇴근 기록이 등록되지 않은 날이 2일 있습니다.<br>· 출근 · 퇴근 기록 없음: 8월 22일(토)<br>· 퇴근 기록 없음: 8월 28일(금)"],
      // 공제 미입력은 사유로 저장하지 않고 공제 칸으로 판정해 더한다(앱 detailReviewReasons, 운영 정책 v221 PAY-06)
      ["공제 미입력", p.roundLink("공제 칸으로 이동", "#deduction-basic"), "국민연금, 건강보험, 장기요양보험, 고용보험, 소득세, 지방소득세"],
    ]
      .map(
        ([name, go, detail]) =>
          `<li class="flex flex-col gap-[4px] border-t border-erp-divider py-[12px] last:pb-0"><span class="flex items-center gap-[8px]"><span class="flex-1 text-[14px] font-semibold text-erp-ink">${name}</span>${go}</span><span class="text-[14px] leading-[1.6] text-erp-label">${detail}</span></li>`,
      )
      .join("")}</ul>`,
    `<span class="text-[14px] font-semibold text-erp-off">2건</span>`,
  );
  const basis = p.roundBox(
    "급여 산정 기준",
    p.roundRows([
      ["산정기간", `<span class="flex items-center gap-[8px]"><span class="flex-1">2026-08-01 ~ 08-31</span>${p.roundLink("출퇴근 기록 보기", attendanceHref)}</span>`],
      ["통상시급", "13,590 원"],
      // 「상태 · [근로계약 보기]」 — 내부 번호는 고객이 다른 화면에서 찾을 수 없어 두지 않는다(2026-11-06 사용자 지정)
      ["근로계약", `<span class="flex items-center gap-[8px]"><span class="flex-1">서명 완료</span>${p.roundLink("근로계약 보기", L("staff/contracts-signed.html"))}</span>`],
    ]),
  );
  // 처리내역 — 줄마다 왼쪽 무엇을 했는지, 오른쪽 「처리자 | 일시」. 구분(수정 · 초안 생성)을 따로 되풀이하지 않는다
  const log = p.roundBox(
    "급여명세서 수정 및 처리내역",
    p.historyLines([
      ["연장수당 96,000 → 128,000 · 소득세 12,400 → 15,900", "정하윤", "2026-09-03 14:40"],
      ["기본급 2,840,310 → 2,840,000", "정하윤", "2026-09-03 10:12"],
      ["연장·야간·휴일 가산 미적용 → 적용 · 연장수당 64,000 → 96,000", "정하윤", "2026-09-02 17:05"],
      ["초안 일괄 생성 · 검토 대기로 분류", "-", "2026-09-01 09:00"],
    ]),
  );
  const dispatch = p.roundBox("발송 이력", p.roundEmpty("발송 이력이 없습니다."));

  const confirmDialog = x.dialog(
    confirmId,
    "급여명세서를 확정하시겠습니까?",
    "입력하지 않은 공제 항목이 있어 확정할 수 없습니다. 공제 대상이 아닌 항목에는 0을 입력해 주세요.",
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("확정", { "data-close": true, disabled: true }),
  );
  const body = ui.detailBody(`<div class="flex flex-col gap-[12px]">${head}${summary}${warn}</div>${p.cols(left, reasons + basis + log + dispatch)}${confirmDialog}`);
  // 화면 이름(입구 index 목록)은 그대로 둔다
  return { title: "급여명세서 검토", html: ui.erpFrame({ header: erpHeader(A, R), title: "급여명세서 관리", body }) };
};
