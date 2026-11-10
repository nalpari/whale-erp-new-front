// 시설물 및 장비 등록. 목업 docs/mockup/stores/facilities-new.html 의 「입력 중」 상태를 BP 마스터로 본 것(1.5차, 앱 화면 없음).
// 점포 등록(stores/new.mjs)처럼 별도 화면 — 취소 · 저장은 묶음 제목 줄 오른쪽, 아래 두 묶음(기본 정보 · 관리 정보)을 반씩.
// render 의 mode "edit" 는 수정 화면(facilities-edit.mjs) — 점포는 읽기 전용이다. 관리 정보는 따로 지우지 않고 칸을 비워 저장한다(PL-4).
// 근거: 「시설물·장비 관리 정책서」 PL-1 ~ PL-6. 입력 규칙은 점포 등록 화면과 같다 — [저장]을 누르면 걸린 칸 바로 아래 빨간 문구(알럿 없음).
import * as ui from "../../ui.mjs";
import * as x from "../../extra.mjs";
import * as f from "../../biz-form.mjs";
import { row } from "../../config-parts.mjs";
import { erpHeader, link } from "../../site.mjs";
import { address } from "../../store-parts.mjs";
import { CYCLES, GROUP_SCRIPT, STATUSES, amount, attachment, classSelect, groupSelect, note, storePick } from "../../facility-parts.mjs";

// errors 를 켜면 [저장]을 눌러 검사에 걸린 견본이다(facilities-new-error.mjs) — 걸린 칸 바로 아래 빨간 문구, 알럿 없음(PL-5)
const ERR = (t) => `<p role="alert" class="text-[13px] leading-[1.5] text-erp-off">${t}</p>`;

export const render = ({ A, R }, { mode = "create", errors = false } = {}) => {
  const edit = mode === "edit";

  // 점포 — 등록은 점포명 · 점포코드 자동완성으로 하나(폐점 점포 제외), 수정은 바꿀 수 없어 읽기 전용(PL-1)
  const store = edit
    ? f.group("점포", ui.textField({ value: "모리커피 성수점", readonly: true, "aria-label": "점포" }) + note("등록한 뒤에는 점포를 바꿀 수 없습니다."))
    : f.group(f.req("점포"), storePick(A, "모리커피 성수점"));

  const basic = ui.formGroup(
    "기본 정보",
    store,
    ui.field(f.req("시설물/장비명"), ui.textField({ value: "EK43S 전자동 원두 커피 그라인더", maxlength: 100 })),
    // 운영상태 — 공통코드 「시설물 운영상태」, 처음 값 운영(PL-2)
    f.group(f.req("운영상태"), `<div role="radiogroup" aria-label="운영상태" class="flex h-[34px] items-center gap-[18px]">${STATUSES.map((s) => ui.radio(s, "facState", s === "운영")).join("")}</div>`),
    // 그룹 · 분류 — 그룹을 골라야 분류가 나오고, 그룹을 바꾸면 분류를 지운다(PL-3). 수정 화면의 미사용 분류는 지금 값으로 남는다
    row(
      f.group(f.req("그룹"), groupSelect("fac-form-class", { first: "선택", value: "점포 장비" })),
      f.group(
        f.req("분류"),
        edit
          ? ui.select(["선택", "그라인더 (미사용)", "커피머신", "제빙기"], { value: "그라인더 (미사용)", id: "fac-form-class", "aria-label": "분류", "data-first": "선택" }) +
              note("미사용으로 바뀐 분류입니다. 다른 분류로 바꾸면 다시 고를 수 없습니다.")
          : classSelect("fac-form-class", { first: "선택", group: "점포 장비", value: "그라인더" }),
      ),
    ),
    ui.formRow(ui.field("브랜드", ui.textField({ value: "말코닉" })), ui.field("제조사", ui.textField({ value: "말코닉" }))),
    ui.formRow(ui.field("Serial number", ui.textField({ value: "SN1234567" })), ui.field("설치 위치", ui.textField({ value: "주방" }))),
    // 전화번호는 세 칸, 칸마다 숫자 4자리까지 — 이은 번호가 9~12자리가 아니면 칸 아래 빨간 문구(PL-5)
    ui.formRow(ui.field("구매처", ui.textField({ value: "다온컴퍼니" })), f.group("구매처 전화번호", f.tel("02", "333", "4444"))),
    // 오류 문구가 붙은 줄은 칸을 위로 맞춘다(config-parts row) — 가운데 맞춤이면 옆 칸 라벨이 내려간다
    row(
      ui.field("영업사원", ui.textField({ value: "홍길동" })),
      f.group(
        "영업사원 전화번호",
        errors ? f.tel("010", "22", "").replaceAll('maxlength="4"', 'maxlength="4" aria-invalid="true"') + ERR("영업사원 전화번호는 숫자 9~12자리입니다.") : f.tel("010", "2222", "3333"),
      ),
    ),
    // 구매액 — 숫자만 10자리 · 쉼표, 「부가세 포함」 처음 켜짐(PL-5)
    `<div class="flex flex-col gap-[8px]"><span class="flex items-center gap-[18px] text-[14px] font-medium text-erp-label">구매액${x.toggle("부가세 포함", true)}</span>${amount("20,000,000")}</div>`,
    // 설치일은 구매일보다 앞설 수 없다(PL-5)
    row(
      f.group("구매일", ui.dateField(A, { label: "구매일", value: "2025-01-03" })),
      f.group("설치일", errors ? ui.dateField(A, { label: "설치일", value: "2025-01-01" }) + ERR("설치일은 구매일보다 앞설 수 없습니다.") : ui.dateField(A, { label: "설치일", value: "2025-01-05" })),
    ),
  );

  const manage = ui.formGroup(
    "관리 정보",
    ui.formRow(
      f.group("사용 유효기한", ui.dateField(A, { label: "사용 유효기한", value: "2030-01-01" })),
      f.group("품질 보증기한", ui.dateField(A, { label: "품질 보증기한", value: "2027-01-01" })),
    ),
    // 문서 3종 — 공통 첨부 칸, 종류마다 1개(PL-5). 맞지 않는 파일은 목록 아래 「└ 까닭」
    attachment("사용 매뉴얼", [["EK43S_사용매뉴얼.pdf", "1.8MB"]]),
    // 맞지 않는 파일(형식 · 크기)은 입력 오류 견본에서 보인다 — 고를 때 바로 빼고 목록 아래 까닭
    attachment(
      "주의사항",
      edit ? [["사용주의사항.pdf", "320KB"]] : [],
      errors ? [["사용주의사항_원본.hwp", "JPG, PNG, PDF 파일만 첨부할 수 있습니다."], ["주의사항_스캔본.pdf", "10MB 이하 파일만 첨부할 수 있습니다."]] : [],
    ),
    attachment("제품 보증서", [["제품보증서.png", "640KB", true]]),
    // 관리 담당자 — 그 점포의 재직 직원, 고르면 전화번호 세 칸을 휴대폰 번호로 채운다(PL-6)
    ui.formRow(
      f.group("관리 담당자", ui.select(["선택", "서지안", "오세라", "김도윤"], { value: "서지안", "aria-label": "관리 담당자" })),
      f.group("관리 담당자 전화번호", f.tel("010", "2323", "2323")),
    ),
    // 점검 주기 — 공통코드 「시설물 점검 주기」, 처음 값 매일(PL-6)
    ui.formRow(
      f.group("점검 주기", ui.select(CYCLES, { value: "매월", "aria-label": "점검 주기" })),
      ui.field("점검 비고", ui.textField({ value: "매달 정기휴일에 점검" })),
    ),
    // A/S센터 — 공통 주소 칸(점포 주소와 같다): 검색 → 우편번호 · 기본주소, 상세주소 100자, [지우기](PL-5)
    address(A, "A/S센터 주소", { zip: "04522", base: "서울 중구 삼봉로 98", detail: "1층 2호" }),
    f.group("A/S센터 전화번호", f.tel("02", "2222", "8888")),
  );

  const save = ui.button("저장", { href: link(R, "stores/facilities-detail.html") });
  const cancel = ui.button("취소", { variant: "off", href: link(R, edit ? "stores/facilities-detail.html" : "stores/facilities.html") });

  const body = ui.detailBody(
    ui.sectionHead(edit ? "시설물 · 장비 수정" : "시설물 · 장비 등록", cancel + save) +
      `<div class="grid grid-cols-2 items-start gap-[24px]">${basic}${manage}</div>` +
      GROUP_SCRIPT,
  );
  return {
    title: edit ? "시설물 및 장비 수정" : "시설물 및 장비 등록",
    html: ui.erpFrame({ header: erpHeader(A, R), title: "시설물 및 장비 관리", body }),
  };
};

export default (ctx) => render(ctx);
