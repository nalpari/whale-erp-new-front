"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type RefObject } from "react";
import { Button, ConfirmDialog, DataTable, DateField, Field, FormGroup, Radio, RequiredMark, Select, SlidePanel, Textarea, TextField, type Column } from "@/components/common";
import { useCurrentBpStatus } from "@/components/site/current-bp-status";
import { useAccount, useCodes, useStores } from "@/components/site/session-gate";
import { FailedBand, FieldMessage, WarnBand } from "@/components/site/side-parts";
import { StoreMappingPicker, type MappingStore } from "@/components/site/store-mapping-picker";
import {
  canChooseAllStores,
  emptyHolidayForm,
  formOfDetail,
  holidayBody,
  openStores,
  REPEAT_ENDS,
  repeatBasis,
  repeatSkipNote,
  validateHolidayForm,
  weekdayName,
  type FormErrors,
  type HolidayForm,
  type HolidayType,
  type RepeatEnd,
  type RepeatType,
} from "@/lib/bp-holiday-view";
import type { BpHolidayDetail, BpHolidayOverlaps } from "@/lib/bp-holidays";
import { checkBpHolidayOverlapsAction, createBpHolidayAction, updateBpHolidayAction } from "./actions";
import { unknownResult } from "./holiday-parts";

// BP 휴일 등록(S-UCPMYB) · 수정(S-BXEAEZ) 슬라이드 패널. 휴일정보(휴일명 → 날짜 → 반복 상자 → 설명)를 위로, 적용 대상을 맨 아래로 둔다(데모 2026-10-08, 반복 위치 2026-10-30).
// 「BP 휴일 변경 · 종료 정책」(1팀, 2026-10-26)에 맞춰 수정할 수 있는 칸이 상태로 갈린다 — api 가 같은 규칙으로 다시 막는다.
//  · 시작 전: 모든 칸. 시작일을 옮기면 점포도 새 시작일부터다.
//  · 진행 중: 휴일명 · 설명 · 점포만. 날짜 · 유형 · 반복 · 적용 범위는 막고 읽은 값 그대로 보낸다(바꾸면 409). 점포는 더하면 오늘부터, 빼면 어제까지.
//  · 일부 점포만 맡은 사람(맡지 않은 점포가 함께 묶인 휴일): 맡은 점포만 더하거나 뺀다. 나머지 점포는 그대로 다시 보낸다 — 빠지면 api 가 403.
// 시작일은 오늘(한국 날짜) 이후만 받는다. 저장 전에 겹치는 휴일을 확인해 알리고, 겹쳐도 저장은 막지 않는다(공식 휴일은 보지 않는다).

/** 동시 수정 409 문구(api bp-holiday-changes CONFLICT_MESSAGE). 이때만 최신 정보를 다시 받는다. */
const STALE = "먼저 수정했습니다";

type Props = {
  id: string;
  open: boolean;
  today: string;
  onClose: () => void;
  /** 바탕창 클릭 — 겹친 패널을 모두 닫는다. 저장하는 동안은 닫히지 않는다 */
  onBackdropClose: () => void;
  trigger: RefObject<HTMLElement | null>;
} & (
  | { mode: "create"; holiday?: never; /** 새 휴일의 처음 날짜 — 고른 날짜(오늘 이후일 때) */ startDate: string; /** 만든 휴일과 그 시작일 — 상세를 그 날짜 기준으로 연다 */ onSaved: (bpHolidayId: number, startDate: string) => void; onStale?: never }
  | { mode: "edit"; holiday: BpHolidayDetail; startDate?: never; onSaved: () => void; onStale: () => void }
);

/** 반복 기준 꼬리표의 앞말 — 매일은 기준이 없어 쓰지 않는다 */
const REPEAT_WORD: Record<RepeatType, string> = { DAILY: "매일", WEEKLY: "매주", MONTHLY: "매월", YEARLY: "매년" };

/** 칸을 고치면 그 칸의 오류는 바로 지운다 */
const without = (key: keyof FormErrors) => (e: FormErrors): FormErrors => (key in e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)) : e);

/** 상세의 점포를 고르기 칸 모양으로 */
const picked = (stores: BpHolidayDetail["stores"]): MappingStore[] => stores.map(({ storeId, name, storeCode }) => ({ storeId, name, storeCode }));

export function HolidayFormPanel(props: Props) {
  const { id, mode, open, today, onClose, onBackdropClose, trigger } = props;
  const router = useRouter();
  const me = useAccount();
  const stores = useStores();
  const types = useCodes("HOLIDAY_TYPE");
  const repeats = useCodes("HOLIDAY_REPEAT_TYPE");
  const ids = useId();
  const allowAll = canChooseAllStores(me.roleTypeCode);

  // 수정에서 막히는 칸 — 진행 중이면 일정, 휴일 전체를 다루지 않으면(canUpdate 없음) 휴일명 · 설명, 점포를 못 바꾸면 점포
  const h = mode === "edit" ? props.holiday : null;
  const infoLocked = !!h && !h.actions.canUpdate;
  // 일정(유형 · 날짜 · 반복 · 적용 범위)은 진행 중이면 막고, 시작 전이어도 휴일 전체를 다루지 않으면(맡지 않은 점포가 함께 묶임) 막는다 —
  // api 가 점포 말고 다른 칸이 바뀌면 403 이다(bp-holiday-changes update). 브라우저 시험(가맹 마스터)으로 찾음, 2026-10-27
  const scheduleLocked = !!h && (h.state !== "UPCOMING" || infoLocked);
  const storesLocked = !!h && !h.actions.canUpdateStores;
  // 맡지 않은 점포 — 고르기 칸 밖에 두고 그대로 다시 보낸다
  // 상세의 점포는 빠진 기간까지 모두라 지금 열린 기간만 쓴다 — 빠진 점포를 다시 보내면 다시 더해진다
  const openPeriods = h ? openStores(h.stores) : [];
  const fixedStores = openPeriods.filter((s) => !s.isManaged);

  const initial = (): { form: HolidayForm; targets: MappingStore[]; excluded: MappingStore[] } => {
    if (h) {
      const managed = picked(openPeriods.filter((s) => s.isManaged));
      return { form: formOfDetail(h), targets: h.isAllStores ? [] : managed, excluded: h.isAllStores ? managed : [] };
    }
    // 전체 점포를 고를 수 없는 역할(가맹)은 일부 점포로 시작한다
    return { form: emptyHolidayForm(props.mode === "create" ? props.startDate : today, allowAll), targets: [], excluded: [] };
  };
  const [state, setState] = useState(initial);
  const { form, targets, excluded } = state;
  const [errors, setErrors] = useState<FormErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [overlaps, setOverlaps] = useState<BpHolidayOverlaps | null>(null);
  const [saving, startSaving] = useTransition();

  // 열 때마다(취소한 입력을 남기지 않는다) · 최신 정보를 다시 받았을 때(동시 수정 409 뒤) 칸을 새로 채운다.
  // 패널을 다시 마운트하면 처음부터 열린 자리에 그려져 밀려 나오는 전환이 사라지므로, 그리는 중에 값만 되돌린다.
  const updatedAt = h?.updatedAt ?? null;
  const [filledFor, setFilledFor] = useState({ open, updatedAt });
  if (filledFor.open !== open || filledFor.updatedAt !== updatedAt) {
    setFilledFor({ open, updatedAt });
    const reopened = open && !filledFor.open;
    if (reopened || filledFor.updatedAt !== updatedAt) {
      setState(initial());
      setErrors({});
      setOverlaps(null);
      if (reopened) setFailure(null);
    }
  }

  const set = <K extends keyof HolidayForm>(key: K, value: HolidayForm[K]) => {
    setState((s) => ({ ...s, form: { ...s.form, [key]: value } }));
    setErrors(without(key as keyof FormErrors));
  };
  /**
   * 날짜 유형 · 종료 조건을 바꾸면 날짜 칸 오류를 함께 지운다 — 기간에서 난 종료일 오류가 하루로 바꿔도 남아 있었다(2026-10-30 사용자 지적).
   * 바뀐 유형으로 저장할 때 다시 검사한다
   */
  const setDateKind = <K extends "type" | "repeatEnd">(key: K, value: HolidayForm[K]) => {
    set(key, value);
    setErrors((e) => (["startDate", "endDate", "repeatEndDate", "repeatCount"] as const).reduce((acc, k) => without(k)(acc), e));
  };
  const err = (key: keyof FormErrors) => <FieldMessage id={`${ids}-${key}`} message={errors[key]} />;
  const invalid = (key: keyof FormErrors) => (errors[key] ? true : undefined);
  const describe = (key: keyof FormErrors) => (errors[key] ? `${ids}-${key}` : undefined);

  /** 보낼 양식 — 고른 점포에 맡지 않은 점포를 더하고, 진행 중이면 일정 칸을 읽은 값으로 되돌린다 */
  const outgoing = (): HolidayForm => {
    const fixed = fixedStores.map((s) => s.storeId);
    const ids = (list: MappingStore[]) => [...new Set([...fixed, ...list.map((s) => s.storeId)])];
    const next = { ...form, storeIds: ids(targets), excludedStoreIds: ids(excluded) };
    if (!h || !scheduleLocked) return next;
    const read = formOfDetail(h);
    return { ...read, name: next.name, description: next.description, storeIds: next.storeIds, excludedStoreIds: next.excludedStoreIds };
  };

  /** 저장 — 칸 검사 → 겹침 확인(겹치면 묻는다) → 저장. force 면 겹침 확인을 건너뛴다(확인창의 [저장]). */
  const handleSave = (force = false) => {
    const f = outgoing();
    const found = validateHolidayForm(f, today, { scheduleLocked });
    if (Object.keys(found).length) {
      setErrors(found);
      requestAnimationFrame(() => (document.getElementById(id)?.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus());
      return;
    }
    const body = holidayBody(f);
    startSaving(async () => {
      if (!force) {
        const check = await checkBpHolidayOverlapsAction({ ...body, ...(h ? { bpHolidayId: h.bpHolidayId } : {}) }).catch(unknownResult("겹침 확인", false));
        // 칸 · 권한 문제면 저장도 같은 이유로 막히니 여기서 알린다. 그 밖의 실패(5xx · 연결)는 저장을 막지 않는다 — 겹침 확인은 안내일 뿐이다.
        if (!check.ok && check.status !== undefined && [400, 401, 403, 404, 409].includes(check.status)) return setFailure(check.message);
        if (!check.ok) console.warn("겹침 확인을 하지 못해 그대로 저장한다", check.message);
        if (check.ok && check.storeCount > 0) return setOverlaps(check);
      }
      setOverlaps(null);
      if (props.mode === "edit") {
        const result = await updateBpHolidayAction(props.holiday.bpHolidayId, { ...body, updatedAt: props.holiday.updatedAt }).catch(unknownResult("수정"));
        if (!result.ok) return fail(result.status, result.message);
        setFailure(null);
        props.onSaved();
      } else {
        const result = await createBpHolidayAction(body).catch(unknownResult("등록"));
        if (!result.ok) return fail(result.status, result.message);
        setFailure(null);
        props.onSaved(result.bpHolidayId, body.startDate);
      }
    });
  };

  /** 저장 실패 — 위 띠로 알린다. 동시 수정(409)이면 최신 정보를 받고, 결과를 모르면(이미 처리됐을 수 있다) 목록 · 상세를 새로 받는다. */
  const fail = (status: number | undefined, message: string) => {
    setFailure(message);
    if (props.mode === "edit" && status === 409 && message.includes(STALE)) props.onStale();
    else if (status === undefined) router.refresh();
  };

  // 탈퇴 · 미사용 BP 에는 등록하지 않는다 — 점포 등록과 같다(플랫폼 계정만 본다, 2026-10-29 사용자 지정). 확인하지 못하면(null) 막지 않는다
  const bpStatus = useCurrentBpStatus();
  const bpBlocked = mode === "create" && bpStatus !== null && bpStatus !== "ACTIVE";
  const repeatType = form.repeatType as RepeatType;
  const skip = form.type === "REPEAT" ? repeatSkipNote(repeatType, form.startDate) : null;
  const options = stores.filter((s) => s.storeStatusCode !== "CLOSED");
  const title = mode === "create" ? "BP 휴일 등록" : "BP 휴일 수정";

  return (
    <SlidePanel id={id} open={open} onClose={() => !saving && onClose()} onBackdropClose={() => !saving && onBackdropClose()} label={title} trigger={trigger} closeOnBackdrop>
      <div className="flex flex-col gap-[18px]">
        <h2 className="text-[18px] font-semibold text-erp-ink">{title}</h2>
        {/* 제목 아래 띠는 오류일 때만 둔다 — 진행 중 · 막힘 안내 띠는 두지 않는다(2026-10-27 사용자 요청). 막힌 칸은 disabled 로 그대로 막는다.
            예외: 탈퇴 · 미사용 BP 의 등록 막기 띠는 둔다 — 점포 등록과 같다(2026-10-29 사용자 지정) */}
        {bpBlocked && <WarnBand>BP가 탈퇴 또는 미사용 상태로, 휴일을 등록할 수 없습니다.</WarnBand>}
        {failure && <FailedBand message={failure} detail="입력한 내용은 그대로 두었습니다." />}

        {/* 묶음 이름 · 칸 이름은 붙여 쓴다 — 「휴일정보」 · 「반복유형」 · 「종료조건」 · 「예외점포」 · 「대상점포」(2026-10-30 사용자 지정, BP 관리자의 「대상점포」와 같다) */}
        <FormGroup title="휴일정보">
          <div className="flex flex-col gap-[8px]">
            <Field label="휴일명" required>
              <TextField
                value={form.name}
                maxLength={30}
                disabled={infoLocked}
                aria-required
                aria-invalid={invalid("name")}
                aria-describedby={describe("name")}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            {err("name")}
          </div>
          <fieldset className="flex flex-col gap-[8px]" disabled={scheduleLocked}>
            <legend className="mb-[8px] text-[14px] font-medium text-erp-label">
              날짜
              <RequiredMark />
            </legend>
            <div className="flex gap-[18px]">
              {(types.length ? types : (["DAY", "PERIOD", "REPEAT"] as const).map((value) => ({ value, label: value }))).map((t) => (
                <Radio key={t.value} name={`${ids}-type`} label={t.label} checked={form.type === t.value} onChange={() => setDateKind("type", t.value as HolidayType)} />
              ))}
            </div>
            {form.type === "PERIOD" ? (
              <div className="flex items-center gap-[6px]">
                <div className="min-w-px flex-1">
                  <DateField aria-label="시작일" value={form.startDate} disabled={scheduleLocked} onChange={(v) => set("startDate", v)} />
                </div>
                <span className="text-erp-label">~</span>
                <div className="min-w-px flex-1">
                  <DateField aria-label="종료일" value={form.endDate} disabled={scheduleLocked} onChange={(v) => set("endDate", v)} />
                </div>
              </div>
            ) : (
              <DateField aria-label={form.type === "REPEAT" ? "시작일" : "날짜"} value={form.startDate} disabled={scheduleLocked} onChange={(v) => set("startDate", v)} />
            )}
            {err("startDate")}
            {err("endDate")}
          </fieldset>
          {/* 반복 칸은 날짜(반복) 바로 아래, 설명 위에 둔다 — 따로 「반복」 묶음으로 맨 아래에 뜨면 고른 것과 멀었다(2026-10-30 사용자 지정) */}
          {form.type === "REPEAT" && (
            // 바로 위 날짜 칸과는 10px — 묶음 칸 간격(18)보다 붙여 날짜에 딸린 칸으로 보이게. 회색 상자로 묶어 날짜 · 설명과 가른다
            // — 점포 고르기 상자와 같은 모양(표 머리 바탕 · 패널 선, 두 바탕 규칙 안)(2026-10-30 사용자 지정)
            <fieldset className="-mt-[8px] flex flex-col gap-[12px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[12px]" disabled={scheduleLocked}>
              {/* 기준(시작일의 요일 · 날짜)은 칸 이름 옆 꼬리표 「매주 금요일마다 반복」으로 — 아랫줄 글로 두면 반복유형과 떨어져 보였다(2026-10-30 사용자 지정). 매일은 기준이 없다 */}
              <label className="flex flex-col gap-[8px]">
                <span className="flex items-center gap-[6px] text-[14px] font-medium text-erp-label">
                  <span>
                    반복유형
                    <RequiredMark />
                  </span>
                  {repeatBasis(repeatType, form.startDate) && (
                    // 회색 상자(표 머리 바탕) 위라 공통 꼬리표(Tag)는 바탕이 같아 묻혔다 — 한 단계 짙은 바탕(헤더 구분선 회색 erp-bar-line)으로.
                    // 테두리는 1px 그대로 두고 색만 짙게 한다(DESIGN 테두리는 늘 1px)
                    <span className="inline-block rounded-[2px] border border-erp-bar-line bg-erp-bar-line px-[4px] py-px text-[14px] font-medium whitespace-nowrap text-erp-sub">
                      {REPEAT_WORD[repeatType]} {repeatBasis(repeatType, form.startDate)}마다 반복
                    </span>
                  )}
                </span>
                <Select value={form.repeatType} onChange={(e) => set("repeatType", e.target.value as RepeatType)}>
                  {(repeats.length ? repeats : (["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const).map((value) => ({ value, label: value }))).map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </label>
              {/* 기준 날짜가 없는 달 · 해는 건너뛰고 미리 알린다(F-YQTLQE) */}
              {skip && <p className="text-[13px] text-erp-off">{skip}</p>}
              <div className="flex flex-col gap-[8px]">
                <span className="text-[14px] font-medium text-erp-label">
                  종료조건
                  <RequiredMark />
                </span>
                <div className="flex flex-wrap gap-[18px]">
                  {REPEAT_ENDS.map((end) => (
                    <Radio key={end.value} name={`${ids}-end`} label={end.label} checked={form.repeatEnd === end.value} onChange={() => setDateKind("repeatEnd", end.value as RepeatEnd)} />
                  ))}
                </div>
                {form.repeatEnd === "UNTIL_DATE" && <DateField aria-label="반복 종료일" value={form.repeatEndDate} disabled={scheduleLocked} onChange={(v) => set("repeatEndDate", v)} />}
                {form.repeatEnd === "COUNT" && (
                  <div className="flex w-[100px] items-center gap-[6px]">
                    <TextField
                      value={form.repeatCount}
                      inputMode="numeric"
                      maxLength={4}
                      aria-label="반복 횟수"
                      aria-invalid={invalid("repeatCount")}
                      aria-describedby={describe("repeatCount")}
                      onChange={(e) => set("repeatCount", e.target.value.replace(/\D/g, ""))}
                    />
                    <span className="shrink-0 text-[14px] text-erp-ink">회</span>
                  </div>
                )}
                {err("repeatEndDate")}
                {err("repeatCount")}
              </div>
            </fieldset>
          )}
          <Field label="설명">
            {/* 설명 칸은 휴일명과 같은 한 줄 높이(34px)로 시작해 Enter 로 줄을 더하면 늘어난다(최대 6줄, 2026-10-30 사용자 지정 — 4줄 → 2줄 → 1줄 → 한 줄 칸 → 늘어나는 칸). 500자 제한은 그대로 */}
            <Textarea grow={6} maxLength={500} value={form.description} disabled={infoLocked} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </FormGroup>

        <FormGroup title="적용 대상">
          {/* 전체 점포는 BP 마스터 · 전체 점포 BP 관리자 · 플랫폼 계정만(CONFIG-10). 진행 중이면 적용 범위를 바꿀 수 없다 */}
          {/* 「적용 범위」 칸 이름은 뺐다 — 묶음 제목 「적용 대상」과 값(전체 · 일부 점포)만으로 뜻이 분명하다(2026-10-30 사용자 지정). 화면 낭독기용 이름은 남긴다 */}
          <Select
              aria-label="적용 범위"
              value={form.isAllStores ? "ALL" : "SOME"}
              disabled={scheduleLocked || infoLocked || !allowAll}
              onChange={(e) => {
                set("isAllStores", e.target.value === "ALL");
                // 대상 점포 오류(「하나 이상」)는 예외 점포에는 맞지 않는다 — 범위를 바꾸면 지운다
                setErrors(without("storeIds"));
              }}
            >
              {(allowAll || form.isAllStores) && <option value="ALL">전체 점포</option>}
              <option value="SOME">일부 점포</option>
          </Select>
          <div className="flex flex-col gap-[8px]">
            <span className="text-[14px] font-medium text-erp-label">
              {form.isAllStores ? "예외점포" : "대상점포"}
              {!form.isAllStores && <RequiredMark />}
              {/* 무엇을 고르는 칸인지 칸 이름 오른쪽에 「 · 」로 붙여 말한다(2026-10-30 사용자 지정 — 전엔 아랫줄 「고른 점포는 이 휴일에서 빠집니다. 모두 빼도 저장할 수 있습니다.」) */}
              <span className="text-[13px] font-normal"> · {form.isAllStores ? "휴일을 적용하지 않을 점포를 선택해 주세요." : "휴일을 적용할 점포를 선택해 주세요."}</span>
            </span>
            {storesLocked ? (
              <p className="text-[14px] text-erp-muted">점포를 바꿀 수 없는 휴일입니다.</p>
            ) : (
              <StoreMappingPicker
                // 대상 · 예외는 다른 목록이라 범위를 바꾸면 찾기 칸에 적던 글자도 새로 시작한다
                key={form.isAllStores ? "excluded" : "targets"}
                // 고른 점포 칸은 BP 관리자보다 1/3 낮게 — 패널이 길어 버튼이 화면 밖으로 밀렸다(2026-10-30 사용자 지정)
                short
                panelOpen={open}
                // 후보는 로그인 정보의 관리 점포다. 폐점한 점포는 더할 수 없어(api 400) 후보에서 뺀다 — 이미 붙은 폐점 점포는 빼기만 된다
                options={options}
                picked={form.isAllStores ? excluded : targets}
                exclude={form.isAllStores}
                onChange={(next) => {
                  setState((s) => (form.isAllStores ? { ...s, excluded: next } : { ...s, targets: next }));
                  setErrors(without("storeIds"));
                }}
                invalid={invalid("storeIds")}
                describedBy={describe("storeIds")}
              />
            )}
            {err("storeIds")}
            {fixedStores.length > 0 && (
              <p className="text-[13px] text-erp-label">
                맡지 않은 점포 {fixedStores.length}곳({fixedStores.map((s) => s.name).join(", ")})은 그대로 둡니다.
              </p>
            )}
          </div>
        </FormGroup>

        {/* [닫기] [저장]은 가운데, 위 구분선 없이(2026-10-30 사용자 지정 — 전엔 [취소] … [저장] 양 끝 · 위 1px 선) */}
        <div className="flex items-center justify-center gap-[6px]">
          <Button variant="off" onClick={onClose} disabled={saving}>
            닫기
          </Button>
          <Button onClick={() => handleSave()} disabled={saving || bpBlocked}>
            저장
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={overlaps !== null}
        title="같은 날 등록된 휴일이 있습니다." // 2026-10-30 사용자 지정 — 전엔 「같은 날짜에 이미 휴일이 있습니다.」
        confirmLabel="저장" // 「그래도 저장」은 어색해 「저장」(2026-10-28 사용자 지정)
        wide="large" // 점포 · 날짜 · 휴일 표를 담아 넓은 창(2026-10-30 사용자 지정)
        busy={saving}
        onConfirm={() => handleSave(true)}
        onCancel={() => setOverlaps(null)}
      >
        {overlaps && <OverlapSummary overlaps={overlaps} />}
      </ConfirmDialog>
    </SlidePanel>
  );
}

/** 겹침 요약 — 점포마다 겹치는 날짜 앞 10건과 나머지 수(오늘 또는 시작일부터 1년). 겹쳐도 저장할 수 있다. */
function OverlapSummary({ overlaps }: { overlaps: BpHolidayOverlaps }) {
  // 점포 · 날짜 · 이미 있는 휴일 세 칸 표 — 점포마다 겹치는 날짜를 한 줄씩, 점포 이름은 그 점포의 첫 줄에만(2026-10-30 사용자 지정 — 전엔 점포 이름 아래 「날짜 휴일명 · 휴일명, …」 글줄이라
  // 무엇이 어디서 겹치는지 알기 어려웠다). 앞 10일만 보이고 나머지는 「외 N일」 줄로 센다(api)
  const rows: OverlapRow[] = overlaps.stores.flatMap((s) => [
    ...s.dates.map((d, i) => ({ key: `${s.storeId}-${d.date}`, store: i === 0 ? s.storeName : "", date: `${d.date}(${weekdayName(d.date).slice(0, 1)})`, names: d.holidayNames.join(", ") })),
    ...(s.moreDateCount > 0 ? [{ key: `${s.storeId}-more`, store: "", date: `외 ${s.moreDateCount}일`, names: "" }] : []),
  ]);
  return (
    <div className="flex flex-col gap-[12px] break-keep">
      <p>저장하면 겹치는 휴일이 모두 적용됩니다. 저장하시겠습니까?</p>
      <div className="max-h-[280px] overflow-y-auto overscroll-contain [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[1]">
        <DataTable columns={OVERLAP_COLUMNS} rows={rows} rowKey={(r) => r.key} />
      </div>
    </div>
  );
}

type OverlapRow = { key: string; store: string; date: string; names: string };
const OVERLAP_COLUMNS: Column<OverlapRow>[] = [
  // 점포 칸은 폭을 정해 날짜가 점포 쪽으로 붙게 하고, 남는 폭은 휴일 이름이 쓴다(2026-10-30 사용자 지정)
  { header: "점포", width: "w-[170px]", align: "left", cell: (r) => <span className="block truncate" title={r.store}>{r.store}</span> },
  { header: "날짜", width: "w-[120px]", align: "left", cell: (r) => r.date }, // 왼쪽 정렬로 점포 바로 옆에(2026-10-30 사용자 지정). 겹침은 1년 범위라 해를 넘을 수 있어 연도까지 쓴다(코드 리뷰로 찾음)
  { header: "이미 등록된 휴일", align: "left", cell: (r) => r.names },
];
