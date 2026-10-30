"use client";

import type { ReactNode } from "react";
import { Badge, DataTable, type Column } from "@/components/common";
import { formatDateTime, formatPhone } from "@/lib/format";
import type { PlatformAdmin } from "@/lib/platform-admins";

// 플랫폼 관리자 목록 표(S-YTKWGG). 이름을 누르면 상세 패널이 열린다. 아이디는 고칠 수 없는 값이라 링크로 두지 않는다(2026-10-20 디자인 수정).
// 미사용 계정은 줄 글자를 흐리게 하고 상태 배지(Badge, 사용 · 미사용 글자)로 가른다 — 색만으로 말하지 않는다(DESIGN.md).

// 연락처 · 이메일 칸 앞 아이콘. public/icons 에 없는 모양이라 데모(docs/demo/src/pages/system/admins.mjs)와 같은 선을 그대로 그린다.
// 동그라미를 두른 모양으로 바꿨다(2026-10-20 디자인 수정).
const ICON = {
  phone: (
    <>
      <circle cx="12" cy="12" r="10.5" />
      <rect x="9" y="6.5" width="6" height="11" rx="1.6" />
      <path d="M10.5 15.3h3" />
    </>
  ),
  mail: (
    <>
      <circle cx="12" cy="12" r="10.5" />
      <rect x="6.8" y="8.8" width="10.4" height="7.4" rx="1" />
      <path d="m7.3 9.6 4.7 3.7 4.7-3.7" />
    </>
  ),
};

export function WithIcon({ icon, children }: { icon: keyof typeof ICON; children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-[6px]">
      <svg
        viewBox="0 0 24 24"
        className="size-[17px] shrink-0 text-erp-label"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {ICON[icon]}
      </svg>
      <span className="truncate">{children}</span>
    </span>
  );
}

export function AdminTable({
  rows,
  selected,
  onOpen,
  noStatus,
}: {
  rows: PlatformAdmin[];
  /** 계정 상태를 둘 다 껐다(NONE) — 결과가 없는 이유를 말한다 */
  noStatus?: boolean;
  /** 상세를 연 계정 — 그 줄에 바탕을 깐다 */
  selected?: number;
  onOpen: (id: number, from: HTMLElement) => void;
}) {
  const dim = (a: PlatformAdmin, node: ReactNode) => (a.accountStatus === "INACTIVE" ? <span className="text-erp-muted">{node}</span> : node);
  const open = (a: PlatformAdmin, text: string) => (
    <button
      type="button"
      aria-controls="platform-admin-detail-panel"
      aria-expanded={selected === a.adminAccountId}
      onClick={(e) => onOpen(a.adminAccountId, e.currentTarget)}
      // 미사용 계정도 이름 링크는 파란색 — 눌러서 상세를 여는 링크로 보이게(2026-10-28 사용자 지정, BP 마스터 목록 상호명 링크와 같다 · 전엔 회색)
      className="max-w-full truncate text-erp-link hover:underline"
    >
      {text}
    </button>
  );

  const columns: Column<PlatformAdmin>[] = [
    { header: "아이디", width: "w-[130px]", cell: (a) => dim(a, a.loginId) },
    { header: "이름", width: "w-[110px]", cell: (a) => open(a, a.name ?? a.loginId) },
    // 이름 다음에 계정상태 → 권한명(2026-10-28 사용자 지정 — 전엔 권한명 → 계정상태)
    {
      header: "계정상태",
      width: "w-[100px]",
      cell: (a) => (a.accountStatus === "ACTIVE" ? <Badge tone="on">사용</Badge> : <Badge tone="off">미사용</Badge>),
    },
    { header: "권한명", width: "w-[150px]", cell: (a) => dim(a, a.roleGroup.name) },
    { header: "연락처", width: "w-[150px]", align: "left", cell: (a) => (a.phone ? dim(a, <WithIcon icon="phone">{formatPhone(a.phone)}</WithIcon>) : "") },
    { header: "이메일", width: "w-[220px]", align: "left", cell: (a) => (a.email ? dim(a, <WithIcon icon="mail">{a.email}</WithIcon>) : "") },
    {
      header: "최근 로그인",
      width: "w-[180px]",
      // 로그인한 적이 없으면 「-」(2026-10-27 사용자 요청). 초기 비밀번호 메일이 실패한 계정은 그 사실을 먼저 알린다(SYSTEM-3).
      // 미발송은 사용 계정만 — 미사용은 [초기화]로 다시 보낼 수 없어 상세처럼 표시하지 않는다(2026-10-29 재영)
      cell: (a) =>
        a.isInitialPasswordUnsent && a.accountStatus === "ACTIVE" ? (
          <span className="text-erp-off">초기화 비밀번호 미발송</span>
        ) : a.lastLoginAt ? (
          dim(a, formatDateTime(a.lastLoginAt))
        ) : (
          <span className="text-erp-muted">-</span>
        ),
    },
    { header: "등록", width: "w-[170px]", cell: (a) => dim(a, formatDateTime(a.createdAt)) },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(a) => a.adminAccountId}
      rowState={(a) => (a.adminAccountId === selected ? "selected" : undefined)}
      empty={noStatus ? "선택한 계정상태가 없어 표시할 관리자 계정이 없습니다. 계정상태를 하나 이상 선택해 주세요." : "조건에 맞는 플랫폼 관리자 계정이 없습니다."}
    />
  );
}
