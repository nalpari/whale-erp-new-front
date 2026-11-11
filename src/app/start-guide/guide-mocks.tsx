import type { ReactNode } from "react";
import type { GuideMockKind } from "@/lib/start-guide";

// 시작 가이드 칸 오른쪽의 화면 예시 — 실제 화면을 단순하게 줄인 그림이다(2026-11-11 사용자 지정 — 캡처는 화면을 고칠 때마다 다시 찍어야 한다).
// 글자 · 칸 이름은 실제 화면과 같게 두고, 꼭 눌러야 할 버튼 · 꼭 확인할 칸만 오른쪽 위 빨간 동그라미 체크(RING)로 짚는다(2026-11-11 사용자 지정 — 파란 테두리 · 빨간 점선을 거쳤다). 대개 그림마다 하나이고, 점포 등록 그림은 점포유형(직영) · 출퇴근 위치적용 · [저장] 세 곳이다(2026-11-11 사용자 지정). 값은 모두 예시다. 읽는 사람에게는 aria-hidden 이다.

// 그림 칸(남색 바탕) 자체를 화면으로 보고 요소를 바로 얹는다 — 흰 상자 안에 또 상자를 두지 않는다(2026-11-11 사용자 지정).
// 그림 칸은 흰 바탕이라 색은 실제 화면 그대로다(남색 바탕 · 흰 글자도 해 봤지만 실제 화면 색이 나았다).
const BOX = "w-full text-[11px] leading-[1.4] text-erp-ink";

function Head({
  title,
  action,
  ring,
}: {
  title: string;
  action?: string;
  ring?: boolean;
}) {
  return (
    <div className="flex h-[28px] items-center justify-between border-b border-erp-panel-line px-[10px] font-semibold">
      {title}
      {action && (
        <span
          className={`rounded-[2px] bg-erp-brand px-[8px] py-[1px] font-medium text-white ${ring ? RING : ""}`}
        >
          {action}
          {ring && <Mark />}
        </span>
      )}
    </div>
  );
}

/**
 * 꼭 눌러야 할 곳 — 그 칸 · 버튼의 오른쪽 위 모서리에 빨간 동그라미 체크 아이콘(12px, 1.36배로 약 16px)을 걸친다.
 * 점선 테두리는 칸이 여럿이면 어수선해 체크 표시로 바꿨다(2026-11-11 사용자 지정). 짚을 칸에 RING(relative)을 주고 안에 <Mark /> 를 넣는다.
 * 아이콘을 CSS 바탕 그림(data URL)으로 넣었더니 CSS 파싱 오류로 화면이 깨져 실제 SVG 요소로 그린다. 빨강은 erp-off(#ef6363).
 */
const RING = "relative";

/** inline — 입력칸은 칸 모서리가 아니라 입력된 글자 바로 끝에 붙인다(2026-11-11 사용자 지정 — 「manager@store.kr✓」 · 「매니저 ▾✓」). 버튼 · 카드는 오른쪽 위 모서리 */
function Mark({ inline }: { inline?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={`pointer-events-none size-[12px] shrink-0 ${inline ? "ml-[4px]" : "absolute -top-[6px] -right-[6px]"}`}
    >
      <circle cx="8" cy="8" r="8" className="fill-erp-off" />
      <path
        d="M4.5 8.3l2.3 2.3 4.7-4.8"
        fill="none"
        stroke="#fff"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 필수 칸 표시 — 실제 화면(RequiredMark)과 같은 라벨 뒤 빨간 * */
function Required() {
  return <span className="ml-[2px] text-[#e93737]">*</span>;
}

function Field({
  label,
  value,
  ring,
  readOnly,
  required,
}: {
  label: string;
  value: string;
  ring?: boolean;
  readOnly?: boolean;
  required?: boolean;
}) {
  const box = (
    <span
      className={`flex h-[20px] items-center rounded-[2px] border border-[#ededee] px-[6px] ${readOnly ? "bg-erp-thead-bg" : "bg-white"}`}
    >
      {value}
      {ring && <Mark inline />}
    </span>
  );
  return (
    <span className="flex flex-col gap-[2px] text-erp-label">
      <span>
        {label}
        {required && <Required />}
      </span>
      {box}
    </span>
  );
}

/** 라디오 묶음 — 실제 화면의 Radio(20px 원)를 줄인 모양. picked 가 고른 칸 */
function Choice({ label, options, picked, required }: { label: string; options: string[]; picked: number; required?: boolean }) {
  return (
    <span className="flex flex-col gap-[2px] text-erp-label">
      <span>
        {label}
        {required && <Required />}
      </span>
      <span className="flex h-[20px] items-center gap-[10px] text-erp-ink">
        {options.map((o, i) => (
          <span key={o} className="inline-flex items-center gap-[3px]">
            <span className={`inline-flex size-[10px] items-center justify-center rounded-full border ${i === picked ? "border-erp-brand" : "border-erp-brand-soft"}`}>
              {i === picked && <span className="size-[5px] rounded-full bg-erp-brand" />}
            </span>
            {o}
          </span>
        ))}
      </span>
    </span>
  );
}

function Check({ on }: { on?: boolean }) {
  return (
    <span
      className={`inline-block size-[10px] rounded-[2px] border ${on ? "border-erp-brand bg-erp-brand" : "border-erp-brand-soft bg-white"}`}
    />
  );
}

function Table({
  head,
  rows,
  ringRow,
}: {
  head: string[];
  rows: ReactNode[][];
  ringRow?: number;
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {head.map((h, i) => (
            <th
              key={h}
              className={`h-[22px] bg-erp-thead-bg font-semibold text-erp-sub ${i === 0 ? "pl-[8px] text-left" : "text-center"}`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={i === ringRow ? "bg-erp-point-subtle" : ""}>
            {r.map((c, j) => (
              <td
                key={j}
                className={`h-[22px] border-b border-erp-thead-line ${j === 0 ? "pl-[8px] text-left" : "text-center text-erp-sub"}`}
              >
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: "on" | "off" | "gray";
  children: ReactNode;
}) {
  const c =
    tone === "on"
      ? "bg-erp-on-bg text-erp-on"
      : tone === "off"
        ? "bg-erp-off-bg text-erp-off"
        : "bg-erp-thead-bg text-erp-sub";
  return <span className={`rounded-[2px] px-[4px] ${c}`}>{children}</span>;
}

/**
 * 「사업자정보」 묶음 — 사업자등록번호 · 대표자명 · 개업일자 세 칸을 한 줄에, [인증하기]는 그 아래 한 줄(2026-11-11 사용자 지정).
 * 버튼 글자는 실제 화면(biz-verification-box.tsx)과 같은 「인증하기」, 오른쪽 위는 인증 상태(미인증).
 * ring — 사업자 진위확인 칸에서는 [인증하기]를 빨간 체크 표시로 짚는다.
 */
function BizBox({ ring }: { ring?: boolean }) {
  return (
    <div className="flex flex-col gap-[6px] p-[10px]">
      <span className="flex items-center justify-between font-semibold">
        사업자정보
        <span className="font-medium text-erp-label">미인증</span>
      </span>
      <div className="grid grid-cols-3 gap-[6px]">
        <Field label="사업자등록번호" value="123-45-67890" />
        <Field label="대표자명" value="홍길동" />
        <Field label="개업일자" value="2024-03-02" />
      </div>
      {/* 칸 폭 전체로 늘이면 너무 컸다 — 다른 버튼과 같은 크기로, 실제 등록 화면처럼 왼쪽 정렬(2026-11-11 사용자 지정) */}
      <span
        className={`flex h-[20px] items-center self-start rounded-[2px] bg-erp-brand-soft px-[10px] font-medium text-white ${ring ? RING : ""}`}
      >
        인증하기
        {ring && <Mark />}
      </span>
    </div>
  );
}

export function GuideMock({ kind }: { kind: GuideMockKind }) {
  switch (kind) {
    case "store-form":
      return (
        <div className={BOX}>
          <Head title="점포 등록" action="저장" ring />
          {/* 「점포 기본정보」만 그린다 — 「사업자정보」는 바로 아래 사업자 진위확인 칸 그림에 있어 겹쳤다(2026-11-11 사용자 지정) */}
          <div className="flex flex-col gap-[6px] p-[10px]">
            <span className="font-semibold">점포 기본정보</span>
            <span className="flex flex-col gap-[2px] text-erp-label">
              <span>
                점포유형
                <Required />
              </span>
              <span className="grid grid-cols-2 gap-[6px]">
                <span className="flex flex-col rounded-[2px] border border-erp-brand px-[6px] py-[3px] text-erp-ink">
                  {/* 체크는 고른 값 「직영」 글자 끝에 — 입력칸과 같다(2026-11-11 사용자 지정) */}
                  <span className="flex items-center">
                    직영
                    <Mark inline />
                  </span>
                  <span className="text-erp-label">직접 운영하는 점포</span>
                </span>
                <span className="flex flex-col rounded-[2px] border border-[#ededee] px-[6px] py-[3px] text-erp-ink">
                  가맹{" "}
                  <span className="text-erp-label">
                    가맹 계약으로 운영하는 점포
                  </span>
                </span>
              </span>
            </span>
            <Field label="점포명" value="인터플러그 신촌점" required />
            <Field label="점포 주소" value="서울 서대문구 연세로 12" />
            <div className="grid grid-cols-3 gap-[6px]">
              <Field label="위도" value="37.5596" readOnly />
              <Field label="경도" value="126.9370" readOnly />
              <Field label="출퇴근 위치적용" value="사용" ring />
            </div>
          </div>
        </div>
      );
    case "biz-verify":
      return (
        <div className={BOX}>
          {/* 이 단계에서 누를 것은 [인증하기]뿐이라 제목 줄 [저장]은 뺀다 — 빨간 점선과 함께 두 버튼이 겹쳐 보였다(2026-11-11 사용자 지정) */}
          <Head title="점포 등록" />
          <BizBox ring />
        </div>
      );
    case "store-list":
      return (
        <div className={BOX}>
          <Head title="점포 목록" />
          <Table
            head={["점포명", "유형", "상태"]}
            ringRow={0}
            rows={[
              [
                "인터플러그 신촌점",
                "가맹",
                <Pill key="s" tone="on">
                  운영
                </Pill>,
              ],
              [
                "인터플러그 홍대점",
                "가맹",
                <Pill key="s" tone="off">
                  미운영
                </Pill>,
              ],
            ]}
          />
        </div>
      );
    case "role-group":
      return (
        <div className={BOX}>
          <Head title="BP 권한 그룹 관리" action="등록" ring />
          {/* 실제 화면(bp-role-groups)처럼 — 왼쪽 「권한 그룹 목록」 표(권한유형 · 코드 / 권한명 링크 / 메뉴설정 여부), 오른쪽 「권한 등록」 칸(2026-11-11 사용자 지정 — 전엔 이름만 늘어선 목록이라 목록 · 상세가 드러나지 않았다) */}
          <div className="grid grid-cols-[1.45fr_1fr]">
            <div className="flex min-w-0 flex-col gap-[6px] p-[8px]">
              <span className="font-semibold">
                권한 그룹 목록 <span className="font-normal text-erp-label">2건</span>
              </span>
              <Table
                head={["권한유형 · 코드", "권한명", "메뉴설정 여부"]}
                rows={[
                  [
                    <span key="t">
                      BP 마스터 <span className="text-[9px] text-erp-label">· BM000001</span>
                    </span>,
                    <span key="n" className="text-erp-link">BP 마스터</span>,
                    <Pill key="m" tone="on">등록 24개</Pill>,
                  ],
                  [
                    <span key="t">
                      BP 관리자 <span className="text-[9px] text-erp-label">· BA000001</span>
                    </span>,
                    <span key="n" className="text-erp-link">매니저</span>,
                    <Pill key="m" tone="off">미등록</Pill>,
                  ],
                ]}
              />
            </div>
            <div className="flex flex-col gap-[5px] border-l border-erp-panel-line p-[8px]">
              <span className="font-semibold">권한 등록</span>
              <Field label="권한유형" value="BP 관리자" readOnly />
              <Field label="권한명" value="매니저" required />
              <Field label="설명" value="근무 · 출퇴근 담당" />
              {/* 실제 양식(role-form.tsx)처럼 가운데 [취소] [저장] */}
              <span className="mt-[2px] flex justify-center gap-[4px]">
                <span className="rounded-[2px] bg-erp-subtle px-[10px] py-[1px] font-medium text-erp-ink">취소</span>
                <span className={`rounded-[2px] bg-erp-brand px-[10px] py-[1px] font-medium text-white ${RING}`}>
                  저장
                  <Mark />
                </span>
              </span>
            </div>
          </div>
        </div>
      );
    case "role-menu":
      return (
        // 실제 「권한별 메뉴설정」 팝업(role-menu-dialog.tsx)처럼 — 권한유형 | 권한코드 | 권한명 줄, 서비스 탭, 머리 erp-subtle 의 트리 표
        // (1단계 줄은 회청 바탕, 2단계는 「└ 」), 오른쪽 아래 [닫기] [저장](2026-11-11 사용자 지정)
        <div className={BOX}>
          <Head title="권한별 메뉴설정" />
          <div className="flex flex-col gap-[6px] p-[10px]">
            <span className="flex h-[22px] items-center gap-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[8px]">
              <span className="text-erp-label">권한유형</span>
              <b className="font-semibold">BP 관리자</b>
              <span className="h-[8px] w-px bg-[#d9d9d9]" />
              <span className="text-erp-label">권한코드</span>
              BA000002
              <span className="h-[8px] w-px bg-[#d9d9d9]" />
              <span className="text-erp-label">권한명</span>
              <b className="font-semibold">매니저</b>
            </span>
            <span className="flex border-b border-erp-panel-line">
              <span className="border-b-2 border-erp-brand px-[8px] pb-[2px] font-semibold">웨일ERP</span>
            </span>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-erp-subtle font-semibold">
                  <th className="h-[22px] pl-[8px] text-left">메뉴명</th>
                  <th className="h-[22px]">메뉴단계</th>
                  {["조회", "등록", "수정", "삭제"].map((op) => (
                    <th key={op} className="h-[22px]">
                      <span className="inline-flex items-center gap-[3px]">
                        <Check />
                        {op}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "직원 관리", depth: 1, on: [true, true, true, false] },
                  { name: "근무스케줄 관리", depth: 2, on: [true, true, true, false] },
                  { name: "출·퇴근 현황 조회", depth: 2, on: [true, true, true, false] },
                  { name: "급여명세서 관리", depth: 2, on: [false, false, false, false] },
                ].map((m) => (
                  <tr key={m.name} className={m.depth === 1 ? "bg-erp-thead-bg font-semibold" : ""}>
                    <td className="h-[22px] border-b border-erp-thead-line pl-[8px]">
                      {m.depth > 1 && <span className="font-normal text-erp-label">└ </span>}
                      {m.name}
                    </td>
                    <td className="h-[22px] border-b border-erp-thead-line text-center font-normal text-erp-label">{m.depth}단계</td>
                    {m.on.map((on, i) => (
                      <td key={i} className="h-[22px] border-b border-erp-thead-line text-center">
                        <Check on={on} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <span className="mt-[2px] flex justify-end gap-[4px]">
              <span className="rounded-[2px] bg-erp-subtle px-[10px] py-[1px] font-medium text-erp-ink">닫기</span>
              <span className={`rounded-[2px] bg-erp-brand px-[10px] py-[1px] font-medium text-white ${RING}`}>
                저장
                <Mark />
              </span>
            </span>
          </div>
        </div>
      );
    case "admin-form":
    case "franchise-master": {
      const master = kind === "franchise-master";
      return (
        // 실제 「관리자 등록」 패널(bp-admins/admin-form-panel.tsx)처럼 — 「기본정보」(아이디 · 이름 · 연락처 · 이메일 · 계정 역할 + 권한명)와
        // 「대상점포」(범위 · 선택한 점포) 두 묶음, 맨 아래 가운데 [취소] [저장](2026-11-11 사용자 지정).
        // 목록 위에 패널이 겹친 모양도 해 봤지만 어지러워 패널만 그린다(2026-11-11 사용자 지정)
        <div className={BOX}>
          <Head title="관리자 등록" />
          <div className="flex flex-col gap-[6px] p-[10px]">
            <span className="font-semibold">기본정보</span>
            <div className="grid grid-cols-2 gap-[6px]">
              <Field label="아이디" value={master ? "sinchon01" : "manager01"} required />
              <Field label="이름" value={master ? "김점주" : "이매니"} required />
            </div>
            <span className="flex flex-col gap-[2px] text-erp-label">
              <span>
                연락처
                <Required />
              </span>
              <span className="grid grid-cols-3 gap-[4px]">
                {["010", "1234", "5678"].map((v) => (
                  <span key={v} className="flex h-[20px] items-center rounded-[2px] border border-[#ededee] bg-white px-[6px] text-erp-ink">
                    {v}
                  </span>
                ))}
              </span>
            </span>
            {/* 초기 비밀번호가 이 주소로 가므로 이메일도 짚는다(2026-11-11 사용자 지정) */}
            <Field label="이메일" value={master ? "owner@sinchon.kr" : "manager@store.kr"} ring required />
            <div className="grid grid-cols-2 gap-[6px]">
              <Field label="계정 역할" value={master ? "가맹 마스터 ▾" : "BP 관리자 ▾"} ring={master} required />
              <Field label="권한명" value={master ? "가맹점주 ▾" : "매니저 ▾"} ring={!master} required />
            </div>
          </div>
          <div className="flex flex-col gap-[6px] border-t border-erp-panel-line p-[10px]">
            <span className="font-semibold">대상점포</span>
            <Field label="범위" value="일부 점포 ▾" ring required />
            <span className="flex flex-wrap gap-[4px]">
              <span className="rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[5px]">인터플러그 신촌점 ×</span>
            </span>
            <span className="mt-[2px] flex justify-center gap-[4px]">
              <span className="rounded-[2px] bg-erp-subtle px-[10px] py-[1px] font-medium text-erp-ink">취소</span>
              <span className={`rounded-[2px] bg-erp-brand px-[10px] py-[1px] font-medium text-white ${RING}`}>
                저장
                <Mark />
              </span>
            </span>
          </div>
        </div>
      );
    }
    case "contract":
      return (
        // 실제 근로계약서 작성 화면(contracts/new/contract-form.tsx)처럼 — 제목 줄 「근로계약서」 + [취소] [임시저장] [서명 요청],
        // 「직원 정보」 · 「계약 방식」 · 「계약 조건」 세 묶음. 고용 형태 · 계약 방식은 라디오다(2026-11-11 사용자 지정)
        <div className={BOX}>
          <div className="flex h-[28px] items-center gap-[4px] border-b border-erp-panel-line px-[10px] font-semibold">
            <span className="flex-1">근로계약서</span>
            <span className="rounded-[2px] bg-erp-subtle px-[8px] py-[1px] font-medium text-erp-ink">취소</span>
            <span className="rounded-[2px] bg-erp-brand-soft px-[8px] py-[1px] font-medium text-white">임시저장</span>
            <span className={`rounded-[2px] bg-erp-brand px-[8px] py-[1px] font-medium text-white ${RING}`}>
              서명 요청
              <Mark />
            </span>
          </div>
          <div className="flex flex-col gap-[6px] p-[10px]">
            <span className="font-semibold">직원 정보</span>
            <div className="grid grid-cols-2 gap-[6px]">
              <Field label="이름" value="서지안" required />
              <Field label="휴대전화번호" value="010-1234-5678" ring required />
              <Field label="생년월일" value="2001-05-14" required />
              <Choice label="성별" options={["남", "여"]} picked={1} required />
              <Field label="소속 근무지" value="인터플러그 신촌점 ▾" required />
              <Field label="직무" value="바리스타" required />
            </div>
          </div>
          <div className="flex flex-col gap-[6px] border-t border-erp-panel-line p-[10px]">
            <span className="font-semibold">계약 방식</span>
            <div className="grid grid-cols-2 gap-[6px]">
              <Choice label="고용 형태" options={["정직원", "파트타이머"]} picked={1} />
              <Choice label="계약 방식" options={["전자계약", "종이 계약"]} picked={0} />
            </div>
          </div>
          <div className="flex flex-col gap-[6px] border-t border-erp-panel-line p-[10px]">
            <span className="font-semibold">계약 조건</span>
            <div className="grid grid-cols-3 gap-[6px]">
              <Field label="계약 시작일" value="2026-11-16" required />
              <Field label="계약 종료일" value="" />
              <Field label="시급" value="10,320" required />
            </div>
          </div>
        </div>
      );
    case "staff-app":
      return (
        <div className="w-[190px] overflow-hidden rounded-[22px] border-[5px] border-[#2a3440] bg-white text-[11px] text-erp-ink">
          <div className="flex flex-col gap-[6px] bg-erp-thead-bg p-[10px]">
            <span className="text-center text-[10px] text-erp-label">
              직원 근무 앱
            </span>
            <span className="flex flex-col gap-[2px] rounded-[8px] bg-white p-[8px] shadow-[0_1px_3px_rgba(40,47,55,0.1)]">
              <b className="font-semibold">근로계약서가 도착했습니다.</b>
              <span className="text-erp-label">인터플러그 신촌점</span>
            </span>
            <span
              className={`flex h-[24px] items-center justify-center rounded-[6px] bg-erp-point font-semibold text-white ${RING}`}
            >
              서명하기
              <Mark />
            </span>
          </div>
        </div>
      );
    case "schedule":
      return (
        // 실제 근무스케줄 관리 주간 보기(work-schedules/schedule-controls · schedule-week)처럼 — [주간 보기 | 월간 보기], 근무지 · 기간 이동 ·
        // [지난 주 복사] [근무스케줄 등록], 요일 탭(인원), 0~24시 막대 표(직원 · 근무 막대 · 휴무)(2026-11-11 사용자 지정)
        <div className={BOX}>
          <Head title="근무스케줄 관리" />
          <div className="flex flex-col gap-[6px] p-[10px]">
            <span className="flex self-start rounded-[2px] border border-erp-button-line">
              <span className="bg-erp-subtle px-[8px] py-[1px] font-semibold">주간 보기</span>
              <span className="border-l border-erp-button-line px-[8px] py-[1px]">월간 보기</span>
            </span>
            <span className="flex items-center gap-[4px]">
              <span className="text-erp-label">근무지</span>
              {/* 근무지는 「신촌점」으로 줄였다 — 「인터플러그 신촌점」은 그림 칸에서 잘렸다. 먼저 근무지를 고르므로 빨간 체크(2026-11-11 사용자 지정) */}
              <span className="flex h-[20px] items-center whitespace-nowrap rounded-[2px] border border-[#ededee] px-[6px]">
                신촌점 ▾
                <Mark inline />
              </span>
              <span className="text-erp-label">‹</span>
              <span>11월 9일 ~ 15일</span>
              <span className="text-erp-label">›</span>
              <span className="ml-auto rounded-[2px] bg-erp-brand-soft px-[6px] py-[1px] font-medium text-white">지난 주 복사</span>
              <span className={`rounded-[2px] bg-erp-brand px-[6px] py-[1px] font-medium text-white ${RING}`}>
                근무스케줄 등록
                <Mark />
              </span>
            </span>
            <span className="grid grid-cols-7 gap-[3px]">
              {["월 9", "화 10", "수 11", "목 12", "금 13", "토 14", "일 15"].map((d, i) => (
                <span
                  key={d}
                  className={`flex h-[20px] items-center justify-center rounded-[2px] border ${i === 0 ? "border-erp-brand bg-erp-brand text-white" : "border-erp-button-line"}`}
                >
                  {d}
                </span>
              ))}
            </span>
            <span className="flex flex-col">
              <span className="flex h-[22px] items-center border-y border-erp-thead-line bg-erp-thead-bg text-erp-sub">
                <span className="w-[64px] shrink-0 pl-[6px]">직원</span>
                <span className="grid flex-1 grid-cols-8 text-[9px]">
                  {["00", "03", "06", "09", "12", "15", "18", "21"].map((h) => (
                    <span key={h}>{h}</span>
                  ))}
                </span>
              </span>
              {[
                { name: "서지안", from: 9, to: 18 },
                { name: "오세라", from: 13, to: 22 },
                { name: "정하윤", from: 0, to: 0 },
              ].map((s) => (
                <span key={s.name} className="flex h-[24px] items-center border-b border-erp-thead-line">
                  <span className="w-[64px] shrink-0 pl-[6px]">{s.name}</span>
                  <span className="relative h-[16px] flex-1 rounded-[2px] bg-erp-thead-bg">
                    {s.to === 0 ? (
                      <span className="absolute inset-0 flex items-center rounded-[2px] bg-erp-subtle px-[6px] text-erp-muted">휴무</span>
                    ) : (
                      <span
                        className="absolute inset-y-0 flex items-center truncate rounded-[2px] bg-erp-brand-soft px-[4px] text-white"
                        style={{ left: `${(s.from / 24) * 100}%`, width: `${((s.to - s.from) / 24) * 100}%` }}
                      >
                        {String(s.from).padStart(2, "0")}:00 ~ {s.to}:00
                      </span>
                    )}
                  </span>
                </span>
              ))}
            </span>
          </div>
        </div>
      );
    case "schedule-copy":
      return (
        // 실제 「지난 주 복사」 미리보기(work-schedules/schedule-copy.tsx)처럼 — 제목 줄 오른쪽 [취소] [N명 복사], 표(직원 · 지난 주 근무 · 이번 주 근무 · 처리)(2026-11-11 사용자 지정)
        <div className={BOX}>
          <div className="flex h-[28px] items-center gap-[4px] border-b border-erp-panel-line px-[10px]">
            <span className="font-semibold">지난 주 복사</span>
            <span className="flex-1 text-erp-label">11월 2일 ~ 8일 → 11월 9일 ~ 15일</span>
            <span className="rounded-[2px] bg-erp-subtle px-[8px] py-[1px] font-medium">취소</span>
            <span className={`rounded-[2px] bg-erp-brand px-[8px] py-[1px] font-medium text-white ${RING}`}>
              2명 복사
              <Mark />
            </span>
          </div>
          <div className="p-[10px]">
            <Table
              head={["직원", "지난 주 근무", "이번 주 근무", "처리"]}
              rows={[
                ["서지안", "3일 · 27시간", "0일", <Pill key="s" tone="on">복사</Pill>],
                ["오세라", "3일 · 27시간", "0일", <Pill key="s" tone="on">복사</Pill>],
                ["정하윤", "-", "-", <Pill key="s" tone="gray">지난 주 근무 없음</Pill>],
              ]}
            />
          </div>
        </div>
      );
    case "attendance":
      return (
        // 실제 「출·퇴근 현황 조회」(attendance-records/attendance-sections.tsx)처럼 — 왼쪽 「일별 출퇴근」(‹ 날 › · 직원 · 예정 · 출근 · 퇴근 · 비고),
        // 오른쪽 「근태 요약」(정상 출근 · 지각 · 미기록 막대 + 근로시간 표)(2026-11-11 사용자 지정)
        <div className={BOX}>
          <Head title="출·퇴근 현황 조회" />
          <div className="grid grid-cols-[1.55fr_1fr]">
            <div className="flex min-w-0 flex-col gap-[6px] p-[8px]">
              <span className="flex items-center justify-between font-semibold">
                일별 출퇴근
                <span className="font-normal text-erp-label">‹ 11월 10일(월) ›</span>
              </span>
              <Table
                head={["직원", "예정", "출근", "퇴근", "비고"]}
                ringRow={1}
                rows={[
                  ["서지안", "09:00", "08:52", "18:03", ""],
                  ["오세라", "13:00", "13:12", "22:01", <Pill key="n" tone="off">확인 필요</Pill>],
                  ["정하윤", "09:00", "-", "-", <Pill key="n" tone="gray">미기록</Pill>],
                ]}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-[6px] border-l border-erp-panel-line p-[8px]">
              <span className="font-semibold">근태 요약</span>
              {/* 막대 색은 실제 화면과 같다 — 정상 erp-on · 지각 #e8a33d(토큰 없음, DESIGN.md 범례) · 미기록 erp-off */}
              {[
                { label: "정상 출근", n: 12, bar: "bg-erp-on" },
                { label: "지각", n: 2, bar: "bg-[#e8a33d]" },
                { label: "미기록", n: 1, bar: "bg-erp-off" },
              ].map((r) => (
                <span key={r.label} className="flex items-center gap-[4px]">
                  <span className="w-[40px] shrink-0 text-erp-label">{r.label}</span>
                  <span className="h-[5px] flex-1 rounded-full bg-erp-thead-bg">
                    <span className={`block h-full rounded-full ${r.bar}`} style={{ width: `${(r.n / 15) * 100}%` }} />
                  </span>
                  <span className="w-[16px] text-right">{r.n}</span>
                </span>
              ))}
              <span className="mt-[2px] flex flex-col border-t border-erp-thead-line">
                {[
                  ["총 근로시간", "132시간"],
                  ["연장 근로", "4시간"],
                  ["야간 근로", "2시간"],
                ].map(([k, v]) => (
                  <span key={k} className="flex h-[20px] items-center justify-between border-b border-erp-thead-line">
                    <span className="text-erp-label">{k}</span>
                    {v}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      );
    case "attendance-fix":
      return (
        // 실제 「보정이 필요한 기록」 목록(attendance-records/attendance-fix-list.tsx)처럼 — 머리 오른쪽 [출퇴근 대신 등록],
        // 줄마다 직원 · 날짜 · 출근 · 퇴근 · 사유 꼬리표 · [보정] [이상 없음](off). [출퇴근 대신 등록]은 soft, 기록이 없는 줄엔 [보정]이 없다(2026-11-11 사용자 지정 — 전엔 대신 등록 양식만)
        <div className={BOX}>
          <div className="flex h-[28px] items-center justify-between border-b border-erp-panel-line px-[10px] font-semibold">
            보정이 필요한 기록
            <span className={`rounded-[2px] bg-erp-brand-soft px-[8px] py-[1px] font-medium text-white ${RING}`}>
              출퇴근 대신 등록
              <Mark />
            </span>
          </div>
          <div className="p-[10px]">
            <Table
              head={["직원", "날짜", "출근", "퇴근", "사유", ""]}
              rows={[
                [
                  "오세라",
                  "11-10",
                  "13:12",
                  "22:01",
                  <Pill key="r" tone="off">위치 오차 초과</Pill>,
                  <span key="b" className="inline-flex gap-[3px]">
                    <span className={`rounded-[2px] bg-erp-subtle px-[5px] font-medium text-erp-ink ${RING}`}>
                      보정
                      <Mark />
                    </span>
                    <span className="rounded-[2px] bg-erp-subtle px-[5px] font-medium text-erp-ink">이상 없음</span>
                  </span>,
                ],
                [
                  "정하윤",
                  "11-10",
                  "-",
                  "-",
                  <Pill key="r" tone="gray">미기록</Pill>,
                  <span key="b" className="inline-flex gap-[3px]">
                                        <span className="rounded-[2px] bg-erp-subtle px-[5px] font-medium text-erp-ink">이상 없음</span>
                  </span>,
                ],
              ]}
            />
          </div>
        </div>
      );
    case "payslip-review":
      return (
        <div className={BOX}>
          <Head title="급여명세서 검토 · 서지안" action="확정" ring />
          <Table
            head={["항목", "금액"]}
            rows={[
              ["기본급", "1,892,000"],
              ["주휴수당", "378,400"],
              ["국민연금", "102,170"],
              ["고용보험", "20,430"],
            ]}
          />
        </div>
      );
    case "payslip-send":
      return (
        <div className={BOX}>
          <Head title="급여명세서 관리" action="확정 2건 발송" ring />
          <Table
            head={["직원", "실지급액", "상태"]}
            rows={[
              [
                "서지안",
                "2,147,800",
                <Pill key="s" tone="on">
                  확정
                </Pill>,
              ],
              [
                "오세라",
                "1,286,500",
                <Pill key="s" tone="on">
                  확정
                </Pill>,
              ],
              [
                "정하윤",
                "842,300",
                <Pill key="s" tone="gray">
                  검토 중
                </Pill>,
              ],
            ]}
          />
        </div>
      );
  }
}
