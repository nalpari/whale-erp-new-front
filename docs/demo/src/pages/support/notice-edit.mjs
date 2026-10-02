// 공지·FAQ 편집. 목업 docs/mockup/support/notice-edit.html 의 기본 상태(게시된 공지 · 상단 고정)를 플랫폼 관리자로 본 것.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import { platformHeader, link } from "../../site.mjs";

// 아래 부품은 1팀 공통 컴포넌트에 없어 토큰으로 그렸다.
// 두 칸 본문(목업 7:5): 본문 영역이 세로로 스크롤하고, 칸마다 카드를 쌓는다.
const columns = (left, right) =>
  `<div class="flex min-h-0 flex-1 items-start gap-[12px] overflow-y-auto p-[24px]"><div class="flex min-w-px flex-[7] flex-col gap-[12px]">${left}</div><div class="flex min-w-px flex-[5] flex-col gap-[12px]">${right}</div></div>`;
const card = (head, body) => `<section class="flex flex-col gap-[18px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">${head}${body}</section>`;
const hint = (text) => `<span class="text-[14px] font-normal text-erp-label">${text}</span>`;
const note = (html) => `<p class="text-[14px] leading-[1.6] text-erp-label">${html}</p>`;
// 경고 띠(목업 band--warn). 제목 한 줄만 둔다.
const band = (text) => `<p class="rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] font-medium text-erp-off">${text}</p>`;
// 첨부파일 칸: 읽기 전용 입력칸 + [파일 선택]
const fileField = `<div class="flex gap-[6px]"><input readonly placeholder="선택된 파일 없음" aria-label="첨부파일" class="${ui.FIELD}">${ui.button("파일 선택", { variant: "soft" })}</div>`;

export default ({ A, R }) => {
  const kind = `<div role="radiogroup" aria-label="종류" class="flex items-center gap-[18px]">${ui.radio("공지사항", "kind", true)}${ui.radio("FAQ", "kind")}</div>`;
  const content = card(
    ui.sectionHead("내용", kind),
    ui.field("제목", ui.textField({ value: "9월 정기 점검 안내 (09-14 02:00~05:00)" })) +
      ui.field(
        "본문",
        ui.textarea({
          rows: 12,
          value:
            "9월 14일(일) 새벽 2시부터 5시까지 정기 점검이 있습니다.\n점검 시간에는 관리자 웹과 직원 전용 앱을 모두 사용할 수 없습니다.\n직원 근무 앱의 출퇴근 등록은 점검 중에도 기기에 기록되고 점검이 끝나면 자동으로 반영됩니다.\n점검이 일찍 끝나면 공지 없이 서비스를 재개합니다.",
        }),
      ) +
      `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">첨부파일</span>${fileField}${note("이미지와 PDF 를 올릴 수 있습니다.")}</div>`,
  );

  const pin = card(
    ui.sectionHead("게시 설정"),
    x.toggle("상단 고정", true),
  );

  const target = (label, desc, on) => ui.checkbox(A, desc ? `${label} ${hint(`— ${desc}`)}` : label, on);
  const addon = ["POS", "KIOSK", "QR 주문", "예약"].map((p) => ui.checkbox(A, p, p === "KIOSK")).join("") + ui.checkbox(A, `재고 ${hint("· 레시피 · 발주 · 대기 순번 … 열셋")}`);
  const targets = card(
    ui.sectionHead("노출 대상", hint("여러 개 고를 수 있음")),
    `<div class="flex flex-col gap-[12px]">${target("비회원", "", true)}${target("회원", "로그인한 모든 사용자", true)}${target("BP", "사업자 관리자", true)}${target("점포", "점포 단위 관리자", false)}${target("부가서비스", "고른 상품의 구독자", true)}<div class="ml-[28px] flex flex-col gap-[10px] border-l border-erp-divider pl-[12px]">${addon}</div></div>` +
      band("비회원이 포함되어 로그인 전 홈에 공개됩니다"),
  );

  const history = card(
    ui.sectionHead("변경 이력"),
    ui.dataTable(
      [{ header: "일시", width: "w-[120px]" }, { header: "처리자", width: "w-[90px]" }, { header: "내용", align: "left" }],
      [
        ["09-05 14:20", "이서준", "본문 수정 · 상단 고정 켬"],
        ["09-05 11:02", "이서준", "임시저장 → 게시"],
        ["09-04 17:44", "이서준", "작성"],
      ],
    ),
  );

  const title = `<span class="flex items-center gap-[10px]">9월 정기 점검 안내</span>`;
  const right = `<div class="flex items-center gap-[6px]"><span class="mr-[12px] text-[14px] text-erp-label">최근 수정 09-05 14:20 · 이서준</span>${ui.button("목록", { variant: "off", href: link(R, "support/community.html") })}${ui.button("임시저장", { variant: "soft" })}${ui.button("게시", { href: link(R, "support/community.html") })}</div>`;

  return {
    title: "공지·FAQ 편집",
    html: ui.erpFrame({ header: platformHeader(A, R), title, titleRight: right, body: columns(content, pin + targets + history) }),
  };
};
