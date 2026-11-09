"use client";

import { useState, type ReactNode } from "react";
import { DataTable, Pagination } from "@/components/common";
import type { EnumValue } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import type { TodoDetail } from "@/lib/todos-api";
import { StaffName } from "../staff-names";
import { historyActorText, historyText } from "../todo-row";

type HistoryRow = TodoDetail["histories"][number] & { key: number };

// 한 쪽에 보이는 이력 수 — api 는 상세에 이력을 모두 실어 보내 화면에서 나눈다(2026-11-09 사용자 지정, 3팀 확인 필요 — 전엔 끝없이 늘어났다)
const PAGE_SIZE = 10;

/** 상세 상자 제목 줄 — 상세 표(DetailTable) 제목과 같은 42px 회색 줄 · 15px 600. 아래 표는 열 이름 줄을 흰 바탕(plain)으로 둬 회색이 두 겹이 되지 않게 한다 */
export function TitledBox({ title, meta, children }: { title: string; /** 제목 뒤 세로선 다음에 붙는 「이름 [꼬리표]」 */ meta?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <div className="flex h-[42px] items-center gap-[10px] rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px]">
        <h3 className="text-[15px] font-semibold text-erp-ink">{title}</h3>
        {meta && (
          <>
            {/* 문의 상세 머리 줄 「분류 [꼬리표]」와 같은 모양 — 사이 #d9d9d9 세로선(DESIGN 값 구분선), 이름 회색 14px 500 */}
            <span aria-hidden="true" className="h-[11px] w-px bg-[#d9d9d9]" />
            <span className="flex min-w-0 items-center gap-[6px] text-[14px] font-medium text-erp-label">{meta}</span>
          </>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * 상태 변경이력 — 변경일시 · 변경자 · 상태, 최근 것이 위. 10건씩 쪽으로 나눈다.
 * who 는 여러 명에게 나눈 TO-DO 에서 이 이력의 직원 — api 가 행 하나의 이력만 주므로 제목 줄에 「직원 [서지안]」 꼬리표로 누구 것인지 적는다(2026-11-09 사용자 지정)
 */
export function TodoHistory({ histories, statusLabels, who }: { histories: TodoDetail["histories"]; statusLabels: EnumValue[]; who?: string }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(histories.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows: HistoryRow[] = histories.map((h, i) => ({ ...h, key: i })).slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  return (
    // 누구의 이력인지 「상태 변경이력 | 직원 [서지안]」 — 이름은 꼬리표(2026-11-09 사용자 지정)
    <TitledBox
      title="상태 변경이력"
      meta={
        who && (
          <>
            직원{" "}
            {/* 이름 꼬리표는 눈에 잘 띄게 연한 분홍 바탕 + 굵은 먹색 — BP 휴일 「전체 점포」 꼬리표(ScopeTag)와 같은 바탕 · 모양(2026-11-09 사용자 지정) */}
            <span className="inline-block rounded-[2px] border border-erp-thead-line bg-erp-off-bg px-[4px] py-px text-[14px] font-semibold whitespace-nowrap text-erp-ink">{who}</span>
          </>
        )
      }
    >
      <DataTable<HistoryRow>
        headVariant="plain"
        columns={[
          // 열은 변경일시 · 변경자 · 상태 순(2026-11-09 사용자 지정, 3팀 확인 필요 — 전엔 「일시」 · 「변경」 · 「바꾼 사람」)
          { header: "변경일시", width: "w-[150px]", cell: (h) => formatDateTime(h.changedAt) },
          { header: "변경자", width: "w-[110px]", cell: (h) => <StaffName text={historyActorText(h)} masked={!h.changedByName && h.isStaffMemberMasked} /> },
          { header: "상태", align: "left", cell: (h) => historyText(h, statusLabels) },
        ]}
        rows={rows}
        rowKey={(h) => h.key}
        empty="이력이 없습니다."
      />
      {totalPages > 1 && (
        <div className="pt-[12px]">
          <Pagination page={current} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </TitledBox>
  );
}
