// TO-DO 등록 · 수정 폼의 순수 로직 — 입력 검사, 입력값 → api 본문, 개인 배정 직원 고르기.
// 상한 · 문구는 api CreateTodoDto(제목 100자 · 내용 2,000자 · 직원 200명 · 한국 날짜로 오늘 이후)와 같게 둔다 — api 가 다시 본다.
// node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { components } from "../../lib/api-types.generated.ts";

type Schemas = components["schemas"];
export type CreateTodoBody = Schemas["CreateTodoDto"];
export type UpdateTodoBody = Schemas["UpdateTodoDto"];
type TodoDetail = Schemas["TodoDetailDto"];

/**
 * 개인 배정으로 고를 · 고른 직원. GET /todos/assignable-staff 한 줄 그대로다 — 그 근무지에 체결 완료 근로계약이 있고 가입을 마친 재직 직원(퇴직 예정 포함)
 * (운영 정책 PAY-16 · CTR-29). 수정 화면에서는 배정을 글자로만 보여 번호 끝자리 · 직무가 비어 있다.
 */
export type PickedStaff = Schemas["AssignableStaffItemDto"];

export interface TodoForm {
  title: string;
  body: string;
  storeId: string;
  assigneeType: Schemas["TodoAssigneeType"];
  /** 개인일 때만 쓴다 */
  staff: PickedStaff[];
  /** 근무지 전체일 때만 쓴다 */
  executionMode: Schemas["TodoExecutionMode"];
  dueDate: string;
  /** HH:mm. 빈 값이면 날짜만 */
  dueTime: string;
  isUrgent: boolean;
}

const MAX_TITLE = 100;
const MAX_BODY = 2000;
const MAX_STAFF = 200;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** 처음 값은 목업 등록 칸과 같다 — 근무지 전체 · 각자 수행. 날짜는 오늘(KST) */
export function initialForm(today: string, storeId = ""): TodoForm {
  return { title: "", body: "", storeId, assigneeType: "ALL", staff: [], executionMode: "EACH", dueDate: today, dueTime: "", isUrgent: false };
}

/** 수정 화면의 처음 값. 근무지 · 배정은 읽기 전용으로만 보인다 */
export function fromDetail(d: TodoDetail): TodoForm {
  return {
    title: d.title,
    body: d.body ?? "",
    storeId: String(d.storeId),
    assigneeType: d.assigneeType,
    staff: d.assignees.map((a) => ({ staffMemberId: a.staffMemberId, name: a.staffMemberName, phoneLast4: "", jobTitle: "" })),
    executionMode: d.executionMode,
    dueDate: d.dueDate,
    dueTime: d.dueTime ?? "",
    isUrgent: d.isUrgent,
  };
}

/**
 * 저장 전에 막는 것. original 이 있으면 수정이다 — 배정 칸은 보지 않고, 지난 수행 예정 날짜는 바꿨을 때만 막는다
 * (그대로 두고 제목만 고치는 것은 된다. 바꾼 칸만 보내므로 api 도 날짜를 다시 보지 않는다).
 */
export function problems(f: TodoForm, today: string, original?: Pick<TodoDetail, "dueDate">): string[] {
  const out: string[] = [];
  if (!f.title.trim()) out.push("제목을 입력해 주세요");
  else if (f.title.trim().length > MAX_TITLE) out.push("제목은 100자까지입니다");
  if (f.body.trim().length > MAX_BODY) out.push("내용은 2,000자까지입니다");
  if (!original) {
    if (!f.storeId) out.push("근무지를 골라 주세요");
    if (f.assigneeType === "INDIVIDUAL" && f.staff.length === 0) out.push("직원을 한 명 이상 골라 주세요");
    if (f.assigneeType === "INDIVIDUAL" && f.staff.length > MAX_STAFF) out.push("직원은 200명까지 고를 수 있습니다");
  }
  if (!f.dueDate) out.push("수행 예정 날짜를 입력해 주세요");
  else if (f.dueDate < today && f.dueDate !== original?.dueDate) out.push("지난 날짜는 고를 수 없습니다");
  if (f.dueTime && !TIME.test(f.dueTime)) out.push("수행 시간은 HH:mm 입니다");
  return out;
}

/** POST /todos 본문. 개인은 수행 방식을 빼고(api 가 각자 수행으로 둔다), 근무지 전체는 직원을 빼고 보낸다 */
export function toCreateBody(f: TodoForm): CreateTodoBody {
  const individual = f.assigneeType === "INDIVIDUAL";
  return {
    title: f.title.trim(),
    body: f.body.trim() || null,
    storeId: Number(f.storeId),
    assigneeType: f.assigneeType,
    ...(individual ? { staffMemberIds: f.staff.map((s) => s.staffMemberId) } : { executionMode: f.executionMode }),
    dueDate: f.dueDate,
    dueTime: f.dueTime || null,
    isUrgent: f.isUrgent,
  };
}

/** PATCH /todos/:id 본문 — 바꾼 칸만. 그룹이면 api 가 그룹 전체에 같은 값을 쓴다 */
export function toUpdateBody(d: TodoDetail, f: TodoForm): UpdateTodoBody {
  const body: UpdateTodoBody = {};
  const title = f.title.trim();
  const text = f.body.trim() || null;
  const time = f.dueTime || null;
  if (title !== d.title) body.title = title;
  if (text !== d.body) body.body = text;
  if (f.dueDate !== d.dueDate) body.dueDate = f.dueDate;
  if (time !== d.dueTime) body.dueTime = time;
  if (f.isUrgent !== d.isUrgent) body.isUrgent = f.isUrgent;
  return body;
}

/** 칩 · 후보의 글자. 이름 뒤에 직무, 직무가 없으면 번호 끝자리를 붙여 이름이 같은 직원을 가른다 */
export function staffChipText(s: PickedStaff): string {
  const note = s.jobTitle || s.phoneLast4;
  return note ? `${s.name} · ${note}` : s.name;
}

/** 이름이나 휴대전화번호 끝자리로 찾는다. 이미 고른 직원은 뺀다 */
export function matchStaff(pool: PickedStaff[], picked: PickedStaff[], word: string): PickedStaff[] {
  const w = word.trim();
  const chosen = new Set(picked.map((p) => p.staffMemberId));
  return pool.filter((p) => !chosen.has(p.staffMemberId) && (!w || p.name.includes(w) || p.phoneLast4.includes(w)));
}
