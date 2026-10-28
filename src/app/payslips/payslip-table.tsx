import Link from "next/link";
import type { ReactNode } from "react";
import { DataTable, Tag, type Column } from "@/components/common";
import { labelOf, type EnumValue } from "@/lib/enums";
import type { PayslipListItem } from "@/lib/payslips";
import { rowNumber } from "../staff-members/staff-row";
import { CellView } from "../staff-members/staff-table";
import { MASKED_TEXT, REVIEW_PENDING_TEXT, STATUS_STYLE, attendanceCell, periodText, sentDateText } from "./payslip-row";

const DASH = "-";

type Row = { no: number; payslip: PayslipListItem };

/** 명세서 줄의 칸. 가린 줄은 「-」. */
const shown = (render: (payslip: PayslipListItem) => ReactNode) => (r: Row) => (r.payslip.isMasked ? DASH : render(r.payslip));

// 급여명세서 목록. 칸은 Plane WHALEERP-233 을 따른다 — 데모 payList 의 근로시간 · 기본급 · 수당 · 공제 · 실지급 칸은 두지 않는다.
// 가린 줄(본사 제공 동의 없는 가맹 점포 직원, ATT-30)은 그대로 서고 근무지 · 급여 기간 밖은 가리며 상세로 가지 않는다.
export function PayslipTable({
  items,
  total,
  page,
  pageSize,
  listSearch,
  statusLabels,
  employmentTypeLabels,
  reviewReasonLabels,
  filtered = false,
}: {
  items: PayslipListItem[];
  total: number;
  page: number;
  pageSize: number;
  /** 지금 목록 조건(toPayslipListSearch). 상세 링크에 붙여 상세의 「목록」이 같은 조건으로 돌아오게 한다. */
  listSearch: string;
  statusLabels: EnumValue[];
  employmentTypeLabels: EnumValue[];
  reviewReasonLabels: EnumValue[];
  /** 상태 · 직원명 · 검토 대기만으로 거른 목록인가 — 비었을 때 문구가 다르다 */
  filtered?: boolean;
}) {
  const rows: Row[] = items.map((payslip, i) => ({ no: rowNumber(total, page, pageSize, i), payslip }));
  const columns: Column<Row>[] = [
    { header: "순번", width: "w-[60px]", cell: (r) => r.no },
    { header: "급여 기간", width: "w-[220px]", cell: (r) => periodText(r.payslip) },
    {
      header: "직원명",
      cell: ({ payslip }) =>
        payslip.isMasked || payslip.payslipId === null ? (
          <span className="text-erp-muted">{MASKED_TEXT}</span>
        ) : (
          <Link href={`/payslips/${payslip.payslipId}${listSearch}`} className="text-erp-link hover:underline">
            {payslip.staffName}
          </Link>
        ),
    },
    { header: "근무지", cell: (r) => r.payslip.storeName },
    { header: "계약 유형", width: "w-[120px]", cell: shown((p) => (p.employmentType ? labelOf(employmentTypeLabels, p.employmentType) : DASH)) },
    {
      header: "출퇴근 확인 여부",
      width: "w-[140px]",
      cell: shown((p) => {
        const cell = attendanceCell(p);
        return cell ? <CellView cell={cell} /> : DASH;
      }),
    },
    {
      header: "상태",
      width: "w-[180px]",
      // 검토 대기는 상태가 아니라 분류라 상태 배지 옆에 꼬리표(Tag)로 붙인다 — 「검토 중」 상태 배지(빨강)와 다른 모양으로(운영 정책
      // v221 PAY-06). 사유는 꼬리표에 마우스를 올리면 보이고(화면 낭독기는 숨긴 글자로 읽는다), 내용은 상세에서 본다
      cell: shown((p) => {
        const reasons = p.pendingReviewReasons?.map((r) => labelOf(reviewReasonLabels, r)).join(" · ");
        return p.status ? (
          <span className="inline-flex flex-wrap items-center gap-[4px]">
            <CellView cell={{ text: labelOf(statusLabels, p.status), style: STATUS_STYLE[p.status] }} />
            {reasons && (
              <span title={reasons}>
                <Tag>{REVIEW_PENDING_TEXT}</Tag>
                <span className="sr-only"> — {reasons}</span>
              </span>
            )}
          </span>
        ) : (
          DASH
        );
      }),
    },
    { header: "발송일", width: "w-[100px]", cell: shown(sentDateText) },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      // 가린 줄은 payslipId 가 null 이라 순번으로 가른다(직원 목록과 같다)
      rowKey={(r) => r.payslip.payslipId ?? `masked-${r.no}`}
      empty={filtered ? "조건에 맞는 급여명세서가 없습니다." : "이 달의 급여명세서가 없습니다."}
    />
  );
}
