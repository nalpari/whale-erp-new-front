// 점포 수정. 목업 docs/mockup/stores/edit.html 의 기본 상태(모리커피 연남점 · 인증된 점포 · 이미지 있음)를 BP 마스터로 본 것.
// 배치는 점포 등록 화면에 맞춘다(재영 2026-10-06). 폼은 1팀 FormGroup·FormRow·Field. 2026-10-30 앱(store-form-view.tsx)대로 맞춤(재영).
// render 의 bpStatus(「탈퇴」 · 「미사용」)를 주면 소속 BP 가 그 상태인 점포를 플랫폼 계정으로 본 것이다(edit-bp-unused.mjs, 앱 store-form-view.tsx 와 같다, 2026-10-28).
// 폐점 점포 수정(「폐점 점포는 수정할 수 없습니다.」 info 띠)은 상세에 [수정]이 없어 들어올 길이 없어 데모 화면을 두지 않는다.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as f from "../../biz-form.mjs";
import { STORES, erpHeader, link } from "../../site.mjs";
import { IMAGE_NOTE, LOCATION_NOTE, address, note, storeImage } from "../../store-parts.mjs";

export const render = ({ A, R }, { bpStatus } = {}) => {
  const [code, name, type, , , , , , , photo] = STORES.find((s) => s[0] === "ST000006");
  const blockedId = x.dialogId();
  const closeSaveId = x.dialogId();
  // 소속 BP 가 탈퇴 · 미사용이면 저장 · 점포상태 · 인증 상자 · 이미지 버튼 · [주소로 다시 계산]을 막는다(앱 closedOrBlocked)
  const blocked = bpStatus ? f.bpBlockedText(bpStatus) : "";
  const off = Boolean(blocked);

  // 점포유형은 등록 뒤 바꿀 수 없다 — 등록 화면의 큰 선택 카드를 여기 두지 않고, 제목 줄 꼬리에 점포코드 · 점포유형으로만 알린다(2026-10-16 점검).

  // 대표 이미지(184px). [이미지 삭제]를 누르면 아이콘 · [이미지 올리기] · [되돌리기] 묶음으로 바뀐다 — 저장 전까지는 지우지 않는다(앱과 같다).
  // [이미지 바꾸기]로 파일을 고른 뒤에도 [되돌리기]가 선다(데모는 파일을 고르지 않는다)
  const imageRow = (id, pic, buttons, text, hidden) =>
    `<div id="${id}" class="flex items-end gap-[18px]"${hidden ? " hidden" : ""}>${pic}<div class="flex min-w-0 flex-col gap-[8px]"><div class="flex gap-[6px]">${buttons}</div>${note(text)}</div></div>`;
  const image = f.group(
    "대표 이미지",
    imageRow(
      "eimg-keep",
      storeImage(184, `${A}img/${photo}`, name),
      ui.button("이미지 바꾸기", { variant: "soft", disabled: off }) + ui.button("이미지 삭제", { variant: "off", disabled: off, ...f.swapAttr("eimg-keep", "eimg-remove") }),
      IMAGE_NOTE,
    ) +
      imageRow(
        "eimg-remove",
        storeImage(184),
        ui.button("이미지 올리기", { variant: "soft" }) + ui.button("되돌리기", { variant: "off", ...f.swapAttr("eimg-remove", "eimg-keep") }),
        "저장하면 대표 이미지를 지웁니다.",
        true,
      ),
  );

  // 점포상태: 갈 수 있는 상태만 — 운영 점포는 운영 · 폐점(앱 nextStatuses). 폐점을 고르는 순간 조건을 확인하고, 못 채우면 「폐점할 수 없습니다.」 창 뒤 이전 값으로 돌린다.
  // 조건을 채운 폐점은 [저장] 때 「폐점으로 저장할까요?」를 거친다 — 이 견본은 진행 중 근로계약이 6건이라 그 창까지 가지 않는다.
  // 점포명과 같은 폭이 되게 반 칸에 둔다(오른쪽은 빈 자리)
  const status = ui.formRow(
    ui.field(
      f.req("점포상태"),
      ui.select(["운영", "폐점"], { value: "운영", disabled: off, onchange: `if(this.value==='폐점'){this.value='운영';document.getElementById('${blockedId}').showModal()}` }),
    ),
    `<div class="min-w-0 flex-1" aria-hidden="true"></div>`,
  );

  const basic = ui.formGroup(
    "점포 기본정보",
    status,
    ui.formRow(
      ui.field(f.req("점포명"), ui.textField({ value: name, maxlength: 50, placeholder: "50자 이내로 입력해 주세요." })),
      f.group("점포 연락처", f.tel("02", "322", "1180")),
    ),
    // 운영 점포는 좌표가 있어야 하고 그 좌표는 이 주소에서 나와 [지우기]를 숨긴다 — 새 주소로 바꾸는 것(검색해 고르기)은 된다
    address(A, "점포 주소", { zip: "03991", base: "서울 마포구 동교로 256", detail: "1층" }, { hideClear: true }),
    `<div class="flex flex-col gap-[8px]">` +
      ui.formRow(
        ui.field("위도", ui.textField({ value: "37.562104", inputmode: "decimal", placeholder: "예: 37.556312" }), "w-[160px]"),
        ui.field("경도", ui.textField({ value: "126.925631", inputmode: "decimal", placeholder: "예: 126.901845" }), "w-[160px]"),
        ui.field("출퇴근 위치 적용 여부", ui.select(["사용", "미사용"], { value: "사용" }), "w-[150px]"),
        `<div class="self-end">${ui.button("주소로 다시 계산", { variant: "soft", disabled: off })}</div>`,
      ) +
      LOCATION_NOTE +
      `</div>`,
    image,
  );

  // 순서는 사업자등록번호 인증 상자 → 상호명 · 대표자 연락처 → 업태 · 종목 → 사업자주소(2026-10-16 점검). 둘 다 반씩이다.
  // 저장한 점포는 세 칸이 잠긴 「인증 완료 · 저장된 인증일」로 열린다 — 인증해 잠근 동안은 안내 줄이 없다(앱 biz-verification-box.tsx).
  // [재인증]은 대표자명만 열고 안내 두 줄이 다시 선다. [재인증 취소]는 저장된 값으로 되돌린다(S-VRNTHD · S-JEPOMK).
  // 인증일은 상세의 최종 인증일시와 같은 값이다
  const saved = ["105-22-81934", "박서윤", "2019-05-10"];
  const savedGuide = "대표자 변경 시 새 대표자명으로 재인증해야 합니다.<br>사업자등록번호와 개업일자는 수정할 수 없으며, 인증 실패 시 기존 정보가 유지됩니다.";
  const biz = ui.formGroup(
    f.titleBadge("사업자정보", "on", "인증 완료 · 2025-08-01 14:22"),
    f.bizVerifyBox(A, {
      id: "ebiz-locked",
      row: true,
      values: saved,
      locked: ["num", "ceo", "open"],
      buttons: ui.button("재인증", { variant: "soft", disabled: off, ...f.swapAttr("ebiz-locked", "ebiz-open") }),
    }),
    f.bizVerifyBox(A, {
      id: "ebiz-open",
      row: true,
      values: saved,
      locked: ["num", "open"],
      hidden: true,
      buttons: ui.button("인증하기", { variant: "soft" }) + ui.button("재인증 취소", { variant: "soft", ...f.swapAttr("ebiz-open", "ebiz-locked") }),
      guide: savedGuide,
    }),
    ui.formRow(
      ui.field("상호명", ui.textField({ value: "모리커피 연남", maxlength: 50, placeholder: "50자 이내로 입력해 주세요." })),
      f.group("대표자 연락처", f.tel("010", "5521", "3380")),
    ),
    ui.formRow(
      ui.field("업태", ui.textField({ value: "음식점업", maxlength: 50, placeholder: "50자 이내로 입력해 주세요." })),
      ui.field("종목", ui.textField({ value: "커피전문점", maxlength: 50, placeholder: "50자 이내로 입력해 주세요." })),
    ),
    // 「점포 주소와 같음」이면 점포 주소를 보여 주기만 한다 — 검색칸 · 지우기가 없고 상세주소는 읽기 전용
    address(A, "사업자주소", { zip: "03991", base: "서울 마포구 동교로 256", detail: "1층" }, { labelExtra: ui.checkbox(A, "점포 주소와 같음", true), disabled: true }),
  );

  const floors = ui.formGroup(
    "점포 공간정보",
    f.floorTable([
      ["지상", "1", "18", "59.5", "32"],
      ["지상", "2", "12", "39.7", "20"],
    ]),
  );

  // 폐점 조건을 못 채웠을 때(앱 ConfirmDialog — [취소] [확인])
  const closeBlocked = x.dialog(
    blockedId,
    "폐점할 수 없습니다.",
    `<p>진행 중인 근로계약이 6건 있습니다.</p><p class="mt-[6px] text-erp-label">점포상태를 이전 값으로 되돌렸습니다.</p>`,
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("확인", { "data-close": true }),
  );
  // 조건을 채운 폐점의 저장 확인 — 이 견본에서는 열리지 않는다(위 점포상태 주석)
  const closeSave = x.dialog(
    closeSaveId,
    "폐점으로 저장할까요?",
    "<p>폐점일은 오늘로 정해지고 되돌릴 수 없습니다. 다음 날부터 이 점포에는 BP 휴일이 적용되지 않습니다. 다른 수정 내용도 함께 저장됩니다.</p>",
    ui.button("취소", { variant: "off", "data-close": true }) + ui.button("폐점으로 저장", { href: link(R, "stores/detail-closed.html") }),
  );

  // 취소 · 저장은 제목 줄 오른쪽에 둔다 — 근로계약서 작성 화면과 같은 자리(2026-10-19 점검 — 실사용자 확인).
  // 소속 BP 가 탈퇴 · 미사용이면 제목 줄 위 맨 위에 빨간 띠, 저장은 막는다(앱 store-form-view.tsx 와 같다, 2026-10-28)
  const body = ui.detailBody(
    (blocked ? f.noticeBand(blocked) : "") +
      ui.sectionHead(
        // 제목 꼬리는 「점포코드 · 점포유형」 한 줄(앱과 같다 — 라벨 · 구분선 없음)
        `점포 수정<span class="ml-[10px] text-[14px] font-medium text-erp-label">${code} · ${type}</span>`,
        ui.button("취소", { variant: "off", href: link(R, "stores/detail.html") }) + (off ? ui.button("저장", { disabled: true }) : ui.button("저장", { href: link(R, "stores/detail.html") })),
      ) +
      // 두 묶음은 각자 내용만큼의 높이로 둔다. 높이를 맞추려 늘리면 짧은 쪽 상자에 빈 자리가 남는다.
      `<div class="grid grid-cols-2 items-start gap-[24px]">${basic}${biz}</div>` +
      floors +
      closeBlocked +
      closeSave +
      f.SWAP_SCRIPT,
  );

  return { title: bpStatus ? `점포 수정 · BP ${bpStatus}` : "점포 수정", html: ui.erpFrame({ header: erpHeader(A, R, { bpStatus }), title: "점포 정보 관리", body }) };
};

export default (ctx) => render(ctx);
