"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode, type RefObject } from "react";
import { Badge, Button, ConfirmDialog, DetailTable, DetailValues, SlidePanel, useToast, type DetailRow } from "@/components/common";
import { usePagePermission } from "@/components/site/session-gate";
import { HeadValues } from "@/components/site/head-values";
import { WarnBand } from "@/components/site/side-parts";
import type { BpMasterDetail, CreateBpMasterResult } from "@/lib/bp-masters";
import { formatDateTime, formatPhone, wasUpdated } from "@/lib/format";
import { formatBizNumber } from "@/lib/store-view";
import { Blocked, FailedBand, WhoList } from "../platform-admins/admin-parts";
import { NoticeBand } from "../stores/store-parts";
import { changeBpMasterStatusAction, deleteBpMasterAction, resetBpMasterPasswordAction } from "./actions";
import { BpStatusBadge, unknownResult, WITHDRAWN_TEXT } from "./bp-master-parts";
import { HistoryButton } from "./history-dialog";
import { WithdrawalButton } from "./withdrawal-dialog";

// BP 마스터 계정 상세(S-GZDODB · 초기화 S-PRRLMA). 모두 읽기 전용이고, 기본정보 · 사업자정보를 나눠 보인다.
// 버튼 자리는 플랫폼 관리자 상세와 같다(BP-6) — [BP 상태 변경]은 기본정보 제목 줄, 비밀번호 초기화는 그 줄의 버튼(수정 권한),
// 하단은 [닫기] … [삭제][수정][변경 이력]. 탈퇴 BP 는 조회만 된다(상태 변경 · 초기화 · 삭제 · 수정 · 변경 이력 없음, 탈퇴 사유는 [사유 보기]).
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
  // 등록 · 최종수정 값 — 「일시 · 사람」, 사람은 회색(플랫폼 관리자 상세와 같다, 2026-10-28 사용자 지정)
  const when = (at: string, who: string) => (
    <span className="truncate" title={`${formatDateTime(at)} · ${who}`}>
      {formatDateTime(at)} <span className="text-erp-label">· {who}</span>
    </span>
  );

  const basic: DetailRow[] = [
    // BP 코드 · 아이디는 머리 줄에 있어 표에서 뺐다(2026-10-28 사용자 지정)
    { label: "이름", value: withdrawn ? gone : bp.name },
    { label: "연락처", value: withdrawn ? gone : formatPhone(bp.phone) },
    { label: "이메일", value: withdrawn ? gone : bp.email },
    {
      label: "비밀번호",
      // 칸을 35:65 로 나눠 왼쪽 「[초기화] 초기 비밀번호 미발송」, 오른쪽 35% 자리에서(왼쪽 내용보다 좁아지지 않고, 구분선과 18px 띄운다) 「강제변경 대상 · 대상아님」(2026-10-28 사용자 지정 — 잠시 하위 줄 「└ 강제변경」이었다).
      // 미사용 · 탈퇴 BP 는 초기화 버튼 · 미발송 표시를 숨긴다(플랫폼 관리자 상세와 같다, 2026-10-28 사용자 지정) — 화면에서만 숨긴다
      value: (
        <span className="grid w-full grid-cols-[minmax(max-content,7fr)_13fr] items-center gap-[18px]">
          <span className="flex min-w-0 items-center gap-[10px]">
            {bp.accountStatus === "ACTIVE" && canUpdate && (
              <Button variant="soft" onClick={() => setConfirm("reset")} disabled={busy}>
                초기화
              </Button>
            )}
            {/* 등록 · 초기화 메일이 실패했다 — 다시 보내는 길은 초기화뿐이다 */}
            {bp.accountStatus === "ACTIVE" && bp.isInitialPasswordUnsent && <span className="truncate text-erp-off">초기 비밀번호 미발송</span>}
            {/* 초기화 버튼 · 미발송 표시가 모두 없으면(미사용 · 탈퇴 · 수정 권한 없음) 빈칸 대신 「-」(2026-10-28 사용자 지정) */}
            {!(bp.accountStatus === "ACTIVE" && (canUpdate || bp.isInitialPasswordUnsent)) && muted("-")}
          </span>
          {/* 앞에 머리 줄(HeadValues)과 같은 11px 세로 구분선 — #d9d9d9 는 Figma 값 구분선(DESIGN.md) */}
          <span className="flex min-w-0 items-center gap-[10px]">
            <span aria-hidden="true" className="h-[11px] w-px shrink-0 bg-[#d9d9d9]" />
            <span className="truncate">
              <span className="text-erp-label">강제변경</span> {bp.isPasswordChangeRequired ? "대상" : "대상아님"}
            </span>
          </span>
        </span>
      ),
    },
    // 소속점포는 수만 보인다(「N개」, 2026-10-28 사용자 지정 — 전엔 「소속 점포」 · 「N곳」) — 점포 목록 연결은 나중에(BP-8)
    { label: "소속점포", value: `${bp.storeCount.toLocaleString("ko-KR")}개` },
    // 아래 다섯 줄은 가입경로 · 약관동의 · 최근 로그인 · 등록 · 최종수정 순(강제변경은 비밀번호 줄로 옮겼다)(2026-10-28 사용자 지정)
    { label: "가입경로", value: bp.joinPath === "SIGNUP" ? "회원가입" : "플랫폼등록" },
    // 「첫 로그인 때 받음」은 아직 로그인하지 않은 BP 에만 붙인다
    { label: "약관동의", value: bp.termsAgreedAt ? "동의" : bp.lastLoginAt ? "미동의" : <>미동의 {muted("· 첫 로그인 때 받음")}</> },
    { label: "최근 로그인", value: bp.lastLoginAt ? formatDateTime(bp.lastLoginAt) : "-" },
    { label: "등록", value: when(bp.createdAt, bp.createdByName ?? bp.loginId) },
    // api 의 최종수정 일시는 BP 정보(bp_codes.updated_at) 것이다 — 수정 저장 · 상태 변경 때 바뀌고, 비밀번호 초기화처럼 계정만 고친 것은 들어가지 않는다(BP-7).
    // 등록할 때 같은 insert 로 수정 일시 · 수정자가 함께 채워지므로 1팀 공통 판정(wasUpdated — 1초 이상 차이)으로 고친 적이 있는지 본다
    { label: "최종수정", value: bp.updatedByName && wasUpdated(bp.createdAt, bp.updatedAt) ? when(bp.updatedAt, bp.updatedByName) : muted("-") },
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

  // 상태 줄은 없앴다 — 현재 상태는 머리 배지가, 버튼은 「기본정보」 제목 줄 오른쪽이 맡는다(2026-10-28 사용자 지정).
  // 수정 권한이면 [BP 상태 변경](2026-10-28 사용자 지정 문구), 탈퇴 BP 는 [사유 보기](변경 이력을 보이지 않으니 탈퇴 사유를 여기서 본다, WHALEERP-626)
  const statusAction = canUpdate ? (
    <Button variant="soft" onClick={() => setConfirm(bp.accountStatus === "ACTIVE" ? "inactive" : "active")} disabled={busy}>
      BP 상태 변경
    </Button>
  ) : withdrawn && bp.withdrawal ? (
    <WithdrawalButton bp={bp} withdrawal={bp.withdrawal} panelOpen={panelOpen} />
  ) : undefined;

  const who = <WhoList rows={[["BP", `${bp.tradeName} · ${bp.bpCode}`], ["계정", bp.loginId]]} />;

  return (
    <div className="flex flex-col gap-[16px]">
      {/* 머리: 첫 줄 상호명, 둘째 줄 「BP 코드 값 | 아이디 값 | 상태 배지」 — 플랫폼 관리자 상세와 같은 모양(2026-10-28 사용자 지정) */}
      <div className="flex flex-col gap-[6px]">
        <h2 className="text-[18px] font-semibold break-all text-erp-ink">{bp.tradeName}</h2>
        <span className="text-[14px]">
          <HeadValues items={[{ label: "BP 코드", value: bp.bpCode }, { label: "아이디", value: bp.loginId }, { value: <BpStatusBadge status={bp.accountStatus} /> }]} />
        </span>
      </div>

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
      {/* 미사용 · 탈퇴 안내는 빨간 안내 상자(WarnBand — 2026-10-28 사용자 지정, 점포 BP 탈퇴 · 미사용 안내와 같다). 미사용은 두 줄로 줄였다(같은 날 사용자 지정) */}
      {bp.accountStatus === "INACTIVE" && (
        <WarnBand>
          {"미사용BP는 모든 관리자 계정이 로그인할 수 없습니다.\n점포 상태는 유지되고, 직원 초대 · 근로계약 · 출퇴근 기능은 중지됩니다."}
        </WarnBand>
      )}
      {/* 탈퇴 안내는 한 줄(2026-10-28 사용자 지정 — 전엔 보존 · 막힌 동작 · 사유 보기 · 재등록까지 두 줄) */}
      {withdrawn && <WarnBand>탈퇴BP는 조회만 가능합니다.</WarnBand>}
      {failure && <FailedBand message={failure.message} detail={failure.detail} />}

      <DetailTable title="기본정보" action={statusAction} rows={basic} />
      <DetailTable
        title={
          <span className="flex items-center gap-[6px]">
            사업자정보 {verified ? <Badge tone="on">인증완료</Badge> : <Badge tone="off">미인증</Badge>}
          </span>
        }
        rows={business}
      />

      <div className="flex flex-wrap items-center gap-[6px]">
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
        {/* 탈퇴 BP 의 이력에는 탈퇴로 지운 개인정보의 예전 값이 남아 있어 보이지 않게 한다 — api 도 409 로 거절한다(WHALEERP-625) */}
        {!withdrawn && <HistoryButton bpCodeId={bp.bpCodeId} panelOpen={panelOpen} />}
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
                  이 BP의 관리자 계정 <b className="font-semibold">{bp.subAdminCount + 1}개</b>(BP 마스터 포함)가 모두 미사용이 되어 로그인할 수 없습니다.
                </p>
              ) : (
                <p>BP 마스터 계정이 미사용이 되어 로그인할 수 없습니다.</p>
              )}
              <p>
                점포 <b className="font-semibold">{bp.storeCount.toLocaleString("ko-KR")}곳</b>은 상태를 그대로 두고 직원 초대 · 근로계약 · 출퇴근 기록 등
                업무만 멈춥니다.
              </p>
              <p>확인하면 바로 적용됩니다. 로그인 중인 세션과 비밀번호는 그대로 유지됩니다.</p>
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
                <b className="font-semibold">BP 마스터 계정만</b> 사용으로 바뀌어 기존 비밀번호로 다시 로그인할 수 있습니다.
              </p>
              <p>BP 관리자 · 가맹 관리자 계정은 미사용으로 남습니다. BP 마스터가 BP 관리자 관리에서 다시 켜야 합니다.</p>
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
            <p>해당 아이디 {bp.loginId}, BP 코드도 다시 사용하지 못합니다.</p>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
