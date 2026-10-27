"use client";

import type { ReactNode } from "react";
import { Badge, DataTable, type Column } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import { formatDateTime } from "@/lib/format";
import type { BpAdmin } from "@/lib/bp-admins";

// BP 관리자 목록 표(S-AJHXFU · 데모 config/admins). 아이디 · 이름을 누르면 상세 패널이 열린다 — 목록에는 수정 링크가 없다(수정은 상세를 거친다).
// 미사용 계정은 줄 글자를 흐리게 하고 상태 배지(사용 · 미사용 글자)로 가른다 — 색만으로 말하지 않는다(DESIGN.md).
// 역할 한글은 로그인 정보의 공통코드 ROLE_TYPE 에서 읽는다(네이밍 규칙 화면 문구).
export function AdminTable({
  rows,
  selected,
  onOpen,
}: {
  rows: BpAdmin[];
  /** 상세를 연 계정 — 그 줄에 바탕을 깐다 */
  selected?: number;
  onOpen: (id: number, from: HTMLElement) => void;
}) {
  const roleType = useCodeLabel("ROLE_TYPE");
  const inactive = (a: BpAdmin) => a.accountStatus === "INACTIVE";
  const dim = (a: BpAdmin, node: ReactNode) => (inactive(a) ? <span className="text-erp-muted">{node}</span> : node);
  const open = (a: BpAdmin, text: string) => (
    <button
      type="button"
      aria-controls="bp-admin-detail-panel"
      aria-expanded={selected === a.adminAccountId}
      onClick={(e) => onOpen(a.adminAccountId, e.currentTarget)}
      className={`max-w-full truncate hover:underline ${inactive(a) ? "text-erp-muted" : "text-erp-link"}`}
    >
      {text}
    </button>
  );

  const columns: Column<BpAdmin>[] = [
    { header: "아이디", width: "w-[140px]", align: "left", cell: (a) => open(a, a.loginId) },
    { header: "이름", width: "w-[110px]", cell: (a) => open(a, a.name ?? a.loginId) },
    { header: "역할", width: "w-[120px]", cell: (a) => dim(a, roleType(a.roleTypeCode)) },
    {
      header: "권한 그룹",
      align: "left",
      cell: (a) =>
        dim(
          a,
          <span className="truncate">
            {a.roleGroup.name} <span className="text-erp-muted">{a.roleGroup.roleCode}</span>
          </span>,
        ),
    },
    {
      header: "계정 상태",
      width: "w-[100px]",
      cell: (a) => (inactive(a) ? <Badge tone="off">미사용</Badge> : <Badge tone="on">사용</Badge>),
    },
    { header: "매핑 점포", width: "w-[110px]", cell: (a) => dim(a, a.isAllStores ? "전체" : a.storeCount.toLocaleString("ko-KR")) },
    { header: "등록일시", width: "w-[160px]", cell: (a) => dim(a, formatDateTime(a.createdAt)) },
    {
      header: "최근 로그인",
      width: "w-[160px]",
      // 초기 비밀번호 메일이 실패한 계정은 그 사실을 먼저 알린다 — 상세의 비밀번호 초기화로 다시 보낸다
      cell: (a) =>
        a.isInitialPasswordUnsent ? (
          <span className="text-erp-off">초기 비밀번호 미발송</span>
        ) : a.lastLoginAt ? (
          dim(a, formatDateTime(a.lastLoginAt))
        ) : (
          <span className="text-erp-muted">-</span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(a) => a.adminAccountId}
      rowState={(a) => (a.adminAccountId === selected ? "selected" : undefined)}
      empty="조건에 맞는 관리자 계정이 없습니다."
    />
  );
}
