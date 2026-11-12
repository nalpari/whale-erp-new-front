"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ConfirmDialog, useToast } from "@/components/common";
import { WarnBand } from "@/components/site/side-parts";
import { useCurrentBp, usePagePermission } from "@/components/site/session-gate";
import { bpPath } from "@/lib/bp-path";
import type { FacilityDetail } from "@/lib/facilities";
import { deleteFacilityAction } from "../actions";
import { withBack } from "../facility-list-query";

/**
 * 상세 제목 줄의 버튼 — [삭제] [수정] [목록](데모 stores/facilities-detail). [목록]은 늘 Primary.
 * 폐점 점포의 것은 조회만 되어 [목록]만 둔다(PL-1). 수정 · 삭제는 메뉴 권한(로그인 정보)이 있을 때만 보인다 — 막는 것은 api 다.
 * 삭제는 확인창을 거쳐 논리 삭제하고 목록으로 간다(PL-4). 1팀 화면이라 확인 버튼도 기본 색이고, 되돌릴 수 없다는 안내는 빨간 상자로 둔다.
 * 수리 이력 · 점검 결과가 있으면 막는 것(PL-4)은 수리 이력 api 가 생기면 api 가 막는다 — 그때 그 문장을 확인창에 보인다.
 */
export function FacilityDetailActions({ facility, backHref }: { facility: FacilityDetail; backHref: string }) {
  const router = useRouter();
  const toast = useToast();
  const bp = useCurrentBp().bpCodeId;
  const permission = usePagePermission();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, startDelete] = useTransition();
  const closed = facility.store.isClosed;

  const handleDelete = () =>
    startDelete(async () => {
      const result = await deleteFacilityAction(facility.facilityId).catch((error: unknown) => {
        console.error("시설물 삭제 호출 실패", error);
        return { ok: false as const, message: "삭제 결과를 확인하지 못했습니다. 목록에서 확인해 주세요." };
      });
      if (!result.ok) {
        // 이미 지워졌으면 목록으로 — 그 밖(폐점 409 · 권한 403 등)은 확인창 안에 이유를 남긴다
        if ("status" in result && result.status === 404) {
          toast("이미 지워진 시설물·장비입니다.");
          router.push(bpPath(bp, backHref));
          return;
        }
        setFailure(result.message);
        return;
      }
      setDeleteOpen(false);
      toast("deleted");
      router.push(bpPath(bp, backHref));
    });

  return (
    <>
      <div className="flex shrink-0 gap-[6px]">
        {!closed && permission.delete && (
          <Button
            variant="soft"
            onClick={() => {
              setFailure(null);
              setDeleteOpen(true);
            }}
          >
            삭제
          </Button>
        )}
        {!closed && permission.update && (
          <Button variant="soft" href={bpPath(bp, withBack(`/facilities/${facility.facilityId}/edit`, backHref))}>
            수정
          </Button>
        )}
        <Button href={bpPath(bp, backHref)}>목록</Button>
      </div>
      <ConfirmDialog
        open={deleteOpen}
        title="시설물·장비를 삭제하시겠습니까?"
        confirmLabel="삭제"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      >
        <div className="flex flex-col gap-[12px] text-left">
          <dl className="grid grid-cols-[90px_1fr] gap-y-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px]">
            <dt className="text-erp-label">시설물/장비명</dt>
            <dd className="break-all">{facility.name}</dd>
            <dt className="text-erp-label">점포</dt>
            <dd>{facility.store.name}</dd>
            <dt className="text-erp-label">그룹 · 분류</dt>
            <dd>
              {facility.facilityGroupLabel} · {facility.facilityCategoryLabel}
            </dd>
          </dl>
          <WarnBand>
            삭제하면 시설물·장비 목록에서 제외되고 복구할 수 없습니다.
            <br />
            잘못 등록한 것이 아니라면 운영상태를 폐기로 바꿔 주세요.
          </WarnBand>
          {failure && (
            <p role="alert" className="text-[13px] text-erp-off">
              {failure}
            </p>
          )}
        </div>
      </ConfirmDialog>
    </>
  );
}
