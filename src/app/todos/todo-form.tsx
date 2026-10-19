"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { Button, DateField, Field, FormGroup, FormRow, Radio, RequiredMark, SearchField, Select, Textarea, TextField, Toggle, useToast } from "@/components/common";
import { useMenuRole, useStores } from "@/components/site/session-gate";
import { labelOf, type EnumValue } from "@/lib/enums";
import { MENU_CODE } from "@/lib/menus";
import { useFailure } from "../staff-members/[id]/use-action-failure";
import { createTodoAction, getAssignableStaffAction, updateTodoAction } from "./actions";
import { fromDetail, initialForm, matchStaff, problems, staffChipText, toCreateBody, toUpdateBody, type PickedStaff, type TodoForm as Form } from "./todo-form-model";
import { staffNameText, type TodoDetail } from "./todo-row";

const HELP = "text-[12px] leading-[1.5] text-erp-muted";
const STAFF_LOAD_FAILED = "직원 목록을 불러오지 못했습니다. 다시 시도해 주세요.";
// 등록 결과 모름. 서버 액션 호출 자체가 끊긴 경우의 문구로, 서버 액션의 결과 모름 문구와 같다
const CREATE_UNKNOWN = "등록 결과를 확인하지 못했습니다. 목록에서 등록됐는지 확인해 주세요.";
// 배정 대상 · 수행 방식 설명. 데모의 ⓘ 툴팁 문구(2026-10-08 재영)를 공통 툴팁이 없어 칸 아래 안내로 둔다.
const TIP_TARGET = "개인: 고른 직원에게만 보입니다. 여러 명을 고르면 한 사람에 한 건씩 생깁니다. 근무지 전체: 그 근무지의 체결 완료 근로계약이 있고 가입을 마친 재직 직원(퇴직 예정 포함) 모두에게 보입니다.";
const TIP_MODE = "각자 수행: 직원마다 한 건씩 생기고 저마다 완료합니다. 한 명 수행: 한 건을 함께 보고, 한 명이 완료하면 모두에게 완료로 보입니다. 등록한 뒤에는 바꿀 수 없습니다.";

// 입력이 여럿인 칸(라디오 · 직원 고르기). <label> 하나로 묶을 수 없어 group 으로 둔다(근로계약서 초안 작성의 Group 과 같다).
function Group({ label, required, help, children }: { label: string; required?: boolean; help?: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex min-w-px flex-1 flex-col gap-[8px]">
      <span className="truncate text-[14px] font-medium text-erp-label">
        {label}
        {required && <RequiredMark />}
      </span>
      {children}
      {help && <span className={HELP}>{help}</span>}
    </div>
  );
}

// 칩 · 후보 버튼. 1팀 공통 컴포넌트에 칩이 없어 데모 staffChip 모양(34 높이 · 2px 모서리 · 입력칸 선)을 그대로 쓴다.
const CHIP = "flex h-[34px] items-center gap-[8px] rounded-[2px] border border-erp-field-line bg-white pr-[4px] pl-[10px] text-[14px] text-erp-ink";
const CANDIDATE =
  "h-[34px] rounded-[2px] border border-erp-field-line bg-white px-[10px] text-[14px] text-erp-ink transition-colors duration-150 ease-out hover:border-erp-brand";

type Pool = { storeId: string; state: "loading" } | { storeId: string; state: "ok"; staff: PickedStaff[] } | { storeId: string; state: "error"; message: string };

/**
 * TO-DO 등록(#117) · 수정. 칸과 문구는 목업 TO-DO 탭의 등록 칸 · 데모 todoForm 이다. 수정은 제목 · 내용 · 수행 예정 일시 · 긴급만 고치고
 * 근무지 · 배정 대상 · 수행 방식 · 직원은 글자로만 보인다(api 가 받지 않는다). 수정은 바꾼 칸만 보낸다(toUpdateBody).
 * 개인 배정 직원은 고른 근무지의 체결 완료 근로계약이 있고 가입을 마친 재직 직원(퇴직 예정 포함)(GET /todos/assignable-staff)을
 * 이름 · 번호 끝자리로 찾아 칩으로 더한다. 근무지를 바꾸면 비운다.
 * 등록은 등록 권한, 수정은 수정 권한이 없으면 폼 대신 안내만 보인다(주소로 바로 들어온 경우). 막는 것은 api 다.
 */
export function TodoForm(props: Parameters<typeof TodoFormFields>[0]) {
  const allowed = useMenuRole(MENU_CODE.todos, props.detail ? "update" : "create");
  if (allowed) return <TodoFormFields {...props} />;
  return (
    <div className="flex flex-col items-center gap-[16px] py-[80px] text-[14px] text-erp-muted">
      <p>{props.detail ? "TO-DO 를 수정할 권한이 없습니다." : "TO-DO 를 등록할 권한이 없습니다."}</p>
      <Button variant="off" href={props.detail ? `/todos/${props.detail.todoId}` : "/todos"}>
        {props.detail ? "상세로" : "목록으로"}
      </Button>
    </div>
  );
}

function TodoFormFields({
  today,
  labels,
  detail,
}: {
  /** 화면을 그릴 때 서버의 오늘(KST) */
  today: string;
  labels: { assigneeType: EnumValue[]; executionMode: EnumValue[] };
  /** 있으면 수정 */
  detail?: TodoDetail;
}) {
  const router = useRouter();
  const toast = useToast();
  // 근무지는 로그인 정보의 관리 점포에서 폐점만 뺀다(목록 필터와 같은 출처). GET /stores/options 는 본사 제공 동의 기준이 걸려
  // BP 마스터 · BP 관리자에게 가맹 점포가 빠지는데, TO-DO 는 점포 단위라 본사 제공 동의와 상관없다(운영 정책 ATT-30).
  const stores = useStores().filter((s) => s.storeStatusCode !== "CLOSED");
  const onFailure = useFailure();
  const [form, setForm] = useState<Form>(() => (detail ? fromDetail(detail) : initialForm(today, stores.length === 1 ? String(stores[0].storeId) : "")));
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState("");
  const [saving, startSaving] = useTransition();
  const [pool, setPool] = useState<Pool | null>(null);
  const [word, setWord] = useState("");
  // 근무지를 빠르게 바꾸면 앞의 응답이 늦게 올 수 있다 — 마지막 요청의 응답만 쓴다.
  const seq = useRef(0);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const issues = problems(form, today, detail);
  const cancelHref = detail ? `/todos/${detail.todoId}` : "/todos";

  /**
   * 개인 배정일 때 그 근무지에서 배정할 수 있는 직원을 받는다. 이미 받은(받는 중인) 근무지면 다시 받지 않는다 — 실패했으면 다시 받는다.
   * 실패는 이 칸에 고정 문구로 보인다. 401 · 403 은 useFailure 로 넘긴다 — 로그인 만료 · 비밀번호 변경 요구 · 권한 없음(쫓아냄)을 공통으로 처리한다.
   */
  const loadStaff = (storeId: string, assigneeType: Form["assigneeType"]) => {
    if (!storeId || assigneeType !== "INDIVIDUAL" || (pool?.storeId === storeId && pool.state !== "error")) return;
    const n = ++seq.current;
    setPool({ storeId, state: "loading" });
    getAssignableStaffAction(Number(storeId))
      .then((result) => {
        if (n !== seq.current) return;
        if (result.ok) return setPool({ storeId, state: "ok", staff: result.staff });
        // 401(로그인 만료) · 403(비밀번호 변경 요구 · 권한 없음)은 공통 처리로 넘긴다. 문구가 돌아오면 그 문구를 이 칸에 보인다
        if (result.status === 401 || result.status === 403) {
          const message = onFailure(result);
          return setPool(message === null ? null : { storeId, state: "error", message });
        }
        setPool({ storeId, state: "error", message: STAFF_LOAD_FAILED });
      })
      .catch((error: unknown) => {
        console.error("TO-DO 직원 목록 조회 실패", error);
        if (n === seq.current) setPool({ storeId, state: "error", message: STAFF_LOAD_FAILED });
      });
  };
  const handleStoreChange = (storeId: string) => {
    setForm((f) => ({ ...f, storeId, staff: [] }));
    setWord("");
    loadStaff(storeId, form.assigneeType);
  };
  const handleTargetChange = (assigneeType: Form["assigneeType"]) => {
    set("assigneeType", assigneeType);
    loadStaff(form.storeId, assigneeType);
  };

  const handleSave = () => {
    setTried(true);
    setServerError("");
    if (issues.length) return;
    startSaving(async () => {
      try {
        if (detail) {
          const body = toUpdateBody(detail, form);
          // 바꾼 칸이 없으면 보내지 않고 상세로 돌아간다
          const result = Object.keys(body).length ? await updateTodoAction(detail.todoId, body) : { ok: true as const };
          if (result.ok) {
            if (Object.keys(body).length) toast("updated");
            router.push(cancelHref);
            return;
          }
          const message = onFailure(result);
          if (message) setServerError(message);
          // 그사이 지워졌거나 범위 밖이 됐다 — 다시 받아 404 화면으로
          if (result.status === 404) router.refresh();
          return;
        }
        const result = await createTodoAction(toCreateBody(form));
        if (result.ok) {
          toast("saved");
          router.push("/todos");
          return;
        }
        // 결과 모름 — 이미 만들어졌을 수 있어 다시 저장하게 두지 않는다(직원 수만큼 겹쳐 생긴다). 목록에서 확인하게 보낸다
        if (result.status === undefined) {
          toast(result.message);
          router.push("/todos");
          return;
        }
        const message = onFailure(result);
        if (message) setServerError(message);
      } catch (error) {
        console.error("TO-DO 저장 실패", error);
        if (detail) {
          setServerError("저장 결과를 확인하지 못했습니다. 화면을 새로 불러와 확인해 주세요.");
          return;
        }
        toast(CREATE_UNKNOWN);
        router.push("/todos");
      }
    });
  };

  const storeName = detail ? (detail.storeName ?? "-") : "";
  const candidates = pool?.state === "ok" && pool.storeId === form.storeId ? matchStaff(pool.staff, form.staff, word) : [];

  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex items-end gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">{detail ? "TO-DO 수정" : "TO-DO 등록"}</h2>
        <Button variant="off" href={cancelHref}>
          취소
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "저장 중" : detail ? "저장" : "등록하고 배정"}
        </Button>
      </div>

      <div className="flex flex-col gap-[24px]">
        <FormGroup title="내용">
          <Field label="제목" required>
            <TextField value={form.title} maxLength={100} aria-required onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="내용">
            <Textarea rows={4} value={form.body} maxLength={2000} onChange={(e) => set("body", e.target.value)} />
          </Field>
        </FormGroup>

        <FormGroup title="배정">
          {detail ? (
            // 등록 뒤에는 근무지 · 배정 대상 · 수행 방식 · 직원을 바꾸지 않는다(api 가 받지 않는다)
            <>
              <Group label="근무지">
                <span className="text-[14px] text-erp-ink">{storeName}</span>
              </Group>
              <Group label="배정 대상" help="등록 후에는 바꿀 수 없다">
                <span className="text-[14px] text-erp-ink">
                  {labelOf(labels.assigneeType, detail.assigneeType)}
                  {detail.assigneeType === "ALL" ? ` · ${labelOf(labels.executionMode, detail.executionMode)}` : ""}
                  {detail.assigneeType === "INDIVIDUAL" && detail.assignees.length ? ` · ${detail.assignees.map(staffNameText).join(", ")}` : ""}
                </span>
              </Group>
            </>
          ) : (
            <>
              <Field label="근무지" required>
                <Select value={form.storeId} aria-required onChange={(e) => handleStoreChange(e.target.value)}>
                  <option value="">선택</option>
                  {stores.map((s) => (
                    <option key={s.storeId} value={s.storeId}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Group label="배정 대상" help={TIP_TARGET}>
                <div role="radiogroup" className="flex flex-wrap items-center gap-x-[18px] gap-y-[8px]">
                  {(["INDIVIDUAL", "ALL"] as const).map((v) => (
                    <Radio key={v} name="assigneeType" label={labelOf(labels.assigneeType, v)} checked={form.assigneeType === v} onChange={() => handleTargetChange(v)} />
                  ))}
                </div>
              </Group>
              {form.assigneeType === "INDIVIDUAL" ? (
                <Group label="직원" required help="고른 근무지의 체결 완료 근로계약이 있고 가입을 마친 재직 직원(퇴직 예정 포함) 중 한 명 이상 고르고, 직원마다 1건씩 생긴다. 근무지를 바꾸면 고른 직원을 비운다.">
                  {!form.storeId ? (
                    <span className="text-[14px] text-erp-muted">근무지를 먼저 골라 주세요.</span>
                  ) : (
                    <>
                      <SearchField value={word} onValueChange={setWord} placeholder="이름 또는 휴대전화번호 끝자리" aria-label="직원 찾기" />
                      {pool?.state === "loading" && <span className="text-[14px] text-erp-muted">불러오는 중입니다.</span>}
                      {pool?.state === "error" && (
                        <span className="flex items-center gap-[6px]">
                          <span role="alert" className="text-[14px] text-erp-off">
                            {pool.message}
                          </span>
                          <Button variant="soft" onClick={() => loadStaff(form.storeId, form.assigneeType)}>
                            다시 시도
                          </Button>
                        </span>
                      )}
                      {pool?.state === "ok" && (
                        <ul aria-label="고를 수 있는 직원" className="flex max-h-[160px] flex-wrap gap-[6px] overflow-y-auto">
                          {candidates.length === 0 ? (
                            <li className="text-[14px] text-erp-muted">{pool.staff.length ? "맞는 직원이 없습니다." : "이 근무지에 배정할 수 있는 직원이 없습니다(체결 완료 근로계약이 있고 가입을 마친 재직 직원(퇴직 예정 포함)만)."}</li>
                          ) : (
                            candidates.map((s) => (
                              <li key={s.staffMemberId}>
                                <button type="button" className={CANDIDATE} onClick={() => set("staff", [...form.staff, s])}>
                                  {staffChipText(s)}
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                      {form.staff.length > 0 && (
                        <ul aria-label="고른 직원" className="flex flex-wrap gap-[6px]">
                          {form.staff.map((s) => (
                            <li key={s.staffMemberId} className={CHIP}>
                              <span className="font-medium">{staffChipText(s)}</span>
                              <button
                                type="button"
                                aria-label={`${s.name} 빼기`}
                                onClick={() => set("staff", form.staff.filter((p) => p.staffMemberId !== s.staffMemberId))}
                                className="grid size-[26px] place-items-center rounded-[2px] text-erp-label hover:text-erp-ink"
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </Group>
              ) : (
                <Group label="수행 방식" help={`${TIP_MODE} 각자 수행은 직원당 1건, 한 명 수행은 공유 1건.`}>
                  <div role="radiogroup" className="flex flex-wrap items-center gap-x-[18px] gap-y-[8px]">
                    {(["EACH", "ANY_ONE"] as const).map((v) => (
                      <Radio key={v} name="executionMode" label={labelOf(labels.executionMode, v)} checked={form.executionMode === v} onChange={() => set("executionMode", v)} />
                    ))}
                  </div>
                </Group>
              )}
            </>
          )}
          <FormRow>
            <Field label="수행 예정 날짜" required>
              <DateField aria-label="수행 예정 날짜" value={form.dueDate} onChange={(v) => set("dueDate", v)} />
            </Field>
            <Field label="시간 (선택)">
              <TextField type="time" value={form.dueTime} onChange={(e) => set("dueTime", e.target.value)} />
            </Field>
          </FormRow>
          <div className="flex flex-col gap-[8px]">
            <Toggle label="긴급" checked={form.isUrgent} onChange={(e) => set("isUrgent", e.target.checked)} />
            <span className={HELP}>직원 근무 앱 홈 · 근무 탭 맨 위에 강조되고 관리자 웹 미조치에 센다. 푸시는 보내지 않는다.</span>
          </div>
        </FormGroup>

        {!detail && (
          // 목업 「배정 방식이 만드는 차이」
          <div className="flex flex-col gap-[4px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-ink">
            <p className="font-semibold">배정 방식이 만드는 차이</p>
            <p>
              <b className="font-medium">개인 배정</b> — 고른 직원 각각에게 1건씩(한 명 이상). 수행 방식은 고르지 않는다.
            </p>
            <p>
              <b className="font-medium">근무지 전체 · 각자 수행</b> — 등록할 때의 체결 완료 근로계약이 있고 가입을 마친 재직 직원(퇴직 예정 포함) 수만큼 생긴다. 나중에 들어온 직원에게는 생기지 않는다.
            </p>
            <p>
              <b className="font-medium">근무지 전체 · 한 명 수행</b> — 공유 1건. 먼저 완료한 사람이 수행자가 되고 나머지에게는 완료로 보인다.
            </p>
          </div>
        )}

        {(serverError || (tried && issues.length > 0)) && (
          <div role="alert" className="flex flex-col gap-[4px] rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px]">
            <p className="text-[14px] font-semibold text-erp-off">저장하지 못했습니다</p>
            <ul className="list-disc pl-[18px] text-[14px] leading-[1.6] text-erp-ink">
              {(serverError ? [serverError] : issues).map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
