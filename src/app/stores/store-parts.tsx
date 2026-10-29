import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Tag } from "@/components/common";
import { formatPhone } from "@/lib/format";
import type { StoreStatus, StoreSummary, StoreType } from "@/lib/store-types";
import { CodeLabel } from "@/components/site/code-label";
import { imageKeyOf } from "@/lib/store-image";
import { StoreImagePicture } from "./store-image-picture";

// 점포 화면들이 같이 쓰는 작은 조각. 공통 컴포넌트에 없는 것만 둔다 — 데모 docs/demo/src/extra.mjs 의 임시 부품(카드 ·
// 큰 선택 카드 · 선 아이콘. 보기 전환은 store-list-controls.tsx)을 옮긴 것이고, 다른 화면이 같은 모양을 쓰게 되면 1팀과 맞춰 공통 컴포넌트로 올린다.

/** 선 아이콘(24 상자, 선 굵기 1.6) — 데모 extra.mjs ICON 과 같다. public/icons 에 없다 */
const PATHS = {
  store: (
    <>
      <path d="M4.6 9.6v10.7h14.8V9.6" />
      <path d="M3 9.6 4.7 3.9h14.6L21 9.6" />
      <path d="M3 9.6a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M9.6 20.3v-6.1h4.8v6.1" />
    </>
  ),
  grid: (
    <>
      <rect x="3.6" y="3.6" width="7" height="7" rx="1.4" />
      <rect x="13.4" y="3.6" width="7" height="7" rx="1.4" />
      <rect x="3.6" y="13.4" width="7" height="7" rx="1.4" />
      <rect x="13.4" y="13.4" width="7" height="7" rx="1.4" />
    </>
  ),
  table: (
    <>
      <rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2" />
      <path d="M3.4 9.6h17.2M3.4 14.6h17.2M9.6 9.6v9.8" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M15.4 4.9a3.4 3.4 0 0 1 0 6.2M18 14.4c1.8.9 3 2.9 3 5.6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.6" width="14" height="9.8" rx="1.6" />
      <path d="M8.2 10.6V7.8a3.8 3.8 0 0 1 7.6 0v2.8" />
    </>
  ),
};

export function LineIcon({ name, size }: { name: keyof typeof PATHS; size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="shrink-0 fill-none stroke-current"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}

/** 점포상태 배지 — 운영은 파랑, 미운영은 빨강(손볼 일이 있는 상태), 폐점은 회색(더는 손댈 일이 없는 상태).
    색만으로 말하지 않게 글자를 함께 둔다(DESIGN.md, 2026-10-16 점검 — 폐점이 미운영과 같은 색이라 가렸다). */
const STORE_STATUS_TONE: Record<StoreStatus, "on" | "off" | "closed"> = {
  OPERATING: "on",
  NOT_OPERATING: "off",
  CLOSED: "closed",
};
export function StoreStatusBadge({ status }: { status: StoreStatus }) {
  return (
    <Badge tone={STORE_STATUS_TONE[status]}>
      <CodeLabel group="STORE_STATUS" value={status} />
    </Badge>
  );
}

/** 대표 이미지 자리. 주소가 없거나(이미지 없음 · 저장소를 쓸 수 없음) 불러오지 못하면 점포 아이콘이 선다.
 * 72 는 상세 제목 줄의 머리 카드 전용(2026-10-19 점검 — 실사용자 확인, 1안 채택) — 목록 카드(48) · 등록 ·
 * 수정 화면(184) 과는 다른 자리라 셋째 크기로 더했다. 상세 표에는 더는 이미지를 두지 않는다(머리 카드로 옮김). */
export function StoreImage({ size, onMuted = false, url, name }: { size: 48 | 72 | 184; onMuted?: boolean; url?: string | null; name?: string }) {
  const sizeClass = size === 48 ? "size-[48px]" : size === 72 ? "size-[72px]" : "size-[184px]";
  const icon = (
    <span
      role="img"
      aria-label="대표 이미지 없음"
      className={`grid shrink-0 place-items-center rounded-[2px] text-erp-label ${onMuted ? "bg-white" : "bg-erp-thead-bg"} ${sizeClass}`}
    >
      <LineIcon name="store" size={size === 184 ? 48 : size === 72 ? 28 : 20} />
    </span>
  );
  if (!url) return icon;
  return <StoreImagePicture key={imageKeyOf(url)} url={url} alt={name ? `${name} 대표 이미지` : "대표 이미지"} sizeClass={sizeClass} fallback={icon} />;
}

/** 느낌표 동그라미(테두리만 그린 원) — 플랫폼 관리자 admin-parts.tsx 의 확인 표시와 같은 크기 · 선 두께 */
function NoticeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 5.5v5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14.25" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * 점포 카드. 카드 전체가 상세로 가는 링크다. 모서리 4px · 1px 선 · 그림자 없음(카드 규칙), 호버는 선 색만 바꾼다.
 * 운영이 아닌 카드(미운영 · 폐점)는 바탕을 두 번째 바탕색으로 깔아 흐리게 둔다(데모와 같다).
 */
export function StoreCard({ store, href }: { store: StoreSummary; href: string }) {
  const muted = store.storeStatusCode !== "OPERATING";
  const verified = Boolean(store.bizRegistrationNumber);
  // 미인증이면 점포주소를 반 칸으로 줄이고 그 옆에 「사업자정보 미인증」을 둔다(아래 dl 끝) — 카드 아래쪽에 한 줄로 따로 두면
  // 그 카드만 길어져 줄이 들쑥날쑥했다. 인증 완료는 따로 알리지 않는다(2026-10-23 사용자 요청).
  const fields: [string, ReactNode, boolean?][] = [
    ["점포 연락처", store.phone ? formatPhone(store.phone) : "-"],
    ["재직직원", `${store.staffCount.toLocaleString("ko-KR")}명`],
    ["점포주소", store.region ?? "-", verified],
  ];
  return (
    <Link
      href={href}
      // 모서리는 8px — 점포 카드만 카드 규칙(4px)의 예외다(DESIGN.md Cards, 1팀 동의 2026-10-27. 2026-10-16 에는 확인 전이라 4px 로 되돌려 뒀다).
      // 머리(그림 · 이름)와 아래 구분선 사이는 12px — 구분선 아래(pt-[12px])와 같게, 18px 는 떨어져 보였다(2026-10-23 사용자 요청).
      className={`flex flex-col gap-[12px] rounded-[8px] border border-erp-panel-line p-[18px] transition-colors duration-150 ease-out hover:border-erp-brand ${muted ? "bg-erp-thead-bg" : "bg-white"}`}
    >
      <div className="flex items-start gap-[12px]">
        <StoreImage size={48} onMuted={muted} url={store.imageUrl} name={store.name} />
        <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
          {/* 이름은 한 줄 — 넘치면 말줄임하고 전체 이름은 마우스를 올리면 보인다. 두 줄까지 보이던 때는 이름 길이에 따라
              카드마다 아래 유형 · 점포코드 줄과 구분선 높이가 달라 들쑥날쑥했다(2026-10-23 사용자 요청) */}
          <b title={store.name} className="truncate text-[16px] font-semibold text-erp-ink">{store.name}</b>
          <span className="flex items-center gap-[6px] truncate text-[13px] text-erp-label">
            <Tag><CodeLabel group="STORE_TYPE" value={store.storeTypeCode} /></Tag>
            <span className="truncate">{store.storeCode}</span>
          </span>
        </div>
        <StoreStatusBadge status={store.storeStatusCode} />
      </div>
      <dl className="grid grid-cols-2 gap-x-[12px] gap-y-[18px] border-t border-erp-divider pt-[12px]">
        {fields.map(([label, value, wide]) => (
          <div key={label} className={`flex flex-col gap-[4px] ${wide ? "col-span-2" : ""}`}>
            <dt className="text-[13px] text-erp-label">{label}</dt>
            <dd className="truncate text-[14px] text-erp-ink">{value}</dd>
          </div>
        ))}
        {/* 미인증 안내 — 보기엔 옆 칸 제목(점포주소)과 같은 줄 · 같은 글자의 제목만 있는 칸이지만, dl 은 제목마다 값이
            있어야 해서 제목(사업자정보)은 화면 읽기 프로그램에만 두고 「사업자정보 미인증」을 값으로 둔다. 뒤의 느낌표 동그라미는
            제목과 같은 회색이다(색은 상태에만). */}
        {!verified && (
          <div className="flex flex-col gap-[4px]">
            <dt className="sr-only">사업자정보</dt>
            <dd className="flex items-center gap-[4px] text-[13px] text-erp-label">
              사업자정보 미인증
              <NoticeIcon />
            </dd>
          </div>
        )}
      </dl>
    </Link>
  );
}

/**
 * 큰 선택 카드(라디오) — 점포유형(등록 화면 전용, 등록 뒤에는 바꿀 수 없어 수정 화면에는 두지 않는다).
 * 고르면 선이 브랜드색, 바탕이 두 번째 바탕색으로 바뀐다. 선 두께는 바뀌지 않는다.
 */
export function StoreTypeCards({
  value,
  onChange,
  invalid,
  describedBy,
}: {
  value: StoreType | "";
  onChange?: (value: StoreType) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const items: { type: StoreType; desc: string }[] = [
    { type: "DIRECT", desc: "직접 운영하는 점포" },
    { type: "FRANCHISE", desc: "가맹 계약으로 운영하는 점포" },
  ];
  return (
    <div role="radiogroup" aria-label="점포유형" aria-invalid={invalid} aria-describedby={describedBy} className="grid grid-cols-2 gap-[12px]">
      {items.map(({ type, desc }) => {
        const checked = value === type;
        return (
          <label
            key={type}
            className={`group flex cursor-pointer flex-col items-center gap-[10px] rounded-[4px] border bg-white px-[18px] py-[24px] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-erp-brand has-[:checked]:border-erp-brand has-[:checked]:bg-erp-thead-bg has-[:focus-visible]:border-erp-brand ${
              invalid ? "border-erp-off" : "border-erp-panel-line"
            }`}
          >
            <input type="radio" name="storeTypeCode" className="sr-only" checked={checked} onChange={() => onChange?.(type)} />
            <b className="text-[16px] font-semibold text-erp-ink"><CodeLabel group="STORE_TYPE" value={type} /></b>
            <span className="text-[13px] text-erp-label">{desc}</span>
          </label>
        );
      })}
    </div>
  );
}

/** 칸 오류 문구 — 그 입력칸 바로 아래 한 줄. 문구가 없으면 자리도 차지하지 않는다 */
export function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[13px] leading-[1.5] text-erp-off">
      {message}
    </p>
  );
}
