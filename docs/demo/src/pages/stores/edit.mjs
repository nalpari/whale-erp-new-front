// 점포 수정. 목업 docs/mockup/stores/edit.html 의 기본 상태(모리커피 연남점 · 인증된 점포 · 이미지 있음)를 BP 마스터로 본 것.
// 배치는 점포 등록 화면에 맞춘다(재영 2026-10-06). 폼은 1팀 FormGroup·FormRow·Field.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as f from "../../biz-form.mjs";
import { BP, STORES, erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const [code, name, type, , , , , , , photo] = STORES.find((s) => s[0] === "ST000006");
  const unmetId = x.dialogId();

  // 점포 등록 화면과 같은 배치: 소속 BP → 점포유형 카드 → [기본정보(이미지 포함) | 사업자정보] → 층별.
  const bp = ui.formGroup("소속 BP", `<p class="text-[14px] text-erp-ink">${BP.name} <span class="text-erp-label">${BP.code}</span> — 소속 BP 는 바꿀 수 없습니다.</p>`);

  // 점포유형은 등록 때 정한 값을 같은 카드로 보이되 막아 둔다.
  const typeCards = ui.formGroup(
    "점포유형",
    x.choiceCards(
      "점포유형",
      [
        { label: "직영점포", desc: "직접 운영하는 매장이에요", icon: x.ICON.store, checked: type === "직영점포" },
        { label: "가맹점포", desc: "가맹점주가 운영하는 매장이에요", icon: x.ICON.people, checked: type === "가맹점포" },
      ],
      { locked: true },
    ) + x.iconNote(x.ICON.lock, "등록 후에는 점포 유형을 바꿀 수 없어요"),
  );

  // 대표 이미지는 기본정보 맨 아래(등록 화면과 같은 자리).
  const image = f.group(
    "대표 이미지",
    `<div class="flex items-start gap-[18px]">${f.imageBox(`${A}img/${photo}`, `${name} 대표 이미지`)}<div class="flex flex-col items-start gap-[10px]"><div class="flex gap-[6px]">${ui.button("바꾸기", { variant: "soft" })}${ui.button("삭제", { variant: "off" })}</div>${f.help("JPG · PNG, 5MB 이하 한 장. 점포 목록의 썸네일과 상세에 보입니다. 없으면 점포 아이콘이 대신 섭니다.")}</div></div>`,
  );

  // 운영 점포는 폐점만 고를 수 있다. 폐점을 고르면 조건을 확인하고, 못 채우면 팝업을 띄운 뒤 이전 값으로 돌린다.
  const status = ui.field(
    "점포상태",
    `<div class="w-[220px]">${ui
      .select(["미운영", "운영 (현재)", "폐점"], { value: "운영 (현재)", onchange: `if(this.value==='폐점'){this.value='운영 (현재)';document.getElementById('${unmetId}').showModal()}` })
      // 상태 세 가지를 모두 보이되, 운영에서 미운영으로는 돌아갈 수 없어 막아 둔다(1팀 select 에 비활성 항목이 없어 여기서 붙인다).
      .replace("<option>미운영</option>", "<option disabled>미운영</option>")}</div>` +
      f.help("운영은 미운영으로 되돌릴 수 없어 폐점만 고를 수 있습니다."),
  );

  const basic = ui.formGroup(
    "점포 기본정보",
    status,
    ui.formRow(
      ui.field(f.req("점포명"), ui.textField({ value: name, maxlength: 50 }) + f.help("1~50자 · 같은 BP 안에서 이름이 겹쳐도 됩니다")),
      f.group("점포 연락처", f.tel("02", "322", "1180") + f.help("숫자 9~11자리 · 유선·휴대전화 모두")),
    ),
    f.address(A, "점포 주소", { zip: "03991", base: "서울 마포구 동교로 256", detail: "1층" }),
    ui.formRow(
      ui.field("위도", ui.textField({ value: "37.562104" }), "w-[130px]"),
      ui.field("경도", ui.textField({ value: "126.925631" }), "w-[130px]"),
      ui.field("위치 적용 여부", ui.select(["사용", "미사용"]), "w-[120px]"),
      `<div class="self-end">${ui.button("주소로 다시 계산", { variant: "soft" })}</div>`,
    ),
    f.help("위도·경도는 범위 −90~90 · −180~180, 소수점 6자리까지이고 운영 전환 때 필수입니다. 위치 적용 여부가 미사용이면 직원 출퇴근에서 위치를 보지 않습니다."),
    image,
  );

  const biz = ui.formGroup(
    f.titleBadge("점포 사업자정보", "on", "인증 완료"),
    f.help("국세청 API로 사업자등록번호·대표자명·개업일자의 진위만 확인합니다. 인증 결과는 저장을 눌러야 반영됩니다."),
    f.bizAuth(A, "ebiz", { start: "done", doneBadge: "", values: ["105-22-81934", "박서윤", "2019-05-10"], reauthLocked: true }),
    f.help("사업자등록번호는 점포에서 바꿀 수 없습니다. 번호가 바뀌면 이 점포를 끝내고 새 점포로 등록합니다. 재인증으로는 대표자명만 고칩니다."),
    ui.formRow(
      ui.field("상호명", ui.textField({ value: "모리커피 연남" }) + f.help("재인증해도 바뀌지 않습니다.")),
      f.group("대표자 연락처", f.tel("010", "5521", "3380") + f.help("휴대전화 10~11자리")),
    ),
    f.address(A, "사업자주소", { zip: "03991", base: "서울 마포구 동교로 256", detail: "1층" }, { top: ui.checkbox(A, "점포 주소와 같음", true) }),
    ui.formRow(ui.field("업태", ui.textField({ value: "음식점업", maxlength: 50 })), ui.field("종목", ui.textField({ value: "커피전문점", maxlength: 50 }))),
  );

  const floors = ui.formGroup(
    "기타 정보 · 층별",
    `<div class="flex justify-end">${ui.button("층 추가", { variant: "soft" })}</div>` +
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
    ui.sectionHead(`점포 수정 <span class="text-[14px] font-medium text-erp-label">${name} · ${code}</span>`) +
      bp +
      typeCards +
      // 두 묶음의 흰 상자를 같은 높이로 늘려 끝나는 선을 맞춘다(등록 화면과 같음).
      `<div class="grid grid-cols-2 items-stretch gap-[24px] [&>section]:h-full [&>section>div]:flex-1">${basic}${biz}</div>` +
      floors +
      f.help("저장하면 바뀐 항목마다 변경 전후 값, 변경자, 변경 일시가 변경 이력에 쌓입니다. 변경 사유는 받지 않습니다.") +
      f.formButtons(ui.button("취소", { variant: "off", href: link(R, "stores/detail.html") }), ui.button("저장", { href: link(R, "stores/detail.html") })) +
      unmet +
      f.SWAP_SCRIPT,
  );

  return { title: "점포 수정", html: ui.erpFrame({ header: erpHeader(A, R), title: "점포 정보 관리", body }) };
};
