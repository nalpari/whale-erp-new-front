// 문의사항 상세·답변. 목업 docs/mockup/support/inquiry-detail.html 을 플랫폼 관리자로 본 것.
// 답변 대기는 이 화면, 답변 완료(답변 수정)는 inquiry-detail-done 이 state 를 바꿔 그린다.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import { platformHeader, link } from "../../site.mjs";

// 아래 부품은 1팀 공통 컴포넌트에 없어 토큰으로 그렸다(notice-edit 과 같은 모양).
// 상세 화면 틀(staff-parts): 머리 칸 상자. 글·입력이 든 상자는 안쪽 여백, 표만 든 상자(이력)는 여백 없이.
const box = (title, right, body) => p.box(title, right, `<div class="flex flex-col gap-[18px]">${body}</div>`, { pad: true });
const tbox = (title, right, body) => p.box(title, right, body);
const plain = (body) => body;
const hint = (text) => `<span class="text-[14px] font-normal text-erp-label">${text}</span>`;
const note = (html) => `<p class="text-[14px] leading-[1.6] text-erp-label">${html}</p>`;
const prose = (text) => `<p class="text-[14px] leading-[1.7] text-erp-ink">${text}</p>`;
const spread = (left, right) => `<div class="flex items-center gap-[12px]"><div class="flex-1">${left}</div>${right}</div>`;
const steps = (rows) =>
  ui.dataTable(
    [{ header: "단계", width: "w-[150px]" }, { header: "내용", align: "left" }, { header: "상태", width: "w-[80px]" }],
    rows.map(([t, meta, done]) => [t, meta, done ? ui.badge("on", "완료") : ui.badge("off", "대기")]),
  );

// 답변 완료: 읽기 상태 + 「답변 수정」(운영 정책 CNT-17, 2026-10-08 재영). 수정은 같은 입력칸을 연다.
// 데모는 <details> 로 입력칸을 펼친다 — 저장하면 다시 읽기 상태로 돌아가는 것은 실제 화면의 동작이다.
const ANSWER = "계약서의 소정근로시간이 주 14시간으로 들어가 있어 주휴수당이 잡히지 않았습니다. 직원 정보 관리 › 근로계약에서 계약서 작성으로 실제 근무시간(주 16시간)을 넣은 새 계약을 보내 주세요. 새 계약이 체결되면 다음 급여명세서부터 주휴수당이 계산됩니다.";
const fold = (summary, body) =>
  `<details class="group rounded-[2px] border border-erp-panel-line"><summary class="flex h-[34px] cursor-pointer items-center px-[12px] text-[14px] font-medium text-erp-ink [&::-webkit-details-marker]:hidden">${summary}</summary><div class="flex flex-col gap-[12px] border-t border-erp-panel-line p-[12px]">${body}</div></details>`;
const doneAnswer =
  prose(ANSWER) +
  `<p class="text-[13px] text-erp-label">수정됨 · 09-05 14:20 · 김하린</p>` +
  fold("답변 수정", ui.field("내용", ui.textarea({ rows: 6, value: ANSWER })) + spread(note("고쳐도 상태는 답변 완료 그대로입니다. 문의자에게 알림은 다시 가지 않습니다."), ui.button("답변 저장"))) +
  fold("이전 답변 1개", `<p class="text-[13px] text-erp-label">09-04 15:02 · 이서준</p>` + prose("계약서의 소정근로시간이 주 14시간이라 주휴수당이 잡히지 않았습니다. 계약서를 다시 작성해 주세요."));

export const render = ({ A, R }, state = "wait") => {
  const done = state === "done";
  const left =
    box("파트타이머 주휴수당이 계산되지 않습니다", hint("직원·근로"),
      prose("파트타이머 배정숙 직원의 9월 급여명세서를 만들었는데 주휴수당이 0원으로 나옵니다. 주 15시간 넘게 일했고 출퇴근 기록도 다 있는데 왜 안 잡히는지 모르겠습니다. 확인 부탁드립니다.") +
        ui.detailTable("문의 정보", [
          ["보낸 사람", "정하윤 · BP 마스터"],
          ["소속", "㈜한강상회"],
          ["접수 시각", "2026-09-04 10:32"],
        ]),
    ) +
    box("답변", hint("문의한 사람에게 보입니다"), done ? doneAnswer :
      ui.field("내용", ui.textarea({ placeholder: "문의한 분이 그대로 읽습니다. 어떤 화면에서 무엇을 하면 되는지 적어 주세요." })) +
        spread(note("저장하면 상태가 즉시 답변 완료로 바뀌고 문의자에게 알림이 갑니다. 그 뒤에도 답변은 고칠 수 있습니다."), ui.button("답변 저장")),
    ) +
    box("운영자 메모", hint("문의자에게 보이지 않습니다"),
      ui.field(
        "내부 기록",
        ui.textarea({ rows: 4, value: "계약서에 소정근로시간이 주 14시간으로 들어가 있음. 실제 근무는 16시간대.\n계약을 새로 써야 주휴가 잡힘 — 개발팀 확인 완료. 답변에는 계약 수정 절차만 안내할 것." }),
      ) + spread(note("다른 운영자와 함께 봅니다"), ui.button("메모 저장", { variant: "soft" })),
    );

  const right =
    plain(
      ui.detailTable("보낸 곳", [
        ["이름", "정하윤"],
        ["역할", "BP 마스터 · ㈜한강상회"],
        ["운영 점포", ui.detailValues(["11개점", "직영 4 · 가맹 7"])],
        ["요금 PLAN", "FRANCHISE"],
        ["이전 문의", ui.detailValues(["1건", "답변 완료"])],
      ]),
    ) +
    tbox("처리 이력", "",
      steps([
        ["접수", "09-04 10:32 · 운영 알림 발송됨", true],
        ["확인", "09-04 11:15 · 이서준", true],
        done ? ["답변", "09-04 15:02 · 이서준 · 09-05 14:20 김하린 수정", true] : ["답변", "저장하면 답변 완료 · 그 뒤에도 고칠 수 있음", false],
      ]),
    );

  return {
    title: "문의사항 상세",
    html: ui.erpFrame({
      header: platformHeader(A, R),
      title: "문의사항",
      // 직원 상세와 같은 틀: 첫 줄 「문의사항 상세」 + 목록, 묶음은 머리 칸 상자(2026-10-02 재영)
      body: ui.detailBody(p.detailHead("문의사항 상세", ui.button("목록", { variant: "off", href: link(R, "support/community-asks.html") })) + p.cols(left, right)),
    }),
  };
};
export default (ctx) => render(ctx);
