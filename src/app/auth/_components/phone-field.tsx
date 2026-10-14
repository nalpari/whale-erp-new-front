import { TextField } from "@/components/common";

const LABELS = ["앞자리", "가운데자리", "끝자리"] as const;

// 연락처 세 칸. 세 칸 모두 숫자 4자리를 넘지 않는다. docs/demo/src/biz-form.mjs 의 tel 과 같다.
// 검증을 위해 값을 부모(SignupForm)가 들고 있는 controlled 입력칸이다.
// onBlur 는 포커스가 세 칸 밖으로 나갈 때만 부른다 — 칸 사이를 옮길 때 부르면 앞자리만 친 채로
// 다음 칸에 들어가자마자 "10~11자리" 오류가 뜬다.
export function PhoneField({
  values,
  onChange,
  onBlur,
}: {
  values: [string, string, string];
  onChange: (index: 0 | 1 | 2, value: string) => void;
  onBlur?: () => void;
}) {
  return (
    <div
      className="flex gap-[6px]"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onBlur?.();
      }}
    >
      {values.map((v, i) => (
        <TextField
          key={LABELS[i]}
          value={v}
          onChange={(e) => onChange(i as 0 | 1 | 2, e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          aria-label={LABELS[i]}
          maxLength={4}
        />
      ))}
    </div>
  );
}
