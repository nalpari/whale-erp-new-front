"use client";

import { useId, useRef, useState } from "react";
import { Button, Field, FormGroup, FormRow, Select, SlidePanel, Textarea, TextField } from "@/components/common";

// Figma Slide(점포 등록). 목록 오른쪽에서 밀려 나오는 등록 폼.
// 샘플이라 저장은 닫기만 한다. 실제 화면에서는 form action 에 서버 액션을 건다.
export function StoreRegister() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button ref={trigger} aria-expanded={open} aria-controls={id} onClick={() => setOpen(true)}>
        신규 등록
      </Button>
      <SlidePanel id={id} open={open} onClose={() => setOpen(false)} label="점포 등록" trigger={trigger}>
        <FormGroup title="기본 정보">
          <FormRow>
            <Field label="점포명">
              <TextField name="store" />
            </Field>
            <Field label="점포 유형" width="w-[120px]">
              <Select name="type" defaultValue="직영점">
                <option>직영점</option>
                <option>가맹점</option>
              </Select>
            </Field>
          </FormRow>
          <FormRow>
            <Field label="사업자등록번호">
              <TextField name="bizNo" inputMode="numeric" />
            </Field>
            <Field label="대표자명" width="w-[120px]">
              <TextField name="owner" />
            </Field>
          </FormRow>
          <FormRow>
            <Field label="시도">
              <Select name="sido" defaultValue="서울">
                <option>서울</option>
                <option>경기</option>
                <option>인천</option>
              </Select>
            </Field>
            <Field label="시군구">
              <Select name="sigungu" defaultValue="선택">
                <option>선택</option>
                <option>종로구</option>
                <option>중구</option>
              </Select>
            </Field>
          </FormRow>
          <Field label="상세 주소">
            <TextField name="address" />
          </Field>
          <Field label="대표번호">
            <TextField name="phone" inputMode="tel" />
          </Field>
          <Field label="이메일">
            <TextField name="email" type="email" />
          </Field>
        </FormGroup>

        <FormGroup title="운영 정보">
          <FormRow>
            <Field label="영업 시작 시간">
              <TextField name="openAt" />
            </Field>
            <Field label="영업 종료 시간">
              <TextField name="closeAt" />
            </Field>
          </FormRow>
          <FormRow>
            <Field label="정기 휴무일" width="w-[120px]">
              <Select name="holiday" defaultValue="없음">
                <option>없음</option>
                <option>월요일</option>
                <option>화요일</option>
              </Select>
            </Field>
            <Field label="좌석수">
              <TextField name="seats" inputMode="numeric" />
            </Field>
          </FormRow>
          <Field label="점포 소개">
            <Textarea name="intro" placeholder="점포 소개" />
          </Field>
        </FormGroup>

        <div className="flex justify-center gap-[6px]">
          <Button variant="off" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={() => setOpen(false)}>저장</Button>
        </div>
      </SlidePanel>
    </>
  );
}
