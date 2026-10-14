// 근로계약 상세 틀. 상태마다 화면을 하나씩 두고(발송 대기 · 연결 보류 · 서명 대기 · 체결 완료 · 거부 · 종료) 내용만 바꿔 끼운다.
// 상태별 버튼은 제목 줄에 선다(2026-10-12) — 발송 대기: 초대 재발송 / 서명 대기·만료: 재발송 / 체결 완료: 새 계약 / 거부·종료: 없음.
// 임시저장은 계약 내용이 비어 틀이 달라 contracts-draft 가 따로 그린다.
import * as ui from "./ui.mjs";
import * as p from "./staff-parts.mjs";
import { erpHeader, link } from "./site.mjs";

// c: { title, actions(L), band(L), kind, rows, doc, signed, history, steps, send }
export function contractDetail({ A, R }, c) {
  const L = (path) => link(R, path);
  // 화면 제목은 메뉴 이름(근로계약 관리), 본문 첫 줄에 「근로계약 상세」 + 상태별 버튼 + 목록(직원 상세와 같은 틀, 2026-10-02 재영)
  const head = `<div class="flex items-center gap-[6px]"><h2 class="flex-1 text-[18px] font-semibold text-erp-ink">근로계약 상세</h2>${c.actions ? c.actions(L) : ""}${ui.button("목록", { href: L("staff/contracts.html") })}</div>`;
  const band = c.band ? c.band(L) : "";

  const content = p.section(
    "계약 내용",
    p.ask("원본 내려받기", "off", "근로계약서 원본을 내려받으시겠습니까?", c.doc, "내려받기") +
      ui.button("날인본 내려받기", { variant: "off", disabled: true, title: "종이 계약일 때만 쓴다" }),
    ui.detailTable(c.kind, c.rows),
  );
  const history = p.section(
    "상태 변경 이력",
    p.tag("quiet", `${c.history.length}건`),
    ui.dataTable(
      [{ header: "일시", width: "w-[120px]" }, { header: "변경 전", width: "w-[120px]" }, { header: "변경 후", width: "w-[120px]" }, { header: "처리 주체", align: "left" }],
      c.history,
    ),
  );
  const progress = p.section("진행", "", p.steps(c.steps), ui.detailTable("발송", c.send));

  const body = ui.detailBody(`<div class="flex flex-col gap-[12px]">${head}${band}</div>${p.cols(content + history, progress)}`);
  return { title: c.title, html: ui.erpFrame({ header: erpHeader(A, R), title: "근로계약 관리", body }) };
}
