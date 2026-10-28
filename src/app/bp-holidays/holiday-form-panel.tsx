"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type RefObject } from "react";
import { Button, ConfirmDialog, DateField, Field, FormGroup, Radio, RequiredMark, Select, SlidePanel, Textarea, TextField } from "@/components/common";
import { useAccount, useCodes, useStores } from "@/components/site/session-gate";
import { FailedBand, FieldMessage } from "@/components/site/side-parts";
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
  type FormErrors,
  type HolidayForm,
  type HolidayType,
  type RepeatEnd,
  type RepeatType,
} from "@/lib/bp-holiday-view";
import type { BpHolidayDetail, BpHolidayOverlaps } from "@/lib/bp-holidays";
import { checkBpHolidayOverlapsAction, createBpHolidayAction, updateBpHolidayAction } from "./actions";
import { unknownResult } from "./holiday-parts";

// BP 휴일 등록(S-UCPMYB) · 수정(S-BXEAEZ) 슬라이드 패널. 휴일 정보(휴일명 → 날짜 → 설명) · 반복을 위로, 적용 대상을 맨 아래로 둔다(데모 2026-10-08).
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

  const repeatType = form.repeatType as RepeatType;
  const skip = form.type === "REPEAT" ? repeatSkipNote(repeatType, form.startDate) : null;
  const options = stores.filter((s) => s.storeStatusCode !== "CLOSED");
  const title = mode === "create" ? "BP 휴일 등록" : "BP 휴일 수정";

  return (
    <SlidePanel id={id} open={open} onClose={() => !saving && onClose()} onBackdropClose={() => !saving && onBackdropClose()} label={title} trigger={trigger} closeOnBackdrop>
      <div className="flex flex-col gap-[18px]">
        <h2 className="text-[18px] font-semibold text-erp-ink">{title}</h2>
        {/* 제목 아래 띠는 오류일 때만 둔다 — 진행 중 · 막힘 안내 띠는 두지 않는다(2026-10-27 사용자 요청). 막힌 칸은 disabled 로 그대로 막는다 */}
        {failure && <FailedBand message={failure} detail="입력한 내용은 그대로 두었습니다." />}

        <FormGroup title="휴일 정보">
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
                <Radio key={t.value} name={`${ids}-type`} label={t.label} checked={form.type === t.value} onChange={() => set("type", t.value as HolidayType)} />
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
          <Field label="설명">
            <Textarea rows={4} maxLength={500} value={form.description} disabled={infoLocked} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </FormGroup>

        {form.type === "REPEAT" && (
          <FormGroup title="반복">
            <fieldset className="contents" disabled={scheduleLocked}>
              <Field label="반복 유형" required>
                <Select value={form.repeatType} onChange={(e) => set("repeatType", e.target.value as RepeatType)}>
                  {(repeats.length ? repeats : (["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const).map((value) => ({ value, label: value }))).map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {/* 기준은 시작일의 요일 · 날짜다 — 그 날짜가 없는 달 · 해는 건너뛰고 미리 알린다(F-YQTLQE) */}
              {repeatBasis(repeatType, form.startDate) && <p className="text-[13px] text-erp-label">기준 · {repeatBasis(repeatType, form.startDate)}</p>}
              {skip && <p className="text-[13px] text-erp-off">{skip}</p>}
              <div className="flex flex-col gap-[8px]">
                <span className="text-[14px] font-medium text-erp-label">
                  종료 조건
                  <RequiredMark />
                </span>
                <div className="flex flex-wrap gap-[18px]">
                  {REPEAT_ENDS.map((end) => (
                    <Radio key={end.value} name={`${ids}-end`} label={end.label} checked={form.repeatEnd === end.value} onChange={() => set("repeatEnd", end.value as RepeatEnd)} />
                  ))}
                </div>
                {form.repeatEnd === "UNTIL_DATE" && <DateField aria-label="반복 종료일" value={form.repeatEndDate} disabled={scheduleLocked} onChange={(v) => set("repeatEndDate", v)} />}
                {form.repeatEnd === "COUNT" && (
                  <div className="flex w-[160px] items-center gap-[6px]">
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
          </FormGroup>
        )}

        <FormGroup title="적용 대상">
          {/* 전체 점포는 BP 마스터 · 전체 점포 BP 관리자 · 플랫폼 계정만(CONFIG-10). 진행 중이면 적용 범위를 바꿀 수 없다 */}
          <Field label="적용 범위" required>
            <Select
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
          </Field>
          <div className="flex flex-col gap-[8px]">
            <span className="text-[14px] font-medium text-erp-label">
              {form.isAllStores ? "예외 점포" : "대상 점포"}
              {!form.isAllStores && <RequiredMark />}
            </span>
            {form.isAllStores && <p className="text-[13px] text-erp-label">고른 점포는 이 휴일에서 빠집니다. 모두 빼도 저장할 수 있습니다.</p>}
            {storesLocked ? (
              <p className="text-[14px] text-erp-muted">점포를 바꿀 수 없는 휴일입니다.</p>
            ) : (
              <StoreMappingPicker
                // 대상 · 예외는 다른 목록이라 범위를 바꾸면 찾기 칸에 적던 글자도 새로 시작한다
                key={form.isAllStores ? "excluded" : "targets"}
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

        <div className="flex items-center gap-[6px] border-t border-erp-panel-line pt-[16px]">
          <Button variant="off" onClick={onClose} disabled={saving}>
            취소
          </Button>
          <span className="flex-1" />
          <Button onClick={() => handleSave()} disabled={saving}>
            저장
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={overlaps !== null}
        title="같은 날짜에 이미 휴일이 있습니다"
        confirmLabel="저장" // 「그래도 저장」은 어색해 「저장」(2026-10-28 사용자 지정)
        wide
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
  return (
    <div className="flex flex-col gap-[12px] break-keep">
      <p>
        {overlaps.storeCount}개 점포 · {overlaps.dateCount}일이 다른 휴일과 겹칩니다. 겹쳐도 저장할 수 있습니다.
      </p>
      <ul className="flex max-h-[280px] flex-col gap-[10px] overflow-y-auto">
        {overlaps.stores.map((s) => (
          <li key={s.storeId} className="flex flex-col gap-[4px]">
            <span className="font-medium">{s.storeName}</span>
            <span className="text-[13px] text-erp-label">
              {s.dates.map((d) => `${d.date} ${d.holidayNames.join(" · ")}`).join(", ")}
              {s.moreDateCount > 0 && ` 외 ${s.moreDateCount}일`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
