"use client";

import type { ReactNode } from "react";
import { Badge, DataTable, type Column } from "@/components/common";
import { formatDateTime, formatPhone } from "@/lib/format";
import type { PlatformAdmin } from "@/lib/platform-admins";

// 플랫폼 관리자 목록 표(S-YTKWGG). 이름을 누르면 상세 패널이 열린다. 아이디는 고칠 수 없는 값이라 링크로 두지 않는다(2026-10-20 디자인 수정).
// 미사용 계정은 줄 글자를 흐리게 하고 상태 배지(Badge, 사용 · 미사용 글자)로 가른다 — 색만으로 말하지 않는다(DESIGN.md).

// 연락처 · 이메일 칸 앞 아이콘. public/icons 에 없는 모양이라 데모(docs/demo/src/pages/system/admins.mjs)와 같은 선을 그대로 그린다.
const ICON = {
  phone: (
    <>
      <rect x="6.4" y="2.6" width="11.2" height="18.8" rx="2.4" />
      <path d="M10.4 18.4h3.2" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.4" width="18" height="13.2" rx="1.8" />
      <path d="m3.6 6.4 8.4 6.6 8.4-6.6" />
    </>
  ),
};

function WithIcon({ icon, children }: { icon: keyof typeof ICON; children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-[6px]">
      <svg
        viewBox="0 0 24 24"
        className="size-[13px] shrink-0 text-erp-label"
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
}: {
  rows: PlatformAdmin[];
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
      className={`max-w-full truncate hover:underline ${a.accountStatus === "INACTIVE" ? "text-erp-muted" : "text-erp-link"}`}
    >
      {text}
    </button>
  );

  const columns: Column<PlatformAdmin>[] = [
    { header: "아이디", width: "w-[130px]", cell: (a) => dim(a, a.loginId) },
    { header: "이름", width: "w-[110px]", cell: (a) => open(a, a.name ?? a.loginId) },
    { header: "사용자 권한", width: "w-[150px]", cell: (a) => dim(a, a.roleGroup.name) },
    {
      header: "계정 상태",
      width: "w-[100px]",
      cell: (a) => (a.accountStatus === "ACTIVE" ? <Badge tone="on">사용</Badge> : <Badge tone="off">미사용</Badge>),
    },
    { header: "연락처", width: "w-[150px]", cell: (a) => (a.phone ? dim(a, <WithIcon icon="phone">{formatPhone(a.phone)}</WithIcon>) : "-") },
    { header: "이메일", width: "w-[220px]", align: "left", cell: (a) => (a.email ? dim(a, <WithIcon icon="mail">{a.email}</WithIcon>) : "-") },
    {
      header: "최근 로그인",
      width: "w-[180px]",
      // 로그인한 적이 없으면 안내를 보인다. 초기 비밀번호 메일이 실패한 계정은 그 사실을 먼저 알린다(SYSTEM-3).
      cell: (a) =>
        a.isInitialPasswordUnsent ? (
          <span className="text-erp-off">초기 비밀번호 미발송</span>
        ) : a.lastLoginAt ? (
          dim(a, formatDateTime(a.lastLoginAt))
        ) : (
          <span className="text-erp-muted">로그인 기록 없음</span>
        ),
    },
    { header: "등록일시", width: "w-[170px]", cell: (a) => dim(a, formatDateTime(a.createdAt)) },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(a) => a.adminAccountId}
      rowState={(a) => (a.adminAccountId === selected ? "selected" : undefined)}
      empty="조건에 맞는 플랫폼 관리자 계정이 없습니다."
    />
  );
}
