"use client";

import { unstable_rethrow } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type MouseEvent, type RefObject } from "react";
import { logoutAfterWithdrawal } from "@/app/actions";
import { ClosingCheckList, ClosingCondition } from "@/app/stores/store-closing-parts";
import { Blocked, Button, ConfirmDialog, DataTable, FailedBand, Field, FieldMessage, FormGroup, GuideNote, PasswordInput, Select, SlidePanel, Textarea, useAction } from "@/components/common";
import {
  blockedStoresOf,
  moveTargetOf,
  openCheckInConditionText,
  withdrawBlockedReason,
  withdrawFormField,
  withdrawPayslipText,
  withdrawWarningText,
  type WithdrawEligibility,
  type WithdrawWarningBlock,
} from "@/lib/withdrawal-form";
import { signOut } from "@/lib/sign-out";
import { useCanOpen, useCodes, useCurrentBp, useStores } from "./session-gate";
import { createWithdrawalAction, getWithdrawEligibilityAction, verifyWithdrawPasswordAction, type EligibilityResult } from "./withdraw-actions";

type Step = "password" | "content" | "done";
type Form = { currentPassword: string; reasonCode: string; reasonDetail: string };
const EMPTY: Form = { currentPassword: "", reasonCode: "", reasonDetail: "" };

type FieldAt = "currentPassword" | "reasonDetail";

// withdrawal-form.ts 의 withdrawWarningText 가 실제 값(BP 이름 · 관리자 수 · 점포 수) 자리를 `**...**` 로
// 감싸 둔다(그 파일은 React 를 안 쓴다) — 여기서 갈라 데모의 live()(굵게)와 같은 모양으로 그린다.
function withEmphasis(text: string) {
  return text.split("**").map((part, i) => (i % 2 === 1 ? <b key={i} className="font-semibold">{part}</b> : part));
}

// 경고 상자 — bp-apply-dialog.tsx 의 위험 띠(채도 높은 border-erp-off/bg-erp-off-bg)와는 다른 패턴이다. 이
// 상자는 승인된 데모의 notice() 상자를 그대로 따른다(docs/demo/src/site.mjs 의 withdrawBody 안 notice()) — 제목("탈퇴 전 꼭
// 확인해 주세요")과 본문 블록이 한 상자(border-erp-panel-line / bg-erp-thead-bg) 안에 함께 들어간다. 제목만
// #e93737(DESIGN.md 가 토큰 없이 직접 쓰기로 둔 Figma 전용 색). 블록은 head 를 굵게, text(있을 때)는 \n 을 그대로
// 줄바꿈으로 보이고(whitespace-pre-line), link 가 있으면 그 아래 이동 버튼(MoveButton)을 둔다. closing 이면 폐점 시 함께
// 처리될 것(점포 전체 합계)을 점포 관리 폐점 확인 창과 같은 목록으로 붙인다. 문자열 블록은 지금 withdrawWarningText 가
// 만들지 않는다(타입에만 남아 있다).
function WarningBlock({ block, closing, onNavigate }: { block: WithdrawWarningBlock; closing: WithdrawEligibility["closing"]; onNavigate: () => void }) {
  if (typeof block === "string") return <p className="whitespace-pre-line">{withEmphasis(block)}</p>;
  return (
    <div>
      <p className="flex items-center gap-[6px] font-semibold">
        <span aria-hidden className="inline-block size-[6px] shrink-0 rounded-full bg-erp-ink" />
        {/* 한 덩어리로 감싼다 — flex 줄에 글자와 <b> 가 따로 놓이면 칸마다 끊겨 「점포 / 27개 / 가」로 보였다 */}
        <span>{withEmphasis(block.head)}</span>
      </p>
      {block.text && <p className="whitespace-pre-line">{withEmphasis(block.text)}</p>}
      {block.closing && <ClosingCheckList counts={closing.total} payslipText={withdrawPayslipText} />}
      {block.link && (
        <div className="mt-[10px]">
          <MoveButton href={block.link.href} label={block.link.label} onNavigate={onNavigate} />
        </div>
      )}
    </div>
  );
}

// 탈퇴 전에 할 일을 하는 화면으로 보내는 이동 버튼(outline — 호버 모양을 기본으로, DESIGN.md 「링크 버튼」 — 생김새는 버튼, 하는 일은 이동).
// 글자 링크는 누를 곳으로 잘 안 보였다(2026-10-30 사용자 지정). 이 계정이 열 수 없는 화면이면(권한 그룹에서 그 메뉴 조회가 꺼짐) 숨긴다.
// 판정 경로 · 실제 주소(탭 BP 주소)는 moveTargetOf 가 만든다. 누르면 패널을 닫는다(헤더에 붙은 패널이라 이동해도 열린 채 남는다).
// 새 탭으로 여는 클릭(Ctrl/⌘ · Shift)은 닫지 않는다 — 돌아와 탈퇴를 이어 갈 수 있게. 가운데 버튼은 click 이 오지 않아 원래 닫히지 않는다.
function MoveButton({ href, label, onNavigate }: { href: string; label: string; onNavigate: () => void }) {
  const target = moveTargetOf(href, useCurrentBp().bpCodeId);
  if (!useCanOpen(target.menuPath)) return null;
  return (
    <Button
      variant="outline"
      href={target.href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        if (!(e.metaKey || e.ctrlKey || e.shiftKey)) onNavigate();
      }}
    >
      {label}
    </Button>
  );
}

// DataTable 한 칸(값)에 들어간다(가로 표로 바꿈, 사용자 지정, 2026-10-27 — 스크린샷으로 받은 "제목 칼럼 +
// 값 한 줄" 모양을 그대로 따른다, 이 저장소에서 한 건을 세로로 펼치는 DetailTable 과는 다른 자리다). 아이콘·
// 설명문 대신 값 색으로만 상태를 말한다. checked 가 null 이면 1차 범위 밖(확인하지 않음)이라 값도 중립색이다.
function ConditionValue({ value, checked }: { value: string; checked: boolean | null }) {
  const tone = checked === null ? "text-erp-label" : checked ? "text-erp-link" : "text-erp-off";
  return <span className={`font-semibold ${tone}`}>{value}</span>;
}

/** GNB 「회원 탈퇴」가 여는 슬라이드 패널(마이페이지, S-JHQQNR). 1단계(비밀번호)는 api(POST /auth/admin/me/password-verifications)로
 * 확인해 맞아야 2단계로 간다 — 전엔 확인 없이 넘겨 틀린 비밀번호로도 탈퇴 화면이 보였다(2026-10-29 재영). 최종 제출(POST
 * /auth/admin/me/withdraw)도 비밀번호를 다시 본다. 2단계(내용)에 들어가기 전부터 eligibility 를 미리 불러 둬 2단계 전환이 기다리지
 * 않게 한다. 성공하면 비밀번호 변경과 같은 패턴으로 패널을 닫지 않고 완료 화면으로 바꾼 뒤, 로그아웃은
 * 사용자가 "확인"을 눌러야 일어난다 — 탈퇴 안내 이메일을 보냈다는 문구를 반드시 보게 한다. */
export function WithdrawPanel({ id, open, onClose, trigger }: { id: string; open: boolean; onClose: () => void; trigger: RefObject<HTMLElement | null> }) {
  const ids = useId();
  const getWithdrawEligibility = useAction(getWithdrawEligibilityAction, { overlay: false });
  const verifyWithdrawPassword = useAction(verifyWithdrawPasswordAction, { overlay: false });
  const createWithdrawal = useAction(createWithdrawalAction, { overlay: false });
  // BP 마스터의 관리 점포는 BP 전체 점포다. 직영이 아닌 점포가 있을 때만 가맹마스터 안내 줄을 둔다(모르는 유형도 가맹으로 본다 — api 와 같다)
  const hasFranchiseStore = useStores().some((s) => s.storeTypeCode !== "DIRECT");
  const [step, setStep] = useState<Step>("password");
  const [form, setForm] = useState<Form>(EMPTY);
  const [eligibility, setEligibility] = useState<WithdrawEligibility | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ at: FieldAt; message: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 「폐점할 수 없는 점포」 선택 상자에서 고른 점포. 없거나 목록에 없으면(다시 받은 조건에서 풀림) 첫 막힌 점포를 보인다
  const [blockedStoreId, setBlockedStoreId] = useState<number | null>(null);
  const [saving, startSaving] = useTransition();
  const [verifying, startVerifying] = useTransition();
  // 탈퇴 사유는 공통코드 WITHDRAW_REASON(플랫폼고정)의 사용 중인 값을 표시 순서대로 쓴다(S-JHQQNR · S-DHBTXZ)
  const reasons = useCodes("WITHDRAW_REASON");
  // password-change-panel.tsx 의 saveNumber 와 같은 패턴 — 패널을 닫았다 다시 열면 지난 요청의 응답이 늦게
  // 와도 새 세션에 적용되지 않게 막는다.
  const saveNumber = useRef(0);

  const [openedFor, setOpenedFor] = useState(open);
  const [fieldGeneration, setFieldGeneration] = useState(0);
  if (open !== openedFor) {
    setOpenedFor(open);
    setStep("password");
    setForm(EMPTY);
    setEligibility(null);
    setLoadError(null);
    setFieldError(null);
    setFailure(null);
    setConfirmOpen(false);
    setBlockedStoreId(null);
    setFieldGeneration((g) => g + 1);
  }

  // 열릴 때마다 eligibility 를 미리 받아 둔다 — 2단계는 비밀번호 칸을 지난 뒤에야 보이지만, 그 전환이
  // 기다리지 않도록 1단계에 있는 동안 백그라운드로 불러 둔다. saveNumber 로 지난 세션의 응답을 거른다.
  // 저장이 폐점에 막혀(409) 다시 받을 때는 keepCurrent — 실패해도 지난 조건과 409 문구를 그대로 둔다(탈퇴가 되돌려진 것을 이미 안다).
  const loadEligibility = async (mine: number, keepCurrent = false) => {
    let result: EligibilityResult;
    try {
      result = await getWithdrawEligibility();
    } catch (error: unknown) {
      unstable_rethrow(error);
      console.error("탈퇴 조건 조회 요청 실패", error);
      result = { ok: false, message: "탈퇴 조건을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." };
    }
    if (mine !== saveNumber.current) return;
    if (result.ok) setEligibility(result.data);
    else if (!keepCurrent) setLoadError(result.message);
  };
  useEffect(() => {
    if (!open) return;
    saveNumber.current++;
    void loadEligibility(saveNumber.current);
  }, [open]);

  // useCodes 는 그룹이 없으면 개발 중에만 경고한다 — 탈퇴를 막는 일이라 운영에서도 남긴다
  useEffect(() => {
    if (open && reasons.length === 0) console.error("탈퇴 사유 공통코드(WITHDRAW_REASON)가 비어 있습니다");
  }, [open, reasons.length]);

  const blockedStores = eligibility ? blockedStoresOf(eligibility) : [];
  const blockedStore = blockedStores.find((store) => store.storeId === blockedStoreId) ?? blockedStores[0];

  const doneHeadingId = `${ids}-done`;
  useEffect(() => {
    if (step === "done") requestAnimationFrame(() => document.getElementById(doneHeadingId)?.focus());
  }, [step, doneHeadingId]);

  const currentPasswordMessageId = `${ids}-currentPassword`;
  const reasonDetailMessageId = `${ids}-reasonDetail`;

  // password-change-panel.tsx 의 handleClose 와 같은 이유 — 저장 중이거나 확인창이 떠 있을 때 닫으면
  // 제출 결과(성공한 완료 화면, 실패한 오류 문구)를 아무도 못 본다. done 단계에서는 이미 api 에서 탈퇴
  // 처리가 끝난 뒤라 — Esc·바탕 클릭·"확인" 중 무엇으로 나가든 로그아웃을 거치게 한다. 그냥 onClose 로
  // 닫으면 서버는 탈퇴 상태인데 이 브라우저의 세션 쿠키만 남아, 갱신 토큰이 만료(최대 1시간)되기 전까지
  // 어긋난 상태로 남는다(최종 리뷰로 찾음).
  const handleClose = () => {
    if (saving || confirmOpen) return;
    if (step === "done") {
      void signOut(logoutAfterWithdrawal);
      return;
    }
    onClose();
  };

  // 1단계 [확인] — 비밀번호가 맞아야 탈퇴 화면으로 간다(S-JHQQNR, 2026-10-29 재영). 최종 제출에서도 api 가 한 번 더 본다.
  const handleVerify = () => {
    setFieldError(null);
    setFailure(null);
    const mine = saveNumber.current;
    startVerifying(async () => {
      try {
        const result = await verifyWithdrawPassword(form.currentPassword);
        if (mine !== saveNumber.current) return;
        if (result.ok) return setStep("content");
        // 1단계라 아직 탈퇴 전이다 — 로그인 만료는 useAction 팝업이 맡는다
        if (result.status === 400) return setFieldError({ at: "currentPassword", message: result.message });
        setFailure(result.message);
      } catch (error: unknown) {
        // 서버 액션 요청 자체가 실패한 경우(연결 끊김 · 배포 뒤 액션을 못 찾음) — handleConfirm 과 같이 띠로 알린다
        if (mine !== saveNumber.current) return;
        console.error("탈퇴 비밀번호 확인 요청 실패", error);
        setFailure("비밀번호를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  };

  const handleConfirm = () => {
    setFieldError(null);
    setFailure(null);
    const mine = saveNumber.current;
    startSaving(async () => {
      try {
        const result = await createWithdrawal({
          currentPassword: form.currentPassword,
          reasonCode: form.reasonCode,
          reasonDetail: form.reasonCode === "WD_INPUT" ? form.reasonDetail : undefined,
        });
        if (mine !== saveNumber.current) return; // 그사이 패널을 닫았다 다시 열었다 — 지난 응답은 버린다
        setConfirmOpen(false);
        if (!result.ok) {
          // 401(로그인 만료 — 탈퇴를 마치고 응답만 잃은 재시도도 여기)은 useAction 이 「로그인 만료」 팝업으로 맡아 여기까지 오지 않는다
          const field = withdrawFormField(result.status, result.message);
          if (field === "currentPassword") {
            setStep("password");
            setFieldError({ at: "currentPassword", message: result.message });
            return;
          }
          if (field === "reasonDetail") {
            setFieldError({ at: "reasonDetail", message: result.message });
            return;
          }
          setFailure(result.message); // 특정 칸을 가리킬 수 없는 거절 — content 단계에 남긴다
          // 폐점이 막았다(확인 뒤 생긴 퇴근 기록 없는 출근 등) — 조건을 다시 받아 막힌 점포를 보인다
          if (result.status === 409) await loadEligibility(mine, true);
          return;
        }
        setForm(EMPTY);
        setStep("done");
      } catch (error: unknown) {
        unstable_rethrow(error); // Next 의 이동 신호(redirect 등)는 실패 띠 없이 그대로 넘긴다
        if (mine !== saveNumber.current) return;
        console.error("회원 탈퇴 처리 실패", error);
        setConfirmOpen(false);
        setFailure("회원 탈퇴 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  };

  return (
    <SlidePanel id={id} open={open} onClose={handleClose} label="회원 탈퇴" trigger={trigger} closeOnBackdrop>
      <h2 className="text-[18px] font-semibold text-erp-ink">회원 탈퇴</h2>

      {step === "password" && (
        <>
          {/* 데모의 panel-mode 비밀번호 단계(docs/demo/src/site.mjs:400)와 같은 안내 문구 — FormGroup 으로
           * 올리면서 지웠던 것을 최종 리뷰로 되살렸다. */}
          <p className="text-[14px] text-erp-ink">회원 탈퇴를 하려면 현재 비밀번호를 입력해 주세요.</p>
{/* 비밀번호 칸을 제 form 안에 둔다 — 이 패널은 닫혀도 마운트돼 있어, form 이 없으면 크롬이 화면의 다른 글자 칸(필터 검색칸)을 아이디 칸으로 보고
              로그인 아이디를 채웠다(2026-11-06 사용자 제보). Enter 로 보내지는 않는다 — 저장은 아래 버튼이 한다 */}
          <form onSubmit={(e) => e.preventDefault()}>
          <FormGroup title="본인 확인">
            <div className="flex flex-col gap-[8px]">
              <Field label="현재 비밀번호" required>
                <PasswordInput
                  key={fieldGeneration}
                  fieldLabel="현재 비밀번호"
                  autoComplete="current-password"
                  placeholder="지금 쓰고 있는 비밀번호를 입력해 주세요."
                  maxLength={100}
                  value={form.currentPassword}
                  onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  // Enter 는 [확인]과 같다 — 버튼이 막힌 조건(빈 칸 · 확인 중)도 같게 본다
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing && form.currentPassword && !verifying) {
                      e.preventDefault();
                      handleVerify();
                    }
                  }}
                  aria-invalid={fieldError?.at === "currentPassword" ? true : undefined}
                  aria-describedby={fieldError?.at === "currentPassword" ? currentPasswordMessageId : undefined}
                  aria-required
                />
              </Field>
              <FieldMessage id={currentPasswordMessageId} message={fieldError?.at === "currentPassword" ? fieldError.message : undefined} />
            </div>
          </FormGroup>
          </form>

          {failure && <FailedBand message={failure} />}

          <div className="flex justify-center gap-[6px]">
            <Button variant="off" onClick={handleClose}>
              닫기
            </Button>
            <Button onClick={handleVerify} disabled={!form.currentPassword || verifying}>
              확인
            </Button>
          </div>
        </>
      )}

      {step === "content" && (
        <>
          {loadError ? (
            <>
              <FailedBand message={loadError} />
              <div className="flex justify-center gap-[6px]">
                <Button variant="off" onClick={handleClose}>
                  닫기
                </Button>
              </div>
            </>
          ) : !eligibility ? (
            <>
              <p className="py-[36px] text-center text-[14px] text-erp-muted">불러오는 중입니다.</p>
              <div className="flex justify-center gap-[6px]">
                <Button variant="off" onClick={handleClose}>
                  닫기
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-[12px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg px-[16px] py-[14px] text-[14px] leading-[1.6]">
                <p className="font-semibold text-[#e93737]">탈퇴 전 꼭 확인해 주세요.</p>
                {withdrawWarningText(eligibility, hasFranchiseStore).map((block, i) => (
                  <WarningBlock key={i} block={block} closing={eligibility.closing} onNavigate={handleClose} />
                ))}
              </div>

              {/* DataTable 에는 title 이 없어 FormGroup 과 같은 제목 글자만 따로 둔다(가로 표로 바꾸며 제목이
               * 빠졌던 것을 코드리뷰로 찾음, 2026-10-27) — 화면읽기 도구도 이 h3 를 표 앞 landmark 로 읽는다. */}
              <div className="flex flex-col gap-[10px]">
                <h3 className="text-[15px] font-semibold text-erp-ink">탈퇴 조건</h3>
                <DataTable
                  columns={[
                    { header: "부가서비스 구독", cell: () => <ConditionValue value="-" checked={null} /> },
                    { header: "미정산 금액", cell: () => <ConditionValue value="-" checked={null} /> },
                    {
                      header: "퇴근 기록 없는 출근",
                      cell: (e) => <ConditionValue value={openCheckInConditionText(e)} checked={blockedStores.length ? false : null} />,
                    },
                  ]}
                  rows={[eligibility]}
                  rowKey={() => "conditions"}
                />
              </div>

              {/* 막힌 점포를 골라 사유를 본다 — 점포 관리 폐점 조건과 같은 부품(2026-11-05 사용자 지정). 함께 처리될 것은 위 경고 상자의
               * 합계만 둔다 — 점포별로 또 보이면 빨간 상자가 두 번 나왔다(2026-11-09 사용자 지정). 막는 조건은 퇴근 기록이 없는 출근
               * 하나라 건수만 보인다(api 가 직원 이름 · 시각을 주지 않는다). */}
              {blockedStore && (
                <div className="flex flex-col gap-[10px]">
                  <Field label={`폐점할 수 없는 점포 (${blockedStores.length.toLocaleString("ko-KR")})`}>
                    <Select value={String(blockedStore.storeId)} onChange={(e) => setBlockedStoreId(Number(e.target.value))}>
                      {blockedStores.map((store) => (
                        <option key={store.storeId} value={store.storeId}>
                          {store.storeName} ({store.storeCode})
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div className="text-[14px] leading-[1.6] text-erp-ink">
                    <ClosingCondition counts={blockedStore} />
                  </div>
                  {/* 본사에게 가려진 출근은 BP 마스터가 출퇴근 현황에서도 찾을 수 없다 — 그 출근이 있는 점포에만 누가 볼 수 있는지 알린다(2026-11-09 사용자 지정) */}
                  {blockedStore.openCheckIns.hiddenCount > 0 && <GuideNote>가맹점포 출근이 포함되어 있습니다. 해당 점포의 가맹마스터에게 요청해 주세요.</GuideNote>}
                </div>
              )}

              <div className="flex flex-col gap-[18px]">
                <div className="flex flex-col gap-[8px]">
                  <Field label="탈퇴 사유" required>
                    <Select
                      value={form.reasonCode}
                      onChange={(e) => setForm((f) => ({ ...f, reasonCode: e.target.value }))}
                      aria-required
                    >
                      <option value="">탈퇴 사유를 선택하세요</option>
                      {reasons.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  {/* 사유가 비면 고를 수 없어 탈퇴가 이유 없이 막힌다 — 공통코드가 빠졌거나 모두 미사용인 경우 */}
                  {reasons.length === 0 && <FailedBand message="탈퇴 사유를 불러오지 못했습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요." />}
                </div>
                {form.reasonCode === "WD_INPUT" && (
                  <div className="flex flex-col gap-[8px]">
                    <Field label="상세 사유" required>
                      <Textarea
                        rows={4}
                        maxLength={500}
                        value={form.reasonDetail}
                        onChange={(e) => setForm((f) => ({ ...f, reasonDetail: e.target.value }))}
                        aria-invalid={fieldError?.at === "reasonDetail" ? true : undefined}
                        aria-describedby={fieldError?.at === "reasonDetail" ? reasonDetailMessageId : undefined}
                        aria-required
                      />
                    </Field>
                    <FieldMessage id={reasonDetailMessageId} message={fieldError?.at === "reasonDetail" ? fieldError.message : undefined} />
                  </div>
                )}
              </div>

              {failure && <FailedBand message={failure} />}

              <div className="flex justify-center gap-[6px]">
                <Button variant="off" onClick={handleClose}>
                  닫기
                </Button>
                {/* 기본색(primary)이다 — 데모 · 목업과 같다(2026-10-30 사용자 지정, 전엔 danger) */}
                <Blocked reason={withdrawBlockedReason(eligibility)} floating>
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={saving || blockedStores.length > 0 || !form.reasonCode || (form.reasonCode === "WD_INPUT" && !form.reasonDetail.trim())}
                  >
                    회원 탈퇴
                  </Button>
                </Blocked>
              </div>
            </>
          )}
        </>
      )}

      {step === "done" && (
        <>
          <div className="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center">
            <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" className="mb-[12px]">
              <circle cx="28" cy="28" r="28" className="fill-erp-on-bg" />
              <path d="M17 28.5l7.5 7.5L39.5 21" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-erp-on" />
            </svg>
            <p id={doneHeadingId} tabIndex={-1} className="text-[16px] font-semibold text-erp-ink outline-none!">
              회원 탈퇴가 완료되었습니다.
            </p>
            <p className="text-[14px] text-erp-muted">
              그동안 서비스를 이용해 주셔서 감사합니다.
              <br />
              회원 탈퇴 완료 안내 메일이 등록된 이메일로 발송되었습니다.
            </p>
          </div>
          {/* admin-header.tsx 의 UserPop 로그아웃 항목과 같이 signOut 으로 부르지만(실패하면 팝업), 탈퇴 뒤라 logoutAfterWithdrawal(→ /)을 부른다. */}
          <div className="flex justify-center gap-[6px]">
            <Button onClick={() => void signOut(logoutAfterWithdrawal)}>확인</Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="회원 탈퇴"
        confirmLabel="회원 탈퇴"
        busy={saving}
        onConfirm={handleConfirm}
        onCancel={() => {
          if (!saving) setConfirmOpen(false);
        }}
      >
        <p>회원 탈퇴를 진행합니다.</p>
        <p className="text-erp-muted">
          그동안 웨일ERP를 이용해 주셔서 감사합니다.
          <br />
          언제든 필요할 때 다시 찾아주세요.
        </p>
      </ConfirmDialog>
    </SlidePanel>
  );
}
