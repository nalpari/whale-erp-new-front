import Image from "next/image";
import type { ReactNode } from "react";

// 비로그인 화면에 띄우는 「실제 화면 조각」 — 캡처가 아니라 HTML 로 다시 그린 관리자 웹 · 직원 앱 일부다.
// 메인 「시작 방법」과 매장운영 소개 「이렇게 달라집니다」 그림 칸이 함께 쓴다(2026-11-10 사용자 지정).
// 상호 · 주소 · 연락처는 인터플러그(푸터와 같다), 직원 이름 · 금액은 예시다. 실제 화면 문구가 바뀌면 여기서 맞춘다.

// 조각은 폭 290 · 높이 320px 로 맞춰 그림 칸 안 좌우 여백이 같다 — 버튼은 맨 아래에 붙는다. 버튼 이름은 실제 화면과 같다.
export const MOCK = "flex h-[320px] w-[290px] flex-col rounded-[16px] bg-white p-[20px] text-guest-ink shadow-[0_8px_24px_rgba(58,86,112,0.12)]";
export const MOCK_BUTTON = "mt-auto rounded-[8px] bg-guest-navy py-[9px] text-center text-[13px] font-semibold text-white";

export function MockRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-[13px] leading-[1.5]">
      <span className="text-guest-sub">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

export function MockField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <span className="text-[12px] text-guest-sub">{label}</span>
      <span className="rounded-[6px] border border-guest-line px-[10px] py-[7px] text-[13px]">{value}</span>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-[4px] bg-[#eef4ff] px-[8px] py-[2px] text-[12px] font-semibold text-[#4a7ae0]">{children}</span>;
}

// 점포 카드 — 관리자 웹 점포 정보 관리 카드 보기(StoreCard) 모양. 메인 「시작 방법」 매장 등록이 쓴다.
export function StoreCardMock() {
  return (
    <div className="flex w-[290px] flex-col gap-[14px] rounded-[10px] border border-[#edeef1] bg-white p-[20px] text-guest-ink shadow-[0_12px_32px_rgba(58,86,112,0.2)]">
      <div className="flex items-start gap-[12px]">
        <Image src="/guest/home/photos/owner-tablet.png" alt="" width={56} height={56} className="size-[56px] shrink-0 rounded-[8px] object-cover" />
        <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
          <b className="truncate text-[15px] font-semibold">인터플러그 신촌점</b>
          <span className="flex items-center gap-[6px] text-[12px] text-[#888]">
            <span className="rounded-[2px] border border-[#e9edf5] bg-[#f8f9fb] px-[4px] text-[#858b94]">직영</span>
            ST000001
          </span>
        </div>
        <span className="rounded-[2px] bg-[#f4f9ff] px-[6px] py-[1px] text-[12px] font-medium text-[#5e8ce9]">운영</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-[12px] gap-y-[12px] border-t border-[#eeeeee] pt-[12px]">
        <div className="flex flex-col gap-[2px]">
          <dt className="text-[12px] text-[#888]">점포 연락처</dt>
          <dd className="text-[13px]">02-6928-0028</dd>
        </div>
        <div className="flex flex-col gap-[2px]">
          <dt className="text-[12px] text-[#888]">재직직원</dt>
          <dd className="text-[13px]">3명</dd>
        </div>
        <div className="col-span-2 flex flex-col gap-[2px]">
          <dt className="text-[12px] text-[#888]">점포주소</dt>
          <dd className="text-[13px]">서울 서대문구 연세로5다길 22-3</dd>
        </div>
      </dl>
    </div>
  );
}

// 점포 상세 — 관리자 웹 점포 상세조회(stores/[storeId])를 줄여 옮겼다(2026-11-10 사용자 지정).
// 실제 화면처럼 맨 위는 점포명, 그 아래 「점포코드 ST000001 | [직영]」 회색 줄이고 상태 배지는 점포명 옆이 아니라 점포 기본정보 표 맨 위 점포상태 줄에만 있다.
// 점포 기본정보는 왼쪽 대표 이미지 칸 + 점포상태 · 점포 연락처 · 점포주소 · 재직직원(위치정보 줄은 그림 칸 여백을 위해 뺐다), 그 아래 사업자정보 · 점포 공간정보 표.
function DetailLine({ k, children, wrap = false }: { k: string; children: ReactNode; wrap?: boolean }) {
  return (
    <div className="grid grid-cols-[64px_1fr] items-center border-b border-[#e9edf5] text-[12px] leading-[1.4]">
      <span className="py-[5px] pl-[8px] text-[#888]">{k}</span>
      <span className={`py-[5px] pr-[8px] ${wrap ? "" : "truncate"}`}>{children}</span>
    </div>
  );
}

function DetailHead({ children }: { children: ReactNode }) {
  return <p className="flex items-center gap-[6px] rounded-t-[2px] border border-[#e9edf5] bg-[#f8f9fb] px-[8px] py-[6px] text-[12px] font-semibold">{children}</p>;
}

const SEP = <span className="mx-[6px] inline-block h-[9px] w-px bg-[#d9d9d9] align-middle" />;

export function StoreDetailMock() {
  return (
    <div className="flex w-[360px] flex-col gap-[10px] rounded-[16px] bg-white p-[18px] text-guest-ink shadow-[0_8px_24px_rgba(58,86,112,0.12)]">
      <div className="flex flex-col gap-[4px]">
        <b className="text-[17px] font-semibold">인터플러그 신촌점</b>
        <span className="flex items-center text-[11px] font-medium text-[#888]">
          점포코드 ST000001
          {SEP}
          <span className="rounded-[2px] border border-[#e9edf5] bg-[#f8f9fb] px-[4px] text-[#858b94]">직영</span>
        </span>
      </div>
      <div className="flex flex-col">
        <DetailHead>점포 기본정보</DetailHead>
        <div className="grid grid-cols-[84px_1fr] border-x border-[#e9edf5]">
          <div className="border-b border-[#e9edf5] p-[8px]">
            <Image src="/guest/home/photos/owner-tablet.png" alt="" width={68} height={68} className="size-[68px] rounded-[6px] object-cover" />
          </div>
          <div className="flex flex-col">
            <DetailLine k="점포상태">
              <span className="rounded-[2px] bg-[#f4f9ff] px-[5px] py-[1px] text-[11px] font-medium text-[#5e8ce9]">운영</span>
            </DetailLine>
            <DetailLine k="점포 연락처">02-6928-0028</DetailLine>
            <DetailLine k="점포주소" wrap>
              서울 서대문구 연세로5다길 22-3
            </DetailLine>
            <DetailLine k="재직직원">3명</DetailLine>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <DetailHead>
          사업자정보
          <span className="rounded-[2px] bg-[#f4f9ff] px-[5px] py-[1px] text-[11px] font-medium text-[#5e8ce9]">인증 완료</span>
        </DetailHead>
        <div className="border-x border-[#e9edf5]">
          <DetailLine k="상호명">인터플러그</DetailLine>
        </div>
      </div>
      <div className="flex flex-col">
        <DetailHead>점포 공간정보</DetailHead>
        <div className="border-x border-[#e9edf5]">
          <DetailLine k="층구분">
            지상 1층{SEP}25평{SEP}82.6㎡{SEP}32석
          </DetailLine>
        </div>
      </div>
    </div>
  );
}

// 근로계약서 — 관리자 웹 근로계약 상세의 「계약 내용」 칸과 상태 이름(직원 서명 대기), 작성 화면 버튼 [서명 요청].
export function ContractMock() {
  return (
    <div className={MOCK}>
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-bold">근로계약서</p>
        <Badge>직원 서명 대기</Badge>
      </div>
      <div className="mt-[14px] flex flex-col gap-[8px] border-t border-guest-list-line pt-[14px]">
        <MockRow k="직원" v="이웨일" />
        <MockRow k="근무지" v="인터플러그 신촌점" />
        <MockRow k="고용 형태" v="파트타이머" />
        <MockRow k="직무" v="홀 서빙" />
        <MockRow k="계약 기간" v="2026.11.10 ~ 2027.02.09" />
        <MockRow k="시급" v="10,500원" />
      </div>
      <div className={MOCK_BUTTON}>서명 요청</div>
    </div>
  );
}

// 급여명세서 — 출퇴근 기록으로 셈한 근무시간이 급여 줄로 들어간다.
export function PayslipMock() {
  return (
    <div className={MOCK}>
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-bold">11월 급여명세서</p>
        <Badge>검토 중</Badge>
      </div>
      <p className="mt-[2px] text-[12px] text-guest-sub">이웨일 · 인터플러그 신촌점</p>
      <div className="mt-[12px] flex flex-col gap-[8px] border-t border-guest-list-line pt-[12px]">
        <MockRow k="출퇴근 기록 근무시간" v="132시간" />
        <MockRow k="기본급" v="1,386,000원" />
        <MockRow k="주휴수당" v="277,200원" />
        <MockRow k="공제 합계" v="-54,880원" />
      </div>
      <div className="mt-auto flex items-baseline justify-between border-t border-guest-list-line pt-[12px]">
        <span className="text-[13px] text-guest-sub">실지급액</span>
        <span className="text-[18px] font-bold text-guest-navy">1,608,320원</span>
      </div>
    </div>
  );
}

// 시설물 및 장비 상세 — 디자인 데모 stores/facilities-detail(시설물·장비 관리 정책서 PL-1 · PL-4 · PL-5)을 줄여 옮겼다.
// 맨 위는 장비 이름, 그 아래 「[운영] | 점포」, 그 아래 「기본 정보」 · 「관리 정보」 표(2026-11-10 사용자 지정).
export function FacilityDetailMock() {
  return (
    <div className="flex w-[360px] flex-col gap-[10px] rounded-[16px] bg-white p-[18px] text-guest-ink shadow-[0_8px_24px_rgba(58,86,112,0.12)]">
      <div className="flex flex-col gap-[4px]">
        <b className="truncate text-[17px] font-semibold">EK43S 전자동 원두 커피 그라인더</b>
        <span className="flex items-center text-[11px] font-medium text-[#888]">
          <span className="rounded-[2px] bg-[#f4f9ff] px-[5px] py-[1px] text-[#5e8ce9]">운영</span>
          {SEP}
          인터플러그 신촌점
        </span>
      </div>
      <div className="flex flex-col">
        <DetailHead>기본 정보</DetailHead>
        <div className="border-x border-[#e9edf5]">
          <DetailLine k="그룹 · 분류">
            <span className="rounded-[2px] border border-[#e9edf5] bg-[#f8f9fb] px-[4px] text-[11px] text-[#858b94]">점포 장비</span> 그라인더
          </DetailLine>
          <DetailLine k="브랜드">말코닉{SEP}말코닉</DetailLine>
          <DetailLine k="설치 위치">주방</DetailLine>
          <DetailLine k="구매처">다온컴퍼니{SEP}02-333-4444</DetailLine>
        </div>
      </div>
      <div className="flex flex-col">
        <DetailHead>관리 정보</DetailHead>
        <div className="border-x border-[#e9edf5]">
          <DetailLine k="품질 보증">2027-01-01</DetailLine>
          <DetailLine k="관리 담당자">서지안{SEP}010-2323-2323</DetailLine>
          <DetailLine k="점검 주기">매월{SEP}매달 정기휴일에 점검</DetailLine>
        </div>
      </div>
    </div>
  );
}

// 출퇴근 현황 — 관리자 웹 출퇴근 현황(attendance-records)의 「일별 출퇴근」 표(직원 · 예정 · 출근 · 퇴근 · 비고)와
// 「근태 요약」 막대(정상 출근 · 지각 · 미기록 — 색 칸 · 막대 색도 실제와 같다) · 근로시간을 줄여 옮겼다(2026-11-10 사용자 지정).
const ATT_MARK = { ok: "bg-[#f4f9ff] text-[#5e8ce9]", warn: "bg-[#fff6e5] text-[#956013]", risk: "bg-[#fff1f1] text-[#ef6363]" } as const;
const ATT_DOT = { ok: "bg-[#f4f9ff] border-[#5e8ce9]/40", warn: "bg-[#fff6e5] border-[#e8a33d]/50", risk: "bg-[#fff1f1] border-[#ef6363]/40" } as const;
const ATT_BAR = { ok: "bg-[#5e8ce9]", warn: "bg-[#e8a33d]", risk: "bg-[#ef6363]" } as const;

function AttHead({ title, step }: { title: string; step: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[12px] font-semibold">{title}</p>
      <span className="text-[11px] text-[#888]">‹ {step} ›</span>
    </div>
  );
}

export function AttendanceMock() {
  const rows = [
    { name: "이웨일", plan: "09:00", in: "08:57", out: "18:02", note: "정상", tone: "ok" },
    { name: "김고래", plan: "10:00", in: "10:18", out: "근무 중", note: "지각 18분", tone: "warn" },
    { name: "박바다", plan: "08:00", in: "미기록", out: "미기록", note: "미출근", tone: "risk" },
  ] as const;
  const rates = [
    { label: "정상 출근", count: 16, tone: "ok" },
    { label: "지각", count: 3, tone: "warn" },
    { label: "미기록", count: 1, tone: "risk" },
  ] as const;
  const hours = [
    ["총 근로시간", "132시간"],
    ["연장 근로", "4시간"],
    ["야간 근로", "2시간"],
  ];
  return (
    <div className="flex w-[360px] flex-col gap-[14px] rounded-[16px] bg-white p-[20px] text-guest-ink shadow-[0_8px_24px_rgba(58,86,112,0.12)]">
      <div className="flex flex-col gap-[2px]">
        <p className="text-[15px] font-bold">출퇴근 현황</p>
        <p className="text-[12px] text-guest-sub">인터플러그 신촌점</p>
      </div>
      <div className="flex flex-col gap-[6px]">
        <AttHead title="일별 출퇴근" step="11월 10일(월)" />
        <div className="border-t border-[#e9edf5] text-[11px]">
          <div className="grid grid-cols-[1fr_40px_44px_48px_64px] items-center bg-[#f8f9fb] px-[6px] py-[5px] text-center text-[#858b94]">
            <span className="text-left">직원</span>
            <span>예정</span>
            <span>출근</span>
            <span>퇴근</span>
            <span>비고</span>
          </div>
          {rows.map((r) => (
            <div key={r.name} className="grid grid-cols-[1fr_40px_44px_48px_64px] items-center border-b border-[#e9edf5] px-[6px] py-[7px] text-center">
              <span className="text-left font-medium">{r.name}</span>
              <span className="text-[#888]">{r.plan}</span>
              <span className={r.in === "미기록" ? "text-[#888]" : ""}>{r.in}</span>
              <span className={r.out === "18:02" ? "" : "text-[#888]"}>{r.out}</span>
              <span>
                <span className={`rounded-[2px] px-[4px] py-[1px] text-[10px] font-medium ${ATT_MARK[r.tone]}`}>{r.note}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-[8px]">
        <AttHead title="근태 요약" step="11월 4일 ~ 10일" />
        <div className="flex flex-col gap-[7px]">
          {rates.map((r) => (
            <div key={r.label} className="flex items-center gap-[8px] text-[11px]">
              <span className="flex w-[62px] shrink-0 items-center gap-[5px] font-medium text-[#888]">
                <span aria-hidden className={`size-[10px] shrink-0 rounded-[2px] border ${ATT_DOT[r.tone]}`} />
                {r.label}
              </span>
              <span className="block h-[6px] flex-1 overflow-hidden rounded-[2px] bg-[#f0f1f3]">
                <span className={`block h-full ${ATT_BAR[r.tone]}`} style={{ width: `${(r.count / 20) * 100}%` }} />
              </span>
              <span className="w-[26px] text-right">{r.count}회</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 border border-[#e9edf5] text-center">
          {hours.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-[2px] border-l border-[#e9edf5] py-[6px] first:border-l-0">
              <span className="text-[10px] text-[#888]">{k}</span>
              <span className="text-[12px] font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 직원 앱 홈 — 직원 근무 앱(whale-erp-new-staff)의 디자인 목업 /design/home(Figma 02.Main)을 줄여 옮겼다. 색은 직원 앱 토큰 그대로
// (staff-primary #4c4ddc · text #182237 · text-sub #526077 · bg #f4f6fa · border-light #eff2f6). 휴대폰 화면처럼 둥근 세로 카드(2026-11-10 사용자 지정).
export function StaffAppHomeMock() {
  const week = [
    { d: "월", n: 9 },
    { d: "화", n: 10, work: true, today: true },
    { d: "수", n: 11, work: true },
    { d: "목", n: 12, work: true },
    { d: "금", n: 13, work: true },
    { d: "토", n: 14, work: true },
    { d: "일", n: 15 },
  ];
  return (
    <div className="flex w-[280px] flex-col gap-[12px] rounded-[32px] border-[6px] border-white bg-[#f4f6fa] px-[16px] pt-[22px] pb-[18px] text-[#182237] shadow-[0_12px_32px_rgba(58,86,112,0.2)]">
      <div className="flex items-center justify-between text-[12px] font-semibold">
        <span>인터플러그 신촌점 ▾</span>
        <span className="relative size-[8px] rounded-full bg-[#ef4444]" />
      </div>
      <div className="flex flex-col gap-[2px]">
        <p className="text-[18px] font-bold">이웨일님, 좋은 아침이에요</p>
        <p className="text-[10px] text-[#526077]">11월 10일 화요일 · 오늘도 기분 좋은 하루 되세요</p>
      </div>
      <section className="flex flex-col gap-[2px] rounded-[14px] bg-[#4c4ddc] px-[16px] pt-[14px] pb-[14px] text-white shadow-[0_9px_23px_rgba(49,93,245,0.15)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#dbe5ff]">오늘의 근무</span>
          <span className="flex items-center gap-[4px] rounded-[5px] bg-white/12 px-[5px] py-[2px] text-[9px]">
            <span className="size-[4px] rounded-full bg-white" />
            근무 중
          </span>
        </div>
        <p className="text-[22px] leading-[1.3] font-bold">
          09:00 <span className="text-[11px] font-normal text-[#bccfff]">—</span> 18:00
        </p>
        <p className="pb-[8px] text-[10px] text-[#dbe5ff]">휴게 60분 · 총 8시간 근무</p>
        <span className="rounded-[9px] bg-white py-[8px] text-center text-[12px] font-bold text-[#4c4ddc]">퇴근하기 →</span>
      </section>
      <section className="flex flex-col gap-[6px]">
        <p className="flex items-center justify-between text-[12px] font-bold">
          이번 주 근무<span className="text-[10px] font-normal text-[#526077]">11.9 – 11.15</span>
        </p>
        <div className="grid grid-cols-7 gap-[3px] rounded-[12px] border border-[#eff2f6] bg-white p-[8px] text-center">
          {week.map((w) => (
            <span key={w.n} className={`flex flex-col items-center gap-[1px] rounded-[8px] py-[4px] text-[9px] ${w.today ? "bg-[#4c4ddc] text-white" : w.work ? "bg-[#eef2ff] text-[#182237]" : "text-[#69758a]"}`}>
              {w.d}
              <b className="text-[11px] font-semibold">{w.n}</b>
            </span>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-[6px]">
        <p className="text-[12px] font-bold">
          오늘 할 일 <span className="text-[#4c4ddc]">1</span>
        </p>
        <div className="flex items-center gap-[8px] rounded-[12px] border border-[#eff2f6] bg-white px-[12px] py-[9px]">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[11px] font-semibold">유통기한 라벨 점검</span>
            <span className="truncate text-[9px] text-[#526077]">오늘 20:00까지 · 매장 공통</span>
          </span>
          <span className="rounded-[5px] bg-[#ededfb] px-[6px] py-[2px] text-[9px] font-semibold text-[#4c4ddc]">예정</span>
        </div>
      </section>
    </div>
  );
}

// 직원 앱 근로계약서 서명 — 직원 근무 앱(whale-erp-new-staff) contracts/[contractId]/sign 화면(SignForm)을 줄여 옮겼다.
// 제목 「서명란에 서명해 주세요」 · 서명란(그린 서명) · 계약서 · 서명하는 사람 · [서명 완료] [다시 그리기]. 색은 직원 앱 토큰(2026-11-10 사용자 지정).
export function StaffAppSignMock() {
  return (
    <div className="flex w-[280px] flex-col gap-[12px] rounded-[32px] border-[6px] border-white bg-[#f4f6fa] px-[16px] pt-[18px] pb-[18px] text-[#182237] shadow-[0_12px_32px_rgba(58,86,112,0.2)]">
      <p className="text-[12px] font-semibold">‹ 근로계약</p>
      <div className="flex flex-col gap-[3px]">
        <p className="text-[17px] font-bold">서명란에 서명해 주세요</p>
        <p className="text-[10px] text-[#526077]">서명을 완료하면 되돌릴 수 없습니다.</p>
      </div>
      <div className="flex h-[120px] items-center justify-center rounded-[12px] border border-dashed border-[#dbe1eb] bg-white">
        <svg aria-hidden width="150" height="60" viewBox="0 0 150 60" fill="none" stroke="#182237" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 40c8-22 14-30 18-26s-6 30-2 32 12-26 18-28 2 22 8 22 10-18 16-18-2 14 4 16 14-12 22-14 8 10 14 8 10-8 18-10" />
          <path d="M20 50h110" stroke="#dbe1eb" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="flex flex-col gap-[6px] rounded-[12px] bg-[#eef1f6] px-[12px] py-[10px] text-[10px]">
        <p className="flex justify-between">
          <span className="text-[#526077]">계약서</span>
          <span className="font-semibold">인터플러그 신촌점 · 파트타이머</span>
        </p>
        <p className="flex justify-between">
          <span className="text-[#526077]">서명하는 사람</span>
          <span className="font-semibold">이웨일</span>
        </p>
      </div>
      <div className="flex flex-col gap-[4px]">
        <span className="rounded-[10px] bg-[#4c4ddc] py-[9px] text-center text-[12px] font-bold text-white">서명 완료</span>
        <span className="py-[6px] text-center text-[11px] font-semibold text-[#526077]">다시 그리기</span>
      </div>
    </div>
  );
}

// ── 재무관리 소개 그림 ── 재무관리 화면은 아직 개발 전이라(부가서비스 구독) 실제 화면을 옮긴 것이 아니라 기능을 보여 주는 화면 예시다.
// 숫자 · 표 위주로 단순하게 그리고, 금액 · 계정은 예시다. 높이는 펼침 목록 그림 칸(260px)에 들어가게 220px 안팎(2026-11-10 사용자 지정).
const FIN = "flex w-[340px] flex-col gap-[10px] rounded-[16px] bg-white p-[18px] text-guest-ink shadow-[0_8px_24px_rgba(58,86,112,0.12)]";

function FinHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <p className="text-[14px] font-bold">{title}</p>
      <span className="text-[11px] text-guest-sub">{sub}</span>
    </div>
  );
}

// 입출금 — 통장 거래 목록. 입금 파랑 · 출금 빨강, 거래마다 계정 꼬리표.
export function FinanceAccountMock() {
  const rows = [
    { date: "11.10", what: "카드 매출 정산", amount: "+1,240,000", account: "매출", plus: true },
    { date: "11.10", what: "식자재 구매", amount: "-320,000", account: "재료비", plus: false },
    { date: "11.09", what: "11월 임대료", amount: "-1,800,000", account: "임대료", plus: false },
  ];
  return (
    <div className={FIN}>
      <FinHead title="입출금 내역" sub="사업자 통장 · 110-***-1234" />
      <ul className="flex flex-col border-t border-guest-list-line">
        {rows.map((r) => (
          <li key={r.what} className="flex items-center gap-[8px] border-b border-guest-list-line py-[8px] text-[12px]">
            <span className="w-[32px] text-guest-sub">{r.date}</span>
            <span className="min-w-0 flex-1 truncate font-medium">{r.what}</span>
            <span className="rounded-[2px] border border-[#e9edf5] bg-[#f8f9fb] px-[4px] text-[10px] text-[#858b94]">{r.account}</span>
            <span className={`w-[78px] text-right font-semibold ${r.plus ? "text-[#5e8ce9]" : "text-[#ef6363]"}`}>{r.amount}</span>
          </li>
        ))}
      </ul>
      <p className="flex justify-between text-[12px]">
        <span className="text-guest-sub">잔액</span>
        <b className="font-bold text-guest-navy">8,452,300원</b>
      </p>
    </div>
  );
}

// 매출 · 매입 등록 — 통장 밖 현금 · 카드 거래를 직접 적는 칸.
export function FinanceEntryMock() {
  return (
    <div className={FIN}>
      <FinHead title="거래 등록" sub="인터플러그 신촌점" />
      <div className="flex gap-[4px] text-[11px]">
        {["매출", "매입", "지출"].map((k) => (
          <span key={k} className={`flex-1 rounded-[6px] py-[5px] text-center font-semibold ${k === "매입" ? "bg-guest-navy text-white" : "bg-[#f1f4f8] text-guest-sub"}`}>
            {k}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-[8px]">
        <MockField label="금액" value="85,000원" />
        <MockField label="계정" value="재료비" />
      </div>
      <p className="flex items-center justify-between rounded-[6px] border border-dashed border-guest-line px-[10px] py-[6px] text-[12px]">
        <span className="text-guest-sub">영수증</span>
        <span className="font-medium">마트_영수증.jpg</span>
      </p>
    </div>
  );
}

// 계정별 현황 — 매출 대비 계정 비율 도넛.
export function FinanceRatioMock() {
  const parts = [
    { label: "인건비", pct: 32, color: "#3a5670" },
    { label: "재료비", pct: 28, color: "#72879a" },
    { label: "임대료", pct: 18, color: "#93a2b1" },
    { label: "기타", pct: 22, color: "#d5e1ec" },
  ];
  let start = 0;
  const r = 15.9155; // 둘레 100
  return (
    <div className={FIN}>
      <FinHead title="계정별 현황" sub="10월 · 매출 대비" />
      <div className="flex items-center gap-[20px]">
        <svg aria-hidden width="110" height="110" viewBox="0 0 42 42" className="-rotate-90">
          {parts.map((p) => {
            const el = <circle key={p.label} cx="21" cy="21" r={r} fill="none" stroke={p.color} strokeWidth="7" strokeDasharray={`${p.pct} ${100 - p.pct}`} strokeDashoffset={-start} />;
            start += p.pct;
            return el;
          })}
        </svg>
        <ul className="flex flex-1 flex-col gap-[6px] text-[12px]">
          {parts.map((p) => (
            <li key={p.label} className="flex items-center gap-[6px]">
              <span className="size-[8px] rounded-[2px]" style={{ background: p.color }} />
              <span className="flex-1 text-guest-sub">{p.label}</span>
              <b className="font-semibold">{p.pct}%</b>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// 매출 조회 · 통계 — 석 달 막대 + 전월 대비.
export function FinanceSalesMock() {
  const bars = [
    { m: "9월", v: 62 },
    { m: "10월", v: 74 },
    { m: "11월", v: 83, now: true },
  ];
  return (
    <div className={FIN}>
      <FinHead title="매출 조회" sub="인터플러그 신촌점" />
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] text-guest-sub">11월 매출</span>
          <b className="text-[20px] font-bold text-guest-navy">24,860,000원</b>
        </div>
        <span className="rounded-[4px] bg-[#f4f9ff] px-[6px] py-[2px] text-[11px] font-semibold text-[#5e8ce9]">전월 대비 +12%</span>
      </div>
      <div className="flex h-[80px] items-end gap-[18px] border-b border-guest-list-line px-[20px]">
        {bars.map((b) => (
          <div key={b.m} className="flex h-full flex-1 flex-col items-center justify-end">
            <span className={`w-full rounded-t-[4px] ${b.now ? "bg-guest-navy" : "bg-[#d5e1ec]"}`} style={{ height: `${b.v}%` }} />
          </div>
        ))}
      </div>
      <div className="flex gap-[18px] px-[20px] text-center text-[11px] text-guest-sub">
        {bars.map((b) => (
          <span key={b.m} className="flex-1">
            {b.m}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── 프랜차이즈 소개 그림 ── 가맹계약 · 상품 배포 · 가맹점 점검은 관리자 웹에 아직 화면이 없어 기능을 보여 주는 화면 예시다(재무관리와 같은 크기 · 모양, 2026-11-10 사용자 지정).
const FR_STATE = { done: "bg-[#f4f9ff] text-[#5e8ce9]", wait: "bg-[#fff6e5] text-[#956013]", draft: "bg-[#f8f9fb] text-[#858b94]", bad: "bg-[#fff1f1] text-[#ef6363]" } as const;

function FrState({ tone, children }: { tone: keyof typeof FR_STATE; children: ReactNode }) {
  return <span className={`rounded-[4px] px-[6px] py-[2px] text-[10px] font-semibold ${FR_STATE[tone]}`}>{children}</span>;
}

// 가맹계약 — 가맹점별 계약 종류 · 서명 현황.
export function FranchiseContractMock() {
  const rows = [
    { store: "인터플러그 신촌점", kind: "신규", state: "서명 완료", tone: "done" },
    { store: "인터플러그 연남점", kind: "갱신", state: "서명 대기", tone: "wait" },
    { store: "인터플러그 합정점", kind: "양도양수", state: "작성 중", tone: "draft" },
  ] as const;
  return (
    <div className={FIN}>
      <FinHead title="가맹계약 현황" sub="표준 계약서 v3" />
      <ul className="flex flex-col border-t border-guest-list-line">
        {rows.map((r) => (
          <li key={r.store} className="flex items-center gap-[8px] border-b border-guest-list-line py-[9px] text-[12px]">
            <span className="min-w-0 flex-1 truncate font-medium">{r.store}</span>
            <span className="w-[52px] text-guest-sub">{r.kind}</span>
            <FrState tone={r.tone}>{r.state}</FrState>
          </li>
        ))}
      </ul>
      <p className="text-right text-[11px] text-guest-sub">계약서 다운로드 ↓</p>
    </div>
  );
}

// 가맹점 등록 — 매장 · 가맹점주 계정 · 가맹계약서 연결.
export function FranchiseStoreMock() {
  return (
    <div className={FIN}>
      <div className="flex items-center gap-[6px]">
        <p className="text-[14px] font-bold">인터플러그 연남점</p>
        <span className="rounded-[2px] border border-[#e9edf5] bg-[#f8f9fb] px-[4px] text-[10px] text-[#858b94]">가맹</span>
      </div>
      <div className="flex flex-col border-t border-guest-list-line text-[12px]">
        {[
          ["가맹점주 계정", "김가맹 · FM000012"],
          ["가맹계약서", "가맹계약서_연남점.pdf"],
          ["계약 기간", "2026.11.01 ~ 2028.10.31"],
        ].map(([k, v]) => (
          <p key={k} className="flex justify-between border-b border-guest-list-line py-[8px]">
            <span className="text-guest-sub">{k}</span>
            <span className="font-medium">{v}</span>
          </p>
        ))}
        <p className="flex items-center justify-between py-[8px]">
          <span className="text-guest-sub">계약 상태</span>
          <FrState tone="done">계약 중</FrState>
        </p>
      </div>
    </div>
  );
}

// 상품 · 가격 배포 — 신메뉴 하나를 전 가맹점에 배포.
export function FranchiseMenuMock() {
  return (
    <div className={FIN}>
      <FinHead title="상품 배포" sub="본사 상품" />
      <div className="flex items-center gap-[12px] rounded-[10px] bg-[#f8f9fb] p-[10px]">
        <span className="flex size-[44px] items-center justify-center rounded-[8px] bg-white text-[20px]">🧋</span>
        <div className="flex min-w-0 flex-1 flex-col">
          <b className="text-[13px] font-semibold">흑당 밀크티</b>
          <span className="text-[11px] text-guest-sub">음료 · 신메뉴</span>
        </div>
        <b className="text-[14px] font-bold text-guest-navy">5,800원</b>
      </div>
      <div className="flex flex-col gap-[6px]">
        <p className="flex justify-between text-[12px]">
          <span className="text-guest-sub">배포 대상</span>
          <span className="font-semibold">가맹점 24곳 · 24곳 완료</span>
        </p>
        <span className="block h-[6px] overflow-hidden rounded-full bg-[#eef1f5]">
          <span className="block h-full w-full bg-guest-navy" />
        </span>
      </div>
    </div>
  );
}

// 가맹점 점검 · 정보공개서 — 현장 점검 결과를 가맹점주와 공유.
export function FranchiseInspectionMock() {
  const rows = [
    { item: "위생 상태", tone: "done", state: "적합" },
    { item: "매장 청결", tone: "done", state: "적합" },
    { item: "메뉴 품질", tone: "bad", state: "보완 필요" },
  ] as const;
  return (
    <div className={FIN}>
      <FinHead title="가맹점 점검 결과" sub="인터플러그 신촌점 · 11월 정기" />
      <ul className="flex flex-col border-t border-guest-list-line">
        {rows.map((r) => (
          <li key={r.item} className="flex items-center justify-between border-b border-guest-list-line py-[8px] text-[12px]">
            <span className="font-medium">{r.item}</span>
            <FrState tone={r.tone}>{r.state}</FrState>
          </li>
        ))}
      </ul>
      <p className="flex justify-between text-[11px] text-guest-sub">
        <span>점검자 · 슈퍼바이저 정하윤</span>
        <span className="font-semibold text-guest-navy">가맹점주에게 공유됨</span>
      </p>
    </div>
  );
}
