"use client";

import { useEffect, useRef, useState } from "react";
import { ConfirmDialog, DateField, useAction, useToast, GuideBand } from "@/components/common";
import { checkRetiredDate, isSettledNow, retiredDateHint, reloadsPreview, showsBelowDateField, todayAfterSubmit } from "@/lib/retirement";
import type { RetirementPreview } from "@/lib/staff-members";
import { cancelRetirementAction, changeRetirementDateAction, previewRetirementAction, retireAction } from "./actions";
import { useFailure } from "./use-action-failure";

// 퇴직 처리 · 퇴직일 변경 확인창과 퇴직 처리 취소 확인창(WHALEERP-585). 문구와 배치는 목업 docs/mockup/staff/detail.html ·
// 데모 detail.mjs 의 확인창이다. 「종료되는 근로계약」은 목업의 발송 대기 · 서명 대기에 임시저장을 더했다 — api 가 셋을 닫는다(2026-10-12 재영).

/** YYYY-MM-DD 다음 날 */
function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

type Preview = { status: "idle" } | { status: "loading" } | { status: "ok"; date: string; value: RetirementPreview } | { status: "error"; message: string };

/**
 * 퇴직 처리(mode retire) · 퇴직일 변경(mode change). 열릴 때만 그린다 — 닫으면 날짜 · 미리 보기가 처음으로 돌아간다.
 * 퇴직일을 바꿀 때마다 미리 보기를 다시 받고, 그 날짜의 미리 보기가 있어야 확인 버튼이 열린다(api 가 거절할 날짜를 막는다).
 */
export function RetirementDialog({
  staffMemberId,
  mode,
  currentDate,
  hiredDate,
  today: initialToday,
  onClose,
}: {
  staffMemberId: number;
  mode: "retire" | "change";
  /** 퇴직일 변경일 때 지금 퇴직일 */
  currentDate: string | null;
  /** 입사일 — 3개월 전보다 늦으면 안내 · 검사가 입사일부터다 */
  hiredDate: string | null;
  /** 화면을 그릴 때 서버의 오늘(KST). 그 뒤로는 서버 액션이 날짜 바뀜으로 막으며 돌려준 오늘로만 바뀐다(todayAfterSubmit). */
  today: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const onFailure = useFailure();
  const previewRetirement = useAction(previewRetirementAction, { overlay: false });
  const retire = useAction(retireAction, { overlay: false });
  const changeRetirementDate = useAction(changeRetirementDateAction, { overlay: false });
  const [today, setToday] = useState(initialToday);
  const [date, setDate] = useState(currentDate ?? initialToday);
  // 날짜가 틀리면 미리 보기를 받지 않는다(idle) — 틀린 이유는 날짜 칸 아래에 둔다(재영 공지 2026-10-29).
  const [preview, setPreview] = useState<Preview>(() => (checkRetiredDate(date, today) ? { status: "idle" } : { status: "loading" }));
  // api 가 퇴직일 입력으로 거절한 400(3개월 범위 · 입사일보다 앞섬 등). 날짜를 고치면 지운다.
  const [serverDateError, setServerDateError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // 날짜를 빠르게 바꾸면 앞의 응답이 늦게 올 수 있다 — 마지막 요청의 응답만 쓴다.
  const seq = useRef(0);
  // 지금 칸의 날짜. 저장 응답이 올 때 보낸 날짜와 같은지 본다 — 그 사이 날짜를 바꿨으면 이전 날짜의 400 을 새 날짜에 붙이지 않는다.
  const dateRef = useRef(date);

  /** 미리 보기를 받아 그 응답이 마지막 요청일 때만 담는다. 상태는 응답을 받은 뒤에만 바꾼다. */
  const fetchPreview = (value: string) => {
    const n = ++seq.current;
    previewRetirement(staffMemberId, value)
      .then((result) => {
        if (n !== seq.current) return;
        if (result.ok) return setPreview({ status: "ok", date: value, value: result.preview });
        if (showsBelowDateField(result)) {
          setServerDateError(result.message);
          return setPreview({ status: "idle" });
        }
        const message = onFailure(result);
        if (message) setPreview({ status: "error", message });
      })
      .catch((error: unknown) => {
        console.error("퇴직 미리 보기 실패", error);
        if (n === seq.current) setPreview({ status: "error", message: "미리 보기를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요." });
      });
  };

  // 처음 열릴 때 기본 날짜의 미리 보기. 그 뒤로는 날짜를 바꿀 때 부른다.
  useEffect(() => {
    if (!checkRetiredDate(date, today)) fetchPreview(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 열릴 때 한 번만
  }, []);

  const changeDate = (value: string, on: string = today) => {
    dateRef.current = value;
    setDate(value);
    setSubmitError(null);
    setServerDateError(null);
    const invalid = checkRetiredDate(value, on);
    if (invalid) {
      seq.current++; // 늦게 오는 앞 응답이 미리 보기를 덮지 않게
      setPreview({ status: "idle" });
      return;
    }
    setPreview({ status: "loading" });
    fetchPreview(value);
  };

  const dateNote = checkRetiredDate(date, today) ?? serverDateError;
  const hint = retiredDateHint(today, hiredDate);
  const sameDate = mode === "change" && date === currentDate;
  const ready = preview.status === "ok" && preview.date === date && !sameDate;

  // 확인창을 연 채 자정을 넘긴 경우는 서버 액션이 서버 시계로 판정한다(staleDayWarning) — 브라우저 시계는 빠르거나 늦을 수 있어 쓰지 않는다.
  const handleConfirm = async () => {
    setBusy(true);
    setSubmitError(null);
    setServerDateError(null);
    const sentDate = date;
    try {
      // 경고 여부를 정한 오늘을 함께 보낸다 — 서버 액션이 서버 시계로 다시 판정한다(브라우저 시계가 늦어도 막힌다)
      const result =
        mode === "retire" ? await retire(staffMemberId, date, today) : await changeRetirementDate(staffMemberId, date, today);
      if (result.ok) {
        toast(mode === "retire" ? "퇴직 처리되었습니다." : "퇴직일이 변경되었습니다.");
        onClose();
        return;
      }
      // 서버 시계로 날짜가 바뀌어 막혔다 — 서버의 오늘로 경고 · 미리 보기를 다시 그리고, 다시 누르면 그 오늘로 판정받는다.
      // 그 밖의 실패에서는 오늘을 그대로 둔다 — 받은 서버의 오늘을 지킨다.
      const nextToday = todayAfterSubmit(today, result);
      if (nextToday !== today) {
        setToday(nextToday);
        changeDate(date, nextToday);
        setSubmitError(result.message);
        return;
      }
      if (showsBelowDateField(result)) {
        if (dateRef.current !== sentDate) return; // 처리 중에 날짜를 바꿨다 — 이전 날짜의 거절이다
        seq.current++;
        setServerDateError(result.message);
        setPreview({ status: "idle" }); // 거절된 날짜의 정리 건수 · 활성 버튼이 남지 않게(미리 보기 400 과 같다)
        return;
      }
      const message = onFailure(result);
      if (message) setSubmitError(message);
    } catch (error) {
      console.error("퇴직 처리 실패", error);
      setSubmitError("처리 결과를 확인하지 못했습니다. 화면을 새로 불러와 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const settledNow = ready && isSettledNow(date, today);

  return (
    <ConfirmDialog
      open
      wide
      title={mode === "retire" ? "퇴직 처리" : "퇴직일 변경"}
      confirmLabel={mode === "retire" ? "퇴직 처리" : "퇴직일 변경"}
      confirmVariant={mode === "retire" ? "danger" : "primary"}
      busy={busy}
      confirmDisabled={!ready}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-[12px]">
        <div className="flex flex-col gap-[8px]">
          <span className="text-[14px] font-medium text-erp-label">퇴직일</span>
          {/* 생년월일 칸처럼 숫자 8자리만 쳐도 날짜가 된다(autoHyphen) — 퇴직일만 YYYY-MM-DD 로 쳐야 해서 칸마다 달랐다(통합테스트 IT-STAFF-007, 2026-11-13) */}
          <DateField aria-label="퇴직일" autoHyphen value={date} onChange={(value) => {
              if (reloadsPreview(value, date, preview.status)) changeDate(value);
            }}
          />
          {/* 고를 수 있는 기간 — 칸 아래 둥근 꺾은선 + 회색 둥근 꼬리표(2026-11-23 사용자 지정, 꺾은선은 급여명세서 3.3% 안내와 같다) */}
          <p className="flex items-start gap-[6px] text-[13px]">
            <span aria-hidden className="mt-[5px] ml-[4px] size-[7px] shrink-0 rounded-bl-[4px] border-b border-l border-erp-brand-soft" />
            <span className="inline-block rounded-full border border-erp-thead-line bg-erp-thead-bg px-[10px] leading-[20px] font-medium text-erp-ink">
                {hint}
              </span>
          </p>
          {dateNote && (
            <p role="alert" className="text-[13px] text-erp-off">
              {dateNote}
            </p>
          )}
          {sameDate && <p className="text-[13px] text-erp-off">지금 퇴직일과 같습니다.</p>}
        </div>

        {/* 정리되는 항목 · 안내를 영역으로 나눈다 — 항목은 회색 제목 줄 상자(0건은 줄을 빼고, 모두 0건이면 상자를 두지 않는다), 안내는 안내 박스(2026-11-23 사용자 지정) */}
        {preview.status === "loading" && <p className="text-[13px] text-erp-muted">정리되는 항목을 확인하는 중입니다.</p>}
        {preview.status === "error" && (
          <p role="alert" className="text-erp-off">
            {preview.message}
          </p>
        )}
        {preview.status === "ok" && <SettleItems date={preview.date} value={preview.value} />}

        <GuideBand
          title="퇴직 처리 안내"
          lines={[
            "퇴직 처리 시 퇴직일이 저장되며, 퇴직일까지는 '퇴직 예정' 상태로 재직 정보와 근로계약이 유지됩니다.",
            "퇴직일 다음 날 '퇴직' 상태로 변경되며, 이후 근무스케줄 · TO-DO 배정 · 서명 전 근로계약이 정리됩니다. 서명 완료된 근로계약서는 그대로 보관됩니다. 이후에는 퇴직 처리를 되돌릴 수 없습니다.",
            "퇴직 처리는 퇴직일 전까지 취소할 수 있으며, 퇴직 후에도 직원의 앱 계정은 유지됩니다.",
          ]}
        />
        {settledNow && (
          <p className="font-medium text-erp-off">지난 날짜를 퇴직일로 선택하면 즉시 &apos;퇴직&apos; 상태로 변경되고, 근무스케줄 · TO-DO 배정 · 서명 전 근로계약이 정리됩니다. 처리 후에는 취소할 수 없습니다.</p>
        )}
        {submitError && (
          <p role="alert" className="text-erp-off">
            {submitError}
          </p>
        )}
      </div>
    </ConfirmDialog>
  );
}

/** 퇴직일 이후 정리되는 항목 — 회색 제목 줄 상자, 줄마다 이름 · 설명(회색) · 오른쪽 건수. 0건 줄은 빼고 모두 0건이면 그리지 않는다. */
function SettleItems({ date, value }: { date: string; value: { schedulesToRemove: number; todosToUnassign: number; contractsToEnd: unknown[] } }) {
  const rows = [
    { name: "삭제되는 근무스케줄", note: `퇴직일 다음 날(${nextDay(date)})부터`, count: value.schedulesToRemove },
    { name: "배정 해제되는 TO-DO", note: "완료하지 않은 개인 배정", count: value.todosToUnassign },
    { name: "종료되는 근로계약", note: "작성 중·서명 요청 전·직원 서명 대기·직원 수정 요청", count: value.contractsToEnd.length },
  ].filter((r) => r.count > 0);
  if (rows.length === 0) return null;
  return (
    <section className="rounded-[2px] border border-erp-thead-line">
      <h3 className="flex h-[42px] items-center border-b border-erp-thead-line bg-erp-thead-bg px-[12px] text-[14px] font-medium text-erp-ink">퇴직일 이후 정리되는 항목</h3>
      <ul>
        {rows.map((r) => (
          <li key={r.name} className="flex min-h-[46px] items-center gap-[12px] border-b border-erp-thead-line px-[12px] py-[8px] last:border-b-0">
            <span className="min-w-0 flex-1">
              {r.name}
              <span className="block text-[13px] text-erp-label">{r.note}</span>
            </span>
            <span className="shrink-0 font-semibold">{r.count}건</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 퇴직 처리 취소. 퇴직일 전이라 정리된 것이 없어 그대로 재직이다. */
export function CancelRetirementDialog({ staffMemberId, onClose }: { staffMemberId: number; onClose: () => void }) {
  const toast = useToast();
  const onFailure = useFailure();
  const cancelRetirement = useAction(cancelRetirementAction, { overlay: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await cancelRetirement(staffMemberId);
      if (result.ok) {
        toast("퇴직 처리가 취소되었습니다.");
        onClose();
        return;
      }
      const message = onFailure(result);
      if (message) setError(message);
    } catch (e) {
      console.error("퇴직 처리 취소 실패", e);
      setError("취소 결과를 확인하지 못했습니다. 화면을 새로 불러와 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDialog
      open
      title="퇴직 처리 취소"
      confirmLabel="퇴직 처리 취소"
      cancelLabel="닫기"
      busy={busy}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <p>퇴직 예정을 취소합니다. 퇴직일 전이라 정리된 것이 없어 그대로 재직입니다.</p>
      {error && (
        <p role="alert" className="mt-[12px] text-erp-off">
          {error}
        </p>
      )}
    </ConfirmDialog>
  );
}
