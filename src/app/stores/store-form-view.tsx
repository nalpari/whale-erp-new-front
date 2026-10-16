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
  DateField,
  Field,
  FormGroup,
  FormRow,
  RequiredMark,
  Select,
  TextField,
  useToast,
} from "@/components/common";
import {
  EMPTY_STORE_FORM,
  formOfStore,
  isBusinessVerified,
  newFloorRow,
  storeServerErrors,
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
import { FLOOR_TYPES, floorTypeOf, type StoreDetail, type StoreImageFileType, type StoreStatus } from "@/lib/store-types";
import { closeBlockText, formatBizNumber, nextStatuses } from "@/lib/store-view";
import { useCodeLabel } from "@/components/site/code-label";
import { useCurrentBp } from "@/components/site/session-gate";
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

/** 동시 수정 409 문구(api). 이때만 최신 정보를 다시 불러온다 */
const STALE = "먼저 수정했습니다";
/** 저장이 막혔을 때 띠 아래 줄 — 칸은 건드리지 않았다 */
const KEPT = "입력한 값은 그대로 두었습니다.";

const VERIFY_MESSAGE = {
  UNVERIFIABLE: "사업자정보를 확인할 수 없습니다. 사업자등록번호 · 대표자명 · 개업일자를 다시 확인해 주세요.",
  DUPLICATE: "이미 다른 점포가 쓰고 있는 사업자등록번호입니다.",
} as const;

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
  | { mode: "edit"; store: StoreDetail; backHref: string; imageTypes: readonly StoreImageFileType[] };

/**
 * 점포 등록(S-ALHLHW) · 수정(S-JEPOMK) 공용 폼. 데모 docs/demo/stores/new · edit 의 배치 — 점포유형 큰 카드, 기본정보 ·
 * 사업자정보 나란히, 기타 정보 · 층별, [취소] [저장]. 저장하면 상세로 간다.
 * 필수는 점포유형 · 점포명뿐이다. 수정에서 점포유형은 잠기고, 점포상태는 지금 상태에서 갈 수 있는 곳만 고른다.
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
  // 등록할 BP — 이 탭의 BP(플랫폼 계정이 고른 BP, 그 밖은 소속 BP)
  const currentBp = useCurrentBp();
  const toast = useToast();
  const ids = useId();
  const initialForm = () => (props.mode === "edit" ? formOfStore(props.store) : EMPTY_STORE_FORM);
  const [form, setForm] = useState<StoreForm>(initialForm);
  const [errors, setErrors] = useState<StoreFormErrors>({});
  const [failure, setFailure] = useState<{ title: string; detail?: ReactNode } | null>(null);
  // 등록 결과를 모르면(저장됐을 수도) 다시 저장해 둘이 생기지 않게 저장을 잠근다
  const [createUncertain, setCreateUncertain] = useState(false);
  const [verifyNote, setVerifyNote] = useState<string | null>(null);
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
  }

  const store = props.mode === "edit" ? props.store : null;
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

  /** api 가 거절한 이유를 칸마다 나눠 붙이고(검증 실패는 문장이 여럿), 칸을 못 찾은 문장은 위 띠로 */
  const applyServerError = (failure: ActionFailure) => {
    const messages = failure.messages?.length ? failure.messages : [failure.message];
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
      focusFirstError();
    }
  };

  /**
   * 점포 주소를 고르면 그 건물의 위도 · 경도를 받아 채운다. 앞 주소의 좌표가 새 주소에 남지 않게 먼저 비우고, 못 받으면 비운 채
   * 이유를 알린다(좌표는 출퇴근 반경 판정에 쓰여 틀린 값이 빈 값보다 위험하다). 받는 동안 위도 · 경도를 직접 고치면 결과를 버린다.
   */
  const handleAddressChoose = (item: AddressItem) => {
    const mine = ++locateNumber.current;
    setCoordinateNote(null);
    setForm((f) => ({ ...f, latitude: "", longitude: "" }));
    startLocating(async () => {
      const result = await getAddressCoordinateAction(item.roadAddressBase, item.jibunAddress).catch((error: unknown) => {
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
    set(key, value.trim(), key);
  };

  /** 진위확인 칸을 고치면 이번 화면의 인증 결과는 무효다 */
  const setVerification = (key: "bizNumber" | "ceoName" | "openDate", value: string) => {
    verifyNumber.current++;
    setForm((f) => ({ ...f, [key]: value, verified: null }));
    clearError(key);
    setVerifyNote(null);
  };

  const handleVerify = () => {
    const found = verificationErrors(form);
    setErrors((e) => {
      const rest = Object.fromEntries(Object.entries(e).filter(([k]) => !["bizNumber", "ceoName", "openDate"].includes(k)));
      return { ...rest, ...found };
    });
    setVerifyNote(null);
    if (Object.keys(found).length) return focusFirstError();
    const values = verificationValuesOf(form);
    const mine = ++verifyNumber.current;
    startVerifying(async () => {
      const result = await verifyStoreBusinessAction({
        bizRegistrationNumber: values.bizNumber,
        ceoName: values.ceoName,
        openDate: values.openDate,
        ...(store ? { storeId: store.storeId } : {}),
      }).catch(unknownResult("사업자정보 인증"));
      // 기다리는 사이 진위확인 칸을 고쳤으면 이 응답은 옛 값의 것이다 — 버린다(저장도 지금 칸 값과 같을 때만 인증으로 본다)
      if (mine !== verifyNumber.current) return;
      if (!result.ok) return setErrors((e) => ({ ...e, bizNumber: result.message }));
      if (result.result === "DUPLICATE") return setErrors((e) => ({ ...e, bizNumber: VERIFY_MESSAGE.DUPLICATE }));
      if (result.result === "UNVERIFIABLE") return setErrors((e) => ({ ...e, ceoName: VERIFY_MESSAGE.UNVERIFIABLE }));
      setForm((f) => ({ ...f, verified: values }));
      setVerifyNote("확인했습니다. 저장하면 사업자정보에 반영됩니다.");
    });
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
                <Link href={backHref} className="text-erp-link underline">
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
        return router.push(`/stores/${result.storeId}${imageResult && !imageResult.ok ? `?imageFailed=${imageResult.status ?? "error"}` : ""}`);
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
        return router.push(`/stores/${props.store.storeId}${backHref === "/stores" ? "" : `?back=${encodeURIComponent(backHref)}`}`);
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
    const found = validateStoreForm(form, mode);
    setErrors(found);
    setFailure(null);
    if (Object.keys(found).length) return focusFirstError();
    // 폐점은 되돌릴 수 없어 한 번 더 묻는다. 조건은 저장(PUT)을 받은 api 가 다시 본다(화면은 고를 때 한 번 확인했다)
    if (store && form.storeStatus === "CLOSED" && store.storeStatusCode !== "CLOSED") return setDialog("close-confirm");
    handleSaveConfirm();
  };

  const statusOptions = store ? nextStatuses(store.storeStatusCode) : [];
  const hasImage = image.kind === "new" || (image.kind === "keep" && Boolean(store?.image));
  const shownImageUrl = image.kind === "new" ? image.previewUrl : image.kind === "remove" ? null : (store?.image?.url ?? null);
  const imageLocked = saving || checkingClose || closedOrBlocked || imageTypes.length === 0;
  const imageNote =
    imageTypes.length === 0
      ? "올릴 수 있는 형식을 불러오지 못해 지금은 이미지를 바꿀 수 없습니다. 계속되면 관리자에게 알려 주세요."
      : image.kind === "new"
        ? `${image.file.name} — 저장하면 올립니다.`
        : image.kind === "remove"
          ? "저장하면 대표 이미지를 지웁니다."
          : `${storeImageTypesText(imageTypes)} 5MB 이하 1장. 고른 뒤 저장해야 반영됩니다.`;
  const verified = isBusinessVerified(form);

  return (
    <div id={`${ids}-form`} className="flex flex-col gap-[24px]">
      <div className="flex items-center gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">
          {mode === "create" ? "점포 등록" : "점포 수정"}
          {store && (
            <span className="ml-[10px] text-[14px] font-medium text-erp-label">
              {store.name} · {store.storeCode}
            </span>
          )}
        </h2>
      </div>
      {failure && <NoticeBand title={failure.title} detail={failure.detail} />}
      {store && store.storeStatusCode === "CLOSED" && <NoticeBand tone="info" title="폐점 점포는 수정할 수 없습니다." detail="다시 운영하려면 새 점포로 등록하세요." />}
      {store && store.bpAccountStatusCode !== "ACTIVE" && <NoticeBand title="소속 BP 가 미사용 상태여서 이 업무를 할 수 없습니다." />}

      <FormGroup title="점포유형">
        <div className="flex flex-col gap-[8px]">
          <span className="text-[14px] font-medium text-erp-label">
            점포유형<RequiredMark />
            {mode === "edit" && <span className="ml-[6px] font-normal">등록 뒤에는 바꿀 수 없습니다</span>}
          </span>
          <StoreTypeCards
            value={form.storeTypeCode}
            locked={mode === "edit"}
            onChange={(v) => set("storeTypeCode", v, "storeTypeCode")}
            invalid={invalid("storeTypeCode")}
            describedBy={describe("storeTypeCode")}
          />
          {message("storeTypeCode")}
        </div>
      </FormGroup>

      {/* 두 묶음은 각자 내용만큼의 높이로 둔다 — 높이를 맞추려 늘리면 짧은 쪽에 빈 자리가 남는다 */}
      <div className="grid grid-cols-2 items-start gap-[24px]">
        <FormGroup title="점포 기본정보">
          <Stack>
            {mode === "create" ? (
              <Labeled label="점포상태">
                {/* 새 점포는 미운영으로만 생긴다. 운영은 등록 뒤 수정 · 상세 [상태 변경]에서(사업자 인증 · 좌표가 있어야 한다) */}
                <div className="flex h-[34px] items-center">
                  <StoreStatusBadge status="NOT_OPERATING" />
                </div>
              </Labeled>
            ) : (
              <>
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
              </>
            )}
          </Stack>
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
              // [지우기]로 주소를 비우면 그 주소의 좌표도 지운다 — 받는 중이던 좌표도 버린다
              const cleared = !a.address && Boolean(form.address);
              if (cleared) {
                locateNumber.current++;
                setCoordinateNote(null);
              }
              setForm((f) => ({ ...f, ...a, ...(cleared && { latitude: "", longitude: "" }) }));
              clearError("addressDetail");
            }}
            detailError={errors.addressDetail}
            onChoose={handleAddressChoose}
          />
          <Stack>
            <FormRow>
              <Field label="위도" width="w-[130px]">
                <TextField
                  value={form.latitude}
                  onChange={(e) => setCoordinate("latitude", e.target.value)}
                  inputMode="decimal"
                  placeholder="37.556312"
                  aria-invalid={invalid("latitude")}
                  aria-describedby={describe("latitude")}
                />
              </Field>
              <Field label="경도" width="w-[130px]">
                <TextField
                  value={form.longitude}
                  onChange={(e) => setCoordinate("longitude", e.target.value)}
                  inputMode="decimal"
                  placeholder="126.901845"
                  aria-invalid={invalid("longitude")}
                  aria-describedby={describe("longitude")}
                />
              </Field>
              <Field label="위치 적용 여부" width="w-[120px]">
                <Select value={form.isLocationApplied ? "Y" : "N"} onChange={(e) => set("isLocationApplied", e.target.value === "Y")}>
                  <option value="Y">사용</option>
                  <option value="N">미사용</option>
                </Select>
              </Field>
            </FormRow>
            {message("latitude")}
            {message("longitude")}
            {coordinateNote && <FieldMessage id={`${ids}-coordinate`} message={coordinateNote} />}
            <Note>
              {locating
                ? "고른 주소의 위도 · 경도를 가져오는 중입니다."
                : "점포 주소를 검색해 고르면 위도 · 경도가 채워집니다. 직접 고칠 수도 있습니다. 운영 점포는 위도 · 경도가 있어야 합니다."}
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

        <FormGroup title={`점포 사업자정보 · ${verified ? "인증 완료" : "미인증"}`}>
          <Stack>
            <span className="text-[14px] font-medium text-erp-label">{form.savedBizNumber ? "사업자 번호 재인증" : "사업자 번호 인증"}</span>
            <FormRow>
              <Field label="사업자등록번호">
                <TextField
                  value={form.savedBizNumber ? formatBizNumber(form.savedBizNumber) : form.bizNumber}
                  onChange={(e) => setVerification("bizNumber", e.target.value.replace(/[^0-9-]/g, ""))}
                  disabled={Boolean(form.savedBizNumber) || closedOrBlocked}
                  placeholder="000-00-00000"
                  maxLength={12}
                  aria-invalid={invalid("bizNumber")}
                  aria-describedby={describe("bizNumber")}
                />
              </Field>
              <Field label="대표자명">
                <TextField
                  value={form.ceoName}
                  onChange={(e) => setVerification("ceoName", e.target.value)}
                  disabled={closedOrBlocked}
                  maxLength={50}
                  aria-invalid={invalid("ceoName")}
                  aria-describedby={describe("ceoName")}
                />
              </Field>
              <Labeled label="개업일자">
                {form.savedBizNumber ? (
                  <TextField value={form.openDate} disabled aria-label="개업일자" />
                ) : (
                  <DateField value={form.openDate} onChange={(v) => setVerification("openDate", v)} disabled={closedOrBlocked} aria-label="개업일자" />
                )}
              </Labeled>
              <div className="shrink-0 self-end">
                <Button variant="soft" onClick={handleVerify} disabled={verifying || closedOrBlocked}>
                  {form.savedBizNumber ? "재인증" : "인증하기"}
                </Button>
              </div>
            </FormRow>
            {message("bizNumber")}
            {message("ceoName")}
            {message("openDate")}
            {verifyNote && (
              <p role="status" className="text-[13px] leading-[1.5] text-erp-on">
                {verifyNote}
              </p>
            )}
            <Note>
              {form.savedBizNumber
                ? "대표자가 바뀌었을 때 새 이름으로 다시 확인합니다. 번호와 개업일자는 바꿀 수 없고, 재인증에 실패해도 기존 사업자정보는 그대로입니다."
                : "국세청에 사업자등록번호 · 대표자명 · 개업일자의 진위를 확인합니다. 등록 때는 선택이고 운영으로 바꿀 때 필요합니다."}
            </Note>
          </Stack>
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
          <Stack>
            <Checkbox label="사업자주소가 점포 주소와 같음" checked={form.bizSameAsStore} onChange={(e) => set("bizSameAsStore", e.target.checked, "bizAddressDetail")} />
            {!form.bizSameAsStore && (
              <AddressField
                label="사업자주소"
                value={{ zipCode: form.bizZipCode, address: form.bizAddress, addressDetail: form.bizAddressDetail }}
                onChange={(a) => {
                  setForm((f) => ({ ...f, bizZipCode: a.zipCode, bizAddress: a.address, bizAddressDetail: a.addressDetail }));
                  clearError("bizAddressDetail");
                }}
                detailError={errors.bizAddressDetail}
              />
            )}
          </Stack>
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
        </FormGroup>
      </div>

      <FormGroup title="기타 정보 · 층별">
        <FloorTable
          rows={form.floors}
          onChange={(rows) => set("floors", rows, "floors")}
          invalid={invalid("floors")}
          describedBy={describe("floors")}
        />
        {message("floors")}
      </FormGroup>

      <div className="flex justify-center gap-[6px]">
        <Button variant="off" href={store ? `/stores/${store.storeId}${backHref === "/stores" ? "" : `?back=${encodeURIComponent(backHref)}`}` : backHref}>
          취소
        </Button>
        <Button onClick={handleSave} disabled={saving || closedOrBlocked || locating || checkingClose || createUncertain}>
          저장
        </Button>
      </div>

      <ConfirmDialog open={dialog === "close-blocked"} title="폐점할 수 없습니다" confirmLabel="확인" onConfirm={() => setDialog(null)} onCancel={() => setDialog(null)}>
        <p>{closeBlock}</p>
        <p className="mt-[6px] text-erp-label">점포상태를 이전 값으로 되돌렸습니다. 이용 중인 구독 · 정산 대기는 1차 범위 밖이라 보지 않습니다.</p>
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

/** 칸과 그 아래 문구를 세로로 — 문구가 라벨 밖에 있어야 입력칸의 접근 가능한 이름에 섞이지 않는다 */
function Stack({ children, grow }: { children: ReactNode; grow?: boolean }) {
  return <div className={`flex flex-col gap-[8px] ${grow ? "min-w-0 flex-1" : ""}`}>{children}</div>;
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
            maxLength={i === 0 ? 3 : 4}
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
  const numberCell = (row: FloorRow, field: "floorNumber" | "floorAreaPyeong" | "floorAreaSqm" | "seatCount", label: string, unit: string, decimal: boolean) => (
    <div className="flex items-center gap-[6px]">
      <TextField
        value={row[field]}
        onChange={(e) => update(row.key, { [field]: e.target.value.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, "") })}
        inputMode={decimal ? "decimal" : "numeric"}
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      <span className="shrink-0 text-[14px] text-erp-label">{unit}</span>
    </div>
  );
  return (
    <div className="flex flex-col gap-[10px]">
      {rows.length === 0 ? (
        <p className="text-[14px] text-erp-muted">등록한 층별 정보가 없습니다. 층을 추가해 적어 주세요.</p>
      ) : (
        <ul className="flex flex-col gap-[10px]">
          {rows.map((row, i) => (
            <li key={row.key} className="grid grid-cols-[100px_100px_1fr_1fr_1fr_auto] items-center gap-[6px]">
              <Select
                value={row.floorTypeCode}
                onChange={(e) => update(row.key, { floorTypeCode: e.target.value })}
                aria-label={`${i + 1}번째 층 구분`}
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
              {numberCell(row, "floorNumber", `${i + 1}번째 층수`, "층", false)}
              {numberCell(row, "floorAreaPyeong", `${i + 1}번째 매장평수`, "평", true)}
              {numberCell(row, "floorAreaSqm", `${i + 1}번째 전용면적`, "㎡", true)}
              {numberCell(row, "seatCount", `${i + 1}번째 좌석수`, "석", false)}
              <Button variant="off" onClick={() => onChange(rows.filter((r) => r.key !== row.key))}>
                삭제
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div>
        <Button variant="soft" onClick={() => onChange([...rows, newFloorRow()])}>
          층 추가
        </Button>
      </div>
    </div>
  );
}
