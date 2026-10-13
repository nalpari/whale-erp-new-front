// enum 값·한글. 서버(getEnum)와 클라이언트 컴포넌트가 함께 쓴다 — api.ts 는 next/headers 를 써서 클라이언트에서 가져올 수 없다.

/** GET /enums/{name} 의 값 하나. 순서는 order(1부터) 그대로 쓴다. */
export interface EnumValue {
  value: string;
  label: string;
  order: number;
}

/** 값의 한글. 목록에 없으면(api 가 먼저 배포된 새 값) 값을 그대로 보인다. */
export function labelOf(values: EnumValue[], value: string): string {
  return values.find((v) => v.value === value)?.label ?? value;
}
