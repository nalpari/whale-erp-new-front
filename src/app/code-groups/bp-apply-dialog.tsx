"use client";

import { ConfirmDialog } from "@/components/common";

// BP에 적용 확인창 — 목업 pop-apply 의 모양(적용 대상 요약 + 되돌릴 수 없다는 위험 띠).
// 제목·위험 띠·설명 문구는 사용자 지정(2026-10-26) — 이미 있는 상세 코드는 건너뛰고 없는 것만 넣는다,
// 적용은 되돌릴 수 없다.
export function BpApplyDialog({
  group,
  busy,
  onConfirm,
  onCancel,
}: {
  group: { groupCode: string; groupName: string; isBpApplied: boolean } | null;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog open={group !== null} title="BP에 적용하시겠습니까?" confirmLabel="적용" wide busy={busy} onConfirm={onConfirm} onCancel={onCancel}>
      {group && (
        <div className="flex flex-col gap-[12px]">
          <dl className="grid grid-cols-[84px_1fr] gap-x-[12px] gap-y-[8px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[16px] py-[14px]">
            <dt className="font-medium text-erp-label">그룹</dt>
            <dd>
              {group.groupCode} <span className="text-erp-label">·</span> {group.groupName}
            </dd>
            <dt className="font-medium text-erp-label">상세 코드</dt>
            <dd>저장된 상세 코드 전부</dd>
            <dt className="font-medium text-erp-label">대상</dt>
            <dd>사용 중인 모든 BP{group.isBpApplied && <span className="text-erp-label"> (이미 적용한 그룹)</span>}</dd>
          </dl>
          <div className="rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px]">
            <p className="font-medium text-erp-off">사용 중인 모든 BP에 적용되며, 적용 후에는 취소할 수 없습니다.</p>
            <p>BP에 등록된 기존 코드는 유지되며, 새로 추가된 코드만 반영됩니다.</p>
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}
