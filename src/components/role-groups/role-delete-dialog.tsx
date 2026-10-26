"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ConfirmDialog, Field, Select, useToast } from "@/components/common";
import type { DeletionCandidates } from "@/lib/platform-role-groups";
import type { ActionResult } from "@/lib/role-group-actions";
import { useCodeLabel } from "@/components/site/code-label";
import { FailedBand, InfoBand, unknownResult } from "./role-parts";

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
  const toast = useToast();
  const [open, setOpen] = useState(false);
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
      setOpen(false);
      toast("deleted");
      onDeleted();
    });

  const admins = data?.admins ?? [];
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
        wide
        busy={busy}
        confirmDisabled={!ready}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      >
        <div className="flex flex-col gap-[12px] break-keep">
          {failure && <FailedBand message={failure} />}
          <dl className="grid grid-cols-[84px_1fr] gap-y-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px]">
            <dt className="text-erp-label">권한명</dt>
            <dd>
              {role.name} <span className="text-erp-label">· {role.roleCode}</span>
            </dd>
            <dt className="text-erp-label">연결 사용자</dt>
            <dd>
              {!data ? (
                <span className="text-erp-muted">{busy ? "불러오는 중입니다" : "—"}</span>
              ) : admins.length ? (
                // 몇 명인지 먼저, 그 아래에 한 사람씩 줄을 바꿔 보인다. 다섯 명까지 보이고 넘으면 이 목록 안에서 스크롤한다(2026-10-15) —
                // 줄 높이 22 × 5 + 사이 2 × 4 = 118
                <>
                  <p>{admins.length.toLocaleString("ko-KR")}명</p>
                  <ul className="mt-[4px] flex max-h-[118px] flex-col gap-[2px] overflow-y-auto text-erp-label">
                    {admins.map((a) => (
                      <li key={a.adminAccountId} className="h-[22px] shrink-0 truncate leading-[22px]">
                        {/* 아이디 | 사용자명 — 이름이 없으면 아이디만 */}
                        {a.name ? `${a.loginId} | ${a.name}` : a.loginId}
                        {a.accountStatusCode === "INACTIVE" && ` (${statusLabel("INACTIVE")})`}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                "없음"
              )}
            </dd>
          </dl>
          {/* 두 줄로 나눠 보인다(2026-10-26 사용자 지정) */}
          {data && admins.length === 0 && (
            <div className="text-erp-label">
              <p>연결된 사용자가 없어 바로 삭제할 수 있습니다.</p>
              <p>삭제된 권한 그룹은 복구할 수 없습니다.</p>
            </div>
          )}
          {noCandidate && (
            <p className="text-erp-off">{noCandidateText}</p>
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
              <InfoBand>로그인 중인 사용자도 다음 요청부터 새 권한으로 판정됩니다.</InfoBand>
            </>
          )}
        </div>
      </ConfirmDialog>
    </>
  );
}
