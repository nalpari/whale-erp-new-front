// node --test src/app/facilities/facility-form-model.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bodyOf,
  documentFileError,
  DOCUMENT_SIZE_ERROR,
  DOCUMENT_TYPE_ERROR,
  filledCounts,
  formOf,
  initialForm,
  phoneText,
  problems,
  splitPhone,
  totalText,
  type FacilityForm,
} from "./facility-form-model.ts";

const valid = (over: Partial<FacilityForm> = {}): FacilityForm => ({
  ...initialForm(),
  storeId: 3,
  name: "EK43S 그라인더",
  groupCode: "STORE_EQUIPMENT",
  categoryCode: "GRINDER",
  ...over,
});

test("처음 값 — 운영 · 점검 주기 빈 값 · 수량 1 · 부가세 포함", () => {
  const f = initialForm();
  assert.equal(f.statusCode, "OPERATING");
  assert.equal(f.inspectionCycleCode, "");
  assert.equal(f.quantity, "1");
  assert.equal(f.isVatIncluded, true);
});

test("필수 칸 — 점포(등록만) · 이름 · 그룹 · 분류", () => {
  const empty = initialForm();
  assert.deepEqual(Object.keys(problems(empty, "create")), ["store", "name", "group", "category"]);
  // 수정은 점포를 바꾸지 않아 점포를 보지 않는다
  assert.deepEqual(Object.keys(problems(empty, "edit")), ["name", "group", "category"]);
  assert.deepEqual(problems(valid(), "create"), {});
  assert.equal(problems(valid({ name: "   " }), "create").name, "시설물/장비명을 입력해 주세요.");
});

test("전화번호 — 비었으면 괜찮고, 이은 번호가 9~12자리가 아니면 칸 이름을 넣은 문구", () => {
  assert.deepEqual(problems(valid({ vendorPhone: ["02", "333", "4444"] }), "create"), {});
  assert.equal(problems(valid({ salesRepresentativePhone: ["010", "22", ""] }), "create").salesRepresentativePhone, "영업사원 전화번호는 숫자 9~12자리입니다.");
  assert.equal(problems(valid({ serviceCenterPhone: ["0507", "1234", "5678"] }), "create").serviceCenterPhone, undefined);
  assert.equal(problems(valid({ managerPhone: ["1", "", ""] }), "create").managerPhone, "관리 담당자 전화번호는 숫자 9~12자리입니다.");
});

test("대표번호(15xx · 16xx · 18xx 8자리) — 구매처 · A/S센터만 받는다", () => {
  for (const p of [["1588", "1234", ""], ["1644", "0000", ""], ["1800", "1234", ""]] as const) {
    assert.equal(problems(valid({ vendorPhone: [...p] }), "create").vendorPhone, undefined);
    assert.equal(problems(valid({ serviceCenterPhone: [...p] }), "create").serviceCenterPhone, undefined);
  }
  // 사람 번호 칸은 8자리를 받지 않는다
  assert.equal(problems(valid({ salesRepresentativePhone: ["1588", "1234", ""] }), "create").salesRepresentativePhone, "영업사원 전화번호는 숫자 9~12자리입니다.");
  assert.equal(problems(valid({ managerPhone: ["1588", "1234", ""] }), "create").managerPhone, "관리 담당자 전화번호는 숫자 9~12자리입니다.");
  // 대표번호 모양이 아닌 8자리 — 끝자리를 빠뜨린 번호 · 1로 시작하지만 대표번호가 아님
  const msg = "A/S센터 전화번호는 숫자 9~12자리 또는 15xx·16xx·18xx 대표번호 8자리입니다.";
  assert.equal(problems(valid({ serviceCenterPhone: ["010", "1234", "5"] }), "create").serviceCenterPhone, msg);
  assert.equal(problems(valid({ serviceCenterPhone: ["1234", "5678", ""] }), "create").serviceCenterPhone, msg);
  assert.equal(problems(valid({ serviceCenterPhone: ["1588", "123", ""] }), "create").serviceCenterPhone, msg);
  // 15 · 16 · 18 바로 옆 접두는 대표번호가 아니다. 9자리 이상은 원래 규칙대로 받는다
  assert.equal(problems(valid({ serviceCenterPhone: ["1700", "1234", ""] }), "create").serviceCenterPhone, msg);
  assert.equal(problems(valid({ serviceCenterPhone: ["1900", "1234", ""] }), "create").serviceCenterPhone, msg);
  assert.equal(problems(valid({ serviceCenterPhone: ["1588", "1234", "5"] }), "create").serviceCenterPhone, undefined);
  // 구매처 칸도 제 이름으로 알린다
  assert.equal(problems(valid({ vendorPhone: ["1234", "5678", ""] }), "create").vendorPhone, "구매처 전화번호는 숫자 9~12자리 또는 15xx·16xx·18xx 대표번호 8자리입니다.");
  // 나누기 · 보이기 — 하이픈이 붙어 와도 같다
  assert.deepEqual(splitPhone("15881234"), ["1588", "1234", ""]);
  assert.deepEqual(splitPhone("1588-1234"), ["1588", "1234", ""]);
  assert.equal(phoneText("15881234"), "1588-1234");
  assert.equal(phoneText("1588-1234"), "1588-1234");
  // 대표번호가 아닌 8자리는 저장될 수 없는 값(api 도 막는다) — 대표번호 나누기(4 · 4 · 빈칸)를 타지 않는지만 본다
  assert.notDeepEqual(splitPhone("12345678"), ["1234", "5678", ""]);
});

test("설치일은 구매일보다 앞설 수 없다 · 같은 날은 된다", () => {
  assert.equal(problems(valid({ purchaseDate: "2025-01-03", installationDate: "2025-01-01" }), "create").installationDate, "설치일은 구매일보다 앞설 수 없습니다.");
  assert.equal(problems(valid({ purchaseDate: "2025-01-03", installationDate: "2025-01-03" }), "create").installationDate, undefined);
  assert.equal(problems(valid({ installationDate: "2025-01-01" }), "create").installationDate, undefined);
});

test("수량은 1 ~ 9,999", () => {
  assert.ok(problems(valid({ quantity: "0" }), "create").quantity);
  assert.ok(problems(valid({ quantity: "" }), "create").quantity);
  assert.equal(problems(valid({ quantity: "9999" }), "create").quantity, undefined);
});

test("전화번호 나누기 — 02 · 휴대폰 · 지역번호 · 050X 평생번호", () => {
  assert.deepEqual(splitPhone("0212345678"), ["02", "1234", "5678"]);
  assert.deepEqual(splitPhone("023334444"), ["02", "333", "4444"]);
  assert.deepEqual(splitPhone("01022223333"), ["010", "2222", "3333"]);
  assert.deepEqual(splitPhone("0517463300"), ["051", "746", "3300"]);
  assert.deepEqual(splitPhone("050712345678"), ["0507", "1234", "5678"]);
  assert.deepEqual(splitPhone(null), ["", "", ""]);
  assert.equal(phoneText("01022223333"), "010-2222-3333");
  assert.equal(phoneText(null), "");
});

test("총금액 — 단가 × 수량, 단가가 없으면 비운다", () => {
  assert.equal(totalText({ unitPrice: "10000000", quantity: "2" }), "20,000,000");
  assert.equal(totalText({ unitPrice: "", quantity: "2" }), "");
});

test("본문 — 빈 칸은 null, 전화번호는 숫자만 이어 붙이고 총금액은 보내지 않는다", () => {
  const body = bodyOf(valid({ vendorPhone: ["02", "333", "4444"], unitPrice: "1000", quantity: "3", memo: "  " }));
  assert.equal(body.vendorPhone, "023334444");
  assert.equal(body.salesRepresentativePhone, null);
  assert.equal(body.unitPriceAmount, 1000);
  assert.equal(body.quantity, 3);
  assert.equal(body.memo, null);
  assert.equal(body.brand, null);
  assert.equal(body.inspectionCycleCode, null);
  assert.ok(!("totalAmount" in body));
  assert.ok(!("storeId" in body));
});

test("본문 — 주소를 고르지 않았으면 상세주소도 보내지 않는다(우편번호 · 기본주소와 함께)", () => {
  const none = bodyOf(valid({ serviceCenter: { zipCode: "", address: "", addressDetail: "1층" } }));
  assert.equal(none.serviceCenterAddressDetail, null);
  const picked = bodyOf(valid({ serviceCenter: { zipCode: "04522", address: "서울 중구 삼봉로 98", addressDetail: " 1층 2호 " } }));
  assert.deepEqual([picked.serviceCenterZipCode, picked.serviceCenterAddress, picked.serviceCenterAddressDetail], ["04522", "서울 중구 삼봉로 98", "1층 2호"]);
});

test("문서 파일 — JPG · PNG · PDF, 10MB 이하", () => {
  assert.equal(documentFileError({ name: "a.pdf", size: 100 }), null);
  assert.equal(documentFileError({ name: "a.JPEG", size: 100 }), null);
  assert.equal(documentFileError({ name: "a.hwp", size: 100 }), DOCUMENT_TYPE_ERROR);
  assert.equal(documentFileError({ name: "a.png", size: 10 * 1024 * 1024 + 1 }), DOCUMENT_SIZE_ERROR);
});

test("입력 n / 전체 — 묶음마다 값이 있는 칸을 센다", () => {
  const c = filledCounts(valid({ brand: "말코닉", vendorPhone: ["02", "333", "4444"] }), { USER_MANUAL: true, PRECAUTION: false, WARRANTY: false });
  assert.deepEqual(c.product, { filled: 1, total: 4 });
  assert.deepEqual(c.purchase, { filled: 1, total: 7 });
  assert.deepEqual(c.documents, { filled: 1, total: 5 });
  // 점검 주기는 처음에 비어 있어 세지 않는다
  assert.deepEqual(c.manage, { filled: 0, total: 6 });
});

test("수정 화면 왕복 — 상세 → 폼 → 본문이 값을 잃지 않는다(0 원 · 가린 담당자 번호 · 점검 주기 없음)", () => {
  const detail = {
    facilityId: 1,
    store: { storeId: 3, storeCode: "ST000003", name: "성수점", isClosed: false },
    name: "제빙기",
    facilityStatusCode: "OPERATING",
    facilityStatusLabel: "운영",
    isFacilityStatusActive: true,
    facilityGroupCode: "STORE_EQUIPMENT",
    facilityGroupLabel: "점포 장비",
    facilityCategoryCode: "ICE_MAKER",
    facilityCategoryLabel: "제빙기",
    isFacilityCategoryActive: true,
    memo: " 첫줄\n둘째 ",
    brand: "호시자키",
    manufacturer: null,
    serialNumber: null,
    installationLocation: null,
    vendorName: null,
    vendorPhone: "023334444",
    salesRepresentativeName: null,
    salesRepresentativePhone: null,
    unitPriceAmount: 0,
    quantity: 2,
    totalAmount: 0,
    isVatIncluded: false,
    purchaseDate: "2025-01-03",
    installationDate: null,
    usageExpiryDate: null,
    warrantyExpiryDate: null,
    manager: { staffMemberId: 9, name: null },
    managerPhone: null,
    isManagerHidden: true,
    inspectionCycleCode: null,
    inspectionCycleLabel: null,
    isInspectionCycleActive: null,
    inspectionNote: null,
    serviceCenterZipCode: "04522",
    serviceCenterAddress: "서울 중구 삼봉로 98",
    serviceCenterAddressDetail: "1층",
    serviceCenterPhone: null,
    documents: [],
    createdAt: "2026-11-11T00:00:00Z",
    createdByName: null,
    updatedAt: "2026-11-11T00:00:00Z",
    updatedByName: null,
  } as unknown as Parameters<typeof formOf>[0];
  const body = bodyOf(formOf(detail));
  assert.equal(body.unitPriceAmount, 0);
  assert.equal(body.vendorPhone, "023334444");
  // 가린 담당자 — 번호는 null 로 보내 서버가 저장된 번호를 지킨다
  assert.equal(body.managerStaffMemberId, 9);
  assert.equal(body.managerPhone, null);
  assert.equal(body.inspectionCycleCode, null);
  assert.equal(body.memo, " 첫줄\n둘째 ");
  assert.equal(body.isVatIncluded, false);
  assert.deepEqual([body.serviceCenterZipCode, body.serviceCenterAddress, body.serviceCenterAddressDetail], ["04522", "서울 중구 삼봉로 98", "1층"]);
  // 대표번호 — 수정 화면에 4 · 4 · 빈칸으로 채우고, 그대로 저장해도 막히지 않고 같은 숫자로 돌아간다
  const rep = formOf({ ...detail, vendorPhone: "15881234", serviceCenterPhone: "16440000" } as unknown as typeof detail);
  assert.deepEqual(rep.vendorPhone, ["1588", "1234", ""]);
  assert.deepEqual(rep.serviceCenterPhone, ["1644", "0000", ""]);
  assert.equal(problems(rep, "edit").vendorPhone, undefined);
  assert.equal(problems(rep, "edit").serviceCenterPhone, undefined);
  assert.deepEqual([bodyOf(rep).vendorPhone, bodyOf(rep).serviceCenterPhone], ["15881234", "16440000"]);
  // 모르는 그룹이면 비우고 검사에 걸린다
  const unknown = formOf({ ...detail, facilityGroupCode: "OTHER" } as unknown as typeof detail);
  assert.equal(unknown.groupCode, "");
  assert.ok(problems(unknown, "edit").group);
});

test("메모 200자 경계 · 빈 문서 파일 · 수량 0 총금액", () => {
  assert.equal(problems(valid({ memo: "가".repeat(200) }), "create").memo, undefined);
  assert.ok(problems(valid({ memo: "가".repeat(201) }), "create").memo);
  assert.ok(documentFileError({ name: "a.pdf", size: 0 }));
  assert.equal(totalText({ unitPrice: "1000", quantity: "0" }), "");
});
