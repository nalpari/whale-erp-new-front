import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DetailTable, PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import type { EnumValue } from "@/lib/enums";
import { hqSharingConsentText, kstToday, staffEmailText } from "@/lib/staff-members";
import { getStaffMember, staffMemberIdOf } from "@/lib/staff-members-api";
import { staffListHref } from "../staff-list-query";
import { ResendInvitationButton } from "../resend-invitation-button";
import { canResendInvitation, EMPLOYMENT_TYPE_LABELS, employmentStatusCells, formatPhone, invitationText, joinCell } from "../staff-row";
import { CellView } from "../staff-table";
import { ContractBox } from "./contract-box";
import { AreaLoading, Box, BoxMessage } from "./detail-box";
import { PasswordResetButton, StaffDetailActions } from "./staff-detail-actions";
import { PayslipBox, ScheduleBox, TodoListBox, TodoSummaryFoot } from "./summary-boxes";
import { mondayOf, weekStartParam } from "./summary-view";
import { TodoManageLink } from "./todo-links";
import { WeekNav } from "./week-nav";

export const metadata: Metadata = {
  title: "직원 상세 · Whale ERP",
};

// 값이 없는 칸.
const PENDING = "-";

function NotReady() {
  return <BoxMessage>준비 중입니다.</BoxMessage>;
}

// 오른쪽 영역의 「관리」. 근무스케줄 · 출퇴근 현황 · 급여명세서는 아직 링크를 걸지 않는다 — 각 관리 화면으로 가는 링크는
// WHALEERP-186(현황 영역의 관리 화면 이동) 몫이다. 메뉴 url(#592 결정)은 근무스케줄 /work-schedules · 출퇴근 현황
// /attendance-records · 급여명세서 /payslips. TO-DO 는 화면(#116)과 메뉴 url(MN000026 /todos)이 생겨 걸었다.

// 가입 상태 한글(이메일 칸, WHALEERP-180). 받지 못해도 상세는 그린다 — 이메일 칸만 「-」가 되고 원인은 서버 로그에 남긴다.
async function loadJoinStateLabels(): Promise<EnumValue[]> {
  try {
    return await getEnum("StaffJoinState");
  } catch (error) {
    console.error("직원 상세: GET /enums/StaffJoinState 를 받지 못했습니다", error);
    return [];
  }
}

// 초대 유형 · 상태 한글(「초대」 줄, WHALEERP-138)과 본사 제공 동의 한글(WHALEERP-184). 받지 못해도 상세는 그린다 — 그 조각만 「-」가 되거나 빠지고 원인은 서버 로그에 남긴다.
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
// 기본 정보는 상세 api(GET /staff-members/:id, WHALEERP-599 · 183)로 받는다 — 목록 한 줄에 계정 이메일 · 직무 · 입사일 · 생년월일을 더한 모양이다.
// 근로계약 · 근무스케줄 · 급여명세서 · TO-DO 건수는 영역마다 상세 요약 api(GET /staff-members/:id/summary/…, WHALEERP-183)로 따로 받아
// 한 영역만 실패하거나 그 영역 메뉴 권한이 없어도 나머지는 그린다(summary-boxes.tsx). 가린 직원 · 없는 직원 · 이상한 id 는 404 다.
export default async function StaffMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: rawId } = await params;
  const search = await searchParams;
  const [staff, joinStateLabels, invitationTypeLabels, invitationStatusLabels, hqConsentLabels] = await Promise.all([
    getStaffMember(rawId),
    loadJoinStateLabels(),
    loadEnumOrEmpty("InvitationType"),
    loadEnumOrEmpty("InvitationStatus"),
    loadEnumOrEmpty("HqSharingConsentState"),
  ]);
  const staffMemberId = staffMemberIdOf(rawId);
  if (!staff || staffMemberId === null) notFound();
  const employmentStatus = employmentStatusCells(staff);
  const hqConsent = hqSharingConsentText(staff, hqConsentLabels);
  const listHref = staffListHref(search);
  // 근무스케줄 영역이 볼 주. 주소에 없거나 날짜가 아니면 이번 주(api 도 빼면 이번 주다)
  const weekStart = weekStartParam(search.weekStart);
  const monday = mondayOf(weekStart ?? kstToday());

  const basicRows = [
    // 재직 상태는 이름 옆 칩이다(184 완료 조건 2 「이름 아래」 — 줄 높이 46 이 고정이라 옆에 둔다). 본인인증은 1차 범위 밖이라(WHALEERP-612 → 2차)
    // 줄도 칩도 두지 않는다(2026-10-21 재영).
    {
      label: "이름",
      value: (
        <span className="inline-flex min-w-0 items-center gap-[10px]">
          <span className="truncate">{staff.name}</span>
          {employmentStatus.map((cell) => (
            <CellView key={cell.text} cell={cell} />
          ))}
        </span>
      ),
    },
    { label: "직무", value: staff.jobTitle || PENDING },
    { label: "고용 형태", value: staff.employmentType ? EMPLOYMENT_TYPE_LABELS[staff.employmentType] : PENDING },
    { label: "소속 근무지", value: staff.store.name },
    // 입사일은 나중에 시스템이 첫 체결 계약 시작일로 채운다. 지금은 늘 null 이라 「-」다(2026-10-21 재영)
    { label: "입사일", value: staff.hiredDate ?? PENDING },
    // 퇴직 예정 · 퇴직이면 퇴직일을 보인다(목업 detail.html)
    ...(staff.retiredDate ? [{ label: "퇴직일", value: staff.retiredDate }] : []),
    // 가입한 계정 값, 가입 전 · 탈퇴면 가장 최근 계약에 적은 값(api #183). api 가 주는 대로 보이고 화면에서 따로 가리지 않는다(2026-10-21 재영)
    { label: "생년월일", value: staff.birthDate ?? PENDING },
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
    // 계정 이메일(회원 ID) — 상세를 볼 수 있으면 보이고, 고치지 못한다(ACC-17, WHALEERP-180). 없을 때의 표시는 staffEmailText.
    { label: "이메일", value: staffEmailText(staff, joinStateLabels) },
    // 가맹 점포 직원만 동의 · 미동의 한 줄, 직영 점포 직원은 줄이 없다(184 완료 조건 8, ATT-30)
    ...(hqConsent === null ? [] : [{ label: "본사 제공 동의", value: hqConsent }]),
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
                {/* 가장 최근 계약 1건 — 근로계약 영역 요약(api #183). 계약이 없으면 그 칸이 작성으로 넘긴다 */}
                <Box title="근로계약" manageHref={staff.contract ? `/contracts/${staff.contract.contractId}` : "/contracts"}>
                  <Suspense fallback={<AreaLoading />}>
                    <ContractBox staffMemberId={staffMemberId} />
                  </Suspense>
                </Box>
              </div>
              {/* 영역마다 따로 받는다 — 한 영역이 실패해도 그 영역에만 안내 · 다시 하기를 그리고 나머지는 그대로다 */}
              <div className="flex min-w-0 flex-col gap-[24px]">
                <Box title="근무스케줄" tools={<WeekNav monday={monday} search={search} />}>
                  {/* 주를 바꾸면 이 영역만 다시 기다린다 */}
                  <Suspense key={monday} fallback={<AreaLoading />}>
                    <ScheduleBox staffMemberId={staffMemberId} weekStart={monday} />
                  </Suspense>
                </Box>
                {/* 출퇴근 현황 api 는 아직 없다(api #183 「하지 않은 것」) */}
                <Box title="출퇴근 현황">
                  <NotReady />
                </Box>
                <Box title="급여명세서">
                  <Suspense fallback={<AreaLoading />}>
                    <PayslipBox staffMemberId={staffMemberId} />
                  </Suspense>
                </Box>
                <Box title="TO-DO" manage={<TodoManageLink href="/todos" />}>
                  {/* 목록(#118)과 요약(api #183)은 따로 받고 따로 실패한다. 한 Suspense 로 묶어 칸 높이가 두 번 바뀌지 않게 한다 */}
                  <Suspense fallback={<AreaLoading />}>
                    <TodoListBox staffMemberId={staffMemberId} />
                    <TodoSummaryFoot staffMemberId={staffMemberId} />
                  </Suspense>
                </Box>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
