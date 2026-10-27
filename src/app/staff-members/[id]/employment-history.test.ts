// node --test "src/app/staff-members/[[]id]/employment-history.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { detailListHrefOf } from "../staff-list-query.ts";
import { employmentHistoryLines, historySearch, periodText } from "./employment-history.ts";

const period = (staffMemberId: number, hiredDate: string | null, retiredDate: string | null) => ({ staffMemberId, hiredDate, retiredDate });

test("기간은 입사일 ~ 퇴직일이고, 퇴직일을 정하지 않았으면 재직 중이다", () => {
  assert.equal(periodText(period(1, "2024-03-04", "2025-08-31")), "2024-03-04 ~ 2025-08-31");
  assert.equal(periodText(period(2, "2026-03-01", null)), "2026-03-01 ~ 재직 중");
});

test("입사일이 비어 있으면 「-」 — 입사일 채우기(WHALEERP-613) 전에 체결된 레코드", () => {
  assert.equal(periodText(period(1, null, "2025-08-31")), "- ~ 2025-08-31");
});

test("이은 레코드가 없으면 줄을 두지 않는다", () => {
  assert.deepEqual(employmentHistoryLines({ previousRecords: [], laterRecords: [] }, ""), []);
});

test("이전 재직은 「재직 이력」, 이후 재입사는 「이후 재입사」 줄 — api 순서(가까운 것부터) 그대로, 받은 조건을 이어 단다", () => {
  const lines = employmentHistoryLines(
    {
      previousRecords: [period(7, "2025-01-02", "2025-06-30"), period(3, "2024-01-02", "2024-06-30")],
      laterRecords: [period(12, "2026-03-01", null)],
    },
    "?back=%2Fstaff-members%3Fpage%3D2",
  );
  assert.deepEqual(lines, [
    {
      label: "재직 이력",
      note: "이전 재직",
      links: [
        { href: "/staff-members/7?back=%2Fstaff-members%3Fpage%3D2", text: "2025-01-02 ~ 2025-06-30" },
        { href: "/staff-members/3?back=%2Fstaff-members%3Fpage%3D2", text: "2024-01-02 ~ 2024-06-30" },
      ],
    },
    { label: "이후 재입사", note: null, links: [{ href: "/staff-members/12?back=%2Fstaff-members%3Fpage%3D2", text: "2026-03-01 ~ 재직 중" }] },
  ]);
});

test("재직 이력 링크는 [목록] 주소를 ?back= 으로 싣고 근무스케줄 주를 더한다 — 기본 목록 · 날짜가 아닌 주는 싣지 않는다", () => {
  const back = "/staff-members?keyword=%ED%99%8D&page=2";
  assert.equal(historySearch(back, "2025-06-02"), `?back=${encodeURIComponent(back)}&week=2025-06-02`);
  assert.equal(historySearch("/staff-members", "2025-06-02"), "?week=2025-06-02");
  assert.equal(historySearch(back, undefined), `?back=${encodeURIComponent(back)}`);
  assert.equal(historySearch(back, "abc"), `?back=${encodeURIComponent(back)}`);
  // 근무스케줄 칸(weekParam)과 같다 — 여럿이면 앞의 것, 월요일이 아니면 그 주 월요일
  assert.equal(historySearch("/staff-members", ["2025-06-02", "2025-06-09"]), "?week=2025-06-02");
  assert.equal(historySearch("/staff-members", "2025-06-04"), "?week=2025-06-02");
});

test("재직 이력 링크로 간 상세의 [목록]은 원래 목록 주소다 — week 는 목록에 들어가지 않는다", () => {
  const back = "/staff-members?keyword=%ED%99%8D&page=2";
  const search = Object.fromEntries(new URLSearchParams(historySearch(back, "2025-06-02")));
  assert.equal(detailListHrefOf(search), back);
  assert.equal(detailListHrefOf(Object.fromEntries(new URLSearchParams(historySearch("/staff-members", "2025-06-02")))), "/staff-members");
});
