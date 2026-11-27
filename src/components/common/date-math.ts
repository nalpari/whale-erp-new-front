// DateField 가 쓰는 날짜 계산. 화면이 없어 따로 두고, 옆의 date-math.test.ts 로 확인한다.
// 모두 지역 시간 기준이다. toISOString() 을 쓰면 한국 시간 09:00 이전이 하루 앞으로 밀린다.

export const pad = (n: number) => String(n).padStart(2, "0");
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// 숫자만 칠 때 YYYY-MM-DD 로 하이픈을 넣는다(19980712 → 1998-07-12). 다음 숫자가 와야 하이픈을 붙여서 지우기가 걸리지 않는다.
// / · . 로 치는 사람은 그 모양 그대로 둔다 — parse 가 받는다. DateField 의 autoHyphen 을 켠 칸만 쓴다.
// 하이픈을 두 번 친 값(2026-8-5 처럼 한 자리 달 · 날)도 그 모양 그대로 둔다 — 숫자만 다시 나누면 2026-85 가 되어 칸을 벗어날 때 지워졌다(PR #272 리뷰).
export function hyphenateDate(input: string): string {
  if (/[/.]/.test(input)) return input;
  if ((input.match(/-/g) ?? []).length >= 2) return input.slice(0, 10);
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

// ── 시간(TimeField) ──────────────────────────────────────────────
// 시간 칸이 받는 값은 24시간 HH:MM 하나다(네이티브 <input type="time"> 의 value 와 같은 모양).

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const isTime = (v: string) => TIME.test(v);

// 숫자만 쳐도 네 자리가 되면 HH:MM 으로 쌍점을 넣는다(0930 → 09:30). 세 자리(930)까지는 숫자 그대로 두고 칸을 벗어날 때
// parseTime 이 9:30 으로 읽는다. 쌍점 · 점을 직접 친 사람은 그 자리를 지킨다(9:05 · 9.05).
// 자릿수가 넘치면(09:301 · 09301) 잘라서 맞는 시각으로 만들지 않고 그대로 둔다 — 잘못 붙여넣은 근태 시각이 조용히 통과하지 않고
// 칸을 벗어날 때 parseTime 이 읽지 못해 저장 검사가 알린다(PR #341 pr-agent 리뷰).
export function colonizeTime(input: string): string {
  // 숫자 · 쌍점 · 점 밖의 글자(1:30 PM · 9시)가 섞이면 지우지 않고 그대로 둔다 — 지우면 오후 1시 30분이 01:30 으로 통과한다.
  // 칸을 벗어날 때 parseTime 이 읽지 못해 저장 검사가 알린다(PR #341 pr-agent 재리뷰).
  if (/[^\d:.]/.test(input)) return input;
  // 쌍점이나 점을 직접 치면 그 자리를 지킨다(9:05 · 9.05). 점은 쌍점으로 바꾼다.
  if (/[:.]/.test(input)) return input.replace(".", ":");
  // 숫자만 치면 네 자리가 됐을 때만 쌍점을 넣는다 — 세 자리(930)에서 넣으면 93:0 이 되어 9:30 으로 읽지 못한다.
  const d = input.replace(/\D/g, "");
  return d.length === 4 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
}

// 사람이 치는 모양을 HH:MM 으로 맞춘다 — 9:05 · 9.05 · 0905 · 905 · 9 (9시 정각). 쌍점 뒤 분은 두 자리만 받는다(9:3 은 9:03 인지 9:30 인지 몰라 null).
// 범위를 벗어나면(24:00 · 12:60) null.
export function parseTime(v: string): string | null {
  const s = v.trim();
  let h: number;
  let m: number;
  const sep = /^(\d{1,2})[:.](\d{2})$/.exec(s);
  if (sep) {
    h = Number(sep[1]);
    m = Number(sep[2]);
  } else if (/^\d{1,4}$/.test(s)) {
    // 1~2자리는 시, 3~4자리는 뒤 두 자리가 분(905 → 9:05, 0930 → 9:30)
    h = Number(s.length <= 2 ? s : s.slice(0, -2));
    m = s.length <= 2 ? 0 : Number(s.slice(-2));
  } else return null;
  if (h > 23 || m > 59) return null;
  return `${pad(h)}:${pad(m)}`;
}

/** 연 · 월만 바꾸고 날은 지킨다 — 31일에서 2월로 가면 말일로 당긴다(shiftMonth 와 같은 규칙). month 는 0~11. */
export function atMonth(d: Date, year: number, month: number): Date {
  const last = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(d.getDate(), last));
}
