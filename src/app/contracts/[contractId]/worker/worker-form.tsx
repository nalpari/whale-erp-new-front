"use client";

import { unstable_rethrow, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Button, Checkbox, ConfirmDialog, DateField, Field, FieldMessage, FormGroup, FormRow, Radio, TextField, useAction } from "@/components/common";
import { labelOf, type EnumValue } from "@/lib/enums";
import { formatPhone, GENDERS, inProgressLine, shownProblems, type InProgressContract } from "../../new/contract-form-model";
import { useInvalid } from "../../field-errors";
import { withBack } from "../../contract-list";
import { updateWorker } from "../actions";
import { callSave, SAVE_CALL_LOST } from "../send-model";
import { workerBody, workerProblemsByField, workerSaveNote, type WorkerField, type WorkerForm as Form } from "./worker-model";


// 날인 전 근로자 정보 수정(WHALEERP-125 「본인 대조」 · 126). 초대 코드를 못 받았다는 직원과 유선으로 번호를 확인했거나,
// 직원이 가입 값과 달라 수정을 요청했을 때 쓴다. 다섯 칸은 직원이 가입하며 넣는 값과 대조된다.
export function WorkerForm({
  contractId,
  status,
  initial,
  labels,
  back,
}: {
  contractId: number;
  status: string;
  initial: Form;
  labels: { gender: EnumValue[]; contractStatus: EnumValue[] };
  /** 돌아갈 목록 주소(?back=) — 상세로 갈 때 이어 싣는다 */
  back: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(initial);
  const [serverError, setServerError] = useState("");
  const [saving, startSaving] = useTransition();
  const update = useAction(updateWorker, { kind: "update" });
  // 새 번호로 같은 점포에 진행 중 계약이 있으면(409) 대체할지 묻는다 — 작성 화면과 같다
  const [replace, setReplace] = useState<InProgressContract[] | null>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [failures, setFailures] = useState(0);
  useEffect(() => {
    // 화면이 막았으면 첫 오류 칸으로, api 가 막았으면 아래 안내로. nearest — center 는 바깥 틀까지 밀어 올려 화면 아래에 빈 공간이
    // 생긴다(작성 화면과 같다)
    if (!failures) return;
    const target = failureRef.current ?? formRef.current?.querySelector("[aria-invalid=true], [data-invalid]");
    target?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [failures]);
  const ids = { name: useId(), phone: useId(), birthDate: useId(), gender: useId() };
  // 공통 DateField 는 aria 속성을 받지 않아 안의 입력에, 성별은 묶음 안 라디오 모두에 단다(작성 화면과 같은 useInvalid)
  const birthRef = useRef<HTMLDivElement>(null);
  const genderRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const issues = workerProblemsByField(form);
  // 칸 아래 오류는 저장을 누른 때 오류가 난 칸에만, 고치는 동안 다시 본다(작성 화면과 같다)
  const [errorFields, setErrorFields] = useState<ReadonlySet<WorkerField> | null>(null);
  const errs = errorFields ? shownProblems(issues, errorFields) : {};
  const invalid = (k: keyof typeof ids) => (errs[k] ? { "aria-invalid": true, "aria-describedby": ids[k] } : {});
  useInvalid(birthRef, ids.birthDate, !!errs.birthDate);
  useInvalid(genderRef, ids.gender, !!errs.gender, true);
  const send = (replaceContractIds?: number[]) =>
    startSaving(async () => {
      // 성공하면 액션이 상세로 보낸다. 돌아왔다면 실패다.
      // 액션의 redirect(성공 · 보내기 실패)는 callSave 가 다시 던져 그 목적지로 간다
      const result = await callSave(() => update(contractId, workerBody(form, replaceContractIds), back), unstable_rethrow);
      if (result === SAVE_CALL_LOST) {
        // 서버 액션 호출 자체가 끊겼다 — 저장하면 다시 보내므로 이미 보냈을 수 있다. 같은 폼으로 다시 저장하지 않게 상세로(front #50 재리뷰)
        router.replace(withBack(`/contracts/${contractId}?send=unknown`, back));
        return;
      }
      if (result.inProgress) {
        setReplace(result.inProgress);
        return;
      }
      setReplace(null);
      setServerError(result.error);
      setFailures((n) => n + 1);
    });
  const save = () => {
    setServerError("");
    const found = Object.keys(issues) as WorkerField[];
    setErrorFields(found.length ? new Set(found) : null);
    if (found.length) {
      setFailures((n) => n + 1);
      return;
    }
    send();
  };

  return (
    <div ref={formRef} className="flex flex-col gap-[12px]">
      <div className="flex items-end gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">근로자 정보 수정</h2>
        <Button variant="off" href={withBack(`/contracts/${contractId}`, back)}>
          취소
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? "저장 중" : "저장"}
        </Button>
      </div>
      <p className="text-[14px] text-erp-label">
        이름 · 휴대전화번호 · 생년월일 · 성별 · 외국인 여부는 직원이 가입하며 넣는 값과 대조해, 모두 같아야 날인할 수 있습니다. {workerSaveNote(status)}
      </p>

      <FormGroup title="직원 정보">
        <FormRow>
          {/* 저장 때 찾은 오류는 칸 바로 아래(공통 FieldMessage, WHALEERP-631). Field 는 <label> 이라 오류를 그 밖에 둔다 — 안에 두면 입력 이름이 된다 */}
          <div className="flex min-w-px flex-1 flex-col gap-[8px]">
            <Field label="이름" required>
              <TextField value={form.name} maxLength={50} aria-required {...invalid("name")} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <FieldMessage id={ids.name} message={errs.name} />
          </div>
          <div className="flex min-w-px flex-1 flex-col gap-[8px]">
            <Field label="휴대전화번호" required>
              <TextField
                value={form.phone}
                inputMode="tel"
                placeholder="010-0000-0000"
                maxLength={13}
                aria-required
                {...invalid("phone")}
                onChange={(e) => set("phone", formatPhone(e.target.value))}
              />
            </Field>
            <FieldMessage id={ids.phone} message={errs.phone} />
          </div>
        </FormRow>
        <FormRow>
          <div ref={birthRef} data-invalid={errs.birthDate ? true : undefined} className="flex min-w-px flex-1 flex-col gap-[8px]">
            <span className="text-[14px] font-medium text-erp-label">생년월일 *</span>
            <DateField aria-label="생년월일" autoHyphen value={form.birthDate} onChange={(v) => set("birthDate", v)} />
            <FieldMessage id={ids.birthDate} message={errs.birthDate} />
          </div>
          <div
            ref={genderRef}
            role="group"
            aria-label="성별"
            data-invalid={errs.gender ? true : undefined}
            className="flex min-w-px flex-1 flex-col gap-[8px]"
          >
            <span className="text-[14px] font-medium text-erp-label">성별 *</span>
            <div role="radiogroup" className="flex min-h-[34px] flex-wrap items-center gap-x-[18px] gap-y-[8px]">
              {GENDERS.map((v) => (
                <Radio key={v} name="gender" label={labelOf(labels.gender, v)} checked={form.gender === v} onChange={() => set("gender", v)} />
              ))}
              <Checkbox label="외국인" checked={form.isForeigner} onChange={(e) => set("isForeigner", e.target.checked)} />
            </div>
            <FieldMessage id={ids.gender} message={errs.gender} />
          </div>
        </FormRow>
      </FormGroup>

      {/* 화면이 막은 유효성 오류는 칸 아래에 보이고, 여기는 api 가 막은 것만이다(WHALEERP-631) */}
      {serverError && (
        <div ref={failureRef} role="alert" className="flex flex-col gap-[4px] rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px]">
          <p className="text-[14px] font-semibold text-erp-off">저장하지 못했습니다.</p>
          <p className="text-[14px] leading-[1.6] text-erp-ink">{serverError}</p>
        </div>
      )}

      <ConfirmDialog
        open={replace !== null}
        title="기존 근로계약을 대체하시겠습니까?"
        confirmLabel={saving ? "저장 중" : "대체하고 저장"}
        busy={saving}
        wide
        onCancel={() => setReplace(null)}
        onConfirm={() => replace && send(replace.map((c) => c.contractId))}
      >
        <p>새 번호로 이 점포에 진행 중인 근로계약이 있습니다.</p>
        <ul className="mt-[6px] list-disc pl-[18px]">
          {replace?.map((c) => (
            <li key={c.contractId}>{inProgressLine(c, labelOf(labels.contractStatus, c.status))}</li>
          ))}
        </ul>
        <p className="mt-[6px]">대체하면 임시저장은 지우고, 발송 대기 · 서명 대기 · 수정 요청 계약은 종료합니다.</p>
      </ConfirmDialog>
    </div>
  );
}
