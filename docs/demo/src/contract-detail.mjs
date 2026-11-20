// 근로계약 상세 틀. 상태마다 화면을 하나씩 두고(발송 대기 · 정보 확인 필요 · 서명 대기 · 체결 완료 · 거부 · 종료) 내용만 바꿔 끼운다.
// 상태별 버튼은 제목 줄에 선다(2026-10-12) — 발송 대기: 초대 재발송 / 서명 대기·만료: 재발송 / 체결 완료: 새 계약 / 거부·종료: 없음.
// 임시저장은 상세 없이 이어 쓰기 화면(contracts-draft, 작성 화면과 같은 틀)으로 바로 간다(2026-10-13).
// 틀은 앱 contracts/[contractId]/page.tsx 와 같다 — 제목 줄(제목 + 버튼) → 요약 띠(성명 · 고용형태 · 계약 방식 · 근무지 · 계약 기간 · 상태) → 두 단
// (왼쪽 직원 정보 · 근로 정보, 오른쪽 둥근 확인 상자 발송 · 서명 정보 · 계약서 파일 · 상태 변경이력)(DESIGN.md 「상세 화면 틀」, 2026-11-19 사용자 지정).
import * as ui from "./ui.mjs";
import * as p from "./staff-parts.mjs";
import { erpHeader, link } from "./site.mjs";

// 데모 점포의 유형 — 홈 「운영 점포별 현황」(pages/home/signed-in.mjs)과 같다
const STORE_TYPE = { "모리커피 서초점": "직영", "모리커피 성수점": "직영", "모리커피 연남점": "가맹" };
const text = (html) => html.replace(/<[^>]+>/g, "");

// c: { title, actions(L), band(L), kind, rows, doc, signed, history, steps, send }
// rows 의 「직원」 · 「근무지」 · 「고용 형태」 · 「계약 기간」 · 「근무 장소」 줄과 send 의 「계약 방식」 줄, history 맨 윗줄의 변경 후 상태로 요약 띠를 만든다.
export function contractDetail({ A, R }, c) {
  const L = (path) => link(R, path);
  const row = (label) => c.rows.find(([l]) => l === label)?.[1] ?? "-";
  // 화면 제목은 메뉴 이름(근로계약 관리), 본문 첫 줄에 「근로계약 상세」 + 상태별 버튼 + 목록(직원 상세와 같은 틀, 2026-10-02 재영)
  const head = `<div class="flex items-center gap-[6px]"><h2 class="min-w-0 flex-1 text-[18px] font-semibold text-erp-ink">근로계약 상세</h2>${c.actions ? c.actions(L) : ""}${ui.button("목록", { href: L("staff/contracts.html") })}</div>`;
  const band = c.band ? c.band(L) : "";

  const name = row("직원").match(/^<span[^>]*>([^<]+)</)?.[1] ?? text(row("직원"));
  const store = row("근무지");
  const storeHtml = STORE_TYPE[store] ? p.storeName(STORE_TYPE[store], store) : store;
  // 종료일이 없으면 표준근로계약서 용어 「기간의 정함 없음」(앱과 같다, 2026-11-19 사용자 지정)
  const period = row("계약 기간").replace("무기한", "기간의 정함 없음");
  const summary = p.summaryStrip([
    ["성명", name],
    ["고용형태", row("고용 형태")],
    ["계약 방식", text(c.send.find(([l]) => l === "계약 방식")?.[1] ?? "-")],
    ["근무지", storeHtml],
    ["계약 기간", period],
    ["상태", c.history[0]?.[2] ?? "-"],
  ]);

  // 왼쪽 — 「직원 정보」(누구) · 「근로 정보」(근로 조건). 고용 형태는 요약 띠에 있어 두지 않고, 근무 장소는 소속 근무지 줄 끝에 회색으로 붙인다
  const place = row("근무 장소");
  const work = c.rows
    .filter(([l]) => !["직원", "고용 형태", "근무 장소"].includes(l))
    .map(([l, v, multi]) =>
      l === "근무지"
        ? ["소속 근무지", `<span class="flex min-w-0 items-center gap-[6px]">${storeHtml}<span class="min-w-0 truncate text-erp-label">${place === "-" || place === store ? "(근무 장소 동일)" : `(근무 장소: ${place})`}</span></span>`]
        : l === "계약 기간"
          ? [l, period]
          : [l, v, multi],
    );
  const left = ui.detailTable("직원 정보", c.rows.filter(([l]) => l === "직원")) + ui.detailTable("근로 정보", work);

  // 오른쪽 둥근 확인 상자 — 발송 · 서명 정보(계약 방식은 요약 띠로 옮겼다) · 계약서 파일 · 상태 변경이력
  const send = p.roundBox("발송 · 서명 정보", p.roundRows(c.send.filter(([l]) => l !== "계약 방식")));
  const files = p.roundBox(
    "계약서 파일",
    p.roundRows([["보낸 원본", `<span class="flex min-w-0 items-center gap-[6px]">${ui.link(c.doc, "#")}<span class="shrink-0 text-erp-label">(최근 발송)</span></span>`, true]]),
  );
  // 상태 변경이력 — 급여명세서 처리내역과 같은 한 줄: 왼쪽 「A → B」, 오른쪽 「변경자 | 일시」. 처음 줄은 「등록 · …」
  const history = p.roundBox(
    "상태 변경이력",
    p.historyLines(
      c.history.map(([when, from, to, who]) => [
        from === "-" ? `등록 · ${text(to)}` : `${text(from)} → ${text(to)}`,
        text(who).split(" · ")[0],
        /^\d{4}-/.test(when) ? when : `2026-${when}`,
      ]),
    ),
  );

  const body = ui.detailBody(`<div class="flex flex-col gap-[12px]">${head}${summary}${band}</div>${p.cols(left, send + files + history, "grid-cols-[3fr_2fr]")}`);
  return { title: c.title, html: ui.erpFrame({ header: erpHeader(A, R), title: "근로계약 관리", body }) };
}
