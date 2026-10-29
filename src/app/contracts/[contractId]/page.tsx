import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Button, DataTable, DetailTable, DetailValues, PageBar } from "@/components/common";
import { ApiError, authHeaders, getEnum, request } from "@/lib/api";
import { labelOf } from "@/lib/enums";
import { StatusBadge } from "../columns";
import { backHrefOf, withBack } from "../contract-list";
import { ContractPermission } from "../contract-permission";
import { canRenew, formatPhone, type ContractDetail } from "../new/contract-form-model";
import { documentNoticeOf } from "./document-notice";
import { EndContractButton } from "./end-button";
import { SendContractButton } from "./send-button";
import { sendNoticeOf } from "./send-model";
import { insuranceText, kstDateTime, partTimeRows, payDayText, probationText, processRows, weeklyHoursOf, workDayLines, type PartTimeRow } from "./detail-format";

type Status = Parameters<typeof StatusBadge>[0]["status"];

// 상태마다 위쪽에 서는 버튼(CTR-19, 2026-10-19 재영). 보내기는 저장할 때 곧바로 한다 — 「발송」 버튼은 없다.
// 발송 대기 · 서명 대기는 「재발송」과 「수정」(당사자 정보), 발송 대기는 「종료」도(채용을 접을 때, WHALEERP-327), 수정 요청은
// 「수정」(계약서 전체). 재발송은 api 가 보낼 수 없다고 하면 숨긴다(canResend — 소속 추가 확인 · 복귀 확인은 아직 보낼 길이 없다. 칸이 없는
// 옛 api 응답이면 보인다 — front 가 먼저 배포돼도 재발송 버튼이 모두 사라지지 않게). 만료 재발송(WHALEERP-153)은 아직 API 가 없어
// 비활성으로 둔다. 체결 완료와 체결 뒤 종료는 「새 계약」(재계약, WHALEERP-156) — 이 계약 값을 채운 작성 화면을 연다. 거부는 버튼이 없다.
const PENDING: Partial<Record<Status, string>> = {
  EXPIRED: "재발송",
};

// 근로계약 상세. 데모 docs/demo/staff/contracts-detail 의 틀(제목 줄 + 계약 내용 + 상태 변경 이력).
// 주휴일 · 급여 지급 방식 · 수습(정직원)도 보인다(데모 확인 2026-10-15).
export default async function ContractDetailPage({ params, searchParams }: PageProps<"/contracts/[contractId]">) {
  const { contractId: raw } = await params;
  const query = await searchParams;
  const documentNotice = documentNoticeOf(query.document);
  const contractId = Number(raw);
  if (!Number.isInteger(contractId) || contractId < 1) notFound();

  const [statuses, draftActions, employmentTypes, weekdays, payMonths, payMethods, contractMethods, documentKinds, actors, genders, headers] = await Promise.all([
    getEnum("ContractStatus"),
    getEnum("ContractDraftAction"),
    getEnum("EmploymentType"),
    getEnum("Weekday"),
    getEnum("PayMonth"),
    getEnum("PayMethod"),
    getEnum("ContractMethod"),
    getEnum("ContractDocumentKind"),
    getEnum("StatusChangeActor"),
    getEnum("Gender"),
    authHeaders(),
  ]);

  // 근로계약 관리 조회 권한이 없거나 사용 중이 아닌 계정(403)이면 api 문장을 그대로 보인다(목록과 같다)
  let c: ContractDetail | null = null;
  let notice = "로그인이 필요합니다";
  if (headers.Authorization) {
    try {
      c = await request<ContractDetail>(`/contracts/${contractId}`, { headers });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) notFound();
      if (!(e instanceof ApiError && (e.status === 401 || e.status === 403))) throw e;
      if (e.status === 403) notice = e.message;
    }
  }

  const status = (c?.status ?? null) as Status | null;
  // 저장 · 고침 뒤 가입 초대 알림톡이 실패해 이 화면으로 왔다(?send=)
  const sendNotice = sendNoticeOf(query.send, status);
  const statusCell = (s: string | null): ReactNode => (s ? <StatusBadge status={s as Status} label={labelOf(statuses, s)} /> : "-");
  const buttons: ReactNode =
    // 임시저장 삭제는 이어 쓰기 화면에만 둔다 — 삭제는 임시저장일 때만 할 수 있다.
    // 버튼은 근로계약 관리 메뉴 권한으로 가린다 — 이어 쓰기는 작성(api 가 임시저장 이어 쓰기 저장에 작성 권한을 본다), 재발송 · 수정은 수정(WHALEERP-592)
    status === "DRAFT" ? (
      <ContractPermission action="create">
        <Button variant="soft" href={withBack(`/contracts/${contractId}/edit`, query.back)}>
          이어 쓰기
        </Button>
      </ContractPermission>
    ) : (
      <>
        {(status === "PENDING_SEND" || status === "PENDING_SIGNATURE") && c?.canResend !== false && (
          <ContractPermission action="update">
            <SendContractButton contractId={contractId} status={status} name={c?.name ?? null} back={backHrefOf(query.back)} />
          </ContractPermission>
        )}
        {/* 직원이 수정을 요청했다 — 계약서 전체를 고치면 곧바로 서명 대기로 다시 보낸다(WHALEERP-125 · 126) */}
        {status === "CORRECTION_REQUESTED" && (
          <ContractPermission action="update">
            <Button variant="soft" href={withBack(`/contracts/${contractId}/edit`, query.back)}>
              수정
            </Button>
          </ContractPermission>
        )}
        {/* 날인 전 당사자 정보(이름 · 번호 · 생년월일 · 성별 · 외국인 여부) — 본인 대조 값. 저장하면 다시 보낸다 */}
        {(status === "PENDING_SEND" || status === "PENDING_SIGNATURE") && (
          <ContractPermission action="update">
            <Button variant="soft" href={withBack(`/contracts/${contractId}/worker`, query.back)}>
              수정
            </Button>
          </ContractPermission>
        )}
        {/* 채용을 접을 때 — 종료로 닫고 나간 초대를 무효로 한다(WHALEERP-327) */}
        {status === "PENDING_SEND" && (
          <ContractPermission action="update">
            <EndContractButton contractId={contractId} name={c?.name ?? null} back={backHrefOf(query.back)} />
          </ContractPermission>
        )}
        {c && canRenew(c) && (
          <ContractPermission action="create">
            <Button variant="soft" href={withBack(`/contracts/new?from=${contractId}`, query.back)}>
              새 계약
            </Button>
          </ContractPermission>
        )}
        {status && PENDING[status] && (
          <Button variant="soft" disabled title="준비 중">
            {PENDING[status]}
          </Button>
        )}
      </>
    );

  const rows = c
    ? [
        { label: "직원", value: <DetailValues items={[c.name, formatPhone(c.phone)]} /> },
        // 가입 값과 본인 대조하는 성별 · 외국인 여부(WHALEERP-125)
        { label: "성별", value: [c.gender ? labelOf(genders, c.gender) : "-", ...(c.isForeigner ? ["외국인"] : [])].join(" · ") },
        { label: "직무", value: c.jobTitle },
        { label: "근무지", value: c.storeName ?? "-" },
        { label: "고용 형태", value: labelOf(employmentTypes, c.employmentType) },
        {
          label: "상태",
          value: (
            <DetailValues
              items={[statusCell(c.status), ...(c.status === "PENDING_SEND" && c.draftAction ? [labelOf(draftActions, c.draftAction)] : [])]}
            />
          ),
        },
        // 발송일 · 재발송 · 날인 기한 · 최종 처리일 · 거부 사유, 종이 계약은 등록일 · 등록 관리자(WHALEERP-155 · 328)
        ...processRows(c),
        { label: "계약 기간", value: c.startDate ? `${c.startDate} ~ ${c.endDate ?? "무기한"}` : "-" },
        { label: "시급", value: c.wageAmount === null ? "-" : c.wageAmount.toLocaleString("ko-KR") },
        {
          label: "소정근로시간",
          // 파트타이머 표는 여러 줄이라 고정 높이(46)에서 잘리지 않게 내용만큼 늘린다
          multiline: c.employmentType === "PART_TIME" && c.workDays.length > 0,
          value: !c.workDays.length ? (
            "-"
          ) : c.employmentType === "PART_TIME" ? (
            // 파트타이머는 요일마다 시간이 다를 수 있어 작성 화면과 같은 표로 보인다 — 요일별 시각 · 근무시간 · 소계와 주휴수당 · 주급 · 월급여
            <div className="flex w-full min-w-px flex-col gap-[8px] py-[4px]">
              <span>주 {weeklyHoursOf(c.workDays).toFixed(1)}시간</span>
              <DataTable
                columns={[
                  { header: "요일", width: "w-[90px]", cell: (r: PartTimeRow) => r.label },
                  { header: "시업", cell: (r: PartTimeRow) => r.start },
                  { header: "종업", cell: (r: PartTimeRow) => r.end },
                  { header: "휴게 시작", cell: (r: PartTimeRow) => r.restStart },
                  { header: "휴게 종료", cell: (r: PartTimeRow) => r.restEnd },
                  { header: "근무시간", cell: (r: PartTimeRow) => r.hours },
                  { header: "시급", cell: (r: PartTimeRow) => r.wage },
                  { header: "소계", cell: (r: PartTimeRow) => r.amount },
                ]}
                rows={partTimeRows(c, (d) => labelOf(weekdays, d))}
                rowKey={(r) => r.key}
              />
            </div>
          ) : (
            <DetailValues items={[`주 ${weeklyHoursOf(c.workDays).toFixed(1)}시간`, ...workDayLines(c.workDays, (d) => labelOf(weekdays, d))]} />
          ),
        },
        { label: "주휴일", value: c.weeklyHoliday ? `${labelOf(weekdays, c.weeklyHoliday)}요일` : "-" },
        { label: "임금지급일", value: payDayText(c.payMonth ? labelOf(payMonths, c.payMonth) : null, c.payDay) },
        { label: "급여 지급 방식", value: c.payMethod ? labelOf(payMethods, c.payMethod) : "-" },
        ...(c.employmentType === "FULL_TIME" ? [{ label: "수습", value: probationText(c.probationMonths, c.probationWageReductionRate, c.wageAmount) }] : []),
        { label: "4대보험", value: insuranceText(c.isHealthPensionInsured, c.isEmploymentInjuryInsured) },
        { label: "근무 장소", value: c.workLocation ?? "-" },
        { label: "계약 방식", value: c.contractMethod ? labelOf(contractMethods, c.contractMethod) : "-" },
        // 종이 계약 날인본(CTR-23). 누르면 라우트 핸들러가 300초짜리 주소를 받아 원래 파일 이름으로 내려받게 한다
        // documents 는 api #49 부터 온다 — 그 전 api 와 함께 떠도 상세가 깨지지 않게 없으면 빈 것으로 본다.
        ...(c.documents?.length
          ? [
              {
                label: "날인본",
                value: (
                  <DetailValues
                    items={c.documents.map((d) => (
                      <a key={d.contractDocumentId} href={`/contracts/${c.contractId}/documents/${d.contractDocumentId}`} className="text-erp-link hover:underline">
                        {labelOf(documentKinds, d.kind)} · {d.fileName}
                      </a>
                    ))}
                  />
                ),
              },
            ]
          : []),
      ]
    : [];
  const histories = c?.histories ?? [];

  return (
    <>
      <PageBar title="근로계약 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center gap-[6px]">
              <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">근로계약 상세</h2>
              {buttons}
              <Button href={backHrefOf(query.back)}>목록</Button>
            </div>
            {sendNotice && (
              <p role="alert" className="rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] font-semibold text-erp-off">
                {sendNotice}
              </p>
            )}
            {documentNotice && (
              <p role="alert" className="rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] font-semibold text-erp-off">
                {documentNotice}
              </p>
            )}
            {c ? (
              <DetailTable title="계약 내용" rows={rows} />
            ) : (
              <p className="text-[14px] font-semibold text-erp-ink">{notice}</p>
            )}
          </div>
          {c && (
            <div className="flex flex-col gap-[12px]">
              <h3 className="text-[15px] font-semibold text-erp-ink">상태 변경이력</h3>
              <DataTable
                columns={[
                  { header: "일시", width: "w-[160px]", cell: (h) => kstDateTime(h.changedAt) },
                  { header: "변경 전", width: "w-[140px]", cell: (h) => statusCell(h.fromStatus) },
                  { header: "변경 후", width: "w-[140px]", cell: (h) => statusCell(h.toStatus) },
                  { header: "처리 주체", cell: (h) => labelOf(actors, h.actor) },
                ]}
                rows={histories}
                rowKey={(h) => `${h.changedAt}-${h.toStatus}`}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
