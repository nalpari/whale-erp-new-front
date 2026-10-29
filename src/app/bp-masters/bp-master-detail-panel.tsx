"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode, type RefObject } from "react";
import { Button, ConfirmDialog, DetailTable, DetailValues, SlidePanel, useToast, type DetailRow } from "@/components/common";
import { usePagePermission } from "@/components/site/session-gate";
import { HeadValues } from "@/components/site/head-values";
import { BizVerifiedStatus } from "@/components/site/biz-verification-box";
import { SuccessBand, WarnBand } from "@/components/site/side-parts";
import type { BpMasterDetail } from "@/lib/bp-masters";
import { formatDateTime, formatPhone, wasUpdated, withinPasswordHour } from "@/lib/format";
import { formatBizNumber } from "@/lib/store-view";
import { Blocked, FailedBand, WhoList } from "../platform-admins/admin-parts";
import { changeBpMasterStatusAction, deleteBpMasterAction, resetBpMasterPasswordAction } from "./actions";
import { BpStatusBadge, unknownResult, WITHDRAWN_TEXT } from "./bp-master-parts";
import { HistoryButton } from "./history-dialog";
import { WithdrawalButton } from "./withdrawal-dialog";

// BP 마스터 계정 상세(S-GZDODB · 초기화 S-PRRLMA). 모두 읽기 전용이고, 기본정보 · 사업자정보를 나눠 보인다.
// 버튼 자리는 플랫폼 관리자 상세와 같다(BP-6) — [BP상태변경]은 기본정보 표 맨 위 「계정상태」 줄, 비밀번호 초기화는 비밀번호 줄의 버튼(수정 권한),
// 하단은 [닫기] … [삭제][수정][변경이력]. 탈퇴 BP 는 조회만 된다(상태 변경 · 초기화 · 삭제 · 수정 · 변경 이력 없음, 탈퇴 사유는 [사유 보기]).
// 화면은 미리 숨기거나 흐리게만 한다 — 막는 것은 api 다.

export function BpMasterDetailPanel({
  open,
  detail,
  onClose,
  onBackdropClose,
  trigger,
  onEdit,
  onDeleted,
}: {
  open: boolean;
  detail: { bp: BpMasterDetail } | { failed: string } | null;
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
  onClose,
  onEdit,
  onDeleted,
}: {
  bp: BpMasterDetail;
  /** 상세 패널이 열려 있는가 — 닫히면 이 안에서 띄운 팝업도 닫는다 */
  panelOpen: boolean;
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
  /** 이 상세에서 초기화 메일을 보냈다 — 로그인한 적이 있어도 하늘색 안내를 띄운다(등록 때와 같은 안내, 2026-10-28 사용자 지정) */
  const [resetSent, setResetSent] = useState(false);

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
      () => {
        toast("변경되었습니다."); // 토스트는 동작만 짧게 — 저장 · 수정 · 삭제 · 초기화와 같은 말투(2026-10-28 사용자 지정)
        setResetSent(false); // 상태를 바꾸면 방금 초기화 안내도 내린다 — 되돌린 BP 에는 띄우지 않는 규칙(리뷰로 찾음)
      },
    );

  const handleReset = () =>
    startBusy(async () => {
      const result = await resetBpMasterPasswordAction(bp.bpCodeId).catch(unknownResult("비밀번호 초기화"));
      setConfirm(null);
      if (!result.ok) return fail(result.status, result.message);
      // 결과는 등록 때와 같은 안내로 — 성공은 하늘색, 메일 실패는 빨간 상자(액션이 refresh 해 isInitialPasswordUnsent 가 켜진다). 따로 띠를 세우지 않는다(2026-10-28 사용자 지정)
      setFailure(null);
      setResetSent(result.isMailSent);
      if (result.isMailSent) toast("초기화되었습니다.");
    });

  const handleDelete = () => run(() => deleteBpMasterAction(bp.bpCodeId).catch(unknownResult("삭제")), onDeleted);

  const muted = (text: string) => <span className="text-erp-muted">{text}</span>;
  const gone = muted(WITHDRAWN_TEXT);
  // 미인증 BP 는 진위확인으로 채워지는 값(사업자번호 · 대표자명 · 개업일자 — 인증 일시는 제목 줄 「인증 완료 · 일시」)만 하이픈으로 보인다.
  // 대표자 연락처 · 이메일 · 주소는 인증 없이 입력하는 칸이라 입력한 값을 그대로 보인다(2026-10-28 사용자 지적 — 전엔 미인증이면 함께 가렸다, S-GZDODB)
  const verified = Boolean(bp.bizVerifiedAt);
  const unverified = (value: ReactNode) => (verified ? value : muted("-"));
  const address = [bp.bizZipCode, bp.bizAddress, bp.bizAddressDetail].filter((line): line is string => Boolean(line));
  // 등록 · 최종수정 값 — 「일시 · 사람」, 사람은 회색(플랫폼 관리자 상세와 같다, 2026-10-28 사용자 지정)
  const when = (at: string, who: string) => (
    <span className="truncate" title={`${formatDateTime(at)} · ${who}`}>
      {formatDateTime(at)} <span className="text-erp-label">· {who}</span>
    </span>
  );

  // 기본정보 표 맨 위 「계정상태」 줄의 버튼(2026-10-28 사용자 지정 — 잠시 기본정보 제목 줄 오른쪽이었다). 누를 버튼이 없으면 배지를 보인다.
  // 수정 권한이면 [BP상태변경](2026-10-28 사용자 지정 문구), 탈퇴 BP 는 [사유 보기](변경 이력을 보이지 않으니 탈퇴 사유를 여기서 본다, WHALEERP-626)
  const statusAction = canUpdate ? (
    <Button variant="soft" onClick={() => setConfirm(bp.accountStatus === "ACTIVE" ? "inactive" : "active")} disabled={busy}>
      BP상태변경
    </Button>
  ) : withdrawn && bp.withdrawal ? (
    <WithdrawalButton bp={bp} withdrawal={bp.withdrawal} panelOpen={panelOpen} />
  ) : undefined;

  const basic: DetailRow[] = [
    { label: "계정상태", value: statusAction ?? <BpStatusBadge status={bp.accountStatus} /> },
    // BP 코드 · 아이디는 머리 줄에 있어 표에서 뺐다(2026-10-28 사용자 지정)
    { label: "이름", value: withdrawn ? gone : bp.name },
    { label: "연락처", value: withdrawn ? gone : formatPhone(bp.phone) },
    { label: "이메일", value: withdrawn ? gone : bp.email },
    {
      label: "비밀번호",
      // 칸을 35:65 로 나눠 왼쪽 「[초기화]」(미발송은 머리 아래 빨간 상자로 옮겼다), 오른쪽 35% 자리에서(왼쪽 내용보다 좁아지지 않고, 구분선과 18px 띄운다) 「강제변경 대상 · 대상아님」(2026-10-28 사용자 지정 — 잠시 하위 줄 「└ 강제변경」이었다).
      // 미사용 · 탈퇴 BP 는 초기화 버튼을 숨긴다(플랫폼 관리자 상세와 같다, 2026-10-28 사용자 지정) — 화면에서만 숨긴다
      value: (
        <span className="grid w-full grid-cols-[minmax(max-content,7fr)_13fr] items-center gap-[18px]">
          <span className="flex min-w-0 items-center gap-[10px]">
            {bp.accountStatus === "ACTIVE" && canUpdate && (
              <Button variant="soft" onClick={() => setConfirm("reset")} disabled={busy}>
                초기화
              </Button>
            )}
            {/* 초기화 버튼이 없으면(미사용 · 탈퇴 · 수정 권한 없음) 빈칸 대신 「-」(2026-10-28 사용자 지정) */}
            {!(bp.accountStatus === "ACTIVE" && canUpdate) && muted("-")}
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
    { label: "대표자 연락처", value: withdrawn ? gone : formatPhone(bp.bizCeoPhone) },
    { label: "대표자 이메일", value: withdrawn ? gone : bp.bizCeoEmail },
    { label: "개업일자", value: unverified(bp.bizOpenDate) },
    {
      label: "사업자주소",
      multiline: address.length > 0,
      value: address.length ? (
        <div className="py-[2px]">
          {address.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      ) : null,
    },
    { label: "업태 · 종목", value: <DetailValues items={[bp.bizCategory ?? "", bp.bizItem ?? ""].filter(Boolean)} /> },
  ];



  // 안내 상자의 「[초기화] 버튼으로 …」는 그 버튼을 누를 수 있는 사람에게만 — 권한 없음 · 본인 계정은 앞 문장만(리뷰로 찾음)
  const canReset = canUpdate;
  return (
    <div className="flex flex-col gap-[16px]">
      {/* 머리: 첫 줄 상호명, 둘째 줄 「BP 코드 값 | 아이디 값 | 상태 배지」 — 플랫폼 관리자 상세와 같은 모양(2026-10-28 사용자 지정) */}
      {/* 패널을 내려도 머리(상호명 · BP 코드 · 아이디 · 상태)는 위에 고정 — 아래 내용만 스크롤(2026-10-28 사용자 지정).
          패널(aside, common/slide-panel.tsx 의 p-[24px] · gap-[16px])이 스크롤 상자라 sticky 로 붙인다 — 그 여백이 바뀌면 여기 음수 여백도 함께 고친다. sticky 기준선이 패널 안쪽 여백(24) 아래라 top 을 -24 로 당겨야 위 여백 틈으로 내용이 비치지 않는다. 위 · 아래 여백(패널 24 · 칸 간격 16)까지 흰 바탕으로 덮어 지나가는 내용을 가린다 */}
      {/* 라벨 칸을 두 줄이 같이 쓰는 grid — 「상호명」 · 「BP코드」 길이가 달라도 값이 같은 자리에서 시작한다(2026-10-28 사용자 지정, 「BP코드」 붙여 씀) */}
      <div className="sticky -top-[24px] z-[1] -mx-[24px] -mt-[24px] -mb-[16px] grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-[6px] gap-y-[6px] bg-white px-[24px] pt-[24px] pb-[16px] text-[14px]">
        <span className="text-erp-label">상호명</span>
        {/* 18px 한글은 글자 앞 여백이 14px 영문(BP…)보다 넓어 1px 뒤로 서 보인다 — 1px 당겨 맞춘다 */}
        <h2 className="-ml-px text-[18px] font-semibold break-all text-erp-ink">{bp.tradeName}</h2>
        <span className="text-erp-label">BP코드</span>
        <span>
          <HeadValues
            items={[{ value: <b className="font-semibold text-erp-ink">{bp.bpCode}</b> }, { label: "아이디", value: bp.loginId }, { value: <BpStatusBadge status={bp.accountStatus} /> }]}
          />
        </span>
      </div>
      {/* 방금 한 동작의 실패는 머리 바로 아래, 다른 안내 상자보다 위에(2026-10-28 사용자 지정) */}
      {failure && <FailedBand message={failure.message} detail={failure.detail} />}

      {/* 등록 · 초기화 메일이 실패한 사용 BP — 다시 보내는 길은 초기화뿐이다. 비밀번호 줄의 「초기 비밀번호 미발송」 대신 머리 아래 빨간 상자로(칸이 틀어지지 않게, 2026-10-28 사용자 지정).
          api isInitialPasswordUnsent 를 따르므로 초기화 메일이 나갈 때까지 상세를 열 때마다 보인다 */}
      {bp.accountStatus === "ACTIVE" && bp.isInitialPasswordUnsent && <WarnBand>{`초기화 비밀번호가 발송되지 않았습니다.${canReset ? "\n비밀번호 [초기화] 버튼을 눌러 다시 발송해주세요." : ""}`}</WarnBand>}
      {/* 메일이 나갔고 아직 한 번도 로그인하지 않은 사용 BP — 초기 비밀번호는 1시간만 유효해(api) 그 뒤 할 일을 함께 적는다. 첫 로그인하면 사라진다.
          직접 회원가입한 BP 는 초기화 비밀번호를 받은 적이 없어 띄우지 않는다(리뷰로 찾음). 미사용 → 사용으로 되돌린 BP(statusChangedAt 있음 — 상태를 바꿀 때만 찍힌다)는 그 사이 초기화 비밀번호가 만료돼 「발송했습니다」가 맞지 않아 띄우지 않는다(2026-10-28 사용자 지정) */}
      {bp.accountStatus === "ACTIVE" && !bp.isInitialPasswordUnsent && (resetSent || (bp.joinPath === "PLATFORM_REGISTERED" && !bp.lastLoginAt && !bp.statusChangedAt)) && (
        <SuccessBand>
          {/* 방금 이 화면에서 보냈거나 계정을 만든 지 1시간이 안 됐으면(만들 때 초기 비밀번호를 보낸다) 발송 안내, 아니면(한 번도 로그인하지 않은 계정) 로그인하지 않았다는 사실만 — 발송 시각을 api 가 주지 않아
            「1시간」은 방금 보냈을 때만 쓴다(2026-10-29 사용자 지정, 전엔 며칠 지나도 「발송했습니다」가 남았다) */}
          {resetSent || withinPasswordHour(bp.createdAt)
            ? "초기화 비밀번호를 발송했습니다.\n비밀번호는 1시간 동안 유효합니다."
            : `아직 로그인하지 않은 계정입니다.${canReset ? "\n비밀번호 초기화가 필요합니다." : ""}`}
        </SuccessBand>
      )}
      {/* 미사용 · 탈퇴 안내는 빨간 안내 상자(WarnBand — 2026-10-28 사용자 지정, 점포 BP 탈퇴 · 미사용 안내와 같다). 미사용은 두 줄로 줄였다(같은 날 사용자 지정) */}
      {bp.accountStatus === "INACTIVE" && (
        <WarnBand>
          {"미사용BP는 모든 관리자 계정이 로그인할 수 없습니다.\n점포 상태는 유지되고, 직원초대 · 계약 · 출퇴근 기능은 중지됩니다."}
        </WarnBand>
      )}
      {/* 탈퇴 안내는 한 줄(2026-10-28 사용자 지정 — 전엔 보존 · 막힌 동작 · 사유 보기 · 재등록까지 두 줄) */}
      {withdrawn && <WarnBand>탈퇴BP는 조회만 가능합니다.</WarnBand>}

      <DetailTable title="기본정보" rows={basic} />
      <DetailTable
        title={
          // 「인증 완료 · 일시」를 제목 줄 오른쪽에 — 아래 「최종 인증일시」 줄을 올렸다(수정 화면 인증 상자와 같은 자리 · 글, 2026-10-28 사용자 지정)
          <span className="flex w-full items-center justify-between gap-[6px]">
            사업자정보 <BizVerifiedStatus verified={verified} date={verified ? formatDateTime(bp.bizVerifiedAt) : ""} />
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
            title="BP상태를 미사용으로 바꾸시겠습니까?"
            confirmLabel="미사용으로 변경"
            confirmVariant="danger"
            wide
            busy={busy}
            onConfirm={() => handleStatus("INACTIVE")}
            onCancel={() => setConfirm(null)}
          >
            {/* 대상은 상호명 · 아이디 · 이름, 안내는 빨간 상자 두 줄 — 상세 미사용 안내와 같은 말투, 하위 관리자 계정도 함께 미사용이 된다는 것을 늘 적는다(2026-10-28 사용자 지정, 점포 수 · 세션 안내는 뺐다) */}
            <div className="flex flex-col gap-[12px]">
              <WhoList rows={[["상호명", bp.tradeName], ["아이디", bp.loginId], ["이름", bp.name ?? "-"]]} />
              <WarnBand>
                {"BP 마스터를 포함한 모든 관리자 계정은 [미사용]되어 로그인할 수 없습니다.\n점포 상태는 유지되고, 직원초대 · 계약 · 출퇴근 기능은 중지됩니다."}
              </WarnBand>
            </div>
          </ConfirmDialog>

          <ConfirmDialog
            open={confirm === "active"}
            title="BP상태를 사용으로 바꾸시겠습니까?"
            confirmLabel="사용으로 변경"
            wide
            busy={busy}
            onConfirm={() => handleStatus("ACTIVE")}
            onCancel={() => setConfirm(null)}
          >
            {/* 미사용으로 바꾸기와 같은 모양(2026-10-28 사용자 지정) */}
            <div className="flex flex-col gap-[12px]">
              <WhoList rows={[["상호명", bp.tradeName], ["아이디", bp.loginId], ["이름", bp.name ?? "-"]]} />
              <WarnBand>
                {"BP 마스터 계정만 사용으로 바뀌어 기존 비밀번호로 다시 로그인할 수 있습니다.\nBP 관리자 · 가맹 관리자 계정은 미사용으로 남습니다."}
              </WarnBand>
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
              <WhoList rows={[["아이디", bp.loginId], ["이름", bp.name ?? "-"], ["이메일", bp.email ?? "-"]]} />
              {/* 세 관리 화면 같은 문구 · 대상은 아이디 · 이름 · 이메일 각각(「아이디/이름」 한 줄은 라벨이 잘렸다)(2026-10-28 사용자 지정) */}
              {/* 안내는 빨간 안내 상자로 — 되돌릴 수 없는 동작이라 놓치지 않게(2026-10-28 사용자 지정) */}
              <WarnBand>{"비밀번호 초기화 시 새로운 비밀번호가 등록된 이메일로 발송됩니다.\n새 비밀번호는 1시간 동안 유효하며, 로그인 시 변경해야 합니다.\n기존 비밀번호는 즉시 사용할 수 없게 됩니다."}</WarnBand>
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
          {/* 대상은 상호명 · 아이디 · 이름, 안내는 빨간 안내 상자에 관리자 계정 삭제와 같은 문구 한 줄(2026-10-28 사용자 지정) */}
          <div className="flex flex-col gap-[12px]">
            <WhoList rows={[["상호명", bp.tradeName], ["아이디", bp.loginId], ["이름", bp.name ?? "-"]]} />
            <WarnBand>삭제한 계정은 BP 목록 및 검색 결과에서 제외되며, 해당 계정으로 더 이상 로그인할 수 없습니다.</WarnBand>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
