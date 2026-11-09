"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type RefObject } from "react";
import { AttachmentField, FieldMessage, Button, Field, FormGroup, Select, SlidePanel, Textarea, TextField, useFilePreviews, useToast } from "@/components/common";
import { useCodes, useCurrentBp } from "@/components/site/session-gate";
import { PASSWORD_REQUIRED_EVENT } from "@/lib/bff";
import { bpPath } from "@/lib/bp-path";
import { BODY_MAX, FILE_ACCEPT, MAX_ATTACHMENTS, PASSWORD_REQUIRED_PREFIX, pickInquiryFiles, SESSION_EXPIRED, TITLE_MAX } from "@/lib/community-view";
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
  /** 등록 요청을 보냈다가 실패했다 — 그때만 「입력한 값 … 그대로 두었습니다」를 붙인다(빈 칸 확인은 보낸 적이 없다, 리뷰 반영) */
  const [sentFailed, setSentFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const nextKey = useRef(0);
  // 빈 칸은 그 입력칸 바로 아래 8px 에 문구로만 알린다 — 칸 테두리는 칠하지 않는다(공통 FieldMessage · BP 관리자 등록 패널과 같은 자리, 2026-11-06 사용자 지정).
  // 띠에 모으지 않는다. 칸을 고치면 그 칸 것만 내린다(PL-SPGSWC)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"inquiryCategoryCode" | "title" | "body", string>>>({});
  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((prev) => (key in prev ? { ...prev, [key]: undefined } : prev));
  };

  const previews = useFilePreviews(files);
  const handleFiles = (picked: File[]) => {
    const { accepted, rejected } = pickInquiryFiles(files.length, picked);
    setFiles((prev) => [...prev, ...accepted.map((file) => ({ key: nextKey.current++, file }))]);
    setRejected(rejected);
  };

  const handleSubmit = async () => {
    const missing: Partial<Record<"inquiryCategoryCode" | "title" | "body", string>> = {
      ...(!form.inquiryCategoryCode && { inquiryCategoryCode: "문의 유형을 선택해 주세요." }),
      ...(!form.title.trim() && { title: "제목을 입력해 주세요." }),
      ...(!form.body.trim() && { body: "문의 내용을 입력해 주세요." }),
    };
    if (Object.keys(missing).length) {
      setSentFailed(false);
      setErrors([]);
      return setFieldErrors(missing);
    }
    setFieldErrors({});
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
        setSentFailed(true);
        return setErrors(messages);
      }
      setForm(EMPTY);
      setFiles([]);
      setRejected([]);
      setErrors([]);
      setFieldErrors({});
      onClose();
      toast(res.ok ? "문의를 등록했습니다." : (body?.messages?.[0] ?? "등록했습니다. 목록에서 확인해 주세요."));
      router.refresh();
    } catch {
      setSentFailed(true);
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
      {/* 실패 띠는 BP 관리자 등록 패널의 FailedBand 와 같은 모양 — 이유는 한 줄씩(한 문장으로 이으면 무엇이 문제인지 가르기 어려웠다, 리뷰 반영),
          「입력한 값 … 그대로」는 실제로 보냈다가 실패했을 때만 먹색으로 덧붙인다(2026-11-05 사용자 지정) */}
      {errors.length > 0 && (
        <div role="alert" className="rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off">
          {errors.map((m, i) => (
            <p key={i} className="font-medium">
              {m}
            </p>
          ))}
          {sentFailed && <p className="text-erp-ink">{RETRY}</p>}
        </div>
      )}
      <FormGroup title="문의 내용">
        <div className="flex flex-col gap-[8px]">
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
        <FieldMessage id="inquiry-category-error" message={fieldErrors.inquiryCategoryCode} />
        </div>
        <div className="flex flex-col gap-[8px]">
        <Field label="제목" required>
          <TextField value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={TITLE_MAX} placeholder="제목을 입력해 주세요." aria-describedby={fieldErrors.title ? "inquiry-title-error" : undefined} />
        </Field>
        <FieldMessage id="inquiry-title-error" message={fieldErrors.title} />
        </div>
        <div className="flex flex-col gap-[8px]">
        <Field label="내용" required>
          <Textarea rows={8} value={form.body} onChange={(e) => set("body", e.target.value)} maxLength={BODY_MAX} placeholder={"문의 내용을 입력해 주세요.\n이용 중 문제가 발생한 화면을 함께 알려 주시면 더 빠르게 답변해 드릴 수 있습니다."} aria-describedby={fieldErrors.body ? "inquiry-body-error" : undefined} />
        </Field>
        <FieldMessage id="inquiry-body-error" message={fieldErrors.body} />
        </div>
        <div className="flex flex-col gap-[8px]">
          <span className="text-[14px] font-medium text-erp-label">
            첨부파일 <span className="ml-[4px] text-[12px] font-normal text-erp-muted">{files.length} / {MAX_ATTACHMENTS}</span>
          </span>
          {/* 공통 첨부 칸 — 공지사항 등록과 같은 모양: 그림은 64px 썸네일, 맞지 않는 파일은 파일명 아래 「└ 까닭」(2026-11-06 사용자 지정) */}
          <AttachmentField
            busy={saving}
            accept={FILE_ACCEPT}
            canPick={files.length < MAX_ATTACHMENTS}
            onPick={handleFiles}
            rejected={rejected}
            note={
              <>
                JPG, PNG, PDF 파일을 최대 {MAX_ATTACHMENTS}개까지 첨부할 수 있습니다. <span className="whitespace-nowrap">(파일당 10MB 이하)</span>
              </>
            }
            rows={files.map(({ key, file }) => ({
              key,
              name: file.name,
              size: file.size,
              preview: previews.get(key),
              onRemove: () => {
                setFiles((prev) => prev.filter((f) => f.key !== key));
                setRejected([]);
              },
            }))}
          />
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
