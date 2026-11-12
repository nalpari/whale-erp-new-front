// node --test src/app/facilities/facility-form-model.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bodyOf,
  documentFileError,
  DOCUMENT_SIZE_ERROR,
  DOCUMENT_TYPE_ERROR,
  filledCounts,
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
  assert.equal(problems(valid({ salesRepPhone: ["010", "22", ""] }), "create").salesRepPhone, "영업사원 전화번호는 숫자 9~12자리입니다.");
  assert.equal(problems(valid({ serviceCenterPhone: ["0507", "1234", "5678"] }), "create").serviceCenterPhone, undefined);
  assert.equal(problems(valid({ managerPhone: ["1", "", ""] }), "create").managerPhone, "관리 담당자 전화번호는 숫자 9~12자리입니다.");
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
