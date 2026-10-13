// DateField 가 쓰는 날짜 계산. 화면이 없어 따로 두고, 옆의 date-math.test.ts 로 확인한다.
// 모두 지역 시간 기준이다. toISOString() 을 쓰면 한국 시간 09:00 이전이 하루 앞으로 밀린다.

export const pad = (n: number) => String(n).padStart(2, "0");
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// 숫자만 칠 때 YYYY-MM-DD 로 하이픈을 넣는다(19980712 → 1998-07-12). 다음 숫자가 와야 하이픈을 붙여서 지우기가 걸리지 않는다.
// / · . 로 치는 사람은 그 모양 그대로 둔다 — parse 가 받는다. DateField 의 autoHyphen 을 켠 칸만 쓴다.
export function hyphenateDate(input: string): string {
  if (/[/.]/.test(input)) return input;
  const d = input.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

// 2020-8-5, 2020/08/05, 2020.08.05 처럼 사람이 치는 모양도 받는다.
// 2025-02-30 같이 없는 날짜는 Date 가 3월로 넘겨 버리므로 되돌려 확인하고 버린다.
export function parse(v: string) {
  const m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(v.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  return date.getMonth() === mo - 1 && date.getDate() === d ? date : null;
}

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const firstOfMonth = (d: Date, shift = 0) => new Date(d.getFullYear(), d.getMonth() + shift, 1);

// 달만 옮기고 날짜는 지킨다. 1/31 에서 다음 달로 가면 Date 가 3/3 으로 넘겨 버리므로 말일로 당긴다.
export function shiftMonth(d: Date, n: number) {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
}

// 달력 한 판은 6주 42칸 고정이다. 달마다 줄 수가 바뀌면 달을 넘길 때 팝업 높이가 들썩인다.
export function monthGrid(view: Date) {
  const first = firstOfMonth(view);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
