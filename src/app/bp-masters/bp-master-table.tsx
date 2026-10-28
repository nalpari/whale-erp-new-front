"use client";

import { DataTable, type Column } from "@/components/common";
import type { BpMaster } from "@/lib/bp-masters";
import { formatDateTime, formatPhone } from "@/lib/format";
import { formatBizNumber } from "@/lib/store-view";
import { WithIcon } from "../platform-admins/admin-table";
import { BpStatusBadge, WITHDRAWN_TEXT } from "./bp-master-parts";

// BP 마스터 계정 목록 표(S-ALHCJS). BP 코드를 누르면 상세 패널이 열린다(상호명 링크는 2026-10-28 사용자 지정으로 뺐다).
// 연락처 · 이메일은 열을 나눈다(플랫폼 관리자 목록과 같은 모양, 2026-10-28 사용자 지정 — 전엔 한 칸 두 줄).
// 사업자등록번호가 빈 줄이 미인증 BP 다. 탈퇴 BP 는 이름 · 연락처 · 이메일이 「탈퇴로 삭제됨」으로 보인다.

const JOIN_PATH = { SIGNUP: "회원가입", PLATFORM_REGISTERED: "플랫폼등록" } as const;

export function BpMasterTable({
  rows,
  selected,
  onOpen,
  noStatus,
}: {
  rows: BpMaster[];
  /** 상세를 연 BP — 그 줄에 바탕을 깐다 */
  selected?: number;
  onOpen: (bpCodeId: number, from: HTMLElement) => void;
  /** 상태를 셋 다 껐다 — 빈 칸 문구를 가른다 */
  noStatus?: boolean;
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

  // 열 순서는 BP 코드 · 아이디 · 이름 · 상태 · 상호명 …, 이름은 플랫폼 관리자 목록 느낌으로(2026-10-28 사용자 지정) — 연락처 · 이메일은 나누고, 등록은 일시만
  const columns: Column<BpMaster>[] = [
    { header: "BP 코드", width: "w-[110px]", cell: (b) => open(b, b.bpCode) },
    { header: "아이디", width: "w-[130px]", cell: (b) => b.loginId },
    { header: "이름", width: "w-[110px]", cell: (b) => (withdrawn(b) ? gone : b.name) },
    { header: "상태", width: "w-[100px]", cell: (b) => <BpStatusBadge status={b.accountStatus} /> },
    // 상호명은 링크 없이 굵은(600) 먹색 글자, 폭 240px(남는 폭을 다 받으면 너무 넓었다) — 상세는 BP 코드로 연다(2026-10-28 사용자 지정)
    { header: "상호명", width: "w-[240px]", align: "left", cell: (b) => <span className="max-w-full truncate font-semibold">{b.tradeName}</span> },
    { header: "연락처", width: "w-[150px]", align: "left", cell: (b) => (withdrawn(b) ? gone : b.phone ? <WithIcon icon="phone">{formatPhone(b.phone)}</WithIcon> : "") },
    { header: "이메일", width: "w-[220px]", align: "left", cell: (b) => (withdrawn(b) ? gone : b.email ? <WithIcon icon="mail">{b.email}</WithIcon> : "") },
    { header: "사업자등록번호", width: "w-[130px]", cell: (b) => formatBizNumber(b.bizRegistrationNumber) },
    { header: "가입경로", width: "w-[100px]", cell: (b) => JOIN_PATH[b.joinPath] },
    { header: "등록", width: "w-[170px]", cell: (b) => formatDateTime(b.createdAt) },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(b) => b.bpCodeId}
      rowState={(b) => (b.bpCodeId === selected ? "selected" : undefined)}
      empty={noStatus ? "선택한 상태가 없어 표시할 BP가 없습니다. 상태를 하나 이상 선택해 주세요." : "일치하는 BP가 없습니다."}
    />
  );
}
