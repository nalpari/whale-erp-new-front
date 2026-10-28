"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { getAddressCoordinateAction } from "@/lib/address-actions";
import { AddressField } from "@/components/address-field";
import type { AddressItem } from "@/lib/address-search";
import {
  Button,
  Checkbox,
  ConfirmDialog,
  DataTable,
  Field,
  FormGroup,
  FormRow,
  RequiredMark,
  Select,
  TextField,
  useToast,
  type Column,
} from "@/components/common";
import {
  EMPTY_STORE_FORM,
  currentVerification,
  formOfStore,
  hasCoordinateInput,
  newFloorRow,
  storeServerErrors,
  isBpBlockedMessage,
  BP_BLOCKED_TEXT,
  toCreateStoreInput,
  toUpdateStoreInput,
  validateStoreForm,
  verificationErrors,
  verificationValuesOf,
  type FloorRow,
  type PhoneParts,
  type StoreForm,
  type StoreFormErrors,
  type StoreFormField,
} from "@/lib/store-form";
import type { EnumValue } from "@/lib/enums";
import { FLOOR_TYPES, floorTypeOf, type StoreDetail, type StoreImageFileType, type StoreStatus } from "@/lib/store-types";
import { closeBlockText, formatBizNumber, nextStatuses } from "@/lib/store-view";
import { BizVerificationBox, BizVerifiedStatus } from "@/components/site/biz-verification-box";
import { BIZ_MESSAGE, bizDigits, bizVerifyFailure, type BizVerifyField } from "@/lib/biz-verification-rules";
import { formatDate } from "@/lib/format";
import { CodeLabel, useCodeLabel } from "@/components/site/code-label";
import { useAccount, useCurrentBp } from "@/components/site/session-gate";
import { bff } from "@/lib/bff";
import type { BpOption } from "@/lib/session";
import { bpPath } from "@/lib/bp-path";
import { withoutStoreSearch } from "@/lib/store-scope";
import { storeImageAccept, storeImageFileError, storeImageTypesText } from "@/lib/store-image";
import {
  createStoreAction,
  deleteStoreImageAction,
  getStoreTransitionsAction,
  putStoreImageAction,
  updateStoreAction,
  verifyStoreBusinessAction,
  type ActionFailure,
} from "./actions";
import { FieldMessage, NoticeBand, StoreImage, StoreStatusBadge, StoreTypeCards } from "./store-parts";
import { withBack } from "./stores-query";

/** 동시 수정 409 문구(api). 이때만 최신 정보를 다시 불러온다 */
const STALE = "먼저 수정했습니다";
/** 저장이 막혔을 때 띠 아래 줄 — 칸은 건드리지 않았다 */
const KEPT = "입력한 값은 그대로 두었습니다.";

/** 진위확인 세 칸과 상자의 버튼 위 한 줄 — 인증을 다시 시작할 때 함께 비운다 */
const VERIFY_KEYS: StoreFormField[] = ["bizNumber", "ceoName", "openDate", "bizVerify"];
const withoutVerifyErrors = (e: StoreFormErrors) => Object.fromEntries(Object.entries(e).filter(([k]) => !VERIFY_KEYS.includes(k as StoreFormField))) as StoreFormErrors;

/** server action 호출 자체가 실패했다(연결 끊김 · 배포 어긋남) — 결과를 모른다(status 없음). 다시 받을지는 부르는 쪽이 정한다 */
const unknownResult =
  (what: string) =>
  (error: unknown): ActionFailure => {
    console.error(`점포 ${what} 호출 실패`, error);
    return { ok: false, message: `${what} 결과를 확인하지 못했습니다.` };
  };

/** 대표 이미지 칸 — 그대로 두기 · 새 파일(저장할 때 올림) · 지우기(저장할 때 지움) */
type ImageChoice = { kind: "keep" } | { kind: "new"; file: File; previewUrl: string } | { kind: "remove" };

/** imageTypes — 올릴 수 있는 형식(GET /enums StoreImageFileType). 비면 이미지 칸만 막는다 */
type Props =
  | { mode: "create"; store?: never; backHref: string; imageTypes: readonly StoreImageFileType[] }
  | {
      mode: "edit";
      store: StoreDetail;
      backHref: string;
      imageTypes: readonly StoreImageFileType[];
      /** 운영 조건 한글(GET /enums/StoreOperationRequirement). 새 점포는 미운영으로만 생겨 이 검증을 타지 않아 등록 화면엔 없다 */
      requirementLabels: EnumValue[];
    };

/**
 * 점포 등록(S-ALHLHW) · 수정(S-JEPOMK) 공용 폼. 데모 docs/demo/stores/new · edit 의 배치 — 등록 화면에서만 점포유형
 * 큰 카드, 기본정보 · 사업자정보 나란히, 점포 공간정보. [취소] [저장]은 제목 줄 오른쪽(근로계약서 작성 화면과 같은
 * 자리, 2026-10-19 점검). 저장하면 상세로 간다.
 * 필수는 점포유형 · 점포명뿐이다. 점포유형은 등록 뒤 바꿀 수 없어 수정 화면에는 그 카드를 두지 않고 위 제목 줄에
 * 점포유형 · 점포코드로만 알린다. 점포상태는 지금 상태에서 갈 수 있는 곳만 고른다.
 * 폐점을 고르는 순간 폐점 조건을 다시 확인하고, 못 채우면 팝업으로 알린 뒤 이전 상태로 되돌린다. 저장 때 확인 창을 한 번 더 거친다.
 * 사업자 진위확인은 이 화면에서 통과한 값만 저장할 때 함께 보낸다(서버가 국세청에 다시 확인). 연동 전이라 지금은 503 문구가 칸 아래에 뜬다.
 * 점포 주소를 검색해 고르면 카카오 로컬 API 로 위도 · 경도를 채운다(못 받으면 이유를 칸 아래에 두고 직접 적는다).
 * 대표 이미지는 고르면 미리보기만 바꾸고, 점포를 저장한 뒤 PUT · DELETE /stores/:id/image 로 이어서 보낸다(등록은 점포가 생긴 뒤에야
 * 올릴 수 있다). 이미지만 실패하면 점포 저장은 그대로 두고 알린다 — 등록은 상세의 띠로, 수정은 이 화면의 띠로.
 */
export function StoreFormView(props: Props) {
  const { mode, backHref, imageTypes } = props;
  const router = useRouter();
  // 선택지 글자는 <option> 에 글자로만 넣는다 — 공통코드 한글(로그인 정보)
  const statusLabel = useCodeLabel("STORE_STATUS");
  // 등록할 BP — 이 탭의 BP(플랫폼 계정이 고른 BP, 그 밖은 소속 BP). 주소 /bp/{id} 의 BP 와 같다(SessionGate 가 주소로 정한다) —
  // api 가 헤더로 대상 BP 를 정하면(점포 탭 BP 전환) 본문의 bpCodeId 가 proxy 가 실은 헤더와 다를 때 400 이다
  const currentBp = useCurrentBp();
  const account = useAccount();
  // 등록할 BP 가 탈퇴 · 미사용인가 — 들어오자마자 알려 저장까지 가서야 거절당하지 않게 한다(2026-10-28 사용자 지정).
  // 다른 BP 를 고를 수 있는 플랫폼 계정만 본다(BP 계정은 자기 BP 가 사용이 아니면 로그인하지 못한다). BP 하나를 따로 묻는 api 가 없어
  // BP 선택 창과 같은 GET /bp-codes 를 BP코드로 찾는다. 확인하지 못하면 아무것도 띄우지 않는다 — 저장 때 api 가 막고 같은 문구가 뜬다
  const [bpBlocked, setBpBlocked] = useState(false);
  useEffect(() => {
    if (mode !== "create" || !account.bp.isPlatform) return;
    let live = true;
    const params = new URLSearchParams({ page: "1", pageSize: "20", keyword: currentBp.bpCode });
    bff<{ items: BpOption[] }>(`/bp-codes?${params}`).then(
      (r) => live && setBpBlocked(r.items.some((b) => b.bpCodeId === currentBp.bpCodeId && b.accountStatusCode !== "ACTIVE")),
      (e: unknown) => console.warn("등록할 BP 상태를 확인하지 못했습니다 — 저장 때 api 가 다시 본다", e),
    );
    return () => {
      live = false;
    };
  }, [mode, account.bp.isPlatform, currentBp.bpCodeId, currentBp.bpCode]);
  // 화면 주소는 탭 BP 를 붙인다. backHref 는 옛 경로(목록 쿼리)다
  const at = (path: string) => bpPath(currentBp.bpCodeId, path);
  const toast = useToast();
  const ids = useId();
  const initialForm = () => (props.mode === "edit" ? formOfStore(props.store) : EMPTY_STORE_FORM);
  const [form, setForm] = useState<StoreForm>(initialForm);
  const [errors, setErrors] = useState<StoreFormErrors>({});
  const [failure, setFailure] = useState<{ title: string; detail?: ReactNode } | null>(null);
  // 등록 결과를 모르면(저장됐을 수도) 다시 저장해 둘이 생기지 않게 저장을 잠근다
  const [createUncertain, setCreateUncertain] = useState(false);
  const [dialog, setDialog] = useState<"close-blocked" | "close-confirm" | null>(null);
  const [closeBlock, setCloseBlock] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [checkingClose, startCheckingClose] = useTransition();
  const [verifying, startVerifying] = useTransition();
  const [coordinateNote, setCoordinateNote] = useState<string | null>(null);
  const [locating, startLocating] = useTransition();
  // 주소를 연달아 바꾸면 늦게 온 앞 주소의 좌표가 덮지 않게 마지막 요청만 받는다
  const locateNumber = useRef(0);
  /** 진위확인 차례 — 진위확인 칸을 고치면 올라가, 기다리던 인증 응답을 버린다(옛 값이 「인증 완료」로 되살아나지 않게) */
  const verifyNumber = useRef(0);
  /** 저장된 사업자정보를 재인증하려고 연 상태 — 대표자명 칸만 열린다(번호 · 개업일자는 저장 뒤 바꿀 수 없다). 인증을 마치면 다시 잠긴다 */
  const [reopenSaved, setReopenSaved] = useState(false);
  const [image, setImage] = useState<ImageChoice>({ kind: "keep" });
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  // 미리보기 주소는 브라우저 메모리를 잡으므로 바꾸거나 화면을 떠날 때 놓는다
  useEffect(() => {
    if (image.kind !== "new") return;
    const url = image.previewUrl;
    return () => URL.revokeObjectURL(url);
  }, [image]);

  // 최신 정보를 다시 받아 updatedAt 이 바뀌었으면(동시 수정 409 · 결과 모름 · 이미지만 실패한 저장 뒤) 칸을 새 값으로 다시 채운다.
  // 띠와 고른 이미지는 남긴다.
  const updatedAt = props.mode === "edit" ? props.store.updatedAt : null;
  const [filledFor, setFilledFor] = useState(updatedAt);
  if (filledFor !== updatedAt) {
    setFilledFor(updatedAt);
    setForm(initialForm());
    setErrors({});
    // 저장된 사업자정보는 다시 잠긴 「인증 완료」로 연다 — 재인증하려고 열어 둔 상태를 새 값에 남기지 않는다
    setReopenSaved(false);
  }

  const store = props.mode === "edit" ? props.store : null;
  const requirementLabels = props.mode === "edit" ? props.requirementLabels : [];
  const closedOrBlocked = store ? store.storeStatusCode === "CLOSED" || store.bpAccountStatusCode !== "ACTIVE" : false;

  const clearError = (key: StoreFormField) =>
    setErrors((e) => (key in e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)) : e));
  const set = <K extends keyof StoreForm>(key: K, value: StoreForm[K], field?: StoreFormField) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (field) clearError(field);
  };
  const messageId = (key: StoreFormField) => `${ids}-${key}`;
  const invalid = (key: StoreFormField) => (errors[key] ? true : undefined);
  const describe = (key: StoreFormField) => (errors[key] ? messageId(key) : undefined);
  const message = (key: StoreFormField) => <FieldMessage id={messageId(key)} message={errors[key]} />;

  /** 오류가 생기면 첫 오류 칸으로 커서를 옮긴다 — 폼이 길어 아래 칸 오류는 보이지 않을 수 있다 */
  const focusFirstError = () =>
    requestAnimationFrame(() =>
      (document.getElementById(`${ids}-form`)?.querySelector('[aria-invalid="true"] input, [aria-invalid="true"]') as HTMLElement | null)?.focus(),
    );
  /** 인증 상자의 버튼 위 한 줄(미인증 · 만료 · 국세청 실패)은 칸이 아니라 커서를 옮길 곳이 없다 — 상자를 화면 가운데로 끌어온다 */
  const scrollToBizBox = () =>
    requestAnimationFrame(() => document.getElementById(`${ids}-form`)?.querySelector('[aria-label="사업자 번호 인증"]')?.scrollIntoView({ block: "center" }));

  /** api 가 거절한 이유를 칸마다 나눠 붙이고(검증 실패는 문장이 여럿), 칸을 못 찾은 문장은 위 띠로 */
  const applyServerError = (failure: ActionFailure) => {
    const messages = failure.messages?.length ? failure.messages : [failure.message];
    // BP 가 미사용 · 탈퇴라 거절했으면 칸 오류로 나누지 않고 한 줄만 — 다시 눌러도 저장되지 않아 「입력한 값은 그대로 …」는 붙이지 않는다(2026-10-28 사용자 지정)
    if (messages.some((m) => isBpBlockedMessage(failure.status, m))) return setFailure({ title: BP_BLOCKED_TEXT[mode] });
    const { fields, rest } = storeServerErrors(failure.status, messages);
    // 등록 화면에는 점포상태 칸이 없다 — 그 칸으로 갈 문장은 띠로 돌린다(안 보이는 칸에 붙으면 아무 말 없이 끝난다)
    if (mode === "create" && fields.storeStatus) {
      rest.push(fields.storeStatus);
      delete fields.storeStatus;
    }
    // 붙일 곳이 하나도 없으면(빈 문장 등) 띠에라도 알린다 — 저장 버튼만 풀리고 끝나지 않게
    if (!rest.length && !Object.keys(fields).length) rest.push(failure.message || "저장하지 못했습니다.");
    if (rest.length) setFailure({ title: rest.join(" "), detail: KEPT });
    if (Object.keys(fields).length) {
      setErrors((e) => ({ ...e, ...fields }));
      // 저장 때 서버가 다시 한 국세청 확인에 실패했거나 그 사이 다른 BP · 점포가 같은 번호를 먼저 저장했다 — 인증 결과를 풀어 상자가
      // 「인증 완료」로 잠긴 채 남지 않게 하고(번호 칸이 다시 열린다) 바로 다시 인증할 수 있게 한다
      if (fields.bizVerify || (fields.bizNumber && !form.savedBizNumber)) {
        verifyNumber.current++;
        setForm((f) => ({ ...f, verified: null }));
        if (form.savedBizNumber) setReopenSaved(true);
      }
      if (fields.bizVerify && Object.keys(fields).length === 1) scrollToBizBox();
      else focusFirstError();
    }
  };

  /**
   * 점포 주소를 고르면 그 건물의 위도 · 경도를 받아 채운다. 앞 주소의 좌표가 새 주소에 남지 않게 먼저 비우고, 못 받으면 비운 채
   * 이유를 알린다(좌표는 출퇴근 반경 판정에 쓰여 틀린 값이 빈 값보다 위험하다). 받는 동안 위도 · 경도를 직접 고치면 결과를 버린다.
   */
  const handleAddressChoose = (item: AddressItem) => {
    const mine = ++locateNumber.current;
    setCoordinateNote(null);
    // 출퇴근 위치 적용 여부는 여기서 건드리지 않는다 — 같은 주소를 다시 고르거나 오타를 고치는 흔한 경우까지
    // "사용"을 꺼 버려 운영 점포의 위치 확인이 조용히 멈추는 문제가 있었다(2026-10-19 코드 리뷰 2차 — 처음엔
    // 화면·저장 어긋남을 막으려 껐는데, 그러면 새 좌표를 받아도 되살리지 않아 더 나쁜 쪽으로 지나쳤다). 좌표가
    // 비는 동안은 선택칸이 막히고(disabled) 저장(bodyOf)도 좌표 없이는 사용을 보내지 않으니 이미 막혀 있다.
    setForm((f) => ({ ...f, latitude: "", longitude: "" }));
    startLocating(async () => {
      const result = await getAddressCoordinateAction(item.roadAddressBase, item.jibunAddress).catch((error: unknown) => {
        console.error("좌표 조회 호출 실패", error);
        return { ok: false as const, message: "좌표를 가져오지 못했습니다. 위도 · 경도를 직접 적어 주세요." };
      });
      if (mine !== locateNumber.current) return;
      if (!result.ok) {
        // 좌표를 못 받으면 비워진 채로 남는다 — 선택칸은 막혀도 값은 그대로라 "사용"을 보이면서 저장은 조용히
        // "미사용"을 보내는 어긋남이 생긴다. 못 받은 바로 이 순간에만 미사용으로 맞춘다(2026-10-19 코드 리뷰
        // 3차 — 재선택마다 끄던 것과 달리, 좌표가 끝내 안 들어온 걸 확인한 뒤다). [주소로 다시 계산] 이 나중에
        // 좌표를 다시 채워도 이 값은 되살리지 않는다 — 선택칸이 저장 조건과 같은 값을 그려(4차) "미사용"으로
        // 보이니, 다시 쓰려면 직접 고르게 둔다(2026-10-19 코드 리뷰 4차, 조용히 되돌리지 않는다는 뜻과 같다).
        setForm((f) => ({ ...f, isLocationApplied: false }));
        return setCoordinateNote(result.message);
      }
      setForm((f) => ({ ...f, latitude: String(result.latitude), longitude: String(result.longitude) }));
      clearError("latitude");
      clearError("longitude");
    });
  };

  /**
   * [주소로 다시 계산] — 주소는 그대로 두고 지금 칸의 점포 주소로 좌표만 다시 받는다. 좌표는 주소를 고르면
   * 자동으로 채워지지만 그 뒤 직접 고칠 수 있어, 등록 · 수정 화면 모두에 둔다(2026-10-19) — 직접 고친 값을
   * 주소 기준 값으로 되돌리고 싶을 때 쓴다. 요청을 보내고 늦게 온 응답을 버리는 흐름은 handleAddressChoose 와
   * 같지만, 비우거나 실패했을 때 되돌리는 동작은 다르다(아래 주석 참고).
   */
  const handleRecalculateCoordinate = () => {
    const mine = ++locateNumber.current;
    setCoordinateNote(null);
    // handleAddressChoose 와 달리 주소가 바뀐 게 아니라 지금 좌표가 여전히 맞을 수 있다 — 실패해도 지우지 않는다.
    // form.address 는 참고항목(동 이름 · 건물명)이 붙은 전체 도로명주소라 그대로 물으면 카카오가 못 찾는다
    // (address-search.ts 의 roadAddressBase 설명과 같다) — 끝의 괄호를 떼고 묻는다.
    const query = form.address.replace(/\s*\([^)]*\)\s*$/, "");
    startLocating(async () => {
      const result = await getAddressCoordinateAction(query, "").catch((error: unknown) => {
        console.error("좌표 조회 호출 실패", error);
        return { ok: false as const, message: "좌표를 가져오지 못했습니다. 위도 · 경도를 직접 적어 주세요." };
      });
      if (mine !== locateNumber.current) return;
      if (!result.ok) return setCoordinateNote(result.message);
      setForm((f) => ({ ...f, latitude: String(result.latitude), longitude: String(result.longitude) }));
      clearError("latitude");
      clearError("longitude");
    });
  };

  /** 위도 · 경도를 직접 고친다 — 받는 중이던 좌표는 버려 직접 적은 값을 덮지 않게 한다 */
  const setCoordinate = (key: "latitude" | "longitude", value: string) => {
    locateNumber.current++;
    setCoordinateNote(null);
    // 숫자 · 마침표 · 마이너스만 받는다 — 문자는 칠 수 없다(2026-10-19).
    // 출퇴근 위치 적용 여부는 여기서 건드리지 않는다 — 오타를 고치려 한 칸을 지웠다 바로 채워도 "사용"이
    // 꺼진 채 남는 문제가 있었다(2026-10-19 코드 리뷰 2차). 좌표가 비는 동안은 선택칸이 막히고 저장(bodyOf)도
    // 좌표 없이는 사용을 보내지 않으니 이미 막혀 있다.
    set(key, value.replace(/[^0-9.-]/g, ""), key);
  };

  /** 진위확인 칸을 고치면 이번 화면의 인증 결과는 무효다 */
  const setVerification = (key: BizVerifyField, value: string) => {
    verifyNumber.current++;
    setForm((f) => ({ ...f, [key]: value, verified: null }));
    clearError(key);
    clearError("bizVerify");
  };

  const handleVerify = () => {
    const found = verificationErrors(form);
    setErrors((e) => ({ ...withoutVerifyErrors(e), ...found }));
    if (Object.keys(found).length) return focusFirstError();
    const values = verificationValuesOf(form);
    const mine = ++verifyNumber.current;
    // 10분은 api 가 요청을 받을 때부터다 — 응답을 받은 시각으로 세면 끝자락 저장이 api 에서 거절된다
    const startedAt = Date.now();
    startVerifying(async () => {
      const result = await verifyStoreBusinessAction({
        bizRegistrationNumber: values.bizNumber,
        ceoName: values.ceoName,
        openDate: values.openDate,
        ...(store ? { storeId: store.storeId } : {}),
      }).catch(unknownResult("사업자정보 인증"));
      // 기다리는 사이 진위확인 칸을 고쳤으면 이 응답은 옛 값의 것이다 — 버린다(저장도 지금 칸 값과 같을 때만 인증으로 본다)
      if (mine !== verifyNumber.current) return;
      // 문구 · 자리는 네 화면 공통(S-VRNTHD) — 중복은 번호 칸 아래, 나머지는 인증하기 버튼 바로 위 한 줄
      if (!result.ok) {
        // 로그인 만료 · 형식(400) · 권한(403) · 점포 없음(404)은 할 일을 알리는 api 문구라 그대로 보인다(회원가입의 400 과 같다)
        const keepApiText = result.status === 400 || result.status === 401 || result.status === 403 || result.status === 404;
        const failure = keepApiText ? { field: null, message: result.message } : bizVerifyFailure(result.status);
        return setErrors((e) => ({ ...e, [failure.field ?? "bizVerify"]: failure.message }));
      }
      if (result.result === "DUPLICATE") return setErrors((e) => ({ ...e, bizNumber: BIZ_MESSAGE.DUPLICATE }));
      if (result.result === "UNVERIFIABLE") return setErrors((e) => ({ ...e, bizVerify: BIZ_MESSAGE.MISMATCH }));
      // 모르는 결과(api 버전 어긋남)를 「인증 완료」로 보지 않는다 — 회원가입의 토큰 없는 응답과 같다
      if (result.result !== "VERIFIED") {
        console.error("점포 사업자정보 인증 — 알 수 없는 결과", result.result);
        return setErrors((e) => ({ ...e, bizVerify: BIZ_MESSAGE.FAILED }));
      }
      setForm((f) => ({ ...f, verified: { ...values, verifiedAt: startedAt } }));
    });
  };

  /** 인증 완료 상태의 "재인증" — 값은 그대로 두고 칸을 다시 연다(저장한 점포는 대표자명만). 인증하기로 다시 확인하면 다시 잠긴다 */
  const handleReverify = () => {
    verifyNumber.current++;
    setForm((f) => ({ ...f, verified: null }));
    if (form.savedBizNumber) setReopenSaved(true);
    setErrors(withoutVerifyErrors);
  };

  /** 저장된 사업자정보의 "재인증 취소" — 대표자명을 저장된 값으로 되돌리고 인증 완료(잠금)로 돌아간다 */
  const handleRevertSaved = () => {
    verifyNumber.current++;
    setForm((f) => ({ ...f, ceoName: f.savedCeoName, verified: null }));
    setReopenSaved(false);
    setErrors(withoutVerifyErrors);
  };

  /** 저장 전 칸을 비운다 — 인증 전이든 인증 완료 뒤든 같은 "지우기"다(세 값과 인증 결과를 비운다) */
  const handleClearPending = () => {
    verifyNumber.current++;
    setForm((f) => ({ ...f, bizNumber: "", ceoName: "", openDate: "", verified: null }));
    setErrors(withoutVerifyErrors);
  };

  /** 대표 이미지 파일을 골랐다 — 형식 · 크기를 먼저 보고 미리보기만 바꾼다. 올리기는 저장할 때 */
  const handleImagePick = (file: File | undefined) => {
    if (imageInput.current) imageInput.current.value = ""; // 같은 파일을 다시 골라도 onChange 가 오게 비운다
    if (!file) return;
    const problem = storeImageFileError(file, imageTypes);
    setImageError(problem);
    if (problem) return;
    setImage({ kind: "new", file, previewUrl: URL.createObjectURL(file) });
  };

  /** 점포를 저장한 뒤 이미지 변경을 보낸다. 바꾼 것이 없으면 null */
  const applyImage = async (storeId: number) => {
    if (image.kind === "new") {
      const data = new FormData();
      data.append("file", image.file, image.file.name);
      return putStoreImageAction(storeId, data).catch(unknownResult("대표 이미지 저장"));
    }
    if (image.kind === "remove") return deleteStoreImageAction(storeId).catch(unknownResult("대표 이미지 삭제"));
    return null;
  };

  /** 폐점을 고르는 순간 조건을 지금 기준으로 확인한다 — 못 채우면 알리고 이전 상태로 되돌린다. 확인하는 동안 상태 칸 · 저장은 잠근다 */
  const handleStatusSelect = (next: StoreStatus) => {
    const previous = form.storeStatus;
    set("storeStatus", next, "storeStatus");
    if (next !== "CLOSED" || !store) return;
    startCheckingClose(async () => {
      const result = await getStoreTransitionsAction(store.storeId).catch(unknownResult("폐점 조건 확인"));
      if (result.ok && result.canClose) return;
      setCloseBlock(result.ok ? (closeBlockText(result) ?? "폐점 조건을 채우지 못했습니다.") : result.message);
      setDialog("close-blocked");
      setForm((f) => ({ ...f, storeStatus: previous }));
    });
  };

  const handleSaveConfirm = () =>
    startSaving(async () => {
      if (props.mode === "create") {
        const result = await createStoreAction(toCreateStoreInput(form, currentBp.bpCodeId)).catch(unknownResult("등록"));
        if (!result.ok && result.status === undefined) {
          // 저장됐을 수도 있다 — 다시 저장하면 점포가 둘 생길 수 있으므로 목록에서 확인하게 하고 저장을 잠근다
          setCreateUncertain(true);
          return setFailure({
            title: "등록 결과를 확인하지 못했습니다.",
            detail: (
              <>
                점포가 이미 생겼을 수 있습니다.{" "}
                <Link href={at(backHref)} className="text-erp-link underline">
                  목록에서 확인
                </Link>
                한 뒤, 없으면 새로고침해 다시 등록해 주세요.
              </>
            ),
          });
        }
        if (!result.ok) return applyServerError(result);
        // 점포는 생겼다 — 이미지가 실패해도 등록을 되돌리지 않고 상세에서 알린다(상태 코드만 주소에 싣는다)
        const imageResult = await applyImage(result.storeId);
        toast("saved");
        // 등록 뒤 목록에 돌아가면 점포 검색은 「전체」다 — 새 점포가 고른 점포 조건에 걸려 안 보이지 않게(상세의 [목록]이 이 주소로 간다)
        const params = new URLSearchParams({ back: withoutStoreSearch(backHref) });
        if (imageResult && !imageResult.ok) params.set("imageFailed", String(imageResult.status ?? "error"));
        return router.push(at(`/stores/${result.storeId}?${params}`));
      }
      const storeId = props.store.storeId;
      // 폐점한 점포는 이미지를 바꿀 수 없다(api 409) — 폐점으로 저장할 때는 이미지를 먼저 보내고, 실패하면 폐점하지 않는다.
      // 이미지 저장은 점포 updatedAt 을 바꾸지 않는다(api 2026-10-14 확인) — 그래서 이어지는 점포 저장이 동시 수정(409)에 걸리지 않는다.
      // 바뀌면 폐점 + 이미지 저장이 409(먼저 수정했습니다)로 떨어진다.
      const closing = form.storeStatus === "CLOSED" && props.store.storeStatusCode !== "CLOSED";
      // 이미지를 이 저장에서 이미 보냈는가 — setImage 는 이 async 안의 image 를 바꾸지 않으므로 따로 들고 간다
      let imageSent = image.kind === "keep";
      if (closing) {
        const imageFirst = await applyImage(storeId);
        if (imageFirst && !imageFirst.ok) {
          setDialog(null);
          if (imageFirst.status === undefined) {
            // 이미지가 바뀌었을 수도 있다 — 다시 받아 보이고 확인하게 한다
            router.refresh();
            setImage({ kind: "keep" });
            return setFailure({ title: "대표 이미지 저장 결과를 확인하지 못해 폐점을 멈췄습니다.", detail: "최신 정보를 다시 불러왔습니다. 이미지를 확인한 뒤 다시 저장해 주세요." });
          }
          return setFailure({ title: `대표 이미지를 저장하지 못해 폐점하지 않았습니다 — ${imageFirst.message}`, detail: KEPT });
        }
        if (imageFirst) {
          imageSent = true;
          // 이미지는 이미 바뀌었다 — 아래 점포 저장이 막혀도 화면이 새 이미지를 보이게 다시 받는다
          setImage({ kind: "keep" });
          router.refresh();
        }
      }
      const result = await updateStoreAction(storeId, toUpdateStoreInput(form, props.store.updatedAt)).catch(unknownResult("수정"));
      setDialog(null);
      if (result.ok) {
        const imageResult = closing ? null : await applyImage(storeId);
        if (imageResult && !imageResult.ok) {
          // 점포 정보는 저장됐다. 새 수정 시각으로 다시 받고, 고른 이미지는 남겨 다시 저장할 수 있게 한다
          router.refresh();
          return setFailure({
            title: `점포 정보는 저장했지만 대표 이미지는 저장하지 못했습니다 — ${imageResult.message}`,
            detail: "고른 이미지는 그대로 두었습니다. 다시 저장해 주세요.",
          });
        }
        toast("updated");
        return router.push(at(withBack(`/stores/${props.store.storeId}`, backHref)));
      }
      // 다른 사람이 먼저 고쳤거나 결과를 모르면 최신 정보를 불러온다 — 저장됐으면 updatedAt 이 바뀌어 칸이 새 값으로 다시 채워진다
      if (result.status === undefined) {
        router.refresh();
        return setFailure({
          title: "수정 결과를 확인하지 못했습니다.",
          detail: `최신 정보를 다시 불러왔습니다. 칸이 바뀌었으면 저장된 것입니다.${imageSent ? "" : " 대표 이미지는 아직 보내지 않았습니다."}`,
        });
      }
      if (result.status === 409 && result.message.includes(STALE)) {
        router.refresh();
        return setFailure({ title: result.message, detail: "칸을 최신 정보로 다시 채웠습니다. 바꾸려던 값을 다시 입력한 뒤 저장해 주세요." });
      }
      applyServerError(result);
    });

  const handleSave = () => {
    const found = validateStoreForm(form, mode, requirementLabels);
    setErrors(found);
    // 인증 10분이 지났으면 인증을 풀어 둔다 — 값은 그대로 두고 상자가 「미인증」 · [인증하기]로 돌아가 바로 다시 인증할 수 있다
    if (found.bizVerify === BIZ_MESSAGE.EXPIRED) {
      verifyNumber.current++;
      setForm((f) => ({ ...f, verified: null }));
      if (form.savedBizNumber) setReopenSaved(true);
    }
    setFailure(null);
    // 막은 이유가 인증 상자의 한 줄뿐이면 커서를 옮길 칸이 없다 — 상자를 보이게 끌어온다
    if (found.bizVerify && Object.keys(found).length === 1) return scrollToBizBox();
    if (Object.keys(found).length) return focusFirstError();
    // 폐점은 되돌릴 수 없어 한 번 더 묻는다. 조건은 저장(PUT)을 받은 api 가 다시 본다(화면은 고를 때 한 번 확인했다)
    if (store && form.storeStatus === "CLOSED" && store.storeStatusCode !== "CLOSED") return setDialog("close-confirm");
    handleSaveConfirm();
  };

  const statusOptions = store ? nextStatuses(store.storeStatusCode) : [];
  const hasImage = image.kind === "new" || (image.kind === "keep" && Boolean(store?.image));
  const shownImageUrl = image.kind === "new" ? image.previewUrl : image.kind === "remove" ? null : (store?.image?.url ?? null);
  const imageLocked = saving || checkingClose || closedOrBlocked || imageTypes.length === 0;
  const imageNote: ReactNode =
    imageTypes.length === 0
      ? "올릴 수 있는 형식을 불러오지 못해 지금은 이미지를 바꿀 수 없습니다. 계속되면 관리자에게 알려 주세요."
      : image.kind === "new"
        ? image.file.name
        : image.kind === "remove"
          ? "저장하면 대표 이미지를 지웁니다."
          : (
              <>
                {storeImageTypesText(imageTypes)} 파일 1장만 등록할 수 있습니다. (최대 5MB)
                <br />
                이미지를 선택한 후 ‘저장’을 눌러야 반영됩니다.
              </>
            );
  // 인증 상자 상태(S-VRNTHD — 인증하면 잠그고 재인증으로 연다, 2026-10-22 사용자 확정). 이번 화면에서 지금 칸 값으로
  // 받은 인증(pending)이거나, 저장된 사업자정보를 아직 재인증하려고 열지 않았으면(savedLocked) 인증 완료로 잠근다.
  // 저장 뒤의 사업자등록번호 · 개업일자는 naming.md 의 "저장 후 변경 불가" 규칙으로 늘 잠겨 있다.
  const pending = currentVerification(form);
  const savedLocked = Boolean(form.savedBizNumber) && !reopenSaved && !pending;
  const verified = Boolean(pending) || savedLocked;
  const savedVerifiedAt = props.mode === "edit" ? formatDate(props.store.business?.verifiedAt) : "";
  // 인증일은 저장할 때 api 가 기록한다(store-management.service profileFields) — 저장 전 막 받은 인증은 날짜 없이 「인증 완료」만,
  // 저장된 인증은 그 인증일을 보인다. 인증만 하고 지우거나 저장하지 않으면 인증일은 그대로다(2026-10-22 사용자 확인)
  const verifiedDate = savedLocked ? savedVerifiedAt : "";
  // 비어서 생긴 오류만 「·」 한 줄로 묶는다 — 채운 칸의 형식 오류는 그 칸 아래에 그대로 보인다
  const verifyKeys: BizVerifyField[] = ["bizNumber", "ceoName", "openDate"];
  // 번호는 숫자가 하나도 없으면(하이픈만 친 경우 포함) 빈 칸으로 본다 — verificationErrors 도 하이픈을 빼고 보아 「입력해 주세요」로 본다
  const isEmpty = (key: BizVerifyField) => !(key === "bizNumber" ? bizDigits(form.bizNumber) : form[key].trim());
  const missingVerify = verifyKeys.filter((key) => Boolean(errors[key]) && isEmpty(key) && !(form.savedBizNumber && key !== "ceoName"));
  const verifyFieldErrors = Object.fromEntries(verifyKeys.filter((key) => !missingVerify.includes(key)).map((key) => [key, errors[key]]));
  // 저장 전이면 한 글자라도 쳤거나 인증했을 때 지우기를 보인다 — 저장 뒤는 번호 · 개업일자가 잠겨 지울 게 없다
  const showBizClear = !form.savedBizNumber && Boolean(form.bizNumber || form.ceoName || form.openDate || pending);

  return (
    <div id={`${ids}-form`} className="flex flex-col gap-[24px]">
      {/* 소속 BP 상태 이름(미사용 · 탈퇴)을 밝힌다 — 상세와 같은 문구 · 같은 자리(점포명 제목 줄 위, 2026-10-28 사용자 지정) */}
      {mode === "create" && bpBlocked && <NoticeBand title={BP_BLOCKED_TEXT.create} />}
      {store && store.bpAccountStatusCode !== "ACTIVE" && <NoticeBand title={<>이 점포가 속한 BP가 <CodeLabel group="ACCOUNT_STATUS" value={store.bpAccountStatusCode} /> 상태로, 조회 기능만 이용할 수 있습니다.</>} />}
      {/* 취소 · 저장은 제목 줄 오른쪽에 둔다 — 근로계약서 작성 화면(contract-form.tsx)과 같은 자리(2026-10-19 점검 — 실사용자 확인). 전에는
          화면 맨 아래에 있어 긴 폼에서 저장하려면 끝까지 스크롤해야 했다. */}
      <div className="flex items-center gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">
          {mode === "create" ? "점포 등록" : "점포 수정"}
          {store && (
            <span className="ml-[10px] text-[14px] font-medium text-erp-label">
              {store.storeCode} · <CodeLabel group="STORE_TYPE" value={store.storeTypeCode} />
            </span>
          )}
        </h2>
        <Button variant="off" href={at(store ? withBack(`/stores/${store.storeId}`, backHref) : backHref)}>
          취소
        </Button>
        <Button onClick={handleSave} disabled={saving || closedOrBlocked || bpBlocked || locating || checkingClose || createUncertain}>
          저장
        </Button>
      </div>
      {failure && <NoticeBand title={failure.title} detail={failure.detail} />}
      {store && store.storeStatusCode === "CLOSED" && <NoticeBand tone="info" title="폐점 점포는 수정할 수 없습니다." detail="다시 운영하려면 새 점포로 등록하세요." />}

      {/* 두 묶음은 같은 선에서 끝나게 높이를 맞춘다(FormGroup 상자가 flex-1 로 늘어난다, 2026-10-16 점검) */}
      <div className="grid grid-cols-2 gap-[24px]">
        <FormGroup title="점포 기본정보">
          {/* 화면에서 고칠 수 없는 점포상태를 맨 위에 두고, 그다음 점포유형을 둔다(2026-10-16 점검). 점포유형은 등록
              뒤 바꿀 수 없다 — 등록 화면에서만 큰 선택 카드로 고른다. 수정 화면에서는 이 카드를 보이지 않고, 위
              제목 줄에 점포유형 · 점포코드로만 알린다(2026-10-16 디자인 점검). */}
          <Stack>
            {mode === "create" ? (
              <Labeled label="점포상태">
                {/* 새 점포는 미운영으로만 생긴다. 운영은 등록 뒤 수정 · 상세 [상태 변경]에서(사업자 인증 · 좌표가 있어야 한다) */}
                <div className="flex h-[34px] items-center">
                  <StoreStatusBadge status="NOT_OPERATING" />
                </div>
              </Labeled>
            ) : (
              <FormRow>
                <Stack grow>
                  <Field label="점포상태" required>
                    <Select
                      value={form.storeStatus}
                      onChange={(e) => handleStatusSelect(e.target.value as StoreStatus)}
                      disabled={closedOrBlocked || statusOptions.length < 2 || checkingClose}
                      aria-invalid={invalid("storeStatus")}
                      aria-describedby={describe("storeStatus")}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(s)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  {message("storeStatus")}
                </Stack>
                {/* 점포명과 같은 폭으로 맞추려고 FormRow 로 반을 나눈다 — 오른쪽은 아직 짝이 없는 빈 자리다(2026-10-16) */}
                <div className="min-w-0 flex-1" aria-hidden="true" />
              </FormRow>
            )}
          </Stack>
          {mode === "create" && (
            <div className="flex flex-col gap-[8px]">
              <span className="text-[14px] font-medium text-erp-label">
                점포유형<RequiredMark />
              </span>
              <StoreTypeCards
                value={form.storeTypeCode}
                onChange={(v) => set("storeTypeCode", v, "storeTypeCode")}
                invalid={invalid("storeTypeCode")}
                describedBy={describe("storeTypeCode")}
              />
              {message("storeTypeCode")}
            </div>
          )}
          <FormRow>
            <Stack grow>
              <Field label="점포명" required>
                <TextField
                  value={form.name}
                  onChange={(e) => set("name", e.target.value, "name")}
                  maxLength={50}
                  placeholder="50자 이내로 입력해 주세요."
                  aria-invalid={invalid("name")}
                  aria-describedby={describe("name")}
                  aria-required
                />
              </Field>
              {message("name")}
            </Stack>
            <Stack grow>
              <PhoneGroup label="점포 연락처" value={form.phone} onChange={(v) => set("phone", v, "phone")} invalid={invalid("phone")} describedBy={describe("phone")} />
              {message("phone")}
            </Stack>
          </FormRow>
          <AddressField
            label="점포 주소"
            value={{ zipCode: form.zipCode, address: form.address, addressDetail: form.addressDetail }}
            onChange={(a) => {
              // [지우기]로 주소를 비우면 그 주소에서 나온 좌표도, 출퇴근 위치 적용 여부도 함께 미사용으로
              // 돌린다 — 주소 없이는 좌표도 없고, 좌표 없이 사용으로 남아 있으면 상세 화면에 잘못된 상태가
              // 보인다(2026-10-19 재확인 — 실사용자 지시로 되돌림. 전에는 이 값을 건드리지 않는 쪽이 근본
              // 수정이라 봤으나, 주소 없는 사용 상태 자체가 더 큰 문제로 판단해 다시 바꿨다).
              const cleared = !a.address && Boolean(form.address);
              if (cleared) {
                locateNumber.current++;
                setCoordinateNote(null);
              }
              setForm((f) => ({ ...f, ...a, ...(cleared && { latitude: "", longitude: "", isLocationApplied: false }) }));
              clearError("addressDetail");
            }}
            detailError={errors.addressDetail}
            onChoose={handleAddressChoose}
            // 운영 점포는 위도 · 경도가 있어야 하고 그 좌표는 이 주소에서 나온다 — 비워 둔 채로는 운영 상태를
            // 유지할 수 없으니 [지우기]를 숨긴다. 새 주소로 바꾸는 것(검색해 고르기)은 그대로 된다(2026-10-19).
            hideClear={mode === "edit" && form.storeStatus === "OPERATING"}
          />
          <Stack>
            <FormRow>
              <Field label="위도" width="w-[160px]">
                <TextField
                  value={form.latitude}
                  onChange={(e) => setCoordinate("latitude", e.target.value)}
                  inputMode="decimal"
                  placeholder="예: 37.556312"
                  aria-invalid={invalid("latitude")}
                  aria-describedby={describe("latitude")}
                />
              </Field>
              <Field label="경도" width="w-[160px]">
                <TextField
                  value={form.longitude}
                  onChange={(e) => setCoordinate("longitude", e.target.value)}
                  inputMode="decimal"
                  placeholder="예: 126.901845"
                  aria-invalid={invalid("longitude")}
                  aria-describedby={describe("longitude")}
                />
              </Field>
              <Field label="출퇴근 위치 적용 여부" width="w-[150px]">
                {/* 좌표(위도 · 경도)가 없으면 사용으로 고를 수 없다 — 주소를 지우거나 좌표를 손으로 비우면
                    미사용으로 되돌리는 것과 같은 규칙이다. 주소가 아니라 좌표로 가린다 — 주소는 골랐는데
                    지오코딩이 늦거나 실패한 사이, 또는 주소 없이 좌표만 손으로 적은 점포를 놓치지 않는다
                    (2026-10-19 코드 리뷰로 찾음). 막힌 이유는 아래 도움말에도 적는다(disabled 는 보통 마우스
                    오버도 받지 않아 title 만으로는 부족하다 — 코드 리뷰 지적).
                    보이는 값도 bodyOf 와 같은 조건으로 계산한다 — 좌표를 손으로 비우면(setCoordinate 는 이
                    값을 건드리지 않는다) 칸은 막힌 채 "사용"을 그대로 보이는데 저장은 조용히 "미사용"을
                    보내는 어긋남이 있었다. 상태를 고치는 대신 보이는 값을 저장 규칙과 맞춰 상태 변경 로직을
                    다시 건드리지 않는다(2026-10-19 코드 리뷰 반복 지적으로 고침). */}
                <Select
                  value={hasCoordinateInput(form.latitude, form.longitude) && form.isLocationApplied ? "Y" : "N"}
                  onChange={(e) => set("isLocationApplied", e.target.value === "Y")}
                  disabled={!hasCoordinateInput(form.latitude, form.longitude)}
                  title={hasCoordinateInput(form.latitude, form.longitude) ? undefined : "위도 · 경도가 있어야 사용으로 고를 수 있습니다."}
                >
                  <option value="Y">사용</option>
                  <option value="N">미사용</option>
                </Select>
              </Field>
              <div className="self-end">
                <Button variant="soft" onClick={handleRecalculateCoordinate} disabled={!form.address.trim() || locating || closedOrBlocked}>
                  주소로 다시 계산
                </Button>
              </div>
            </FormRow>
            {message("latitude")}
            {message("longitude")}
            {coordinateNote && <FieldMessage id={`${ids}-coordinate`} message={coordinateNote} />}
            {/* "가져오는 중입니다" 로 바꿔 보였다가 되돌아오던 것을 뺐다 — 버튼(주소로 다시 계산)을 눌러도
                도움말이 깜빡이지 않고 그대로 있는다(2026-10-19). 받는 동안 버튼·저장이 막히는 것으로 충분하다. */}
            <Note>
              점포주소가 입력되면 <b className="font-semibold">위도</b> · <b className="font-semibold">경도</b> 좌표값이 자동으로 표시됩니다.
              <br />
              <b className="font-semibold">출퇴근 위치 적용 여부</b>를 <b className="font-semibold">사용</b>으로 설정하면 이 좌표를 기준으로 직원의 출퇴근 위치를 확인할 수 있습니다.
              <br />
              위도 · 경도가 없으면 <b className="font-semibold">출퇴근 위치 적용 여부</b>를 사용으로 고를 수 없습니다.
            </Note>
          </Stack>
          <Labeled label="대표 이미지">
            <div className="flex items-end gap-[18px]">
              <StoreImage size={184} url={shownImageUrl} name={form.name.trim() || "점포"} />
              <div className="flex min-w-0 flex-col gap-[8px]">
                <div className="flex gap-[6px]">
                  <Button variant="soft" onClick={() => imageInput.current?.click()} disabled={imageLocked}>
                    {hasImage ? "이미지 바꾸기" : "이미지 올리기"}
                  </Button>
                  {hasImage && (
                    <Button
                      variant="off"
                      onClick={() => {
                        setImageError(null);
                        setImage(store?.image ? { kind: "remove" } : { kind: "keep" });
                      }}
                      disabled={imageLocked}
                    >
                      이미지 삭제
                    </Button>
                  )}
                  {image.kind !== "keep" && store?.image && (
                    <Button variant="off" onClick={() => setImage({ kind: "keep" })} disabled={imageLocked}>
                      되돌리기
                    </Button>
                  )}
                </div>
                <Note>{imageNote}</Note>
                <FieldMessage id={`${ids}-image`} message={imageError ?? undefined} />
                <input
                  ref={imageInput}
                  type="file"
                  hidden
                  accept={storeImageAccept(imageTypes)}
                  onChange={(e) => handleImagePick(e.target.files?.[0])}
                  aria-label="대표 이미지 파일"
                />
              </div>
            </div>
          </Labeled>
        </FormGroup>

        <FormGroup
          title={
            // 인증 상태는 상자 머리가 아니라 이 묶음 제목 옆에 둔다(2026-10-22 사용자 지정)
            <span className="flex items-center gap-[10px]">
              사업자정보
              <BizVerifiedStatus verified={verified} date={verifiedDate} />
            </span>
          }
        >
          {/* 순서는 사업자등록번호 인증 상자 → 상호명 → 대표자 연락처 → 업태 · 종목 → 사업자주소(2026-10-16 점검).
              인증 상자는 네 화면 공통(BizVerificationBox, S-VRNTHD) — 점포만 다른 것은 저장 뒤 재인증에서 대표자명만 연다는 것 */}
          <BizVerificationBox
            layout="row"
            showHeader={false}
            values={{ bizNumber: form.bizNumber, ceoName: form.ceoName, openDate: form.openDate }}
            onChange={setVerification}
            locked={{ bizNumber: Boolean(form.savedBizNumber || pending), ceoName: verified, openDate: Boolean(form.savedBizNumber || pending) }}
            lockedDisplay={form.savedBizNumber ? { bizNumber: formatBizNumber(form.savedBizNumber) } : {}}
            verified={verified}
            verifiedDate={verifiedDate}
            verifying={verifying}
            disabled={closedOrBlocked}
            fieldErrors={verifyFieldErrors}
            missing={missingVerify}
            boxError={errors.bizVerify}
            onVerify={verified ? handleReverify : handleVerify}
            onClear={handleClearPending}
            showClear={showBizClear}
            // 재인증하려고 열었거나 새 대표자명으로 인증만 해 둔 상태에서 저장된 값으로 돌아가는 버튼(2026-10-22 사용자 지정)
            onRevert={form.savedBizNumber && !savedLocked ? handleRevertSaved : undefined}
            // 저장한 점포는 안내를 이 두 줄만 둔다(2026-10-22 사용자 지정) — 공통 안내 한 줄은 빼고 바꾼다
            {...(form.savedBizNumber
              ? {
                  guide: (
                    <>
                      대표자 변경 시 새 대표자명으로 재인증해야 합니다.
                      <br />
                      사업자등록번호와 개업일자는 수정할 수 없으며, 인증 실패 시 기존 정보가 유지됩니다.
                    </>
                  ),
                }
              : { note: "점포 등록 시 사업자 인증은 선택사항이나, 점포상태를 ‘운영’으로 변경하려면 반드시 인증을 완료해야 합니다." })}
          />
          <FormRow>
            <Stack grow>
              <Field label="상호명">
                <TextField
                  value={form.tradeName}
                  onChange={(e) => set("tradeName", e.target.value, "tradeName")}
                  maxLength={50}
                  placeholder="50자 이내로 입력해 주세요."
                  aria-invalid={invalid("tradeName")}
                  aria-describedby={describe("tradeName")}
                />
              </Field>
              {message("tradeName")}
            </Stack>
            <Stack grow>
              <PhoneGroup label="대표자 연락처" value={form.ceoPhone} onChange={(v) => set("ceoPhone", v, "ceoPhone")} invalid={invalid("ceoPhone")} describedBy={describe("ceoPhone")} />
              {message("ceoPhone")}
            </Stack>
          </FormRow>
          <FormRow>
            <Stack grow>
              <Field label="업태">
                <TextField
                  value={form.bizCategory}
                  onChange={(e) => set("bizCategory", e.target.value, "bizCategory")}
                  maxLength={50}
                  placeholder="50자 이내로 입력해 주세요."
                  aria-invalid={invalid("bizCategory")}
                  aria-describedby={describe("bizCategory")}
                />
              </Field>
              {message("bizCategory")}
            </Stack>
            <Stack grow>
              <Field label="종목">
                <TextField
                  value={form.bizItem}
                  onChange={(e) => set("bizItem", e.target.value, "bizItem")}
                  maxLength={50}
                  placeholder="50자 이내로 입력해 주세요."
                  aria-invalid={invalid("bizItem")}
                  aria-describedby={describe("bizItem")}
                />
              </Field>
              {message("bizItem")}
            </Stack>
          </FormRow>
          {/* 늘 보이고, 체크하면(기본값) 점포 주소를 그대로 보여 주기만 한다 — 체크박스는 "사업자주소" 라벨 줄
              바로 옆에 둔다(2026-10-16 점검). */}
          <Stack>
            <AddressField
              label="사업자주소"
              labelExtra={
                <Checkbox
                  label="점포 주소와 같음"
                  checked={form.bizSameAsStore}
                  onChange={(e) => set("bizSameAsStore", e.target.checked, "bizAddressDetail")}
                />
              }
              value={
                form.bizSameAsStore
                  ? { zipCode: form.zipCode, address: form.address, addressDetail: form.addressDetail }
                  : { zipCode: form.bizZipCode, address: form.bizAddress, addressDetail: form.bizAddressDetail }
              }
              onChange={(a) => {
                setForm((f) => ({ ...f, bizZipCode: a.zipCode, bizAddress: a.address, bizAddressDetail: a.addressDetail }));
                clearError("bizAddressDetail");
              }}
              detailError={errors.bizAddressDetail}
              disabled={form.bizSameAsStore}
            />
          </Stack>
        </FormGroup>
      </div>

      <FormGroup title="점포 공간정보">
        <FloorTable
          rows={form.floors}
          onChange={(rows) => set("floors", rows, "floors")}
          invalid={invalid("floors")}
          describedBy={describe("floors")}
        />
        {message("floors")}
      </FormGroup>

      <ConfirmDialog open={dialog === "close-blocked"} title="폐점할 수 없습니다" confirmLabel="확인" onConfirm={() => setDialog(null)} onCancel={() => setDialog(null)}>
        <p>{closeBlock}</p>
        <p className="mt-[6px] text-erp-label">점포상태를 이전 값으로 되돌렸습니다.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "close-confirm"}
        title="폐점으로 저장할까요?"
        confirmLabel="폐점으로 저장"
        busy={saving}
        onConfirm={handleSaveConfirm}
        onCancel={() => setDialog(null)}
      >
        <p>폐점일은 오늘로 정해지고 되돌릴 수 없습니다. 다음 날부터 이 점포에는 BP 휴일이 적용되지 않습니다. 다른 수정 내용도 함께 저장됩니다.</p>
      </ConfirmDialog>
    </div>
  );
}

/**
 * 칸과 그 아래 문구를 세로로 — 문구가 라벨 밖에 있어야 입력칸의 접근 가능한 이름에 섞이지 않는다.
 * grow(FormRow 안에 나란히 둘 때)는 위로 맞춘다(self-start) — 늘이면 옆 칸에만 오류 문구가 붙었을 때 이 칸이 그 높이로
 * 늘어나고, 공통 Field 가 라벨 · 입력칸을 세로 가운데로 두어 입력칸이 아래로 밀렸다(2026-10-23, 인증 상자와 같은 문제).
 */
function Stack({ children, grow }: { children: ReactNode; grow?: boolean }) {
  return <div className={`flex flex-col gap-[8px] ${grow ? "min-w-0 flex-1 self-start" : ""}`}>{children}</div>;
}

/** 입력칸이 여럿이거나 입력칸이 아닌 칸(연락처 세 칸 · 날짜 · 배지). Field 는 라벨이 입력칸 하나를 감싸므로 묶음 이름만 단다 */
function Labeled({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex min-w-0 flex-1 flex-col gap-[8px]">
      <span className="text-[14px] font-medium text-erp-label">
        {label}
        {required && <RequiredMark />}
      </span>
      {children}
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-[13px] leading-[1.6] text-erp-label">{children}</p>;
}

/** 전화번호 세 칸 — 숫자만 받는다 */
function PhoneGroup({
  label,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  label: string;
  value: PhoneParts;
  onChange: (next: PhoneParts) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <Labeled label={label}>
      <FormRow>
        {(["앞자리", "가운데자리", "끝자리"] as const).map((part, i) => (
          <TextField
            key={part}
            value={value[i]}
            onChange={(e) => {
              const next = [...value] as PhoneParts;
              next[i] = e.target.value.replace(/[^0-9]/g, "");
              onChange(next);
            }}
            inputMode="numeric"
            // 앞자리도 4자리 — 050X 평생번호(0507 등). 길이 검사는 저장 때 전체 자릿수로 한다(validateStoreForm 의 PHONE_PATTERN)
            maxLength={4}
            aria-label={`${label} ${part}`}
            aria-invalid={invalid}
            aria-describedby={describedBy}
          />
        ))}
      </FormRow>
    </Labeled>
  );
}

/** 층별 표 — 줄 추가 · 삭제. 지상/지하 + 층수 · 매장평수(소수 1자리) · 전용면적(소수 2자리) · 좌석수(0 이상 정수). 모두 선택 */
function FloorTable({
  rows,
  onChange,
  invalid,
  describedBy,
}: {
  rows: FloorRow[];
  onChange: (rows: FloorRow[]) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const floorTypeLabel = useCodeLabel("FLOOR_TYPE");
  const update = (key: string, patch: Partial<FloorRow>) => onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const indexOf = (row: FloorRow) => rows.findIndex((r) => r.key === row.key);
  const numberCell = (row: FloorRow, field: "floorAreaPyeong" | "floorAreaSqm" | "seatCount", width: `w-[${number}px]`, label: string, unit: string, decimal: boolean) => (
    <div className="flex items-center justify-center gap-[6px]">
      <div className={width}>
        <TextField
          value={row[field]}
          onChange={(e) => update(row.key, { [field]: e.target.value.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, "") })}
          inputMode={decimal ? "decimal" : "numeric"}
          aria-label={label}
          aria-invalid={invalid}
          aria-describedby={describedBy}
        />
      </div>
      <span className="shrink-0 text-[14px] text-erp-label">{unit}</span>
    </div>
  );
  // 데모(docs/demo/src/biz-form.mjs 의 floorTable)와 같은 표 모양으로 되돌렸다 — 고정 그리드로 좁혔던
  // 버전은 데모와 어긋나 데모 쪽을 기준으로 삼기로 했다(2026-10-19). [층 추가]는 표 위 왼쪽에 둔다.
  // 다섯 칸 너비를 모두 같게 맞춘다 — 층구분 칸만 너비 지정이 없어 남는 폭을 혼자 다 먹고 있었다(2026-10-19).
  const COLUMN_WIDTH = "w-[190px]";
  const columns: Column<FloorRow>[] = [
    {
      header: "층구분",
      width: COLUMN_WIDTH,
      cell: (row) => (
        <div className="flex items-center justify-center gap-[6px]">
          <div className="w-[80px]">
            <Select
              value={row.floorTypeCode}
              onChange={(e) => update(row.key, { floorTypeCode: e.target.value })}
              aria-label={`${indexOf(row) + 1}번째 층 구분`}
            >
              {/* 저장된 줄의 빈 값 · 모르는 값도 그대로 보인다 — 선택지에 없으면 브라우저가 첫 항목(지상)을 보여 주지만 값은 그대로라 화면과 저장이 어긋난다 */}
              {!row.floorTypeCode && <option value="">선택</option>}
              {row.floorTypeCode && !floorTypeOf(row.floorTypeCode) && <option value={row.floorTypeCode}>{row.floorTypeCode}</option>}
              {FLOOR_TYPES.map((t) => (
                <option key={t} value={t}>
                  {floorTypeLabel(t)}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-[64px]">
            <TextField
              value={row.floorNumber}
              onChange={(e) => update(row.key, { floorNumber: e.target.value.replace(/[^0-9]/g, "") })}
              inputMode="numeric"
              aria-label={`${indexOf(row) + 1}번째 층수`}
              aria-invalid={invalid}
              aria-describedby={describedBy}
            />
          </div>
          <span className="shrink-0 text-[14px] text-erp-label">층</span>
        </div>
      ),
    },
    { header: "매장평수(평)", width: COLUMN_WIDTH, cell: (row) => numberCell(row, "floorAreaPyeong", "w-[96px]", `${indexOf(row) + 1}번째 매장평수`, "평", true) },
    { header: "전용면적(㎡)", width: COLUMN_WIDTH, cell: (row) => numberCell(row, "floorAreaSqm", "w-[96px]", `${indexOf(row) + 1}번째 전용면적`, "㎡", true) },
    { header: "좌석 수", width: COLUMN_WIDTH, cell: (row) => numberCell(row, "seatCount", "w-[80px]", `${indexOf(row) + 1}번째 좌석수`, "석", false) },
    {
      header: "삭제",
      width: COLUMN_WIDTH,
      cell: (row) => (
        <Button variant="off" onClick={() => onChange(rows.filter((r) => r.key !== row.key))}>
          삭제
        </Button>
      ),
    },
  ];
  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <Button variant="soft" onClick={() => onChange([...rows, newFloorRow()])}>
          층 추가
        </Button>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.key}
        empty="등록된 층별 정보가 없습니다. ‘층 추가’를 눌러 면적과 좌석 수를 입력해 주세요."
      />
    </div>
  );
}
