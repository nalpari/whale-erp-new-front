# -*- coding: utf-8 -*-
"""정의 파일 하나를 읽어 Plane 에 명세 작업과 개발 작업을 만든다.

    python3 run_module.py example_tasks

하는 일 넷.
  1. 명세 작업(최상위)과 개발 작업(그 자식)을 만든다
  2. 이번에 만든 것을 모듈에 담는다
  3. 선행 관계(blocked_by)를 건다
  4. 작업 키와 Plane 작업 id 의 짝을 ids.json 에 쌓는다

이미 있는 external_id 는 건너뛴다. 그래서 정의 파일을 고쳐 다시 돌려도 새로 생기지 않는다.
이미 만든 작업의 본문을 고치려면 그 작업만 따로 PATCH 한다.
"""
import importlib
import json
import os
import re
import sys

import plane_api
from plane_api import call, get_all, esc

# ── 여기를 자기 제품의 층으로 바꾼다 ────────────────────────────────────────
# LAYER  : 층 → 붙일 라벨 이름. None 이면 층 라벨을 붙이지 않는다
# PREFIX : 층 → 제목 앞에 붙일 표시
# 웹이 하나뿐인 제품이라면 {"웹", "API", "확인"} 셋으로 줄인다.
LAYER = {"웹": "관리자 웹", "앱": "직원 근무 앱", "API": "API", "확인": None}
PREFIX = {"웹": "[관리자웹]", "앱": "[직원앱]", "API": "[API]", "확인": "[점검]"}
# ────────────────────────────────────────────────────────────────────────────

if len(sys.argv) < 2:
    raise SystemExit(__doc__)

M = importlib.import_module(sys.argv[1])
here = os.path.dirname(os.path.abspath(__file__))
ids_path = os.path.join(here, "ids.json")
ids = json.load(open(ids_path)) if os.path.exists(ids_path) else {}


def titled(name, layer):
    """제목 앞에 층을 붙인다. 이름에 이미 있던 층 표기는 뗀다."""
    n = name
    for lab in LAYER.values():
        if lab:
            n = re.sub(rf"^{re.escape(lab)} · ", "", n)
    if layer == "API":                      # 접두가 이미 층을 말하니 이름의 API 는 뺀다
        n = re.sub(r"\s*API$", "", n)
    return f"{PREFIX[layer]} {n}"


labels = {l["name"]: l["id"] for l in call("GET", "/labels/?per_page=100")["results"]}
missing = {x for x in list(LAYER.values()) + [M.TRACK] if x and x not in labels}
if missing:
    raise SystemExit(f"Plane 에 없는 라벨: {', '.join(sorted(missing))} — 먼저 만든다")

modules = {m["name"]: m["id"] for m in call("GET", "/modules/?per_page=100")["results"]}
if M.MODULE not in modules:
    raise SystemExit(f"Plane 에 없는 모듈: {M.MODULE} — 먼저 만든다")
module_id = modules[M.MODULE]

existing = {i.get("external_id"): i["id"]
            for i in get_all("/work-items/") if i.get("external_source") == plane_api.SRC}
made = []


def new(key, name, desc, labs, pri, parent=None):
    if key in existing:
        ids[key] = existing[key]
        return False
    wid = call("POST", "/work-items/", {
        "name": name, "description_html": desc,
        "labels": [labels[x] for x in labs if x],
        "priority": pri, "parent": parent,
        "external_source": plane_api.SRC, "external_id": key,
    })["id"]
    ids[key] = wid
    made.append(wid)
    print("  +", name)
    return True


# 1. 명세 작업 — 최상위. 층 접두를 붙이지 않는다
for s in M.SPECS:
    desc = s["html"] + (f"<p><b>명세</b> {esc(s['name'])} ({s['mf']})</p>" if s.get("mf") else "")
    new(s["key"], s["name"], desc, [LAYER[l] for l in s["layers"]] + [M.TRACK], "medium")

# 2. 개발 작업 — 그 명세를 부모로
spec_key = {s["name"]: s["key"] for s in M.SPECS}
for t in M.T:
    desc = ("<p><b>완료 조건</b></p><ul>"
            + "".join(f"<li>{esc(d)}</li>" for d in t["done"]) + "</ul>"
            f"<p><b>명세</b> {esc(t['spec'])}</p>")
    new(t["key"], titled(t["name"], t["layer"]), desc,
        [LAYER[t["layer"]], M.TRACK], t["pr"], ids[spec_key[t["spec"]]])

# 3. 모듈에 담기
if made:
    call("POST", f"/modules/{module_id}/module-issues/", {"issues": made})
    print("모듈 담기:", M.MODULE, len(made))

# 4. 선행 관계 — 이번에 만든 것에만 건다
rel = 0
for t in M.T:
    if ids[t["key"]] not in made or not t["after"]:
        continue
    blockers = [ids[a] for a in t["after"]]   # 다른 모듈의 키도 ids.json 에 있으면 쓸 수 있다
    call("POST", f"/work-items/{ids[t['key']]}/relations/",
         {"relation_type": "blocked_by", "issues": blockers})
    rel += len(blockers)
print("선행 관계:", rel)

json.dump(ids, open(ids_path, "w"), ensure_ascii=False, indent=1)
print("완료 · 새 작업", len(made))
