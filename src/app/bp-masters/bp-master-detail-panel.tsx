"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode, type RefObject } from "react";
import { Badge, Button, ConfirmDialog, DetailTable, DetailValues, SlidePanel, Tag, useToast, type DetailRow } from "@/components/common";
import { usePagePermission } from "@/components/site/session-gate";
import type { BpMasterDetail, CreateBpMasterResult } from "@/lib/bp-masters";
import { formatDateTime, formatPhone, wasUpdated } from "@/lib/format";
import { formatBizNumber } from "@/lib/store-view";
import { Blocked, FailedBand, WhoList } from "../platform-admins/admin-parts";
import { NoticeBand } from "../stores/store-parts";
import { changeBpMasterStatusAction, deleteBpMasterAction, resetBpMasterPasswordAction } from "./actions";
import { BpStatusBadge, unknownResult, WITHDRAWN_TEXT } from "./bp-master-parts";
import { HistoryButton } from "./history-dialog";

// BP 마스터 계정 상세(S-GZDODB · 초기화 S-PRRLMA). 모두 읽기 전용이고, 기본정보 · 사업자정보를 나눠 보인다.
// 버튼 자리는 플랫폼 관리자 상세와 같다(BP-6) — 상태 변경 · 비밀번호 초기화는 그 줄의 버튼(수정 권한),
// 하단은 [닫기] … [삭제][수정][변경 이력]. 탈퇴 BP 는 조회만 된다(상태 변경 · 초기화 · 삭제 · 수정 없음).
// 화면은 미리 숨기거나 흐리게만 한다 — 막는 것은 api 다.

/** 방금 등록한 BP — 상세 위쪽 띠로 BP 코드와 메일 발송 주소를 알린다(BP-3) */
export type CreatedNotice = CreateBpMasterResult;

export function BpMasterDetailPanel({
  open,
  detail,
  created,
  onClose,
  onBackdropClose,
  trigger,
  onEdit,
  onDeleted,
}: {
  open: boolean;
  detail: { bp: BpMasterDetail } | { failed: string } | null;
  created: CreatedNotice | null;
  onClose: () => void;
  /** 바탕창 클릭 — 겹친 패널을 모두 닫는다(bp-masters-screen.tsx closeAll) */
  onBackdropClose: () => void;
  trigger: RefObject<HTMLElement | null>;
  onEdit: (from: HTMLButtonElement) => void;
  onDeleted: () => void;
}) {
  return (
    // 읽기 전용이라 잃을 입력이 없다 — 바탕창을 누르면 닫힌다(밑에 깔린 등록이 있으면 함께, closeAll — platform-admins 상세와 같다)
    <SlidePanel
      id="bp-master-detail-panel"
      open={open}
      onClose={onClose}
      onBackdropClose={onBackdropClose}
      label="BP 마스터 계정 상세"
      trigger={trigger}
      closeOnBackdrop
    >
      {detail && "bp" in detail ? (
        <DetailBody
          // 다른 BP 를 열면 확인창 · 실패 띠를 새로 시작한다
          key={detail.bp.bpCodeId}
          bp={detail.bp}
          panelOpen={open}
          created={created}
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

type Confirm = "inactive" | "active" | "reset" | "delete";

function DetailBody({
  bp,
  panelOpen,
  created,
  onClose,
  onEdit,
  onDeleted,
}: {
  bp: BpMasterDetail;
  /** 상세 패널이 열려 있는가 — 닫히면 이 안에서 띄운 팝업도 닫는다 */
  panelOpen: boolean;
  created: CreatedNotice | null;
  onClose: () => void;
  onEdit: (from: HTMLButtonElement) => void;
  onDeleted: () => void;
}) {
  const toast = useToast();
  const router = useRouter();
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  // 확인창 · 이력창은 네이티브 <dialog>(최상위 레이어)라 패널이 밀려 나가도 혼자 남는다. 브라우저 뒤로 가기처럼 클릭 아닌 길로
  // 패널이 닫히면 함께 닫는다(platform-admins 와 같다). 진행 중인 요청은 그대로 끝까지 간다.
  if (!panelOpen && confirm) setConfirm(null);
  const [failure, setFailure] = useState<{ message: string; detail?: string } | null>(null);
  const [busy, startBusy] = useTransition();

  const can = usePagePermission();
  const withdrawn = bp.accountStatus === "WITHDRAWN";
  const canUpdate = can.update && !withdrawn;
  const canDelete = can.delete && !withdrawn;

  /**
   * 실패 띠를 세운다. 지금 상태가 화면과 다를 수 있는 실패면 상세 · 목록을 다시 받는다 —
   * 404(그 사이 지움) · 409(그 사이 탈퇴 · 삭제 조건이 바뀜) · 결과를 모름(이미 처리됐을 수 있음).
   */
  const fail = (status: number | undefined, message: string) => {
    setFailure({ message });
    if (status === undefined || status === 404 || status === 409) router.refresh();
  };

  const run = (what: () => Promise<{ ok: true } | { ok: false; status?: number; message: string }>, done: () => void) =>
    startBusy(async () => {
      const result = await what();
      setConfirm(null);
      if (!result.ok) return fail(result.status, result.message);
      setFailure(null);
      done();
    });

  const handleStatus = (status: "ACTIVE" | "INACTIVE") =>
    run(
      () => changeBpMasterStatusAction(bp.bpCodeId, status).catch(unknownResult("상태 변경")),
      () => toast(status === "INACTIVE" ? "미사용으로 바꿨습니다." : "사용으로 바꿨습니다."),
    );

  const handleReset = () =>
    startBusy(async () => {
      const result = await resetBpMasterPasswordAction(bp.bpCodeId).catch(unknownResult("비밀번호 초기화"));
      setConfirm(null);
      if (!result.ok) return fail(result.status, result.message);
      if (result.isMailSent) {
        setFailure(null);
        toast(`새 초기 비밀번호를 ${bp.email ?? "계정 이메일"} 로 보냈습니다.`);
      } else {
        // 기존 비밀번호는 이미 막혔다 — 다시 초기화하면 새 값으로 다시 보낸다(S-PRRLMA)
        setFailure({
          message: "초기화는 됐지만 안내 메일을 보내지 못했습니다.",
          detail: "기존 비밀번호는 이미 무효입니다. 다시 초기화하면 새 비밀번호로 메일을 다시 보냅니다.",
        });
      }
    });

  const handleDelete = () => run(() => deleteBpMasterAction(bp.bpCodeId).catch(unknownResult("삭제")), onDeleted);

  const muted = (text: string) => <span className="text-erp-muted">{text}</span>;
  const gone = muted(WITHDRAWN_TEXT);
  // 미인증 BP 는 진위확인으로 채워지는 값과 대표자 연락 · 주소를 하이픈으로 보인다(S-GZDODB)
  const verified = Boolean(bp.bizVerifiedAt);
  const unverified = (value: ReactNode) => (verified ? value : muted("-"));
  const address = [bp.bizZipCode, bp.bizAddress, bp.bizAddressDetail].filter((line): line is string => Boolean(line));

  const basic: DetailRow[] = [
    { label: "BP 코드", value: bp.bpCode },
    { label: "아이디", value: bp.loginId },
    { label: "이름", value: withdrawn ? gone : bp.name },
    { label: "연락처", value: withdrawn ? gone : formatPhone(bp.phone) },
    { label: "이메일", value: withdrawn ? gone : bp.email },
    {
      label: "비밀번호",
      value: (
        <>
          {canUpdate && (
            <Button variant="soft" onClick={() => setConfirm("reset")} disabled={busy}>
              초기화
            </Button>
          )}
          {/* 등록 · 초기화 메일이 실패했다 — 다시 보내는 길은 초기화뿐이다 */}
          {!withdrawn && bp.isInitialPasswordUnsent && <span className="text-erp-off">초기 비밀번호 미발송</span>}
        </>
      ),
    },
    {
      label: "BP 상태",
      value: (
        <>
          <BpStatusBadge status={bp.accountStatus} />
          {bp.statusChangedAt && <span className="text-erp-label">{formatDateTime(bp.statusChangedAt)}</span>}
          {canUpdate && (
            <Button variant="soft" onClick={() => setConfirm(bp.accountStatus === "ACTIVE" ? "inactive" : "active")} disabled={busy}>
              상태 변경
            </Button>
          )}
        </>
      ),
    },
    // 소속 점포는 수만 보인다 — 점포 목록 연결은 나중에(BP-8)
    { label: "소속 점포", value: `${bp.storeCount.toLocaleString("ko-KR")}곳` },
    { label: "가입경로", value: bp.joinPath === "SIGNUP" ? "회원가입" : "플랫폼등록" },
    { label: "등록 일시", value: <DetailValues items={[formatDateTime(bp.createdAt), bp.createdByName ?? bp.loginId]} /> },
    // api 의 최종수정 일시는 BP 정보(bp_codes.updated_at) 것이다 — 수정 저장 · 상태 변경 때 바뀌고, 비밀번호 초기화처럼 계정만 고친 것은 들어가지 않는다(BP-7).
    // 등록할 때 같은 insert 로 수정 일시 · 수정자가 함께 채워지므로 1팀 공통 판정(wasUpdated — 1초 이상 차이)으로 고친 적이 있는지 본다
    { label: "수정 일시", value: bp.updatedByName && wasUpdated(bp.createdAt, bp.updatedAt) ? <DetailValues items={[formatDateTime(bp.updatedAt), bp.updatedByName]} /> : "-" },
    { label: "최근 로그인", value: bp.lastLoginAt ? formatDateTime(bp.lastLoginAt) : "-" },
    // 「첫 로그인 때 받음」은 아직 로그인하지 않은 BP 에만 붙인다
    { label: "약관 동의", value: bp.termsAgreedAt ? "동의" : bp.lastLoginAt ? "미동의" : <>미동의 {muted("· 첫 로그인 때 받음")}</> },
    { label: "강제 변경", value: bp.isPasswordChangeRequired ? "비밀번호 변경 대상" : "대상 아님" },
  ];

  const business: DetailRow[] = [
    { label: "상호명", value: bp.tradeName },
    { label: "사업자번호", value: unverified(formatBizNumber(bp.bizRegistrationNumber)) },
    { label: "대표자명", value: unverified(bp.bizCeoName) },
    { label: "대표자 연락처", value: unverified(withdrawn ? gone : formatPhone(bp.bizCeoPhone)) },
    { label: "대표자 이메일", value: unverified(withdrawn ? gone : bp.bizCeoEmail) },
    { label: "개업일자", value: unverified(bp.bizOpenDate) },
    {
      label: "사업자주소",
      multiline: verified && address.length > 0,
      value: unverified(
        address.length ? (
          <div className="py-[2px]">
            {address.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        ) : null,
      ),
    },
    { label: "업태 · 종목", value: <DetailValues items={[bp.bizCategory ?? "", bp.bizItem ?? ""].filter(Boolean)} /> },
    // 라벨 · 빈 값은 점포 상세(stores/[storeId]/page.tsx)와 같다
    { label: "최종 인증일시", value: unverified(formatDateTime(bp.bizVerifiedAt)) },
  ];

  const who = <WhoList rows={[["BP", `${bp.tradeName} · ${bp.bpCode}`], ["계정", bp.loginId]]} />;

  return (
    <div className="flex flex-col gap-[16px]">
      <h2 className="flex flex-wrap items-center gap-[6px] text-[18px] font-semibold text-erp-ink">
        <span className="mr-[4px]">{bp.tradeName}</span>
        <BpStatusBadge status={bp.accountStatus} />
        <Tag>
          BP 코드 · <b className="font-semibold">{bp.bpCode}</b>
        </Tag>
      </h2>

      {created && (
        <NoticeBand
          tone="info"
          title={`BP를 등록했습니다 · BP 코드 ${created.bpCode}`}
          detail={
            created.isMailSent
              ? `초기 비밀번호를 ${created.email} 로 보냈습니다. BP 마스터는 첫 로그인 때 비밀번호 변경과 약관 동의를 마쳐야 ERP 를 쓸 수 있습니다.`
              : `초기 비밀번호 메일을 ${created.email} 로 보내지 못했습니다. 아래 비밀번호 [초기화]로 다시 보내 주세요.`
          }
        />
      )}
      {bp.accountStatus === "INACTIVE" && (
        <NoticeBand
          title="미사용 BP입니다 — 이 BP의 모든 관리자 계정이 로그인할 수 없습니다"
          detail="점포 상태는 그대로 두고 직원 초대 · 근로계약 · 부가서비스 · 매출 연동 · 출퇴근 기록만 멈췄습니다. 목록 · 상세 조회는 됩니다."
        />
      )}
      {withdrawn && (
        <NoticeBand
          tone="info"
          title="탈퇴 BP는 조회만 됩니다"
          detail="BP 정보와 업무 이력은 보존 정책대로 남기고, 수정 · 비밀번호 초기화 · 삭제는 하지 않습니다. 다시 쓰려면 새 BP 로 등록합니다."
        />
      )}
      {failure && <FailedBand message={failure.message} detail={failure.detail} />}

      <DetailTable title="기본정보" rows={basic} />
      <DetailTable
        title={
          <span className="flex items-center gap-[6px]">
            사업자정보 {verified ? <Badge tone="on">인증완료</Badge> : <Badge tone="off">미인증</Badge>}
          </span>
        }
        rows={business}
      />

      <div className="flex flex-wrap items-center gap-[6px] border-t border-erp-panel-line pt-[16px]">
        <Button variant="off" onClick={onClose}>
          닫기
        </Button>
        <span className="flex-1" />
        {canDelete && (
          // 조건(사용 · 미사용 · 로그인 기록 없음 · 하위 관리자 0 · 등록 점포 0)을 못 채우면 흐리게 두고 이유를 말풍선으로(S-GZDODB)
          // api 의 이유 문장이 「…삭제할 수 없습니다」로 끝나므로 그대로 잇는다
          <Blocked reason={bp.deletion.isDeletable ? undefined : bp.deletion.reasons.join(" ")}>
            <Button variant="soft" onClick={() => setConfirm("delete")} disabled={!bp.deletion.isDeletable || busy}>
              삭제
            </Button>
          </Blocked>
        )}
        {canUpdate && (
          <Button aria-controls="bp-master-edit-panel" onClick={(e) => onEdit(e.currentTarget)} disabled={busy}>
            수정
          </Button>
        )}
        <HistoryButton bpCodeId={bp.bpCodeId} panelOpen={panelOpen} />
      </div>

      {canUpdate && (
        <>
          <ConfirmDialog
            open={confirm === "inactive"}
            title="BP를 미사용으로 바꾸시겠습니까?"
            confirmLabel="미사용으로 변경"
            confirmVariant="danger"
            wide
            busy={busy}
            onConfirm={() => handleStatus("INACTIVE")}
            onCancel={() => setConfirm(null)}
          >
            <div className="flex flex-col gap-[12px]">
              {who}
              {bp.subAdminCount > 0 ? (
                <p>
                  이 BP 의 관리자 계정 <b className="font-semibold">{bp.subAdminCount + 1}개</b>(BP 마스터 포함)가 모두 미사용이 됩니다. 점포
                  {` ${bp.storeCount.toLocaleString("ko-KR")}곳`}은 상태를 그대로 두고 업무만 멈춥니다.
                </p>
              ) : (
                <p>BP 마스터 계정이 미사용이 되어 로그인할 수 없습니다. 하위 관리자는 없습니다.</p>
              )}
              <p>운영 점포 · 구독 · 미정산 같은 선행 조건은 보지 않고 바로 적용합니다. 로그인 중인 세션은 끊지 않고 비밀번호도 그대로 둡니다.</p>
            </div>
          </ConfirmDialog>

          <ConfirmDialog
            open={confirm === "active"}
            title="BP를 사용으로 되돌리시겠습니까?"
            confirmLabel="사용으로 변경"
            wide
            busy={busy}
            onConfirm={() => handleStatus("ACTIVE")}
            onCancel={() => setConfirm(null)}
          >
            <div className="flex flex-col gap-[12px]">
              {who}
              <p>
                <b className="font-semibold">BP 마스터 계정만</b> 사용으로 바뀌어 기존 비밀번호로 다시 로그인할 수 있습니다. BP 관리자 · 가맹 관리자 계정은
                미사용으로 남고, BP 마스터가 BP 관리자 관리에서 하나씩 다시 켭니다.
              </p>
            </div>
          </ConfirmDialog>

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
              {who}
              <p>
                새 초기 비밀번호(12자 무작위)를 계정 이메일로만 보내며, 기존 비밀번호는 즉시 무효가 됩니다.
                <br />
                초기 비밀번호는 1시간 안에 로그인해야 하고, 로그인 때 비밀번호를 새로 정합니다. 현재 로그인 중인 세션은 유지됩니다.
              </p>
            </div>
          </ConfirmDialog>
        </>
      )}

      {canDelete && (
        <ConfirmDialog
          open={confirm === "delete"}
          title="BP 마스터 계정을 삭제하시겠습니까?"
          confirmLabel="삭제"
          confirmVariant="danger"
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        >
          <div className="flex flex-col gap-[12px]">
            {who}
            <p>
              계정과 이 계정이 대표하는 <b className="font-semibold">BP 정보가 함께 삭제</b>되고 되돌릴 수 없습니다.
            </p>
            <p>삭제한 뒤에도 아이디 {bp.loginId} 는 다시 쓸 수 없고, BP 코드 순번도 다시 쓰지 않습니다.</p>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
