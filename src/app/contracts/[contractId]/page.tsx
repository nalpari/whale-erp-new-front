import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Button, DataTable, DetailTable, DetailValues, PageBar, RoundBox, RoundEmpty, RoundRows, SummaryStrip } from "@/components/common";
import { ApiError, authHeaders, deniedMessageOf, getEnum, request, screenPath } from "@/lib/api";
import { labelOf } from "@/lib/enums";
import { StatusBadge } from "../columns";
import { backHrefOf, withBack } from "../contract-list";
import { ContractPermission } from "../contract-permission";
import { canRenew, formatPhone, type ContractDetail } from "../new/contract-form-model";
import { documentNoticeOf } from "./document-notice";
import { documentRowsOf } from "./document-rows";
import { EndContractButton } from "./end-button";
import { SendContractButton } from "./send-button";
import { canShowResend, sendNoticeOf } from "./send-model";
import { insuranceText, kstDateTime, PAY_SUMMARY_KEYS, partTimeRows, payDayText, probationText, processRows, TAX_PROFILE_UNAVAILABLE, taxProfileTexts, weeklyHoursOf, type PartTimeRow } from "./detail-format";
import { StoreNameWithType } from "@/components/site/store-type-tag";
import { WithIcon } from "../../platform-admins/admin-table";

type Status = Parameters<typeof StatusBadge>[0]["status"];

// 상태마다 위쪽에 서는 버튼(CTR-19, 2026-10-19 재영). 보내기는 저장할 때 곧바로 한다 — 「발송」 버튼은 없다.
// 발송 대기 · 서명 대기는 「재발송」과 「수정」(당사자 정보), 발송 대기는 「종료」도(채용을 접을 때, WHALEERP-327), 수정 요청은
// 「수정」(계약서 전체). 재발송은 api 가 보낼 수 없다고 하면 숨긴다(canShowResend — 소속 추가 확인 · 복귀 확인은 소속 추가 확인 요청을
// 다시 보낸다, api #164). 거부 · 만료도 같은 조건으로 「재발송」한다(WHALEERP-153). 체결 완료와 체결 뒤 종료는 「재계약」(
// WHALEERP-156) — 이 계약 값을 채운 작성 화면을 연다.

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

  // 근로계약 관리 조회 권한이 없거나 사용 중이 아닌 계정(403) · BP 를 고르지 않은 플랫폼 계정(400)이면 api 문장을 그대로 보인다(목록과 같다)
  let c: ContractDetail | null = null;
  let notice = "로그인이 필요합니다.";
  if (headers.Authorization) {
    try {
      c = await request<ContractDetail>(`/contracts/${contractId}`, { headers });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) notFound();
      // api 의 거절(BP 를 고르지 않음 400 · 권한 · 다른 BP 403 — deniedMessageOf)은 그 문장을 보인다. 404(없는 계약 · 없는 BP)는 위에서 찾을 수 없음 화면이다
      const denied = deniedMessageOf(e);
      if (denied === null) throw e;
      if (denied !== null) notice = denied;
    }
  }

  const status = (c?.status ?? null) as Status | null;
  // 링크는 옛 경로에 탭 BP 를 붙여 그린다. ?back= 은 옛 경로 그대로다
  const at = await screenPath();
  // 저장 · 고침 뒤 가입 초대 · 소속 추가 확인 요청 알림톡이 실패해 이 화면으로 왔다(?send= · 무엇을 ?delivery= · 왜 ?failure=)
  const sendNotice = sendNoticeOf(query.send, status, query.delivery, query.failure);
  const statusCell = (s: string | null): ReactNode => (s ? <StatusBadge status={s as Status} label={labelOf(statuses, s)} /> : "-");
  const buttons: ReactNode =
    // 임시저장 삭제는 이어 쓰기 화면에만 둔다 — 삭제는 임시저장일 때만 할 수 있다.
    // 버튼은 근로계약 관리 메뉴 권한으로 가린다 — 이어 쓰기는 작성(api 가 임시저장 이어 쓰기 저장에 작성 권한을 본다), 재발송 · 수정은 수정(WHALEERP-592)
    status === "DRAFT" ? (
      <ContractPermission action="create">
        <Button variant="soft" href={at(withBack(`/contracts/${contractId}/edit`, query.back))}>
          이어 쓰기
        </Button>
      </ContractPermission>
    ) : (
      <>
        {canShowResend(status, c?.canResend) && (
          <ContractPermission action="update">
            <SendContractButton contractId={contractId} status={status} sentAt={c?.lastSentAt ?? null} name={c?.name ?? null} back={backHrefOf(query.back)} staffJoined={c?.staffJoined ?? false} />
          </ContractPermission>
        )}
        {/* 직원이 수정을 요청했다 — 계약서 전체를 고치면 곧바로 서명 대기로 다시 보낸다(WHALEERP-125 · 126) */}
        {status === "CORRECTION_REQUESTED" && (
          <ContractPermission action="update">
            <Button variant="soft" href={at(withBack(`/contracts/${contractId}/edit`, query.back))}>
              수정
            </Button>
          </ContractPermission>
        )}
        {/* 날인 전 당사자 정보(이름 · 번호 · 생년월일 · 성별 · 외국인 여부) — 본인 대조 값. 저장하면 다시 보낸다 */}
        {(status === "PENDING_SEND" || status === "PENDING_SIGNATURE") && (
          <ContractPermission action="update">
            <Button variant="soft" href={at(withBack(`/contracts/${contractId}/worker`, query.back))}>
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
            <Button variant="soft" href={at(withBack(`/contracts/new?from=${contractId}`, query.back))}>
              재계약
            </Button>
          </ContractPermission>
        )}
      </>
    );

  // 화면을 두 칸으로 — 오른쪽 「진행 현황」은 계약서의 상태 정보(상태 · 계약 방식 · 발송 · 처리 · 계약서 파일)와 상태 변경이력, 왼쪽 「직원 · 근로 정보」는
  // 직원 정보와 근로 조건이다(2026-11-19 사용자 지정, 전엔 한 표에 섞여 있었다)
  const statusRows = c
    ? [
        // 상태 · 계약 방식은 제목 아래 줄로 옮겨 여기서는 다시 적지 않는다(2026-11-19 사용자 지정)
        // 발송일 · 재발송 · 서명 기한 · 최종수정(WHALEERP-699) · 수정 요청 사유(수정 요청일 때, WHALEERP-635), 종이 계약은 등록일 · 등록 관리자(WHALEERP-155 · 328).
        // 최종수정은 다른 상세 화면과 같이 「일시 · 사람」의 사람을 회색, 없으면 흐린 「-」
        // 수정 요청 사유는 맨 위 — 사장님이 지금 고쳐야 할 것이라(2026-11-19 사용자 지정, 전엔 맨 아래)
        ...[...processRows(c)].sort((a, b) => Number(b.label === "수정 요청 사유") - Number(a.label === "수정 요청 사유")).map(({ by, muted, ...row }) => ({
          ...row,
          value: muted ? (
            <span className="text-erp-muted">{row.value}</span>
          ) : by ? (
            // 긴 이름(로그인 아이디)은 값 칸 폭에서 말줄임하고 마우스를 올리면 전체를 보인다(관리자 상세 when() 과 같다)
            <span className="truncate" title={`${row.value} · ${by}`}>
              {row.value} <span className="text-erp-label">· {by}</span>
            </span>
          ) : (
            row.value
          ),
        })),
        // 계약 방식은 제목 아래 줄(계약 방식 ┃ 상태)로 옮겨 여기서는 다시 적지 않는다(2026-11-19 사용자 지정)
      ]
    : [];
  // 계약서 파일은 내려받는 것이라 정보 줄과 따로 「계약서 파일」 상자로(2026-11-19 사용자 지정). 파일 줄이 없으면 상자를 두지 않는다
  const fileRows = c
    ? [
        // 계약서 파일 — 종이 계약은 날인본(CTR-23), 전자계약은 처리 완료본(서명 확인)과 보낸 원본(WHALEERP-155 · 131). 누르면 라우트
        // 핸들러가 300초짜리 주소를 받아 원래 파일 이름으로 내려받게 한다. documents 는 api #49 부터 온다 — 없으면 빈 것으로 본다.
        ...documentRowsOf({
          contractMethod: c.contractMethod,
          status: c.status,
          histories: c.histories ?? [],
          documents: c.documents ?? [],
          lastSentAt: c.lastSentAt,
        }).flatMap((row) => {
          const link = (d: (typeof row.documents)[number]) => (
            <a href={at(`/contracts/${c.contractId}/documents/${d.contractDocumentId}`)} className="truncate text-erp-link hover:underline">
              {row.withKind ? `${labelOf(documentKinds, d.kind)} · ${d.fileName}` : d.fileName}
            </a>
          );
          // 파일 줄 사이는 8px — 4px 는 링크끼리 붙어 보였다. 파일 이름은 내려받는 링크라 파랑 그대로(2026-11-23 사용자 확인)
          const list = (docs: typeof row.documents) => docs.map((d) => <span key={d.contractDocumentId} className="flex min-w-0">{link(d)}</span>);
          // 보낸 원본은 맨 위(가장 최근)만 「보낸 원본」 줄에 두고 옆에 회색 「(최근 발송)」, 앞서 보낸 것은 따로 「이전 원본」 줄에서 「N장」을
          // 눌러 펼친다 — 「보낸 원본」 줄 안의 「이전 원본 N장」은 무엇인지 헷갈렸다(2026-11-23 사용자 지정, 전엔 2026-11-19 같은 줄 접기)
          const [latest, ...older] = row.label === "보낸 원본" ? row.documents : [];
          const main = {
            label: row.label,
            multiline: (row.label === "보낸 원본" ? 1 : row.documents.length) > 1 || !!row.note,
            labelTop: true,
            value: row.empty ? (
              <span className="text-erp-sub">{row.empty}</span>
            ) : (
              <span className="flex min-w-0 flex-col gap-[8px]">
                {row.label !== "보낸 원본" ? (
                  list(row.documents)
                ) : (
                  latest && (
                    <span className="flex min-w-0 items-center gap-[6px]">
                      {link(latest)}
                      {/* 새 원본을 만드는 중(row.note)이면 맨 위 파일은 지난 원본이라 「(최근 발송)」을 붙이지 않는다(ip-code-review) */}
                      {!row.note && <span className="shrink-0 text-erp-label">(최근 발송)</span>}
                    </span>
                  )
                )}
                {row.note && <span className="text-erp-sub">{row.note}</span>}
              </span>
            ),
          };
          if (!older.length) return [main];
          return [
            main,
            {
              label: "이전 원본",
              multiline: true,
              labelTop: true,
              value: (
                <details className="group flex min-w-0 flex-col">
                  <summary className="flex w-fit cursor-pointer list-none items-center gap-[4px] text-erp-label hover:text-erp-ink [&::-webkit-details-marker]:hidden">
                    {older.length}장
                    <svg aria-hidden viewBox="0 0 12 12" className="size-[12px] transition-transform duration-150 group-open:rotate-180">
                      <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <span className="mt-[8px] flex flex-col gap-[8px]">{list(older)}</span>
                </details>
              ),
            },
          ];
        }),
      ]
    : [];
  // 세 묶음 — 왼쪽 「직원 정보」(누구) · 「근로 정보」(근로 조건), 오른쪽 「발송 · 서명 정보」(2026-11-19 사용자 지정)
  const taxValue = (v: string) => (v === TAX_PROFILE_UNAVAILABLE ? <span className="text-erp-label">{v}</span> : v);
  const staffRows = c
    ? [
        // 휴대전화번호 앞에 휴대폰 아이콘 — 직원 목록 · 관리자 목록의 연락처와 같은 모양(WithIcon, 2026-11-19 사용자 지정)
        // 이름 ┃ 휴대전화번호 ┃ 성별(· 외국인)을 한 줄에 — 성별 · 외국인 여부는 가입 값과 본인 대조하는 값이다(WHALEERP-125, 2026-11-19 사용자 지정 — 전엔 「성별」 줄 따로)
        {
          label: "직원",
          value: (
            <DetailValues
              items={[
                c.name,
                <WithIcon key="phone" icon="phone">{formatPhone(c.phone)}</WithIcon>,
                [c.gender ? labelOf(genders, c.gender) : "성별 -", ...(c.isForeigner ? ["외국인"] : [])].join(" · "),
              ]}
            />
          ),
        },
        // 직원 신고 정보(WHALEERP-155) — 읽기만, 고치는 것은 직원 본인(TAX-07)
        // 신고 정보를 풀지 못하면(UNAVAILABLE) 안내 문구는 「(근무 장소 동일)」과 같은 회색 — 값이 아니라 안내라서(2026-11-19 사용자 지정)
        { label: "주민등록번호", value: taxValue(taxProfileTexts(c.taxProfile).rrn) },
        // 급여 계좌는 직원이 신고한 정보라 직원 정보에(2026-11-19 사용자 지정)
        { label: "급여 계좌", value: taxValue(taxProfileTexts(c.taxProfile).account) },
      ]
    : [];
  const sameWorkLocation = !!c && (!c.workLocation || c.workLocation.trim() === (c.storeName ?? "").trim());
  const rows = c
    ? [
        // 표준근로계약서 순서 — 근로계약기간 → 근무장소 → 업무의 내용(직무) → 고용 형태 → 근로시간 → 휴일 → 임금 → 사회보험. 직원이 받는 계약서와
        // 대조하기 쉽게(2026-11-19 사용자 지정 — 직원 상세의 「직무 · 고용 형태 · 소속 근무지」 순서보다 계약서 순서를 앞세웠다)
        // 종료일이 없으면 표준근로계약서 용어 「기간의 정함 없음」 — 작성 화면 안내(「기간의 정함이 없는 계약」)와 같은 말(2026-11-19 사용자 지정, 전엔 「무기한」)
        { label: "계약 기간", value: c.startDate ? `${c.startDate} ~ ${c.endDate ?? "기간의 정함 없음"}` : "-" },
        // 근무지 이름 앞에 본사 · 직영 · 가맹 꼬리표 — 홈 운영 점포별 현황과 같은 모양(2026-11-19 사용자 지정)
        // 근무 장소는 따로 줄을 두지 않고 이 줄 끝에 회색으로 — 같으면 「(근무 장소 동일)」(비어 있으면 api 가 보낼 때 근무지명을 넣으니 같다), 다르면
        // 「(근무 장소: …)」(2026-11-19 사용자 지정)
        {
          label: "소속 근무지",
          value: c.storeName ? (
            <span className="flex min-w-0 items-center gap-[6px]">
              <StoreNameWithType storeId={c.storeId} name={c.storeName} isHq={c.storeIsHq} />
              <span className="min-w-0 truncate text-erp-label">{sameWorkLocation ? "(근무 장소 동일)" : `(근무 장소: ${c.workLocation})`}</span>
            </span>
          ) : c.workLocation ? (
            // 근무지 이름이 비어도 계약서의 근무 장소는 보인다 — 전엔 「근무 장소」 줄이 따로 있었다(ip-code-review)
            <span className="text-erp-label">(근무 장소: {c.workLocation})</span>
          ) : (
            "-"
          ),
        },
        // 「직무」만 — 고용 형태는 위 요약 띠에 있다(2026-11-19 사용자 지정, 전엔 「근무 형태 | 정직원 ┃ 홀서빙」)
        { label: "직무", value: c.jobTitle || "-" },
        {
          label: "소정근로시간",
          // 요일별 표는 여러 줄이라 고정 높이(46)에서 잘리지 않게 내용만큼 늘린다 — 정직원도 작성 화면처럼 표다(2026-11-19 사용자 지정)
          multiline: c.workDays.length > 0,
          labelTop: c.workDays.length > 0, // 표가 붙는 줄 — 줄 이름은 「주 N 시간」 줄 높이에 맞춰 위로 — 값 칸 위 여백(py-4)을 빼야 같은 줄에 선다(2026-11-19 사용자 지정)
          value: !c.workDays.length ? (
            "-"
          ) : c.employmentType === "PART_TIME" ? (
            // 파트타이머는 요일마다 시간이 다를 수 있어 작성 화면과 같은 표로 보인다 — 요일별 시각 · 근무시간 · 소계와 주휴수당 · 주급 · 월급여
            <div className="flex w-full min-w-px flex-col gap-[8px] pb-[4px]">
              {/* 소수점은 필요할 때만 — 「주 3 시간」 · 「주 3.5 시간」, 작성 화면과 같다(2026-11-19 사용자 지정, 전엔 늘 「주 3.0 시간」) */}
              <span>주 {Number(weeklyHoursOf(c.workDays).toFixed(2))} 시간</span>
              <DataTable
                columns={[
                  // 소계 · 주휴수당 · 주급 · 월급여 줄 이름은 굵게(가운데 그대로) — 요일 줄과 갈린다(2026-11-19 사용자 지정)
                  {
                    header: "요일",
                    width: "w-[80px]", // 「주휴수당」(굵게)이 들어가는 만큼만 — 상세는 두 칸 배치라 시각 네 열은 폭을 고정하지 않고 남는 폭을 나눈다

                    cell: (r: PartTimeRow) => (PAY_SUMMARY_KEYS.has(r.key) ? <span className="font-semibold">{r.label}</span> : r.label),
                  },
                  { header: "근무 시작", divider: true, cell: (r: PartTimeRow) => r.start },
                  { header: "근무 종료", cell: (r: PartTimeRow) => r.end },
                  // 묶음(요일 / 근무 / 휴게 / 근로시간 · 금액) 사이에만 세로줄 — 작성 화면과 같다(2026-11-19 사용자 지정)
                  { header: "휴게 시작", divider: true, cell: (r: PartTimeRow) => r.restStart },
                  { header: "휴게 종료", cell: (r: PartTimeRow) => r.restEnd },
                  // 근로시간 · 시급 · 소계는 오른쪽 정렬, 폭은 근로시간 < 시급 < 소계(남는 폭) — 시각 네 열은 드롭다운(96px)이 들어가는 130px 로 고정(2026-11-19 사용자 지정)
                  { header: "근로시간", width: "w-[80px]", align: "right", divider: true, cell: (r: PartTimeRow) => r.hours },
                  // 금액 열(시급 · 소계)은 오른쪽 정렬 — 작성 화면과 같다(2026-11-19 사용자 지정)
                  { header: "시급", width: "w-[110px]", align: "right", cell: (r: PartTimeRow) => r.wage },
                  { header: "소계", width: "w-[120px]", align: "right", cell: (r: PartTimeRow) => r.amount },
                ]}
                rows={partTimeRows(c, (d) => labelOf(weekdays, d))}
                rowKey={(r) => r.key}
                // 요일 줄 아래 합계 줄(소계 · 주휴수당 · 주급 · 월급여)은 표 머리 바탕으로 가른다 — 작성 화면과 같다(2026-11-19 사용자 지정)
                rowState={(r) => (PAY_SUMMARY_KEYS.has(r.key) ? "group" : undefined)}
              />
            </div>
          ) : (
            // 정직원은 작성 화면의 정직원 표와 같은 요일 · 근무 시작 · 근무 종료 · 휴게 시작 · 휴게 종료(묶음 사이 세로줄), 쉬는 요일은 「-」(2026-11-19 사용자 지정 — 전엔 「월~금 09:00-18:00」 한 줄 글자)
            <div className="flex w-full min-w-px flex-col gap-[8px] pb-[4px]">
              <span>주 {Number(weeklyHoursOf(c.workDays).toFixed(2))} 시간</span>
              <DataTable
                columns={[
                  { header: "요일", width: "w-[80px]", cell: (r: PartTimeRow) => r.label },
                  { header: "근무 시작", divider: true, cell: (r: PartTimeRow) => r.start },
                  { header: "근무 종료", cell: (r: PartTimeRow) => r.end },
                  { header: "휴게 시작", divider: true, cell: (r: PartTimeRow) => r.restStart },
                  { header: "휴게 종료", cell: (r: PartTimeRow) => r.restEnd },
                ]}
                rows={partTimeRows(c, (d) => labelOf(weekdays, d)).filter((r) => !PAY_SUMMARY_KEYS.has(r.key))}
                rowKey={(r) => r.key}
              />
            </div>
          ),
        },
        { label: "주휴일", value: c.weeklyHoliday ? `${labelOf(weekdays, c.weeklyHoliday)}요일` : "-" },
        // 임금 묶음 — 시급 · 수습 · 임금지급일 · 급여 지급 방식 · 급여 계좌. 줄 순서는 「누가 → 어디서 · 무슨 일 → 언제 · 얼마나 → 얼마를 → 그 밖」(표준근로계약서 순서, 2026-11-19 사용자 지정)
        { label: "시급", value: c.wageAmount === null ? "-" : `${c.wageAmount.toLocaleString("ko-KR")} 원` },
        ...(c.employmentType === "FULL_TIME" ? [{ label: "수습", value: probationText(c.probationMonths, c.probationWageReductionRate, c.wageAmount) }] : []),
        { label: "임금지급일", value: payDayText(c.payMonth ? labelOf(payMonths, c.payMonth) : null, c.payDay) },
        { label: "급여 지급 방식", value: c.payMethod ? labelOf(payMethods, c.payMethod) : "-" },
        { label: "4대보험", value: insuranceText(c.isHealthPensionInsured, c.isEmploymentInjuryInsured) },
      ]
    : [];
  const histories = c?.histories ?? [];

  return (
    <>
      <PageBar title="근로계약 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <div className="flex flex-col gap-[12px]">
            {/* 제목 줄은 「근로계약 상세」와 버튼만. 성명 · 고용형태 · 계약 방식 · 근무지 · 계약 기간 · 상태는 아래 둥근 요약 띠에 — 급여명세서 상세와 같은
                모양(8px · #c9d1de, 칸마다 이름 13px 회색 위 · 값 15px 600 아래, 2026-11-19 사용자 지정 — 전엔 제목 아래 「계약 방식 ┃ 상태」 한 줄) */}
            <div className="flex items-center gap-[6px]">
              <h2 className="min-w-0 flex-1 text-[18px] font-semibold text-erp-ink">근로계약 상세</h2>
              {buttons}
              <Button href={at(backHrefOf(query.back))}>목록</Button>
            </div>
            {c && (
              <SummaryStrip cells={[
                  { label: "성명", value: <span className="text-[15px] font-semibold text-erp-ink">{c.name}</span> },
                  { label: "고용형태", value: <span className="text-[15px] font-semibold text-erp-ink">{labelOf(employmentTypes, c.employmentType)}</span> },
                  { label: "계약 방식", value: <span className="text-[15px] font-semibold text-erp-ink">{c.contractMethod ? labelOf(contractMethods, c.contractMethod) : "-"}</span> },
                  {
                    label: "근무지",
                    value: (
                      <span className="text-[15px] font-semibold text-erp-ink">
                        {c.storeName ? <StoreNameWithType storeId={c.storeId} name={c.storeName} isHq={c.storeIsHq} /> : "-"}
                      </span>
                    ),
                  },
                  {
                    label: "계약 기간",
                    value: <span className="text-[15px] font-semibold text-erp-ink">{c.startDate ? `${c.startDate} ~ ${c.endDate ?? "기간의 정함 없음"}` : "-"}</span>,
                  },
                  {
                    label: "상태",
                    value: <DetailValues items={[statusCell(c.status), ...(c.status === "PENDING_SEND" && c.draftAction ? [labelOf(draftActions, c.draftAction)] : [])]} />,
                  },
                ]} />
            )}
            {sendNotice && (
              <p role="alert" className="rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] font-semibold text-erp-off">
                {sendNotice}
              </p>
            )}
            {documentNotice && (
              <p role="alert" className="rounded-[2px] border border-erp-off bg-erp-off-bg px-[16px] py-[12px] text-[14px] font-semibold text-erp-off">
                {documentNotice}
              </p>
            )}
            {!c && <p className="text-[14px] font-semibold text-erp-ink">{notice}</p>}
          </div>
          {c && (
            // 왼쪽 3 : 오른쪽 2 — 소정근로시간 표가 있는 왼쪽을 넓게. 창 1440 미만이면 위아래로 쌓는다 — 1260 에서 두 칸이면 소정근로시간 표 · 상태
            // 변경이력 표가 칸 밖으로 넘쳤다(2026-11-19)
            <div className="grid grid-cols-1 items-start gap-[24px] min-[1440px]:grid-cols-5">
              <div className="min-w-0 min-[1440px]:col-span-3">
                <div className="flex flex-col gap-[24px]">
                  <DetailTable title="직원 정보" rows={staffRows} />
                  <DetailTable title="근로 정보" rows={rows} />
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-[24px] min-[1440px]:col-span-2">
                {/* 상태는 제목 아래 줄로 옮겨 이 상자는 발송 · 서명 정보다 — 종이 계약은 발송 대신 등록일 · 등록 관리자라 「등록 정보」(2026-11-19 사용자 지정, 전엔 「계약 상태」) */}
                {/* 오른쪽은 사장님이 확인할 것이라 급여명세서 상세와 같은 둥근 테두리 상자(RoundBox) — 왼쪽 직원 · 근로 정보(회색 제목 줄 표)와 모양으로 가른다(2026-11-19 사용자 지정).
                    제목 옆에 계약 방식 꼬리표 — 안의 줄이 전자계약(발송 · 서명) · 종이 계약(등록)에 따라 달라서 어느 쪽인지 같이 보인다 */}
                <RoundBox
                  title={c.contractMethod === "PAPER" ? "등록 정보" : "발송 · 서명 정보"}
                >
                  <RoundRows rows={statusRows.map((r) => ({ label: r.label, value: r.value, top: !!r.multiline }))} />
                </RoundBox>
                {fileRows.length > 0 && (
                  <RoundBox title="계약서 파일">
                    <RoundRows rows={fileRows.map((r) => ({ label: r.label, value: r.value, top: true }))} />
                  </RoundBox>
                )}
                {/* 상태 변경이력 — 급여명세서 처리내역과 같은 한 줄: 왼쪽 「A → B」(먹색), 오른쪽 「변경자(관리자 · 직원 · 시스템) | 일시」(회색), 굵은 글자 없음
                    (2026-11-19 사용자 지정). 처음 줄은 「등록 · …」(TO-DO 상세 상태 칸과 같은 글자) */}
                <RoundBox title="상태 변경이력">
                  {histories.length === 0 ? (
                    <RoundEmpty>상태 변경이력이 없습니다.</RoundEmpty>
                  ) : (
                    <ul className="flex flex-col">
                      {histories.map((h) => (
                        <li key={`${h.changedAt}-${h.toStatus}`} className="flex items-start gap-[12px] border-t border-erp-divider py-[12px] text-[14px] leading-[1.6] last:pb-0">
                          <span className="min-w-0 flex-1 text-erp-ink">
                            {h.fromStatus ? `${labelOf(statuses, h.fromStatus)} → ${labelOf(statuses, h.toStatus)}` : `등록 · ${labelOf(statuses, h.toStatus)}`}
                          </span>
                          <span className="flex shrink-0 items-center gap-[8px] text-erp-label">
                            <span>{labelOf(actors, h.actor)}</span>
                            {/* #d9d9d9 — DESIGN.md 값 구분선, Figma 전용 색이라 토큰이 없다 */}
                            <span aria-hidden className="h-[11px] w-px bg-[#d9d9d9]" />
                            <span className="tabular-nums">{kstDateTime(h.changedAt)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </RoundBox>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
