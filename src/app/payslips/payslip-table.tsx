import Link from "next/link";
import type { ReactNode } from "react";
import { DataTable, Tag, type Column } from "@/components/common";
import { labelOf, type EnumValue } from "@/lib/enums";
import type { PayslipListItem } from "@/lib/payslips";
import { rowNumber } from "../staff-members/staff-row";
import { CellView } from "../staff-members/staff-table";
import { MASKED_TEXT, REVIEW_PENDING_TEXT, STATUS_STYLE, attendanceCell, periodText, sentDateText } from "./payslip-row";
import { StoreNameWithType } from "@/components/site/store-type-tag";

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
  at = (path) => path,
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
  /** 상세 링크에 탭 BP 를 붙인다(목록 화면의 screenPath, WHALEERP-637) — listSearch 는 쿼리 문자열이라 BP 와 상관없다 */
  at?: (path: string) => string;
}) {
  const rows: Row[] = items.map((payslip, i) => ({ no: rowNumber(total, page, pageSize, i), payslip }));
  // 1260 창 기준 열 폭 — 내용이 정해진 열은 가장 긴 값에 맞춘 고정 폭이고 근무지가 남는 폭을 갖는다(2026-11-18 사용자 지정 · 1260 작업)
  const columns: Column<Row>[] = [
    { header: "순번", width: "w-[60px]", cell: (r) => r.no },
    // 「2026-10-01 ~ 2026-10-31」(160px)
    { header: "급여 기간", width: "w-[180px]", cell: (r) => periodText(r.payslip) },
    {
      // 「본사에 정보제공 미동의」(157px)가 한 줄에 든다
      header: "직원명",
      width: "w-[170px]",
      cell: ({ payslip }) =>
        payslip.isMasked || payslip.payslipId === null ? (
          <span className="text-erp-muted">{MASKED_TEXT}</span>
        ) : (
          <Link href={at(`/payslips/${payslip.payslipId}${listSearch}`)} className="text-erp-link hover:underline">
            {payslip.staffName}
          </Link>
        ),
    },
    // 남는 폭(표 최소 폭이 100px 을 지킨다) — 길이가 제각각인 이름이라 왼쪽 정렬(직원 · 근로계약 목록과 같다)
    // 근무지도 기준 폭(100)을 둔다 — 넓은 창에서는 모든 열이 같은 비율로 늘어난다 — 이 열만 남는 폭을 가지면 넓은 창에서 혼자 넓어져 표가 휑했다(2026-11-18 사용자 지정)
    // 근무지 이름 앞에 본사 · 직영 · 가맹 꼬리표 — 직원 · 근로계약 목록과 같다. 꼬리표만큼 기준 폭을 130 으로 늘렸다(2026-11-19 사용자 지정)
    { header: "근무지", width: "w-[130px]", align: "left", cell: (r) => <StoreNameWithType storeId={r.payslip.storeId} name={r.payslip.storeName} isHq={r.payslip.storeIsHq} /> },
    { header: "계약 유형", width: "w-[90px]", cell: shown((p) => (p.employmentType ? labelOf(employmentTypeLabels, p.employmentType) : DASH)) },
    {
      // 열 이름 9자가 꺾이지 않는 폭
      header: "출퇴근 확인 여부",
      width: "w-[130px]",
      cell: shown((p) => {
        const cell = attendanceCell(p);
        return cell ? <CellView cell={cell} /> : DASH;
      }),
    },
    {
      // 「작성 중」 + 「검토 대기」 꼬리표(약 125px)
      header: "상태",
      width: "w-[150px]",
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
    { header: "발송일", width: "w-[70px]", cell: shown(sentDateText) },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      // 가린 줄은 payslipId 가 null 이라 순번으로 가른다(직원 목록과 같다)
      rowKey={(r) => r.payslip.payslipId ?? `masked-${r.no}`}
      empty={filtered ? "조건에 맞는 급여명세서가 없습니다." : "이 달의 급여명세서가 없습니다."}
      // 비었을 때 열 이름 줄은 두고 빈 칸이 목록 영역 남는 높이를 채운다(직원 · 점포 목록과 같다, 2026-11-04 사용자 지정)
      fillEmpty
      // 1260 창에서 필터를 펼치면 표 자리(약 920px)보다 넓다 — 근무지 100px 을 지키고 표 상자 안에서만 가로로 민다(직원 · 점포 · 근로계약 목록과
      // 같다). 고정 열 합 850 + 근무지 100
      scroll
      minWidth="min-w-[950px]"
    />
  );
}
