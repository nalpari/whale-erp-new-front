"use client";

import { ConfirmDialog } from "@/components/common";

// BP에 적용 확인창 — 목업 pop-apply 의 모양(적용 대상 요약 + 되돌릴 수 없다는 위험 띠).
// 문구는 2026-10-12 결정(이미 있는 상세 코드는 건너뛰고 없는 것만 넣는다, 다시 적용 가능)에 맞췄다.
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
    <ConfirmDialog open={group !== null} title="BP에 적용" confirmLabel="적용" wide busy={busy} onConfirm={onConfirm} onCancel={onCancel}>
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
            <p className="font-medium text-erp-off">사용 중인 모든 BP에 배포되며 되돌릴 수 없습니다</p>
            <p>
              BP에 이미 있는 상세 코드는 건너뛰고 없는 것만 넣습니다 — BP가 고친 코드명 · 순서 · 사용 상태는 그대로입니다. 그룹의 BP
              적용은 다시 미적용으로 바꿀 수 없습니다.
            </p>
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}
