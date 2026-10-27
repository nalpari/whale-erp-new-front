"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type RefObject } from "react";
import { Badge, Button, ConfirmDialog, DataTable, DetailTable, FormRow, ReadonlyCard, ReadonlyValue, SlidePanel, useToast, type DetailRow } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import { HeadValues } from "@/components/site/head-values";
import { usePagePermission } from "@/components/site/session-gate";
import { FailedBand } from "@/components/site/side-parts";
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
// 계정 상태 · 역할 · 권한 그룹은 이름 아랫줄에 「역할 | 권한그룹 | 상태 배지」(HeadValues)로 보인다(2026-10-27, 전엔 제목 줄 꼬리표). 가맹 관리자는 기본정보에 연결 가맹 마스터 줄을 둔다(2026-10-23).
// [수정] · [비밀번호 초기화]는 메뉴 수정 권한과 api 가 준 actions 를 함께 본다(bp-admin-rules.ts) — 막는 것은 api 다.
// 미사용 계정은 초기화 버튼 · 미발송 표시를 숨긴다 — 플랫폼 관리자와 같다(2026-10-27 사용자 지정). 본인 계정은 초기화 버튼을 막는다(내 정보에서 바꾼다).
// 등록 · 최종수정은 화면 맨 아래 권한 그룹 상세와 같은 테두리 없는 카드로, 적용 대상(전체 · 일부 점포)은 대상점포 제목 바 옆에 보인다. 최근 로그인은 기본정보 표의 비밀번호 아래 줄이다(2026-10-27 사용자 지정).

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
          <div className="flex">
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

  const muted = (text: string) => <span className="font-normal text-erp-muted">{text}</span>;
  // 일시는 굵게, 사람은 회색 · 보통 굵기로 「일시 · 사람」 — 권한 그룹 상세의 등록 · 최종수정과 같다
  const when = (at: string, who: string | null | undefined) => (
    <>
      {formatDateTime(at)} <span className="font-normal text-erp-label">· {who ?? "시스템"}</span>
    </>
  );
  const whenText = (at: string, who: string | null | undefined) => `${formatDateTime(at)} · ${who ?? "시스템"}`;
  // 등록만 한 계정은 수정일시가 등록일시와 같아 등록이 수정처럼 보인다 — 같으면 일시 · 수정자 대신 「-」를 둔다(2026-10-26 사용자 요청, 2026-10-27 「수정한 적 없음」 → 「-」).
  // 등록 때 두 값이 따로 찍혀 ms 가 어긋날 수 있어 1초 안쪽은 같은 것으로 본다
  const edited = Math.abs(Date.parse(admin.updatedAt) - Date.parse(admin.createdAt)) >= 1000;
  const rows: DetailRow[] = [
    { label: "아이디", value: admin.loginId },
    { label: "이름", value: name },
    { label: "연락처", value: admin.phone ? formatPhone(admin.phone) : null },
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
      // 미사용 계정은 초기화 버튼 · 미발송 표시 없이 빈칸으로 둔다 — 화면에서만 숨긴다(api 는 미사용 계정 초기화를 막지 않는다, 플랫폼 관리자와 같다)
      value: admin.accountStatus === "INACTIVE" ? null : (
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
    // 비밀번호 아래 줄 — 플랫폼 관리자 상세와 같이 표에 둔다(2026-10-27 사용자 지정)
    { label: "최근 로그인", value: admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : muted("로그인 기록 없음") },
  ];

  return (
    // 제목 줄과 기본정보 표 사이를 16 으로 — 플랫폼 관리자 상세와 같다(2026-10-27 사용자 지정 — 전엔 24)
    <div className="flex flex-col gap-[16px]">
      {/* 이름 아랫줄에 「역할 값 | 권한그룹 값 | 상태 배지」 — 공통코드 상세 코드 머리 · 플랫폼 관리자 상세와 같은 모양(2026-10-27 사용자 지정 — 전엔 꼬리표).
          상태는 라벨 없이 배지만. 이름 길이와 상관없이 두 화면이 같은 자리에 선다. 제목(h2)은 이름만 — 값 줄까지 제목 이름으로 읽히지 않게(리뷰로 찾음) */}
      <div className="flex flex-col items-start gap-[6px]">
        <h2 className="text-[18px] font-semibold text-erp-ink">{name}</h2>
        <span className="text-[14px]">
          <HeadValues
            items={[
              { label: "역할", value: roleType(admin.roleTypeCode) },
              { label: "권한그룹", value: admin.roleGroup.name },
              { value: admin.accountStatus === "ACTIVE" ? <Badge tone="on">사용</Badge> : <Badge tone="off">미사용</Badge> },
            ]}
          />
        </span>
      </div>
      {failure && <FailedBand message={failure} />}
      <DetailTable title="기본정보" rows={rows} />
      {/* 적용 대상은 대상점포 제목 바 옆에 「전체 점포 · 일부 점포」로 합쳤다(2026-10-27 사용자 지정 — 전엔 따로 「적용 대상」 줄) */}
      <MappedStores admin={admin} />
      {/* 등록 · 최종수정은 화면 맨 아래, 한 줄에 하나씩(2026-10-27 사용자 지정 — 전엔 기본정보 표 바로 아래) */}
      <ReadonlyCard>
        <FormRow>
          <ReadonlyValue label="등록" value={when(admin.createdAt, admin.createdByName)} title={whenText(admin.createdAt, admin.createdByName)} bold />
        </FormRow>
        <FormRow>
          <ReadonlyValue
            label="최종수정"
            value={edited ? when(admin.updatedAt, admin.updatedByName) : muted("-")}
            title={edited ? whenText(admin.updatedAt, admin.updatedByName) : undefined}
            bold
          />
        </FormRow>
      </ReadonlyCard>

      {/* 맨 아래 버튼 줄은 위와 선으로 가르지 않는다(DESIGN.md 슬라이드 패널). 위 카드와 조금 더 떨어지게 패널 칸 간격 16 에 8 을 더한다(2026-10-27 사용자 지정) */}
      <div className="flex flex-wrap items-center gap-[6px] pt-[8px]">
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
          // 제목 · 문구는 플랫폼 관리자 관리의 초기화 확인창과 같다(2026-10-27 사용자 지정)
          title="비밀번호를 초기화하시겠습니까?"
          confirmLabel="초기화"
          wide
          busy={busy}
          onConfirm={handleReset}
          onCancel={() => setConfirmOpen(false)}
        >
          <div className="flex flex-col gap-[12px]">
            <WhoList rows={[["아이디", admin.loginId], ["이름", name]]} />
            <p>
              임시 비밀번호가 등록된 이메일로 발송되며, 기존 비밀번호는 즉시 무효화됩니다.
              <br />
              임시 비밀번호는 1시간 동안 유효하며, 로그인 시 비밀번호를 변경해야 합니다.
              <br />
              현재 로그인 중인 세션은 유지됩니다.
            </p>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}

/** 대상점포 — 전체 점포면 목록으로 펼치지 않고 안내 한 줄로 보인다(2026-09-29). */
function MappedStores({ admin }: { admin: BpAdminDetail }) {
  const columns = [
    { header: "점포명", align: "left" as const, cell: (s: BpAdminStore) => s.name },
    { header: "점포코드", width: "w-[110px]" as const, cell: (s: BpAdminStore) => s.storeCode },
    { header: "점포 상태", width: "w-[90px]" as const, cell: (s: BpAdminStore) => <StoreStatusBadge status={s.storeStatusCode as StoreStatus} /> },
  ];
  const many = admin.stores.length > 5;
  // 열 이름 줄은 두지 않는다(화면 낭독기용으로만 남는다, headVariant="none") — 점포명 · ST 코드 · 상태 배지는 값만으로 뜻이 분명하고,
  // 회색 제목 바 아래에 열 이름 줄까지 붙으면 무거워 보였다(2026-10-27 사용자 지정 — 전엔 회색 머리 → 흰 머리)
  const table = <DataTable headVariant="none" columns={columns} rows={admin.stores} rowKey={(s) => s.storeId} empty="매핑된 점포가 없습니다." />;
  return (
    // 기본정보처럼 회색 제목 바(42px · 15px 600 — DetailTable 제목과 같다) 아래에 표를 붙인다(2026-10-27 사용자 지정 — 전엔 글자 제목 아래 따로 선 표).
    // 제목 바는 아래 선을 두지 않는다 — 표(또는 안내 칸)의 위 선이 그 자리를 맡아 선이 두 겹이 되지 않게 한다
    <section className="flex flex-col">
      {/* 점포가 많아 표가 스크롤하면 표는 오른쪽에 스크롤바 자리를 비운다 — 제목 바도 같은 자리를 비워 오른쪽 선이 표와 맞게 한다(사용자가 찾음) */}
      <div className={many ? "overflow-hidden [scrollbar-gutter:stable]" : undefined}>
        {/* 「대상점포」(15px)와 「일부 점포 · N개점」(14px)은 글자 바닥선을 맞추고, 그 묶음을 제목 바 가운데에 둔다(2026-10-27 사용자 확인) */}
        <h3 className="flex h-[42px] items-center rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink">
          <span className="flex items-baseline gap-[10px]">
            대상점포
            <span className="text-[14px] font-normal text-erp-label">
              {admin.isAllStores ? `전체 점포 · 지금 ${admin.bpStoreCount.toLocaleString("ko-KR")}개점` : `일부 점포 · ${admin.stores.length.toLocaleString("ko-KR")}개점`}
            </span>
          </span>
        </h3>
      </div>
      {admin.isAllStores ? (
        <p className="rounded-b-[2px] border border-erp-thead-line px-[16px] py-[14px] text-[14px] text-erp-label">소속 BP 의 모든 점포를 관리합니다. 새로 등록하는 점포도 함께 관리합니다.</p>
      ) : many ? (
        // 여섯 개부터는 다섯 줄 높이(위 선 1 + 줄 46 × 5) 안에서 표를 스크롤한다(2026-10-26 사용자 요청). 표의 아래 선은 마지막 줄에 붙어 스크롤 중엔
        // 상자 밖으로 내려간다 — 상자 맨 아래에 늘 보이는 선을 덧그린다(끝까지 내리면 마지막 줄 선과 겹친다, 사용자가 찾음)
        <div className="relative after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-erp-thead-line">
          <div className="max-h-[231px] overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">{table}</div>
        </div>
      ) : (
        table
      )}
    </section>
  );
}
