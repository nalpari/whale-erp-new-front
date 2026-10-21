import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge, DetailTable, PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import type { EnumValue } from "@/lib/enums";
import { kstToday, staffEmailText } from "@/lib/staff-members";
import { getStaffMember, staffMemberIdOf } from "@/lib/staff-members-api";
import { getStaffMemberTodos, type TodoItemList } from "@/lib/todos-api";
import { dueText, statusCells } from "../../todos/todo-row";
import { staffListHref } from "../staff-list-query";
import { ResendInvitationButton } from "../resend-invitation-button";
import { canResendInvitation, EMPLOYMENT_TYPE_LABELS, employmentStatusCells, formatPhone, invitationText, joinCell } from "../staff-row";
import { CellView } from "../staff-table";
import { ContractBox, ContractBoxLoading } from "./contract-box";
import { Box, BoxMessage } from "./detail-box";
import { PasswordResetButton, StaffDetailActions } from "./staff-detail-actions";
import { TodoManageLink, TodoTitleLink } from "./todo-links";

export const metadata: Metadata = {
  title: "직원 상세 · Whale ERP",
};

// 아직 값이 없는 칸. 상세 요약 api(WHALEERP-183)가 나오면 채운다.
const PENDING = "-";

function NotReady() {
  return <BoxMessage>준비 중입니다.</BoxMessage>;
}

// 「관리」 대상 화면이 아직 없어 링크를 걸지 않는다. 걸면 메뉴 url 이 없을 때 공통 틀이 「접근 권한이 없는 메뉴」로
// 막아 권한 문제처럼 보인다. 화면이 생기면 메뉴 url(#592 결정)을 manageHref 로 넣는다: 근무스케줄 /work-schedules ·
// 출퇴근 현황 /attendance-records · 급여명세서 /payslips. TO-DO 는 화면(#116)과 메뉴 url(MN000026 /todos)이 생겨 걸었다.
const RIGHT_BOXES: { title: string; manageHref?: string }[] = [
  { title: "근무스케줄" },
  { title: "출퇴근 현황" },
  { title: "급여명세서" },
  { title: "TO-DO", manageHref: "/todos" },
];

/** 직원 상세 TO-DO 영역에 보일 건수. api 순서(미완료 긴급 → 미완료 → 완료)의 앞쪽이다 */
const STAFF_TODO_COUNT = 5;

// 직원 상세의 TO-DO(#118). 받지 못해도 상세는 그린다 — 이 칸만 안내를 보이고 원인은 서버 로그에 남긴다.
async function loadStaffTodos(rawId: string): Promise<TodoItemList | null> {
  const id = staffMemberIdOf(rawId);
  if (id === null) return null;
  try {
    return await getStaffMemberTodos(id, STAFF_TODO_COUNT);
  } catch (error) {
    console.error("직원 상세: GET /staff-members/:id/todos 를 받지 못했습니다", error);
    return null;
  }
}

function StaffTodos({ todos, statusLabels, today }: { todos: TodoItemList | null; statusLabels: EnumValue[]; today: string }) {
  const frame = "rounded-b-[2px] border border-erp-thead-line bg-white text-[14px]";
  if (!todos) return <BoxMessage alert>TO-DO 를 불러오지 못했습니다.</BoxMessage>;
  if (todos.items.length === 0) return <BoxMessage>배정된 TO-DO 가 없습니다.</BoxMessage>;
  return (
    <ul className={frame}>
      {todos.items.map((t) => (
        <li key={t.todoId} className="flex h-[46px] items-center gap-[10px] border-b border-erp-thead-line px-[12px] last:border-b-0">
          <TodoTitleLink todoId={t.todoId} title={t.title} />
          {t.isUrgent && <Badge tone="off">긴급</Badge>}
          <span className="w-[90px] shrink-0 text-center text-erp-label">{dueText(t.dueDate, t.dueTime, today)}</span>
          <span className="flex w-[110px] shrink-0 justify-center">
            <CellView cell={statusCells({ ...t, todoCount: 1, doneCount: 0 }, statusLabels)[0]} />
          </span>
        </li>
      ))}
    </ul>
  );
}

// 가입 상태 한글(이메일 칸, WHALEERP-180). 받지 못해도 상세는 그린다 — 이메일 칸만 「-」가 되고 원인은 서버 로그에 남긴다.
async function loadJoinStateLabels(): Promise<EnumValue[]> {
  try {
    return await getEnum("StaffJoinState");
  } catch (error) {
    console.error("직원 상세: GET /enums/StaffJoinState 를 받지 못했습니다", error);
    return [];
  }
}

// 초대 유형 · 상태 한글(「초대」 줄, WHALEERP-138). 받지 못해도 상세는 그린다 — 그 조각만 빠지고 원인은 서버 로그에 남긴다.
async function loadEnumOrEmpty(name: string): Promise<EnumValue[]> {
  try {
    return await getEnum(name);
  } catch (error) {
    console.error(`직원 상세: GET /enums/${name} 를 받지 못했습니다`, error);
    return [];
  }
}

// 직원 상세(WHALEERP-184). 배치는 데모 docs/demo/staff/detail.html(원본 src/pages/staff/detail.mjs)과 같다 — 5:7 두 단,
// 왼쪽은 기본 정보 · 비밀번호 초기화 · 근로계약, 오른쪽은 근무스케줄 · 출퇴근 현황 · 급여명세서 · TO-DO.
// 데이터는 상세 api(GET /staff-members/:id, WHALEERP-599)로 받고, 목록 한 줄에 계정 이메일을 더한 모양이라 그 값만 채운다. 직무 · 입사일 · 생년월일 · 본인인증과 오른쪽 영역의 내용은 상세 요약
// api(WHALEERP-183)가 나오면 다시 작업한다. 근로계약은 응답의 가장 최근 계약으로 계약 상세를 따로 받는다(contract-box.tsx). 가린 직원 · 없는 직원 · 이상한 id 는 404 다.
export default async function StaffMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: rawId } = await params;
  const [staff, joinStateLabels, todos, todoStatusLabels, invitationTypeLabels, invitationStatusLabels] = await Promise.all([
    getStaffMember(rawId),
    loadJoinStateLabels(),
    loadStaffTodos(rawId),
    // 받지 못하면 상태가 영문 값으로 보일 뿐이라 상세는 그린다
    getEnum("TodoStatus").catch((error: unknown) => {
      console.error("직원 상세: GET /enums/TodoStatus 를 받지 못했습니다", error);
      return [];
    }),
    loadEnumOrEmpty("InvitationType"),
    loadEnumOrEmpty("InvitationStatus"),
  ]);
  if (!staff) notFound();
  const employmentStatus = employmentStatusCells(staff);
  const listHref = staffListHref(await searchParams);

  const basicRows = [
    { label: "이름", value: staff.name },
    { label: "직무", value: PENDING },
    { label: "고용 형태", value: staff.employmentType ? EMPLOYMENT_TYPE_LABELS[staff.employmentType] : PENDING },
    { label: "소속 근무지", value: staff.store.name },
    { label: "입사일", value: PENDING },
    { label: "재직 상태", value: employmentStatus.length ? employmentStatus.map((cell) => <CellView key={cell.text} cell={cell} />) : PENDING },
    // 퇴직 예정 · 퇴직이면 퇴직일을 보인다(목업 detail.html)
    ...(staff.retiredDate ? [{ label: "퇴직일", value: staff.retiredDate }] : []),
    { label: "생년월일", value: PENDING },
    { label: "휴대전화번호", value: staff.phone ? formatPhone(staff.phone) : PENDING },
    // 가입 상태 · 초대는 목록과 같은 함수다(staff-row.ts). 재발송도 목록과 같은 판정 · 버튼이다(WHALEERP-138)
    {
      label: "가입 상태",
      value: (
        <span className="inline-flex items-center gap-[6px]">
          <CellView cell={joinCell(staff, kstToday())} />
          {staff.contract && canResendInvitation(staff) && <ResendInvitationButton contractId={staff.contract.contractId} name={staff.name} />}
        </span>
      ),
    },
    { label: "초대", value: invitationText(staff.invitation, invitationTypeLabels, invitationStatusLabels) },
    // 가입할 때의 휴대폰 본인인증(identity_verifications, 계정 단위) — 직원 상세 응답에 값이 없다. 상세 요약 api(WHALEERP-183)를 기다린다
    { label: "본인인증", value: PENDING },
    // 계정 이메일(회원 ID) — 상세를 볼 수 있으면 보이고, 고치지 못한다(ACC-17, WHALEERP-180). 없을 때의 표시는 staffEmailText.
    { label: "이메일", value: staffEmailText(staff, joinStateLabels) },
  ];

  return (
    <>
      <PageBar title="직원 정보 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center gap-[6px]">
              <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">직원 상세</h2>
              <StaffDetailActions staff={staff} today={kstToday()} listHref={listHref} />
            </div>
            <div className="grid grid-cols-[5fr_7fr] items-start gap-[24px]">
              <div className="flex min-w-0 flex-col gap-[24px]">
                <DetailTable title="기본 정보" rows={basicRows} />
                <PasswordResetButton staff={staff} />
                {/* 가장 최근 계약 1건. 근로계약서를 쓰면서 직원이 생기므로 계약 없음은 거의 나오지 않는다(2026-10-19 노영주) — 임시저장 계약을 지워도 보통 직원 레코드가 함께 지워진다 */}
                <Box title="근로계약" manageHref={staff.contract ? `/contracts/${staff.contract.contractId}` : "/contracts"}>
                  {staff.contract ? (
                    <Suspense fallback={<ContractBoxLoading />}>
                      <ContractBox contractId={staff.contract.contractId} />
                    </Suspense>
                  ) : (
                    <BoxMessage>등록된 근로계약이 없습니다.</BoxMessage>
                  )}
                </Box>
              </div>
              <div className="flex min-w-0 flex-col gap-[24px]">
                {RIGHT_BOXES.map((box) => (
                  <Box
                    key={box.title}
                    title={box.title}
                    manageHref={box.manageHref}
                    manage={box.title === "TO-DO" && box.manageHref ? <TodoManageLink href={box.manageHref} /> : undefined}
                  >
                    {box.title === "TO-DO" ? <StaffTodos todos={todos} statusLabels={todoStatusLabels} today={kstToday()} /> : <NotReady />}
                  </Box>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
