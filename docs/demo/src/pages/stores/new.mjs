// 점포 등록. 목업 docs/mockup/stores/new.html 의 기본 상태(입력 중 · 이미지 없음 · 인증 전)를 BP 마스터로 본 것.
// 목업처럼 목록 옆 패널이 아니라 별도 화면이다(재영 결정). 폼은 1팀 FormGroup·FormRow·Field.
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as f from "../../biz-form.mjs";
import { BP, erpHeader, link } from "../../site.mjs";

export default ({ A, R }) => {
  const reauthText = `<p>지금 인증한 사업자등록번호·대표자명·개업일자가 지워지고 인증 전으로 돌아갑니다.</p>`;

  const bp = ui.formGroup("소속 BP", `<p class="text-[14px] text-erp-ink">${BP.name} <span class="text-erp-label">${BP.code}</span> — 로그인한 계정의 소속 BP 로 고정됩니다.</p>`);

  // 대표 이미지는 기본정보 맨 아래에 둬 오른쪽 사업자정보 묶음과 높이를 맞춘다.
  const image = f.group(
    "대표 이미지",
    `<div class="flex items-start gap-[18px]">${f.imageBox()}<div class="flex flex-col items-start gap-[10px]">${ui.button("이미지 올리기", { variant: "soft" })}${f.help("JPG · PNG, 5MB 이하 한 장. 점포 목록의 썸네일과 상세에 보입니다. 없으면 점포 아이콘이 대신 섭니다.")}</div></div>`,
  );

  // 점포유형은 기본정보에서 빼서 큰 선택 카드로 따로 고른다(등록 후 바꿀 수 없어 맨 앞에서 정하게).
  const type = ui.formGroup(
    f.req("점포유형"),
    x.choiceCards("점포유형", [
      { label: "직영점포", desc: "직접 운영하는 매장이에요", icon: x.ICON.store, checked: true },
      { label: "가맹점포", desc: "가맹점주가 운영하는 매장이에요", icon: x.ICON.people },
    ]) + x.iconNote(x.ICON.lock, "등록 후에는 점포 유형을 바꿀 수 없어요"),
  );

  const basic = ui.formGroup(
    "점포 기본정보",
    ui.formRow(
      ui.field(f.req("점포명"), ui.textField({ value: "모리커피 망원점", maxlength: 50 }) + f.help("1~50자 · 같은 BP 안에서 이름이 겹쳐도 됩니다")),
      f.group("점포 연락처", f.tel("02", "332", "4410") + f.help("숫자 9~11자리 · 유선·휴대전화 모두")),
    ),
    f.address(A, "점포 주소", { zip: "04007", base: "서울 마포구 망원로 42", detail: "1층 101호" }),
    ui.formRow(
      // 좌표는 정수 3자리 + 소수 6자리, 위치 적용 여부는 「미사용」 세 글자가 들어갈 만큼만.
      ui.field("위도", ui.textField({ value: "37.556312" }), "w-[130px]"),
      ui.field("경도", ui.textField({ value: "126.901845" }), "w-[130px]"),
      ui.field("위치 적용 여부", ui.select(["사용", "미사용"]), "w-[120px]"),
    ),
    // 안내는 줄 아래로 모아 세 칸의 높이를 맞춘다.
    f.help("위도·경도는 고른 주소로 자동으로 채워집니다. 직접 고쳐도 되고, 주소를 다시 고르면 다시 계산한 값으로 바뀝니다. 위치 적용 여부가 사용이면 직원 출퇴근을 위도·경도 기준으로 허용 여부를 판정합니다 · 기본 사용"),
    image,
  );

  const floors = ui.formGroup(
    "기타 정보 · 층별",
    `<div class="flex justify-end">${ui.button("층 추가", { variant: "soft" })}</div>` + f.floorTable([undefined]),
  );

  const biz = ui.formGroup(
    "점포 사업자정보",
    f.help("국세청 API로 사업자등록번호·대표자명·개업일자의 진위만 확인합니다. 인증하지 않아도 점포를 등록할 수 있고, 운영으로 바꿀 때 인증이 필요합니다."),
    f.bizAuth(A, "sbiz", { start: "open", inline: true, values: ["113-25-60418", "한지우", "2026-08-03"], confirmReauth: reauthText }),
    ui.formRow(
      ui.field("상호명", ui.textField({ value: "모리커피 망원" }) + f.help("진위확인이 상호명을 돌려주지 않아 직접 입력합니다.")),
      f.group("대표자 연락처", f.tel() + f.help("휴대전화 10~11자리")),
    ),
    f.address(A, "사업자주소", { zip: "04007", base: "서울 마포구 망원로 42", detail: "1층 101호" }, { top: ui.checkbox(A, "점포 주소와 같음", true) }),
    ui.formRow(ui.field("업태", ui.textField({ value: "음식점업", maxlength: 50 })), ui.field("종목", ui.textField({ value: "커피전문점", maxlength: 50 }))),
  );

  const body = ui.detailBody(
    ui.sectionHead("점포 등록") +
      bp +
      type +
      // 두 묶음의 흰 상자를 같은 높이로 늘려 끝나는 선을 맞춘다(공통 formGroup 은 그대로 두고 감싸는 쪽에서).
      `<div class="grid grid-cols-2 items-stretch gap-[24px] [&>section]:h-full [&>section>div]:flex-1">${basic}${biz}</div>` +
      floors +
      f.formButtons(ui.button("취소", { variant: "off", href: link(R, "stores/index.html") }), ui.button("등록", { href: link(R, "stores/detail.html") })) +
      f.SWAP_SCRIPT,
  );
  return { title: "점포 등록", html: ui.erpFrame({ header: erpHeader(A, R), title: "점포 정보 관리", body }) };
};
