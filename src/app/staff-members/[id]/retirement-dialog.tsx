"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ConfirmDialog, DateField, useToast } from "@/components/common";
import { PASSWORD_REQUIRED_EVENT } from "@/lib/bff";
import { checkRetiredDate, earliestRetiredDate, failureEffect, isSettledNow, todayAfterSubmit } from "@/lib/retirement";
import type { RetirementPreview } from "@/lib/staff-members";
import { cancelRetirementAction, changeRetirementDateAction, previewRetirementAction, retireAction, type ActionFailure } from "./actions";

// 퇴직 처리 · 퇴직일 변경 확인창과 퇴직 처리 취소 확인창(WHALEERP-585). 문구와 배치는 목업 docs/mockup/staff/detail.html ·
// 데모 detail.mjs 의 확인창이다. 「닫힐 근로계약」은 목업의 발송 대기 · 서명 대기에 임시저장을 더했다 — api 가 셋을 닫는다(2026-10-12 재영).

const mmdd = (date: string) => date.slice(5);
/** YYYY-MM-DD 다음 날 */
function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** 실패를 받은 뒤 할 일. 확인창 안에 둘 문구면 돌려주고, 아니면 여기서 처리하고 null. */
function useFailure() {
  const router = useRouter();
  return (failure: ActionFailure): string | null => {
    switch (failureEffect(failure)) {
      case "password":
        dispatchEvent(new Event(PASSWORD_REQUIRED_EVENT));
        return failure.message;
      case "leave":
        // 권한이 없거나 쓸 수 없는 계정 — 안내하고 들어오기 전 화면으로(공통 틀의 메뉴 권한 막기와 같다)
        alert(failure.message);
        if (history.length > 1) history.back();
        else router.replace("/home");
        return null;
      case "refresh":
        router.refresh();
        return failure.message;
      case "inline":
        return failure.message;
    }
  };
}

type Preview = { status: "loading" } | { status: "ok"; date: string; value: RetirementPreview } | { status: "error"; message: string };

/**
 * 퇴직 처리(mode retire) · 퇴직일 변경(mode change). 열릴 때만 그린다 — 닫으면 날짜 · 미리 보기가 처음으로 돌아간다.
 * 퇴직일을 바꿀 때마다 미리 보기를 다시 받고, 그 날짜의 미리 보기가 있어야 확인 버튼이 열린다(api 가 거절할 날짜를 막는다).
 */
export function RetirementDialog({
  staffMemberId,
  mode,
  currentDate,
  today: initialToday,
  onClose,
}: {
  staffMemberId: number;
  mode: "retire" | "change";
  /** 퇴직일 변경일 때 지금 퇴직일 */
  currentDate: string | null;
  /** 화면을 그릴 때 서버의 오늘(KST). 그 뒤로는 서버 액션이 날짜 바뀜으로 막으며 돌려준 오늘로만 바뀐다(todayAfterSubmit). */
  today: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const onFailure = useFailure();
  const [today, setToday] = useState(initialToday);
  const [date, setDate] = useState(currentDate ?? initialToday);
  const [preview, setPreview] = useState<Preview>(() => {
    const invalid = checkRetiredDate(date, today);
    return invalid ? { status: "error", message: invalid } : { status: "loading" };
  });
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // 날짜를 빠르게 바꾸면 앞의 응답이 늦게 올 수 있다 — 마지막 요청의 응답만 쓴다.
  const seq = useRef(0);

  /** 미리 보기를 받아 그 응답이 마지막 요청일 때만 담는다. 상태는 응답을 받은 뒤에만 바꾼다. */
  const fetchPreview = (value: string) => {
    const n = ++seq.current;
    previewRetirementAction(staffMemberId, value)
      .then((result) => {
        if (n !== seq.current) return;
        if (result.ok) return setPreview({ status: "ok", date: value, value: result.preview });
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
    setDate(value);
    setSubmitError(null);
    const invalid = checkRetiredDate(value, on);
    if (invalid) {
      seq.current++; // 늦게 오는 앞 응답이 이 문구를 덮지 않게
      setPreview({ status: "error", message: invalid });
      return;
    }
    setPreview({ status: "loading" });
    fetchPreview(value);
  };

  const sameDate = mode === "change" && date === currentDate;
  const ready = preview.status === "ok" && preview.date === date && !sameDate;

  // 확인창을 연 채 자정을 넘긴 경우는 서버 액션이 서버 시계로 판정한다(staleDayWarning) — 브라우저 시계는 빠르거나 늦을 수 있어 쓰지 않는다.
  const confirm = async () => {
    setBusy(true);
    setSubmitError(null);
    try {
      // 경고 여부를 정한 오늘을 함께 보낸다 — 서버 액션이 서버 시계로 다시 판정한다(브라우저 시계가 늦어도 막힌다)
      const result =
        mode === "retire" ? await retireAction(staffMemberId, date, today) : await changeRetirementDateAction(staffMemberId, date, today);
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
      onConfirm={confirm}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-[12px]">
        <div className="flex flex-col gap-[8px]">
          <span className="text-[14px] font-medium text-erp-label">퇴직일</span>
          <DateField aria-label="퇴직일" value={date} onChange={changeDate} />
          <p className="text-[13px] text-erp-label">오늘 이후, 또는 최근 3개월 안({earliestRetiredDate(today)}부터)의 지난 날짜를 받습니다.</p>
          {sameDate && <p className="text-[13px] text-erp-off">지금 퇴직일과 같습니다.</p>}
        </div>

        <div className="flex flex-col gap-[6px]">
          <p className="text-[13px] text-erp-label">퇴직일이 지나면 정리될 것</p>
          {preview.status === "loading" && <p className="text-erp-muted">불러오는 중입니다.</p>}
          {preview.status === "error" && (
            <p role="alert" className="text-erp-off">
              {preview.message}
            </p>
          )}
          {preview.status === "ok" && (
            <ul className="list-disc pl-[18px]">
              <li>
                지워질 근무스케줄 {preview.value.schedulesToRemove}건{" "}
                <span className="text-erp-label">· 퇴직일 다음 날({mmdd(nextDay(preview.date))})부터</span>
              </li>
              <li>
                풀릴 TO-DO 배정 {preview.value.todosToUnassign}건 <span className="text-erp-label">· 개인 배정 미완료</span>
              </li>
              <li>
                닫힐 근로계약 {preview.value.contractsToEnd.length}건 <span className="text-erp-label">· 임시저장 · 발송 대기 · 서명 대기</span>
              </li>
            </ul>
          )}
        </div>

        <p>
          퇴직일이 지나면 되돌릴 수 없이 정리되고, 그 전까지는 취소할 수 있습니다. 처리하면 퇴직일만 저장되고 재직 상태와 근로계약은
          그대로입니다(퇴직 예정). 퇴직일 다음 날 퇴직으로 바뀌며 위 항목이 정리됩니다. 계정은 막지 않습니다.
        </p>
        {settledNow && (
          <p className="font-medium text-erp-off">지난 날짜라 처리하는 즉시 퇴직으로 바뀌고 위 항목이 정리됩니다. 되돌릴 수 없습니다.</p>
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

/** 퇴직 처리 취소. 퇴직일 전이라 정리된 것이 없어 그대로 재직이다. */
export function CancelRetirementDialog({ staffMemberId, onClose }: { staffMemberId: number; onClose: () => void }) {
  const toast = useToast();
  const onFailure = useFailure();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await cancelRetirementAction(staffMemberId);
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
      onConfirm={confirm}
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
