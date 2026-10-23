"use client";

import type { ReactNode } from "react";
import { DataTable, type Column } from "@/components/common";
import type { BpMaster } from "@/lib/bp-masters";
import { formatDateTime, formatPhone } from "@/lib/format";
import { formatBizNumber } from "@/lib/store-view";
import { WithIcon } from "../platform-admins/admin-table";
import { BpStatusBadge, WITHDRAWN_TEXT } from "./bp-master-parts";

// BP 마스터 계정 목록 표(S-ALHCJS). BP 코드 · 상호명을 누르면 상세 패널이 열린다(목업과 같다).
// 연락처 · 이메일과 등록자 · 등록 일시는 한 칸에 두 줄이다(정책서대로 — 데모의 나눈 칸을 따르지 않는다).
// 사업자등록번호가 빈 줄이 미인증 BP 다. 탈퇴 BP 는 이름 · 연락처 · 이메일이 「탈퇴로 삭제됨」으로 보인다.

const JOIN_PATH = { SIGNUP: "회원가입", PLATFORM_REGISTERED: "플랫폼등록" } as const;

function TwoLines({ top, bottom }: { top: ReactNode; bottom: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-col items-start gap-[2px] leading-[1.3]">
      <span className="max-w-full truncate">{top}</span>
      <span className="max-w-full truncate">{bottom}</span>
    </span>
  );
}

export function BpMasterTable({
  rows,
  selected,
  onOpen,
}: {
  rows: BpMaster[];
  /** 상세를 연 BP — 그 줄에 바탕을 깐다 */
  selected?: number;
  onOpen: (bpCodeId: number, from: HTMLElement) => void;
}) {
  const gone = <span className="text-erp-muted">{WITHDRAWN_TEXT}</span>;
  const withdrawn = (b: BpMaster) => b.accountStatus === "WITHDRAWN";
  const open = (b: BpMaster, text: string) => (
    <button
      type="button"
      aria-controls="bp-master-detail-panel"
      aria-expanded={selected === b.bpCodeId}
      onClick={(e) => onOpen(b.bpCodeId, e.currentTarget)}
      className="max-w-full truncate text-erp-link hover:underline"
    >
      {text}
    </button>
  );

  const columns: Column<BpMaster>[] = [
    { header: "BP 코드", width: "w-[110px]", cell: (b) => open(b, b.bpCode) },
    { header: "아이디", width: "w-[120px]", cell: (b) => b.loginId },
    { header: "이름", width: "w-[100px]", cell: (b) => (withdrawn(b) ? gone : b.name) },
    {
      header: "연락처 · 이메일",
      width: "w-[220px]",
      align: "left",
      cell: (b) =>
        withdrawn(b) ? (
          gone
        ) : (
          <TwoLines top={<WithIcon icon="phone">{formatPhone(b.phone)}</WithIcon>} bottom={b.email && <WithIcon icon="mail">{b.email}</WithIcon>} />
        ),
    },
    { header: "상태", width: "w-[80px]", cell: (b) => <BpStatusBadge status={b.accountStatus} /> },
    { header: "상호명", align: "left", cell: (b) => open(b, b.tradeName) },
    { header: "사업자등록번호", width: "w-[130px]", cell: (b) => formatBizNumber(b.bizRegistrationNumber) },
    { header: "가입경로", width: "w-[100px]", cell: (b) => JOIN_PATH[b.joinPath] },
    {
      header: "등록자 · 등록 일시",
      width: "w-[160px]",
      cell: (b) => <TwoLines top={b.createdByName ?? b.loginId} bottom={formatDateTime(b.createdAt)} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(b) => b.bpCodeId}
      rowState={(b) => (b.bpCodeId === selected ? "selected" : undefined)}
      empty="일치하는 BP가 없습니다."
    />
  );
}
