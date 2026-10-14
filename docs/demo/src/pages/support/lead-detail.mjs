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

const ANSWER = "가맹점은 본사가 관리자 계정을 만들어 드리는 방식이라 따로 가입하거나 요금을 내지 않으셔도 됩니다. 본사(모리커피) 담당자께 가맹점 관리자 계정 생성을 요청해 주세요. 개점 일정에 맞춰 직원 초대 방법도 함께 안내해 드리겠습니다.";
const fold = (summary, inner) =>
  `<details class="group rounded-[2px] border border-erp-panel-line"><summary class="flex h-[34px] cursor-pointer items-center px-[12px] text-[14px] font-medium text-erp-ink [&::-webkit-details-marker]:hidden">${summary}</summary><div class="flex flex-col gap-[12px] border-t border-erp-panel-line p-[12px]">${inner}</div></details>`;

export const render = ({ A, R }, state = "wait") => {
  const done = state === "done";
  const left =
    box("조민석 · 카페·음료", "",
      prose("모리커피 가맹점을 준비 중입니다. 본사에서 WHALE ERP 를 쓴다고 해서 저희도 같이 써야 한다고 들었는데, 가맹점은 따로 요금을 내는 건지 본사가 내는 건지 궁금합니다. 개점은 10월 중순 예정이고 직원은 5명 정도입니다.") +
        ui.detailTable("접수 정보", [
          ["접수 시각", "2026-09-06 15:47"],
          ["접수 경로", "로그인 전 홈 · 도입문의"],
        ]),
    ) +
    box("답변", hint("적어 준 이메일로 나갑니다"), done
      ? prose(ANSWER) +
          `<p class="text-[13px] text-erp-label">09-07 10:12 · 이서준</p>` +
          // 처음 답할 때만 문의자 이메일로 보낸다. 고쳐도 다시 보내지 않는다(WHALEERP-588).
          fold("답변 수정", ui.field("내용", ui.textarea({ rows: 6, value: ANSWER })) + spread(note("고치면 지금 답변을 덮어씁니다. 상태는 답변 완료 그대로이고 문의자에게 메일은 다시 가지 않습니다."), ui.button("답변 저장")))
      : ui.field("내용", ui.textarea({ placeholder: "계정이 없는 분이라 이 내용이 메일로 그대로 갑니다." })) +
          spread(note("저장하면 상태가 답변 완료로 바뀌고 오늘이 상담 완료일로 남습니다. 처음 저장할 때만 문의자 이메일로 답변이 갑니다. 다른 운영자가 먼저 저장했으면 막고 최신 내용을 다시 보입니다."), ui.button("답변 저장")),
    ) +
    box("운영자 메모", hint("문의자에게 보이지 않습니다"),
      ui.field(
        "내부 기록",
        ui.textarea({ rows: 4, value: "본사(㈜한강상회)가 이미 FRANCHISE PLAN 사용 중. 가맹점은 본사 초대로 들어오면\n별도 요금 없음. 본사 담당자에게 초대 발송 요청해 두는 편이 빠름." }),
      ) + spread(note("다른 운영자와 함께 봅니다"), ui.button("메모 저장", { variant: "soft" })),
    );

  // 상호 · 사업자등록번호 · 점포 수는 접수 때 받지 않는다(WHALEERP-288). 필요하면 회신하며 묻는다.
  const right =
    plain(
      ui.detailTable("문의자", [
        ["이름", "조민석"],
        ["업종", "카페·음료"],
        ["전화번호", "02-514-7741"],
        ["이메일", "ms.cho@example.com"],
      ]),
    ) +
    plain(
      ui.detailTable("도입 문의 내용", [
        ["관심 서비스", ui.detailValues(["매장운영", "프랜차이즈"])],
        ["도입 예정 시기", "3개월 안"],
        ["개인정보 동의", "동의 · 2026-09-06 15:47"],
        ["마케팅 수신", "동의 · 2026-09-06 15:47"],
      ]),
    ) +
    // 상담 완료일은 답변 완료가 되는 날 자동으로 남고, 그날부터 1년 뒤 파기한다(WHALEERP-274 · 295).
    plain(ui.detailTable("보관", [["상담 완료일", done ? "2026-09-07" : p.sub("답변을 저장하는 날 남습니다")], ["파기 예정", done ? "2027-09-07" : p.sub("상담 완료일로부터 1년")]])) +
    tbox("처리 이력", "",
      steps([
        ["접수 확인 메일 발송", "09-06 15:47 · ms.cho@example.com", true],
        ["운영 알림 발송", "플랫폼 마스터 · 플랫폼 관리자", true],
        // 처리중 전환 · 답변 완료 때마다 플랫폼 운영자에게 「도입문의 처리 상태 변경」 운영 알림이 간다(NTF_LEAD_ANSWERED).
        done ? ["확인", "09-07 09:30 · 이서준 · 처리중으로 바꿈", true] : ["확인", "[처리 시작]을 누르면 처리중 · 시각 · 운영자가 남음", false],
        done ? ["답변", "09-07 10:12 · 이서준 · 문의자 이메일 발송", true] : ["답변", "-", false],
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
