"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type RefObject } from "react";
import { Badge, Button, ConfirmDialog, DetailTable, DetailValues, SlidePanel, Tag, useToast, type DetailRow } from "@/components/common";
import { useAccount, usePagePermission } from "@/components/site/session-gate";
import { formatDateTime, formatPhone } from "@/lib/format";
import { adminActionsOf } from "@/lib/platform-admin-actions";
import type { PlatformAdminDetail } from "@/lib/platform-admins";
import { deletePlatformAdminAction, resetPlatformAdminPasswordAction } from "./actions";
import { Blocked, FailedBand, ShieldIcon, unknownResult, WhoList } from "./admin-parts";
import { HistoryButton } from "./history-dialog";

// 플랫폼 관리자 상세(S-BRSPGB). 모두 읽기 전용이고, 상태 · 권한은 수정 패널에서만 바꾼다.
// 메뉴 권한(로그인 정보)으로 수정 · 비밀번호 초기화는 update, 삭제는 delete 가 있을 때 보인다 — api 도 같은 칸을 본다.
// 플랫폼 관리자가 플랫폼 마스터 계정을 열면 셋 다 숨기고, 본인 계정이면 삭제 · 초기화만 흐리게 둔다(SYSTEM-1).
// 화면은 미리 숨기거나 흐리게만 한다 — 막는 것은 api 다. 실행 버튼은 닫기만 맨 왼쪽, 나머지는 오른쪽 끝(BP 관리자 상세와 같다).

export function AdminDetailPanel({
  open,
  detail,
  onClose,
  trigger,
  editOpen,
  onEdit,
  onDeleted,
}: {
  open: boolean;
  detail: { admin: PlatformAdminDetail } | { failed: string } | null;
  onClose: () => void;
  trigger: RefObject<HTMLElement | null>;
  /** 수정 패널이 위에 떠 있으면 이 패널은 포커스를 받지 않는다 */
  editOpen: boolean;
  onEdit: (from: HTMLButtonElement) => void;
  onDeleted: () => void;
}) {
  return (
    <SlidePanel id="platform-admin-detail-panel" open={open} onClose={onClose} label="플랫폼 관리자 상세" trigger={trigger}>
      {detail && "admin" in detail ? (
        <DetailBody
          // 다른 계정을 열면 확인창 · 실패 띠를 새로 시작한다
          key={detail.admin.adminAccountId}
          admin={detail.admin}
          inert={editOpen}
          onClose={onClose}
          onEdit={onEdit}
          onDeleted={onDeleted}
        />
      ) : (
        <>
          {detail && <FailedBand message={detail.failed} />}
          <div className="flex border-t border-erp-panel-line pt-[16px]">
            <Button variant="off" onClick={onClose}>
              닫기
            </Button>
          </div>
        </>
      )}
    </SlidePanel>
  );
}

function DetailBody({
  admin,
  inert,
  onClose,
  onEdit,
  onDeleted,
}: {
  admin: PlatformAdminDetail;
  inert: boolean;
  onClose: () => void;
  onEdit: (from: HTMLButtonElement) => void;
  onDeleted: () => void;
}) {
  const toast = useToast();
  const router = useRouter();
  const [confirm, setConfirm] = useState<"reset" | "delete" | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const me = useAccount();
  const can = usePagePermission();
  // 플랫폼 마스터 계정은 플랫폼 마스터만 고친다(F-RVDLOW).
  const { canUpdate, canDelete, isSelf } = adminActionsOf(me, { adminAccountId: admin.adminAccountId, roleTypeCode: admin.roleGroup.roleTypeCode }, can);
  const name = admin.name ?? admin.loginId;

  const handleReset = () =>
    startBusy(async () => {
      const result = await resetPlatformAdminPasswordAction(admin.adminAccountId).catch(unknownResult("비밀번호 초기화"));
      setConfirm(null);
      if (!result.ok) return fail(result.status, result.message);
      setFailure(null);
      // 메일이 실패해도 기존 비밀번호는 이미 막혔다 — 다시 초기화하면 보낸다(SYSTEM-3)
      toast(result.isMailSent ? "초기 비밀번호를 계정 이메일로 보냈습니다." : "초기화했지만 메일을 보내지 못했습니다. 다시 초기화해 주세요.");
    });

  const handleDelete = () =>
    startBusy(async () => {
      const result = await deletePlatformAdminAction(admin.adminAccountId).catch(unknownResult("삭제"));
      setConfirm(null);
      if (!result.ok) return fail(result.status, result.message);
      onDeleted();
    });

  /**
   * 실패 띠를 세운다. 지금 상태가 화면과 다를 수 있는 실패면 상세 · 목록을 다시 받는다 —
   * 404(그 사이 다른 관리자가 지움) · 409(그 사이 바꿈 · 마지막 마스터 등) · 결과를 모름(이미 처리됐을 수 있음).
   */
  const fail = (status: number | undefined, message: string) => {
    setFailure(message);
    if (status === undefined || status === 404 || status === 409) router.refresh();
  };

  const address = [admin.zipCode, admin.address, admin.addressDetail].filter((line): line is string => Boolean(line));
  const muted = (text: string) => <span className="text-erp-muted">{text}</span>;
  const rows: DetailRow[] = [
    { label: "아이디", value: admin.loginId },
    { label: "이름", value: name },
    { label: "연락처", value: admin.phone ? formatPhone(admin.phone) : muted("-") },
    { label: "이메일", value: admin.email ?? muted("-") },
    {
      label: "비밀번호",
      value: (
        <>
          {canUpdate && (
            <Blocked reason={isSelf ? "본인 비밀번호는 내 정보에서 바꿔 주세요" : undefined}>
              <Button variant="soft" onClick={() => setConfirm("reset")} disabled={isSelf || busy}>
                초기화
              </Button>
            </Blocked>
          )}
          {admin.isInitialPasswordUnsent && <span className="text-erp-off">초기 비밀번호 미발송</span>}
        </>
      ),
    },
    { label: "소속 부서", value: admin.department ?? muted("-") },
    { label: "직책", value: admin.jobTitle ?? muted("-") },
    // 우편번호 · 기본주소 · 상세주소를 줄을 바꿔 보인다(데모 상세와 같다). 이 줄만 내용만큼 늘어난다.
    {
      label: "주소",
      multiline: address.length > 0,
      value: address.length ? (
        <div className="py-[2px]">
          {address.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      ) : (
        muted("-")
      ),
    },
    // 최근 로그인 → 등록일시 → 최종 수정일시 순으로 둔다(2026-10-20 디자인 수정).
    { label: "최근 로그인", value: admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : muted("로그인 기록 없음") },
    { label: "등록일시", value: <DetailValues items={[formatDateTime(admin.createdAt), admin.createdByName ?? muted("시스템")]} /> },
    {
      label: "최종 수정일시",
      value: admin.updatedByName ? <DetailValues items={[formatDateTime(admin.updatedAt), admin.updatedByName]} /> : muted("수정한 적 없음"),
    },
  ];
  if (admin.accountStatus === "INACTIVE" && admin.statusChangedAt)
    rows.push({ label: "미사용 전환일시", value: formatDateTime(admin.statusChangedAt) });

  const who = <WhoList rows={[["아이디", admin.loginId], ["이름", name]]} />;

  return (
    <div inert={inert} className="flex flex-col gap-[16px]">
      {/* 이름 옆에 계정 상태와 사용자 권한을 꼬리표로 둔다(데모 상세 · 2026-10-08) */}
      <h2 className="flex flex-wrap items-center gap-[6px] text-[18px] font-semibold text-erp-ink">
        <span className="mr-[4px]">{name}</span>
        {admin.accountStatus === "ACTIVE" ? <Badge tone="on">사용</Badge> : <Badge tone="off">미사용</Badge>}
        <span title="사용자 권한">
          <Tag>
            <ShieldIcon />
            {admin.roleGroup.name}
          </Tag>
        </span>
      </h2>
      {failure && <FailedBand message={failure} />}
      <DetailTable title="기본정보" rows={rows} />

      <div className="flex flex-wrap items-center gap-[6px] border-t border-erp-panel-line pt-[16px]">
        <Button variant="off" onClick={onClose}>
          닫기
        </Button>
        <span className="flex-1" />
        {canDelete && (
          <Blocked reason={isSelf ? "본인 계정은 스스로 삭제할 수 없습니다" : undefined}>
            <Button variant="soft" onClick={() => setConfirm("delete")} disabled={isSelf || busy}>
              삭제
            </Button>
          </Blocked>
        )}
        {canUpdate && (
          <Button aria-controls="platform-admin-edit-panel" onClick={(e) => onEdit(e.currentTarget)} disabled={busy}>
            수정
          </Button>
        )}
        <HistoryButton adminId={admin.adminAccountId} />
      </div>

      {/* 고칠 수 없는 계정이면 확인창도 두지 않는다 */}
      {(canUpdate || canDelete) && (
        <>
          <ConfirmDialog
            open={confirm === "reset"}
            title="비밀번호 초기화"
            confirmLabel="초기화"
            wide
            busy={busy}
            onConfirm={handleReset}
            onCancel={() => setConfirm(null)}
          >
            <div className="flex flex-col gap-[12px]">
              {who}
              <p>
                새 초기 비밀번호(12자 무작위)를 비밀번호 초기화 안내 메일로 계정 이메일에 보냅니다. 초기화하는 사람도 그 값을 볼 수 없습니다. 초기 비밀번호는 1시간
                안에 로그인해야 하며, 지나면 로그인 화면의 비밀번호 찾기로 임시 비밀번호를 다시 받습니다.
              </p>
              <p>
                <b className="font-semibold">기존 비밀번호는 바로 무효가 되지만, 로그인 중인 세션은 끊지 않습니다.</b> 계정 상태는 그대로입니다. 다음 로그인 때
                비밀번호를 새로 정해야 합니다.
              </p>
            </div>
          </ConfirmDialog>

          <ConfirmDialog
            open={confirm === "delete"}
            title="플랫폼 관리자 계정 삭제"
            confirmLabel="삭제"
            busy={busy}
            onConfirm={handleDelete}
            onCancel={() => setConfirm(null)}
          >
            <div className="flex flex-col gap-[12px]">
              {who}
              <p>
                삭제하면 <b className="font-semibold">관리자 목록과 검색에서 빠지고</b>, 이 계정으로는 <b className="font-semibold">더 로그인할 수 없습니다</b>. 되살릴
                수 없습니다.
              </p>
            </div>
          </ConfirmDialog>
        </>
      )}
    </div>
  );
}
