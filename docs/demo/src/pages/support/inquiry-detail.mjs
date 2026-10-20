// 문의사항 상세·답변. 목업 docs/mockup/support/inquiry-detail.html 을 플랫폼 관리자로 본 것.
// 처리중은 이 화면, 접수(처리 시작 전)는 inquiry-detail-received, 답변 완료(답변 수정)는 inquiry-detail-done 이 state 를 바꿔 그린다.
// 처리중은 운영자가 상세에서 [처리 시작]으로 직접 바꾼다 — 접수 상태에서만 되고 바꾼 시각 · 운영자가 남는다(POST /inquiries/{id}/processing, WHALEERP-274).
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
const fold = (summary, body) =>
  `<details class="group rounded-[2px] border border-erp-panel-line"><summary class="flex h-[34px] cursor-pointer items-center px-[12px] text-[14px] font-medium text-erp-ink [&::-webkit-details-marker]:hidden">${summary}</summary><div class="flex flex-col gap-[12px] border-t border-erp-panel-line p-[12px]">${body}</div></details>`;
const doneAnswer = (c) =>
  prose(c.answer) +
  `<p class="text-[13px] text-erp-label">수정됨 · ${c.editedAt}</p>` +
  fold("답변 수정", ui.field("내용", ui.textarea({ rows: 6, value: c.answer })) + spread(note("고쳐도 상태는 답변 완료 그대로입니다. 문의자에게 알림은 다시 가지 않습니다."), ui.button("답변 저장"))) +
  fold("이전 답변 1개", `<p class="text-[13px] text-erp-label">${c.firstAt}</p>` + prose(c.firstAnswer));

// 첨부파일(운영 정책 CNT-18): 이미지는 작은 미리보기, PDF 는 이름 + 내려받기.
// 저장소가 정해져(#587) 1차에서 첨부를 함께 만든다(#281, 2026-10-19 재영).
const thumb = (name, size) => `<a href="#" title="${name} · ${size}" class="grid size-[64px] place-items-center rounded-[2px] border border-erp-panel-line bg-erp-thead-bg text-[12px] text-erp-label">PNG</a>`;
const pdf = (name, size) => ui.detailValues([ui.link(name, "#"), `<span class="text-erp-label">${size}</span>`, ui.link("내려받기", "#")]);

// 목록(community-sections)의 행과 같은 건을 그린다. 처리중 = 주휴수당, 접수 = KIOSK, 답변 완료 = 가맹점 초대 메일(BP 쪽 내 문의 상세 inquiry-mine 과 같은 건).
const SENDER_HANGANG = [["이름", "정하윤"], ["역할", "BP 마스터"], ["BP", "㈜한강상회"]];
const CASES = {
  wait: {
    title: "파트타이머 주휴수당이 계산되지 않습니다", hint: "직원·근로 · 2026-09-04 10:32 접수", at: "09-04 10:32",
    body: "파트타이머 배정숙 직원의 9월 급여명세서를 만들었는데 주휴수당이 0원으로 나옵니다. 주 15시간 넘게 일했고 출퇴근 기록도 다 있는데 왜 안 잡히는지 모르겠습니다. 확인 부탁드립니다.",
    files: [["주휴수당_0원_화면.png", "412 KB"], ["9월_급여명세서_배정숙.pdf", "1.2 MB"]],
    sender: SENDER_HANGANG, processing: "09-04 11:15 · 이서준",
    memo: "계약서에 소정근로시간이 주 14시간으로 들어가 있음. 실제 근무는 16시간대.\n계약을 새로 써야 주휴가 잡힘 — 개발팀 확인 완료. 답변에는 계약 수정 절차만 안내할 것.",
  },
  received: {
    title: "KIOSK 구독을 늘리고 싶습니다", hint: "요금·구독 · 2026-09-02 16:48 접수", at: "09-02 16:48",
    body: "지금 KIOSK 1대를 쓰고 있는데 2호점 오픈에 맞춰 1대를 더 늘리고 싶습니다. 구독을 어디서 바꾸는지, 요금은 언제부터 붙는지 알려 주세요.",
    files: null, sender: [["이름", "배정숙"], ["역할", "BP 마스터"], ["BP", "온기식당"]], processing: null, memo: "",
  },
  done: {
    title: "가맹점 초대 메일이 반송됩니다", hint: "점포·설비 · 2026-08-30 16:12 접수", at: "08-30 16:12",
    body: "점포관리에서 가맹점 두 곳에 초대 메일을 보냈는데 둘 다 반송됩니다. 주소는 맞게 넣었고, 같은 주소로 제가 직접 보내면 잘 갑니다. 반송 사유가 “발신 도메인 인증 실패”라고 나옵니다.",
    files: [["반송_메일_화면.png", "286 KB"], ["반송_사유_원문.pdf", "96 KB"]],
    sender: SENDER_HANGANG, processing: "08-31 09:12 · 이서준",
    memo: "가맹점 메일 서버가 발신 도메인 검증을 새로 켬. 발신 도메인 인증(SPF · DKIM) 갱신 완료 — 효준 확인.",
    answer: "원인이 확인되어 조치했습니다. 가맹점 메일 서버가 발신 도메인 검증을 새로 켜면서 반송된 것으로, 발신 도메인 인증 설정을 갱신했습니다. 점포관리에서 초대 다시 보내기를 눌러 주세요.",
    editedAt: "09-02 11:05 · 김하린", firstAt: "08-31 09:40 · 이서준",
    firstAnswer: "발신 도메인 인증 설정을 갱신했습니다. 초대를 다시 보내 주세요.",
    replied: "08-31 09:40 · 이서준 · 09-02 11:05 김하린 수정",
  },
};

export const render = ({ A, R }, state = "wait") => {
  const done = state === "done";
  const received = state === "received";
  const c = CASES[state];
  const left =
    // 보낸 사람 · 소속은 오른쪽 「보낸 곳」 한 표에만 둔다. 접수 시각은 제목 옆에.
    box(c.title, hint(c.hint),
      prose(c.body) + (c.files ? ui.detailTable("첨부파일", [["이미지", thumb(...c.files[0])], ["PDF", pdf(...c.files[1])]]) : ""),
    ) +
    box("답변", hint("문의한 사람에게 보입니다"), done ? doneAnswer(c) :
      ui.field("내용", ui.textarea({ placeholder: "문의한 분이 그대로 읽습니다. 어떤 화면에서 무엇을 하면 되는지 적어 주세요." })) +
        spread(note("저장하면 상태가 즉시 답변 완료로 바뀌고 문의자에게 알림함과 메일로 알립니다. 처리 시작을 거치지 않고 바로 답해도 됩니다. 그 뒤에도 답변은 고칠 수 있습니다. 다른 운영자가 먼저 저장했으면 막고 최신 내용을 다시 보입니다."), ui.button("답변 저장")),
    ) +
    box("운영자 메모", hint("문의자에게 보이지 않습니다"),
      ui.field(
        "내부 기록",
        ui.textarea({ rows: 4, value: c.memo }),
      ) + spread(note("다른 운영자와 함께 봅니다"), ui.button("메모 저장", { variant: "soft" })),
    );

  const right =
    plain(
      // 이름 · 역할 · BP · 점포는 api 상세의 senderName · senderRoleTypeCode · bpName · storeName.
      // 운영 점포 · 요금 PLAN · 이전 문의는 1차에 두지 않는다(2026-10-14 재영). 요금 PLAN 은 1팀 영역이다.
      ui.detailTable("보낸 곳", [
        ...c.sender,
        ["점포", p.sub("BP 단위 문의")],
      ]),
    ) +
    tbox("처리 이력", "",
      steps([
        ["접수", `${c.at} · 운영 알림 발송됨`, true],
        // 「확인」 줄은 처리중을 거친 건만 완료로 그린다. 처리 시작 없이 바로 답했으면 api 가 processingStartedAt 을 null 로 주므로 이 줄을 숨긴다.
        received ? ["확인", "[처리 시작]을 누르면 처리중 · 시각 · 운영자가 남음", false] : ["확인", `${c.processing} · 처리중으로 바꿈`, true],
        done ? ["답변", c.replied, true] : ["답변", "저장하면 답변 완료 · 그 뒤에도 고칠 수 있음", false],
      ]),
    );

  return {
    title: "문의사항 상세",
    html: ui.erpFrame({
      header: platformHeader(A, R),
      title: "문의사항",
      // 직원 상세와 같은 틀: 첫 줄 「문의사항 상세」 + 목록, 묶음은 머리 칸 상자(2026-10-02 재영)
      body: ui.detailBody(
        p.detailHead(
          "문의사항 상세",
          `<div class="flex items-center gap-[6px]">${received ? ui.button("처리 시작", { variant: "soft" }) : ""}${ui.button("목록", { variant: "off", href: link(R, "support/community-asks.html") })}</div>`,
        ) + p.cols(left, right),
      ),
    }),
  };
};
export default (ctx) => render(ctx);
