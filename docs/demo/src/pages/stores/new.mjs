// 점포 등록. 목업 docs/mockup/stores/new.html 의 기본 상태(입력 중 · 이미지 없음 · 인증 전)를 BP 마스터로 본 것.
// 목업처럼 목록 옆 패널이 아니라 별도 화면이다(재영 결정). 폼은 1팀 FormGroup·FormRow·Field.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as f from "../../biz-form.mjs";
import { BP, erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const reauthText = `<p>지금 인증한 사업자등록번호·대표자명·개업일자가 지워지고 인증 전으로 돌아갑니다.</p>`;

  const bp = ui.formGroup("소속 BP", `<p class="text-[14px] text-erp-ink">${BP.name} <span class="text-erp-label">${BP.code}</span></p>`);

  // 대표 이미지는 기본정보 맨 아래에 둬 오른쪽 사업자정보 묶음과 높이를 맞춘다.
  const image = f.group(
    "대표 이미지",
    `<div class="flex items-start gap-[18px]">${f.imageBox()}<div class="flex flex-col items-start gap-[10px]">${ui.button("이미지 올리기", { variant: "soft" })}</div></div>`,
  );

  // 점포유형은 기본정보에서 빼서 큰 선택 카드로 따로 고른다(등록 후 바꿀 수 없어 맨 앞에서 정하게).
  const type = ui.formGroup(
    f.req("점포유형"),
    x.choiceCards("점포유형", [
      { label: "직영점포", desc: "직접 운영하는 매장이에요", icon: x.ICON.store, checked: true },
      { label: "가맹점포", desc: "가맹점주가 운영하는 매장이에요", icon: x.ICON.people },
    ]),
  );

  // 점포상태는 수정 화면과 같은 자리에 두되 고를 수 없다 — 새 점포는 미운영으로만 생기고,
  // 운영으로 바꾸는 것은 등록을 마친 뒤 수정 화면에서 한다(사업자 인증·좌표가 있어야 한다).
  const status = ui.field("점포상태", `<div class="flex h-[34px] items-center">${ui.badge("off", "미운영")}</div>`);

  const basic = ui.formGroup(
    "점포 기본정보",
    status,
    ui.formRow(
      ui.field(f.req("점포명"), ui.textField({ value: "모리커피 망원점", maxlength: 50 })),
      f.group("점포 연락처", f.tel("02", "332", "4410")),
    ),
    f.address(A, "점포 주소", { zip: "04007", base: "서울 마포구 망원로 42", detail: "1층 101호" }),
    ui.formRow(
      // 좌표는 정수 3자리 + 소수 6자리, 위치 적용 여부는 「미사용」 세 글자가 들어갈 만큼만.
      ui.field("위도", ui.textField({ value: "37.556312" }), "w-[130px]"),
      ui.field("경도", ui.textField({ value: "126.901845" }), "w-[130px]"),
      ui.field("위치 적용 여부", ui.select(["사용", "미사용"]), "w-[120px]"),
    ),
    image,
  );

  const floors = ui.formGroup("기타 정보 · 층별", f.floorTable([undefined]));

  const biz = ui.formGroup(
    "점포 사업자정보",
    f.bizAuth(A, "sbiz", { start: "open", inline: true, values: ["113-25-60418", "한지우", "2026-08-03"], confirmReauth: reauthText }),
    ui.formRow(
      ui.field("상호명", ui.textField({ value: "모리커피 망원" })),
      f.group("대표자 연락처", f.tel()),
    ),
    f.address(A, "사업자주소", { zip: "04007", base: "서울 마포구 망원로 42", detail: "1층 101호" }, { top: ui.checkbox(A, "점포 주소와 같음", true) }),
    ui.formRow(ui.field("업태", ui.textField({ value: "음식점업", maxlength: 50 })), ui.field("종목", ui.textField({ value: "커피전문점", maxlength: 50 }))),
  );

  const body = ui.detailBody(
    ui.sectionHead("점포 등록") +
      bp +
      type +
      // 두 묶음은 각자 내용만큼의 높이로 둔다. 높이를 맞추려 늘리면 짧은 쪽 상자에 빈 자리가 남는다.
      `<div class="grid grid-cols-2 items-start gap-[24px]">${basic}${biz}</div>` +
      floors +
      f.formButtons(ui.button("취소", { variant: "off", href: link(R, "stores/index.html") }), ui.button("저장", { href: link(R, "stores/detail.html") })) +
      f.SWAP_SCRIPT,
  );
  return { title: "점포 등록", html: ui.erpFrame({ header: erpHeader(A, R), title: "점포 정보 관리", body }) };
};
