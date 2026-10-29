"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type RefObject } from "react";
import { Badge, Blocked, Button, ConfirmDialog, DetailTable, SlidePanel, useToast, type DetailRow } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import { HeadValues } from "@/components/site/head-values";
import { SuccessBand, WarnBand } from "@/components/site/side-parts";
import { useAccount, usePagePermission } from "@/components/site/session-gate";
import { formatDateTime, formatPhone, wasUpdated } from "@/lib/format";
import { adminActionsOf } from "@/lib/platform-admin-actions";
import type { PlatformAdminDetail } from "@/lib/platform-admins";
import { deletePlatformAdminAction, getPlatformAdminHistoriesAction, resetPlatformAdminPasswordAction } from "./actions";
import { FailedBand, unknownResult, WhoList } from "./admin-parts";
import { HistoryButton } from "./history-dialog";

// 플랫폼 관리자 상세(S-BRSPGB). 모두 읽기 전용이고, 상태 · 권한은 수정 패널에서만 바꾼다.
// 메뉴 권한(로그인 정보)으로 수정 · 비밀번호 초기화는 update, 삭제는 delete 가 있을 때 보인다 — api 도 같은 칸을 본다.
// 플랫폼 관리자가 플랫폼 마스터 계정을 열면 셋 다 숨기고, 본인 계정이면 삭제 · 초기화만 흐리게 둔다(SYSTEM-1).
// 화면은 미리 숨기거나 흐리게만 한다 — 막는 것은 api 다. 실행 버튼은 닫기만 맨 왼쪽, 나머지는 오른쪽 끝(BP 관리자 상세와 같다).

export function AdminDetailPanel({
  open,
  detail,
  onClose,
  onBackdropClose,
  trigger,
  onEdit,
  onDeleted,
}: {
  open: boolean;
  detail: { admin: PlatformAdminDetail } | { failed: string } | null;
  onClose: () => void;
  /** 바탕창 클릭 — 겹친 패널을 모두 닫는다(admins-screen.tsx closeAll) */
  onBackdropClose: () => void;
  trigger: RefObject<HTMLElement | null>;
  onEdit: (from: HTMLButtonElement) => void;
  onDeleted: () => void;
}) {
  return (
    // 읽기 전용이라 잃을 입력이 없다 — 바탕창을 누르면 닫힌다(밑에 깔린 등록이 있으면 함께, closeAll).
    // 수정 패널이 위에 겹쳐 열려 있으면 onClose(dismissDetail)가 admins-screen.tsx 자신의 editOpen 을 보고
    // 스스로 거른다. 수정이 위에 있는 동안 이 패널 안이 눌리지 않는 것은 SlidePanel 의 blockedByModal 이
    // 맡는다 — 전에는 여기서도 editOpen 을 받아 DetailBody 에 따로 inert 를 줬지만, 이제 바깥 aside 가 통째로
    // inert 라 안쪽 값은 항상 가려져 중복이었다(코드 리뷰로 찾음, 2026-10-20).
    <SlidePanel
      id="platform-admin-detail-panel"
      open={open}
      onClose={onClose}
      onBackdropClose={onBackdropClose}
      label="플랫폼 관리자 상세"
      trigger={trigger}
      closeOnBackdrop
    >
      {detail && "admin" in detail ? (
        <DetailBody
          // 다른 계정을 열면 확인창 · 실패 띠를 새로 시작한다
          key={detail.admin.adminAccountId}
          admin={detail.admin}
          panelOpen={open}
          onClose={onClose}
          onEdit={onEdit}
          onDeleted={onDeleted}
        />
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
  onDeleted,
}: {
  admin: PlatformAdminDetail;
  /** 상세 패널이 열려 있는가 — 닫히면 이 안에서 띄운 팝업도 닫는다 */
  panelOpen: boolean;
  onClose: () => void;
  onEdit: (from: HTMLButtonElement) => void;
  onDeleted: () => void;
}) {
  const toast = useToast();
  const router = useRouter();
  const [confirm, setConfirm] = useState<"reset" | "delete" | null>(null);
  // 확인창 · 이력창은 네이티브 <dialog>(최상위 레이어)라 패널이 밀려 나가도 혼자 남는다. 브라우저 뒤로 가기처럼 클릭 아닌 길로
  // 패널이 닫히면 함께 닫는다(2026-10-22 사용자 요청). 진행 중인 초기화 · 삭제 요청은 그대로 끝까지 간다.
  // 이력창은 HistoryButton 이 panelOpen 으로 같은 방식으로 닫는다.
  if (!panelOpen && confirm) setConfirm(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();
  /** 이 상세에서 초기화 메일을 보냈다 — 로그인한 적이 있어도 하늘색 안내를 띄운다(BP 마스터 상세와 같다, 2026-10-28 사용자 지정) */
  const [resetMark, setResetMark] = useState<{ statusChangedAt: string | null } | null>(null);
  // 초기화한 뒤 상태를 바꾸면(수정 패널에서 미사용 → 사용) 방금 초기화 안내를 내린다 — 그때의 상태 변경 일시와 같을 때만(리뷰로 찾음)
  const resetSent = resetMark !== null && resetMark.statusChangedAt === (admin.statusChangedAt ?? null);

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
      // 메일이 실패해도 기존 비밀번호는 이미 막혔다 — 다시 초기화하면 보낸다(SYSTEM-3). 결과는 상세 위 상자로(액션이 refresh 해 미발송이 켜진다)
      setResetMark(result.isMailSent ? { statusChangedAt: admin.statusChangedAt ?? null } : null);
      if (result.isMailSent) toast("초기화되었습니다.");
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
  // 등록 · 최종수정 줄의 값 — 「일시 · 사람」, 사람은 회색(권한 그룹 상세와 같은 구분)
  // 값 칸 폭(약 280px)을 넘는 긴 이름은 말줄임하고, 마우스를 올리면 전체를 보인다(리뷰로 찾음)
  const when = (at: string, who: string) => (
    <span className="truncate" title={`${formatDateTime(at)} · ${who}`}>
      {formatDateTime(at)} <span className="text-erp-label">· {who}</span>
    </span>
  );
  // 등록만 한 계정은 수정일시가 등록일시와 같아 등록이 수정처럼 보인다 — 같으면 최종수정은 「-」(BP 관리자 상세와 같다, 2026-10-27 사용자 지정).
  // 1초 안쪽 어긋남은 같은 것으로 본다(wasUpdated).
  // 수정자가 없는 계정(마이그레이션으로 넣은 플랫폼 마스터 등)도 「-」다. 한계: api 의 updatedAt(Prisma @updatedAt)은 로그인 · 초기 비밀번호 미발송 표시에도 올라가는데,
  // 수정자(updatedBy)는 등록 때부터 등록자로 채워져 있어 이 검사로는 그 갱신을 거르지 못한다 — 로그인한 계정은 「로그인 시각 · 등록자」가
  // 최종수정으로 보이고, 등록 직후에도 메일을 보낸 뒤 미발송 표시를 끄며 몇 초 늦게 찍혀 보일 수 있다(api 요청 대기)
  const edited = admin.updatedByName !== null && wasUpdated(admin.createdAt, admin.updatedAt);
  const rows: DetailRow[] = [
    { label: "아이디", value: admin.loginId },
    { label: "이름", value: name },
    { label: "연락처", value: admin.phone ? formatPhone(admin.phone) : null },
    { label: "이메일", value: admin.email ?? null },
    {
      label: "비밀번호",
      // 미사용 계정은 초기화 버튼을 숨긴다(2026-10-23) — 화면에서만 숨긴다(api 는 미사용 계정 초기화를 막지 않는다).
      // 초기화할 수 없으면(미사용 · 수정 권한 없음) 빈칸 대신 「-」(BP 마스터 상세와 같다, 2026-10-28 사용자 지정). 미발송은 상세 위 빨간 상자가 알린다
      value:
        admin.accountStatus === "INACTIVE" || !canUpdate ? muted("-") : (
        <>
          {canUpdate && (
            <Blocked reason={isSelf ? "본인 비밀번호는 내 정보에서 바꿔 주세요." : undefined}>
              <Button variant="soft" onClick={() => setConfirm("reset")} disabled={isSelf || busy}>
                초기화
              </Button>
            </Blocked>
          )}
        </>
      ),
    },
    { label: "소속부서", value: admin.department ?? null },
    { label: "직책", value: admin.jobTitle ?? null },
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
        null
      ),
    },
    // 최근 로그인 다음에 등록 · 최종수정을 표 안 두 줄로(2026-10-27 사용자 지정 — 잠시 표 밖 테두리 없는 카드였다)
    { label: "최근 로그인", value: admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : muted("-") },
    { label: "등록", value: when(admin.createdAt, admin.createdByName ?? "시스템") },
    { label: "최종수정", value: edited && admin.updatedByName ? when(admin.updatedAt, admin.updatedByName) : muted("-") },
  ];
  // 미사용 전환일시는 상세에 더 보이지 않는다 — 누가 바꿨는지까지는 변경이력에 이미 쌓인다(2026-10-20 피드백).

  const who = <WhoList rows={[["아이디", admin.loginId], ["이름", name]]} />;
  const roleType = useCodeLabel("ROLE_TYPE");

  // 안내 상자의 「[초기화] 버튼으로 …」는 그 버튼을 누를 수 있는 사람에게만 — 권한 없음 · 본인 계정은 앞 문장만(리뷰로 찾음)
  const canReset = canUpdate && !isSelf;
  return (
    <div className="flex flex-col gap-[16px]">
      {/* 이름 아랫줄에 「역할 값 | 권한그룹 값 | 상태 배지」 — 공통코드 상세 코드 머리와 같은 모양(2026-10-27 사용자 지정 — 전엔 상태 배지와 「사용자 권한 · 그룹명」 띠지).
          상태는 라벨 없이 배지만. 이름 길이와 상관없이 두 화면이 같은 자리에 선다. 제목(h2)은 이름만 — 값 줄까지 제목 이름으로 읽히지 않게(리뷰로 찾음) */}
      <div className="flex flex-col items-start gap-[6px]">
        {/* 이름 앞에 14px 회색 라벨 「이름」 — BP 마스터 상세 「상호명」과 같다(2026-10-28 사용자 지정). 라벨은 h2 밖에 둬 제목은 이름만 읽힌다 */}
        <div className="flex items-baseline gap-[6px]">
          <span className="text-[14px] text-erp-label">이름</span>
          <h2 className="text-[18px] font-semibold text-erp-ink">{name}</h2>
        </div>
        <span className="text-[14px]">
          <HeadValues
            items={[
              { label: "역할", value: roleType(admin.roleGroup.roleTypeCode) },
              { label: "권한명", value: admin.roleGroup.name }, // 라벨 「권한명」(2026-10-27 사용자 지정 — 전엔 「권한그룹」)
              { value: admin.accountStatus === "ACTIVE" ? <Badge tone="on">사용</Badge> : <Badge tone="off">미사용</Badge> },
            ]}
          />
        </span>
      </div>
      {/* 초기화 비밀번호 안내 — BP 마스터 상세와 같은 상자(2026-10-28 사용자 지정). 메일 실패는 빨간 상자(비밀번호 줄의 「미발송」 글자 대신),
          보냈고 첫 로그인 전이거나 이 상세에서 방금 초기화했으면 하늘색 상자. 초기화 비밀번호는 1시간만 유효하다(api) */}
      {/* 방금 한 동작의 실패는 머리 바로 아래, 다른 안내 상자보다 위에(2026-10-28 사용자 지정) */}
      {failure && <FailedBand message={failure} />}
      {admin.accountStatus === "ACTIVE" && admin.isInitialPasswordUnsent && <WarnBand>{`초기화 비밀번호가 발송되지 않았습니다.${canReset ? "\n비밀번호 [초기화] 버튼을 눌러 다시 발송해 주세요." : ""}`}</WarnBand>}
      {admin.accountStatus === "ACTIVE" && !admin.isInitialPasswordUnsent && (resetSent || (!admin.lastLoginAt && !admin.statusChangedAt)) && (
        <SuccessBand>{`초기화 비밀번호를 발송했습니다.${canReset ? "\n1시간 내 미로그인 시 [초기화] 버튼으로 재발송해 주세요." : ""}`}</SuccessBand>
      )}
      <DetailTable title="기본정보" rows={rows} />

      <div className="flex flex-wrap items-center gap-[6px]">
        <Button variant="off" onClick={onClose}>
          닫기
        </Button>
        <span className="flex-1" />
        {canDelete && (
          <Blocked reason={isSelf ? "본인 계정은 스스로 삭제할 수 없습니다." : undefined}>
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
        <HistoryButton adminId={admin.adminAccountId} panelOpen={panelOpen} load={getPlatformAdminHistoriesAction} />
      </div>

      {/* 고칠 수 없는 계정이면 확인창도 두지 않는다 */}
      {(canUpdate || canDelete) && (
        <>
          <ConfirmDialog
            open={confirm === "reset"}
            title="비밀번호를 초기화하시겠습니까?"
            confirmLabel="초기화"
            wide
            busy={busy}
            onConfirm={handleReset}
            onCancel={() => setConfirm(null)}
          >
            <div className="flex flex-col gap-[12px]">
              <WhoList rows={[["아이디", admin.loginId], ["이름", name ?? "-"], ["이메일", admin.email ?? "-"]]} />
              {/* 세 관리 화면 같은 문구 · 대상은 아이디 · 이름 · 이메일 각각(「아이디/이름」 한 줄은 라벨이 잘렸다)(2026-10-28 사용자 지정) */}
              {/* 안내는 빨간 안내 상자로 — 되돌릴 수 없는 동작이라 놓치지 않게(2026-10-28 사용자 지정) */}
              <WarnBand>{"비밀번호 초기화 시 새로운 비밀번호가 등록된 이메일로 발송됩니다.\n새 비밀번호는 1시간 동안 유효하며, 로그인 시 변경해야 합니다.\n기존 비밀번호는 즉시 사용할 수 없게 됩니다."}</WarnBand>
            </div>
          </ConfirmDialog>

          <ConfirmDialog
            open={confirm === "delete"}
            title="관리자 계정을 삭제하시겠습니까?"
            confirmLabel="삭제"
            busy={busy}
            onConfirm={handleDelete}
            onCancel={() => setConfirm(null)}
          >
            <div className="flex flex-col gap-[12px]">
              {who}
              {/* 되돌릴 수 없는 결과 안내 — 플랫폼 메뉴 관리의 미사용 안내와 같은 빨간 테두리 · 연한 빨간 바탕 상자(2026-10-27 사용자 지정 — 전엔 본문 글자) */}
              <WarnBand>
                <p>
                  삭제한 계정은 관리자 목록 및 검색 결과에서 제외되며, 해당 계정으로 더 이상 로그인할 수 없습니다.
                </p>
              </WarnBand>
            </div>
          </ConfirmDialog>
        </>
      )}
    </div>
  );
}
