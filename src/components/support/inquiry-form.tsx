"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type RefObject } from "react";
import { Button, Field, FormGroup, Select, SlidePanel, Textarea, TextField, useToast } from "@/components/common";
import { useCodes, useCurrentBp } from "@/components/site/session-gate";
import { FailedBand } from "@/components/site/side-parts";
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
// 실패 띠의 둘째 줄 — BP 관리자 등록 패널의 「입력한 값은 그대로 두었습니다.」와 같은 말(2026-11-05 사용자 지정)
const RETRY = "입력한 값과 올린 파일은 그대로 두었습니다.";


export function InquiryFormPanel({ id, open, onClose, trigger }: { id: string; open: boolean; onClose: () => void; trigger: RefObject<HTMLElement | null> }) {
  const router = useRouter();
  const toast = useToast();
  const categories = useCodes("INQUIRY_CATEGORY");
  const bp = useCurrentBp().bpCodeId;
  const [form, setForm] = useState<Form>(EMPTY);
  /** key 는 같은 이름 파일을 둘 올려도 줄을 가르려고 붙인다. */
  const [files, setFiles] = useState<{ key: number; file: File }[]>([]);
  const [rejected, setRejected] = useState<{ name: string; reason: string }[]>([]);
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
      !form.inquiryCategoryCode && "문의 유형을 선택해 주세요.",
      !form.title.trim() && "제목을 입력해 주세요.",
      !form.body.trim() && "문의 내용을 입력해 주세요.",
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
        return setErrors(messages);
      }
      setForm(EMPTY);
      setFiles([]);
      setRejected([]);
      setErrors([]);
      onClose();
      toast(res.ok ? "문의를 등록했습니다." : (body?.messages?.[0] ?? "등록했습니다. 목록에서 확인해 주세요."));
      router.refresh();
    } catch {
      setErrors(["서버에 연결하지 못했습니다. 연결을 확인해 주세요."]);
    } finally {
      setSaving(false);
    }
  };

  // 등록 중에는 Esc 로도 닫히지 않는다 — 닫히면 결과(성공 · 실패 띠)를 못 본다.
  const handleClose = () => {
    if (!saving) onClose();
  };

  return (
    // 바탕창을 깔고 바깥을 누르면 닫는다 — BP 관리자 등록 패널과 같다(2026-11-05 사용자 지정). 등록 중에는 닫지 않는다
    <SlidePanel id={id} open={open} onClose={handleClose} onBackdropClose={handleClose} label="문의하기" trigger={trigger} closeOnBackdrop>
      <h2 className="text-[18px] font-semibold text-erp-ink">문의하기</h2>
      {/* 실패 띠는 BP 관리자 등록 패널과 같은 FailedBand — 첫 줄 이유, 둘째 줄 입력값을 남겼다는 말(2026-11-05 사용자 지정) */}
      {errors.length > 0 && <FailedBand message={errors.join(" ")} detail={RETRY} />}
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
          <TextField value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={TITLE_MAX} placeholder="제목을 입력해 주세요." />
        </Field>
        <Field label="내용" required>
          <Textarea rows={8} value={form.body} onChange={(e) => set("body", e.target.value)} maxLength={BODY_MAX} placeholder={"문의 내용을 입력해 주세요.\n이용 중 문제가 발생한 화면을 함께 알려 주시면 더 빠르게 답변해 드릴 수 있습니다."} />
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
            // 올리지 않은 파일마다 두 줄 — 파일명(먹색) 아래 들여 쓴 「└ 까닭」(빨간 글자), 2026-11-05 사용자 지정.
            // 꺾은선은 플랫폼 메뉴 트리의 2단계 표시처럼 회색이다
            <ul role="status" aria-label="올리지 않은 파일" className="flex flex-col gap-[6px] break-keep text-[14px] leading-[1.6]">
              {rejected.map(({ name, reason }, i) => (
                <li key={i}>
                  <p className="break-all font-medium text-erp-ink">{name}</p>
                  <p className="flex gap-[4px] pl-[6px] text-erp-off">
                    <span aria-hidden="true" className="text-erp-muted">
                      └
                    </span>
                    <span>{reason}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
          {/* 안내는 낱말 중간에서 끊지 않는다(등록 뒤 첨부 변경 불가 문구는 뺐다) — 「(파일당 10MB 이하)」는 한 덩어리로 둔다(2026-11-05 사용자 지정) */}
          <div className="flex flex-col break-keep text-[14px] leading-[1.6] text-erp-label">
            <p>
              JPG, PNG, PDF 파일을 최대 {MAX_ATTACHMENTS}개까지 첨부할 수 있습니다. <span className="whitespace-nowrap">(파일당 10MB 이하)</span>
            </p>
          </div>
        </div>
      </FormGroup>
      <div className="flex justify-center gap-[6px]">
        <Button variant="off" onClick={onClose} disabled={saving}>
          취소
        </Button>
        {/* 버튼 이름은 다른 등록 패널과 같은 [저장](2026-11-05 사용자 지정 — 전엔 [문의 등록]) */}
        <Button onClick={handleSubmit} disabled={saving}>
          저장
        </Button>
      </div>
    </SlidePanel>
  );
}
