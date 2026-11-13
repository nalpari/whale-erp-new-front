"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition, type ReactNode } from "react";
import { AddressField } from "@/components/address-field";
import {
  AttachmentField,
  Button,
  DateField,
  Field,
  FieldMessage,
  FormGroup,
  FormRow,
  NoticeBand,
  Radio,
  RequiredMark,
  Select,
  Tag,
  TextField,
  Textarea,
  Toggle,
  useFilePreviews,
  useToast,
  type AttachmentRow,
  type RejectedFile,
} from "@/components/common";
import { FIELD } from "@/components/common/theme";
import { useCodes, useCurrentBp } from "@/components/site/session-gate";
import { bpPath } from "@/lib/bp-path";
import { labelOf, type EnumValue } from "@/lib/enums";
import type { FacilityDetail, FacilityDocument, FacilityManagerOption, FacilityStoreOption } from "@/lib/facilities";
import { createFacilityAction, deleteFacilityDocumentAction, getManagerOptionsAction, updateFacilityAction } from "./actions";
import {
  bodyOf,
  CYCLE_GROUP,
  digitsOf,
  DOCUMENT_ACCEPT,
  DOCUMENT_COUNT_ERROR,
  DOCUMENT_KINDS,
  documentFileError,
  FACILITY_GROUPS,
  filledCounts,
  formOf,
  initialForm,
  isFacilityGroup,
  MEMO_MAX,
  problems,
  REPRESENTATIVE_PHONE_FIELDS,
  splitPhone,
  STATUS_GROUP,
  totalText,
  withCommas,
  type FacilityDocumentKind,
  type FacilityForm as Form,
  type FacilityFormField,
  type PhoneParts,
} from "./facility-form-model";
import { withBack } from "./facility-list-query";
import { MASKED_STAFF } from "../todos/todo-row";

/** 문서 한 종류의 상태 — 올려 둔 것(수정) · 뺀다는 표시 · 새로 고른 파일 · 고르지 못한 파일과 까닭 */
type DocState = { existing: FacilityDocument | null; removed: boolean; file: File | null; rejected: RejectedFile[] };
type Docs = Record<FacilityDocumentKind, DocState>;
type FoldKey = "product" | "purchase" | "documents" | "manage";

/** 어느 칸의 오류가 어느 접힌 묶음 안에 있는가 — 검사에 걸리면 그 묶음을 펼친다 */
const FOLD_OF: Partial<Record<FacilityFormField, FoldKey>> = {
  vendorPhone: "purchase",
  salesRepresentativePhone: "purchase",
  unitPrice: "purchase",
  quantity: "purchase",
  installationDate: "purchase",
  managerPhone: "manage",
  serviceCenterPhone: "manage",
};

type Props = {
  backHref: string;
  kindLabels: EnumValue[];
} & ({ mode: "create"; storeOptions: FacilityStoreOption[] } | { mode: "edit"; facility: FacilityDetail; managerOptions: FacilityManagerOption[] });

/**
 * 시설물 · 장비 등록 · 수정 폼(목업 docs/mockup/stores/facilities-new.html · edit.html, 데모 stores/facilities-new.mjs). 점포 등록처럼 별도 화면이다.
 * 위에 기본 정보(필수 다섯 칸 + 메모, 늘 펼침), 아래 상세 정보 네 묶음(제품 정보 / 구매 정보 / 기한 · 문서 / 관리 · A/S)을 두 단에 둘씩 놓는다 — 등록은 모두 접고, 수정은 값이 있는 묶음만 펼친다.
 * [저장]을 누르면 검사하고, 걸린 칸 바로 아래 빨간 문구 · 첫 오류 칸으로 옮긴다(알럿 없음). 값을 고치면 그 칸 문구를 내린다(PL-5).
 * 서버 실패처럼 칸에 묶이지 않는 오류만 화면 위 띠다.
 * 등록: 점포는 고를 수 있는 점포(폐점 제외) 하나, 문서는 등록 응답의 facilityId 로 종류마다 올린다(documents/route.ts).
 * 수정: 점포는 읽기 전용(PL-1), 상세의 updatedAt 을 함께 보내 그 사이 고친 사람이 있으면 409. 미사용 분류 · 점검 주기는 지금 값으로 남는다(PL-3).
 * 관리 정보는 따로 지우지 않고 칸을 비워 저장한다(PL-4). 문서 「빼기」는 저장할 때 DELETE 로 보낸다.
 */
export function FacilityFormView(props: Props) {
  const { mode, backHref, kindLabels } = props;
  const facility = mode === "edit" ? props.facility : null;
  const router = useRouter();
  const toast = useToast();
  const bp = useCurrentBp().bpCodeId;
  const ids = useId();
  const at = (path: string) => bpPath(bp, path);

  const statuses = useCodes(STATUS_GROUP);
  const cycles = useCodes(CYCLE_GROUP);
  const facilityCategories = useCodes("STORE_FACILITY");
  const equipmentCategories = useCodes("STORE_EQUIPMENT");

  const [form, setForm] = useState<Form>(() => (facility ? formOf(facility) : initialForm()));
  const [errors, setErrors] = useState<Partial<Record<FacilityFormField, string>>>({});
  const [failure, setFailure] = useState<{ title: string; detail?: string } | null>(null);
  const [saving, startSave] = useTransition();
  const [docs, setDocs] = useState<Docs>(() =>
    Object.fromEntries(
      DOCUMENT_KINDS.map((k): [FacilityDocumentKind, DocState] => [k, { existing: facility?.documents.find((d) => d.documentKind === k) ?? null, removed: false, file: null, rejected: [] }]),
    ) as Docs,
  );
  // 등록은 모두 접힌 채로, 수정은 입력한 값이 있는 묶음만 펼친 채로 시작한다(2026-11-11 사용자 지정 — 전엔 수정은 모두 펼침)
  const [open, setOpen] = useState<Record<FoldKey, boolean>>(() => {
    if (!facility) return { product: false, purchase: false, documents: false, manage: false };
    const has = Object.fromEntries(DOCUMENT_KINDS.map((k) => [k, facility.documents.some((d) => d.documentKind === k)])) as Record<FacilityDocumentKind, boolean>;
    const c = filledCounts(formOf(facility), has);
    return { product: c.product.filled > 0, purchase: c.purchase.filled > 0, documents: c.documents.filled > 0, manage: c.manage.filled > 0 };
  });

  // 관리 담당자 선택지 — 수정은 그 점포의 것을 받아 오고, 등록은 점포를 고를 때마다 받는다
  const [managers, setManagers] = useState<FacilityManagerOption[]>(mode === "edit" ? props.managerOptions : []);
  const [managerNote, setManagerNote] = useState<string | null>(null);
  const managerRequest = useRef(0);

  const set = <K extends keyof Form>(key: K, value: Form[K], field?: FacilityFormField) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (field) clearError(field);
  };
  const clearError = (...fields: FacilityFormField[]) =>
    setErrors((e) => (fields.some((f) => e[f]) ? Object.fromEntries(Object.entries(e).filter(([k]) => !fields.includes(k as FacilityFormField))) : e));
  const message = (field: FacilityFormField) => <FieldMessage id={`${ids}-${field}-error`} message={errors[field]} />;
  const describe = (field: FacilityFormField) => (errors[field] ? `${ids}-${field}-error` : undefined);

  const pickStore = (storeId: number | null) => {
    setForm((f) => ({ ...f, storeId, managerStaffMemberId: null, managerPhone: ["", "", ""] }));
    clearError("store");
    setManagers([]);
    setManagerNote(null);
    if (storeId === null) return;
    const ticket = ++managerRequest.current;
    void getManagerOptionsAction(storeId)
      .catch((e: unknown) => {
        console.error("관리 담당자 조회 호출 실패", { storeId }, e);
        return { ok: false as const, message: "관리 담당자 목록을 불러오지 못했습니다." };
      })
      .then((result) => {
        // 늦게 온 응답(그 사이 다른 점포를 고름)은 버린다
        if (ticket !== managerRequest.current) return;
        if (result.ok) setManagers(result.items);
        else setManagerNote(`${result.message} 점포를 다시 골라 주세요.`);
      });
  };

  const groupCategories = form.groupCode === "STORE_FACILITY" ? facilityCategories : form.groupCode === "STORE_EQUIPMENT" ? equipmentCategories : [];
  // 수정 화면의 지금 분류가 사용 목록에 없으면(미사용) 「(미사용)」으로 남겨 둔다 — 다른 값으로 바꾸면 다시 고를 수 없다(PL-3)
  const keptCategory =
    facility && form.groupCode === facility.facilityGroupCode && !groupCategories.some((c) => c.value === facility.facilityCategoryCode)
      ? { value: facility.facilityCategoryCode, label: `${facility.facilityCategoryLabel} (미사용)` }
      : null;
  const categoryOptions = [...(keptCategory ? [keptCategory] : []), ...groupCategories];
  const keptCycle =
    facility?.inspectionCycleCode && !cycles.some((c) => c.value === facility.inspectionCycleCode)
      ? { value: facility.inspectionCycleCode, label: `${facility.inspectionCycleLabel ?? facility.inspectionCycleCode} (미사용)` }
      : null;
  const cycleOptions = [...(keptCycle ? [keptCycle] : []), ...cycles];
  // 수정 화면의 지금 담당자가 선택지에 없으면(그 뒤 퇴직) 그대로 남겨 둔다 — api 도 지금 값이면 받는다
  // 가려진 담당자(본사 가림 ATT-30)는 선택지에 없고 이름도 null 이라 가림 문구로 남긴다 — 그대로 저장하면 서버가 저장된 번호를 지킨다
  const keptManager =
    facility?.manager && !managers.some((m) => m.staffMemberId === facility.manager?.staffMemberId)
      ? { staffMemberId: facility.manager.staffMemberId, name: facility.isManagerHidden ? MASKED_STAFF : (facility.manager.name ?? MASKED_STAFF) }
      : null;
  const managerHidden = !!facility?.isManagerHidden && form.managerStaffMemberId === facility.manager?.staffMemberId;
  // 수정 화면의 지금 운영상태가 사용 목록에 없으면(미사용) 「(미사용)」으로 남겨 둔다
  const statusOptions =
    facility && !statuses.some((x) => x.value === facility.facilityStatusCode)
      ? [{ value: facility.facilityStatusCode, label: `${facility.facilityStatusLabel} (미사용)` }, ...statuses]
      : statuses;

  const docFilled = Object.fromEntries(DOCUMENT_KINDS.map((k) => [k, !!docs[k].file || (!!docs[k].existing && !docs[k].removed)])) as Record<FacilityDocumentKind, boolean>;
  const counts = filledCounts(form, docFilled);

  const handleSave = () => {
    setFailure(null);
    const found = problems(form, mode);
    if (Object.keys(found).length) {
      setErrors(found);
      // 걸린 칸이 접힌 묶음 안이면 펼친 뒤 첫 오류 칸으로 옮긴다
      setOpen((o) => ({ ...o, ...Object.fromEntries(Object.keys(found).flatMap((f) => (FOLD_OF[f as FacilityFormField] ? [[FOLD_OF[f as FacilityFormField], true]] : []))) }));
      const first = Object.keys(found)[0];
      requestAnimationFrame(() => {
        const box = document.getElementById(`${ids}-${first}`);
        box?.scrollIntoView({ block: "center" });
        box?.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea")?.focus({ preventScroll: true });
      });
      return;
    }
    setErrors({});
    startSave(async () => {
      const body = bodyOf(form);
      if (mode === "create") {
        const result = await createFacilityAction({ storeId: form.storeId as number, ...body }).catch(unknownResult("등록"));
        if (!result.ok) return setFailure({ title: result.message, detail: detailOf(result.messages) });
        const failed = await saveDocuments(result.facilityId);
        finish(result.facilityId, failed);
        return;
      }
      if (!facility) return;
      const result = await updateFacilityAction(facility.facilityId, { updatedAt: facility.updatedAt, ...body }).catch(unknownResult("저장"));
      if (!result.ok) {
        // 그 사이 다른 사람이 고쳤다 — 입력한 값은 그대로 두고 새로 받아 다시 저장하게 한다
        // 그 사이 지워졌다 — 목록으로 보낸다
        if ("status" in result && result.status === 404) {
          toast("이미 지워진 시설물·장비입니다.");
          router.push(at(backHref));
          return;
        }
        if ("status" in result && result.status === 409)
          return setFailure({ title: result.message, detail: "입력한 값은 그대로 두었습니다. 상세 화면에서 바뀐 내용을 확인한 뒤 다시 수정해 주세요." });
        return setFailure({ title: result.message, detail: detailOf(result.messages) });
      }
      const failed = await saveDocuments(facility.facilityId);
      finish(facility.facilityId, failed);
    });
  };

  /** 문서 — 뺀 것은 DELETE, 새로 고른 것은 종류마다 올린다. 실패한 종류 이름을 돌려준다(저장은 끝났으므로 상세로 가며 알린다) */
  const saveDocuments = async (facilityId: number): Promise<string[]> => {
    const failed: string[] = [];
    for (const kind of DOCUMENT_KINDS) {
      const doc = docs[kind];
      const name = labelOf(kindLabels, kind);
      if (doc.file) {
        const data = new FormData();
        data.append("facilityId", String(facilityId));
        data.append("kind", kind);
        data.append("file", doc.file, doc.file.name);
        const res = await fetch(at("/facilities/documents"), { method: "POST", body: data }).catch((e: unknown) => {
          console.error("시설물 문서 올리기 호출 실패", { facilityId, kind }, e);
          return null;
        });
        if (!res) failed.push(`${name}(연결이 끊겨 반영 여부를 확인하지 못했습니다)`);
        else if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { messages?: string[] } | null;
          failed.push(`${name}${body?.messages?.[0] ? `(${body.messages[0]})` : ""}`);
        }
      } else if (doc.existing && doc.removed) {
        // 빼기 실패는 사유(권한 · 폐점 · 결과 모름)를 함께 — 다시 뺄지 고를 수 있게(리뷰 반영)
        const result = await deleteFacilityDocumentAction(facilityId, kind).catch(unknownResult("문서 빼기"));
        if (!result.ok) failed.push(`${name}(빼기: ${result.message})`);
      }
    }
    return failed;
  };

  const finish = (facilityId: number, failedDocs: string[]) => {
    // 문서가 일부 실패하면 저장은 끝났으므로 수정 화면으로 보낸다 — 토스트를 놓쳐도 빈 문서 칸에서 바로 다시 올릴 수 있다(리뷰 반영)
    if (failedDocs.length) {
      toast(`저장했지만 문서를 반영하지 못했습니다: ${failedDocs.join(", ")}. 문서 칸을 확인해 주세요.`);
      router.push(at(withBack(`/facilities/${facilityId}/edit`, backHref)));
    } else {
      toast("saved");
      router.push(at(withBack(`/facilities/${facilityId}`, backHref)));
    }
    router.refresh();
  };

  // ── 칸 ────────────────────────────────────────────────
  const storeBox =
    mode === "create" ? (
      <div id={`${ids}-store`}>
        <Labeled label="점포" required>
          <StorePick options={props.storeOptions} value={form.storeId} onChange={pickStore} describedBy={describe("store")} />
        </Labeled>
        {message("store")}
      </div>
    ) : (
      <Stack>
        <Field label="점포">
          <TextField value={facility?.store.name ?? ""} readOnly aria-label="점포" />
        </Field>
        <Note>등록한 뒤에는 점포를 바꿀 수 없습니다.</Note>
      </Stack>
    );

  const groupLabel = FACILITY_GROUPS.find((g) => g.code === form.groupCode)?.label;
  const required = (
    <div className="grid grid-cols-2 items-start gap-[24px]">
      <div className="flex flex-col gap-[18px]">
        {storeBox}
        <Stack id={`${ids}-name`}>
          <Field label="시설물/장비명" required>
            <TextField
              value={form.name}
              maxLength={100}
              onChange={(e) => set("name", e.target.value, "name")}
              aria-required
              aria-describedby={describe("name")}
            />
          </Field>
          {message("name")}
        </Stack>
        <FormRow>
          <Stack id={`${ids}-group`} grow>
            <Field label="그룹" required>
              <Select
                value={form.groupCode}
                onChange={(e) => {
                  // 그룹을 바꾸면 분류를 지운다(PL-3)
                  setForm((f) => ({ ...f, groupCode: isFacilityGroup(e.target.value) ? e.target.value : "", categoryCode: "" }));
                  clearError("group", "category");
                }}
                aria-required
                aria-describedby={describe("group")}
              >
                <option value="">선택</option>
                {FACILITY_GROUPS.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </Field>
            {message("group")}
          </Stack>
          <Stack id={`${ids}-category`} grow>
            {/* 칸 이름 줄 오른쪽 끝에 값의 출처 — 고른 그룹의 공통코드 그룹(FAQ 등록 카테고리와 같은 모양) */}
            <Labeled label="분류" required source={form.groupCode || undefined}>
              <Select
                value={form.categoryCode}
                disabled={!form.groupCode || !categoryOptions.length}
                title={form.groupCode ? undefined : "그룹을 먼저 선택해 주세요."}
                onChange={(e) => set("categoryCode", e.target.value, "category")}
                aria-label="분류"
                aria-required
                aria-describedby={describe("category")}
              >
                <option value="">선택</option>
                {categoryOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Labeled>
            {keptCategory && form.categoryCode === keptCategory.value && <Note>미사용으로 바뀐 분류입니다. 다른 분류로 바꾸면 다시 고를 수 없습니다.</Note>}
            {/* BP 적용 전이라 그룹의 분류가 없으면 공통코드 관리 안내(PL-3) */}
            {form.groupCode && !categoryOptions.length && <Note>「{groupLabel}」 분류가 없습니다. 공통코드 관리에서 분류를 등록한 뒤 다시 시도해 주세요.</Note>}
            {message("category")}
          </Stack>
        </FormRow>
      </div>
      <div className="flex flex-col gap-[18px]">
        <Stack id={`${ids}-status`}>
          <Labeled label="운영상태" required>
            <div role="radiogroup" aria-label="운영상태" className="flex h-[34px] items-center gap-[18px]">
              {statusOptions.map((s) => (
                <Radio key={s.value} label={s.label} name={`${ids}-status`} checked={form.statusCode === s.value} onChange={() => set("statusCode", s.value, "status")} />
              ))}
            </div>
          </Labeled>
          {message("status")}
        </Stack>
        <Stack id={`${ids}-memo`}>
          <label className="flex flex-col gap-[8px]">
            <span className="flex items-center gap-[6px] text-[14px] font-medium text-erp-label">
              메모
              <span className="text-[12px] font-normal text-erp-muted">
                {form.memo.length} / {MEMO_MAX}
              </span>
            </span>
            <Textarea rows={3} value={form.memo} maxLength={MEMO_MAX} placeholder="메모를 입력해 주세요." onChange={(e) => set("memo", e.target.value, "memo")} />
          </label>
          {message("memo")}
        </Stack>
      </div>
    </div>
  );

  const phone = (field: "vendorPhone" | "salesRepresentativePhone" | "managerPhone" | "serviceCenterPhone", label: string) => (
    <Stack id={`${ids}-${field}`} grow>
      <PhoneGroup
        label={label}
        value={form[field]}
        onChange={(v) => set(field, v, field)}
        describedBy={describe(field) ?? (REPRESENTATIVE_PHONE_FIELDS.has(field) ? `${ids}-${field}-note` : undefined)}
      />
      {message(field)}
      {/* 업체 번호는 대표번호(1588-1234)일 수 있다 — 앞 두 칸만 채운다. 오류가 뜨면 오류 문구가 같은 말을 한다 */}
      {REPRESENTATIVE_PHONE_FIELDS.has(field) && !errors[field] && <Note id={`${ids}-${field}-note`}>대표번호(15xx · 16xx · 18xx)는 앞 두 칸만 입력합니다.</Note>}
    </Stack>
  );
  const text = (key: "brand" | "manufacturer" | "serialNumber" | "installationLocation" | "vendorName" | "salesRepresentativeName" | "inspectionNote", label: string, max: number) => (
    <Field label={label}>
      <TextField value={form[key]} maxLength={max} onChange={(e) => set(key, e.target.value)} />
    </Field>
  );

  const product = (
    <>
      <FormRow>
        {text("brand", "브랜드", 100)}
        {text("manufacturer", "제조사", 100)}
      </FormRow>
      <FormRow>
        {text("serialNumber", "Serial number", 100)}
        {text("installationLocation", "설치 위치", 100)}
      </FormRow>
    </>
  );

  const purchase = (
    <>
      <FormRow>
        <Stack grow>{text("vendorName", "구매처", 100)}</Stack>
        {phone("vendorPhone", "구매처 전화번호")}
      </FormRow>
      <FormRow>
        <Stack grow>{text("salesRepresentativeName", "영업사원", 50)}</Stack>
        {phone("salesRepresentativePhone", "영업사원 전화번호")}
      </FormRow>
      {/* 단가 · 수량 · 총금액 — 총금액은 단가 × 수량으로 채워지고 고칠 수 없다(서버도 계산한다). 「부가세 포함」 처음 켜짐(PL-5) */}
      <Stack id={`${ids}-quantity`}>
        <span className="flex items-center gap-[18px] text-[14px] font-medium text-erp-label">
          구매 금액
          <Toggle label="부가세 포함" checked={form.isVatIncluded} onChange={(e) => set("isVatIncluded", e.target.checked)} />
        </span>
        <FormRow>
          <Field label="단가">
            <TextField
              value={withCommas(form.unitPrice)}
              inputMode="numeric"
              maxLength={13}
              placeholder="숫자만 입력"
              onChange={(e) => set("unitPrice", digitsOf(e.target.value, 10), "unitPrice")}
            />
          </Field>
          <Field label="수량" width="w-[120px]">
            <TextField
              value={form.quantity}
              inputMode="numeric"
              maxLength={4}
              onChange={(e) => set("quantity", digitsOf(e.target.value, 4), "quantity")}
              // 비우거나 0 이면 1 로 돌린다
              onBlur={() => !(Number(form.quantity) >= 1) && set("quantity", "1", "quantity")}
              aria-describedby={describe("quantity")}
            />
          </Field>
          <Field label="총금액">
            <TextField value={totalText(form)} readOnly placeholder="단가 × 수량" />
          </Field>
        </FormRow>
        <Note>원 단위로 숫자만 입력할 수 있습니다.</Note>
        {message("quantity")}
      </Stack>
      <FormRow>
        <Stack grow>
          <Labeled label="구매일">
            <DateField aria-label="구매일" value={form.purchaseDate} onChange={(v) => set("purchaseDate", v, "installationDate")} />
          </Labeled>
        </Stack>
        <Stack id={`${ids}-installationDate`} grow>
          <Labeled label="설치일">
            <DateField aria-label="설치일" value={form.installationDate} onChange={(v) => set("installationDate", v, "installationDate")} />
          </Labeled>
          {message("installationDate")}
        </Stack>
      </FormRow>
    </>
  );

  const documents = (
    <>
      <FormRow>
        <Stack grow>
          <Labeled label="사용 유효기한">
            <DateField aria-label="사용 유효기한" value={form.usageExpiryDate} onChange={(v) => set("usageExpiryDate", v)} />
          </Labeled>
        </Stack>
        <Stack grow>
          <Labeled label="품질 보증기한">
            <DateField aria-label="품질 보증기한" value={form.warrantyExpiryDate} onChange={(v) => set("warrantyExpiryDate", v)} />
          </Labeled>
        </Stack>
      </FormRow>
      {DOCUMENT_KINDS.map((kind) => (
        <DocumentField key={kind} label={labelOf(kindLabels, kind)} state={docs[kind]} busy={saving} onChange={(next) => setDocs((d) => ({ ...d, [kind]: next }))} />
      ))}
    </>
  );

  const managerValue = form.managerStaffMemberId === null ? "" : String(form.managerStaffMemberId);
  const manage = (
    <>
      <FormRow>
        <Stack grow>
          <Field label="관리 담당자">
            <Select
              value={managerValue}
              disabled={form.storeId === null}
              title={form.storeId === null ? "점포를 먼저 선택해 주세요." : undefined}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                // 고르면 전화번호 세 칸을 그 직원의 휴대폰 번호로 채운다 — 고칠 수 있다(PL-6)
                const picked = managers.find((m) => m.staffMemberId === id);
                setForm((f) => ({ ...f, managerStaffMemberId: id, managerPhone: picked ? splitPhone(picked.phone) : id === null ? ["", "", ""] : f.managerPhone }));
                clearError("managerPhone");
              }}
            >
              <option value="">선택</option>
              {keptManager && <option value={keptManager.staffMemberId}>{keptManager.name}</option>}
              {managers.map((m) => (
                <option key={m.staffMemberId} value={m.staffMemberId}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          {managerNote && <FieldMessage id={`${ids}-manager-note`} message={managerNote} />}
          {form.storeId !== null && !managers.length && !keptManager && !managerNote && <Note>선택한 점포에 고를 수 있는 직원이 없습니다.</Note>}
          {managerHidden && <Note>본사에 정보제공을 동의하지 않은 직원이라 이름 · 번호를 가렸습니다. 그대로 저장하면 번호는 바뀌지 않습니다.</Note>}
        </Stack>
        {phone("managerPhone", "관리 담당자 전화번호")}
      </FormRow>
      <FormRow>
        <Stack grow>
          <Labeled label="점검 주기" source={CYCLE_GROUP}>
            <Select value={form.inspectionCycleCode} onChange={(e) => set("inspectionCycleCode", e.target.value)} aria-label="점검 주기">
              <option value="">선택</option>
              {cycleOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Labeled>
        </Stack>
        <Stack grow>{text("inspectionNote", "점검 비고", 200)}</Stack>
      </FormRow>
      <AddressField label="A/S센터 주소" value={form.serviceCenter} onChange={(a) => set("serviceCenter", a)} />
      <FormRow>{phone("serviceCenterPhone", "A/S센터 전화번호")}</FormRow>
    </>
  );

  const fold = (key: FoldKey, title: string, hint: string, children: ReactNode) => (
    <Fold title={title} hint={hint} count={counts[key]} open={open[key]} onToggle={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}>
      {children}
    </Fold>
  );
  const allOpen = Object.values(open).every(Boolean);

  return (
    <div className="flex flex-col gap-[24px]">
      {/* 취소 · 저장은 제목 줄 오른쪽 — 점포 등록과 같은 자리 */}
      <div className="flex items-center gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">{mode === "create" ? "시설물 · 장비 등록" : "시설물 · 장비 수정"}</h2>
        <Button variant="off" href={at(facility ? withBack(`/facilities/${facility.facilityId}`, backHref) : backHref)}>
          취소
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          저장
        </Button>
      </div>
      {failure && <NoticeBand title={failure.title} detail={failure.detail} />}

      <FormGroup
        title={
          <>
            기본 정보<span className="ml-[6px] text-[13px] font-medium text-erp-label">필수 칸은 * 표시</span>
          </>
        }
      >
        {required}
      </FormGroup>

      <section className="flex flex-col gap-[10px]">
        <div className="flex items-center">
          <h3 className="flex-1 text-[15px] font-semibold text-erp-ink">
            상세 정보<span className="ml-[6px] text-[13px] font-medium text-erp-label">선택</span>
          </h3>
          <button
            type="button"
            onClick={() => setOpen({ product: !allOpen, purchase: !allOpen, documents: !allOpen, manage: !allOpen })}
            className="text-[13px] font-medium text-erp-label underline-offset-2 hover:text-erp-ink hover:underline"
          >
            {allOpen ? "모두 접기" : "모두 펼치기"}
          </button>
        </div>
        <div className="grid grid-cols-2 items-start gap-[24px]">
          <div className="flex flex-col gap-[12px]">
            {fold("product", "제품 정보", "브랜드 · 제조사 · Serial number · 설치 위치", product)}
            {fold("purchase", "구매 정보", "구매처 · 영업사원 · 단가 · 수량 · 총금액 · 구매일 · 설치일", purchase)}
          </div>
          <div className="flex flex-col gap-[12px]">
            {fold("documents", "기한 · 문서", "사용 유효기한 · 품질 보증기한 · 사용 매뉴얼 · 주의사항 · 제품 보증서", documents)}
            {fold("manage", "관리 · A/S", "관리 담당자 · 점검 주기 · 점검 비고 · A/S센터", manage)}
          </div>
        </div>
      </section>
    </div>
  );
}

/** server action 호출 자체가 실패했다 — 결과를 모른다 */
const unknownResult =
  (what: string) =>
  (error: unknown): { ok: false; message: string; messages: string[] } => {
    console.error(`시설물 ${what} 호출 실패`, error);
    const message = `${what} 결과를 확인하지 못했습니다. 목록이나 상세에서 다시 확인해 주세요.`;
    return { ok: false, message, messages: [message] };
  };

/** 검증 실패 문장이 여럿이면 두 번째부터 설명 줄에 */
const detailOf = (messages?: string[]) => (messages && messages.length > 1 ? messages.slice(1).join("\n") : undefined);

// ── 작은 부품 ────────────────────────────────────────────

/** 칸과 그 아래 문구를 세로로 — 문구가 라벨 밖에 있어야 입력칸 이름에 섞이지 않는다. grow 는 FormRow 안에서 위로 맞춘다(점포 폼과 같다) */
function Stack({ children, grow, id }: { children: ReactNode; grow?: boolean; id?: string }) {
  return (
    <div id={id} className={`flex flex-col gap-[8px] ${grow ? "min-w-0 flex-1 self-start" : ""}`}>
      {children}
    </div>
  );
}

/** 입력칸이 여럿이거나 입력칸이 아닌 칸의 이름. source 를 주면 이름 줄 오른쪽 끝에 값의 출처 「공통코드 그룹 [코드]」 */
function Labeled({ label, required, source, children }: { label: string; required?: boolean; source?: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex min-w-0 flex-1 flex-col gap-[8px]">
      <span className="flex items-center text-[14px] font-medium text-erp-label">
        <span className="truncate">
          {label}
          {required && <RequiredMark />}
        </span>
        {source && (
          <span className="-my-[2px] ml-auto flex shrink-0 items-center gap-[6px] pl-[10px]">
            공통코드 그룹 <Tag>{source}</Tag>
          </span>
        )}
      </span>
      {children}
    </div>
  );
}

function Note({ id, children }: { id?: string; children: ReactNode }) {
  return <p id={id} className="break-keep text-[13px] leading-[1.6] text-erp-label">{children}</p>;
}

/** 전화번호 세 칸 — 숫자만, 칸마다 4자리(PL-5) */
function PhoneGroup({ label, value, onChange, describedBy }: { label: string; value: PhoneParts; onChange: (next: PhoneParts) => void; describedBy?: string }) {
  return (
    <Labeled label={label}>
      <FormRow>
        {(["앞자리", "가운데자리", "끝자리"] as const).map((part, i) => (
          <TextField
            key={part}
            value={value[i]}
            onChange={(e) => {
              const next = [...value] as PhoneParts;
              next[i] = digitsOf(e.target.value, 4);
              onChange(next);
            }}
            inputMode="numeric"
            maxLength={4}
            aria-label={`${label} ${part}`}
            aria-describedby={describedBy}
          />
        ))}
      </FormRow>
    </Labeled>
  );
}

/** 접는 묶음 — 이름 · 「입력 n / 전체」 · 안의 항목, 오른쪽에 펼치기 / 접기(데모 fold) */
function Fold({ title, hint, count, open, onToggle, children }: { title: string; hint: string; count: { filled: number; total: number }; open: boolean; onToggle: () => void; children: ReactNode }) {
  const bodyId = useId();
  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
        className="flex h-[46px] items-center gap-[10px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg px-[16px] text-left transition-colors duration-150 ease-out hover:border-erp-brand"
      >
        <span className="shrink-0 text-[15px] font-semibold text-erp-ink">{title}</span>
        <span className="shrink-0 text-[13px] font-medium text-erp-label">
          입력 {count.filled} / {count.total}
        </span>
        <span className="h-[11px] w-px shrink-0 bg-[#d9d9d9]" aria-hidden="true" />
        <span className="min-w-0 truncate text-[13px] text-erp-label">{hint}</span>
        <span className="ml-auto shrink-0 text-[13px] font-medium text-erp-label">{open ? "접기" : "펼치기"}</span>
        <svg viewBox="0 0 10 6" aria-hidden="true" className={`size-[10px] shrink-0 stroke-erp-label transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${open ? "rotate-180" : ""}`}>
          <path d="M1 1l4 4 4-4" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {/* 접혀도 그려 둔다 — 칸 값 · 오류 문구가 남고, 검사에 걸리면 펼친다 */}
      <div id={bodyId} hidden={!open} className="mt-[10px] flex flex-col gap-[18px] rounded-[2px] border border-erp-panel-line bg-white px-[16px] py-[20px]">
        {children}
      </div>
    </div>
  );
}

/** 문서 한 종류(공통 첨부 칸) — 1개, JPG · PNG · PDF, 10MB 이하. 다 차면 [파일 선택]을 막는다(PL-5) */
function DocumentField({ label, state, busy, onChange }: { label: string; state: DocState; busy: boolean; onChange: (next: DocState) => void }) {
  const picked = state.file ? [{ key: 0, file: state.file }] : [];
  const previews = useFilePreviews(picked);
  const shown = !!state.file || (!!state.existing && !state.removed);
  const rows: AttachmentRow[] = state.file
    ? [{ key: "new", name: state.file.name, size: state.file.size, preview: previews.get(0), onRemove: () => onChange({ ...state, file: null, rejected: [] }) }]
    : state.existing && !state.removed
      ? [
          {
            key: state.existing.facilityDocumentId,
            name: state.existing.fileName,
            size: state.existing.sizeBytes,
            preview: state.existing.thumbnailUrl ?? undefined,
            onOpen: state.existing.downloadUrl ? () => window.open(state.existing?.downloadUrl ?? "", "_blank", "noopener") : undefined,
            onRemove: () => onChange({ ...state, removed: true, rejected: [] }),
          },
        ]
      : [];
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-[8px]">
      <span className="text-[14px] font-medium text-erp-label">
        {label} <span className="ml-[4px] text-[12px] font-normal text-erp-muted">{shown ? 1 : 0} / 1</span>
      </span>
      <AttachmentField
        rows={rows}
        rejected={state.rejected}
        canPick={!shown}
        busy={busy}
        accept={DOCUMENT_ACCEPT}
        note={
          <>
            JPG, PNG, PDF 파일을 1개 첨부할 수 있습니다. <span className="whitespace-nowrap">(10MB 이하)</span>
          </>
        }
        onPick={(files) => {
          // 맞는 첫 파일 하나만 넣고, 나머지는 까닭과 함께 목록 아래에 보인다
          const rejected: RejectedFile[] = [];
          let file: File | null = null;
          for (const f of files) {
            const reason = documentFileError(f) ?? (file ? DOCUMENT_COUNT_ERROR : null);
            if (reason) rejected.push({ name: f.name, reason });
            else file = f;
          }
          onChange({ ...state, file: file ?? state.file, rejected });
        }}
      />
    </div>
  );
}

/**
 * 점포 하나를 고르는 자동완성(등록 화면, 데모 storePick) — 칸을 누르면 고를 수 있는 점포 전체, 치면 점포명 · 점포코드로 좁힌다.
 * 선택지는 GET /facilities/store-options(내 관리 점포 범위, 폐점 제외 — PL-1). 키보드: ↑ · ↓ 로 고르고 Enter 로 넣는다. Esc 로 닫는다.
 */
function StorePick({
  options,
  value,
  onChange,
  describedBy,
}: {
  options: FacilityStoreOption[];
  value: number | null;
  onChange: (storeId: number | null) => void;
  describedBy?: string;
}) {
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const selected = options.find((s) => s.storeId === value) ?? null;
  const [text, setText] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // 고른 점포 이름이 그대로면 전체를, 고쳐 치면 그 글자로 좁힌다
  const word = selected && text === selected.name ? "" : text.replace(/\s/g, "").toLowerCase();
  const found = options.filter((s) => !word || s.storeCode.toLowerCase().includes(word) || s.name.replace(/\s/g, "").toLowerCase().includes(word));
  const choose = (s: FacilityStoreOption) => {
    setText(s.name);
    setOpen(false);
    if (s.storeId !== value) onChange(s.storeId);
  };

  return (
    <div
      ref={box}
      className="relative"
      onBlur={(e) => {
        if (box.current?.contains(e.relatedTarget as Node | null)) return;
        setOpen(false);
        // 고르지 않고 글자만 남겼으면 고른 점포 이름으로 되돌린다
        setText(selected?.name ?? "");
      }}
    >
      <input
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="점포"
        aria-required
        aria-describedby={describedBy}
        autoComplete="off"
        value={text}
        placeholder="점포명 또는 점포코드로 찾기"
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(0);
          // 글자를 지우면 고른 점포도 지운다
          if (!e.target.value.trim() && value !== null) onChange(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          else if (e.key === "ArrowDown" && found.length) {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, found.length - 1));
          } else if (e.key === "ArrowUp" && found.length) {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && open && found[active] && !e.nativeEvent.isComposing) {
            e.preventDefault();
            choose(found[active]);
          }
        }}
        className={FIELD}
      />
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="선택할 수 있는 점포"
          className="absolute top-[calc(100%+4px)] right-0 left-0 z-20 max-h-[288px] overflow-y-auto overscroll-contain rounded-[2px] border border-[#ebebeb] bg-white p-[6px] shadow-[0_2px_6px_rgba(40,47,55,0.08)]"
        >
          {found.length ? (
            <>
              <p className="px-[10px] py-[6px] text-[12px] text-erp-label">
                {word ? "검색 결과" : "선택할 수 있는 점포"} {found.length}곳
              </p>
              {found.map((s, i) => (
                <button
                  key={s.storeId}
                  type="button"
                  role="option"
                  aria-selected={s.storeId === value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(s)}
                  className={`flex w-full items-center gap-[10px] rounded-[2px] px-[10px] py-[8px] text-left text-[14px] hover:bg-erp-thead-bg ${i === active ? "bg-erp-thead-bg" : ""}`}
                >
                  <span className="text-erp-label">{s.storeCode}</span>
                  <span className="truncate">{s.name}</span>
                </button>
              ))}
            </>
          ) : (
            <p className="px-[10px] py-[8px] text-[14px] text-erp-muted">{options.length ? "검색 조건에 맞는 점포가 없습니다." : "등록할 수 있는 점포가 없습니다."}</p>
          )}
        </div>
      )}
    </div>
  );
}
