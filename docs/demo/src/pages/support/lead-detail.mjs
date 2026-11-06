// 도입문의 상세. 목업 docs/mockup/support/lead-detail.html 을 플랫폼 관리자로 본 것.
// 접수(처리 시작 전)는 이 화면, 답변 완료는 lead-detail-done 이 state 를 바꿔 그린다. 칸은 api GET /leads/{id} 의 것(WHALEERP-332 · 274).
// 도입문의 답변은 하나다 — 고치면 덮어쓰고(PUT /leads/{id}/reply) 이전 답변은 남지 않는다. 문의사항과 다르다.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import * as x from "../../extra.mjs";
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
    rows.map(([t, meta, done]) => [t, meta, done ? `<span class="inline-flex items-center gap-[4px] text-[14px] text-erp-ink"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="shrink-0 text-erp-brand"><circle cx="8" cy="8" r="6.25"/><path d="M5.25 8.25 7.1 10l3.65-3.75"/></svg>완료</span>` : `<span class="inline-flex items-center gap-[4px] text-[14px] text-erp-off"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="shrink-0"><circle cx="8" cy="8" r="6.25"/><path d="M8 4.5V8l2.5 1.5"/></svg>대기</span>`]),
  );

// 목록(community-sections)의 행과 같은 건을 그린다. 접수 = 조민석, 답변 완료 = 한도윤(처리 시작 없이 바로 답한 건).
// [삭제]는 상담 완료일(consultedDate)이 없을 때만 선다(WHALEERP-590, 목업과 같은 조건).
const CASES = {
  wait: {
    name: "조민석", industry: "카페·음료", phone: "02-514-7741", email: "ms.cho@example.com",
    interests: ["매장운영", "프랜차이즈"], plan: "3개월 안", marketing: "동의 · 2026-09-06 15:47", at: "2026-09-06 15:47", consulted: null,
    body: "모리커피 가맹점을 준비 중입니다. 본사에서 WHALE ERP 를 쓴다고 해서 저희도 같이 써야 한다고 들었는데, 가맹점은 따로 요금을 내는 건지 본사가 내는 건지 궁금합니다. 개점은 10월 중순 예정이고 직원은 5명 정도입니다.",
    memo: "본사(㈜한강상회)가 이미 FRANCHISE PLAN 사용 중. 가맹점은 본사 초대로 들어오면\n별도 요금 없음. 본사 담당자에게 초대 발송 요청해 두는 편이 빠름.",
  },
  done: {
    name: "한도윤", industry: "기타 (꽃집)", phone: "010-9902-1177", email: "doyoon.han@example.com",
    interests: ["재무관리"], plan: "아직 정하지 않음", marketing: p.sub("동의하지 않음"), at: "2026-08-27 11:20", consulted: "2026-08-28", purge: "2027-08-28",
    body: "꽃집을 혼자 운영하고 있습니다. 매출과 지출을 한곳에서 보고 싶은데 직원이 없어도 쓸 수 있는지, 요금이 어떻게 되는지 알고 싶습니다.",
    memo: "직원 없는 단일 점포. 재무관리 단독 PLAN 안내. 전화로 상담 끝냄(08-28).",
  },
};
const ANSWER = "직원이 없어도 재무관리만 따로 쓰실 수 있습니다. 매출 · 지출을 한 화면에서 보시고, 직원이 생기면 그때 매장운영을 더하시면 됩니다. 요금 안내서를 함께 보내 드립니다.";
const fold = (summary, inner) =>
  `<details class="group rounded-[2px] border border-erp-panel-line"><summary class="flex h-[34px] cursor-pointer items-center px-[12px] text-[14px] font-medium text-erp-ink [&::-webkit-details-marker]:hidden">${summary}</summary><div class="flex flex-col gap-[12px] border-t border-erp-panel-line p-[12px]">${inner}</div></details>`;

export const render = ({ A, R }, state = "wait") => {
  const done = state === "done";
  const c = CASES[done ? "done" : "wait"];
  const delId = x.dialogId();
  // 삭제 확인창 — 지워도 되는 건인지 확인 → 문의자 · 접수일시(회색 상자) → 복구 불가(2026-11-06 사용자 지정)
  const delDialog = x.dialog(
    delId,
    "도입 문의를 삭제하시겠습니까?",
    `<p>스팸, 중복 접수, 테스트, 연락처 오류 등 상담이 필요하지 않은 문의인지 확인해 주세요.</p>` +
      `<dl class="mt-[12px] grid grid-cols-[max-content_1fr] gap-x-[12px] gap-y-[2px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[12px] py-[10px]"><dt class="font-semibold">문의자</dt><dd>${c.name}</dd><dt class="font-semibold">접수일시</dt><dd>${c.at}</dd></dl>` +
      `<p class="mt-[12px] font-semibold">삭제한 문의는 복구할 수 없습니다.</p>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("삭제", { href: link(R, "support/community-leads.html") }),
  );
  const guide = (text) => `<p class="flex items-start gap-[6px] text-[13px] leading-[1.6] font-medium text-erp-ink"><span class="mt-[3px] inline-flex size-[14px] shrink-0 items-center justify-center rounded-full bg-erp-brand text-[10px] font-semibold text-white">!</span><span>${text}</span></p>`;
  // 왼쪽 맨 위 「도입 문의 내용」 — 관심 서비스 · 도입 예정 시기, 그 아래 문의 글(라벨 칸 없이), 제목 줄 오른쪽 끝에 접수 시각(2026-11-06 사용자 지정 —
  // 전엔 「이름 · 업종」 상자에 글 + 접수 정보 표, 오른쪽에 「도입 문의 내용」 표)
  const left =
    `<div class="flex min-w-0 flex-col">` +
      ui.detailTable("도입 문의 내용", [
        ["관심 서비스", ui.detailValues(c.interests)],
        ["도입 예정 시기", c.plan],
      ], hint(`${c.at} 접수`)) +
      `<div class="rounded-b-[2px] border border-t-0 border-erp-thead-line bg-white p-[16px]">${prose(c.body)}</div></div>` +
    box("답변", "", done
      ? prose(ANSWER) +
          `<p class="text-[14px] text-erp-label">08-28 14:05 · 이서준</p>` +
          // 처음 답할 때 답변 메일이 자동으로 간다(#588). 고쳐도 다시 가지 않아, 고친 뒤 재발송 확인창을 띄운다(1분 안이면 토스트로 알린다).
          // 마지막 답변 메일 결과 · 시각은 leads 칸(reply_mail_result · reply_mail_attempted_at)에서 읽는다(#597). 같은 도입문의는 1분 간격 제한.
          spread(
            ui.detailTable("답변 메일", [["마지막 발송", `${ui.badge("on", "성공")} 08-28 14:05`]]),
            ui.button("답변 메일 재발송", { variant: "soft", "data-toast": "답변 메일을 재발송했습니다." }),
          ) +
          fold("답변 수정", ui.textarea({ rows: 6, value: ANSWER }) + spread(guide("수정한 답변은 문의자에게 자동으로 발송되지 않습니다. 수정 내용을 전달하려면 저장 후 [답변 메일 재발송]을 눌러 주세요."), ui.button("답변 저장", { "data-toast": "답변을 수정했습니다." })))
      : ui.textarea({ rows: 6, placeholder: "문의자에게 전달할 답변을 입력해 주세요." }) +
          spread(guide("답변을 저장하면 상담이 완료되고, 문의자에게 답변 메일이 자동 발송됩니다."), ui.button("답변 저장")),
    );

  // 상호 · 사업자등록번호 · 점포 수는 접수 때 받지 않는다(WHALEERP-288). 동의 두 줄은 문의자 정보에 둔다(2026-11-06 사용자 지정).
  const right =
    plain(
      ui.detailTable("문의자 정보", [
        ["이름", c.name],
        ["업종", c.industry],
        ["전화번호", c.phone],
        ["이메일", c.email],
        ["개인정보 동의", `동의 · ${c.at}`],
        ["마케팅 수신", c.marketing],
      ]),
    ) +
    // 상담 완료일은 답변을 저장하는 날 자동으로 남고, 그날부터 1년 뒤 파기한다(WHALEERP-274 · 295). 보관 안내는 제목 줄 오른쪽 끝.
    // 상담하지 않은 도입문의(상담 완료일 없음)는 [삭제]로 지운다 — 삭제 권한이 있을 때만 버튼과 아래 안내를 보인다(2026-11-06 사용자 지정).
    `<div class="flex flex-col gap-[12px]">` +
      ui.detailTable("보관", [["상담 완료일", c.consulted ?? p.sub("답변 저장 시 자동 기록")], ["파기 예정일", c.purge ?? p.sub("상담 완료일로부터 1년")]], hint("상담 완료 후 1년간 보관되며, 기간 만료 시 파기됩니다.")) +
      (c.consulted ? "" : guide("스팸, 중복 접수, 테스트, 연락처 오류 등 상담이 필요하지 않은 문의는 삭제할 수 있습니다. 삭제한 문의는 복구할 수 없습니다.")) +
      `</div>` +
    tbox("처리이력", "",
      steps([
        ["접수", c.at, true],
        // 「확인」 줄은 처리중을 거친 건만 그린다 — 처리 시작 없이 바로 답했으면 api 가 processingStartedAt 을 null 로 주고 이 줄을 숨긴다(답변 완료 데모가 그 경우).
        // 도입문의 문의자는 화면이 없어 대기 안내는 바뀌는 상태만 말한다(2026-11-06 사용자 지정)
        ...(done ? [] : [["확인", guide("[처리 시작]을 누르면 처리중이 됩니다."), false]]),
        done ? ["답변", "08-28 14:05 · 이서준", true] : ["답변", guide("답변을 저장하면 답변완료가 됩니다."), false],
      ]),
    ) +
    // 운영자 메모는 처리 이력 아래 — 문의사항 상세와 같다(2026-11-06 사용자 지정 — 전엔 왼쪽 답변 아래)
    box("운영자 메모", hint("운영자에게만 표시됩니다."),
      ui.textarea({ rows: 4, value: c.memo }) + spread(guide("작성한 메모는 다른 운영자와 공유됩니다. 내용을 모두 지우고 저장하면 메모가 삭제됩니다."), ui.button("메모 저장", { variant: "soft" })),
    );

  return {
    title: "도입문의 상세",
    html: ui.erpFrame({
      header: platformHeader(A, R),
      title: "도입문의",
      // 직원 상세와 같은 틀: 첫 줄 「도입문의 상세」 + 목록, 묶음은 머리 칸 상자(2026-10-02 재영)
      body: ui.detailBody(
        p.detailHead(
          "도입문의 상세",
          `<div class="flex items-center gap-[6px]">${c.consulted ? "" : x.dialogTrigger("삭제", delId, "soft")}${done ? "" : ui.button("처리 시작", { variant: "soft", "data-toast": "처리중으로 변경됩니다." })}${ui.button("목록", { href: link(R, "support/community-leads.html") })}</div>`,
        ) + p.cols(left, right) + (c.consulted ? "" : delDialog),
      ),
    }),
  };
};
export default (ctx) => render(ctx);
