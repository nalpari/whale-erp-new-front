// 내 문의사항 상세(BP 사용자 쪽). 목업 docs/mockup/support/inquiry-mine.html 을 BP 마스터로 본 것. 내부 메모 없이 답변만 보인다.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

// 첨부파일(운영 정책 CNT-18): 이미지는 작은 미리보기, PDF 는 이름 + 내려받기.
const thumb = (name, size) => `<a href="#" title="${name} · ${size}" class="grid size-[64px] place-items-center rounded-[2px] border border-erp-panel-line bg-erp-thead-bg text-[12px] text-erp-label">PNG</a>`;
const pdf = (name, size) => ui.detailValues([ui.link(name, "#"), `<span class="text-erp-label">${size}</span>`, ui.link("내려받기", "#")]);

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  const prose = (...ps) => `<div class="flex flex-col gap-[12px] text-[14px] leading-[1.7] text-erp-ink">${ps.map((t) => `<p>${t}</p>`).join("")}</div>`;
  const by = (t) => `<p class="text-[13px] text-erp-label">${t}</p>`;

  // 직원 상세와 같은 틀: 첫 줄 「문의사항 상세」 + 버튼, 문의·답변·진행은 머리 칸이 있는 상자 안에(2026-10-02 재영).
  const head = p.detailHead(
    "문의사항 상세",
    ui.button("새 문의", { variant: "soft", href: L("support/inquiries.html") }) + ui.button("목록", { href: L("support/inquiries.html") }),
  );
  const mine = p.box(
    "가맹점 초대 메일이 반송됩니다",
    `<span class="text-[13px] text-erp-label">08-30 16:12 · 점포·설비</span>`,
    prose("점포관리에서 가맹점 두 곳에 초대 메일을 보냈는데 둘 다 반송됩니다. 주소는 맞게 넣었고, 같은 주소로 제가 직접 보내면 잘 갑니다.", "반송 사유가 “발신 도메인 인증 실패”라고 나옵니다."),
    { pad: true },
  );
  const files = ui.detailTable("첨부파일", [["이미지", thumb("반송_메일_화면.png", "286 KB")], ["PDF", pdf("반송_사유_원문.pdf", "96 KB")]]);
  const answers = p.box(
    "답변",
    "",
    // 마지막 답변만, 고친 답변이면 수정 시각만 붙인다. 이전 답변·고친 운영자는 문의자에게 보이지 않는다(운영 정책 CNT-17, 2026-10-08 재영).
    `<div class="flex flex-col gap-[12px]">${by("08-31 09:40 · WHALE ERP 운영팀 · 수정됨 09-02 11:05")}${prose(
      "원인이 확인되어 조치했습니다. 가맹점 메일 서버가 발신 도메인 검증을 새로 켜면서 반송된 것으로, 발신 도메인 인증 설정을 갱신했습니다. 점포관리에서 <b>초대 다시 보내기</b>를 눌러 주세요.",
    )}</div>`,
    { pad: true },
  );
  const progress = p.box(
    "진행",
    "",
    ui.dataTable(
      [{ header: "일시" }, { header: "상태" }],
      [
        ["08-31 09:40", p.tag("ok", "답변완료")],
        ["08-31 09:12", p.tag("quiet", "처리중")],
        ["08-30 16:12", p.tag("warn", "접수")],
      ],
    ),
  );
  const body = ui.detailBody(`${head}${p.cols(mine + files + answers, progress)}`);
  return { title: "문의사항 상세", html: ui.erpFrame({ header: erpHeader(A, R), title: "문의하기", body }) };
};
