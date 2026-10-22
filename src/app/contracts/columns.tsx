import Link from "next/link";
import { Badge, type Column } from "@/components/common";
import { labelOf, type EnumValue } from "@/lib/enums";
import { deadlineNote, periodText, sentText, wageText, withBack, type ContractListItem } from "./contract-list";

type Status = NonNullable<ContractListItem["status"]>;

export function StatusBadge({ status, label }: { status: Status; label: string }) {
  if (status === "SIGNED") return <Badge tone="on">{label}</Badge>;
  // 수정 요청은 관리자가 고쳐 다시 보내야 하는 상태라 서명 대기 · 거부 · 만료처럼 눈에 띄게 둔다
  if (status === "PENDING_SIGNATURE" || status === "CORRECTION_REQUESTED" || status === "REJECTED" || status === "EXPIRED")
    return <Badge tone="off">{label}</Badge>;
  // 임시저장·발송 대기·종료는 주의가 필요 없는 상태라 색 없이 둔다. 공통 Badge 에 중립 톤이 없어 데모와 같은 모양을 여기서 그린다.
  return <span className="inline-block rounded-[2px] bg-erp-subtle px-[4px] py-[2px] text-[14px] font-medium whitespace-nowrap text-erp-ink">{label}</span>;
}

type Row = ContractListItem & { no: number };

// 상태별 버튼(이어 쓰기 · 삭제 · 재발송 · 새 계약)은 상세 화면 위쪽에 있다. 목록은 직원 이름으로 상세에 들어간다.
// 임시저장은 상세를 거치지 않고 이어 쓰기 화면으로 바로 간다. 상세로는 지금 목록 주소(listHref)를 ?back= 으로 넘겨 [목록]이 같은 조건으로 돌아온다.
export function contractColumns(
  statuses: EnumValue[],
  now: Date,
  draftActions: EnumValue[] = [],
  employmentTypes: EnumValue[] = [],
  listHref = "/contracts",
): Column<Row>[] {
  return [
    { header: "순번", width: "w-[60px]", cell: (r) => r.no },
    {
      header: "직원",
      cell: (r) => (
        <Link
          href={r.status === "DRAFT" ? `/contracts/${r.contractId}/edit` : withBack(`/contracts/${r.contractId}`, listHref)}
          className="text-erp-link hover:underline"
        >
          {r.staffMemberName}
        </Link>
      ),
    },
    { header: "점포", cell: (r) => r.storeName ?? "-" },
    { header: "고용 형태", cell: (r) => (r.employmentType ? labelOf(employmentTypes, r.employmentType) : "-") },
    { header: "계약 기간", width: "w-[220px]", cell: periodText },
    { header: "급여", cell: wageText },
    { header: "발송일", cell: (r) => sentText(r.sentAt) },
    {
      header: "상태",
      cell: (r) => {
        // 발송 대기는 판별한 초대 유형을 붙인다(예: 발송 대기 · 가입 초대). 서명 대기는 남은 날.
        const note = r.status === "PENDING_SEND" && r.draftAction ? labelOf(draftActions, r.draftAction) : deadlineNote(r, now);
        if (!r.status) return "-";
        const label = labelOf(statuses, r.status);
        return <StatusBadge status={r.status} label={note ? `${label} · ${note}` : label} />;
      },
    },
  ];
}
