// 점포 등록. 목업 docs/mockup/stores/new.html 의 기본 상태(아무것도 넣기 전 · 이미지 없음 · 인증 전)를 BP 마스터로 본 것.
// 입력칸은 모두 빈 값으로 둔다 — 등록 화면이니 처음 열었을 때 그대로여야 한다.
// 목업처럼 목록 옆 패널이 아니라 별도 화면이다(재영 결정). 폼은 1팀 FormGroup·FormRow·Field. 2026-10-30 앱(store-form-view.tsx)대로 맞춤(재영).
// render 의 bpStatus(「탈퇴」 · 「미사용」)를 주면 그 상태인 BP 를 플랫폼 계정으로 고르고 들어온 것이다(new-bp-withdrawn.mjs, 앱 store-form-view.tsx 와 같다, 2026-10-28).
import * as ui from "../../ui.mjs";
import * as f from "../../biz-form.mjs";
import { erpHeader, link } from "../../site.mjs";
import { IMAGE_NOTE, LOCATION_NOTE, address, note, statusBadge, storeImage, typeCards } from "../../store-parts.mjs";

export const render = ({ A, R }, { bpStatus } = {}) => {
  // 대표 이미지(184px 점포 아이콘)는 기본정보 맨 아래 — 버튼 · 안내는 그림 아래쪽에 맞춘다(앱과 같다)
  const image = f.group(
    "대표 이미지",
    `<div class="flex items-end gap-[18px]">${storeImage(184)}<div class="flex min-w-0 flex-col gap-[8px]"><div class="flex gap-[6px]">${ui.button("이미지 올리기", { variant: "soft" })}</div>${note(IMAGE_NOTE)}</div></div>`,
  );

  // 점포상태를 맨 위에 두고 그다음 점포유형(앱과 같다). 새 점포는 미운영으로만 생기고,
  // 운영으로 바꾸는 것은 등록을 마친 뒤 수정 · 상세 [상태 변경]에서 한다(사업자 인증 · 좌표가 있어야 한다).
  const status = f.group("점포상태", `<div class="flex h-[34px] items-center">${statusBadge("미운영")}</div>`);
  // 점포유형은 등록 뒤 바꿀 수 없다 — 큰 선택 카드로 고르고, 처음에는 아무것도 고르지 않은 채다(앱 EMPTY_STORE_FORM)
  const types = `<div class="flex flex-col gap-[8px]"><span class="text-[14px] font-medium text-erp-label">${f.req("점포유형")}</span>${typeCards()}</div>`;

  // 칸 폭은 고정하지 않고 한 줄을 반씩 나눈다(앱 FormRow)
  const basic = ui.formGroup(
    "점포 기본정보",
    status,
    types,
    ui.formRow(
      ui.field(f.req("점포명"), ui.textField({ maxlength: 50, placeholder: "50자 이내로 입력해 주세요." })),
      f.group("점포 연락처", f.tel()),
    ),
    address(A, "점포 주소"),
    // 출퇴근 위치 적용 여부는 처음 「미사용」이고, 좌표가 없으면 사용으로 고를 수 없다(막힌 이유는 도움말 셋째 줄에도). [주소로 다시 계산]은
    // 주소를 고르기 전에는 막힌다 — 자동 채워진 뒤 직접 고친 좌표를 주소 기준 값으로 되돌릴 때 쓴다(2026-10-19).
    `<div class="flex flex-col gap-[8px]">` +
      ui.formRow(
        ui.field("위도", ui.textField({ inputmode: "decimal", placeholder: "예: 37.556312" }), "w-[160px]"),
        ui.field("경도", ui.textField({ inputmode: "decimal", placeholder: "예: 126.901845" }), "w-[160px]"),
        ui.field("출퇴근 위치 적용 여부", ui.select(["사용", "미사용"], { value: "미사용", disabled: true, title: "위도 · 경도가 있어야 사용으로 고를 수 있습니다." }), "w-[150px]"),
        `<div class="self-end">${ui.button("주소로 다시 계산", { variant: "soft", disabled: true })}</div>`,
      ) +
      LOCATION_NOTE +
      `</div>`,
    image,
  );

  // 층별 표는 처음엔 줄 없이 안내 한 줄 — [층 추가]로 줄을 더한다(앱 FloorTable)
  const floors = ui.formGroup("점포 공간정보", f.floorTable([]));

  // 순서는 사업자등록번호 인증 상자 → 상호명 · 대표자 연락처 → 업태 · 종목 → 사업자주소(2026-10-16 점검). 둘 다 반씩이다.
  // 인증 상자는 앱 공통 상자와 같다(S-VRNTHD) — 세 칸 한 줄, 인증 상태는 묶음 제목 배지(인증일은 저장 시점 값이라 등록 화면은 미인증)
  const biz = ui.formGroup(
    f.titleBadge("사업자정보", "off", "미인증"),
    f.bizVerifyBox(A, {
      id: "sbiz",
      row: true,
      buttons: ui.button("인증하기", { variant: "soft" }),
      guide: `${f.BIZ_GUIDE}<br>점포 등록 시 사업자 인증은 선택사항이나, 점포상태를 ‘운영’으로 변경하려면 반드시 인증을 완료해야 합니다.`,
    }),
    ui.formRow(
      ui.field("상호명", ui.textField({ maxlength: 50, placeholder: "50자 이내로 입력해 주세요." })),
      f.group("대표자 연락처", f.tel()),
    ),
    ui.formRow(
      ui.field("업태", ui.textField({ maxlength: 50, placeholder: "50자 이내로 입력해 주세요." })),
      ui.field("종목", ui.textField({ maxlength: 50, placeholder: "50자 이내로 입력해 주세요." })),
    ),
    // 등록 기본값은 해제 — 점포주소와 사업자주소가 다를 수 있다(EMPTY_STORE_FORM.bizSameAsStore, 사용자 지정, 2026-10-23)
    address(A, "사업자주소", {}, { labelExtra: ui.checkbox(A, "점포 주소와 같음", false) }),
  );

  // 취소 · 저장은 제목 줄 오른쪽에 둔다 — 근로계약서 작성 화면(staff/contracts-new.mjs)과 같은 자리(2026-10-19 점검 — 실사용자 확인).
  // 등록할 BP 가 탈퇴 · 미사용이면 들어오자마자 제목 줄 위에 알리고 저장을 막는다 — 미사용 · 탈퇴를 가르지 않는 한 문장(앱 store-form-view.tsx BP_BLOCKED_TEXT.create 와 같다, 2026-10-28)
  const blocked = bpStatus ? "BP가 탈퇴 또는 미사용 상태로, 점포를 등록할 수 없습니다." : "";
  const save = blocked ? ui.button("저장", { disabled: true }) : ui.button("저장", { href: link(R, "stores/detail.html") });
  const body = ui.detailBody(
    (blocked ? f.noticeBand(blocked) : "") +
      ui.sectionHead("점포 등록", ui.button("취소", { variant: "off", href: link(R, "stores/index.html") }) + save) +
      // 두 묶음은 각자 내용만큼의 높이로 둔다. 높이를 맞추려 늘리면 짧은 쪽 상자에 빈 자리가 남는다.
      `<div class="grid grid-cols-2 items-start gap-[24px]">${basic}${biz}</div>` +
      floors +
      f.SWAP_SCRIPT,
  );
  return { title: bpStatus ? `점포 등록 · BP ${bpStatus}` : "점포 등록", html: ui.erpFrame({ header: erpHeader(A, R, { bpStatus }), title: "점포 정보 관리", body }) };
};

export default (ctx) => render(ctx);
