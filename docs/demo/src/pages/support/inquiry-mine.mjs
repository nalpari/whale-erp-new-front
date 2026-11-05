// 내 문의사항 상세(BP 사용자 쪽). 목업 docs/mockup/support/inquiry-mine.html 을 BP 마스터로 본 것. 내부 메모 없이 답변만 보인다.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

// 첨부파일(운영 정책 CNT-18): 이미지는 작은 미리보기, PDF 는 이름 + 내려받기.
// 저장소가 정해져(#587) 1차에서 첨부를 함께 만든다(#281, 2026-10-19 재영).
const thumb = (name, size) => `<a href="#" title="${name} · ${size}" class="grid size-[64px] place-items-center rounded-[8px] border border-erp-panel-line bg-erp-thead-bg text-[12px] text-erp-label">PNG</a>`;
// 처리현황 단계 아이콘(앱 support-detail.tsx StepIcon 과 같다) — 접수는 받은 문서, 처리중은 시계, 답변완료는 동그라미 체크(2026-11-05 사용자 지정)
const SVG = (paths) => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ICON = {
  접수: SVG('<path d="M4 1.75h5.5L12.5 4.75v9.5H4z"/><path d="M9.5 1.75v3h3M6 8h4.5M6 10.75h4.5"/>'),
  처리중: SVG('<circle cx="8" cy="8" r="6.25"/><path d="M8 4.5V8l2.5 1.5"/>'),
  답변완료: SVG('<circle cx="8" cy="8" r="6.25"/><path d="M5.25 8.25 7.1 10l3.65-3.75"/>'),
};
const step = (label, badge) => `<span class="inline-flex items-center gap-[8px]"><span class="flex shrink-0 text-erp-brand">${ICON[label]}</span>${badge}</span>`;
const pdf = (name, size) => ui.detailValues([ui.link(name, "#"), `<span class="text-erp-label">${size}</span>`, ui.link("내려받기", "#")]);

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  const prose = (...ps) => `<div class="flex flex-col gap-[12px] text-[14px] leading-[1.7] text-erp-ink">${ps.map((t) => `<p>${t}</p>`).join("")}</div>`;

  // 직원 상세와 같은 틀: 첫 줄 「문의사항 상세」 + 버튼, 문의·답변·진행은 머리 칸이 있는 상자 안에(2026-10-02 재영).
  // 머리 줄은 점포 정보 관리 상세의 점포명 줄과 같은 모양 — 제목 20px, 아래 「등록일 …」 | 분류 꼬리표(2026-11-05 사용자 지정)
  const head = `<div class="flex items-center gap-[18px]"><div class="flex min-w-0 flex-1 flex-col gap-[6px] py-[6px]"><h2 class="break-all text-[20px] font-semibold text-erp-ink">가맹점 초대 메일이 반송됩니다</h2><div class="flex items-center gap-[10px] text-[14px] font-medium text-erp-label"><span>등록일 2026-08-30 16:12</span><span class="h-[11px] w-px bg-[#d9d9d9]"></span><span class="flex items-center gap-[6px]">분류 ${p.tag("quiet", "점포·설비")}</span></div></div>${ui.button("목록", { href: L("support/inquiries.html") })}</div>`;
  const mine = p.box(
    "문의내용",
    "",
    prose("점포관리에서 가맹점 두 곳에 초대 메일을 보냈는데 둘 다 반송됩니다. 주소는 맞게 넣었고, 같은 주소로 제가 직접 보내면 잘 갑니다.", "반송 사유가 “발신 도메인 인증 실패”라고 나옵니다."),
    { pad: true },
  );
  const files = ui.detailTable("첨부파일", [["이미지", thumb("반송_메일_화면.png", "286 KB")], ["PDF", pdf("반송_사유_원문.pdf", "96 KB")]]);
  const answers = p.box(
    // 「답변 | 등록 일시 (수정됨 일시)」 — 제목 바로 옆 왼쪽(앱과 같다, 2026-11-05 사용자 지정)
    `<span class="inline-flex items-center gap-[10px]">답변<span class="h-[11px] w-px bg-[#d9d9d9]"></span><span class="text-[14px] font-normal text-erp-label">WHALE ERP 운영팀 · 등록 2026-08-31 09:40 (수정됨 2026-09-02 11:05)</span></span>`,
    "",
    // 마지막 답변만, 고친 답변이면 수정 시각만 붙인다. 이전 답변·고친 운영자는 문의자에게 보이지 않는다(운영 정책 CNT-17, 2026-10-08 재영).
    `<div class="flex flex-col gap-[12px]">${prose(
      "원인이 확인되어 조치했습니다. 가맹점 메일 서버가 발신 도메인 검증을 새로 켜면서 반송된 것으로, 발신 도메인 인증 설정을 갱신했습니다. 점포관리에서 <b>초대 다시 보내기</b>를 눌러 주세요.",
    )}</div>`,
    { pad: true },
  );
  const progress = p.box(
    "처리현황",
    "",
    // 세 단계를 진행 순서로 고정, 상태가 먼저(앞에 단계 아이콘) · 열 이름 줄 없음(앱 headVariant="none", 2026-11-05 사용자 지정).
    // 아직 안 된 단계는 앱에서 회색 아이콘 · 회색 글자 · 「-」로 흐리게 보인다 — 이 데모 문의는 답변까지 끝나 셋 다 진하다
    ui
      .dataTable(
        [{ header: "상태", align: "left", width: "w-[140px]" }, { header: "일시", align: "left" }],
        [
          [step("접수", p.tag("warn", "접수")), "08-30 16:12"],
          [step("처리중", p.tag("quiet", "처리중")), "08-31 09:12"],
          [step("답변완료", p.tag("ok", "답변완료")), "08-31 09:40"],
        ],
      )
      .replace(/<thead>[\s\S]*?<\/thead>/, "")
      .replace("border-x ", "border "),
  );
  const body = ui.detailBody(`${head}${p.cols(mine + files + answers, progress)}`);
  return { title: "문의상세", html: ui.erpFrame({ header: erpHeader(A, R), title: "문의하기", body }) };
};
