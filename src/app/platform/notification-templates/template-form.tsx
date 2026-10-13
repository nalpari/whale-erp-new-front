"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import { Button, Checkbox, ConfirmDialog, DataTable, PageBar, Select, Textarea, TextField, Toggle, useToast, type Column } from "@/components/common";
import type { EnumValue } from "@/lib/enums";
import { formatAt } from "@/lib/notification-view";
import {
  fillSamples,
  hasButtonLink,
  PUSH_LIMIT,
  templateInput,
  validateTemplate,
  withPrefix,
  type Channel,
  type TemplateForm as Form,
  type TemplateVariable,
} from "@/lib/notification-template-view";
import type { TemplateDetail } from "@/lib/notification-templates";
import { createTemplateAction, restoreTemplateAction, setTemplateActiveAction, updateTemplateAction, type TemplateResult } from "./actions";

// 알림 템플릿 수정 · 등록(#576 · #582, 목업 notify/templates-edit.html · templates-new.html, 데모 src/template-edit.mjs).
// 등록한 것과 기본 문구 모두 모든 칸을 고친다(NOTIFY-10). 템플릿은 채널 + 템플릿 이름 + 템플릿 코드로 구분한다(NOTIFY-11).
// 저장 전에 api 와 같은 규칙으로 먼저 검사해 폼 위 빨간 띠에 보이고, api 가 최종으로 다시 본다.

const BASE = "/platform/notification-templates";
const HELP = "text-[12px] leading-[1.5] text-erp-muted";

/** 변수 목록 줄. key 는 입력칸이 줄을 잃지 않게 화면에서만 붙이고, 보낼 때는 templateInput 이 뺀다. */
type Row = TemplateVariable & { key: number };
/** 등록은 채널을 고르기 전(「선택」)에 시작한다. */
type Draft = Omit<Form, "channel" | "variables"> & { channel: Channel | ""; variables: Row[] };

let nextKey = 0;
const rowOf = (v: TemplateVariable): Row => ({ ...v, key: nextKey++ });
const emptyRow = (): Row => rowOf({ name: "", label: "", isRequired: false, sampleValue: "", isButtonLink: false });

function draftOf(d: TemplateDetail | undefined): Draft {
  return {
    channel: d?.channel ?? "",
    templateName: d?.templateName ?? "",
    templateCode: d?.templateCode ?? "",
    preferenceCategory: d?.preferenceCategory ?? "",
    title: d?.title ?? "",
    body: d?.body ?? "",
    kakaoTemplateCode: d?.kakaoTemplateCode ?? "",
    variables: (d?.variables ?? []).map(rowOf),
  };
}

// 라벨 · 입력 · 도움말 한 칸. 공통 Field 는 라벨이 글자뿐이라 필수 표시와 글자 수를 달 수 없어 여기서 묶는다(근로계약서 초안과 같은 모양).
function Item({ label, count, help, children }: { label: string; count?: { now: number; max: number }; help?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="flex min-w-px flex-1 flex-col gap-[8px]">
      <label htmlFor={id} className="truncate text-[14px] font-medium text-erp-label">
        {label}{" "}
        <span aria-hidden className="text-[#e93737]">
          *
        </span>
        <span className="sr-only">(필수)</span>
        {count && (
          <span className={`ml-[6px] text-[12px] font-normal ${count.now > count.max ? "text-erp-off" : "text-erp-muted"}`}>
            {count.now} / {count.max}
          </span>
        )}
      </label>
      {children(id)}
      {help && <span className={HELP}>{help}</span>}
    </div>
  );
}

// 제목 줄이 있는 카드(데모 staff-parts.mjs 의 box). pad 가 없으면 표를 그대로 담는다.
function Box({ title, right, pad = true, children }: { title: string; right?: ReactNode; pad?: boolean; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <h3 className="flex h-[42px] items-center gap-[6px] rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">
        <span className="flex-1">{title}</span>
        {right && <span className="flex items-center gap-[6px] text-[14px] font-normal">{right}</span>}
      </h3>
      {pad ? <div className="flex flex-col gap-[18px] rounded-b-[2px] border border-erp-thead-line bg-white p-[16px]">{children}</div> : children}
    </section>
  );
}

const Note = ({ children }: { children: ReactNode }) => <p className="text-[13px] leading-[1.6] text-erp-label">{children}</p>;
const Caption = ({ children }: { children: ReactNode }) => <span className="text-[13px] font-medium text-erp-label">{children}</span>;

// 운영 알림함 · 직원 근무 앱 알림함 한 줄
const InboxLine = ({ title, sub }: { title: string; sub: string }) => (
  <div className="flex flex-col gap-[4px] rounded-[2px] border border-erp-panel-line bg-white px-[16px] py-[12px]">
    <b className="text-[14px] font-semibold text-erp-ink">{title}</b>
    <span className="truncate text-[12px] text-erp-muted">{sub}</span>
  </div>
);

/** 채널 모양 미리보기. 예시 값으로 채운다. 새 회색을 만들지 않고 흰 바탕 · 표 머리 바탕 · 1px 선으로만 나눈다(데모와 같다). */
function Preview({ channel, title, body, button }: { channel: Channel | ""; title: string; body: string; button: boolean }) {
  if (channel === "EMAIL")
    return (
      <>
        <Caption>메일 · 공통 메일 틀</Caption>
        <div className="overflow-hidden rounded-[2px] border border-erp-panel-line bg-white">
          <div className="border-b border-erp-panel-line px-[16px] py-[12px] text-[14px] font-semibold text-erp-ink">{title}</div>
          <div className="flex flex-col gap-[16px] p-[16px] text-[14px] leading-[1.7] text-erp-ink">
            <p className="whitespace-pre-line">{body}</p>
            {button && (
              <span>
                <Button>바로가기</Button>
              </span>
            )}
          </div>
          <div className="border-t border-erp-panel-line bg-erp-thead-bg px-[16px] py-[12px] text-[12px] text-erp-muted">WHALE ERP 운영 알림 · 이 메일은 발신 전용입니다</div>
        </div>
      </>
    );
  if (channel === "PUSH")
    return (
      <>
        <Caption>잠금 화면 푸시</Caption>
        <div className="grid grid-cols-[28px_1fr] gap-x-[12px] gap-y-[4px] rounded-[8px] border border-erp-panel-line bg-erp-thead-bg px-[16px] py-[12px]">
          <span aria-hidden className="row-span-2 size-[28px] rounded-[2px] bg-erp-nav" />
          <b className="text-[14px] font-semibold text-erp-ink">{title}</b>
          <span className="text-[14px] leading-[1.5] whitespace-pre-line text-erp-ink">{body}</span>
        </div>
        <Caption>직원 근무 앱 알림함 한 줄</Caption>
        <InboxLine title={title} sub={body} />
      </>
    );
  if (channel === "NOTIFICATION")
    return (
      <>
        <Caption>관리자 웹 운영 알림함 한 줄</Caption>
        <InboxLine title={title} sub={body} />
      </>
    );
  if (channel === "ALIMTALK")
    return (
      <>
        <Caption>카카오 알림톡</Caption>
        <div className="rounded-[4px] bg-erp-thead-bg p-[16px]">
          <div className="max-w-[300px] overflow-hidden rounded-[8px] border border-erp-panel-line bg-white">
            <div className="bg-erp-on-bg px-[12px] py-[8px] text-[12px] font-semibold text-erp-ink">알림톡 도착</div>
            <p className="px-[12px] py-[12px] text-[14px] leading-[1.6] whitespace-pre-line text-erp-ink">{body}</p>
            {button && <div className="mx-[12px] mb-[12px] rounded-[2px] border border-erp-button-line py-[8px] text-center text-[13px] text-erp-ink">바로가기</div>}
          </div>
        </div>
      </>
    );
  return <span className={HELP}>채널을 고르고 본문을 넣으면 채널 모양으로 보입니다.</span>;
}

export function TemplateForm({ detail, channels, categories }: { detail?: TemplateDetail; channels: EnumValue[]; categories: EnumValue[] }) {
  const isNew = !detail;
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() => draftOf(detail));
  /** 마지막으로 api 에서 받은 값 — 잠금용 updatedAt, 원래 템플릿 코드, 기본 문구 유무, 변경 이력. */
  const [saved, setSaved] = useState(detail);
  const [isActive, setIsActive] = useState(detail?.isActive ?? true);
  const [errors, setErrors] = useState<string[]>([]);
  const [dialog, setDialog] = useState<"save" | "restore" | null>(null);
  const [busy, startTransition] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setRow = (key: number, patch: Partial<TemplateVariable>) =>
    setDraft((d) => ({ ...d, variables: d.variables.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));

  const { channel } = draft;
  const talk = channel === "ALIMTALK";
  const push = channel === "PUSH";
  const linkColumn = hasButtonLink(channel);

  const showErrors = (messages: string[]) => {
    setErrors(messages);
    // 띠가 화면 밖일 수 있어 띠로 올려 보인다.
    if (messages.length) requestAnimationFrame(() => errorRef.current?.scrollIntoView({ block: "nearest" }));
  };

  // 등록에서 채널을 고르면 템플릿 코드의 접두만 바꾸고 운영자가 넣은 나머지는 둔다(NOTIFY-11). 수정에서는 코드를 건드리지 않는다.
  const changeChannel = (value: Channel | "") =>
    setDraft((d) => ({ ...d, channel: value, templateCode: isNew && value ? withPrefix(value, d.templateCode) : d.templateCode }));

  // 변수 단추 — 본문 커서 자리에 #{이름} 을 넣고 커서를 그 뒤로 옮긴다.
  const insertVariable = (name: string) => {
    const el = bodyRef.current;
    const token = `#{${name}}`;
    const start = el?.selectionStart ?? draft.body.length;
    const end = el?.selectionEnd ?? start;
    set("body", draft.body.slice(0, start) + token + draft.body.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const finish = (result: TemplateResult, after: (detail: TemplateDetail) => void) => {
    if (!result.ok) {
      showErrors(result.messages);
      return;
    }
    showErrors([]);
    after(result.detail);
  };
  const reload = (d: TemplateDetail) => {
    setSaved(d);
    setDraft(draftOf(d));
    setIsActive(d.isActive);
  };

  const submit = () => {
    if (!draft.channel) return;
    const input = templateInput({ ...draft, channel: draft.channel });
    startTransition(async () => {
      setDialog(null);
      if (!saved) {
        finish(await createTemplateAction(input, isActive), (d) => {
          toast("saved");
          router.push(`${BASE}/${d.id}`);
        });
        return;
      }
      finish(await updateTemplateAction(saved.id, input, saved.updatedAt), (d) => {
        reload(d);
        toast("updated");
      });
    });
  };

  // 저장 — 화면 검사를 먼저 하고, 등록 · 수정 모두 확인창을 거쳐 보낸다(데모와 같게, 2026-10-13 재영).
  const codeChanged = !!saved && draft.templateCode.trim() !== saved.templateCode;
  const handleSave = () => {
    const messages = draft.channel ? validateTemplate(templateInput({ ...draft, channel: draft.channel })) : ["발송 채널을 골라 주세요."];
    showErrors(messages);
    if (messages.length) return;
    setDialog("save");
  };

  const handleRestore = () =>
    saved &&
    startTransition(async () => {
      setDialog(null);
      finish(await restoreTemplateAction(saved.id, saved.updatedAt), (d) => {
        // 되돌리기는 제목 · 본문 · 변수 목록만 바꾼다(NOTIFY-18) — 저장하지 않은 이름 · 코드 등 다른 입력은 그대로 둔다.
        const restored = draftOf(d);
        setSaved(d);
        setDraft((prev) => ({ ...prev, title: restored.title, body: restored.body, variables: restored.variables }));
        toast("updated");
      });
    });

  // 수정 화면의 사용 스위치는 바로 저장한다. 고치던 다른 칸은 그대로 두고 잠금용 updatedAt 만 새 값으로 바꾼다.
  const handleActive = (next: boolean) => {
    if (!saved) {
      setIsActive(next);
      return;
    }
    startTransition(async () => {
      finish(await setTemplateActiveAction(saved.id, next, saved.updatedAt), (d) => {
        setSaved(d);
        setIsActive(d.isActive);
        toast("updated");
      });
    });
  };

  const named = draft.variables.filter((v) => v.name.trim());
  const filled = (text: string) => fillSamples(text, named.map((v) => ({ ...v, name: v.name.trim() })));

  const varColumns: Column<Row>[] = [
    {
      header: "변수 이름",
      width: "w-[150px]",
      cell: (r) => <TextField aria-label="변수 이름" value={r.name} onChange={(e) => setRow(r.key, { name: e.target.value })} />,
    },
    {
      header: "표시 이름",
      width: "w-[150px]",
      cell: (r) => <TextField aria-label="표시 이름" value={r.label} onChange={(e) => setRow(r.key, { label: e.target.value })} />,
    },
    {
      header: "필수",
      width: "w-[64px]",
      cell: (r) => (
        <span className="inline-flex justify-center">
          <Checkbox label="" aria-label="필수" checked={r.isRequired} onChange={(e) => setRow(r.key, { isRequired: e.target.checked })} />
        </span>
      ),
    },
    {
      header: "예시 값",
      cell: (r) => <TextField aria-label="예시 값" value={r.sampleValue} onChange={(e) => setRow(r.key, { sampleValue: e.target.value })} />,
    },
    // 버튼 링크는 메일 · 알림톡에서만 보인다(NOTIFY-20). 켠 변수는 필수 변수 검사에서 빠지고 공통 메일 틀 · 알림톡 버튼이 붙인다.
    ...(linkColumn
      ? [
          {
            header: "버튼 링크",
            width: "w-[84px]",
            cell: (r: Row) => (
              <span className="inline-flex justify-center">
                <Checkbox label="" aria-label="버튼 링크" checked={Boolean(r.isButtonLink)} onChange={(e) => setRow(r.key, { isButtonLink: e.target.checked })} />
              </span>
            ),
          } satisfies Column<Row>,
        ]
      : []),
    {
      header: "",
      width: "w-[96px]",
      cell: (r) => (
        <Button variant="off" onClick={() => set("variables", draft.variables.filter((v) => v.key !== r.key))}>
          삭제
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageBar title={isNew ? "알림 템플릿 등록" : "알림 템플릿 수정"}>
        <div className="flex items-center gap-[6px]">
          <Button variant="off" href={`${BASE}${saved ? `?channel=${saved.channel}` : ""}`}>
            목록
          </Button>
          {saved?.hasDefault && (
            <Button variant="soft" disabled={busy} onClick={() => setDialog("restore")}>
              기본 문구로 되돌리기
            </Button>
          )}
          <Button disabled={busy} onClick={handleSave}>
            저장
          </Button>
        </div>
      </PageBar>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          {errors.length > 0 && (
            <div ref={errorRef} role="alert" className="flex flex-col gap-[4px] rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off">
              {errors.map((m, i) => (
                <p key={i}>{m}</p>
              ))}
            </div>
          )}
          <div className="grid grid-cols-[7fr_5fr] items-start gap-[24px]">
            <div className="flex min-w-0 flex-col gap-[24px]">
              <Box title="템플릿" right={<Toggle label="사용" checked={isActive} disabled={busy} onChange={(e) => handleActive(e.target.checked)} />}>
                <div className="flex w-full gap-[6px]">
                  <Item label="발송 채널">
                    {(id) => (
                      <Select id={id} value={channel} onChange={(e) => changeChannel(e.target.value as Channel | "")}>
                        {isNew && <option value="">선택</option>}
                        {channels.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Item>
                  <Item label="템플릿 이름">{(id) => <TextField id={id} value={draft.templateName} maxLength={100} onChange={(e) => set("templateName", e.target.value)} />}</Item>
                </div>
                <div className="flex w-full gap-[6px]">
                  <Item
                    label="템플릿 코드"
                    help={isNew ? "채널을 고르면 접두(NTF_ · PUSH_ · EMAIL_ · TALK_)가 채워지고, 나머지는 직접 넣습니다." : "바꾸면 발송 코드도 함께 바꿔야 할 수 있습니다."}
                  >
                    {(id) => <TextField id={id} value={draft.templateCode} onChange={(e) => set("templateCode", e.target.value)} />}
                  </Item>
                  {push && (
                    <Item label="수신 설정 묶음" help="직원 알림 수신 설정이 이 묶음으로 켜고 끕니다.">
                      {(id) => (
                        <Select id={id} value={draft.preferenceCategory} onChange={(e) => set("preferenceCategory", e.target.value as Draft["preferenceCategory"])}>
                          <option value="">선택</option>
                          {categories.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Item>
                  )}
                  {talk && (
                    <Item label="카카오 템플릿 코드" help="카카오에 등록한 코드입니다.">
                      {(id) => <TextField id={id} value={draft.kakaoTemplateCode} onChange={(e) => set("kakaoTemplateCode", e.target.value)} />}
                    </Item>
                  )}
                </div>
              </Box>

              <Box title="문구">
                {!talk && (
                  <Item label="제목" count={push ? { now: draft.title.length, max: PUSH_LIMIT.title } : undefined}>
                    {(id) => <TextField id={id} value={draft.title} onChange={(e) => set("title", e.target.value)} />}
                  </Item>
                )}
                {channel === "EMAIL" && <Note>일반 글로 씁니다. 머리 · 꼬리와 버튼은 공통 메일 틀이 붙입니다.</Note>}
                {talk && <Note>카카오 검수를 받은 문구와 한 글자라도 다르면 발송되지 않습니다. 검수를 받은 뒤 고쳐 주세요.</Note>}
                <div className="flex flex-col gap-[8px]">
                  <span className="text-[14px] font-medium text-erp-label">변수</span>
                  {named.length > 0 ? (
                    <div className="flex flex-wrap gap-[6px]">
                      {named.map((v) => (
                        <Button key={v.key} variant="off" onClick={() => insertVariable(v.name.trim())}>
                          {v.name.trim()}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                  <span className={HELP}>누르면 본문 커서 자리에 들어갑니다. 단추는 변수 목록에서 만들어집니다.</span>
                </div>
                <Item label="본문" count={push ? { now: draft.body.length, max: PUSH_LIMIT.body } : undefined}>
                  {(id) => <Textarea id={id} ref={bodyRef} rows={channel === "EMAIL" ? 8 : 4} value={draft.body} onChange={(e) => set("body", e.target.value)} />}
                </Item>
              </Box>

              <Box
                title="변수 목록"
                pad={false}
                right={
                  <Button variant="off" onClick={() => set("variables", [...draft.variables, emptyRow()])}>
                    줄 추가
                  </Button>
                }
              >
                <DataTable columns={varColumns} rows={draft.variables} rowKey={(r) => r.key} empty="변수가 없습니다. 줄 추가로 넣습니다." />
              </Box>
            </div>

            <div className="flex min-w-0 flex-col gap-[24px]">
              <Box title="미리보기">
                <Preview
                  channel={channel}
                  title={filled(draft.title)}
                  body={filled(draft.body)}
                  button={linkColumn && draft.variables.some((v) => v.isButtonLink)}
                />
              </Box>
              {saved && (
                <Box title="변경 이력" pad={false}>
                  <DataTable
                    columns={[
                      { header: "일시", width: "w-[120px]", cell: (h) => <span className="font-mono text-erp-muted">{formatAt(h.changedAt)}</span> },
                      { header: "수정자", width: "w-[100px]", cell: (h) => h.changedByName ?? "시스템" },
                      { header: "바뀐 것", align: "left", cell: (h) => h.summary },
                    ]}
                    rows={saved.histories}
                    rowKey={(h) => `${h.changedAt}-${h.summary}`}
                    empty="변경 이력이 없습니다."
                  />
                </Box>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog open={dialog === "save"} title="저장하시겠습니까?" confirmLabel="저장" busy={busy} onConfirm={submit} onCancel={() => setDialog(null)}>
        {codeChanged && "템플릿 코드가 바뀝니다. 발송 코드에서 이 템플릿 코드를 쓰고 있으면 함께 바꿔야 합니다."}
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "restore"}
        title="기본 문구로 되돌리시겠습니까?"
        confirmLabel="되돌리기"
        busy={busy}
        onConfirm={handleRestore}
        onCancel={() => setDialog(null)}
      >
        제목 · 본문 · 변수 목록이 처음 배포된 것으로 바뀝니다. 되돌린 것도 변경 이력에 남습니다.
        {saved?.channel === "ALIMTALK" && " 카카오 템플릿 코드는 바뀌지 않으니, 검수받은 본문과 맞는지 확인해 주세요."}
      </ConfirmDialog>
    </>
  );
}
