import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/common";
import { formatPhone } from "@/lib/format";
import type { StoreStatus, StoreSummary, StoreType } from "@/lib/store-types";
import { CodeLabel } from "@/components/site/code-label";
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

/** 점포상태 배지 — 운영은 파랑, 미운영 · 폐점은 빨강. 색만으로 말하지 않게 글자를 함께 둔다(DESIGN.md) */
export function StoreStatusBadge({ status }: { status: StoreStatus }) {
  return <Badge tone={status === "OPERATING" ? "on" : "off"}><CodeLabel group="STORE_STATUS" value={status} /></Badge>;
}

/** 대표 이미지 자리. 주소가 없거나(이미지 없음 · 저장소를 쓸 수 없음) 불러오지 못하면 점포 아이콘이 선다 */
export function StoreImage({ size, onMuted = false, url, name }: { size: 48 | 184; onMuted?: boolean; url?: string | null; name?: string }) {
  const sizeClass = size === 48 ? "size-[48px]" : "size-[184px]";
  const icon = (
    <span
      role="img"
      aria-label="대표 이미지 없음"
      className={`grid shrink-0 place-items-center rounded-[2px] text-erp-label ${onMuted ? "bg-white" : "bg-erp-thead-bg"} ${sizeClass}`}
    >
      <LineIcon name="store" size={size === 48 ? 20 : 48} />
    </span>
  );
  if (!url) return icon;
  return <StoreImagePicture key={url} url={url} alt={name ? `${name} 대표 이미지` : "대표 이미지"} sizeClass={sizeClass} fallback={icon} />;
}

/**
 * 점포 카드. 카드 전체가 상세로 가는 링크다. 모서리 4px · 1px 선 · 그림자 없음(카드 규칙), 호버는 선 색만 바꾼다.
 * 운영이 아닌 카드(미운영 · 폐점)는 바탕을 두 번째 바탕색으로 깔아 흐리게 둔다(데모와 같다).
 */
export function StoreCard({ store, href }: { store: StoreSummary; href: string }) {
  const muted = store.storeStatusCode !== "OPERATING";
  const fields: [string, ReactNode, boolean?][] = [
    ["근무직원", `${store.staffCount.toLocaleString("ko-KR")}명`],
    ["연락처", store.phone ? formatPhone(store.phone) : "-"],
    ["지역", store.region ?? "-", true],
  ];
  return (
    <Link
      href={href}
      className={`flex flex-col gap-[18px] rounded-[4px] border border-erp-panel-line p-[18px] transition-colors duration-150 ease-out hover:border-erp-brand ${muted ? "bg-erp-thead-bg" : "bg-white"}`}
    >
      <div className="flex items-center gap-[12px]">
        <StoreImage size={48} onMuted={muted} url={store.imageUrl} name={store.name} />
        <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
          <b className="truncate text-[15px] font-semibold text-erp-ink">{store.name}</b>
          <span className="truncate text-[13px] text-erp-label">
            {store.storeCode} · <CodeLabel group="STORE_TYPE" value={store.storeTypeCode} />
          </span>
        </div>
        <StoreStatusBadge status={store.storeStatusCode} />
      </div>
      <dl className="grid grid-cols-2 gap-x-[12px] gap-y-[10px] border-t border-erp-divider pt-[12px]">
        {fields.map(([label, value, wide]) => (
          <div key={label} className={`flex flex-col gap-[4px] ${wide ? "col-span-2" : ""}`}>
            <dt className="text-[13px] text-erp-label">{label}</dt>
            <dd className="truncate text-[14px] text-erp-ink">{value}</dd>
          </div>
        ))}
        {!store.bizRegistrationNumber && (
          <div className="col-span-2 text-[13px] text-erp-label">사업자정보 미인증</div>
        )}
      </dl>
    </Link>
  );
}

/**
 * 큰 선택 카드(라디오) — 점포유형. 고르면 선이 브랜드색, 바탕이 두 번째 바탕색으로 바뀐다. 선 두께는 바뀌지 않는다.
 * locked: 바꿀 수 없는 값(수정 화면). 라디오를 막고 고르지 않은 카드는 흐리게 둔다.
 */
export function StoreTypeCards({
  value,
  onChange,
  locked = false,
  invalid,
  describedBy,
}: {
  value: StoreType | "";
  onChange?: (value: StoreType) => void;
  locked?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  const items: { type: StoreType; desc: string }[] = [
    { type: "DIRECT", desc: "본사가 직접 운영하는 점포" },
    { type: "FRANCHISE", desc: "가맹 계약으로 운영하는 점포" },
  ];
  return (
    <div role="radiogroup" aria-label="점포유형" aria-invalid={invalid} aria-describedby={describedBy} className="grid grid-cols-2 gap-[12px]">
      {items.map(({ type, desc }) => {
        const checked = value === type;
        return (
          <label
            key={type}
            className={`group flex flex-col items-center gap-[10px] rounded-[4px] border bg-white px-[18px] py-[24px] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] has-[:checked]:border-erp-brand has-[:checked]:bg-erp-thead-bg has-[:focus-visible]:border-erp-brand ${
              invalid ? "border-erp-off" : "border-erp-panel-line"
            } ${locked ? `cursor-default ${checked ? "" : "opacity-40"}` : "cursor-pointer hover:border-erp-brand"}`}
          >
            <input type="radio" name="storeTypeCode" className="sr-only" checked={checked} disabled={locked} onChange={() => onChange?.(type)} />
            <span className="grid size-[48px] place-items-center rounded-[4px] border border-transparent bg-erp-thead-bg text-erp-label transition-colors duration-150 group-has-[:checked]:border-erp-panel-line group-has-[:checked]:bg-white group-has-[:checked]:text-erp-ink">
              <LineIcon name="store" size={22} />
            </span>
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

/** 실패 · 막힘 안내 띠 — 화면 위에 하나만 선다 */
export function NoticeBand({ tone = "risk", title, detail }: { tone?: "risk" | "info"; title: string; detail?: ReactNode }) {
  const color = tone === "risk" ? "border-erp-off bg-erp-off-bg text-erp-off" : "border-erp-panel-line bg-erp-thead-bg text-erp-ink";
  return (
    <div role={tone === "risk" ? "alert" : "status"} className={`rounded-[2px] border px-[16px] py-[12px] text-[14px] leading-[1.6] ${color}`}>
      <p className="font-medium">{title}</p>
      {detail && <div className="text-erp-ink">{detail}</div>}
    </div>
  );
}
