"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type RefObject } from "react";
import { Badge, Button, ConfirmDialog, DataTable, DetailTable, DetailValues, SlidePanel, Tag, useToast, type DetailRow } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import { usePagePermission } from "@/components/site/session-gate";
import { FailedBand, InfoBand } from "@/components/site/side-parts";
import { Blocked, WhoList } from "@/app/platform-admins/admin-parts";
import { HistoryButton } from "@/app/platform-admins/history-dialog";
import { StoreStatusBadge } from "@/app/stores/store-parts";
import { formatDateTime, formatPhone } from "@/lib/format";
import { detailButtonsOf } from "@/lib/bp-admin-rules";
import type { BpAdminDetail, BpAdminStore } from "@/lib/bp-admins";
import type { StoreStatus } from "@/lib/store-types";
import { getBpAdminHistoriesAction, resetBpAdminPasswordAction } from "./actions";
import { unknownResult } from "./bp-admin-parts";

// BP 관리자 상세(S-EBIPGZ · 데모 config/admins-detail). 모두 읽기 전용이고, 상태 · 권한 그룹 · 점포는 수정 패널에서만 바꾼다.
// 계정 상태 · 역할 · 권한 그룹은 제목 줄 꼬리표로 보인다(2026-10-07). 가맹 관리자는 기본정보에 연결 가맹 마스터 줄을 둔다(2026-10-23).
// [수정] · [비밀번호 초기화]는 메뉴 수정 권한과 api 가 준 actions 를 함께 본다(bp-admin-rules.ts) — 막는 것은 api 다.
// 미사용 계정도 초기화할 수 있다(목업 기준 — 플랫폼 관리자와 다르다). 본인 계정은 초기화 버튼을 막는다(내 정보에서 바꾼다).
// 본인 계정은 수정 범위를 제목 아래 띠로 알린다(가맹 관리자 본인은 늘, 그 밖은 [수정]이 보일 때만). 수정할 수 없는 가맹 관리자 계정은
// 수정 · 초기화를 막은 이유를 띠로 보인다(2026-10-27).

export function AdminDetailPanel({
  open,
  detail,
  onClose,
  onBackdropClose,
  trigger,
  onEdit,
}: {
  open: boolean;
  detail: { admin: BpAdminDetail } | { failed: string } | null;
  onClose: () => void;
  /** 바탕창 클릭 — 겹친 패널을 모두 닫는다(admins-screen.tsx closeAll) */
  onBackdropClose: () => void;
  trigger: RefObject<HTMLElement | null>;
  onEdit: (from: HTMLButtonElement) => void;
}) {
  return (
    // 읽기 전용이라 잃을 입력이 없다 — 바탕창을 누르면 닫힌다(밑에 깔린 등록이 있으면 함께, closeAll)
    <SlidePanel id="bp-admin-detail-panel" open={open} onClose={onClose} onBackdropClose={onBackdropClose} label="관리자 상세" trigger={trigger} closeOnBackdrop>
      {detail && "admin" in detail ? (
        // 다른 계정을 열면 확인창 · 실패 띠를 새로 시작한다
        <DetailBody key={detail.admin.adminAccountId} admin={detail.admin} panelOpen={open} onClose={onClose} onEdit={onEdit} />
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
  panelOpen,
  onClose,
  onEdit,
}: {
  admin: BpAdminDetail;
  /** 상세 패널이 열려 있는가 — 닫히면 이 안에서 띄운 팝업도 닫는다 */
  panelOpen: boolean;
  onClose: () => void;
  onEdit: (from: HTMLButtonElement) => void;
}) {
  const toast = useToast();
  const router = useRouter();
  const roleType = useCodeLabel("ROLE_TYPE");
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 확인창은 네이티브 <dialog>(최상위 레이어)라 패널이 밀려 나가도 혼자 남는다 — 뒤로 가기처럼 클릭 아닌 길로 패널이 닫히면 함께 닫는다
  if (!panelOpen && confirmOpen) setConfirmOpen(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();

  const can = usePagePermission();
  const { canUpdate, showReset, resetBlocked } = detailButtonsOf(admin.actions, can);
  const name = admin.name ?? admin.loginId;

  const handleReset = () =>
    startBusy(async () => {
      const result = await resetBpAdminPasswordAction(admin.adminAccountId).catch(unknownResult("비밀번호 초기화"));
      setConfirmOpen(false);
      if (!result.ok) {
        setFailure(result.message);
        // 지금 상태가 화면과 다를 수 있는 실패(그 사이 지움 · 바뀜 · 결과를 모름)면 다시 받는다
        if (result.status === undefined || result.status === 404 || result.status === 409) router.refresh();
        return;
      }
      setFailure(null);
      // 메일이 실패해도 기존 비밀번호는 이미 막혔다 — 다시 초기화하면 보낸다
      toast(result.isMailSent ? "초기 비밀번호를 계정 이메일로 보냈습니다." : "초기화했지만 메일을 보내지 못했습니다. 다시 초기화해 주세요.");
    });

  const muted = (text: string) => <span className="text-erp-muted">{text}</span>;
  const rows: DetailRow[] = [
    { label: "아이디", value: admin.loginId },
    { label: "이름", value: name },
    { label: "휴대전화번호", value: admin.phone ? formatPhone(admin.phone) : null },
    { label: "이메일", value: admin.email ?? null },
    // 가맹 관리자만 — 등록 때 정해진 연결 가맹 마스터. 누가 열든 보인다(2026-10-23)
    ...(admin.franchiseMaster
      ? [
          {
            label: "연결 가맹 마스터",
            value: (
              <span>
                {admin.franchiseMaster.loginId} {admin.franchiseMaster.name && <span className="text-erp-label">{admin.franchiseMaster.name}</span>}
              </span>
            ),
          },
        ]
      : []),
    {
      label: "비밀번호",
      value: (
        <span className="flex items-center gap-[10px]">
          {showReset && (
            <Blocked reason={resetBlocked ? "본인 비밀번호는 내 정보에서 바꿉니다" : undefined}>
              <Button variant="soft" onClick={() => setConfirmOpen(true)} disabled={resetBlocked || busy}>
                초기화
              </Button>
            </Blocked>
          )}
          {admin.isInitialPasswordUnsent && <span className="text-erp-off">초기 비밀번호 미발송</span>}
        </span>
      ),
    },
    { label: "등록일시", value: <DetailValues items={[formatDateTime(admin.createdAt), admin.createdByName ?? muted("시스템")]} /> },
    {
      label: "최종 수정일시",
      // 등록만 한 계정은 수정일시가 등록일시와 같아 등록이 수정처럼 보인다 — 같으면 일시 · 수정자 대신 「수정한 적 없음」을 둔다(2026-10-26 사용자 요청).
      // 등록 때 두 값이 따로 찍혀 ms 가 어긋날 수 있어 1초 안쪽은 같은 것으로 본다
      value:
        Math.abs(Date.parse(admin.updatedAt) - Date.parse(admin.createdAt)) >= 1000 ? (
          <DetailValues items={[formatDateTime(admin.updatedAt), admin.updatedByName ?? muted("시스템")]} />
        ) : (
          muted("수정한 적 없음")
        ),
    },
    { label: "최근 로그인", value: admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : muted("로그인 기록 없음") },
  ];

  return (
    <div className="flex flex-col gap-[24px]">
      <h2 className="flex flex-wrap items-center gap-[6px] text-[18px] font-semibold text-erp-ink">
        <span className="mr-[4px]">{name}</span>
        {admin.accountStatus === "ACTIVE" ? <Badge tone="on">사용</Badge> : <Badge tone="off">미사용</Badge>}
        <Tag>{roleType(admin.roleTypeCode)}</Tag>
        <Tag>
          권한 그룹 · <b className="font-semibold">{admin.roleGroup.name}</b>
        </Tag>
      </h2>
      {failure && <FailedBand message={failure} />}
      {/* 버튼을 숨기거나 막은 이유(목업 admins-detail). 연결 가맹 마스터가 아닌 사람이 보는 가맹 관리자 문구는 2026-10-27 사용자 지정 */}
      {admin.actions.isSelf ? (
        admin.roleTypeCode === "FA" ? (
          <InfoBand>
            <p>내 계정입니다 — 조회만 합니다</p>
            <p className="font-normal text-erp-label">
              가맹 관리자는 계정을 수정하지 않습니다. 계정 정보 · 권한 그룹 · 점포 · 상태는 연결된 가맹 마스터가 바꾸고, 비밀번호는 내 정보에서 직접 바꿉니다.
            </p>
          </InfoBand>
        ) : (
          // 수정 화면을 설명하는 띠라 [수정]이 보일 때만(메뉴 수정 권한 + api canUpdate)
          canUpdate && (
            <InfoBand>
              <p>내 계정입니다</p>
              <p className="font-normal text-erp-label">
                수정 화면에서는 기본정보(이름 · 휴대전화번호 · 이메일)만 바뀝니다. 권한 그룹 · 계정 상태 · 대상 점포는 BP 마스터 · BP 관리자 · 플랫폼 사용자가,
                비밀번호는 내 정보에서 직접 바꿉니다.
              </p>
            </InfoBand>
          )
        )
      ) : (
        admin.roleTypeCode === "FA" &&
        !admin.actions.canUpdate && <InfoBand>가맹 관리자 계정은 연결된 가맹 마스터만 수정 · 비밀번호 초기화할 수 있습니다.</InfoBand>
      )}
      <DetailTable title="기본정보" rows={rows} />
      {/* 대상 점포 위에 적용 범위 — BP 휴일 상세의 적용 대상과 같은 모양(데모, 2026-10-08) */}
      <DetailTable title="적용 대상" rows={[{ label: "적용 범위", value: <Tag>{admin.isAllStores ? "전체 점포" : "일부 점포"}</Tag> }]} />
      <MappedStores admin={admin} />

      <div className="flex flex-wrap items-center gap-[6px] border-t border-erp-panel-line pt-[16px]">
        <Button variant="off" onClick={onClose}>
          닫기
        </Button>
        <span className="flex-1" />
        {canUpdate && (
          <Button aria-controls="bp-admin-edit-panel" onClick={(e) => onEdit(e.currentTarget)} disabled={busy}>
            수정
          </Button>
        )}
        <HistoryButton adminId={admin.adminAccountId} panelOpen={panelOpen} load={getBpAdminHistoriesAction} />
      </div>

      {showReset && !resetBlocked && (
        <ConfirmDialog
          open={confirmOpen}
          title="비밀번호 초기화"
          confirmLabel="초기화"
          wide
          busy={busy}
          onConfirm={handleReset}
          onCancel={() => setConfirmOpen(false)}
        >
          <div className="flex flex-col gap-[12px] break-keep">
            <WhoList rows={[["아이디", admin.loginId], ["이름", name]]} />
            <p>
              시스템이 12자 무작위 초기 비밀번호를 새로 발급해 이 계정의 이메일로만 보냅니다. 처리하는 사람도 그 값을 볼 수 없습니다. 초기 비밀번호는 1시간
              안에 로그인해야 하며, 지나면 로그인 화면의 비밀번호 찾기로 임시 비밀번호를 다시 받습니다.
            </p>
            <p>
              <b className="font-semibold">지금 비밀번호는 곧바로 못 쓰게 되지만, 열려 있는 세션은 닫지 않습니다</b>
            </p>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}

/** 대상 점포 — 전체 점포면 목록으로 펼치지 않고 한 줄로 보인다(2026-09-29). */
function MappedStores({ admin }: { admin: BpAdminDetail }) {
  const columns = [
    { header: "점포명", align: "left" as const, cell: (s: BpAdminStore) => s.name },
    { header: "점포코드", width: "w-[110px]" as const, cell: (s: BpAdminStore) => s.storeCode },
    { header: "점포 상태", width: "w-[90px]" as const, cell: (s: BpAdminStore) => <StoreStatusBadge status={s.storeStatusCode as StoreStatus} /> },
  ];
  return (
    <section className="flex flex-col gap-[12px]">
      <h3 className="text-[15px] font-semibold text-erp-ink">
        대상 점포
        <span className="ml-[6px] text-[14px] font-normal text-erp-label">
          {admin.isAllStores ? `전체 · 지금 ${admin.bpStoreCount.toLocaleString("ko-KR")}개점` : `일부 · ${admin.stores.length.toLocaleString("ko-KR")}개점`}
        </span>
      </h3>
      {admin.isAllStores ? (
        <p className="text-[14px] text-erp-label">소속 BP 의 모든 점포를 관리합니다. 새로 등록하는 점포도 함께 관리합니다.</p>
      ) : (
        // 5개까지 보이고 그 뒤로는 이 안에서 세로로 스크롤한다 — 머리 42 + 줄 46 × 5 + 선(2026-10-26 사용자 요청)
        <div className="max-h-[274px] overflow-y-auto overscroll-contain">
          <DataTable columns={columns} rows={admin.stores} rowKey={(s) => s.storeId} empty="매핑된 점포가 없습니다." />
        </div>
      )}
    </section>
  );
}
