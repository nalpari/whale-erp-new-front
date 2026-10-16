import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { DetailTable, PageBar } from "@/components/common";
import { kstToday } from "@/lib/staff-members";
import { getStaffMember } from "@/lib/staff-members-api";
import { staffListHref } from "../staff-list-query";
import { EMPLOYMENT_TYPE_LABELS, employmentStatusCells, formatPhone } from "../staff-row";
import { CellView } from "../staff-table";
import { PasswordResetButton, StaffDetailActions } from "./staff-detail-actions";

export const metadata: Metadata = {
  title: "직원 상세 · Whale ERP",
};

// 아직 값이 없는 칸. 상세 요약 api(WHALEERP-183)가 나오면 채운다.
const PENDING = "-";

// 데모 staff-parts.mjs 의 box — 제목 줄(오른쪽에 「관리」 링크) + 내용. 내용은 상세 요약 api 가 나온 뒤 채운다.
// manageHref 가 없으면 「관리」를 흐리게 두고 누를 수 없게 한다 — 그 화면이 아직 없다.
function Box({ title, manageHref, children }: { title: string; manageHref?: string; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <h3 className="flex h-[42px] items-center gap-[6px] rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">
        <span className="flex-1">{title}</span>
        <span className="flex items-center gap-[6px] text-[14px] font-normal">
          {manageHref ? (
            <Link href={manageHref} className="text-erp-link hover:underline">
              관리
            </Link>
          ) : (
            <span aria-disabled="true" title="준비 중입니다." className="cursor-default text-erp-muted">
              관리
            </span>
          )}
        </span>
      </h3>
      {children}
    </section>
  );
}

function NotReady() {
  return (
    <p className="flex h-[92px] items-center justify-center rounded-b-[2px] border border-erp-thead-line bg-white text-[14px] text-erp-muted">
      준비 중입니다.
    </p>
  );
}

// 「관리」 대상 화면이 아직 없어 링크를 걸지 않는다. 걸면 메뉴 url 이 없을 때 공통 틀이 「접근 권한이 없는 메뉴」로
// 막아 권한 문제처럼 보인다. 화면이 생기면 메뉴 url(#592 결정)을 manageHref 로 넣는다: 근무스케줄 /work-schedules ·
// 출퇴근 현황 /attendance-records · 급여명세서 /payslips · TO-DO /todos.
const RIGHT_BOXES: { title: string; manageHref?: string }[] = [
  { title: "근무스케줄" },
  { title: "출퇴근 현황" },
  { title: "급여명세서" },
  { title: "TO-DO" },
];

// 직원 상세(WHALEERP-184). 배치는 데모 docs/demo/staff/detail.html(원본 src/pages/staff/detail.mjs)과 같다 — 5:7 두 단,
// 왼쪽은 기본 정보 · 비밀번호 초기화 · 근로계약, 오른쪽은 근무스케줄 · 출퇴근 현황 · 급여명세서 · TO-DO.
// 데이터는 상세 api(GET /staff-members/:id, WHALEERP-599)로 받고, 목록 한 줄에 계정 이메일을 더한 모양이라 그 값만 채운다. 직무 · 입사일 · 생년월일 · 본인인증과 각 영역의 내용은 상세 요약
// api(WHALEERP-183)가 나오면 다시 작업한다. 가린 직원 · 없는 직원 · 이상한 id 는 404 다.
export default async function StaffMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await getStaffMember((await params).id);
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
    { label: "본인인증", value: PENDING },
    // 계정 이메일(로그인 아이디) — 보일 때 고치지 못한다(ACC-17). api #56 이 링크 발송과 같은 기준으로만 내서, 가입 전 · 탈퇴 · 퇴직,
    // 수정 권한 없음, 본사 역할이 보는 가맹 점포 직원이면 없어 「-」다(2026-10-16 확정, api #56 5d671d6).
    { label: "이메일", value: staff.email ?? PENDING },
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
                <Box title="근로계약" manageHref="/contracts">
                  <NotReady />
                </Box>
              </div>
              <div className="flex min-w-0 flex-col gap-[24px]">
                {RIGHT_BOXES.map((box) => (
                  <Box key={box.title} title={box.title} manageHref={box.manageHref}>
                    <NotReady />
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
