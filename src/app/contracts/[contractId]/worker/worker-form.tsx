"use client";

import { unstable_rethrow, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button, Checkbox, ConfirmDialog, DateField, Field, FormGroup, FormRow, Radio, TextField } from "@/components/common";
import { labelOf, type EnumValue } from "@/lib/enums";
import { formatPhone, GENDERS, inProgressLine, type InProgressContract } from "../../new/contract-form-model";
import { updateWorker } from "../actions";
import { callSave, SAVE_CALL_LOST } from "../send-model";
import { workerBody, workerProblems, workerSaveNote, type WorkerForm as Form } from "./worker-model";

// 날인 전 근로자 정보 수정(WHALEERP-125 「본인 대조」 · 126). 링크를 못 받았다는 직원과 유선으로 번호를 확인했거나,
// 직원이 가입 값과 달라 수정을 요청했을 때 쓴다. 다섯 칸은 직원이 가입하며 넣는 값과 대조된다.
export function WorkerForm({
  contractId,
  status,
  initial,
  labels,
}: {
  contractId: number;
  status: string;
  initial: Form;
  labels: { gender: EnumValue[]; contractStatus: EnumValue[] };
}) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(initial);
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState("");
  const [saving, startSaving] = useTransition();
  // 새 번호로 같은 점포에 진행 중 계약이 있으면(409) 대체할지 묻는다 — 작성 화면과 같다
  const [replace, setReplace] = useState<InProgressContract[] | null>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const [failures, setFailures] = useState(0);
  useEffect(() => {
    if (failures) failureRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [failures]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const issues = workerProblems(form);
  const send = (replaceContractIds?: number[]) =>
    startSaving(async () => {
      // 성공하면 액션이 상세로 보낸다. 돌아왔다면 실패다.
      // 액션의 redirect(성공 · 보내기 실패)는 callSave 가 다시 던져 그 목적지로 간다
      const result = await callSave(() => updateWorker(contractId, workerBody(form, replaceContractIds)), unstable_rethrow);
      if (result === SAVE_CALL_LOST) {
        // 서버 액션 호출 자체가 끊겼다 — 저장하면 다시 보내므로 이미 보냈을 수 있다. 같은 폼으로 다시 저장하지 않게 상세로(front #50 재리뷰)
        router.replace(`/contracts/${contractId}?send=unknown`);
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
    setTried(true);
    setServerError("");
    if (issues.length) {
      setFailures((n) => n + 1);
      return;
    }
    send();
  };

  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex items-end gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">근로자 정보 수정</h2>
        <Button variant="off" href={`/contracts/${contractId}`}>
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
          <Field label="이름" required>
            <TextField value={form.name} maxLength={50} aria-required onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="휴대전화번호" required>
            <TextField value={form.phone} inputMode="tel" placeholder="010-0000-0000" maxLength={13} aria-required onChange={(e) => set("phone", formatPhone(e.target.value))} />
          </Field>
        </FormRow>
        <FormRow>
          <div className="flex min-w-px flex-1 flex-col gap-[8px]">
            <span className="text-[14px] font-medium text-erp-label">생년월일 *</span>
            <DateField aria-label="생년월일" autoHyphen value={form.birthDate} onChange={(v) => set("birthDate", v)} />
          </div>
          <div role="group" aria-label="성별" className="flex min-w-px flex-1 flex-col gap-[8px]">
            <span className="text-[14px] font-medium text-erp-label">성별 *</span>
            <div role="radiogroup" className="flex min-h-[34px] flex-wrap items-center gap-x-[18px] gap-y-[8px]">
              {GENDERS.map((v) => (
                <Radio key={v} name="gender" label={labelOf(labels.gender, v)} checked={form.gender === v} onChange={() => set("gender", v)} />
              ))}
              <Checkbox label="외국인" checked={form.isForeigner} onChange={(e) => set("isForeigner", e.target.checked)} />
            </div>
          </div>
        </FormRow>
      </FormGroup>

      {(serverError || (tried && issues.length > 0)) && (
        <div ref={failureRef} role="alert" className="flex flex-col gap-[4px] rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px]">
          <p className="text-[14px] font-semibold text-erp-off">저장하지 못했습니다</p>
          <ul className="list-disc pl-[18px] text-[14px] leading-[1.6] text-erp-ink">
            {(serverError ? [serverError] : issues).map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
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
