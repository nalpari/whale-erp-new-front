// 내 문의사항 상세(BP 사용자 쪽). 목업 docs/mockup/support/inquiry-mine.html 을 BP 마스터로 본 것. 내부 메모 없이 답변만 보인다.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const L = (path) => link(R, path);
  const prose = (...ps) => `<div class="flex flex-col gap-[12px] text-[14px] leading-[1.7] text-erp-ink">${ps.map((t) => `<p>${t}</p>`).join("")}</div>`;
  const by = (t) => `<p class="text-[13px] text-erp-label">${t}</p>`;

  const head = ui.sectionHead(
    "가맹점 초대 메일이 반송됩니다",
    ui.button("새 문의", { variant: "soft", href: L("support/inquiries.html") }) + ui.button("목록", { href: L("support/inquiries.html") }),
  );
  const mine = p.section(
    "내가 보낸 문의",
    `<span class="text-[13px] text-erp-label">08-30 16:12 · 점포·설비</span>`,
    prose("점포관리에서 가맹점 두 곳에 초대 메일을 보냈는데 둘 다 반송됩니다. 주소는 맞게 넣었고, 같은 주소로 제가 직접 보내면 잘 갑니다.", "반송 사유가 “발신 도메인 인증 실패”라고 나옵니다."),
  );
  const answers = p.section(
    "답변",
    "",
    `<div class="flex flex-col gap-[12px]">${by("09-02 11:05 · WHALE ERP 운영팀")}${prose(
      "원인이 확인되어 조치했습니다. 가맹점 메일 서버가 발신 도메인 검증을 새로 켜면서 반송된 것으로, 발신 도메인 인증 설정을 갱신했습니다. 점포관리에서 <b>초대 다시 보내기</b>를 눌러 주세요.",
    )}<hr class="border-erp-divider">${by("08-31 09:40 · WHALE ERP 운영팀")}${prose("접수했습니다. 반송 사유를 확인하고 있으며 내일 안에 답변드리겠습니다.")}</div>`,
  );
  const progress = p.section(
    "진행",
    "",
    ui.dataTable(
      [{ header: "일시" }, { header: "상태" }],
      [
        ["09-02 11:05", p.tag("ok", "답변완료")],
        ["08-31 09:40", p.tag("quiet", "처리중")],
        ["08-30 16:12", p.tag("warn", "접수")],
      ],
    ),
  );
  const body = ui.detailBody(`${head}${p.cols(mine + answers, progress)}`);
  return { title: "문의사항 상세", html: ui.erpFrame({ header: erpHeader(A, R), title: "문의사항 상세", body }) };
};
