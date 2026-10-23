// node --test src/lib/store-form.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EMPTY_STORE_FORM,
  formOfStore,
  hasCoordinateInput,
  newFloorRow,
  splitPhone,
  storeServerErrorField,
  storeServerErrors,
  toCreateStoreInput,
  toUpdateStoreInput,
  validateStoreForm,
  verificationErrors,
  type StoreForm,
} from "./store-form.ts";
import type { StoreDetail } from "./store-types.ts";
import { formatPhone } from "./format.ts";

const filled: StoreForm = { ...EMPTY_STORE_FORM, storeTypeCode: "DIRECT", name: " 강남점 " };
// 운영 조건 한글(GET /enums/StoreOperationRequirement) — 라벨 없이 부르면(빈 배열) 값 코드를 그대로 보인다
const REQUIREMENT_LABELS = [
  { value: "BUSINESS_VERIFICATION", label: "사업자정보 인증", order: 1 },
  { value: "COORDINATES", label: "위치정보(위도 · 경도)", order: 2 },
];

test("필수는 점포유형(등록) · 점포명뿐이다", () => {
  assert.deepEqual(validateStoreForm(filled, "create"), {});
  const empty = validateStoreForm(EMPTY_STORE_FORM, "create");
  assert.equal(empty.storeTypeCode, "점포유형을 골라 주세요.");
  assert.equal(empty.name, "점포명을 입력해 주세요.");
  assert.equal(validateStoreForm({ ...filled, storeTypeCode: "" }, "edit").storeTypeCode, undefined);
  assert.ok(validateStoreForm({ ...filled, name: "가".repeat(51) }, "create").name);
});

test("점포 연락처 9~12자리 · 대표자 연락처는 숫자 10~11자리(api 와 같게 유선 번호도 받는다)", () => {
  assert.equal(validateStoreForm({ ...filled, phone: ["02", "123", "4567"] }, "create").phone, undefined);
  assert.ok(validateStoreForm({ ...filled, phone: ["02", "12", "34"] }, "create").phone);
  assert.equal(validateStoreForm({ ...filled, ceoPhone: ["010", "1234", "5678"] }, "create").ceoPhone, undefined);
  assert.equal(validateStoreForm({ ...filled, ceoPhone: ["02", "1234", "5678"] }, "create").ceoPhone, undefined);
  assert.ok(validateStoreForm({ ...filled, ceoPhone: ["02", "123", "4567"] }, "create").ceoPhone);
});

test("위도 · 경도는 범위 · 소수 6자리 · 함께", () => {
  assert.deepEqual(validateStoreForm({ ...filled, latitude: "37.500025", longitude: "127.036508" }, "create"), {});
  assert.ok(validateStoreForm({ ...filled, latitude: "91", longitude: "127" }, "create").latitude);
  assert.ok(validateStoreForm({ ...filled, latitude: "37.1234567", longitude: "127" }, "create").latitude);
  assert.ok(validateStoreForm({ ...filled, latitude: "37.5", longitude: "" }, "create").longitude);
});

test("층별 칸 — 층수 정수 · 평 소수 1자리 · ㎡ 소수 2자리 · 좌석 정수", () => {
  const row = { key: "a", floorTypeCode: "GROUND" as const, floorNumber: "1", floorAreaPyeong: "30.5", floorAreaSqm: "100.25", seatCount: "40" };
  assert.equal(validateStoreForm({ ...filled, floors: [row] }, "create").floors, undefined);
  assert.ok(validateStoreForm({ ...filled, floors: [{ ...row, floorAreaPyeong: "30.55" }] }, "create").floors);
  assert.ok(validateStoreForm({ ...filled, floors: [{ ...row, floorNumber: "0" }] }, "create").floors);
});

test("운영으로 바꾸려면 사업자 인증과 좌표가 있어야 한다 — 모자란 것을 한 문장에 모은다(상태 변경 팝업과 같은 라벨 출처)", () => {
  const operating = { ...filled, storeStatus: "OPERATING" as const };
  assert.equal(validateStoreForm(operating, "edit", REQUIREMENT_LABELS).storeStatus, "운영으로 바꾸려면 사업자정보 인증 · 위치정보(위도 · 경도)가 필요합니다.");
  assert.equal(validateStoreForm({ ...operating, savedBizNumber: "1234567890" }, "edit", REQUIREMENT_LABELS).storeStatus, "운영으로 바꾸려면 위치정보(위도 · 경도)가 필요합니다.");
  assert.deepEqual(validateStoreForm({ ...operating, savedBizNumber: "1234567890", latitude: "37.5", longitude: "127.0" }, "edit", REQUIREMENT_LABELS), {});
  // 라벨을 못 받으면(빈 배열) 값 코드를 그대로 보인다 — naming.md "모르는 값이면 값을 그대로"
  assert.equal(validateStoreForm(operating, "edit").storeStatus, "운영으로 바꾸려면 BUSINESS_VERIFICATION · COORDINATES이(가) 필요합니다.");
});

test("진위확인 칸 — 처음은 세 칸, 재인증은 대표자명만", () => {
  assert.deepEqual(Object.keys(verificationErrors({ savedBizNumber: "", bizNumber: "", ceoName: "", openDate: "" })).sort(), ["bizNumber", "ceoName", "openDate"]);
  assert.deepEqual(verificationErrors({ savedBizNumber: "", bizNumber: "123-45-67890", ceoName: "홍길동", openDate: "2020-01-02" }), {});
  assert.deepEqual(Object.keys(verificationErrors({ savedBizNumber: "1234567890", bizNumber: "", ceoName: "", openDate: "" })), ["ceoName"]);
});

test("진위확인 칸을 고치고 인증하지 않으면 저장 전에 막는다 — 그대로 두면 성공 뒤 값이 원래대로 돌아간다", () => {
  // 어느 한 칸의 것이 아니라 인증 상자의 버튼 위 한 줄(bizVerify)이다(S-VRNTHD)
  const ask = "인증하기를 눌러 사업자정보를 확인해 주세요.";
  const NOW = 1_000_000;
  // 등록: 세 칸 중 하나라도 적었는데 인증 전
  assert.equal(validateStoreForm({ ...filled, ceoName: "홍길동" }, "create", [], NOW).bizVerify, ask);
  const checked = { bizNumber: "1234567890", ceoName: "홍길동", openDate: "2020-01-02", verifiedAt: NOW };
  const done = { ...filled, bizNumber: "123-45-67890", ceoName: "홍길동", openDate: "2020-01-02", verified: checked };
  assert.equal(validateStoreForm(done, "create", [], NOW).bizVerify, undefined);
  // 인증 뒤 대표자명을 고치면 다시 막는다
  assert.equal(validateStoreForm({ ...done, ceoName: "김철수" }, "create", [], NOW).bizVerify, ask);
  // 수정: 저장된 번호가 있으면 대표자명만 본다
  const saved = { ...filled, savedBizNumber: "1234567890", savedCeoName: "홍길동", bizNumber: "1234567890", ceoName: "홍길동", openDate: "2020-01-02" };
  assert.deepEqual(validateStoreForm(saved, "edit", [], NOW), {});
  assert.equal(validateStoreForm({ ...saved, ceoName: "김철수" }, "edit", [], NOW).bizVerify, ask);
  assert.equal(validateStoreForm({ ...saved, ceoName: "김철수", verified: { ...checked, ceoName: "김철수" } }, "edit", [], NOW).bizVerify, undefined);
});

test("인증하고 10분이 지나면 저장하지 않고 다시 인증하게 한다", () => {
  const checked = { bizNumber: "1234567890", ceoName: "홍길동", openDate: "2020-01-02", verifiedAt: 0 };
  const done = { ...filled, bizNumber: "1234567890", ceoName: "홍길동", openDate: "2020-01-02", verified: checked };
  assert.equal(validateStoreForm(done, "create", [], 599_999).bizVerify, undefined);
  assert.equal(validateStoreForm(done, "create", [], 600_000).bizVerify, "사업자정보 인증이 만료되었습니다. 다시 인증해 주세요.");
});

test("인증 결과는 지금 칸 값과 같을 때만 인증으로 본다 — 늦게 온 응답이 옛 값을 넣어도 운영 조건을 통과하지 않는다", () => {
  const operating = { ...filled, storeStatus: "OPERATING" as const, latitude: "37.5", longitude: "127.0" };
  const checked = { bizNumber: "1234567890", ceoName: "홍길동", openDate: "2020-01-02", verifiedAt: Date.now() };
  const now = { ...operating, bizNumber: "1234567890", ceoName: "홍길동", openDate: "2020-01-02", verified: checked };
  assert.equal(validateStoreForm(now, "edit", REQUIREMENT_LABELS).storeStatus, undefined);
  assert.equal(validateStoreForm({ ...now, ceoName: "김철수" }, "edit", REQUIREMENT_LABELS).storeStatus, "운영으로 바꾸려면 사업자정보 인증이 필요합니다.");
});

test("등록 요청 — 공백을 빼고 빈 칸은 null, 빈 층은 보내지 않고, 진위확인을 통과한 값만 싣는다", () => {
  const input = toCreateStoreInput(
    {
      ...filled,
      phone: ["02", "123", "4567"],
      latitude: "37.5",
      longitude: "127",
      tradeName: " 웨일커피 ",
      floors: [
        { key: "a", floorTypeCode: "BASEMENT", floorNumber: "1", floorAreaPyeong: "", floorAreaSqm: "", seatCount: "10" },
        { key: "b", floorTypeCode: "GROUND", floorNumber: "", floorAreaPyeong: "", floorAreaSqm: "", seatCount: "" },
      ],
    },
    7,
  );
  assert.equal(input.name, "강남점");
  assert.equal(input.bpCodeId, 7);
  assert.equal(input.phone, "021234567");
  assert.equal(input.latitude, 37.5);
  assert.equal(input.isLocationApplied, false); // 새 점포 기본값(EMPTY_STORE_FORM)
  assert.equal(input.address, null);
  assert.equal(input.business.tradeName, "웨일커피");
  assert.deepEqual(input.floors, [{ floorTypeCode: "BASEMENT", floorNumber: 1, floorAreaPyeong: null, floorAreaSqm: null, seatCount: 10 }]);
  assert.equal(input.businessVerification, undefined);
  const checked = { bizNumber: "1234567890", ceoName: "홍길동", openDate: "2020-01-02", verifiedAt: Date.now() };
  const verified = toCreateStoreInput({ ...filled, bizNumber: "123-45-67890", ceoName: " 홍길동 ", openDate: "2020-01-02", verified: checked });
  assert.deepEqual(verified.businessVerification, { bizRegistrationNumber: "1234567890", ceoName: "홍길동", openDate: "2020-01-02" });
  // 인증 뒤(또는 늦게 온 응답 사이) 칸을 고쳤으면 옛 인증 값은 싣지 않는다
  const edited = toCreateStoreInput({ ...filled, bizNumber: "1234567890", ceoName: "김철수", openDate: "2020-01-02", verified: checked });
  assert.equal(edited.businessVerification, undefined);
  assert.equal("bpCodeId" in toCreateStoreInput(filled), false);
  assert.equal(toCreateStoreInput(filled, 8).bpCodeId, 8);
});

test("좌표 없이는 사용을 보내지 않는다 — 어느 칸을 거쳐 왔든 저장 직전에 막는다(bodyOf)", () => {
  assert.equal(toCreateStoreInput({ ...filled, isLocationApplied: true, latitude: "", longitude: "" }).isLocationApplied, false);
  assert.equal(toCreateStoreInput({ ...filled, isLocationApplied: true, latitude: "37.5", longitude: "" }).isLocationApplied, false);
  assert.equal(toCreateStoreInput({ ...filled, isLocationApplied: true, latitude: "37.5", longitude: "127" }).isLocationApplied, true);
});

test("좌표 입력칸 둘 다 있어야 있다고 본다 — bodyOf · 선택칸 표시값이 같은 규칙을 쓴다", () => {
  assert.equal(hasCoordinateInput("37.5", "127"), true);
  assert.equal(hasCoordinateInput("", "127"), false);
  assert.equal(hasCoordinateInput("37.5", ""), false);
  assert.equal(hasCoordinateInput("  ", "  "), false);
});

test("사업자주소가 「점포 주소와 같음」이면 점포 주소를 싣는다", () => {
  const f = { ...filled, zipCode: "06236", address: "서울 강남구 테헤란로 152", addressDetail: "1층", bizAddress: "다른 곳" };
  assert.equal(toCreateStoreInput(f).business.address, "서울 강남구 테헤란로 152");
  assert.equal(toCreateStoreInput({ ...f, bizSameAsStore: false }).business.address, "다른 곳");
});

const detail: StoreDetail = {
  storeId: 12,
  storeCode: "ST000012",
  name: "강남점",
  storeTypeCode: "FRANCHISE",
  storeStatusCode: "OPERATING",
  closedDate: null,
  bpCodeId: 3,
  bpCode: "BP000003",
  bpTradeName: "웨일커피",
  bpAccountStatusCode: "ACTIVE",
  phone: "0212345678",
  zipCode: "06236",
  address: "서울 강남구 테헤란로 152",
  addressDetail: "1층",
  latitude: 37.500025,
  longitude: 127.036508,
  isLocationApplied: false,
  staffCount: 4,
  business: {
    isVerified: true,
    bizRegistrationNumber: "1234567890",
    ceoName: "홍길동",
    openDate: "2020-01-02",
    verifiedAt: "2026-10-01T00:00:00.000Z",
    tradeName: "웨일커피 강남",
    ceoPhone: "01012345678",
    zipCode: "06236",
    address: "서울 강남구 테헤란로 152",
    addressDetail: "1층",
    category: "음식점업",
    item: "커피",
  },
  image: null,
  floors: [{ storeFloorId: 5, floorTypeCode: "GROUND", floorNumber: 1, floorAreaPyeong: 30.5, floorAreaSqm: 100.83, seatCount: 40 }],
  transitions: { missingForOperation: [], inProgressContractCount: 0, canClose: true, canDelete: false, isSubscriptionChecked: false },
  createdAt: "2026-10-01T00:00:00.000Z",
  createdByName: "김마스터",
  updatedAt: "2026-10-02T00:00:00.000Z",
  updatedByName: null,
};

test("상세 → 수정 칸 → 수정 요청 왕복 — 아무것도 안 고치면 값이 그대로다", () => {
  const form = formOfStore(detail);
  assert.deepEqual(form.phone, ["02", "1234", "5678"]);
  assert.equal(form.bizSameAsStore, true);
  assert.equal(form.savedBizNumber, "1234567890");
  assert.deepEqual(validateStoreForm(form, "edit"), {});
  const input = toUpdateStoreInput(form, detail.updatedAt);
  assert.equal(input.phone, "0212345678");
  assert.equal(input.latitude, 37.500025);
  assert.equal(input.isLocationApplied, false);
  assert.equal(input.storeStatus, "OPERATING");
  assert.equal(input.updatedAt, detail.updatedAt);
  assert.equal(input.business.category, "음식점업");
  assert.deepEqual(input.floors, [{ floorTypeCode: "GROUND", floorNumber: 1, floorAreaPyeong: 30.5, floorAreaSqm: 100.83, seatCount: 40 }]);
  assert.equal(input.businessVerification, undefined);
});

test("좌표 없이 사용으로 저장된 옛 데이터는 수정 칸을 열 때 미사용으로 바로잡는다 — 주소가 아니라 좌표로 가린다", () => {
  const noCoords: StoreDetail = { ...detail, latitude: null, longitude: null, isLocationApplied: true };
  assert.equal(formOfStore(noCoords).isLocationApplied, false);
  assert.equal(formOfStore({ ...detail, isLocationApplied: true }).isLocationApplied, true);
  // 주소 없이 좌표만 손으로 적은 점포는 주소 기준이면 잘못 막혔을 것 — 좌표가 있으면 그대로 둔다
  const coordsNoAddress: StoreDetail = { ...detail, address: null, zipCode: null, addressDetail: null, isLocationApplied: true };
  assert.equal(formOfStore(coordsNoAddress).isLocationApplied, true);
});

test("상태만 바꾸는 왕복 — 빈 사업자주소는 비운 채, 층 구분만 있는 저장된 줄은 그대로", () => {
  const bare: StoreDetail = {
    ...detail,
    business: { ...detail.business, zipCode: null, address: null, addressDetail: null },
    floors: [{ storeFloorId: 9, floorTypeCode: "BASEMENT", floorNumber: null, floorAreaPyeong: null, floorAreaSqm: null, seatCount: null }],
  };
  const form = formOfStore(bare);
  assert.equal(form.bizSameAsStore, false);
  const input = toUpdateStoreInput({ ...form, storeStatus: "CLOSED" }, bare.updatedAt);
  assert.deepEqual([input.business.zipCode, input.business.address, input.business.addressDetail], [null, null, null]);
  assert.deepEqual(input.floors, [{ floorTypeCode: "BASEMENT", floorNumber: null, floorAreaPyeong: null, floorAreaSqm: null, seatCount: null }]);
});

test("상태만 바꾸는 왕복 — 점포 주소와 다른 사업자주소는 그대로", () => {
  const other: StoreDetail = { ...detail, business: { ...detail.business, zipCode: "04524", address: "서울 중구 세종대로 110", addressDetail: "3층" } };
  const form = formOfStore(other);
  assert.equal(form.bizSameAsStore, false);
  const { business } = toUpdateStoreInput({ ...form, storeStatus: "CLOSED" }, other.updatedAt);
  assert.deepEqual([business.zipCode, business.address, business.addressDetail], ["04524", "서울 중구 세종대로 110", "3층"]);
});

test("상태만 바꾸는 왕복 — 비어 있던 선택 칸은 null 그대로(0 · 빈 문자열로 바뀌지 않는다)", () => {
  const blank: StoreDetail = {
    ...detail,
    phone: null,
    zipCode: null,
    address: null,
    addressDetail: null,
    latitude: null,
    longitude: null,
    business: { ...detail.business, tradeName: null, ceoPhone: null, zipCode: null, address: null, addressDetail: null, category: null, item: null },
    floors: [],
  };
  const input = toUpdateStoreInput(formOfStore(blank), blank.updatedAt);
  assert.deepEqual(
    [input.phone, input.zipCode, input.address, input.addressDetail, input.latitude, input.longitude],
    [null, null, null, null, null, null],
  );
  assert.deepEqual(Object.values(input.business), [null, null, null, null, null, null, null]);
});

test("모르는 층 구분은 지우지 않고 받은 글자 그대로 돌려보낸다(api 가 판정)", () => {
  // 층 구분은 공통코드라 api 가 새 값을 더할 수 있다 — 응답 타입은 지금 값만 알아 타입을 우회해 넣는다
  const unknownFloor = "ROOFTOP" as unknown as StoreDetail["floors"][number]["floorTypeCode"];
  const rooftop: StoreDetail = { ...detail, floors: [{ storeFloorId: 3, floorTypeCode: unknownFloor, floorNumber: 1, floorAreaPyeong: null, floorAreaSqm: null, seatCount: 12 }] };
  const input = toUpdateStoreInput(formOfStore(rooftop), rooftop.updatedAt);
  assert.equal(input.floors[0]?.floorTypeCode, "ROOFTOP");
});

test("저장된 층 줄과 새 줄의 키는 겹치지 않는다", () => {
  const form = formOfStore({ ...detail, floors: [{ ...detail.floors[0], storeFloorId: 1 }] });
  const added = newFloorRow();
  assert.notEqual(form.floors[0].key, added.key);
  assert.ok(form.floors[0].key.startsWith("saved-") && added.key.startsWith("new-"));
});

test("점포 연락처는 9~12자리만 — 050X 평생번호는 받고, 8자리 대표번호는 받지 않는다", () => {
  assert.ok(validateStoreForm({ ...filled, phone: ["1588", "", "1234"] }, "edit").phone);
  assert.equal(validateStoreForm({ ...filled, phone: ["0507", "2033", "1334"] }, "edit").phone, undefined);
  assert.ok(validateStoreForm({ ...filled, phone: ["0507", "2033", "13345"] }, "edit").phone, "13자리는 막는다");
  // 대표자 연락처는 숫자 10~11자리(유선 포함) 그대로
  assert.ok(validateStoreForm({ ...filled, ceoPhone: ["0507", "2033", "1334"] }, "edit").ceoPhone);
});

test("050 이 아닌 12자리 점포 연락처도 저장 검사는 통과한다 — api 와 같이 자릿수만 본다. 나누기 · 표시는 050X 규칙을 타지 않는다", () => {
  assert.equal(validateStoreForm({ ...filled, phone: ["0311", "2345", "6789"] }, "edit").phone, undefined);
  assert.deepEqual(splitPhone("031123456789"), ["031", "12345", "6789"]);
  assert.equal(formatPhone("031123456789"), "031123456789");
});

test("050X 12자리 점포 연락처는 불러와 그대로 저장해도 같은 값이다", () => {
  const form = { ...filled, phone: splitPhone("050720331334") };
  assert.equal(validateStoreForm(form, "edit").phone, undefined);
  assert.equal(form.phone.join(""), "050720331334");
});

test("점포유형 없이 등록 요청을 만들면 던진다", () => {
  assert.throws(() => toCreateStoreInput(EMPTY_STORE_FORM));
});

test("api 오류 문장들을 칸별로 나눈다 — 경도는 경도 칸, 못 찾은 문장은 띠", () => {
  const { fields, rest } = storeServerErrors(400, ["점포명은 50자까지입니다", "경도는 -180~180 사이입니다", "알 수 없는 오류"]);
  assert.equal(fields.name, "점포명은 50자까지입니다");
  assert.equal(fields.longitude, "경도는 -180~180 사이입니다");
  assert.deepEqual(rest, ["알 수 없는 오류"]);
  assert.equal(storeServerErrorField(400, "대표자명이 일치하지 않습니다"), "ceoName");
  assert.equal(storeServerErrorField(400, "개업일자는 YYYY-MM-DD 입니다"), "openDate");
  assert.equal(storeServerErrorField(400, "사업자등록번호 · 대표자명이 일치하지 않습니다"), "bizNumber");
});

test("새로 더했는데 비어 있는 층 줄은 보내지 않는다", () => {
  const input = toCreateStoreInput({ ...filled, floors: [{ key: "n", floorTypeCode: "GROUND", floorNumber: "", floorAreaPyeong: "", floorAreaSqm: "", seatCount: "" }] });
  assert.deepEqual(input.floors, []);
});

test("전화번호 나누기 — 02 국번 · 휴대전화 · 050X 평생번호 · 빈 값", () => {
  assert.deepEqual(splitPhone("021234567"), ["02", "123", "4567"]);
  assert.deepEqual(splitPhone("01012345678"), ["010", "1234", "5678"]);
  assert.deepEqual(splitPhone("050720331334"), ["0507", "2033", "1334"]);
  assert.deepEqual(splitPhone("05012345678"), ["050", "1234", "5678"], "11자리 050 은 3자리 국번");
  assert.deepEqual(splitPhone(null), ["", "", ""]);
});

test("api 오류를 붙일 칸 — api 실제 문구 기준. 사업자번호 중복은 진위확인 칸, 운영 조건은 점포상태 칸, 동시 수정 · 그 밖은 띠", () => {
  assert.equal(storeServerErrorField(409, "이미 미운영 · 운영 중인 다른 점포가 쓰는 사업자등록번호입니다"), "bizNumber");
  assert.equal(storeServerErrorField(400, "운영으로 바꾸려면 다음이 필요합니다 — 사업자정보 인증, 좌표(위도 · 경도)"), "storeStatus");
  assert.equal(storeServerErrorField(409, "진행 중인 근로계약이 2건 있어 폐점할 수 없습니다"), null);
  assert.equal(storeServerErrorField(409, "다른 관리자가 먼저 수정했습니다. 최신 정보를 불러온 뒤 다시 저장해 주세요"), null);
  assert.equal(storeServerErrorField(400, "점포명은 50자까지입니다"), "name");
  assert.equal(storeServerErrorField(503, "사업자등록번호 …"), null);
  assert.equal(storeServerErrorField(409, "이미 등록된 사업자등록번호입니다."), "bizNumber");
  // 저장 때 서버가 다시 한 국세청 확인의 실패는 인증 상자의 버튼 위 한 줄 — 문구는 네 화면 공통으로 바꾼다
  assert.equal(storeServerErrorField(400, "국세청에 등록된 사업자 정보와 맞지 않습니다. 사업자등록번호 · 대표자명 · 개업일자를 확인해 주세요"), "bizVerify");
  assert.equal(storeServerErrorField(503, "사업자 진위확인 중 오류가 났습니다. 잠시 뒤 다시 시도해 주세요"), "bizVerify");
  assert.deepEqual(storeServerErrors(400, ["국세청에 등록된 사업자 정보와 맞지 않습니다. 사업자등록번호 · 대표자명 · 개업일자를 확인해 주세요"]).fields, {
    bizVerify: "입력한 사업자정보가 국세청 정보와 일치하지 않습니다.",
  });
  assert.deepEqual(storeServerErrors(503, ["사업자 진위확인 연동이 아직 없어 인증할 수 없습니다"]).fields, {
    bizVerify: "국세청 확인이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.",
  });
});

test("api 오류 나누기 — 국세청 문장이 여럿이어도 공통 문구는 한 번, 다른 칸 문장은 그 칸에 따로", () => {
  const { fields, rest } = storeServerErrors(400, [
    "국세청에 등록된 사업자 정보와 맞지 않습니다. 사업자등록번호 · 대표자명 · 개업일자를 확인해 주세요",
    "사업자 진위확인 결과가 맞지 않습니다",
    "점포명은 50자까지입니다",
  ]);
  assert.deepEqual(fields, { bizVerify: "입력한 사업자정보가 국세청 정보와 일치하지 않습니다.", name: "점포명은 50자까지입니다" });
  assert.deepEqual(rest, []);
});

test("api 오류 나누기 — 저장 때 번호 중복 409 는 번호 칸에 공통 문구로", () => {
  assert.deepEqual(storeServerErrors(409, ["이미 미운영 · 운영 중인 다른 점포가 쓰는 사업자등록번호입니다"]).fields, { bizNumber: "이미 등록된 사업자등록번호입니다." });
});

test("api 오류 칸 — 운영 조건 문구는 조건 이름에 「진위확인」이 있어도 점포상태 칸", () => {
  assert.equal(storeServerErrorField(400, "운영으로 바꾸려면 다음이 필요합니다 — 사업자 진위확인, 좌표(위도 · 경도)"), "storeStatus");
});
