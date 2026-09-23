#!/usr/bin/env python3
"""WHALE ERP 1팀 1차 범위 논리 ERD 생성기.

모델(엔티티·관계)을 이 파일 한 곳에 두고, 여기서 SVG 를 담은 HTML 을
함께 만든다. 그림을 손으로 고치지 말고 모델을 고친 뒤 다시 돌린다.

  python3 _build.py

근거
  - docs/mockup/auth, mypage, stores, bp, config, system
  - Manyfast 기능·명세 참조 코드: R-LYZWGG, R-QTPRUQ, R-DJGLEO, R-NMDCYH, R-KJGJXP
표기 규칙은 diagram-design 스킬의 ER 유형과 whale-erp-ship 스킨을 따른다.

검사 (실패하면 exit 1)
  - 4px 격자: 박스 좌표·크기
  - 박스끼리 겹침
  - 연결선이 끝점이 아닌 박스를 지나감
  - 관계 이름·관계 수 표시가 박스나 서로와 겹침
  - 같은 변의 연결점 간격 12px 미만
"""
import html
import os
import sys
import unicodedata

OUT = os.path.dirname(os.path.abspath(__file__))

# ─── 스킨 (diagram-design style-guide · whale-erp-ship) ──────────────────────
PAPER = "#ffffff"
PAPER2 = "#fafafa"
INK = "#171717"
MUTED = "#60646c"
SOFT = "#6f747c"
RULE = "#f0f0f3"
RULE_SOLID = "#dcdee0"
ACCENT = "#8145b5"
ACCENT_TINT = "#f5eefb"
LINK = "#0d74ce"

SANS = "'Pretendard Variable', Pretendard, Inter, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Segoe UI', Roboto, sans-serif"
MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace"
FONT_LINKS = [
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css",
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap",
]

BOX_W = 240
GAP_X = 96
COL_X = [40 + i * (BOX_W + GAP_X) for i in range(4)]
HEAD_H = 52
ROW_H = 20


def r4(v):
    return int(-(-v // 4) * 4)


def text_w(s, size, latin=0.6):
    w = 0.0
    for ch in s:
        if unicodedata.combining(ch):
            continue
        w += size if unicodedata.east_asian_width(ch) in ("W", "F") else size * latin
    return w


def esc(s):
    return html.escape(s, quote=True)


# ─── 모델 ──────────────────────────────────────────────────────────────────
class Field:
    def __init__(self, spec):
        parts = (spec.split("|") + ["", "", "", "", ""])[:5]
        self.prefix, self.name, self.type, self.column, self.note = [p.strip() for p in parts]


class Entity:
    def __init__(self, id, name, table, kind, fields, col, y, desc=""):
        self.id, self.name, self.table, self.kind = id, name, table, kind
        self.fields = [Field(f) for f in fields]
        self.x = COL_X[col]
        self.y = y
        self.w = BOX_W
        self.h = HEAD_H + 20 + ROW_H * len(self.fields)
        self.desc = desc

    @property
    def box(self):
        return (self.x, self.y, self.x + self.w, self.y + self.h)


class Rel:
    def __init__(self, a, sa, b, sb, ca, cb, label="", at_a=None, at_b=None, mid=None, label_side=None):
        self.a, self.sa, self.b, self.sb = a, sa, b, sb
        self.ca, self.cb, self.label = ca, cb, label
        self.at_a, self.at_b, self.mid = at_a, at_b, mid
        self.label_side = label_side


class Diagram:
    def __init__(self, slug, nav, title, subtitle, entities, rels, cards, catalog_intro=""):
        self.slug, self.nav, self.title, self.subtitle = slug, nav, title, subtitle
        self.entities = {e.id: e for e in entities}
        self.order = [e.id for e in entities]
        self.rels, self.cards, self.catalog_intro = rels, cards, catalog_intro


E = Entity
R = Rel

KIND_TAG = {"focal": "CORE ENTITY", "entity": "ENTITY", "history": "HISTORY", "ref": "TEAM-3 REF"}

DIAGRAMS = []

# ── 0. 개요 ────────────────────────────────────────────────────────────────
DIAGRAMS.append(Diagram(
    "index", "개요", "WHALE ERP 1팀 1차 논리 ERD · 개요",
    "관리자 계정을 중심으로 점포·권한·메뉴·공통코드가 모인다. BP 마스터 계정이 조직의 뿌리이며, 소속 관리자와 점포가 이를 참조한다.",
    [
        E("customer", "관리자 계정", "customers", "focal",
          ["#|관리자 ID|id|customer_id|", "|관리자 로그인ID|text|login_id|영문·숫자 4~20자, 고유",
           "→|BP|id|bp_id|플랫폼은 NULL",
           "|권한역할|enum|role|6종",
           "→|권한 그룹|id|role_group_id|",
           "|계정 상태|enum|status|사용·미사용·탈퇴"],
          1, 40),
        E("store", "점포", "stores", "entity",
          ["#|점포 ID|id|store_id|", "|점포코드|text|store_code|ST+6자리, 고유", "→|BP|id|bp_id|", "|점포유형|enum|store_type|일반·가맹", "|점포상태|enum|status|미운영·운영·폐점"],
          0, 300),
        E("role_group", "권한 그룹", "role_groups", "entity",
          ["#|권한 코드|text|role_code|유형+6자리", "→|BP|id|bp_id|플랫폼은 NULL", "|권한명|text|name|", "|사용 상태|enum|status|사용·사용중지"],
          2, 40),
        E("menu", "메뉴", "menus", "entity",
          ["#|메뉴 코드|text|menu_code|MN+6자리", "|노출 메뉴명|text|name|", "|사용 상태|enum|status|"],
          3, 40),
        E("code_group", "공통코드 그룹", "code_groups", "entity",
          ["#|그룹 ID|id|code_group_id|", "|그룹 코드|text|group_code|대문자 밑줄, 고유, 변경 불가", "|그룹명|text|group_name|", "|사용 상태|enum|status|"],
          2, 300),
        E("code_item", "상세 코드", "code_items", "entity",
          ["#|상세코드 ID|id|code_item_id|", "|상세코드|text|value|고유", "→|그룹|id|code_group_id|", "|코드명|text|label|"],
          3, 300),
    ],
    [
        R("customer", "left", "store", "right", "1", "N", "", at_a=200, at_b=360),
        R("customer", "right", "role_group", "left", "1", "0..1", "연결", at_a=148, at_b=108),
        R("role_group", "right", "menu", "left", "N", "N", "권한메뉴", at_a=108, at_b=108),
        R("code_group", "right", "code_item", "left", "1", "N", "", at_a=368, at_b=368),
    ],
    [
        ("coral", "중심", "관리자 계정이 중심이다", ["BP 마스터·BP 관리자·가맹마스터·가맹관리자·플랫폼마스터·플랫폼관리자를 모두 담는다", "BP 코드가 조직의 뿌리 역할을 한다", "한 명에 하나의 권한 그룹이 연결된다"]),
        ("ink", "", "BP 코드가 조직의 뿌리다", ["BP 코드에 소속 관리자 여럿, 점포 여럿이 붙는다", "플랫폼 관리자는 BP 코드 없이 독립적으로 존재한다"]),
        ("muted", "", "환경설정 기준정보", ["권한 그룹은 메뉴별 CRUD 권한을 정한다", "공통코드는 플랫폼이 제공하고 BP가 일부를 덮어쓴다"]),
    ],
))

# ── 1. 인증·계정 ──────────────────────────────────────────────────────────
DIAGRAMS.append(Diagram(
    "auth", "인증·계정", "인증과 계정",
    "아이디(영문·숫자 4~20자)로 로그인하고 연속 5회 실패 시 5분 잠금한다. 접근 토큰 1시간, 갱신 토큰은 마지막 사용 후 1시간이다. BP 마스터가 사업자 회원가입으로 직접 만들거나, 플랫폼 관리자가 등록한다.",
    [
        E("session", "관리자 접속 상태", "admin_sessions", "entity",
          ["#|접속 ID|id|session_id|", "→|관리자|id|customer_id|",
           "|기기 식별 정보|text|device_info|",
           "|접근 토큰 해시|hash|access_token_hash|1시간",
           "|갱신 토큰 해시|hash|refresh_token_hash|마지막 사용 후 1시간",
           "|발급 시각|datetime|issued_at|",
           "|만료 시각|datetime|expires_at|",
           "|종료 시각|datetime|revoked_at|"],
          0, 40),
        E("temp_pw", "임시 비밀번호", "temp_passwords", "entity",
          ["#|임시 비밀번호 ID|id|temp_pw_id|", "→|관리자|id|customer_id|",
           "|비밀번호 해시|hash|password_hash|12자 무작위",
           "|발급 시각|datetime|issued_at|",
           "|만료 시각|datetime|expires_at|1시간",
           "|사용 시각|datetime|used_at|",
           "|발급 용도|enum|purpose|임시·초기·초기화"],
          0, 320),
        E("terms_ver", "약관 버전", "terms_versions", "entity",
          ["#|약관 버전 ID|id|terms_version_id|",
           "|약관 유형|enum|terms_type|이용약관·개인정보",
           "|버전 번호|text|version|v1.0 등",
           "|약관 내용|text|content|약관 본문",
           "|시행일|date|effective_date|",
           "|사용 여부|bool|is_active|현재 적용 버전"],
          0, 560),
        E("customer", "관리자 계정", "customers", "focal",
          ["#|관리자 ID|id|customer_id|", "|관리자 로그인ID|text|login_id|영문·숫자 4~20자, 고유",
           "→|BP|id|bp_id|플랫폼은 NULL",
           "|이름|text|name|한글·영문 2~20자",
           "|비밀번호 해시|hash|password_hash|",
           "|연락처|text|phone|숫자 10~11자리",
           "|이메일|text|email|고유",
           "|권한역할|enum|role|6종",
           "→|권한 그룹|id|role_group_id|",
           "→|이용약관 최근 동의 버전|id|terms_of_use_version_id|필수",
           "→|개인정보 최근 동의 버전|id|privacy_version_id|필수",
           "|약관 최근 동의 일시|datetime|terms_agreed_at|",
           "|강제 비밀번호 변경|bool|force_password_change|",
           "|로그인 실패 횟수|int|failed_login_count|5회 잠금",
           "|잠금 해제 시각|datetime|locked_until|5분 잠금",
           "|최근 로그인 일시|datetime|last_login_at|",
           "|가입경로|enum|signup_channel|BP 마스터만",
           "|계정 상태|enum|status|사용·미사용·탈퇴",
           "|삭제 여부|bool|is_deleted|",
           "|등록 일시|datetime|created_at|",
           "→|등록자|id|created_by|",
           "|최근 수정 일시|datetime|updated_at|",
           "→|수정자|id|updated_by|"],
          1, 40),
        E("login_hist", "관리자 로그인 이력", "admin_login_histories", "history",
          ["#|로그인 이력 ID|id|login_id|", "→|관리자|id|customer_id|없는 아이디면 비움",
           "|접속 IP|text|ip_address|",
           "|성공 여부|bool|succeeded|",
           "|실패 사유|enum|failure_reason|불일치·잠금·미사용·탈퇴",
           "|시도 시각|datetime|attempted_at|"],
          2, 40),
        E("bp_code", "BP 코드", "bp_codes", "focal",
          ["#|BP ID|id|bp_id|", "|BP 코드|text|bp_code|BP+6자리, 고유, 변경 불가",
           "|상호명|text|corp_name|1~50자",
           "|사업자등록번호|text|biz_reg_no|BP 간 고유",
           "|대표자명|text|biz_ceo_name|인증 결과만",
           "|개업일자|date|biz_open_date|인증 결과만",
           "|대표자 연락처|text|biz_ceo_phone|",
           "|대표자 이메일|text|biz_ceo_email|",
           "|사업장 우편번호|text|biz_zip_code|",
           "|사업장 기본주소|text|biz_address|",
           "|사업장 상세주소|text|biz_address_detail|",
           "|업태|text|biz_category|50자",
           "|종목|text|biz_item|50자",
           "|최종 인증일시|datetime|biz_verified_at|",
           "|등록 일시|datetime|created_at|",
           "→|등록자|id|created_by|",
           "|최근 수정 일시|datetime|updated_at|",
           "→|수정자|id|updated_by|"],
          2, 260),
        E("change_hist", "관리자 변경 이력", "admin_change_histories", "history",
          ["#|변경 이력 ID|id|change_id|", "→|대상 관리자|id|customer_id|",
           "|변경 유형|enum|change_type|기본정보수정·상태변경 등",
           "|변경 항목|text|field|이름·연락처·이메일 등",
           "|변경 전 값|text|before_value|",
           "|변경 후 값|text|after_value|",
           "→|변경자|id|changed_by|",
           "|변경 일시|datetime|changed_at|"],
          2, 720),
        E("terms_hist", "약관 동의 이력", "terms_agreement_histories", "history",
          ["#|동의 이력 ID|id|agreement_id|",
           "→|관리자|id|customer_id|",
           "→|약관 버전|id|terms_version_id|",
           "|동의 여부|bool|agreed|",
           "|동의 일시|datetime|agreed_at|",
           "|동의 경로|enum|channel|회원가입·재동의·약관변경"],
          0, 800),
    ],
    [
        R("customer", "left", "session", "right", "1", "N", "", at_a=108, at_b=108),
        R("customer", "left", "temp_pw", "right", "1", "N", "", at_a=368, at_b=388),
        R("customer", "left", "terms_ver", "right", "N", "1", "", at_a=408, at_b=620),
        R("customer", "left", "terms_hist", "right", "1", "N", "", at_a=448, at_b=860),
        R("customer", "right", "login_hist", "left", "1", "N", "", at_a=108, at_b=108),
        R("bp_code", "left", "customer", "right", "1", "N", "소속", at_a=328, at_b=320),
        R("customer", "right", "change_hist", "left", "1", "N", "", at_a=400, at_b=748),
    ],
    [
        ("coral", "중심", "아이디로 로그인", ["영문·숫자 4~20자 아이디로 로그인한다", "접근 토큰 1시간, 갱신 토큰은 마지막 사용 후 1시간이다", "여러 브라우저 동시 로그인을 허용한다"]),
        ("ink", "", "잠금과 임시비밀번호", ["연속 5회 실패 시 5분 잠금한다", "임시 비밀번호는 12자 무작위로 발급하고 1시간 뒤 만료한다", "초기 비밀번호 발급 시 강제 비밀번호 변경 플래그를 켠다"]),
        ("muted", "", "3팀과의 경계", ["관리자 계정(customers)은 1팀 소유다", "BP 조직 정보는 bp_codes 테이블에서 관리한다", "3팀의 계정(accounts)·직원 레코드(staff_members)와는 별도 테이블이다"]),
    ],
))

# ── 2. 점포관리 ───────────────────────────────────────────────────────────
DIAGRAMS.append(Diagram(
    "store", "점포관리", "점포관리",
    "직영(일반점포)과 가맹(가맹점포)을 같은 구조로 다룬다. 상태는 미운영 -> 운영 -> 폐점 한 방향이고, 운영 전환은 사업자정보 인증 완료가 조건이다. 사업자정보는 별도 테이블로 관리한다.",
    [
        E("bp_code_ref", "BP 코드", "bp_codes", "entity",
          ["#|BP ID|id|bp_id|", "|BP 코드|text|bp_code|BP+6자리, 고유"],
          0, 40),
        E("store", "점포", "stores", "focal",
          ["#|점포 ID|id|store_id|", "|점포코드|text|store_code|ST+6자리, 고유, 자동 채번",
           "→|BP|id|bp_id|소속 BP",
           "|점포유형|enum|store_type|일반·가맹, 변경 불가",
           "|점포명|text|name|1~50자",
           "|연락처|text|phone|숫자 9~11자리",
           "|우편번호|text|zip_code|",
           "|기본주소|text|address|",
           "|상세주소|text|address_detail|",
           "|대표 이미지|text|image_path|JPG·PNG 5MB",
           "|위도|decimal|latitude|소수 6자리",
           "|경도|decimal|longitude|소수 6자리",
           "|근무지 반경|int|geofence_radius_m|기본 100m",
           "|폐점일|date|closed_on|폐점 시 자동",
           "|점포상태|enum|status|미운영·운영·폐점",
           "|삭제 여부|bool|is_deleted|미운영만",
           "|등록 일시|datetime|created_at|",
           "→|등록자|id|created_by|",
           "|최근 수정 일시|datetime|updated_at|",
           "→|수정자|id|updated_by|"],
          1, 40),
        E("store_floor", "점포 층별정보", "store_floor_infos", "entity",
          ["#|층별정보 ID|id|floor_info_id|",
           "→|점포|id|store_id|stores FK",
           "|매장평수|decimal|floor_area_pyeong|선택",
           "|전용면적|decimal|floor_area_sqm|선택",
           "|좌석수|int|seat_count|선택",
           "|층수 구분|enum|floor_type|지상·지하",
           "|층수|int|floor_number|",
           "|삭제 여부|bool|is_deleted|",
           "|등록 일시|datetime|created_at|",
           "→|등록자|id|created_by|",
           "|최근 수정 일시|datetime|updated_at|",
           "→|수정자|id|updated_by|"],
          0, 200),
        E("store_hist", "점포 변경 이력", "store_change_histories", "history",
          ["#|변경 이력 ID|id|change_id|", "→|점포|id|store_id|",
           "|변경 항목|text|field|점포명·상태·연락처 등",
           "|변경 전 값|text|before_value|",
           "|변경 후 값|text|after_value|",
           "→|변경자|id|changed_by|",
           "|변경 일시|datetime|changed_at|"],
          2, 40),
        E("store_biz", "점포 사업자정보", "store_business_infos", "entity",
          ["#→|점포|id|store_id|stores FK, 1:1",
           "|상호명|text|biz_corp_name|직접 입력",
           "|사업자등록번호|text|biz_reg_no|전체 고유",
           "|대표자명|text|biz_ceo_name|인증 결과",
           "|개업일자|date|biz_open_date|인증 결과",
           "|대표자 연락처|text|biz_ceo_phone|",
           "|사업자 우편번호|text|biz_zip_code|",
           "|사업자 기본주소|text|biz_address|",
           "|사업자 상세주소|text|biz_address_detail|",
           "|업태|text|biz_category|50자",
           "|종목|text|biz_item|50자",
           "|최종 인증일시|datetime|biz_verified_at|",
           "|등록 일시|datetime|created_at|",
           "→|등록자|id|created_by|",
           "|최근 수정 일시|datetime|updated_at|",
           "→|수정자|id|updated_by|"],
          3, 40),
        E("mapping", "관리자 점포 매핑", "admin_store_mappings", "entity",
          ["#→|관리자|id|customer_id|", "#→|점포|id|store_id|",
           "|삭제 여부|bool|is_deleted|",
           "|등록 일시|datetime|created_at|",
           "→|등록자|id|created_by|",
           "|최근 수정 일시|datetime|updated_at|",
           "→|수정자|id|updated_by|"],
          2, 540),
        E("customer_sub", "관리자 계정 (소속)", "customers", "entity",
          ["#|관리자 ID|id|customer_id|", "|관리자 로그인ID|text|login_id|고유",
           "→|BP|id|bp_id|",
           "|권한역할|enum|role|6종"],
          0, 540),
    ],
    [
        R("bp_code_ref", "right", "store", "left", "1", "N", "소속", at_a=108, at_b=108),
        R("store", "left", "store_floor", "right", "1", "N", "", at_a=390, at_b=390),
        R("store", "right", "store_hist", "left", "1", "N", "", at_a=108, at_b=108),
        R("store", "right", "store_biz", "left", "1", "0..1", "", at_a=300, at_b=300),
        R("store", "right", "mapping", "left", "1", "N", "", at_a=460, at_b=600),
        R("customer_sub", "right", "mapping", "left", "1", "N", "", at_a=600, at_b=660),
    ],
    [
        ("coral", "중심", "점포 상태는 한 방향이다", ["미운영 -> 운영 -> 폐점 단방향 전환이다", "운영 전환은 사업자정보 인증 완료가 조건이다", "미운영 상태에서만 삭제할 수 있다"]),
        ("ink", "", "사업자·층별정보 분리", ["사업자등록번호·대표자·업태·종목 등은 별도 테이블이다", "층별정보는 한 점포에 여러 층을 등록할 수 있다(1:N)", "인증 완료 여부는 사업자등록번호 유무로 판정한다"]),
        ("muted", "", "3팀 연계", ["근무지 반경은 출퇴근 GPS 판정에 필요한 3팀 요구다", "1팀 점포 테이블에 넣을지 3팀 확장 테이블로 둘지 정해야 한다"]),
    ],
))

# ── 3. BP 마스터 계정 관리 ─────────────────────────────────────────────────
DIAGRAMS.append(Diagram(
    "bp", "BP 관리", "BP 마스터 계정 관리",
    "플랫폼 사용자가 BP 마스터 계정을 등록·조회·수정·삭제하는 영역이다. BP 마스터 계정 하나가 조직의 뿌리이며, 소속 관리자와 점포가 이를 참조한다.",
    [
        E("bp_code", "BP 코드", "bp_codes", "focal",
          ["#|BP ID|id|bp_id|", "|BP 코드|text|bp_code|BP+6자리, 고유, 변경 불가",
           "|상호명|text|corp_name|1~50자",
           "|사업자등록번호|text|biz_reg_no|BP 간 고유",
           "|대표자명|text|biz_ceo_name|인증 결과만",
           "|개업일자|date|biz_open_date|인증 결과만",
           "|대표자 연락처|text|biz_ceo_phone|",
           "|대표자 이메일|text|biz_ceo_email|",
           "|사업장 우편번호|text|biz_zip_code|",
           "|사업장 기본주소|text|biz_address|",
           "|사업장 상세주소|text|biz_address_detail|",
           "|업태|text|biz_category|50자",
           "|종목|text|biz_item|50자",
           "|최종 인증일시|datetime|biz_verified_at|",
           "|등록 일시|datetime|created_at|",
           "→|등록자|id|created_by|",
           "|최근 수정 일시|datetime|updated_at|",
           "→|수정자|id|updated_by|"],
          0, 40),
        E("bp_hist", "BP 변경 이력", "bp_change_histories", "history",
          ["#|변경 이력 ID|id|change_id|", "→|BP|id|bp_id|",
           "|변경 항목|text|field|상호명·BP상태 등",
           "|변경 전 값|text|before_value|",
           "|변경 후 값|text|after_value|",
           "→|변경자|id|changed_by|",
           "|변경 일시|datetime|changed_at|",
           "|비고|text|note|탈퇴 줄에만 탈퇴 사유"],
          1, 40),
        E("customer_sub", "관리자 계정 (소속)", "customers", "entity",
          ["#|관리자 ID|id|customer_id|", "|관리자 로그인ID|text|login_id|고유", "→|BP|id|bp_id|",
           "|권한역할|enum|role|BP관리자·가맹마스터 등"],
          1, 340),
        E("store", "점포", "stores", "entity",
          ["#|점포 ID|id|store_id|", "|점포코드|text|store_code|ST+6자리, 고유", "→|BP|id|bp_id|"],
          0, 560),
        E("account_ref", "계정", "accounts", "ref",
          ["#|계정 ID|id|account_id|", "|이메일 아이디|text|email|"],
          2, 40, "3팀 소유. 1팀은 참조만 한다."),
        E("staff_ref", "직원 레코드", "staff_members", "ref",
          ["#|직원 레코드 ID|id|staff_member_id|", "→|점포|id|store_id|",
           "→|계정|id|account_id|"],
          2, 220, "3팀 소유. 1팀은 참조만 한다."),
    ],
    [
        R("bp_code", "right", "bp_hist", "left", "1", "N", "", at_a=108, at_b=108),
        R("bp_code", "bottom", "store", "top", "1", "N", "", at_a=120, at_b=120),
        R("bp_code", "right", "customer_sub", "left", "1", "N", "소속", at_a=280, at_b=400),
    ],
    [
        ("coral", "중심", "BP 코드가 조직의 뿌리다", ["BP 코드가 BP 조직 정보를 관리한다", "가입경로는 회원가입과 플랫폼등록 두 가지다", "BP 상태 변경 시 소속 계정과 점포도 영향받는다"]),
        ("ink", "", "BP 코드와 소속", ["BP 코드 1건에 소속 관리자 N명이다", "변경 이력은 상호명·상태·사업자정보 등을 기록한다"]),
        ("muted", "", "3팀 참조", ["계정(accounts)과 직원 레코드(staff_members)는 3팀 소유다", "1팀 엔티티는 식별자로 참조만 한다"]),
    ],
))

# ── 4. 시스템관리 ─────────────────────────────────────────────────────────
DIAGRAMS.append(Diagram(
    "system", "환경설정 & 시스템관리", "환경설정 & 시스템관리",
    "BP·플랫폼의 권한 그룹·공통코드·메뉴·휴일과 플랫폼 공식 휴일을 관리한다.",
    [
        E("role_group", "권한 그룹", "role_groups", "focal",
          ["#|권한 그룹 ID|id|role_group_id|", "|권한 코드|text|role_code|유형+6자리, 고유, 변경 불가",
           "→|BP|id|bp_id|플랫폼은 NULL",
           "|권한 유형|enum|role_type|6종, 변경 불가",
           "|권한명|text|name|같은 BP 안 고유",
           "|설명|text|description|",
           "|사용 상태|enum|status|사용·사용중지",
           "|마스터 권한 여부|bool|is_master|",
           "→|관리계정|id|manager_customer_id|FA는 가맹마스터",
           "|삭제 여부|bool|is_deleted|",
           "|등록 일시|datetime|created_at|",
           "→|등록자|id|created_by|",
           "|최근 수정 일시|datetime|updated_at|",
           "→|수정자|id|updated_by|"],
          0, 40),
        E("role_menu", "권한 메뉴", "role_group_menus", "entity",
          ["#→|권한 그룹|id|role_group_id|", "#→|메뉴|id|menu_id|",
           "|조회|bool|can_read|", "|등록|bool|can_create|",
           "|수정|bool|can_update|", "|삭제|bool|can_delete|",
           "|삭제 여부|bool|is_deleted|",
           "|등록 일시|datetime|created_at|",
           "→|등록자|id|created_by|",
           "|최근 수정 일시|datetime|updated_at|",
           "→|수정자|id|updated_by|"],
          1, 40),
        E("code_group", "공통코드 그룹", "code_groups", "focal",
          ["#|그룹 ID|id|code_group_id|", "|그룹 코드|text|group_code|대문자 밑줄, 고유, 변경 불가",
           "|그룹명|text|group_name|",
           "|관리 주체|enum|ownership|플랫폼고정·플랫폼제공",
           "|설명|text|description|",
           "|사용 상태|enum|status|사용·사용중지",
           "|표시 순서|int|sort_order|",
           "|삭제 여부|bool|is_deleted|",
           "|등록 일시|datetime|created_at|",
           "→|등록자|id|created_by|",
           "|최근 수정 일시|datetime|updated_at|",
           "→|수정자|id|updated_by|"],
          0, 420),
        E("code_item", "상세 코드", "code_items", "entity",
          ["#|상세코드 ID|id|code_item_id|", "|상세코드|text|value|그룹 내 고유, 변경 불가",
           "→|그룹|id|code_group_id|",
           "→|BP|id|bp_id|BP전용만",
           "|코드명|text|label|",
           "|관리 주체|enum|item_ownership|플랫폼고정·제공·BP전용",
           "|사용 상태|enum|status|사용·사용중지",
           "|표시 순서|int|sort_order|",
           "|삭제 여부|bool|is_deleted|",
           "|등록 일시|datetime|created_at|",
           "→|등록자|id|created_by|",
           "|최근 수정 일시|datetime|updated_at|",
           "→|수정자|id|updated_by|"],
          1, 420),
        E("menu", "메뉴", "menus", "entity",
          ["#|메뉴 ID|id|menu_id|", "|메뉴 코드|text|menu_code|MN+6자리, 고유, 변경 불가",
           "→|서비스 코드|text|service_code|공통코드",
           "→|상위 메뉴|id|parent_menu_id|최대 3단계",
           "|노출 메뉴명|text|name|",
           "|URL|text|url|",
           "|단계|int|depth|1~3",
           "|노출 순서|int|sort_order|",
           "|사용 상태|enum|status|",
           "|삭제 여부|bool|is_deleted|",
           "|등록 일시|datetime|created_at|",
           "→|등록자|id|created_by|",
           "|최근 수정 일시|datetime|updated_at|",
           "→|수정자|id|updated_by|"],
          2, 40),
        E("holiday", "BP 휴일", "bp_holidays", "entity",
          ["#|휴일 ID|id|holiday_id|", "→|BP|id|bp_id|",
           "|적용 범위|enum|scope|전체·특정",
           "|휴일 시작날짜|date|start_date|",
           "|휴일 종료날짜|date|end_date|",
           "|휴일명|text|name|30자",
           "|종일 여부|bool|is_all_day|",
           "|설명|text|description|",
           "|반복 규칙|json|repeat_rule|",
           "|삭제 여부|bool|is_deleted|",
           "|등록 일시|datetime|created_at|",
           "→|등록자|id|created_by|",
           "|최근 수정 일시|datetime|updated_at|",
           "→|수정자|id|updated_by|"],
          3, 40),
        E("holiday_store", "휴일 점포 매핑", "holiday_store_mappings", "entity",
          ["#→|휴일|id|holiday_id|",
           "#→|대상 점포|id|store_id|",
           "#|휴일 날짜|date|holiday_date|",
           "|삭제 여부|bool|is_deleted|",
           "|등록 일시|datetime|created_at|",
           "→|등록자|id|created_by|",
           "|최근 수정 일시|datetime|updated_at|",
           "→|수정자|id|updated_by|"],
          3, 440),
        E("holiday_hist", "BP 휴일 변경 이력", "bp_holiday_change_histories", "history",
          ["#|변경 이력 ID|id|change_id|", "→|휴일|id|holiday_id|",
           "|변경 유형|enum|change_type|등록·수정·삭제",
           "|변경 항목|text|field|",
           "|변경 전 값|text|before_value|",
           "|변경 후 값|text|after_value|",
           "→|변경자|id|changed_by|",
           "|변경 일시|datetime|changed_at|"],
          2, 420),
        E("public_holiday", "플랫폼 공식 휴일", "public_holidays", "entity",
          ["#|공식 휴일 ID|id|public_holiday_id|",
           "|날짜|date|holiday_date|한 날짜에 한 건",
           "|연도|int|year|",
           "|휴일명|text|name|",
           "|최종 동기화 일시|datetime|synced_at|"],
          2, 680),
        E("sync_hist", "동기화 이력", "public_holiday_sync_histories", "history",
          ["#|동기화 이력 ID|id|sync_id|",
           "|대상 연도|int|year|",
           "|동기화 일시|datetime|synced_at|",
           "|등록 건수|int|created_count|",
           "|수정 건수|int|updated_count|",
           "|결과|enum|result|성공·실패"],
          3, 740),
    ],
    [
        R("role_group", "right", "role_menu", "left", "1", "N", "", at_a=108, at_b=108),
        R("menu", "left", "role_menu", "right", "1", "N", "", at_a=108, at_b=168),
        R("code_group", "right", "code_item", "left", "1", "N", "", at_a=488, at_b=488),
        R("holiday", "bottom", "holiday_store", "top", "1", "N", ""),
        R("holiday", "left", "holiday_hist", "right", "1", "N", "", at_a=300, at_b=488),
    ],
    [
        ("coral", "중심", "권한·공통코드·메뉴", ["권한 그룹은 메뉴별 CRUD 4가지 권한을 정한다", "공통코드는 플랫폼고정·플랫폼제공·BP전용 3단계다", "메뉴는 최대 3단계, 서비스 코드로 분류한다"]),
        ("ink", "", "BP 휴일과 공식 휴일", ["BP 휴일은 휴일 점포 매핑으로 적용 점포를 관리한다", "공공 API에서 연도별 공식 휴일을 동기화한다", "BP 휴일 캘린더에 공식 휴일을 조회용으로 합쳐 표시한다"]),
        ("muted", "", "열린 쟁점", ["BP 공통코드 상세 코드의 관리 주체를 따로 저장하는가 (CONFIG-7)", "메뉴 삭제와 변경 이력 유무 (SYSTEM-7)"]),
    ],
))


# ─── 기하 ──────────────────────────────────────────────────────────────────
def edge_point(e, side, at):
    x0, y0, x1, y1 = e.box
    if side == "left":
        return (x0, at)
    if side == "right":
        return (x1, at)
    if side == "top":
        return (at, y0)
    return (at, y1)


def resolve_attach(d):
    """관계마다 양 끝 좌표를 정한다. 지정이 없으면 같은 변의 연결을 고르게 편다."""
    uses = {}
    for i, r in enumerate(d.rels):
        uses.setdefault((r.a, r.sa), []).append((i, "a"))
        uses.setdefault((r.b, r.sb), []).append((i, "b"))
    pts = {}
    for (eid, side), lst in uses.items():
        e = d.entities[eid]
        x0, y0, x1, y1 = e.box
        horiz = side in ("top", "bottom")
        lo, hi = (x0, x1) if horiz else (y0, y1)
        free = [(i, end) for i, end in lst if getattr(d.rels[i], "at_" + end) is None]
        for k, (i, end) in enumerate(free, 1):
            r = d.rels[i]
            other = d.entities[r.b if end == "a" else r.a]
            ox0, oy0, ox1, oy1 = other.box
            olo, ohi = (ox0, ox1) if horiz else (oy0, oy1)
            ov0, ov1 = max(lo, olo), min(hi, ohi)
            if len(free) == 1 and ov1 - ov0 >= 32:
                v = r4((ov0 + ov1) / 2 - 2)
            else:
                v = r4(lo + (hi - lo) * k / (len(free) + 1) - 2)
            setattr(r, "at_" + end, v)
    for i, r in enumerate(d.rels):
        pts[i] = (edge_point(d.entities[r.a], r.sa, r.at_a), edge_point(d.entities[r.b], r.sb, r.at_b))
    return pts


def route(r, p, q):
    (ax, ay), (bx, by) = p, q
    ha, hb = r.sa in ("left", "right"), r.sb in ("left", "right")
    if ha and hb:
        if ay == by:
            return [p, q]
        mx = r.mid if r.mid is not None else r4((ax + bx) / 2 - 2)
        return [p, (mx, ay), (mx, by), q]
    if not ha and not hb:
        if ax == bx:
            return [p, q]
        my = r.mid if r.mid is not None else r4((ay + by) / 2 - 2)
        if r.sa == "bottom" and r.sb == "bottom":
            return [p, (ax, my), (bx, my), q]
        return [p, (ax, my), (bx, my), q]
    if ha and not hb:
        return [p, (bx, ay), q]
    return [p, (ax, by), q]


def path_d(pts, radius=8):
    d = f"M {pts[0][0]},{pts[0][1]}"
    for i in range(1, len(pts) - 1):
        (x0, y0), (x1, y1), (x2, y2) = pts[i - 1], pts[i], pts[i + 1]
        l1 = abs(x1 - x0) + abs(y1 - y0)
        l2 = abs(x2 - x1) + abs(y2 - y1)
        rr = min(radius, l1 / 2, l2 / 2)
        dx1, dy1 = ((x1 > x0) - (x1 < x0), (y1 > y0) - (y1 < y0))
        dx2, dy2 = ((x2 > x1) - (x2 < x1), (y2 > y1) - (y2 < y1))
        bx, by = x1 - dx1 * rr, y1 - dy1 * rr
        ax, ay = x1 + dx2 * rr, y1 + dy2 * rr
        d += f" L {bx:g},{by:g} Q {x1},{y1} {ax:g},{ay:g}"
    d += f" L {pts[-1][0]},{pts[-1][1]}"
    return d


def card_rect(pt_from, pt_to, text):
    """관계 수 표시를 끝점 가까이, 선 옆에 둔다."""
    (x0, y0), (x1, y1) = pt_from, pt_to
    w = r4(text_w(text, 10, 0.62) + 8)
    h = 12
    if y0 == y1:  # 가로
        dirx = 1 if x1 > x0 else -1
        cx = x0 + dirx * (6 + w / 2)
        return (cx - w / 2, y0 - 4 - h, cx + w / 2, y0 - 4)
    diry = 1 if y1 > y0 else -1
    cy = y0 + diry * (8 + h / 2)
    return (x0 + 4, cy - h / 2, x0 + 4 + w, cy + h / 2)


def label_rect(pts, text, side=None):
    segs = [(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    (a, b) = max(segs, key=lambda s: abs(s[1][0] - s[0][0]) + abs(s[1][1] - s[0][1]))
    w = r4(text_w(text, 12) + 8)
    h = 16
    if a[1] == b[1]:  # 가로선
        cx = r4((a[0] + b[0]) / 2 - 2)
        if side == "above":
            return (cx - w / 2, a[1] - 8 - h, cx + w / 2, a[1] - 8)
        return (cx - w / 2, a[1] + 8, cx + w / 2, a[1] + 8 + h)
    cy = r4((a[1] + b[1]) / 2 - 2)  # 세로선
    if side == "right":
        return (a[0] + 8, cy - h / 2, a[0] + 8 + w, cy + h / 2)
    return (a[0] - 8 - w, cy - h / 2, a[0] - 8, cy + h / 2)


def overlap(r1, r2, pad=0):
    return r1[0] < r2[2] + pad and r2[0] < r1[2] + pad and r1[1] < r2[3] + pad and r2[1] < r1[3] + pad


def seg_hits_box(a, b, box):
    x0, y0, x1, y1 = box
    sx0, sx1 = sorted((a[0], b[0]))
    sy0, sy1 = sorted((a[1], b[1]))
    return sx0 < x1 - 1 and sx1 > x0 + 1 and sy0 < y1 - 1 and sy1 > y0 + 1


def check(d, geom):
    errs = []
    ents = list(d.entities.values())
    for e in ents:
        for v in (e.x, e.y, e.w, e.h):
            if v % 4:
                errs.append(f"{d.slug}: {e.id} 좌표·크기 {v} 가 4의 배수가 아님")
    for i, e in enumerate(ents):
        for f in ents[i + 1:]:
            if overlap(e.box, f.box, 20):
                errs.append(f"{d.slug}: 박스 {e.id} 와 {f.id} 가 겹치거나 20px 안으로 붙음")
        for fld in e.fields:
            need = 16 + text_w(fld.prefix + " " + fld.name, 12) + 12 + text_w(fld.type, 9, 0.62) + 16
            if need > e.w:
                errs.append(f"{d.slug}: {e.id}.{fld.name} 가 박스 폭을 넘음 ({need:.0f}>{e.w})")
    marks = []
    for i, r in enumerate(d.rels):
        pts = geom[i]["pts"]
        ea, eb = d.entities[r.a], d.entities[r.b]
        for name, at, e in (("a", r.at_a, ea), ("b", r.at_b, eb)):
            side = r.sa if name == "a" else r.sb
            x0, y0, x1, y1 = e.box
            lo, hi = (x0, x1) if side in ("top", "bottom") else (y0, y1)
            if not (lo + 8 <= at <= hi - 8):
                errs.append(f"{d.slug}: 관계 {r.a}-{r.b} 의 연결점 {at} 가 {e.id} 변 밖")
        for s in range(len(pts) - 1):
            for e in ents:
                if e.id in (r.a, r.b):
                    continue
                if seg_hits_box(pts[s], pts[s + 1], e.box):
                    errs.append(f"{d.slug}: 관계 {r.a}-{r.b} 선이 {e.id} 박스를 지나감")
        for rect, what in geom[i]["marks"]:
            for e in ents:
                if overlap(rect, e.box):
                    errs.append(f"{d.slug}: {r.a}-{r.b} {what} 가 {e.id} 박스와 겹침")
            marks.append((rect, f"{r.a}-{r.b} {what}"))
    for i, r in enumerate(d.rels):
        for rect, what in geom[i]["marks"]:
            for j, r2 in enumerate(d.rels):
                if j == i:
                    continue
                p2 = geom[j]["pts"]
                for s in range(len(p2) - 1):
                    if seg_hits_box(p2[s], p2[s + 1], (rect[0] - 2, rect[1] - 2, rect[2] + 2, rect[3] + 2)):
                        errs.append(f"{d.slug}: {r.a}-{r.b} {what} 가 {r2.a}-{r2.b} 선을 덮음")
    for i, (ra, na) in enumerate(marks):
        for rb, nb in marks[i + 1:]:
            if overlap(ra, rb, 2):
                errs.append(f"{d.slug}: 표시 겹침 — {na} / {nb}")
    edges = {}
    for i, r in enumerate(d.rels):
        edges.setdefault((r.a, r.sa), []).append(r.at_a)
        edges.setdefault((r.b, r.sb), []).append(r.at_b)
    for key, ats in edges.items():
        ats = sorted(ats)
        for u, v in zip(ats, ats[1:]):
            if v - u < 12:
                errs.append(f"{d.slug}: {key} 변의 연결점 간격 {v-u}px")
    return errs


# ─── SVG ───────────────────────────────────────────────────────────────────
def t(x, y, s, size=12, fill=INK, family=SANS, weight=None, anchor=None, spacing=None):
    a = f' x="{x:g}" y="{y:g}" fill="{fill}" font-size="{size}" font-family="{family}"'
    if weight:
        a += f' font-weight="{weight}"'
    if anchor:
        a += f' text-anchor="{anchor}"'
    if spacing:
        a += f' letter-spacing="{spacing}"'
    return f"<text{a}>{esc(s)}</text>"


def entity_svg(e):
    x, y, w, h = e.x, e.y, e.w, e.h
    if e.kind == "focal":
        fill, stroke, head, dash, tagc = "rgba(129,69,181,0.04)", ACCENT, "rgba(129,69,181,0.10)", "", ACCENT
    elif e.kind == "history":
        fill, stroke, head, dash, tagc = "rgba(23,23,23,0.02)", "rgba(23,23,23,0.32)", "rgba(23,23,23,0.04)", ' stroke-dasharray="4,3"', MUTED
    elif e.kind == "ref":
        fill, stroke, head, dash, tagc = "rgba(13,116,206,0.03)", "rgba(13,116,206,0.60)", "rgba(13,116,206,0.07)", ' stroke-dasharray="2,3"', LINK
    else:
        fill, stroke, head, dash, tagc = PAPER, INK, "rgba(23,23,23,0.04)", "", MUTED
    o = [f'<g id="ent-{e.id}">',
         f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{PAPER}"/>',
         f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{fill}" stroke="{stroke}" stroke-width="1"{dash}/>',
         f'<rect x="{x+1}" y="{y+1}" width="{w-2}" height="{HEAD_H-1}" rx="5" fill="{head}"/>',
         f'<line x1="{x}" y1="{y+HEAD_H}" x2="{x+w}" y2="{y+HEAD_H}" stroke="{stroke}" stroke-opacity="0.35" stroke-width="1"/>',
         t(x + 16, y + 20, f"{KIND_TAG[e.kind]} · {e.table}", 8, tagc, MONO, 500, spacing="0.08em"),
         t(x + 16, y + 40, e.name, 16, INK, SANS, 600)]
    for i, f in enumerate(e.fields):
        by = y + HEAD_H + 24 + ROW_H * i
        pre = f.prefix.replace("#→", "#→")
        if "#" in pre and "→" in pre:
            kt = "pkfk"
        elif "#" in pre:
            kt = "pk"
        elif "→" in pre:
            kt = "fk"
        else:
            kt = "none"
        o.append(f'<g data-key="{kt}">')
        if pre:
            o.append(t(x + 16, by, pre, 11, ACCENT if "#" in pre else MUTED, MONO, 600))
        o.append(t(x + 16 + (24 if pre == "#→" else 14 if pre else 0), by, f.name, 12, INK if "#" in pre else "#2b2e33", SANS,
                   600 if "#" in pre else 400))
        o.append(t(x + w - 16, by, f.type, 9, SOFT, MONO, anchor="end"))
        o.append('</g>')
    o.append("</g>")
    return "\n".join(o)


def build_svg(d):
    geom = {}
    pts_all = resolve_attach(d)
    for i, r in enumerate(d.rels):
        p, q = pts_all[i]
        pts = route(r, p, q)
        marks = [(card_rect(pts[0], pts[1], r.ca), "관계 수(시작)"), (card_rect(pts[-1], pts[-2], r.cb), "관계 수(끝)")]
        if r.label:
            marks.append((label_rect(pts, r.label, r.label_side), "관계 이름"))
        geom[i] = {"pts": pts, "marks": marks}
    errs = check(d, geom)

    ents = list(d.entities.values())
    W = max(e.box[2] for e in ents) + 40
    bottoms = [e.box[3] for e in ents]
    for g in geom.values():
        bottoms += [pt[1] for pt in g["pts"]] + [m[0][3] for m in g["marks"]]
    H0 = r4(max(bottoms)) + 40
    legend_y = H0 + 16
    H = legend_y + 56

    out = [f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="erd-{d.slug}-title erd-{d.slug}-desc" style="min-width:{W}px">',
           f'<title id="erd-{d.slug}-title">{esc(d.title)}</title>',
           f'<desc id="erd-{d.slug}-desc">{esc(d.title)} 논리 ERD. 엔티티 {len(ents)}개와 관계 {len(d.rels)}개를 보여 준다: {esc(", ".join(e.name for e in ents))}.</desc>',
           f'<rect width="100%" height="100%" fill="{PAPER}"/>']
    # 1) 선
    for i, r in enumerate(d.rels):
        out.append(f'<path d="{path_d(geom[i]["pts"])}" fill="none" stroke="{MUTED}" stroke-width="1"/>')
    # 2) 박스
    for e in ents:
        out.append(entity_svg(e))
    # 3) 표시
    for i, r in enumerate(d.rels):
        for (rect, what), txt in zip(geom[i]["marks"], [r.ca, r.cb, r.label]):
            x0, y0, x1, y1 = rect
            out.append(f'<rect x="{x0:g}" y="{y0:g}" width="{x1-x0:g}" height="{y1-y0:g}" rx="2" fill="{PAPER}"/>')
            if what == "관계 이름":
                out.append(t((x0 + x1) / 2, y1 - 4, txt, 12, MUTED, SANS, 500, "middle"))
            else:
                out.append(t((x0 + x1) / 2, y1 - 2, txt, 10, MUTED, MONO, 600, "middle"))
    # 4) 범례
    out.append(f'<line x1="40" y1="{legend_y-8}" x2="{W-40}" y2="{legend_y-8}" stroke="{RULE_SOLID}" stroke-width="0.8"/>')
    out.append(t(40, legend_y + 12, "LEGEND", 8, MUTED, MONO, 500, spacing="0.18em"))
    lx, ly = 40, legend_y + 28
    items = [("focal", "중심 엔티티"), ("entity", "엔티티"), ("history", "이력"), ("ref", "3팀 소유 · 참조만")]
    for kind, label in items:
        if kind == "focal":
            out.append(f'<rect x="{lx}" y="{ly}" width="16" height="12" rx="2" fill="rgba(129,69,181,0.04)" stroke="{ACCENT}"/>')
        elif kind == "history":
            out.append(f'<rect x="{lx}" y="{ly}" width="16" height="12" rx="2" fill="rgba(23,23,23,0.02)" stroke="rgba(23,23,23,0.32)" stroke-dasharray="4,3"/>')
        elif kind == "ref":
            out.append(f'<rect x="{lx}" y="{ly}" width="16" height="12" rx="2" fill="rgba(13,116,206,0.03)" stroke="rgba(13,116,206,0.60)" stroke-dasharray="2,3"/>')
        else:
            out.append(f'<rect x="{lx}" y="{ly}" width="16" height="12" rx="2" fill="{PAPER}" stroke="{INK}"/>')
        out.append(t(lx + 24, ly + 11, label, 12, MUTED, SANS, 500))
        lx += r4(24 + text_w(label, 12) + 32)
    for sym, label in (("#", "식별자"), ("→", "참조"), ("1 · N · 0..1", "관계 수")):
        out.append(t(lx, ly + 11, sym, 11, ACCENT if sym == "#" else MUTED, MONO, 600))
        sx = lx + r4(text_w(sym, 11, 0.62) + 8)
        out.append(t(sx, ly + 11, label, 12, MUTED, SANS, 500))
        lx = sx + r4(text_w(label, 12) + 32)
    out.append("</svg>")
    return "\n".join(out), errs, W


# ─── HTML ──────────────────────────────────────────────────────────────────
CSS = f"""
*,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}
:root{{--paper:{PAPER};--paper-2:{PAPER2};--ink:{INK};--muted:{MUTED};--soft:{SOFT};--rule:{RULE};--rule-solid:{RULE_SOLID};--accent:{ACCENT};--accent-tint:{ACCENT_TINT};--link:{LINK};
--sans:{SANS};--mono:{MONO}}}
body{{font-family:var(--sans);background:var(--paper-2);color:var(--ink);padding:40px 32px 64px;-webkit-font-smoothing:antialiased}}
.container{{max-width:1400px;margin:0 auto}}
.header{{margin-bottom:24px}}
.eyebrow{{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:12px}}
h1{{font-family:var(--sans);font-size:32px;font-weight:600;letter-spacing:-.6px;line-height:1.25;margin-bottom:12px}}
.subtitle{{font-size:15px;line-height:1.65;color:var(--muted);max-width:72ch}}
nav{{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0}}
nav a{{font-size:13px;color:var(--muted);text-decoration:none;padding:6px 12px;border:1px solid var(--rule-solid);border-radius:6px;background:var(--paper)}}
nav a:hover{{color:var(--ink);border-color:var(--ink)}}
nav a[aria-current="page"]{{color:var(--accent);border-color:var(--accent);background:var(--accent-tint)}}
nav a:focus-visible{{outline:2px solid var(--accent);outline-offset:2px}}
.diagram{{background:var(--paper);border:1px solid var(--rule-solid);border-radius:8px;padding:16px;overflow-x:auto}}
.diagram svg{{display:block;width:100%;height:auto}}
.cards{{display:grid;grid-template-columns:1.2fr 1fr .9fr;gap:16px;margin-top:16px}}
@media (max-width:900px){{.cards{{grid-template-columns:1fr}}}}
.card{{background:var(--paper);border:1px solid var(--rule-solid);border-radius:6px;padding:20px}}
.card .ey{{font-family:var(--mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}}
.card-h{{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--rule)}}
.dot{{width:7px;height:7px;border-radius:50%}}
.dot.coral{{background:var(--accent)}} .dot.ink{{background:var(--ink)}} .dot.muted{{background:var(--soft)}}
.card h3{{font-size:15px;font-weight:600}}
.card ul{{list-style:none;color:var(--muted);font-size:13.5px;line-height:1.6}}
.card li{{position:relative;padding-left:14px;margin-bottom:6px}}
.card li::before{{content:'—';position:absolute;left:0;color:var(--rule-solid)}}
.index-list{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-top:16px}}
.index-list a{{display:block;background:var(--paper);border:1px solid var(--rule-solid);border-radius:6px;padding:16px;text-decoration:none;color:var(--ink)}}
.index-list a:hover{{border-color:var(--ink)}}
.index-list b{{display:block;font-size:15px;margin-bottom:4px}}
.index-list span{{font-size:13px;color:var(--muted);line-height:1.5}}
.index-list .n{{font-family:var(--mono);font-size:11px;color:var(--soft);margin-top:8px;display:block}}
h2{{font-family:var(--sans);font-size:20px;font-weight:600;letter-spacing:-.4px;margin:40px 0 8px}}
.footer{{margin-top:32px;padding-top:20px;border-top:1px solid var(--rule-solid);font-family:var(--mono);font-size:11px;letter-spacing:.04em;color:var(--soft);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}}
.nav-row{{display:flex;align-items:center;gap:16px;margin:24px 0;flex-wrap:wrap}}
.nav-row nav{{display:flex;flex-wrap:wrap;gap:8px;margin:0}}
.key-btns{{display:inline-flex;gap:6px;margin-left:auto}}
.key-btns button{{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:.06em;padding:5px 12px;border:1px solid var(--rule-solid);border-radius:6px;background:var(--paper);color:var(--muted);cursor:pointer;transition:all .15s}}
.key-btns button:hover{{color:var(--ink);border-color:var(--ink)}}
.key-btns button[aria-pressed="true"]{{color:var(--accent);border-color:var(--accent);background:var(--accent-tint)}}
.diagram.show-pk g[data-key="fk"],.diagram.show-pk g[data-key="none"]{{opacity:.1;transition:opacity .2s}}
.diagram.show-fk g[data-key="pk"],.diagram.show-fk g[data-key="none"]{{opacity:.1;transition:opacity .2s}}
.diagram g[data-key]{{transition:opacity .2s}}
"""


def page(d, svg):
    cur = ' aria-current="page"'
    nav = "".join(
        f'<a href="{x.slug}.html"{cur if x.slug == d.slug else ""}>{esc(x.nav)}</a>' for x in DIAGRAMS)
    cards = []
    for dot, ey, title, items in d.cards:
        lis = "".join(f"<li>{esc(i)}</li>" for i in items)
        eyh = f'<p class="ey">{esc(ey)}</p>' if ey else ""
        cards.append(f'<div class="card">{eyh}<div class="card-h"><span class="dot {dot}"></span><h3>{esc(title)}</h3></div><ul>{lis}</ul></div>')
    extra = ""
    if d.slug == "index":
        links = []
        for x in DIAGRAMS[1:]:
            names = " · ".join(e.name for e in x.entities.values())
            links.append(f'<a href="{x.slug}.html"><b>{esc(x.nav)}</b><span>{esc(names)}</span>'
                         f'<span class="n">ENTITY {len(x.entities)} · REL {len(x.rels)}</span></a>')
        extra = ('<h2>영역별 상세</h2><p class="subtitle">한 장에 엔티티를 8개 넘게 두지 않으려고 영역마다 나눴다. '
                 '속성의 제안 컬럼명과 비고는 README.md 카탈로그에 있다.</p>'
                 f'<div class="index-list">{"".join(links)}</div>')
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(d.title)}</title>
{"".join(f'<link href="{u}" rel="stylesheet">' for u in FONT_LINKS)}
<style>{CSS}</style>
</head>
<body>
<div class="container">
<div class="header">
<p class="eyebrow">WHALE ERP · LOGICAL ERD · 1차 범위 · 1팀</p>
<h1>{esc(d.title)}</h1>
<p class="subtitle">{esc(d.subtitle)}</p>
</div>
<div class="nav-row">
<nav aria-label="ERD 영역">{nav}</nav>
<div class="key-btns" role="group" aria-label="키 필터">
<button type="button" aria-pressed="false" data-filter="pk">PK</button>
<button type="button" aria-pressed="false" data-filter="fk">FK</button>
</div>
</div>
<div class="diagram">
{svg}
</div>
<div class="cards">{"".join(cards)}</div>
{extra}
<div class="footer"><span>근거 · 1팀 목업 (auth·mypage·stores·bp·config·system) · Manyfast 명세</span><span>_build.py 로 생성 · 손으로 고치지 말 것</span></div>
</div>
<script>
document.querySelectorAll('.key-btns button').forEach(function(btn){{
btn.addEventListener('click',function(){{
var f=btn.dataset.filter,d=document.querySelector('.diagram'),on=btn.getAttribute('aria-pressed')==='true';
document.querySelectorAll('.key-btns button').forEach(function(b){{b.setAttribute('aria-pressed','false')}});
d.classList.remove('show-pk','show-fk');
if(!on){{btn.setAttribute('aria-pressed','true');d.classList.add('show-'+f)}}
}})
}});
</script>
</body>
</html>
"""


def main():
    all_errs = []
    for d in DIAGRAMS:
        svg, errs, W = build_svg(d)
        all_errs += errs
        with open(os.path.join(OUT, f"{d.slug}.html"), "w", encoding="utf-8") as fh:
            fh.write(page(d, svg))
    n_ent = len({e.table for d in DIAGRAMS for e in d.entities.values()})
    print(f"ERD {len(DIAGRAMS)}장 · 고유 엔티티 {n_ent}개 생성")
    if all_errs:
        print(f"\n검사 실패 {len(all_errs)}건")
        for e in all_errs:
            print("  -", e)
        return 1
    print("검사 통과")
    return 0


if __name__ == "__main__":
    sys.exit(main())
