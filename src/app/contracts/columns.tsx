import Link from "next/link";
import { Badge, Button, type Column } from "@/components/common";
import { labelOf, type EnumValue } from "@/lib/enums";
import { deadlineNote, periodText, sentText, wageText, type ContractListItem } from "./contract-list";

type Status = NonNullable<ContractListItem["status"]>;

function StatusBadge({ status, label }: { status: Status; label: string }) {
  if (status === "SIGNED") return <Badge tone="on">{label}</Badge>;
  if (status === "PENDING_SIGNATURE" || status === "REJECTED" || status === "EXPIRED") return <Badge tone="off">{label}</Badge>;
  // 임시저장·발송 대기·종료는 주의가 필요 없는 상태라 색 없이 둔다. 공통 Badge 에 중립 톤이 없어 데모와 같은 모양을 여기서 그린다.
  return <span className="inline-block rounded-[2px] bg-erp-subtle px-[4px] py-[2px] text-[14px] font-medium whitespace-nowrap text-erp-ink">{label}</span>;
}

// 상태마다 할 수 있는 일. 동작(재발송·새 계약)은 아직 API 가 없어 버튼 모양만 둔다. 임시저장은 아래에서 이어 쓰기로 연다.
const ACTION: Partial<Record<Status, { label: string; href?: string }>> = {
  PENDING_SEND: { label: "초대 재발송" },
  PENDING_SIGNATURE: { label: "재발송" },
  EXPIRED: { label: "재발송" },
  REJECTED: { label: "상세", href: "#" },
  SIGNED: { label: "새 계약", href: "#" },
};

type Row = ContractListItem & { no: number };

export function contractColumns(statuses: EnumValue[], now: Date, draftActions: EnumValue[] = []): Column<Row>[] {
  return [
    { header: "순번", width: "w-[60px]", cell: (r) => r.no },
    {
      header: "직원",
      cell: (r) =>
        r.status === "REJECTED" ? (
          <Link href="#" className="text-erp-link hover:underline">
            {r.staffMemberName}
          </Link>
        ) : (
          r.staffMemberName
        ),
    },
    { header: "점포", cell: (r) => r.storeName ?? "-" },
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
    {
      header: "",
      width: "w-[160px]",
      cell: (r) => {
        if (r.status === "DRAFT")
          return (
            <Button variant="off" href={`/contracts/${r.contractId}/edit`}>
              이어 쓰기
            </Button>
          );
        const action = r.status ? ACTION[r.status] : undefined;
        if (!action) return null;
        return action.href !== undefined ? (
          <Button variant="off" href={action.href}>
            {action.label}
          </Button>
        ) : (
          <Button variant="off">{action.label}</Button>
        );
      },
    },
  ];
}
