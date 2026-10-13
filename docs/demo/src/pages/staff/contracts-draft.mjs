// 근로계약 상세 — 임시저장. 상태별 버튼은 제목 줄에 선다: 임시저장은 삭제 · 이어 쓰기(2026-10-12).
// 삭제는 확인을 한 번 더 받고 지운 뒤 목록으로 간다. 임시저장은 발송한 적이 없어 행을 지운다.
import * as ui from "../../ui.mjs";
import * as p from "../../staff-parts.mjs";
import { erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const L = (path) => link(R, path);

  const head = `<div class="flex items-center gap-[6px]"><h2 class="flex-1 text-[18px] font-semibold text-erp-ink">근로계약 상세</h2>${
    p.ask("삭제", "soft", "임시저장한 근로계약서를 삭제하시겠습니까?", "한서윤 님의 임시저장을 지웁니다. 삭제하면 되돌릴 수 없습니다.", "삭제")
  }${ui.button("이어 쓰기", { variant: "soft", href: L("staff/contracts-new.html") })}${ui.button("목록", { href: L("staff/contracts.html") })}</div>`;

  const content = p.section(
    "계약 내용",
    "",
    ui.detailTable("근로계약", [
      ["직원", ui.detailValues(["한서윤", "010-4471-2286"])],
      ["직무", "바리스타"],
      ["근무지", "모리커피 성수점"],
      ["고용 형태", "파트타이머"],
      ["상태", p.tag("quiet", "임시저장")],
      ["계약 기간", "-"],
      ["시급", "-"],
      ["소정근로시간", "-"],
      ["임금지급일", "-"],
      ["4대보험", "-"],
      ["근무 장소", "-"],
    ]),
  );
  const history = p.section(
    "상태 변경 이력",
    p.tag("quiet", "1건"),
    ui.dataTable(
      [{ header: "일시", width: "w-[120px]" }, { header: "변경 전", width: "w-[120px]" }, { header: "변경 후", width: "w-[120px]" }, { header: "처리 주체", align: "left" }],
      [["09-30 17:12", "-", p.tag("quiet", "임시저장"), "정하윤 · 임시저장"]],
    ),
  );

  const body = ui.detailBody(`${head}${content}${history}`);
  return { title: "근로계약 상세 · 임시저장", html: ui.erpFrame({ header: erpHeader(A, R), title: "근로계약 관리", body }) };
};
