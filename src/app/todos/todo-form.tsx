"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { Button, DateField, DetailTable, FieldMessage, FormGroup, FormRow, GuideBand, GuideNote, NoticeBand, RequiredMark, SearchField, Select, Textarea, TextField, Toggle, useToast } from "@/components/common";
import { useAccount, useCurrentBp, useMenuRole, useStores } from "@/components/site/session-gate";
import { isFranchiseRole } from "@/lib/auth-routes";
import { bpPath } from "@/lib/bp-path";
import { labelOf, type EnumValue } from "@/lib/enums";
import { MENU_CODE } from "@/lib/menus";
import { withoutStoreSearch } from "@/lib/store-scope";
import { useFailure } from "../staff-members/[id]/use-action-failure";
import { createTodoAction, getAssignableStaffAction, updateTodoAction } from "./actions";
import { withBack } from "./todo-list-query";
import { fieldProblems, fromDetail, initialForm, matchStaff, staffChipText, toCreateBody, toUpdateBody, type PickedStaff, type TodoField, type TodoForm as Form } from "./todo-form-model";
import { StaffNames } from "./staff-names";
import type { TodoDetail } from "./todo-row";

const STAFF_LOAD_FAILED = "직원 목록을 불러오지 못했습니다. 다시 시도해 주세요.";
// 배정할 직원이 없는 근무지 — api 문장(「근무지에 체결 완료 근로계약이 있고 가입을 마친 재직 직원이 없습니다.」)을 읽기 쉽게 바꾼 것(2026-11-09 사용자 지정, 3팀 확인 필요)
const NO_ASSIGNABLE_STAFF = "선택한 근무지는 직원에게 TO-DO를 배정할 수 없습니다.\nTO-DO는 근로계약을 체결하고 앱 가입을 마친 재직 직원에게만 배정할 수 있습니다.";
const NO_ASSIGNABLE_STAFF_API = "근무지에 체결 완료 근로계약이 있고 가입을 마친 재직 직원이 없습니다.";
/** api 거절 문장 가운데 화면 문구로 바꿔 보일 것 */
const friendly = (message: string) => (message === NO_ASSIGNABLE_STAFF_API ? NO_ASSIGNABLE_STAFF : message);
// 등록 결과 모름. 서버 액션 호출 자체가 끊긴 경우의 문구로, 서버 액션의 결과 모름 문구와 같다
const CREATE_UNKNOWN = "등록 결과를 확인하지 못했습니다. 목록에서 등록됐는지 확인해 주세요.";
// 배정 대상 카드 앞 아이콘 — BP 관리자 상세 「내 계정입니다.」의 사람 아이콘(헤더 avatar.svg 모양 · 선 굵기)을 그대로 쓰고, 근무지 전체는 그 양옆에 사람을 둘 더 둔다(2026-11-06 사용자 지정)
const PERSON_PATH = "M2.5 14c2.4-2.7 8.6-2.8 11 0M10.6 6.1a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 0 1 5.2 0Z";
const TARGET_ICON = {
  INDIVIDUAL: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-[16px] shrink-0 stroke-erp-brand">
      <path d={PERSON_PATH} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  ALL: (
    <svg viewBox="0 0 24 16" fill="none" aria-hidden className="h-[16px] w-[24px] shrink-0 stroke-erp-brand">
      {/* 양옆 사람은 머리 · 어깨를 조금 작게 — 가운데 사람(PERSON_PATH 를 4 옮김)과 겹치지 않게 */}
      <path d="M.8 13.4c.9-1.3 2.3-1.9 3.8-2M23.2 13.4c-.9-1.3-2.3-1.9-3.8-2" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="4.4" cy="6.6" r="1.9" strokeWidth="1.5" />
      <circle cx="19.6" cy="6.6" r="1.9" strokeWidth="1.5" />
      <path d={PERSON_PATH} transform="translate(4 0)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};
// 배정 대상 카드는 설명 없이 제목만 — enum 한글(개인 · 근무지 전체) 뒤에 한 말을 붙인다: 「개인 배정」 · 「근무지 전체 직원에게 배정」(2026-11-06 사용자 지정)
const TARGET_SUFFIX = { INDIVIDUAL: "배정", ALL: "직원에게 배정" } as const;
// 한 명 수행 카드 제목만 「한 명만 수행」으로 적는다(2026-11-06 사용자 지정). enum 한글(목록 · 상세의 「한 명 수행」)은 api 가 정하므로 그대로 둔다 —
// 모든 화면을 바꾸려면 api 의 enum 설명(COMMENT ON TYPE)을 고친다
const MODE_ANY_ONE_TITLE = "한 명만 수행";
// 수행 방식 카드의 한 줄 설명(배정 대상 카드는 제목만). 전엔 칸 아래 긴 안내였다 — 점포 등록의 점포유형 카드처럼 카드 안으로 옮겼다(2026-11-06 사용자 지정)
const MODE_DESC = { EACH: "배정된 직원이 모두 수행해야 완료", ANY_ONE: "배정된 직원 중 한 명만 수행하면 완료" } as const;

// 입력이 여럿인 칸(카드 · 직원 고르기). <label> 하나로 묶을 수 없어 group 으로 둔다(역할은 점포 등록의 Labeled 와 같다).
// 라벨은 왼쪽 제목 · 내용과 같은 15px 600 먹색(TopField) — 14px 회색은 「배정」 상자 안에서 너무 작았다(2026-11-06 사용자 지정)
function Group({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    // 세로로 늘리지 않는다(flex-1 없음) — 배정내역 상자가 왼쪽 단 높이로 늘어날 때 칸 묶음이 남는 높이를 나눠 가져 「배정대상」과 「수행 방식」 사이가 벌어졌다(2026-11-09 사용자 지정)
    <div role="group" aria-label={label} className="flex min-w-px flex-col gap-[10px]">
      <span className="truncate text-[15px] font-semibold text-erp-ink">
        {label}
        {required && <RequiredMark />}
      </span>
      {children}
    </div>
  );
}

/** 칸과 그 아래 오류 문구를 세로로 — 문구가 라벨 밖에 있어야 입력칸의 접근 가능한 이름에 섞이지 않는다(점포 등록의 Stack 과 같다) */
function Stack({ children, grow }: { children: ReactNode; grow?: boolean }) {
  return <div className={`flex flex-col gap-[8px] ${grow ? "min-w-0 flex-1 self-start" : ""}`}>{children}</div>;
}

/**
 * 제목 · 내용(묶음 상자 없이)과 「배정」 상자 안 칸. 라벨은 옆 「배정」 묶음 제목(FormGroup)과 같은 15px 600 먹색, 라벨과 칸 사이도 FormGroup 과 같은 10px 다
 * (2026-11-06 사용자 지정). 공통 Field 는 라벨이 14px 500 회색이라 따로 둔다.
 */
function TopField({ label, required, fill, children }: { label: string; required?: boolean; fill?: boolean; children: ReactNode }) {
  return (
    // fill: 남는 높이를 채운다 — 내용 칸이 옆 「배정」 상자 아래 끝까지 늘어난다(입력칸은 감싸는 쪽에서 flex-1 로 늘린다)
    <label className={`flex flex-col gap-[10px] ${fill ? "min-h-0 flex-1 [&>textarea]:flex-1" : ""}`}>
      <span className="text-[15px] font-semibold text-erp-ink">
        {label}
        {required && <RequiredMark />}
      </span>
      {children}
    </label>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-[13px] leading-[1.6] text-erp-label">{children}</p>;
}

/**
 * 큰 선택 카드(라디오) — 점포 등록의 점포유형 카드(StoreTypeCards)와 같은 모양. 고르면 선이 브랜드색, 바탕이 두 번째 바탕색으로 바뀐다.
 * 선 두께는 바뀌지 않는다.
 */
function ChoiceCards<T extends string>({ name, items, value, onChange }: { name: string; items: { value: T; title: string; desc?: string; icon?: ReactNode }[]; value: T; onChange: (value: T) => void }) {
  return (
    // 이름은 감싸는 Group(role=group)이 단다 — 여기에도 달면 같은 이름이 두 번 읽힌다
    <div role="radiogroup" className="grid grid-cols-2 gap-[12px]">
      {items.map((item) => (
        <label
          key={item.value}
          className="flex cursor-pointer flex-col items-center gap-[2px] rounded-[4px] border border-erp-panel-line bg-white px-[18px] py-[10px] text-center transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-erp-brand has-[:checked]:border-erp-brand has-[:checked]:bg-erp-thead-bg has-[:focus-visible]:border-erp-brand"
        >
          <input type="radio" name={name} className="sr-only" checked={value === item.value} onChange={() => onChange(item.value)} />
          <b className="flex items-center gap-[6px] text-[15px] font-semibold text-erp-ink">
            {item.icon}
            {item.title}
          </b>
          {item.desc && <span className="text-[13px] text-erp-label">{item.desc}</span>}
        </label>
      ))}
    </div>
  );
}

// 칩 · 후보 버튼. 1팀 공통 컴포넌트에 칩이 없어 데모 staffChip 모양(34 높이 · 2px 모서리 · 입력칸 선)을 그대로 쓴다.
// 직원 고르기 두 상자(선택할 수 있는 직원 · 선택한 직원) — store-mapping-picker 상자와 같은 테두리 · 제목 줄
const STAFF_BOX = "flex min-w-0 flex-col overflow-hidden rounded-[4px] border border-erp-panel-line";
// 제목 줄은 바탕색 없이(상자 바탕 그대로) + 아래 회색 선 하나(erp-bar-line, 2026-11-09 사용자 지정 — 청회색 진한 선은 옅은 회청 바탕 위에서 어색했다)
const STAFF_BOX_HEAD = "flex h-[42px] shrink-0 items-center gap-[8px] border-b border-erp-bar-line px-[12px] text-[14px] font-medium text-erp-ink";
const CHIP = "flex h-[34px] items-center gap-[8px] rounded-[2px] border border-erp-field-line bg-white pr-[4px] pl-[10px] text-[14px] text-erp-ink";
const CANDIDATE =
  "h-[34px] rounded-[2px] border border-erp-field-line bg-white px-[10px] text-[14px] text-erp-ink transition-colors duration-150 ease-out hover:border-erp-brand";

// 폼 값이 바뀌면 문구를 내릴 칸. staff 는 칩을 더하고 뺄 때, storeId 는 handleStoreChange 가 내린다
const FIELD_OF = { title: "title", body: "body", staff: "staff", dueDate: "dueDate", dueTime: "dueTime" } as const satisfies Partial<Record<keyof Form, TodoField>>;

// 화면에 놓인 순서 — 첫 오류 칸을 고를 때 쓴다
const FIELD_ORDER: TodoField[] = ["title", "body", "storeId", "staff", "dueDate", "dueTime"];

type Pool = { storeId: string; state: "loading" } | { storeId: string; state: "ok"; staff: PickedStaff[] } | { storeId: string; state: "error"; message: string };

/**
 * TO-DO 등록(#117) · 수정. 칸과 문구는 목업 TO-DO 탭의 등록 칸이고, 배치는 점포 등록을 본뜬 두 단이다(데모 staff/todos-new.mjs · todos-edit.mjs). 수정은 제목 · 내용 · 수행예정 일시 · 긴급만 고치고
 * 근무지 · 배정 대상 · 수행 방식 · 직원은 글자로만 보인다(api 가 받지 않는다). 수정은 바꾼 칸만 보낸다(toUpdateBody).
 * 개인 배정 직원은 고른 근무지의 체결 완료 근로계약이 있고 가입을 마친 재직 직원(퇴직 예정 포함)(GET /todos/assignable-staff)을
 * 이름 · 번호 끝자리로 찾아 칩으로 더한다. 근무지를 바꾸면 비운다.
 * 등록은 등록 권한, 수정은 수정 권한이 없으면 폼 대신 안내만 보인다(주소로 바로 들어온 경우). 막는 것은 api 다.
 */
export function TodoForm(props: Parameters<typeof TodoFormFields>[0]) {
  const allowed = useMenuRole(MENU_CODE.todos, props.detail ? "update" : "create");
  const bp = useCurrentBp().bpCodeId;
  if (allowed) return <TodoFormFields {...props} />;
  return (
    <div className="flex flex-col items-center gap-[16px] py-[80px] text-[14px] text-erp-muted">
      <p>{props.detail ? "TO-DO 를 수정할 권한이 없습니다." : "TO-DO 를 등록할 권한이 없습니다."}</p>
      <Button variant="off" href={bpPath(bp, props.detail ? withBack(`/todos/${props.detail.todoId}`, props.backHref) : props.backHref)}>
        {props.detail ? "상세로" : "목록으로"}
      </Button>
    </div>
  );
}

function TodoFormFields({
  today,
  labels,
  detail,
  backHref,
}: {
  /** 화면을 그릴 때 서버의 오늘(KST) */
  today: string;
  labels: { assigneeType: EnumValue[]; executionMode: EnumValue[] };
  /** 있으면 수정 */
  detail?: TodoDetail;
  /** 들어올 때의 목록 주소(?back=, backHrefOf 로 거른 값) — 등록 취소는 이리로, 상세로 갈 때는 ?back= 으로 넘긴다(등록 뒤는 점포 검색을 비운 값) */
  backHref: string;
}) {
  const router = useRouter();
  const toast = useToast();
  // 목록 주소(backHref)는 옛 경로다 — 이동할 때 탭 BP 를 붙인다(/bp/{id}/todos)
  const bp = useCurrentBp().bpCodeId;
  // 근무지는 로그인 정보의 관리 점포에서 폐점만 뺀다(목록 필터와 같은 출처). GET /contracts/store-options(근로계약 근무지 선택지)는 본사 제공 동의 기준이 걸려
  // BP 마스터 · BP 관리자에게 가맹 점포가 빠지는데, TO-DO 는 점포 단위라 본사 제공 동의와 상관없다(운영 정책 ATT-30).
  const stores = useStores().filter((s) => s.storeStatusCode !== "CLOSED");
  const onFailure = useFailure();
  // 가맹 마스터 · 가맹 관리자 — 자기 점포 직원을 모두 봐서 근무지 전체도 미리 확인한다(prechecks)
  const franchiseRole = isFranchiseRole(useAccount().roleTypeCode);
  const [form, setForm] = useState<Form>(() => (detail ? fromDetail(detail) : initialForm(today, stores.length === 1 ? String(stores[0].storeId) : "")));
  // 저장을 눌렀을 때의 칸 오류. 그 칸 값을 고치면 그 칸 문구만 내린다(DESIGN 「오류 문구 내리기」)
  const [errors, setErrors] = useState<Partial<Record<TodoField, string>>>({});
  const [serverError, setServerError] = useState("");
  const ids = useId();
  const [saving, startSaving] = useTransition();
  const [pool, setPool] = useState<Pool | null>(null);
  const [word, setWord] = useState("");
  // 근무지를 빠르게 바꾸면 앞의 응답이 늦게 올 수 있다 — 마지막 요청의 응답만 쓴다.
  const seq = useRef(0);
  const clearError = (...keys: TodoField[]) => setErrors((e) => (keys.some((k) => e[k]) ? Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k as TodoField))) : e));
  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key in FIELD_OF) clearError(FIELD_OF[key as keyof typeof FIELD_OF]);
  };
  const message = (key: TodoField) => <FieldMessage id={`${ids}-${key}`} message={errors[key]} />;
  // 칸 테두리는 빨갛게 칠하지 않는다(aria-invalid 를 달지 않음) — 오류는 칸 아래 문구로만(공통 규칙, 2026-11-09 사용자 지정)
  const describe = (key: TodoField) => (errors[key] ? `${ids}-${key}` : undefined);
  /**
   * 저장이 막히면 화면 순서로 첫 오류 칸에 커서를 옮긴다(점포 등록과 같다). 날짜 칸은 공통 DateField 가 aria-describedby 를 받지 않아
   * 이름(aria-label)으로 찾고, 칸을 못 찾으면 문구를 화면 안으로 끌어온다
   */
  const focusFirstError = (found: Partial<Record<TodoField, string>>) =>
    requestAnimationFrame(() => {
      const form = document.getElementById(`${ids}-form`);
      const key = FIELD_ORDER.find((k) => found[k]);
      if (!form || !key) return;
      const target =
        key === "dueDate" ? form.querySelector(`input[aria-label="수행예정 날짜"]`) : form.querySelector(`[aria-describedby="${ids}-${key}"]`);
      if (target instanceof HTMLElement) target.focus();
      else document.getElementById(`${ids}-${key}`)?.scrollIntoView({ block: "center" });
    });
  const cancelHref = bpPath(bp, detail ? withBack(`/todos/${detail.todoId}`, backHref) : backHref);
  // 등록 뒤 목록 주소 — 점포 검색을 「전체」로 비운다(고른 점포 밖에 등록했으면 목록에 보이지 않는다. 근로계약 목록과 같다. 점포 목록은 2026-10-30 부터 헤더 범위를 따른다).
  // 등록 뒤 상세의 [목록](?back=)이 이 값이고, id 를 못 받았거나 결과를 모르면 바로 이리로 간다
  const createdList = withoutStoreSearch(backHref);
  const createdHref = bpPath(bp, createdList);

  /**
   * 개인 배정일 때 그 근무지에서 배정할 수 있는 직원을 받는다. 이미 받은(받는 중인) 근무지면 다시 받지 않는다 — 실패했으면 다시 받는다.
   * 실패는 이 칸에 고정 문구로 보인다. 401 · 403 은 useFailure 로 넘긴다 — 로그인 만료 · 비밀번호 변경 요구 · 권한 없음(쫓아냄)을 공통으로 처리한다.
   */
  const loadStaff = (storeId: string, assigneeType: Form["assigneeType"]) => {
    if (!storeId || !prechecks(storeId, assigneeType)) return;
    // 이미 받은(받는 중인) 근무지는 다시 받지 않는다 — 실패했거나 0명이었으면 다시 받는다
    if (pool?.storeId === storeId && pool.state !== "error" && !(pool.state === "ok" && pool.staff.length === 0)) return;
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
  /**
   * 직원 목록을 미리 받을까 — 개인 배정은 늘, 근무지 전체는 직영 점포이거나 가맹 마스터 · 가맹 관리자일 때(2026-11-09 사용자 지정, 3팀 확인 필요).
   * 근무지 전체에 배정할 직원이 0명이면 저장을 누르기 전에 「배정대상」 아래에 알리고 저장을 막는다. 본사 계정(BP 마스터 · BP 관리자 · 플랫폼)이 가맹 점포를 고르면
   * 본사 제공에 동의하지 않은 직원이 목록에서 빠져(ATT-30) 0명으로 잘못 보일 수 있어 미리 막지 않고 api 가 판단한다. 가맹 역할은 자기 점포 직원을 모두 본다.
   */
  const prechecks = (storeId: string, assigneeType: Form["assigneeType"]) =>
    assigneeType === "INDIVIDUAL" || franchiseRole || stores.find((st) => String(st.storeId) === storeId)?.storeTypeCode === "DIRECT";
  // 배정할 직원이 0명 — 개인 배정 · 근무지 전체 모두 「근무지」 칸 아래 빨간 문구로 알리고 저장을 막는다(2026-11-09 사용자 지정).
  // 본사 계정의 가맹 점포 · 근무지 전체는 개인 배정으로 받아 둔 0명 목록이 남아 있어도 막지 않는다(본사 제공 미동의 직원이 빠진 목록이다)
  const noAssignableStaff =
    !detail && prechecks(form.storeId, form.assigneeType) && pool?.storeId === form.storeId && pool.state === "ok" && pool.staff.length === 0;
  const handleStoreChange = (storeId: string) => {
    setForm((f) => ({ ...f, storeId, staff: [] }));
    clearError("storeId", "staff");
    setWord("");
    loadStaff(storeId, form.assigneeType);
  };
  const handleTargetChange = (assigneeType: Form["assigneeType"]) => {
    set("assigneeType", assigneeType);
    // 배정 방식을 바꾸면 직원 칸 문구를 내린다(DESIGN 「오류 문구 내리기」 — 등록 방식을 바꾸면 내린다)
    clearError("staff");
    loadStaff(form.storeId, assigneeType);
  };
  // 처음 그릴 때 근무지가 이미 정해져 있으면(점포가 하나뿐인 계정) 한 번 미리 확인한다 — 바꿀 때만 부르면 가장 흔한 경로에서 저장 뒤에야 알았다
  useEffect(() => {
    // 서버에서 받는 일이라 그리는 중에 할 수 없다 — 받는 중 표시(setPool)가 effect 안에서 바뀐다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!detail) loadStaff(form.storeId, form.assigneeType);
    // 처음 한 번만 — 그 뒤는 근무지 · 배정대상을 바꿀 때 부른다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    setServerError("");
    const found = fieldProblems(form, today, detail);
    // 배정할 직원이 없으면 「근무지」 칸 아래 문구가 이미 보인다 — 직원 칸 「선택해 주세요」를 겹쳐 띄우지 않고 저장만 막는다
    if (noAssignableStaff) delete found.staff;
    setErrors(found);
    if (noAssignableStaff && !Object.keys(found).length) {
      document.getElementById(`${ids}-target`)?.scrollIntoView({ block: "center" });
      // 처음 받은 0명이 그새 바뀌었을 수 있다(계약 체결 · 앱 가입) — 다시 받아 직원이 생겼으면 문구가 내려가고 다시 저장할 수 있다
      loadStaff(form.storeId, form.assigneeType);
      return;
    }
    if (Object.keys(found).length) {
      focusFirstError(found);
      return;
    }
    startSaving(async () => {
      // try 는 서버 액션 호출만 감싼다 — 성공 뒤 토스트 · 이동에서 난 예외가 「결과를 확인하지 못했습니다」로 섞이지 않게
      if (detail) {
        const body = toUpdateBody(detail, form);
        // 바꾼 칸이 없으면 보내지 않고 상세로 돌아간다
        if (!Object.keys(body).length) return router.push(cancelHref);
        let result: Awaited<ReturnType<typeof updateTodoAction>>;
        try {
          result = await updateTodoAction(detail.todoId, body);
        } catch (error) {
          console.error("TO-DO 수정 실패", error);
          setServerError("저장 결과를 확인하지 못했습니다. 화면을 새로 불러와 확인해 주세요.");
          return;
        }
        if (result.ok) {
          toast("updated");
          router.push(cancelHref);
          return;
        }
        const message = onFailure(result);
        if (message) setServerError(friendly(message));
        // 그사이 지워졌거나 범위 밖이 됐다 — 다시 받아 404 화면으로
        if (result.status === 404) router.refresh();
        return;
      }
      let result: Awaited<ReturnType<typeof createTodoAction>>;
      try {
        result = await createTodoAction(toCreateBody(form));
      } catch (error) {
        console.error("TO-DO 등록 실패", error);
        toast(CREATE_UNKNOWN);
        router.push(createdHref);
        return;
      }
      if (result.ok) {
        toast("saved");
        // 저장하면 만든 TO-DO 의 상세로 간다(2026-11-06 사용자 지정 — 전엔 목록). 상세의 [목록]은 점포 검색을 비운 목록으로 돌아간다.
        // 응답에 id 가 없으면(api 계약 위반 — 액션이 로그를 남긴다) 전처럼 목록으로 간다
        router.push(result.todoId === null ? createdHref : bpPath(bp, withBack(`/todos/${result.todoId}`, createdList)));
        return;
      }
      // 결과 모름 — 이미 만들어졌을 수 있어 다시 저장하게 두지 않는다(직원 수만큼 겹쳐 생긴다). 목록에서 확인하게 보낸다
      if (result.status === undefined) {
        toast(result.message);
        router.push(createdHref);
        return;
      }
      const message = onFailure(result);
      if (message) setServerError(friendly(message));
    });
  };

  const storeName = detail ? (detail.storeName ?? "-") : "";
  // 수정 화면 — 배정내역은 바꿀 수 없어 상세 표로 보인다
  const locked = Boolean(detail);
  const candidates = pool?.state === "ok" && pool.storeId === form.storeId ? matchStaff(pool.staff, form.staff, word) : [];

  return (
    <div id={`${ids}-form`} className="flex flex-col gap-[24px]">
      {/* 취소 · 저장은 제목 줄 오른쪽 — 점포 등록과 같은 자리 · 같은 줄맞춤(2026-11-06 사용자 지정) */}
      <div className="flex items-center gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">{detail ? "TO-DO 수정" : "TO-DO 등록"}</h2>
        <Button variant="off" href={cancelHref}>
          취소
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {/* 등록 · 수정 모두 [저장](2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 등록이면 「등록하고 배정」) */}
          {saving ? "저장 중" : "저장"}
        </Button>
      </div>
      {/* 서버 실패는 제목 줄 아래 띠 — 칸 오류는 칸 바로 아래에 둔다(점포 등록과 같다) */}
      {serverError && <NoticeBand title="저장하지 못했습니다." detail={<span className="whitespace-pre-line">{serverError}</span>} />}

      {/* 두 단 — 왼쪽 제목 · 내용 · 수행예정 · 긴급, 오른쪽 「배정내역」 묶음(근무지 · 배정대상 · 직원 / 수행 방식)(2026-11-09 사용자 지정) */}
      <div className="grid grid-cols-2 gap-[24px]">
        {/* 제목 · 내용은 묶음 상자 없이 바로 둔다 — 「내용」 상자 안의 「내용」 칸이 겹쳐 보였다(2026-11-06 사용자 지정) */}
        <div className="flex flex-col gap-[18px]">
          <Stack>
            <TopField label="제목" required>
              <TextField
                value={form.title}
                maxLength={100}
                placeholder="100자 이내로 입력해 주세요."
                aria-required
                aria-describedby={describe("title")}
                onChange={(e) => set("title", e.target.value)}
              />
            </TopField>
            {message("title")}
          </Stack>
          {/* 내용은 6줄 고정 — 전엔 옆 「배정」 상자 아래 끝까지 늘어나 필수도 아닌 칸이 너무 길었다(2026-11-09 사용자 지정, 3팀 확인 필요) */}
          <div className="flex flex-col gap-[8px]">
            <TopField label="내용">
              <Textarea
                rows={6}
                value={form.body}
                maxLength={2000}
                placeholder="2,000자 이내로 입력해 주세요."
                aria-describedby={describe("body")}
                onChange={(e) => set("body", e.target.value)}
              />
            </TopField>
            {message("body")}
          </div>
          {/* 수행예정 날짜 · 시간 · 긴급은 내용 아래(2026-11-09 사용자 지정, 3팀 확인 필요 — 전엔 오른쪽 「배정」 상자 맨 아래) */}
          <FormRow>
            <Stack grow>
              <TopField label="수행예정 날짜" required>
                <DateField aria-label="수행예정 날짜" value={form.dueDate} onChange={(v) => set("dueDate", v)} />
              </TopField>
              {message("dueDate")}
            </Stack>
            <Stack grow>
              <TopField label="시간 (선택)">
                <TextField type="time" value={form.dueTime} aria-describedby={describe("dueTime")} onChange={(e) => set("dueTime", e.target.value)} />
              </TopField>
              {message("dueTime")}
            </Stack>
          </FormRow>
          <Stack>
            {/* 칸 이름을 앞에, 스위치를 뒤에 — 공지사항 등록 「상단 고정」과 같은 모양. 이름은 다른 칸과 같은 15px 600 먹색(2026-11-09 사용자 지정, 3팀 확인 필요) */}
            <label className="flex w-fit cursor-pointer items-center gap-[10px]">
              <span className="text-[15px] font-semibold text-erp-ink">긴급요청</span>
              <Toggle label="" aria-label="긴급요청" checked={form.isUrgent} onChange={(e) => set("isUrgent", e.target.checked)} />
            </label>
            <Note>
              직원 근무 앱의 홈 및 근무 탭 최상단에 강조 표시되며, 관리자 웹의 미조치 건수에 포함됩니다.
              <br />
              별도의 푸시 알림은 발송하지 않습니다.
            </Note>
          </Stack>
        </div>

        {/* 묶음 이름은 등록 · 수정 모두 「배정내역」(2026-11-09 사용자 지정, 3팀 확인 필요 — 전엔 「배정」) */}
        {locked && detail ? (
          // 수정 화면 — 바꿀 수 없는 배정내역은 상세 화면 「TO-DO」 표와 같은 상세 표로 보인다. 위에 붙여 늘어나지 않게
          // (2026-11-09 사용자 지정, 3팀 확인 필요 — 막힌 입력칸 · 카드로 두니 고칠 수 있는 칸처럼 보였다)
          // 제목 「배정내역」은 왼쪽 「제목」 · 「내용」 칸 이름과 같은 단계(15px 600 먹색, 칸 이름과 같은 10px 아래)로 표 밖에 두고, 항목만 상세 표로(2026-11-09 사용자 지정)
          <section className="flex min-w-0 flex-col gap-[10px] self-start">
            <h3 className="text-[15px] font-semibold text-erp-ink">배정내역</h3>
            <div className="flex min-w-0 flex-col gap-[8px]">
            <DetailTable
              rows={[
                { label: "근무지", value: storeName },
                {
                  label: "배정대상",
                  value: `${labelOf(labels.assigneeType, detail.assigneeType)}${detail.assigneeType === "ALL" ? ` · ${labelOf(labels.executionMode, detail.executionMode)}` : ""}`,
                },
                ...(detail.assigneeType === "INDIVIDUAL" ? [{ label: "직원", value: <span><StaffNames staff={detail.assignees} /></span>, multiline: true }] : []),
              ]}
            />
            {/* 바꿀 수 없는 이유를 표 바로 아래 느낌표 안내로(공통 GuideNote — 저장 옆 안내 · 삭제 안내와 같은 모양, 2026-11-09 사용자 지정) */}
            <GuideNote>배정내역(근무지 · 배정대상 · 직원)은 등록한 뒤에 변경할 수 없습니다.</GuideNote>
            </div>
          </section>
        ) : (
          <FormGroup title="배정내역">
            <Stack>
              <TopField label="근무지" required>
                <Select value={form.storeId} aria-required aria-describedby={describe("storeId")} onChange={(e) => handleStoreChange(e.target.value)}>
                  <option value="">선택</option>
                  {stores.map((s) => (
                    <option key={s.storeId} value={s.storeId}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </TopField>
              {message("storeId")}
              {/* 배정할 직원이 없으면 개인 배정 · 근무지 전체 모두 근무지 칸 바로 아래 빨간 13px 로 알린다 — 「선택한 근무지는 …」이라 근무지 칸 문구다(칸 오류와 같은 모양, 2026-11-09 사용자 지정) */}
              <FieldMessage id={`${ids}-target`} message={noAssignableStaff ? NO_ASSIGNABLE_STAFF : undefined} />
            </Stack>
            <Group label="배정대상" required>
              <ChoiceCards
                name="assigneeType"
                value={form.assigneeType}
                onChange={handleTargetChange}
                items={(["INDIVIDUAL", "ALL"] as const).map((v) => ({ value: v, title: `${labelOf(labels.assigneeType, v)} ${TARGET_SUFFIX[v]}`, icon: TARGET_ICON[v] }))}
              />
            </Group>
            {form.assigneeType === "INDIVIDUAL" ? (
              <Group label="직원" required>
                {!form.storeId ? (
                  <span className="text-[14px] text-erp-muted">근무지를 먼저 선택해 주세요.</span>
                ) : (
                  <>
                    <SearchField
                      value={word}
                      onValueChange={setWord}
                      placeholder="이름 또는 휴대전화번호 끝자리"
                      aria-label="직원 찾기"
                      aria-describedby={describe("staff")}
                    />
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
                    {/* 「선택할 수 있는 직원」 · 「선택한 직원」을 제목 줄 있는 두 상자로 나눈다 — 목록과 고른 값이 한눈에 갈리게.
                        BP 관리자 등록의 점포 고르기(store-mapping-picker) 상자와 같은 모양: 4px 테두리 상자 · 42px 회색 제목 줄 + 회색 개수(2026-11-09 사용자 지정, 3팀 확인 필요) */}
                    {/* 「선택할 수 있는 직원」 상자는 바탕 전체를 옅은 회청(#f8f9fb, 두 바탕 규칙의 둘째 색)으로 — 흰 칩이 떠 보이고 「선택한 직원」(흰 바탕)과 갈린다(2026-11-09 사용자 지정) */}
                    {pool?.state === "ok" && (
                      <section className={`${STAFF_BOX} bg-erp-thead-bg`}>
                        <h4 className={STAFF_BOX_HEAD}>
                          선택할 수 있는 직원 <span className="font-normal text-erp-label">{candidates.length}명</span>
                        </h4>
                        <ul aria-label="선택할 수 있는 직원" className="flex max-h-[160px] flex-wrap gap-[6px] overflow-y-auto p-[12px]">
                          {candidates.length === 0 ? (
                            <li className="text-[14px] leading-[1.6] whitespace-pre-line text-erp-muted">{pool.staff.length ? (form.staff.length === pool.staff.length ? "모든 직원을 선택했습니다." : "맞는 직원이 없습니다.") : "선택할 수 있는 직원이 없습니다."}</li>
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
                      </section>
                    )}
                    <section className={`${STAFF_BOX} bg-white`}>
                      <h4 className={STAFF_BOX_HEAD}>
                        선택한 직원 <span className="font-normal text-erp-label">{form.staff.length}명</span>
                      </h4>
                      {form.staff.length === 0 ? (
                        <p className="p-[12px] text-[14px] text-erp-muted">위 목록에서 직원을 눌러 선택하세요.</p>
                      ) : (
                        <ul aria-label="선택한 직원" className="flex flex-wrap gap-[6px] p-[12px]">
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
                    </section>
                  </>
                )}
                {message("staff")}
              </Group>
            ) : (
              <Group label="수행 방식" required>
                <ChoiceCards
                  name="executionMode"
                  value={form.executionMode}
                  onChange={(v) => set("executionMode", v)}
                  items={(["EACH", "ANY_ONE"] as const).map((v) => ({ value: v, title: v === "ANY_ONE" ? MODE_ANY_ONE_TITLE : labelOf(labels.executionMode, v), desc: MODE_DESC[v] }))}
                />
              </Group>
            )}
          </FormGroup>
        )}
      </div>

      {!detail && (
        // 목업 「TO-DO 안내」(2026-11-06 사용자 지정 — 전엔 「배정 방식이 만드는 차이」 · 「배정방식 안내」). 전엔 회색 상자 안 굵은 글자였다 — 안내 박스(GuideBand)로 바꿨다(2026-11-06 사용자 지정)
        <GuideBand
          title="TO-DO 안내"
          lines={[
            // 배정할 수 있는 직원 — 맨 앞 줄(2026-11-06 사용자 지정). 개인 배정 줄에 있던 같은 조건은 여기로 옮겼다
            <>
              TO-DO는 <u>근로계약이 체결 완료되고 가입을 마친 재직 직원(퇴직 예정 포함)</u>에게만 배정할 수 있습니다.
            </>,
            <>
              <b className="font-medium text-erp-ink">개인 배정</b> – 선택한 직원 한 명당 1건씩 등록됩니다. 근무지를 변경하면 선택한 직원이 초기화됩니다.
            </>,
            <>
              <b className="font-medium text-erp-ink">근무지 전체 · 각자 수행</b> – 모든 직원이 완료해야 완료됩니다. <u>등록 후 입사한 직원에게는 배정되지 않습니다.</u>
            </>,
            <>
              <b className="font-medium text-erp-ink">근무지 전체 · 한 명만 수행</b> – 한 명이 완료하면 모든 직원에게 완료로 표시됩니다.
            </>,
            // 놓치면 안 되는 제한이라 빨간 글자(2026-11-06 사용자 지정)
            <>
              <span className="text-erp-off">근무지 · 배정대상 · 수행 방식은 등록한 뒤에 변경할 수 없습니다.</span>
            </>,
          ]}
        />
      )}
    </div>
  );
}
