// 도입문의 상세. 목업 docs/mockup/support/lead-detail.html(답변 대기)을 플랫폼 관리자로 본 것.
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

export default ({ A, R }) => {
  const left =
    box("조민석 · 모리커피 청담", "",
      prose("모리커피 가맹점을 준비 중입니다. 본사에서 WHALE ERP 를 쓴다고 해서 저희도 같이 써야 한다고 들었는데, 가맹점은 따로 요금을 내는 건지 본사가 내는 건지 궁금합니다. 개점은 10월 중순 예정이고 직원은 5명 정도입니다.") +
        ui.detailTable("접수 정보", [
          ["접수 시각", "2026-09-06 15:47"],
          ["접수 경로", "로그인 전 홈 · 도입문의"],
        ]),
    ) +
    box("답변", hint("적어 준 이메일로 나갑니다"),
      ui.field("내용", ui.textarea({ placeholder: "계정이 없는 분이라 이 내용이 메일로 그대로 갑니다." })) +
        spread(note("저장하면 상태가 답변 완료로 바뀝니다."), ui.button("답변 저장")),
    ) +
    box("운영자 메모", hint("문의자에게 보이지 않습니다"),
      ui.field(
        "내부 기록",
        ui.textarea({ rows: 4, value: "본사(㈜한강상회)가 이미 FRANCHISE PLAN 사용 중. 가맹점은 본사 초대로 들어오면\n별도 요금 없음. 본사 담당자에게 초대 발송 요청해 두는 편이 빠름." }),
      ) + spread(note("다른 운영자와 함께 봅니다"), ui.button("메모 저장", { variant: "soft" })),
    );

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
        ["관심 서비스", "매장운영"],
        ["도입 예정 시기", "3개월 안"],
        ["마케팅 수신", "동의"],
      ]),
    ) +
    tbox("처리 이력", "",
      steps([
        ["접수 확인 메일 발송", "09-06 15:47 · ms.cho@example.com", true],
        ["운영 알림 발송", "플랫폼 마스터 · 플랫폼 관리자", true],
        ["답변", "-", false],
      ]),
    );

  return {
    title: "도입문의 상세",
    html: ui.erpFrame({
      header: platformHeader(A, R),
      title: "도입문의",
      // 직원 상세와 같은 틀: 첫 줄 「도입문의 상세」 + 목록, 묶음은 머리 칸 상자(2026-10-02 재영)
      body: ui.detailBody(
        p.detailHead("도입문의 상세", ui.button("목록", { variant: "off", href: link(R, "support/community-leads.html") })) +
          p.cols(left, right),
      ),
    }),
  };
};
