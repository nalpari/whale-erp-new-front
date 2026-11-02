// 점포 화면(stores/*)만 쓰는 조각. 앱 src/app/stores/store-parts.tsx · src/components/address-field.tsx 등을 옮겼다(2026-10-30 「front대로」 재영).
// 다른 화면이 쓰는 biz-form.mjs 의 address · disabledButton 은 그대로 두고, 점포 화면은 여기 것을 쓴다.
import * as ui from "./ui.mjs";
import { ICON } from "./extra.mjs";

// 폐점 견본 점포 — 목록 · 폐점 상세만 쓴다. site.mjs STORES 에 넣으면 헤더 범위(전체 N개점)가 모든 화면에서 바뀌어 여기 따로 둔다.
// 점포코드는 등록 순서라 가장 큰 번호다(앞 번호는 모두 쓰였다).
export const CLOSED_STORE = ["ST000012", "모리커피 해운대점", "가맹점포", "폐점", "617-24-55012", "051-746-2210", 0, "2026-09-22", "부산 해운대구", ""];

// 상세 화면 주소 — 견본 상태마다 화면이 따로 있다
export const detailPageOf = (code) =>
  code === "ST000007" ? "stores/detail-not-operating.html" : code === CLOSED_STORE[0] ? "stores/detail-closed.html" : "stores/detail.html";

// 점포상태 배지 — 운영 파랑 · 미운영 빨강 · 폐점 회색(앱 StoreStatusBadge)
export const statusBadge = (state) => ui.badge(state === "운영" ? "on" : state === "폐점" ? "closed" : "off", state);

// 막힌 버튼의 이유 — 공통 Blocked(blocked.tsx)와 같다. 막힌 버튼은 호버를 받지 않아 감싸는 칸에 title 을 단다
export const blocked = (label, why, variant = "soft") => `<span title="${why}" class="inline-flex">${ui.button(label, { variant, disabled: true })}</span>`;

// 화면 위 안내 띠(공통 NoticeBand). risk 는 빨강 · info 는 표 머리 바탕, detail 은 아랫줄 먹색 설명
export const noticeBand = (tone, title, detail = "") =>
  `<div role="${tone === "risk" ? "alert" : "status"}" class="rounded-[2px] border px-[16px] py-[12px] text-[14px] leading-[1.6] ${
    tone === "risk" ? "border-erp-off bg-erp-off-bg text-erp-off" : "border-erp-panel-line bg-erp-thead-bg text-erp-ink"
  }"><p class="font-medium">${title}</p>${detail ? `<div class="text-erp-ink">${detail}</div>` : ""}</div>`;

// 대표 이미지 자리(앱 StoreImage) — 주소가 없으면 점포 아이콘. 48 목록 카드 · 72 상세 머리 카드 · 184 등록 · 수정
export const storeImage = (size, url, name) => {
  const box = `size-[${size}px]`;
  if (url) return `<img src="${url}" alt="${name ? `${name} 대표 이미지` : "대표 이미지"}" class="shrink-0 rounded-[2px] border border-erp-panel-line bg-white object-cover ${box}">`;
  const icon = size === 184 ? 48 : size === 72 ? 28 : 20;
  return `<span role="img" aria-label="대표 이미지 없음" class="grid shrink-0 place-items-center rounded-[2px] text-erp-label bg-erp-thead-bg ${box}"><svg viewBox="0 0 24 24" width="${icon}" height="${icon}" class="shrink-0 fill-none stroke-current" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON.store}</svg></span>`;
};

// 입력칸 아래 안내(앱 store-form-view.tsx Note)
export const note = (t) => `<p class="text-[13px] leading-[1.6] text-erp-label">${t}</p>`;

// 대표 이미지 안내 — 형식은 api 가 주는 목록(JPG · PNG)이다
export const IMAGE_NOTE = "JPG · PNG 파일 1장만 등록할 수 있습니다. (최대 5MB)<br>이미지를 선택한 후 ‘저장’을 눌러야 반영됩니다.";

// 위치 도움말 세 줄(등록 · 수정 같다)
export const LOCATION_NOTE = note(
  `점포주소가 입력되면 <b class="font-semibold">위도</b> · <b class="font-semibold">경도</b> 좌표값이 자동으로 표시됩니다.<br>` +
    `<b class="font-semibold">출퇴근 위치 적용 여부</b>를 <b class="font-semibold">사용</b>으로 설정하면 이 좌표를 기준으로 직원의 출퇴근 위치를 확인할 수 있습니다.<br>` +
    `위도 · 경도가 없으면 <b class="font-semibold">출퇴근 위치 적용 여부</b>를 사용으로 고를 수 없습니다.`,
);

// 주소(앱 AddressField). [주소 검색] 버튼 없이 돋보기 검색칸에 치면 바로 아래 목록이 뜬다. 우편번호 80px, 값이 있으면 [지우기].
// disabled: 다른 값(점포 주소)과 같아 보여 주기만 한다 — 검색칸 · 지우기를 숨기고 상세주소는 읽기 전용.
// hideClear: 비운 채로 둘 수 없는 값(운영 점포의 점포 주소)이라 [지우기]만 숨긴다. 상세주소는 주소를 고르기 전에는 막힌다.
export const address = (A, label, { zip = "", base = "", detail = "" } = {}, { labelExtra = "", disabled = false, hideClear = false } = {}) =>
  `<div role="group" aria-label="${label}" class="flex flex-col gap-[8px]"><span class="flex items-center gap-[10px] text-[14px] font-medium text-erp-label"><span>${label}</span>${labelExtra}</span>` +
  (disabled ? "" : ui.searchField(A, { placeholder: "지번/도로명을 입력해 주세요.", label: `${label} 검색어` })) +
  `<div class="flex gap-[6px]"><div class="w-[80px] shrink-0 text-center">${ui.textField({ value: zip, readonly: true, placeholder: "우편번호", "aria-label": `${label} 우편번호` })}</div>${ui.textField({ value: base, readonly: true, placeholder: "기본주소", "aria-label": `${label} 기본주소` })}${
    !disabled && !hideClear && (zip || base || detail) ? ui.button("지우기", { variant: "off" }) : ""
  }</div>` +
  ui.textField({
    value: detail,
    maxlength: 100,
    readonly: disabled,
    disabled: !disabled && !base && !detail,
    placeholder: base ? "상세주소" : "상세주소를 입력하세요.",
    "aria-label": `${label} 상세주소`,
  }) +
  `</div>`;

// 점포유형 큰 선택 카드(앱 StoreTypeCards) — 기본 선택 없음, 위아래 24px
export const typeCards = () =>
  `<div role="radiogroup" aria-label="점포유형" class="grid grid-cols-2 gap-[12px]">${[
    ["직영점포", "직접 운영하는 점포"],
    ["가맹점포", "가맹 계약으로 운영하는 점포"],
  ]
    .map(
      ([label, desc]) =>
        `<label class="group flex cursor-pointer flex-col items-center gap-[10px] rounded-[4px] border bg-white px-[18px] py-[24px] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-erp-brand has-[:checked]:border-erp-brand has-[:checked]:bg-erp-thead-bg has-[:focus-visible]:border-erp-brand border-erp-panel-line"><input type="radio" name="storeTypeCode" class="sr-only"><b class="text-[16px] font-semibold text-erp-ink">${label}</b><span class="text-[13px] text-erp-label">${desc}</span></label>`,
    )
    .join("")}</div>`;
