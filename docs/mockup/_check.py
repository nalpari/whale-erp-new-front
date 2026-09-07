#!/usr/bin/env python3
"""목업 구조 검사기.

화면을 고치거나 층 구조를 바꾼 뒤에 이걸 돌린다.
눈으로 훑으면 "지적받은 그것만" 고치고 같은 위반을 남기게 된다.

  python3 docs/mockup/_check.py

검사하는 것
  1. HTML 태그 균형
  2. 링크·자원 참조가 실제로 존재하는지 (상대경로 해석)
  3. CSS 에 정의되지 않은 클래스를 쓰는지
  4. 층 원칙 — 각 층은 자기 층의 것만 갖는다
       루트 index.html  = 영역 목록만
       영역 overview    = 그 영역의 화면 목록 + 쟁점
       화면             = 그 화면의 내용 + 그 화면에 걸린 쟁점
  5. 금액 산술 — 급여 표의 기본급 + 수당 - 공제 = 실지급
  6. 확정값 위반 — 정해진 결정과 어긋나는 값이 화면 본문에 남았는지
       (쟁점 블록 안의 채택 안 한 안은 검사에서 뺀다)
  7. 파일 간 문장 중복 (한 곳만 고치고 다른 곳을 잊는 사고를 막는다)
"""
import os, re, sys, collections
from html.parser import HTMLParser

BASE = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE)
VOID = {"br","hr","img","input","meta","link","area","base","col","embed","source","track","wbr"}

def html_files():
    return sorted(os.path.join(r, f).replace("./","")
                  for r, d, fs in os.walk(".") for f in fs if f.endswith(".html"))

class Balance(HTMLParser):
    def __init__(self):
        super().__init__(); self.stack=[]; self.err=[]
    def handle_starttag(self, t, a):
        if t not in VOID: self.stack.append((t, self.getpos()))
    def handle_endtag(self, t):
        if t in VOID: return
        if not self.stack: self.err.append("과잉 </%s>" % t); return
        if self.stack[-1][0] != t:
            self.err.append("불일치 </%s> %s" % (t, self.getpos()))
            for i in range(len(self.stack)-1, -1, -1):
                if self.stack[i][0] == t: del self.stack[i:]; break
        else: self.stack.pop()

def check_balance(files):
    out=[]
    for f in files:
        p=Balance(); p.feed(open(f, encoding="utf-8").read())
        if p.err or p.stack:
            out.append("%s: %s %s" % (f, p.err[:2], [s[0] for s in p.stack[:3]]))
    return out

def check_links(files):
    out=[]
    for f in files:
        root=os.path.dirname(f)
        for m in re.findall(r'(?:href|src)="([^"#][^"]*?)"', open(f, encoding="utf-8").read()):
            if m.startswith(("http","#","mailto")): continue
            if not os.path.exists(os.path.normpath(os.path.join(root, m.split("#")[0]))):
                out.append("%s → %s" % (f, m))
    return out

def check_classes(files):
    css=open("assets/whale.css", encoding="utf-8").read()
    out=[]
    for f in files:
        used=set()
        for m in re.findall(r'class="([^"]+)"', open(f, encoding="utf-8").read()):
            used.update(m.split())
        for c in sorted(used):
            if not re.search(r'\.%s\b' % re.escape(c), css):
                out.append("%s: .%s 가 CSS 에 없다" % (f, c))
    return out

def check_layers(files):
    """새 영역을 추가하면 AREAS 에 폴더명만 넣으면 된다."""
    AREAS = ["staff", "home", "support", "notify", "staff-app", "attendance"]
    out=[]
    root=open("index.html", encoding="utf-8").read()

    # 루트는 영역 개요 말고 다른 화면을 직접 가리키지 않는다
    for m in re.findall(r'href="([^"]+\.html[^"]*)"', root):
        if not m.endswith("overview.html"):
            out.append("루트가 개별 화면을 직접 링크한다: %s" % m)
    # 루트는 스펙 ID·쟁점 ID 를 갖지 않는다
    for pat, label in [(r'\bS-[A-Z]{6}\b', "스펙 ID"), (r'\b[A-Z]{4,}-\d\b', "쟁점 ID")]:
        for h in sorted(set(re.findall(pat, root))):
            out.append("루트에 %s 가 있다: %s" % (label, h))

    # 영역 개요는 다른 영역의 쟁점을 갖지 않는다
    for a in AREAS:
        ov = "%s/overview.html" % a
        if not os.path.exists(ov): continue
        s=open(ov, encoding="utf-8").read()
        for b in AREAS:
            if b == a: continue
            pre = b.upper().replace("-","") + "-"
            if pre in s:
                out.append("%s 가 다른 영역 쟁점을 참조한다: %s" % (ov, pre))
    return out

def check_dupes(files):
    sent=collections.defaultdict(set)
    for f in files:
        s=re.sub(r'<[^>]+>', ' ', open(f, encoding="utf-8").read())
        for t in re.split(r'[.。\n]', s):
            t=' '.join(t.split())
            if len(t) >= 40: sent[t].add(f)
    return ['%s : "%s…"' % (sorted(v), k[:56]) for k, v in sent.items() if len(v) > 1]

def _tables(html):
    """<table> 을 (헤더 리스트, 행 리스트) 로 뽑는다. 셀 안의 태그는 벗겨낸다."""
    out=[]
    for t in re.findall(r'<table[^>]*>(.*?)</table>', html, re.S):
        head=[re.sub(r'<[^>]+>','',c).strip() for c in re.findall(r'<th[^>]*>(.*?)</th>', t, re.S)]
        rows=[]
        for r in re.findall(r'<tr[^>]*>(.*?)</tr>', t, re.S):
            cells=[re.sub(r'<[^>]+>','',c).strip() for c in re.findall(r'<td[^>]*>(.*?)</td>', r, re.S)]
            if cells: rows.append(cells)
        if head and rows: out.append((head, rows))
    return out

def _num(s):
    """'2,840,000' → 2840000 · '—' 나 빈칸은 None (미입력과 0 을 구분한다)."""
    s=s.strip()
    if not s or s in ("—","-","–"): return None
    m=re.fullmatch(r'[₩\s]*([\d,]+)\s*', s)
    return int(m.group(1).replace(",","")) if m else None

def check_amounts(files):
    """급여 표의 산술 검증 — 기본급 + 수당 - 공제 = 실지급.
       공제가 미입력이면 실지급은 지급 합계와 같아야 한다."""
    out=[]
    for f in files:
        for head, rows in _tables(open(f, encoding="utf-8").read()):
            def idx(*names):
                for i,h in enumerate(head):
                    if any(n in h for n in names): return i
                return None
            i_base, i_allw = idx("기본급"), idx("수당")
            i_ded,  i_net  = idx("공제"), idx("실지급")
            if None in (i_base, i_net): continue
            for r in rows:
                if max(i for i in (i_base,i_allw,i_ded,i_net) if i is not None) >= len(r): continue
                base = _num(r[i_base]); net = _num(r[i_net])
                if base is None or net is None: continue
                allw = _num(r[i_allw]) if i_allw is not None else 0
                ded  = _num(r[i_ded])  if i_ded  is not None else 0
                expect = base + (allw or 0) - (ded or 0)
                if expect != net:
                    out.append("%s: %s → %s + %s - %s = %s 인데 실지급이 %s"
                               % (f, r[0], r[i_base],
                                  r[i_allw] if i_allw is not None else 0,
                                  r[i_ded] if i_ded is not None else 0,
                                  format(expect, ","), r[i_net]))
    return out

def check_decisions(files):
    """확정된 결정과 어긋나는 값이 화면 본문에 남아 있는지.
       쟁점 블록(.gap) 안은 채택 안 한 A 안을 일부러 남겨 두므로 검사에서 뺀다.
       결정이 바뀌면 이 표를 고친다."""
    DECIDED = [
        ("날인 기한 30일",      [r'14일\s*뒤\s*(자동\s*)?만료', r'날인 기한은?\s*발송일로부터\s*14일']),
        ("계약 상태 6단계",     [r'>승인 대기<']),
        ("TO-DO 특별업무 전용", [r'매일 \d\d:\d\d', r'매주 [월화수목금토일]', r'매월 \d+일']),
    ]
    out=[]
    for f in files:
        s=open(f, encoding="utf-8").read()
        # 쟁점 블록 제거 후 본문만 검사
        body=re.sub(r'<div class="gap[^"]*">.*?\n\s{10,14}</div>', '', s, flags=re.S)
        body=re.sub(r'<!--.*?-->', '', body, flags=re.S)
        for label, pats in DECIDED:
            for p in pats:
                for m in re.finditer(p, body):
                    ctx=' '.join(re.sub(r'<[^>]+>','',body[max(0,m.start()-40):m.end()+30]).split())
                    out.append("%s: [%s] 위반 — …%s…" % (f, label, ctx[:60]))
    return out

def main():
    files=html_files()
    checks=[("태그 균형", check_balance(files)),
            ("링크·자원", check_links(files)),
            ("CSS 클래스", check_classes(files)),
            ("층 원칙", check_layers(files)),
            ("금액 산술", check_amounts(files)),
            ("확정값 위반", check_decisions(files)),
            ("문장 중복", check_dupes(files))]
    bad=0
    print("목업 파일 %d개 검사\n" % len(files))
    for name, issues in checks:
        if issues:
            bad += len(issues)
            print("  [%s] %d건" % (name, len(issues)))
            for i in issues[:10]: print("     - %s" % i)
            if len(issues) > 10: print("     … 외 %d건" % (len(issues)-10))
        else:
            print("  [%s] OK" % name)
    print()
    if bad: print("총 %d건. 문장 중복은 의도한 것일 수 있으니 판단이 필요하다." % bad)
    else: print("문제 없음.")
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main())
