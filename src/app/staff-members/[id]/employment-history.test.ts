// node --test "src/app/staff-members/[[]id]/employment-history.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { employmentHistoryLines, periodText } from "./employment-history.ts";

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

test("응답에 재직 이력 칸이 없으면(api #136 배포 전) 줄을 두지 않는다 — 상세가 오류가 되지 않게", () => {
  const before = {} as Parameters<typeof employmentHistoryLines>[0];
  assert.deepEqual(employmentHistoryLines(before, ""), []);
});

test("이전 재직은 「재직 이력」, 이후 재입사는 「이후 재입사」 줄 — api 순서(가까운 것부터) 그대로, 목록 조건을 이어 단다", () => {
  const lines = employmentHistoryLines(
    {
      previousRecords: [period(7, "2025-01-02", "2025-06-30"), period(3, "2024-01-02", "2024-06-30")],
      laterRecords: [period(12, "2026-03-01", null)],
    },
    "?store=5",
  );
  assert.deepEqual(lines, [
    {
      label: "재직 이력",
      note: "이전 재직",
      links: [
        { href: "/staff-members/7?store=5", text: "2025-01-02 ~ 2025-06-30" },
        { href: "/staff-members/3?store=5", text: "2024-01-02 ~ 2024-06-30" },
      ],
    },
    { label: "이후 재입사", note: null, links: [{ href: "/staff-members/12?store=5", text: "2026-03-01 ~ 재직 중" }] },
  ]);
});
