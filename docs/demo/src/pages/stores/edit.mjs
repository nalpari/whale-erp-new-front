// 점포 수정. 목업 docs/mockup/stores/edit.html 의 기본 상태(모리커피 연남점 · 인증된 점포 · 이미지 있음)를 BP 마스터로 본 것.
// 배치는 점포 등록 화면에 맞춘다(재영 2026-10-06). 폼은 1팀 FormGroup·FormRow·Field.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as f from "../../biz-form.mjs";
import { STORES, erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const [code, name, type, , , , , , , photo] = STORES.find((s) => s[0] === "ST000006");
  const unmetId = x.dialogId();
  // 재인증 확인 문구는 점포 등록 화면과 같다.
  const reauthText = `<p>지금 인증한 사업자등록번호·대표자명·개업일자가 지워지고 인증 전으로 돌아갑니다.</p>`;

  // 점포유형은 등록 뒤 바꿀 수 없다 — 등록 화면의 큰 선택 카드를 여기 두지 않고, 제목 줄에 점포유형 · 점포코드로만
  // 알린다(2026-10-16 점검).

  // 대표 이미지는 기본정보 맨 아래(등록 화면과 같은 자리).
  const image = f.group(
    "대표 이미지",
    `<div class="flex items-start gap-[18px]">${f.imageBox(`${A}img/${photo}`, `${name} 대표 이미지`)}<div class="flex flex-col items-start gap-[10px]"><div class="flex gap-[6px]">${ui.button("바꾸기", { variant: "soft" })}${ui.button("삭제", { variant: "off" })}</div></div></div>`,
  );

  // 운영 점포는 폐점만 고를 수 있다. 폐점을 고르면 조건을 확인하고, 못 채우면 팝업을 띄운 뒤 이전 값으로 돌린다.
  const status = ui.field(
    "점포상태",
    `<div class="w-[220px]">${ui
      .select(["미운영", "운영 (현재)", "폐점"], { value: "운영 (현재)", onchange: `if(this.value==='폐점'){this.value='운영 (현재)';document.getElementById('${unmetId}').showModal()}` })
      // 상태 세 가지를 모두 보이되, 운영에서 미운영으로는 돌아갈 수 없어 막아 둔다(1팀 select 에 비활성 항목이 없어 여기서 붙인다).
      .replace("<option>미운영</option>", "<option disabled>미운영</option>")}</div>`,
  );

  const basic = ui.formGroup(
    "점포 기본정보",
    status,
    ui.formRow(
      ui.field(f.req("점포명"), ui.textField({ value: name, maxlength: 50, placeholder: "50자 이내로 입력해 주세요." })),
      f.group("점포 연락처", f.tel("02", "322", "1180")),
    ),
    f.address(A, "점포 주소", { zip: "03991", base: "서울 마포구 동교로 256", detail: "1층" }),
    ui.formRow(
      ui.field("위도", ui.textField({ value: "37.562104" }), "w-[130px]"),
      ui.field("경도", ui.textField({ value: "126.925631" }), "w-[130px]"),
      ui.field("출퇴근 위치 적용 여부", ui.select(["사용", "미사용"]), "w-[120px]"),
      `<div class="self-end">${ui.button("주소로 다시 계산", { variant: "soft" })}</div>`,
    ),
    // 이미지 올리기 도움말과 같은 줄간격이 되도록 한 줄(한 <span>) 안에서 <br> 로만 줄을 바꾼다(2026-10-16 점검).
    f.help(
      `점포주소가 입력되면 <b class="font-semibold">위도</b> · <b class="font-semibold">경도</b> 좌표값이 자동으로 표시됩니다.<br>` +
        `<b class="font-semibold">출퇴근 위치 적용 여부</b>를 <b class="font-semibold">사용</b>으로 설정하면 이 좌표를 기준으로 직원의 출퇴근 위치를 확인할 수 있습니다.`,
    ),
    image,
  );

  // 순서는 사업자등록번호 인증 라인 → 상호명 · 대표자 연락처 → 업태 · 종목 → 사업자주소(2026-10-16 점검).
  // 상호명 · 대표자 연락처는 한 줄, 업태 · 종목도 한 줄 — 둘 다 반씩이다(상호명이 점포명과 같은 폭).
  // 사업자주소는 체크박스를 라벨 바로 옆 같은 줄에 둔다.
  const biz = ui.formGroup(
    "사업자정보",
    f.bizAuth(A, "ebiz", { start: "open", inline: true, values: ["105-22-81934", "박서윤", "2019-05-10"], confirmReauth: reauthText }),
    ui.formRow(
      ui.field("상호명", ui.textField({ value: "모리커피 연남", maxlength: 50, placeholder: "50자 이내로 입력해 주세요." })),
      f.group("대표자 연락처", f.tel("010", "5521", "3380")),
    ),
    ui.formRow(
      ui.field("업태", ui.textField({ value: "음식점업", maxlength: 30, placeholder: "30자 이내로 입력해주세요." })),
      ui.field("종목", ui.textField({ value: "커피전문점", maxlength: 30, placeholder: "30자 이내로 입력해주세요." })),
    ),
    f.address(A, "사업자주소", { zip: "03991", base: "서울 마포구 동교로 256", detail: "1층" }, { labelExtra: ui.checkbox(A, "점포 주소와 같음", true) }),
  );

  const floors = ui.formGroup(
    "점포 공간정보",
    f.floorTable([
      ["지상", "1", "18", "59.5", "32"],
      ["지상", "2", "12", "39.7", "20"],
    ]),
  );

  const unmet = x.dialog(
    unmetId,
    "폐점할 수 없습니다",
    `<p>폐점 조건을 채우지 못해 <b class="font-semibold">폐점</b>을 고를 수 없습니다. 점포상태는 이전 상태인 <b class="font-semibold">운영</b>으로 되돌렸습니다.</p>` +
      `<div class="mt-[12px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[16px]"><p class="font-semibold">채우지 못한 조건</p><ul class="mt-[6px] list-disc pl-[18px]"><li>진행 중인 근로계약 <b class="font-semibold">6건</b> — 정리해야 할 근로계약이 있습니다</li></ul><p class="mt-[6px] text-erp-label">이용 중인 부가서비스 구독과 정산 대기 금액은 1차 범위 밖이라 확인하지 않습니다.</p></div>` +
      `<p class="mt-[12px] text-erp-label">조건을 정리한 뒤 다시 폐점을 고르세요. 다른 수정 내용은 그대로 남아 있습니다.</p>`,
    ui.button("확인", { "data-close": true }),
  );

  const body = ui.detailBody(
    ui.sectionHead(
      `점포 수정 <span class="ml-[10px] inline-flex align-middle text-[14px] font-medium text-erp-label">${ui.detailValues([
        `<span class="mr-[10px]">점포코드</span>${code}`,
        `<span class="mr-[10px]">점포유형</span>${type}`,
      ])}</span>`,
    ) +
      // 두 묶음은 각자 내용만큼의 높이로 둔다. 높이를 맞추려 늘리면 짧은 쪽 상자에 빈 자리가 남는다.
      `<div class="grid grid-cols-2 items-start gap-[24px]">${basic}${biz}</div>` +
      floors +
      f.formButtons(ui.button("취소", { variant: "off", href: link(R, "stores/detail.html") }), ui.button("저장", { href: link(R, "stores/detail.html") })) +
      unmet +
      f.SWAP_SCRIPT,
  );

  return { title: "점포 수정", html: ui.erpFrame({ header: erpHeader(A, R), title: "점포 정보 관리", body }) };
};
