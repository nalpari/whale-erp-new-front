"use client";

import { useRef, useState, useTransition } from "react";
import { Button, Field, FieldMessage, FormRow, Select, TextField, useAction } from "@/components/common";
import { LocationApplyField } from "@/components/site/location-apply-field";
import { getAddressCoordinateAction } from "@/lib/address-actions";
import type { AddressItem } from "@/lib/address-search";
import { coordinateText, hasCoordinate, type CoordinateField, type CoordinateForm } from "@/lib/coordinate-form";

// 위도 · 경도 · 출퇴근 위치적용 · [주소로 다시 계산] 줄 — 점포 등록 화면(store-form-view.tsx)과 같은 규칙(패널 폭 때문에 두 줄)을
// 마이페이지 BP 사업자정보와 플랫폼 BP 마스터 폼이 쓴다. 이 좌표가 본사 점포의 좌표다 — 본사근무 직원의 출퇴근 위치 확인 기준이고,
// 좌표가 있어야 본사 점포가 운영으로 바뀐다(본사 점포 설계 · 근무지 · 본사근무 정책 2, 2026-11-17).
// 사업자주소를 고르면 그 주소의 좌표를 받아 채우고(onAddressChoose), 주소를 지우면 좌표 · 위치적용을 함께 비운다(onAddressCleared).

const FAILED = "좌표를 가져오지 못했습니다. 위도 · 경도를 직접 적어 주세요.";

type Setter = (update: (f: CoordinateForm) => CoordinateForm) => void;

/**
 * 좌표 받기 — 주소를 고르거나 [주소로 다시 계산]을 누르면 카카오 좌표를 받는다. 받는 동안 다시 고르거나 손으로 고치면 늦게 온 결과를 버린다.
 * 동작은 점포 등록과 같다: 주소를 고르면 앞 좌표를 먼저 비우고 못 받으면 비운 채 위치적용을 미사용으로, 다시 계산은 실패해도 지우지 않는다.
 */
export function useCoordinateLocator(setCoordinate: Setter) {
  const getAddressCoordinate = useAction(getAddressCoordinateAction, { overlay: false });
  const [locating, startLocating] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  const number = useRef(0);

  const locate = (road: string, jibun: string, onFail: () => void) => {
    const mine = ++number.current;
    setNote(null);
    startLocating(async () => {
      const result = await getAddressCoordinate(road, jibun).catch((error: unknown) => {
        console.error("좌표 조회 호출 실패", error);
        return { ok: false as const, message: FAILED };
      });
      if (mine !== number.current) return;
      if (!result.ok) {
        onFail();
        return setNote(result.message);
      }
      // 좌표 칸 오류는 부르는 쪽 setter 가 값과 함께 내린다
      setCoordinate((f) => ({ ...f, latitude: String(result.latitude), longitude: String(result.longitude) }));
    });
  };

  return {
    locating,
    note,
    /** 주소를 골랐다 — 앞 주소의 좌표가 남지 않게 비우고 새 좌표를 받는다. 못 받으면 위치적용을 미사용으로(좌표 없이 사용으로 남지 않게) */
    onAddressChoose: (item: AddressItem) => {
      setCoordinate((f) => ({ ...f, latitude: "", longitude: "" }));
      locate(item.roadAddressBase, item.jibunAddress, () => setCoordinate((f) => ({ ...f, isLocationApplied: false })));
    },
    /** [지우기]로 주소를 비웠다 — 그 주소에서 나온 좌표 · 위치적용도 함께 비운다(점포 등록과 같다) */
    onAddressCleared: () => {
      number.current++;
      setNote(null);
      setCoordinate(() => ({ latitude: "", longitude: "", isLocationApplied: false }));
    },
    /** [주소로 다시 계산] — 주소 끝의 참고항목 괄호를 떼고 묻는다(카카오가 못 찾는다). 실패해도 지금 좌표는 둔다 */
    recalculate: (address: string) => locate(address.replace(/\s*\([^)]*\)\s*$/, ""), "", () => {}),
    /** 패널을 다시 열 때 — 닫기 전에 보낸 좌표 요청의 늦은 응답을 버리고 안내 문구를 내린다 */
    reset: () => {
      number.current++;
      setNote(null);
    },
    /** 손으로 고친다 — 받는 중이던 좌표는 버린다 */
    type: (key: CoordinateField, value: string) => {
      number.current++;
      setNote(null);
      setCoordinate((f) => ({ ...f, [key]: coordinateText(value) }));
    },
  };
}

export type CoordinateLocator = ReturnType<typeof useCoordinateLocator>;

/** 좌표 두 줄 + 안내. address — 지금 사업자주소(비면 [주소로 다시 계산]이 막힌다). errors — 저장을 눌러 검사한 칸 오류 */
export function CoordinateFields({
  value,
  onApplyChange,
  locator,
  address,
  errors,
  disabled = false,
  idPrefix,
}: {
  value: CoordinateForm;
  onApplyChange: (applied: boolean) => void;
  locator: CoordinateLocator;
  address: string;
  errors: Partial<Record<CoordinateField, string>>;
  disabled?: boolean;
  idPrefix: string;
}) {
  const has = hasCoordinate(value);
  const errorId = (key: CoordinateField) => (errors[key] ? `${idPrefix}-${key}-error` : undefined);
  return (
    <div className="flex flex-col gap-[8px]">
      {/* 패널 폭(464 — 플랫폼 BP 마스터 폼)에도 들어가게 두 줄로 둔다: 위도 · 경도 / 출퇴근 위치적용 · [주소로 다시 계산] */}
      <FormRow>
        <Field label="위도">
          <TextField
            value={value.latitude}
            onChange={(e) => locator.type("latitude", e.target.value)}
            inputMode="decimal"
            placeholder="예: 37.556312"
            disabled={disabled}
            aria-invalid={!!errors.latitude}
            aria-describedby={errorId("latitude")}
          />
        </Field>
        <Field label="경도">
          <TextField
            value={value.longitude}
            onChange={(e) => locator.type("longitude", e.target.value)}
            inputMode="decimal"
            placeholder="예: 126.901845"
            disabled={disabled}
            aria-invalid={!!errors.longitude}
            aria-describedby={errorId("longitude")}
          />
        </Field>
      </FormRow>
      {errors.latitude && <FieldMessage id={`${idPrefix}-latitude-error`} message={errors.latitude} />}
      {errors.longitude && <FieldMessage id={`${idPrefix}-longitude-error`} message={errors.longitude} />}
      <FormRow>
        <LocationApplyField>
          {/* 좌표가 없으면 사용으로 고를 수 없다. 보이는 값도 저장(coordinateBody)과 같은 규칙으로 그린다 — 점포 등록과 같다 */}
          <Select
            aria-label="출퇴근 위치적용"
            value={has && value.isLocationApplied ? "Y" : "N"}
            onChange={(e) => onApplyChange(e.target.value === "Y")}
            disabled={disabled || !has}
            title={has ? undefined : "위도 · 경도가 있어야 사용으로 바꿀 수 있습니다."}
          >
            <option value="Y">사용</option>
            <option value="N">미사용</option>
          </Select>
        </LocationApplyField>
        <div className="self-end">
          <Button variant="soft" onClick={() => locator.recalculate(address)} disabled={disabled || !address.trim() || locator.locating}>
            주소로 다시 계산
          </Button>
        </div>
      </FormRow>
      {locator.note && <FieldMessage id={`${idPrefix}-coordinate`} message={locator.note} />}
      <p className="text-[13px] leading-[1.6] text-erp-label">
        사업자주소가 입력되면 <b className="font-semibold">위도</b> · <b className="font-semibold">경도</b> 좌표값이 자동으로 표시됩니다. 본사근무 직원의 출퇴근 위치 확인
        기준입니다.
        <br />
        위도 · 경도가 없으면 <b className="font-semibold">출퇴근 위치적용</b>을 사용으로 바꿀 수 없습니다.
      </p>
    </div>
  );
}
