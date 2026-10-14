"use client";

import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { CHECKBOX, INPUT, INPUT_BOX, LABEL, SUBMIT } from "../guest-form";
import { HOVER } from "../theme";

// 업종에서 이 값을 고르면 옆 「업종 직접 입력」칸 잠금을 푼다.
const INDUSTRY_OTHER = "직접입력";
const INDUSTRIES = ["카페·음료", "음식점", "베이커리·디저트", "주점", INDUSTRY_OTHER];
const SERVICES = ["매장운영", "재무관리", "프랜차이즈", "부가서비스", "기타"];
const TIMINGS = ["1개월 안", "3개월 안", "6개월 안", "아직 정하지 않음"];

function Required() {
  return (
    <>
      <span aria-hidden className="text-[#e93737]">
        {" *"}
      </span>
      <span className="sr-only">(필수)</span>
    </>
  );
}

function Field({ label, required = false, help, children }: { label: string; required?: boolean; help?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-[10px]">
      <span className={LABEL}>
        {label}
        {required && <Required />}
      </span>
      {children}
      {help && <span className="-mt-[2px] text-[14px] leading-[1.5] text-[#767676]">{help}</span>}
    </label>
  );
}

// 입력칸과 같은 껍데기에 오른쪽 화살표. 처음엔 숨긴 빈 선택지가 「선택해 주세요」를 보인다.
// 펼친 목록 생김새는 globals.css 의 select.guest-select 가 맡고, 열리면 화살표가 뒤집힌다.
// select 는 칸의 여백까지 덮어 56px 칸 어디를 눌러도 열린다. 화살표는 그 위에 겹치고 클릭을 통과시킨다.
function Select({ name, options, required = false, onChange }: { name: string; options: string[]; required?: boolean; onChange?: (value: string) => void }) {
  return (
    <span className={`${INPUT_BOX} relative [&:has(select:open)_svg]:rotate-180`}>
      <select name={name} required={required} defaultValue="" onChange={(e) => onChange?.(e.target.value)} className={`guest-select ${INPUT} -mx-[16px] cursor-pointer appearance-none self-stretch pr-[42px] pl-[16px] has-[option[value='']:checked]:text-[#999]`}>
        <option value="" hidden>
          선택해 주세요
        </option>
        {options.map((o) => (
          <option key={o} className="text-guest-ink">
            {o}
          </option>
        ))}
      </select>
      <svg aria-hidden className="pointer-events-none absolute right-[16px] size-[16px] text-[#767676] transition-[rotate] duration-150 motion-reduce:transition-none" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m4 6 4 4 4-4" />
      </svg>
    </span>
  );
}

function Section({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[24px] border-t border-[#ebebeb] pt-[32px]">
      <h2 className="text-[20px] leading-[1.4] font-semibold text-[#111]">
        {title}
        {note && <span className="ml-[10px] text-[15px] font-normal text-[#767676]">{note}</span>}
      </h2>
      {children}
    </section>
  );
}

// 디자인 샘플이라 접수 요청은 보내지 않는다. 브라우저 검사를 통과하면 접수 안내만 보인다.
// 받는 항목은 okf/home.md 도입문의(이름·업종·전화번호·이메일·관심 서비스·도입 예정 시기·문의 내용)를 따른다.
export function InquiryForm() {
  const [otherIndustry, setOtherIndustry] = useState(false);
  const [done, setDone] = useState(false);
  const otherRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);

  function handleIndustryChange(value: string) {
    const other = value === INDUSTRY_OTHER;
    setOtherIndustry(other);
    if (!other && otherRef.current) otherRef.current.value = "";
    // 잠금이 풀린 뒤에 커서를 옮긴다.
    if (other) requestAnimationFrame(() => otherRef.current?.focus());
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDone(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => doneRef.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }));
  }

  return (
    <form className="flex flex-col gap-[40px]" onSubmit={handleSubmit}>
      <Section
        title="문의자 정보"
        note={
          <>
            (<span className="text-[#e93737]">*</span> 표시는 필수 기재 항목입니다.)
          </>
        }
      >
        <div className="grid grid-cols-2 gap-[16px]">
          <Field label="이름" required>
            <span className={INPUT_BOX}>
              <input name="name" required autoComplete="name" placeholder="홍길동" className={INPUT} />
            </span>
          </Field>
          <Field label="전화번호" required>
            <span className={INPUT_BOX}>
              <input name="phone" type="tel" required inputMode="numeric" autoComplete="tel" placeholder="숫자만 입력해 주세요" className={INPUT} />
            </span>
          </Field>
          <Field label="업종" required>
            <Select name="industry" options={INDUSTRIES} required onChange={handleIndustryChange} />
          </Field>
          {/* 잠겨 있는 동안은 검사·전송에서 빠진다. */}
          <Field label="업종 직접 입력">
            <span className={INPUT_BOX}>
              <input ref={otherRef} name="industryOther" required disabled={!otherIndustry} maxLength={50} placeholder="업종을 직접 입력해 주세요" className={INPUT} />
            </span>
          </Field>
          <Field label="이메일" required help="접수 확인 메일을 이 주소로 보냅니다.">
            <span className={INPUT_BOX}>
              <input name="email" type="email" required autoComplete="email" placeholder="example@company.com" className={INPUT} />
            </span>
          </Field>
        </div>
      </Section>
      <Section title="도입 문의 내용">
        <div className="grid grid-cols-2 gap-[16px]">
          <Field label="관심 서비스" required>
            <Select name="service" options={SERVICES} required />
          </Field>
          <Field label="도입 예정 시기">
            <Select name="timing" options={TIMINGS} />
          </Field>
        </div>
        <Field label="어떤 점이 궁금하신가요">
          <textarea
            name="message"
            rows={6}
            placeholder="지금 쓰고 계신 방식과 불편한 점을 적어 주시면 그에 맞춰 안내해 드립니다."
            className={`min-h-[180px] w-full resize-none rounded-[6px] border border-[#ebebeb] bg-white p-[16px] text-[15px] leading-[1.6] text-guest-ink outline-none! placeholder:text-[#999] focus:border-guest-navy ${HOVER}`}
          />
        </Field>
      </Section>
      <Section title="개인정보 수집·이용 동의">
        <p className="rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.6] text-guest-navy">
          문의 응대를 위해 이름·업종·전화번호·이메일과 문의 내용을 받습니다. 사업자등록번호나 점포 수는 받지 않습니다.
          <br />
          <strong className="font-semibold">상담이 끝난 날로부터 1년간 보관</strong>한 뒤 파기합니다. 동의를 거부하시면 접수가 되지 않습니다.
        </p>
        <div className="flex flex-col gap-[16px] text-[16px] leading-[1.5]">
          <label className="flex items-center gap-[8px] text-guest-ink">
            <input type="checkbox" name="privacy" required className={CHECKBOX} />
            개인정보 수집·이용에 동의합니다 (필수)
          </label>
          <label className="flex items-center gap-[8px] text-guest-ink">
            <input type="checkbox" name="marketing" className={CHECKBOX} />
            마케팅 정보 수신에 동의합니다 (선택)
          </label>
        </div>
      </Section>
      <div className="flex flex-col gap-[16px]">
        {done && (
          <p ref={doneRef} role="status" className="rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.6] text-guest-navy">
            <strong className="font-semibold">문의가 접수되었습니다.</strong>
            <br />
            담당자가 영업일 기준 1~2일 안에 알려주신 전화번호나 이메일로 연락드립니다.
          </p>
        )}
        <button type="submit" className={SUBMIT}>
          문의 접수하기
        </button>
        {/* 중복 접수(429) 문구는 운영 정책 CNT-03 · 04 · 08 · 10 · 14 (2026-10-13). */}
        <p className="text-[15px] leading-[1.5] text-[#767676]">
          같은 전화번호나 이메일로 짧은 시간에 여러 번 보내면 잠시 접수가 막히고 「이미 접수된 문의가 있습니다. 담당자가 영업일 기준 1~2일 안에 연락드립니다」를 보입니다.
        </p>
      </div>
    </form>
  );
}
