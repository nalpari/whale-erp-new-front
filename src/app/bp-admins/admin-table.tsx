"use client";

import type { ReactNode } from "react";
import { Badge, DataTable, type Column } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import { formatDateTime } from "@/lib/format";
import type { BpAdmin } from "@/lib/bp-admins";

// BP 관리자 목록 표(S-AJHXFU · 데모 config/admins). 이름을 누르면 상세 패널이 열린다 — 목록에는 수정 링크가 없다(수정은 상세를 거친다).
// 아이디는 링크 없이 본문 글자로 둔다 — 플랫폼 관리자 목록과 같다(2026-10-27 사용자 지정).
// 미사용 계정은 줄 글자를 흐리게 하고 상태 배지(사용 · 미사용 글자)로 가른다 — 색만으로 말하지 않는다(DESIGN.md).
// 역할 한글은 로그인 정보의 공통코드 ROLE_TYPE 에서 읽는다(네이밍 규칙 화면 문구).
export function AdminTable({
  rows,
  selected,
  onOpen,
  noStatus,
  noRole,
}: {
  rows: BpAdmin[];
  /** 상세를 연 계정 — 그 줄에 바탕을 깐다 */
  selected?: number;
  onOpen: (id: number, from: HTMLElement) => void;
  /** 계정상태를 둘 다 껐다(NONE) — 결과가 없는 이유를 말한다 */
  noStatus?: boolean;
  /** 역할을 모두 껐다 — 결과가 없는 이유를 말한다 */
  noRole?: boolean;
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
      // 미사용 계정도 이름 링크는 파란색 — 눌러서 상세를 여는 링크로 보이게(2026-10-28 사용자 지정, 플랫폼 관리자 목록과 같다 · 전엔 회색)
      className="max-w-full truncate text-erp-link hover:underline"
    >
      {text}
    </button>
  );

  const columns: Column<BpAdmin>[] = [
    // 권한명 · 코드 · 최근 로그인은 폭을 정하지 않아 남는 폭을 똑같이 나눈다(2026-10-30 사용자 지정).
    // 아이디 180 · 이름 220 · 역할 · 대상점포 · 계정 상태는 고정 폭이다 — 아이디 · 이름 · 역할이 너무 넓었다(2026-10-30 사용자 지정).
    // 등록일시 열은 뺐다 — 상세에서 본다(2026-10-30 사용자 지정)
    // 아이디도 가운데 정렬 — 플랫폼 관리자 목록과 같다(2026-10-27 사용자 지정)
    { header: "아이디", width: "w-[180px]", cell: (a) => dim(a, <span className="block truncate">{a.loginId}</span>) },
    { header: "이름", width: "w-[220px]", cell: (a) => open(a, a.name ?? a.loginId) },
    // 역할은 이름 바로 다음, 폭 120
    { header: "역할", width: "w-[120px]", cell: (a) => dim(a, roleType(a.roleTypeCode)) },
    // 역할 다음에 대상점포 — 열 이름은 상세와 같게(2026-10-30 사용자 지정 — 전엔 계정상태 다음 「매핑 점포」)
    { header: "대상점포", width: "w-[110px]", cell: (a) => dim(a, a.isAllStores ? "전체" : a.storeCount.toLocaleString("ko-KR")) },
    {
      header: "권한명 · 코드", // 열 이름도 값과 같은 「권한명 · 코드」(2026-10-27 사용자 지정 — 전엔 「권한 그룹」)
      align: "left", // 값은 왼쪽 정렬, 머리글은 가운데 그대로(2026-10-30 사용자 지정 — 전엔 가운데)
      cell: (a) =>
        dim(
          a,
          <span className="truncate">
            {/* 권한 그룹명과 코드 사이에 「 · 」(2026-10-27 사용자 지정) */}
            {a.roleGroup.name} <span className="text-[12px] text-erp-muted">· {a.roleGroup.roleCode}</span>
          </span>,
        ),
    },
    {
      header: "계정상태",
      width: "w-[100px]",
      cell: (a) => (inactive(a) ? <Badge tone="off">미사용</Badge> : <Badge tone="on">사용</Badge>),
    },
    {
      header: "최근 로그인",
      // 초기 비밀번호 메일이 실패한 계정은 그 사실을 먼저 알린다 — 상세의 비밀번호 초기화로 다시 보낸다
      cell: (a) =>
        a.isInitialPasswordUnsent ? (
          <span className="text-erp-off">초기화 비밀번호 미발송</span>
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
      empty={
        noStatus
          ? "선택한 계정상태가 없어 표시할 관리자 계정이 없습니다. 계정상태를 하나 이상 선택해 주세요."
          : noRole
            ? "선택한 역할이 없어 표시할 관리자 계정이 없습니다. 역할을 하나 이상 선택해 주세요."
            : "조건에 맞는 관리자 계정이 없습니다."
      }
    />
  );
}
