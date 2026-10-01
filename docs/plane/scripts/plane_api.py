# -*- coding: utf-8 -*-
"""Plane REST v1 을 부르는 공통 함수.

프로젝트마다 다른 값은 환경변수로 받는다. 토큰은 파일에서만 읽고 화면에 찍지 않는다.

    PLANE_BASE      Plane 주소            (예: http://172.30.1.65:3333)
    PLANE_SLUG      워크스페이스 슬러그    (예: whale-erp)
    PLANE_PROJECT   프로젝트 id (UUID)
    PLANE_SOURCE    external_source 값. 팀마다 다르게 (예: whale-plan)
    PLANE_KEY_FILE  API 토큰 파일 경로     (기본 ~/.config/plane-mcp/api-key)

토큰은 Plane 웹의 프로필 → 설정 → Developer → 퍼스널 액세스 토큰에서 만든다.
주소에 워크스페이스 슬러그가 들어가지 않는다: /settings/profile/api-tokens/
"""
import html
import json
import os
import time
import urllib.error
import urllib.request

BASE_URL = os.environ.get("PLANE_BASE", "").rstrip("/")
SLUG = os.environ.get("PLANE_SLUG", "")
PROJECT = os.environ.get("PLANE_PROJECT", "")
SRC = os.environ.get("PLANE_SOURCE", "")
KEY_FILE = os.environ.get("PLANE_KEY_FILE", "~/.config/plane-mcp/api-key")

for name, value in (("PLANE_BASE", BASE_URL), ("PLANE_SLUG", SLUG),
                    ("PLANE_PROJECT", PROJECT), ("PLANE_SOURCE", SRC)):
    if not value:
        raise SystemExit(f"환경변수 {name} 을 설정해야 한다. 자세한 것은 이 파일 맨 위 주석에.")

BASE = f"{BASE_URL}/api/v1/workspaces/{SLUG}/projects/{PROJECT}"
KEY = open(os.path.expanduser(KEY_FILE)).read().strip()

# 분당 호출 제한이 있다. 이 간격보다 빠르게 돌리면 429 가 난다.
INTERVAL = 1.1


def call(method, path, body=None):
    """Plane API 를 한 번 부른다. 429 면 Retry-After 만큼 쉬고 다시 한다."""
    data = json.dumps(body).encode() if body is not None else None
    for _ in range(6):
        req = urllib.request.Request(
            BASE + path, data=data, method=method,
            headers={"X-API-Key": KEY, "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                time.sleep(INTERVAL)
                raw = r.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(int(e.headers.get("Retry-After", "20")) + 1)
                continue
            raise RuntimeError(f"{method} {path} -> {e.code} {e.read()[:300]!r}")
    raise RuntimeError(f"{method} {path} -> 429 가 거듭됨")


def get_all(path):
    """커서 페이지를 끝까지 따라가 결과를 모두 모은다."""
    out, cursor = [], ""
    while True:
        sep = "&" if "?" in path else "?"
        r = call("GET", f"{path}{sep}per_page=100" + (f"&cursor={cursor}" if cursor else ""))
        out += r.get("results", [])
        if not r.get("next_page_results"):
            return out
        cursor = r["next_cursor"]


def esc(t):
    """작업 본문에 넣을 글자를 HTML 로 안전하게 만든다."""
    return html.escape(t, quote=False)


if __name__ == "__main__":  # 설정이 맞는지 보는 자가 점검
    states = {s["name"]: s["id"] for s in call("GET", "/states/?per_page=100")["results"]}
    assert states, "상태를 하나도 못 읽었다. 토큰이나 프로젝트 id 를 다시 본다"
    mods = call("GET", "/modules/?per_page=100")["results"]
    print(f"붙었다. 상태 {len(states)}개, 모듈 {len(mods)}개, 작업 {len(get_all('/work-items/'))}건")
