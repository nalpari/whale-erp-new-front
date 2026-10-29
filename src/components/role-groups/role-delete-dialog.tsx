"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge, Button, ConfirmDialog, DataTable, Field, Select, type Column } from "@/components/common";
import { EASE_OUT } from "@/components/common/theme";
import type { DeletionCandidates } from "@/lib/platform-role-groups";
import type { ActionResult } from "@/lib/role-group-actions";
import { useCodeLabel } from "@/components/site/code-label";
import { FailedBand, InfoBand, unknownResult, WarnBand } from "./role-parts";

// 권한 삭제(데모 roles-master 삭제 확인창 · SYSTEM-6 · BP CONFIG-5). 고정 권한은 버튼이 없다.
// 후보 조회 · 삭제는 화면마다 다른 api 라 actions 로 받는다.
// 열 때 연결 사용자와 대체 권한 후보를 받는다 — 연결 사용자가 있으면 대체 권한을 골라야 하고, 그 사용자들을 한꺼번에 옮긴 뒤 지운다.
// 대체 후보는 api 가 준다(같은 유형 · 같은 관리 범위의 지우지 않은 다른 그룹). 후보가 없으면 지우지 못한다 — noCandidateText 로 알린다.

export type DeleteDialogActions = {
  candidates: (id: number) => Promise<ActionResult<DeletionCandidates>>;
  remove: (id: number, input: { updatedAt: string; replacementRoleGroupId?: number }) => Promise<ActionResult>;
};

export function RoleDeleteDialog({
  role,
  actions,
  noCandidateText,
  blockedReason,
  onDeleted,
}: {
  role: { roleGroupId: number; roleCode: string; name: string; updatedAt: string };
  actions: DeleteDialogActions;
  noCandidateText: string;
  blockedReason?: string | null;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // 지운 뒤 확인창 안에 「삭제되었습니다.」를 잠깐 보이고 저절로 닫는다 — 공통 토스트는 확인창 뒤(화면 아래)에 떠 보이지 않았다(2026-10-26 사용자 지정)
  const [deleted, setDeleted] = useState(false);
  const [data, setData] = useState<DeletionCandidates | null>(null);
  const [replacement, setReplacement] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const statusLabel = useCodeLabel("ACCOUNT_STATUS");

  /** 연결 사용자 · 대체 후보를 받는다. keep 은 이미 보이는 실패 문구 — 다시 받는 경우 그 문구를 지우지 않는다 */
  const loadCandidates = (keep?: string) =>
    startBusy(async () => {
      const result = await actions.candidates(role.roleGroupId).catch(unknownResult("삭제 대상 조회", false));
      if (result.ok) {
        setData(result);
        // 고르던 대체 권한이 후보에서 빠졌으면 다시 고르게 한다
        setReplacement((r) => (result.candidates.some((c) => String(c.roleGroupId) === r) ? r : ""));
        return;
      }
      setFailure(keep ? `${keep} · ${result.message}` : result.message);
      if (result.status === 404) router.refresh();
    });

  const handleOpen = () => {
    setOpen(true);
    setData(null);
    setReplacement("");
    setFailure(null);
    loadCandidates();
  };

  const handleDelete = () =>
    startBusy(async () => {
      const replacementRoleGroupId = replacement ? Number(replacement) : undefined;
      const result = await actions.remove(role.roleGroupId, { replacementRoleGroupId, updatedAt: role.updatedAt }).catch(unknownResult("삭제"));
      if (!result.ok) {
        setFailure(result.message);
        // 그 사이 바뀌었거나 지워졌거나 결과를 모르면 상세 · 목록을 새로 받는다
        if (result.status === undefined || result.status === 404 || result.status === 409) router.refresh();
        // 대체 권한이 그 사이 지워졌거나(400) 연결 사용자가 바뀌었으면(409) 후보를 다시 받는다
        if (result.status === 400 || result.status === 409) loadCandidates(result.message);
        return;
      }
      setDeleted(true);
      setTimeout(() => {
        setOpen(false);
        setDeleted(false);
        onDeleted();
      }, 1200);
    });

  const admins = data?.admins ?? [];
  const userColumns: Column<(typeof admins)[number]>[] = [
    // 값도 열 이름처럼 가운데 — 왼쪽 정렬이면 가운데인 열 이름과 시작점이 어긋나 보였다. 아이디는 140px, 이름이 남는 폭(2026-10-27 사용자 지정)
    { header: "아이디", width: "w-[140px]", cell: (a) => a.loginId },
    { header: "이름", cell: (a) => a.name || <span className="text-erp-muted">-</span> },
    {
      header: "계정상태",
      width: "w-[100px]",
      cell: (a) => <Badge tone={a.accountStatusCode === "INACTIVE" ? "off" : "on"}>{statusLabel(a.accountStatusCode)}</Badge>,
    },
  ];
  const noCandidate = admins.length > 0 && data?.candidates.length === 0;
  const ready = Boolean(data) && !noCandidate && (admins.length === 0 || Boolean(replacement));

  return (
    <>
      {/* 막힌 이유는 툴팁만이 아니라 글자로 옆에 둔다 — 키보드 · 터치 · 화면 낭독기도 읽는다 */}
      <span className="inline-flex items-center gap-[6px]">
        <Button variant="soft" onClick={handleOpen} disabled={Boolean(blockedReason)} aria-describedby={blockedReason ? `role-${role.roleGroupId}-delete-blocked` : undefined}>
          삭제
        </Button>
        {blockedReason && (
          <span id={`role-${role.roleGroupId}-delete-blocked`} className="text-[13px] text-erp-label">
            {blockedReason}
          </span>
        )}
      </span>
      <ConfirmDialog
        open={open}
        // 점포 삭제 확인창(stores/[storeId]/store-detail-actions.tsx)과 같은 물음 · 복구 안내(2026-10-26 사용자 지정)
        title="권한 그룹을 삭제하시겠습니까?"
        confirmLabel="삭제"
        // 「취소」 대신 「닫기」(2026-10-26 사용자 지정). 지운 뒤 닫히기 전에는 두 버튼을 막는다
        cancelLabel="닫기"
        wide
        busy={busy || deleted}
        confirmDisabled={!ready}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      >
        <div className="relative flex flex-col gap-[12px] break-keep">
          {/* 확인창 안 삭제 알림 — 공통 토스트와 같은 모양, 늘 마운트해 두고 전환으로 여닫는다 */}
          <div
            role="status"
            aria-live="polite"
            className={`pointer-events-none absolute bottom-0 left-1/2 z-[2] -translate-x-1/2 rounded-[2px] bg-erp-nav px-[24px] py-[12px] text-[14px] font-medium whitespace-nowrap text-white shadow-[0_2px_6px_rgba(40,47,55,0.08)] transition-[opacity,translate,visibility] ${EASE_OUT} motion-reduce:transition-none ${
              deleted ? "visible translate-y-0 opacity-100 duration-200" : "invisible translate-y-[6px] opacity-0 duration-150"
            }`}
          >
            {deleted ? "삭제되었습니다." : ""}
          </div>
          {failure && <FailedBand message={failure} />}
          <dl className="grid grid-cols-[84px_1fr] gap-y-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px]">
            <dt className="text-erp-label">권한명</dt>
            <dd>
              {role.name} <span className="text-erp-label">· {role.roleCode}</span>
            </dd>
            <dt className="text-erp-label">연결 사용자</dt>
            <dd>
              {!data ? (
                <span className="text-erp-muted">{busy ? "불러오는 중입니다." : "—"}</span>
              ) : admins.length ? (
                `${admins.length.toLocaleString("ko-KR")}명`
              ) : (
                "없음"
              )}
            </dd>
          </dl>
          {/* 연결 사용자는 표로(아이디 · 이름 · 계정 상태) — 전엔 「아이디 | 이름」을 옅은 회색으로 이어 붙였다(2026-10-27 사용자 지정).
              다섯 명까지는 표가 내용만큼 서고, 여섯 명부터는 높이를 머리 42 + 줄 46 × 5 + 선으로 묶고 열 이름 줄은 고정한 채 사람 줄만 스크롤한다
              (DataTable scroll — 공통코드 목록 표와 같다, 2026-10-27 사용자 지정) */}
          {admins.length > 0 && admins.length <= 5 && <DataTable columns={userColumns} rows={admins} rowKey={(a) => a.adminAccountId} />}
          {admins.length > 5 && (
            // 표의 아래 선은 마지막 줄에 붙어 스크롤 중엔 상자 밖으로 내려간다 — 상자 맨 아래에 늘 보이는 선을 덧그린다(대상점포 표와 같다).
            // 선은 스크롤바 자리를 비운 겹 상자 안에 두어 표 오른쪽 끝에서 멈춘다(리뷰로 찾음)
            <div className="relative flex h-[274px] flex-col">
              <DataTable scroll columns={userColumns} rows={admins} rowKey={(a) => a.adminAccountId} />
              <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden [scrollbar-gutter:stable]">
                <span className="absolute inset-x-0 bottom-0 h-px bg-erp-thead-line" />
              </span>
            </div>
          )}
          {/* 두 줄로 나눠 보인다(2026-10-26 사용자 지정) */}
          {data && admins.length === 0 && (
            <div className="text-erp-label">
              <p>연결된 사용자가 없어 바로 삭제할 수 있습니다.</p>
              <p>삭제된 권한 그룹은 복구할 수 없습니다.</p>
            </div>
          )}
          {/* 삭제를 막는 이유 — 플랫폼 메뉴 관리의 미사용 안내와 같은 빨간 테두리 · 연한 빨간 바탕 상자(2026-10-27 사용자 지정 — 전엔 빨간 글자만) */}
          {noCandidate && (
            <WarnBand>{noCandidateText}</WarnBand>
          )}
          {data && admins.length > 0 && !noCandidate && (
            <>
              <Field label="대체 권한" required>
                <Select value={replacement} onChange={(e) => setReplacement(e.target.value)} aria-required>
                  <option value="">선택하세요</option>
                  {data.candidates.map((c) => (
                    <option key={c.roleGroupId} value={c.roleGroupId}>
                      {c.roleCode} · {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <InfoBand>변경된 권한은 다시 로그인하지 않아도, 사용자가 화면을 새로고침하거나 이동하면 적용됩니다.</InfoBand>
            </>
          )}
        </div>
      </ConfirmDialog>
    </>
  );
}
