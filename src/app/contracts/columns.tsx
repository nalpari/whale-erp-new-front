import Link from "next/link";
import { Badge, type Column } from "@/components/common";
import { labelOf, type EnumValue } from "@/lib/enums";
import { periodText, sentText, statusNotes, wageText, withBack, type ContractListItem } from "./contract-list";
import { storeOptionLabel } from "@/lib/store-scope";

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
// 임시저장은 상세를 거치지 않고 이어 쓰기 화면으로 바로 간다. 어느 쪽이든 지금 목록 주소(listHref)를 ?back= 으로 넘겨 [목록]이 같은 조건으로 돌아온다.
// at 은 링크에 탭 BP 를 붙인다(목록 화면의 screenPath) — listHref · ?back= 은 옛 경로 그대로다.
export function contractColumns(
  statuses: EnumValue[],
  now: Date,
  draftActions: EnumValue[] = [],
  employmentTypes: EnumValue[] = [],
  listHref = "/contracts",
  at: (path: string) => string = (path) => path,
): Column<Row>[] {
  // 1260 창 기준 열 폭 — 내용이 정해진 열은 가장 긴 값에 맞춘 고정 폭이고 점포가 남는 폭을 갖는다(2026-11-18 사용자 지정 · 1260 작업).
  // 전엔 순번 · 계약 기간 밖의 열이 남는 폭을 똑같이 나눠 짧은 발송일이 긴 상태와 같은 폭이었고 상태가 잘렸다
  return [
    { header: "순번", width: "w-[60px]", cell: (r) => r.no },
    {
      header: "직원",
      width: "w-[110px]",
      cell: (r) => (
        <Link
          href={at(withBack(r.status === "DRAFT" ? `/contracts/${r.contractId}/edit` : `/contracts/${r.contractId}`, listHref))}
          className="text-erp-link hover:underline"
        >
          {r.staffMemberName}
        </Link>
      ),
    },
    // 남는 폭(표 최소 폭이 120px 을 지킨다) — 길이가 제각각인 이름이라 왼쪽 정렬(직원 목록과 같다)
    // 점포도 기준 폭(120)을 둔다 — 넓은 창에서는 모든 열이 같은 비율로 늘어난다 — 이 열만 남는 폭을 가지면 넓은 창에서 혼자 넓어져 표가 휑했다(2026-11-18 사용자 지정)
    { header: "점포", width: "w-[120px]", align: "left", cell: (r) => (r.storeName === null ? "-" : storeOptionLabel({ name: r.storeName, isHq: r.storeIsHq })) },
    { header: "고용 형태", width: "w-[90px]", cell: (r) => (r.employmentType ? labelOf(employmentTypes, r.employmentType) : "-") },
    { header: "계약 기간", width: "w-[180px]", cell: periodText },
    { header: "급여", width: "w-[100px]", cell: wageText },
    { header: "발송일", width: "w-[70px]", cell: (r) => sentText(r.sentAt) },
    {
      // 「직원 서명 대기 · 소속 확인 중 · D-28」(약 215px)까지 한 줄. 안내가 셋 넘게 붙어 잘리면 마우스를 올려 전체 문구를 본다(title)
      header: "상태",
      width: "w-[230px]",
      cell: (r) => {
        // 직원의 가입 · 초대 안내(가입 대기 중 · 소속 확인 중 등), 서명 대기의 남은 날, 퇴직을 붙인다(statusNotes, WHALEERP-133)
        if (!r.status) return "-";
        const notes = statusNotes(r, now, (v) => labelOf(draftActions, v));
        const label = [labelOf(statuses, r.status), ...notes].join(" · ");
        return (
          <span title={label}>
            <StatusBadge status={r.status} label={label} />
          </span>
        );
      },
    },
  ];
}
