// 도입문의 상세. 목업 docs/mockup/support/lead-detail.html 을 플랫폼 관리자로 본 것.
// 접수(처리 시작 전)는 이 화면, 답변 완료는 lead-detail-done 이 state 를 바꿔 그린다. 칸은 api GET /leads/{id} 의 것(WHALEERP-332 · 274).
// 도입문의 답변은 하나다 — 고치면 덮어쓰고(PUT /leads/{id}/reply) 이전 답변은 남지 않는다. 문의사항과 다르다.
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

// 목록(community-sections)의 행과 같은 건을 그린다. 접수 = 조민석, 답변 완료 = 한도윤(처리 시작 없이 바로 답한 건).
const CASES = {
  wait: {
    name: "조민석", industry: "카페·음료", phone: "02-514-7741", email: "ms.cho@example.com",
    interests: ["매장운영", "프랜차이즈"], plan: "3개월 안", marketing: "동의 · 2026-09-06 15:47", at: "2026-09-06 15:47",
    body: "모리커피 가맹점을 준비 중입니다. 본사에서 WHALE ERP 를 쓴다고 해서 저희도 같이 써야 한다고 들었는데, 가맹점은 따로 요금을 내는 건지 본사가 내는 건지 궁금합니다. 개점은 10월 중순 예정이고 직원은 5명 정도입니다.",
    memo: "본사(㈜한강상회)가 이미 FRANCHISE PLAN 사용 중. 가맹점은 본사 초대로 들어오면\n별도 요금 없음. 본사 담당자에게 초대 발송 요청해 두는 편이 빠름.",
  },
  done: {
    name: "한도윤", industry: "기타 (꽃집)", phone: "010-9902-1177", email: "doyoon.han@example.com",
    interests: ["재무관리"], plan: "아직 정하지 않음", marketing: p.sub("동의하지 않음"), at: "2026-08-27 11:20",
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
  const left =
    box(`${c.name} · ${c.industry}`, "",
      prose(c.body) +
        ui.detailTable("접수 정보", [
          ["접수 시각", c.at],
          ["접수 경로", "로그인 전 홈 · 도입문의"],
        ]),
    ) +
    box("답변", hint("적어 준 이메일로 나갑니다"), done
      ? prose(ANSWER) +
          `<p class="text-[13px] text-erp-label">08-28 14:05 · 이서준</p>` +
          // 처음 답할 때만 문의자 이메일로 보낸다. 고쳐도 다시 보내지 않는다 — 메일은 #588 뒤에 붙는다(지금 api 는 보내지 않고, 상세에 발송 칸도 없다).
          fold("답변 수정", ui.field("내용", ui.textarea({ rows: 6, value: ANSWER })) + spread(note("고치면 지금 답변을 덮어씁니다. 상태는 답변 완료 그대로이고 운영 알림 · 메일은 다시 가지 않습니다."), ui.button("답변 저장")))
      : ui.field("내용", ui.textarea({ placeholder: "계정이 없는 분이라 이 내용이 메일로 그대로 갑니다." })) +
          spread(note("저장하면 상태가 답변 완료로 바뀌고 오늘이 상담 완료일로 남습니다. 처음 저장할 때만 문의자 이메일로 답변이 갑니다(#588 뒤 — 지금은 보내지 않음). 다른 운영자가 먼저 저장했으면 막고 최신 내용을 다시 보입니다."), ui.button("답변 저장")),
    ) +
    box("운영자 메모", hint("문의자에게 보이지 않습니다"),
      ui.field(
        "내부 기록",
        ui.textarea({ rows: 4, value: c.memo }),
      ) + spread(note("다른 운영자와 함께 봅니다"), ui.button("메모 저장", { variant: "soft" })),
    );

  // 상호 · 사업자등록번호 · 점포 수는 접수 때 받지 않는다(WHALEERP-288). 필요하면 회신하며 묻는다.
  const right =
    plain(
      ui.detailTable("문의자", [
        ["이름", c.name],
        ["업종", c.industry],
        ["전화번호", c.phone],
        ["이메일", c.email],
      ]),
    ) +
    plain(
      ui.detailTable("도입 문의 내용", [
        ["관심 서비스", ui.detailValues(c.interests)],
        ["도입 예정 시기", c.plan],
        ["개인정보 동의", `동의 · ${c.at}`],
        ["마케팅 수신", c.marketing],
      ]),
    ) +
    // 상담 완료일은 답변 완료가 되는 날 자동으로 남고, 그날부터 1년 뒤 파기한다(WHALEERP-274 · 295).
    // 상담하지 않은 도입문의는 자동으로 지우지 않고 관리자가 직접 처리한다(운영 정책 CNT-11, 처리 방식은 기획에서 정리 중).
    plain(
      ui.detailTable("보관", [["상담 완료일", done ? "2026-08-28" : p.sub("답변을 저장하는 날 남습니다")], ["파기 예정", done ? "2027-08-28" : p.sub("상담 완료일로부터 1년")]]) +
        note("상담하지 않은 도입문의는 자동으로 지우지 않고 관리자가 직접 처리합니다(CNT-11, 처리 방식은 기획에서 정리 중)."),
    ) +
    tbox("처리 이력", "",
      steps([
        ["접수 확인 메일 발송", `${c.at.slice(5)} · ${c.email}`, true],
        ["운영 알림 발송", "플랫폼 마스터 · 플랫폼 관리자", true],
        // 「도입문의 처리 상태 변경」 운영 알림(NTF_LEAD_ANSWERED)은 처리중으로 바꿀 때와 처음 답변 완료가 될 때 한 번씩 간다. 답변 수정은 알리지 않는다.
        // 「확인」 줄은 처리중을 거친 건만 그린다 — 처리 시작 없이 바로 답했으면 api 가 processingStartedAt 을 null 로 주고 이 줄을 숨긴다(답변 완료 데모가 그 경우).
        ...(done ? [] : [["확인", "[처리 시작]을 누르면 처리중 · 시각 · 운영자가 남음", false]]),
        done ? ["답변", "08-28 14:05 · 이서준 · 문의자 이메일은 #588 뒤", true] : ["답변", "-", false],
      ]),
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
          `<div class="flex items-center gap-[6px]">${done ? "" : ui.button("처리 시작", { variant: "soft" })}${ui.button("목록", { variant: "off", href: link(R, "support/community-leads.html") })}</div>`,
        ) + p.cols(left, right),
      ),
    }),
  };
};
export default (ctx) => render(ctx);
