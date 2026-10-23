"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode, type RefObject } from "react";
import { Button, Field, FormGroup, Select, SlidePanel, Textarea, TextField, useToast } from "@/components/common";
import { useCodes, useCurrentBp } from "@/components/site/session-gate";
import { PASSWORD_REQUIRED_EVENT } from "@/lib/bff";
import { bpPath } from "@/lib/bp-path";
import { BODY_MAX, FILE_ACCEPT, MAX_ATTACHMENTS, PASSWORD_REQUIRED_PREFIX, pickInquiryFiles, SESSION_EXPIRED, sizeLabel, TITLE_MAX } from "@/lib/community-view";
import { INQUIRY_SAVE_ROUTE } from "@/lib/paper-request";

// 문의 등록 패널(#284, 데모 support/inquiries 의 inquiry-form). 문의 유형 · 제목 · 내용 · 첨부(CNT-18)를 multipart 로
// 라우트 핸들러(support-inquiries/save)에 보낸다. 6번째 · 10MB 초과 · 다른 종류 파일은 고를 때 그 파일만 거절한다.
// 실패하면(같은 문의 5분 안 409 · 검증 · 연결) 쓴 내용과 올린 파일을 그대로 두고 까닭과 다시 하는 방법을 띠에 보인다.
// 성공하면 칸을 비우고 닫은 뒤 목록을 새로 받는다.

type Form = { inquiryCategoryCode: string; title: string; body: string };
const EMPTY: Form = { inquiryCategoryCode: "", title: "", body: "" };
const RETRY = "쓴 내용과 올린 파일은 그대로 두었습니다. 고친 뒤 다시 [문의 등록]을 눌러 주세요.";

const Note = ({ children }: { children: ReactNode }) => <p className="text-[13px] leading-[1.6] text-erp-label">{children}</p>;

export function InquiryFormPanel({ id, open, onClose, trigger }: { id: string; open: boolean; onClose: () => void; trigger: RefObject<HTMLElement | null> }) {
  const router = useRouter();
  const toast = useToast();
  const categories = useCodes("INQUIRY_CATEGORY");
  const bp = useCurrentBp().bpCodeId;
  const [form, setForm] = useState<Form>(EMPTY);
  /** key 는 같은 이름 파일을 둘 올려도 줄을 가르려고 붙인다. */
  const [files, setFiles] = useState<{ key: number; file: File }[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const nextKey = useRef(0);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleFiles = (list: FileList | null) => {
    const { accepted, rejected } = pickInquiryFiles(files.length, Array.from(list ?? []));
    setFiles((prev) => [...prev, ...accepted.map((file) => ({ key: nextKey.current++, file }))]);
    setRejected(rejected);
    // 같은 파일을 빼고 다시 고를 수 있게 비운다.
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleSubmit = async () => {
    const missing = [
      !form.inquiryCategoryCode && "문의 유형을 골라 주세요",
      !form.title.trim() && "제목을 입력해 주세요",
      !form.body.trim() && "문의 내용을 입력해 주세요",
    ].filter((m): m is string => !!m);
    if (missing.length) return setErrors(missing);
    const data = new FormData();
    for (const [key, value] of Object.entries(form)) data.set(key, value);
    for (const { file } of files) data.append("files", file);
    setSaving(true);
    try {
      // 창구 주소에도 탭 BP 를 붙인다 — proxy 가 떼어 이 핸들러로 보내며 X-Bp-Code-Id 를 싣는다(front #82).
      const res = await fetch(bpPath(bp, INQUIRY_SAVE_ROUTE), { method: "POST", body: data });
      const body = (await res.json().catch(() => null)) as { messages?: string[]; registered?: boolean } | null;
      // 등록은 됐는데 결과만 못 읽었으면(registered) 성공처럼 칸을 비우고 닫는다 — 남겨 두면 다시 눌러 같은 문의가 또 생긴다.
      if (!res.ok && !body?.registered) {
        // proxy 가 먼저 막은 401 은 본문이 { message } 라 문구를 여기서 정한다.
        const messages = res.status === 401 ? [SESSION_EXPIRED] : (body?.messages ?? [`등록하지 못했습니다 (HTTP ${res.status}).`]);
        // 비밀번호 강제 변경 403 이면 SessionGate 가 변경 팝업을 다시 띄운다(BFF 와 같은 이벤트).
        if (messages[0]?.startsWith(PASSWORD_REQUIRED_PREFIX)) dispatchEvent(new Event(PASSWORD_REQUIRED_EVENT));
        return setErrors([...messages, RETRY]);
      }
      setForm(EMPTY);
      setFiles([]);
      setRejected([]);
      setErrors([]);
      onClose();
      toast(res.ok ? "문의를 등록했습니다." : (body?.messages?.[0] ?? "등록했습니다. 목록에서 확인해 주세요."));
      router.refresh();
    } catch {
      setErrors(["서버에 연결하지 못했습니다. 연결을 확인해 주세요.", RETRY]);
    } finally {
      setSaving(false);
    }
  };

  // 등록 중에는 Esc 로도 닫히지 않는다 — 닫히면 결과(성공 · 실패 띠)를 못 본다.
  const handleClose = () => {
    if (!saving) onClose();
  };

  return (
    <SlidePanel id={id} open={open} onClose={handleClose} label="문의하기" trigger={trigger}>
      <h2 className="text-[18px] font-semibold text-erp-ink">문의하기</h2>
      {errors.length > 0 && (
        <div role="alert" className="flex flex-col gap-[4px] rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off">
          {errors.map((m, i) => (
            <p key={i}>{m}</p>
          ))}
        </div>
      )}
      <FormGroup title="문의 내용">
        <Field label="분류" required>
          <Select value={form.inquiryCategoryCode} onChange={(e) => set("inquiryCategoryCode", e.target.value)}>
            <option value="">선택</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="제목" required>
          <TextField value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={TITLE_MAX} placeholder="한 줄로 적어 주세요" />
        </Field>
        <Field label="내용" required>
          <Textarea rows={8} value={form.body} onChange={(e) => set("body", e.target.value)} maxLength={BODY_MAX} placeholder="어떤 화면에서 무엇을 하려다 막혔는지 적어 주시면 빨리 답할 수 있습니다." />
        </Field>
        <div className="flex flex-col gap-[8px]">
          <span className="text-[14px] font-medium text-erp-label">
            첨부파일 <span className="ml-[4px] text-[12px] font-normal text-erp-muted">{files.length} / {MAX_ATTACHMENTS}</span>
          </span>
          <div>
            <input ref={fileInput} type="file" multiple accept={FILE_ACCEPT} hidden onChange={(e) => handleFiles(e.target.files)} />
            <Button variant="soft" disabled={saving || files.length >= MAX_ATTACHMENTS} onClick={() => fileInput.current?.click()}>
              파일 선택
            </Button>
          </div>
          {files.length > 0 && (
            <ul aria-label="올린 파일">
              {files.map(({ key, file }) => (
                <li key={key} className="flex h-[34px] items-center gap-[10px] border-b border-erp-divider text-[14px]">
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="text-erp-label">{sizeLabel(file.size)}</span>
                  <button type="button" disabled={saving} onClick={() => setFiles((prev) => prev.filter((f) => f.key !== key))} className="text-erp-link hover:underline">
                    빼기
                  </button>
                </li>
              ))}
            </ul>
          )}
          {rejected.length > 0 && (
            <div role="status" className="flex flex-col gap-[2px] text-[13px] leading-[1.6] text-erp-off">
              {rejected.map((m, i) => (
                <p key={i}>{m}</p>
              ))}
            </div>
          )}
          <Note>이미지(JPG · PNG) · PDF, {MAX_ATTACHMENTS}개까지, 파일당 10MB. 맞지 않는 파일은 그 파일만 올리지 않고 알려 드립니다. 등록한 뒤에는 첨부를 더하거나 뺄 수 없습니다.</Note>
        </div>
      </FormGroup>
      <Note>같은 문의를 5분 안에 다시 등록하거나 등록에 실패하면 까닭을 알려 드립니다. 쓴 내용과 올린 파일은 그대로 두니 고친 뒤 다시 [문의 등록]을 누르세요.</Note>
      <div className="flex justify-center gap-[6px]">
        <Button variant="off" onClick={onClose} disabled={saving}>
          취소
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          문의 등록
        </Button>
      </div>
    </SlidePanel>
  );
}
