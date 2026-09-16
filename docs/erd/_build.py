#!/usr/bin/env python3
"""WHALE ERP 1차 범위 논리 ERD 생성기.

모델(엔티티·관계)을 이 파일 한 곳에 두고, 여기서 SVG 를 담은 HTML 과
README.md 카탈로그를 함께 만든다. 그림을 손으로 고치지 말고 모델을 고친 뒤 다시 돌린다.

  python3 docs/erd/_build.py

근거
  - Manyfast 명세의 dataSpec 슬롯 (2026-09-15 11:16 읽음)
  - 목업 확정 쟁점: front docs/mockup (STAFF·HOME·SUPPORT·NOTIFY), staff docs/mockup (ATT·LOGIN·TAX·NOTI)
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

# 글꼴은 목업(docs/mockup/assets/whale.css)과 같게 둔다 — 한글 Pretendard, 라틴 Inter, 숫자·ID JetBrains Mono.
# diagram-design 기본 글꼴(Geist·Instrument Serif)보다 프로젝트 디자인이 우선이다.
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
        # "prefix|이름|타입|컬럼|비고"  prefix: '#', '→', '#→', ''
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

# 공용 참조 엔티티 (1팀 소유)
def ref_store(col, y, extra=()):
    return E("store", "점포", "stores", "ref",
             ["#|점포 ID|id|store_id|1팀 점포 정보 관리", "→|BP|id|bp_id|1팀 BP", "|점포 유형|enum|store_type|직영·가맹", *extra],
             col, y, "1팀 영역. 3팀은 참조만 한다.")


def ref_admin(col, y):
    return E("admin", "관리자 계정", "customers", "ref",
             ["#|관리자 ID|id|admin_id|api customers 테이블", "→|BP|id|bp_id|", "|역할|enum|role|BP 마스터·BP 관리자·가맹마스터·가맹관리자·플랫폼"],
             col, y, "1팀 영역(환경설정·권한). api 저장소에서는 customers 테이블.")


DIAGRAMS = []

# ── 0. 개요 ────────────────────────────────────────────────────────────────
DIAGRAMS.append(Diagram(
    "index", "개요", "WHALE ERP 1차 논리 ERD · 개요",
    "직원 레코드를 중심으로 업무 데이터가 모인다. 계정은 사람, 직원 레코드는 점포별 소속이다. 계약·근무스케줄·출퇴근·급여명세서·TO-DO는 모두 직원 레코드에 붙는다.",
    [
        E("account", "계정", "accounts", "entity",
          ["#|계정 ID|id|account_id|", "|이메일 아이디|text|email|로그인 아이디, 고유", "|본인인증 휴대전화번호|text|phone|초대 연결 매칭 키"], 1, 40),
        ref_store(0, 232, ["|근무지 반경|int|geofence_radius_m|기본 100m"]),
        E("staff_member", "직원 레코드", "staff_members", "focal",
          ["#|직원 레코드 ID|id|staff_member_id|", "→|점포|id|store_id|", "→|계정|id|account_id|가입 전에는 없음", "|재직 상태|enum|employment_status|", "|가입 상태|enum|join_status|초안·초대 발송·가입 완료"], 1, 232),
        E("contract", "근로계약", "contracts", "entity",
          ["#|근로계약 ID|id|contract_id|", "→|직원 레코드|id|staff_member_id|", "|계약 상태|enum|status|6종", "|계약 기간|date|start_on·end_on|"], 2, 232),
        E("payslip", "급여명세서", "payslips", "entity",
          ["#|급여명세서 ID|id|payslip_id|", "→|직원 레코드|id|staff_member_id|", "→|참조 근로계약|id|contract_id|", "|명세서 상태|enum|status|4종"], 3, 232),
        E("schedule", "근무스케줄", "work_schedules", "entity",
          ["#|근무스케줄 ID|id|schedule_id|", "→|직원 레코드|id|staff_member_id|", "→|근무지|id|store_id|", "|확정 상태|enum|confirm_status|"], 0, 492),
        E("attendance", "출퇴근 기록", "attendance_records", "entity",
          ["#|출퇴근 기록 ID|id|attendance_id|", "→|직원 레코드|id|staff_member_id|", "→|근무지|id|store_id|", "|위치 판정 결과|enum|location_result|"], 1, 492),
        E("todo", "TO-DO", "todos", "entity",
          ["#|TO-DO ID|id|todo_id|", "→|근무지|id|store_id|", "|배정·수행 방식|enum|assign_mode|", "|수행 상태|enum|status|"], 2, 492),
    ],
    [
        R("account", "bottom", "staff_member", "top", "1", "N", "연결"),
        R("store", "right", "staff_member", "left", "1", "N", "소속", at_a=300, at_b=300),
        R("staff_member", "right", "contract", "left", "1", "N", "계약", at_a=300, at_b=300),
        R("contract", "right", "payslip", "left", "1", "N", "산정 근거", at_a=300, at_b=300),
        R("staff_member", "bottom", "schedule", "top", "1", "N", "근무스케줄", at_a=456, at_b=160, mid=460),
        R("staff_member", "bottom", "attendance", "top", "1", "N", "", at_a=496, at_b=496),
        R("staff_member", "bottom", "todo", "top", "N", "N", "배정 대상", at_a=536, at_b=832, mid=460),
    ],
    [
        ("coral", "중심", "직원 레코드가 뿌리다", ["계약은 계정이 아니라 직원 레코드에 붙는다", "계정 1개가 여러 점포의 직원 레코드를 가진다", "가입 전에도 레코드는 있고 가입하면 계정이 연결된다"]),
        ("ink", "", "근무지는 점포를 가리킨다", ["근무스케줄·출퇴근 기록·TO-DO의 근무지는 모두 점포 참조다", "선을 줄이려고 개요에서는 근무지 선을 그리지 않았다", "급여명세서도 직원 레코드를 직접 가리키지만 계약 선으로 대신했다"]),
        ("muted", "", "1팀과 맞닿는 곳", ["점포·BP·관리자 계정은 1팀 소유라 참조만 한다", "근무지 반경은 3팀이 필요한 항목이라 1팀 점포 테이블에 넣을지 정해야 한다"]),
    ],
))

# ── 1. 계정·접속 ──────────────────────────────────────────────────────────
DIAGRAMS.append(Diagram(
    "account", "계정·접속", "계정과 접속",
    "직원 근무 앱에 로그인하는 사람 단위의 데이터다. 이메일 아이디로 로그인하고 본인인증 휴대전화번호는 초대 연결의 매칭 키로만 쓴다. 비밀번호는 이메일 핀으로 재설정한다.",
    [
        E("identity", "본인인증 이력", "identity_verifications", "history",
          ["#|본인인증 ID|id|verification_id|", "→|계정|id|account_id|", "|인증 목적|enum|purpose|가입·휴대전화번호 변경", "|인증 휴대전화번호|text|phone|", "|인증 결과|enum|result|", "|인증 일시|datetime|verified_at|"], 0, 40),
        E("session", "접속 상태", "auth_sessions", "entity",
          ["#|접속 ID|id|session_id|", "→|계정|id|account_id|", "|기기 식별 정보|text|device_info|한 계정 여러 기기", "|발급 시각|datetime|issued_at|", "|만료 시각|datetime|expires_at|마지막 접속 후 30일", "|종료 시각|datetime|revoked_at|재설정 시 모두 종료"], 0, 312),
        E("account", "계정", "accounts", "focal",
          ["#|계정 ID|id|account_id|", "|이메일 아이디|text|email|로그인 아이디, 고유", "|비밀번호 해시|hash|password_hash|", "|실명|text|real_name|본인인증 값, 수정 불가", "|생년월일|date|birth_date|본인인증 값, 수정 불가", "|휴대전화번호|text|phone|본인인증, 변경 시 재인증", "|동일인 식별값|text|ci|", "|주소|text|address|다음 계약부터 반영", "|계정 상태|enum|status|가입 완료·연결 보류", "|로그인 실패 횟수|int|failed_login_count|5회 잠금", "|잠금 해제 시각|datetime|locked_until|재설정하면 해제"], 1, 40),
        E("change", "계정 변경 이력", "account_change_histories", "history",
          ["#|변경 이력 ID|id|change_id|", "→|계정|id|account_id|", "|변경 항목|enum|field|휴대전화번호·이메일·주소·비밀번호", "|변경 전 값|text|before_value|비밀번호는 저장 안 함", "|변경 후 값|text|after_value|비밀번호는 저장 안 함", "|변경 경로|enum|channel|본인·핀 재설정·관리자 초기화", "→|요청 관리자|id|requested_by|관리자 초기화일 때", "|변경 일시|datetime|changed_at|"], 1, 424),
        E("login", "로그인 이력", "login_histories", "history",
          ["#|로그인 이력 ID|id|login_id|", "→|계정|id|account_id|없는 이메일이면 비움", "|시도 이메일|text|email|", "|성공 여부|bool|succeeded|", "|실패 사유|enum|failure_reason|안내 문구는 구분 안 함", "|시도 시각|datetime|attempted_at|"], 2, 40),
        E("pin", "비밀번호 재설정 핀", "password_reset_pins", "entity",
          ["#|핀 ID|id|pin_id|", "→|계정|id|account_id|", "|핀 검증값|hash|pin_hash|원본 저장 안 함", "|발급 시각|datetime|issued_at|1분 재발급 제한, 하루 10회", "|만료 시각|datetime|expires_at|10분", "|시도 횟수|int|attempt_count|5회", "|쿨다운 단계|int|cooldown_step|1·3·5분, 3회까지", "|쿨다운 해제 시각|datetime|cooldown_until|", "|사용 시각|datetime|used_at|"], 2, 312),
        E("admin", "관리자 계정", "customers", "ref", ["#|관리자 ID|id|admin_id|api customers 테이블", "→|BP|id|bp_id|", "|역할|enum|role|BP 마스터·BP 관리자·가맹마스터·가맹관리자·플랫폼"], 0, 560, "1팀 영역(환경설정·권한). api 저장소에서는 customers 테이블."),
    ],
    [
        R("account", "left", "identity", "right", "1", "N", "", at_a=120, at_b=120),
        R("account", "left", "session", "right", "1", "N", "", at_a=300, at_b=392, mid=328),
        R("account", "right", "login", "left", "1", "N", "", at_a=120, at_b=120),
        R("account", "right", "pin", "left", "1", "N", "", at_a=300, at_b=412, mid=664),
        R("account", "bottom", "change", "top", "1", "N", ""),
        R("admin", "right", "change", "left", "1", "N", "초기화 요청", at_a=604, at_b=604),
    ],
    [
        ("coral", "중심", "로그인 아이디는 이메일", ["휴대전화번호는 초대 연결과 소속 확인의 매칭 키로만 쓴다", "이름·생년월일은 본인인증 값이라 누구도 고치지 못한다", "관리자는 비밀번호를 알 수 없고 초기화만 요청한다"]),
        ("ink", "", "잠금과 재설정은 한 흐름", ["로그인 5회 실패로 잠기면 기다리거나 재설정한다", "재설정·초기화가 끝나면 실패 횟수와 잠금을 지우고 모든 접속을 끊는다", "핀은 되돌릴 수 없는 값으로만 보관한다"]),
        ("muted", "미정", "남은 결정", ["LOGIN-8 이메일을 못 받는 직원의 복구 경로", "api 저장소 staff 테이블은 리프레시 토큰 하나라 여러 기기 접속을 담으려면 접속 상태 테이블이 필요하다"]),
    ],
))

# ── 2. 채용·초대 ──────────────────────────────────────────────────────────
DIAGRAMS.append(Diagram(
    "hiring", "채용·초대", "채용과 초대",
    "근로계약서 초안을 저장하면 미가입 직원 레코드가 생기고 시스템이 초대 유형을 정해 보낸다. 토큰과 본인인증 번호가 모두 맞아야 계정이 연결된다. 어긋나면 연결 보류로 넘어간다.",
    [
        ref_store(0, 40, ["|좌표|geo|location|", "|근무지 반경|int|geofence_radius_m|기본 100m, 3팀 요청 항목"]),
        E("account", "계정", "accounts", "entity",
          ["#|계정 ID|id|account_id|", "|이메일 아이디|text|email|", "|본인인증 휴대전화번호|text|phone|", "|동일인 식별값|text|ci|"], 0, 272),
        E("staff_member", "직원 레코드", "staff_members", "focal",
          ["#|직원 레코드 ID|id|staff_member_id|", "→|점포|id|store_id|", "→|계정|id|account_id|가입 전에는 비어 있음", "→|후보 계정|id|candidate_account_id|내부 전용, 화면에 안 보임", "|이름|text|name|초안 입력값", "|휴대전화번호|text|phone|초대 기준값", "|고용 형태|enum|employment_type|정직원·파트타이머, 계약으로만 바뀜", "|입사일|date|hired_on|", "|재직 상태|enum|employment_status|재직·퇴직", "|가입 상태|enum|join_status|초안·초대 발송·가입 완료", "|퇴직일|date|retired_on|"], 1, 40),
        E("tax", "신고 정보", "staff_tax_profiles", "entity",
          ["#→|직원 레코드|id|staff_member_id|1:1", "|주민등록번호|enc|rrn_encrypted|암호화, 관리자 웹은 마스킹", "|은행|enum|bank_code|", "|급여 계좌|enc|account_no_encrypted|예금주 본인", "|수집 목적|text|purpose|취득 신고·원천징수·급여 이체", "|수집 일시|datetime|collected_at|", "|최종 수정 일시|datetime|updated_at|계좌 변경은 다음 급여부터"], 1, 396),
        E("invitation", "초대", "invitations", "entity",
          ["#|초대 ID|id|invitation_id|", "→|직원 레코드|id|staff_member_id|재초대로 여러 건", "|초대 유형|enum|type|가입 초대·재초대·소속 추가 확인·복귀 확인", "|초대 토큰|text|token|가입 초대·재초대만", "|수신 채널|enum|channel|", "|발송 일시|datetime|sent_at|", "|만료 일시|datetime|expires_at|30일", "|상태|enum|status|발송·수락·만료·거절", "|응답 일시|datetime|responded_at|", "|거절 사유|text|reject_reason|소속 확인 거절"], 2, 40),
        E("hold", "가입 연결 보류", "link_holds", "entity",
          ["#|보류 ID|id|hold_id|", "→|초대|id|invitation_id|", "→|보류 계정|id|account_id|", "|불일치 사유|enum|mismatch_reason|번호 불일치·이름 불일치", "|처리 결과|enum|resolution|승인·번호 수정 후 재초대", "→|처리 관리자|id|resolved_by|", "|처리 일시|datetime|resolved_at|"], 2, 364),
        ref_admin(3, 404),
    ],
    [
        R("store", "right", "staff_member", "left", "1", "N", "소속", at_a=108, at_b=108),
        R("account", "right", "staff_member", "left", "0..1", "N", "연결", at_a=312, at_b=312),
        R("staff_member", "right", "invitation", "left", "1", "N", "초대", at_a=108, at_b=108),
        R("staff_member", "bottom", "tax", "top", "1", "0..1", ""),
        R("invitation", "bottom", "hold", "top", "1", "0..1", ""),
        R("account", "bottom", "hold", "bottom", "1", "N", "보류 계정", at_a=160, at_b=880, mid=648),
        R("admin", "left", "hold", "right", "1", "N", "처리", at_a=464, at_b=464),
    ],
    [
        ("coral", "중심", "레코드는 계정보다 먼저 생긴다", ["초안 저장이 채용의 유일한 시작점이다", "가입이 끝나면 계정을 연결하고 계약서를 자동 발송한다", "소속 확인을 수락하면 본인인증 정보만 새 레코드로 복사한다"]),
        ("ink", "", "보류와 개인정보 경계", ["연결 보류 중에는 계약서를 보내지 않는다", "관리자에게는 번호 끝자리와 불일치 사유만 보인다", "주민등록번호와 급여 계좌는 계약서가 아니라 신고 정보에 암호화해 둔다"]),
        ("muted", "미정", "남은 결정", ["JOIN-3 연결 보류 화면에서 직원에게 어디까지 알릴지", "신고 정보를 내 정보에서 조회·수정하는 방법이 명세에 없다", "점포 좌표·반경을 1팀 점포 테이블에 둘지 3팀 확장 테이블로 둘지"]),
    ],
))

# ── 3. 근로계약 ───────────────────────────────────────────────────────────
DIAGRAMS.append(Diagram(
    "contract", "근로계약", "근로계약",
    "계약은 직원 레코드에 붙는다. 체결되면 고치지 않고 새 계약으로 대체한다. 계약서 데이터는 관리자 입력분·본인인증분·직원 입력분을 나눠 저장하고 발송 원본과 날인 완료본을 모두 보존한다.",
    [
        E("staff_member", "직원 레코드", "staff_members", "entity",
          ["#|직원 레코드 ID|id|staff_member_id|", "→|점포|id|store_id|", "|재직 상태|enum|employment_status|"], 0, 40),
        ref_store(0, 232),
        ref_admin(0, 388),
        E("contract", "근로계약", "contracts", "focal",
          ["#|근로계약 ID|id|contract_id|", "→|직원 레코드|id|staff_member_id|", "→|근무지|id|store_id|", "→|직전 계약|id|previous_contract_id|재계약일 때", "|계약 유형|enum|contract_type|정직원·파트타이머", "|계약 기간|date|start_on·end_on|종료일 비우면 무기한", "|근무 조건|json|work_terms|근무일·시작·종료·휴게", "|급여 조건|json|wage_terms|시급·월급·지급일", "|연장·야간 가산 적용 여부|bool|overtime_premium|5인 미만 미적용 가능", "|계약 상태|enum|status|발송 대기·서명 대기·체결 완료·거부·만료·종료", "|초안 처리 유형|enum|draft_action|가입 초대·소속 추가 확인·복귀 확인·즉시 발송", "|발송 일시|datetime|sent_at|", "|날인 기한|datetime|sign_due_at|발송일부터 30일", "|재발송 횟수|int|resend_count|", "|거부 사유|text|reject_reason|", "→|작성 관리자|id|created_by|"], 1, 40),
        E("party", "계약 당사자 정보", "contract_parties", "entity",
          ["#→|근로계약|id|contract_id|1:1", "|관리자 입력 이름·번호|text|admin_name·admin_phone|", "|본인인증 실명·생년월일|text|verified_name·birth_date|실명이 다르면 실명 반영", "|본인인증 휴대전화번호|text|verified_phone|", "|직원 입력 주소|text|address|", "|반영 일시|datetime|filled_at|가입 완료 시 채움"], 2, 40),
        E("document", "계약서 파일", "contract_documents", "entity",
          ["#|파일 ID|id|document_id|", "→|근로계약|id|contract_id|", "|파일 구분|enum|kind|발송 원본·날인 완료본", "|저장 위치|text|storage_key|", "|파일 해시|hash|checksum|", "|생성 일시|datetime|created_at|"], 2, 276),
        E("status", "계약 상태 이력", "contract_status_histories", "history",
          ["#|상태 이력 ID|id|history_id|", "→|근로계약|id|contract_id|", "|변경 전 상태|enum|from_status|", "|변경 후 상태|enum|to_status|", "|처리 주체|enum|actor|관리자·직원·시스템", "|변경 일시|datetime|changed_at|"], 2, 512),
    ],
    [
        R("staff_member", "right", "contract", "left", "1", "N", "", at_a=100, at_b=100),
        R("store", "right", "contract", "left", "1", "N", "근무지", at_a=288, at_b=288),
        R("admin", "right", "contract", "left", "1", "N", "작성", at_a=412, at_b=412),
        R("contract", "right", "party", "left", "1", "1", "", at_a=120, at_b=120),
        R("contract", "right", "document", "left", "1", "N", "", at_a=356, at_b=356),
        R("contract", "right", "status", "left", "1", "N", "", at_a=412, at_b=592, mid=664),
    ],
    [
        ("coral", "중심", "체결된 계약은 고치지 않는다", ["조건을 바꾸려면 새 계약을 만들고 직전 계약을 가리킨다", "같은 점포에 진행 중인 계약이 있으면 대체 여부를 묻는다", "근무 조건은 근무스케줄 등록 때 기본값으로 한 번 쓰인다"]),
        ("ink", "", "상태는 6종, 이력은 지우지 않는다", ["발송 대기에는 가입을 기다리는 초안도 들어간다", "날인 기한 30일이 지나면 만료, 재발송은 횟수와 이력으로 남긴다", "퇴직자 계약 이력은 퇴직일부터 3년 보존한다"]),
        ("muted", "미정", "남은 결정", ["근무 조건·급여 조건을 한 칸 JSON으로 둘지 항목별 컬럼으로 풀지는 물리 설계에서 정한다", "전자서명 세부 기술과 파일 저장소는 범위 밖이다"]),
    ],
))

# ── 4. 근무스케줄·출퇴근 ──────────────────────────────────────────────────
DIAGRAMS.append(Diagram(
    "attendance", "근무스케줄·출퇴근", "근무스케줄과 출퇴근",
    "근무스케줄은 관리자가 등록하고 확정한다. 출퇴근은 직원이 직원 근무 앱에서 GPS 판정으로 등록한다. 좌표는 저장하지 않고 판정 결과와 오차만 남기며, 보정은 원본과 분리해 이력으로 쌓는다.",
    [
        E("schedule", "근무스케줄", "work_schedules", "entity",
          ["#|근무스케줄 ID|id|schedule_id|", "→|직원 레코드|id|staff_member_id|", "→|근무지|id|store_id|", "|근무 시작 일시|datetime|start_at|", "|근무 종료 일시|datetime|end_at|같은 직원 겹침 차단", "|휴게시간|int|break_minutes|", "|근무 유형|enum|work_type|오픈·미들·마감", "|확정 상태|enum|confirm_status|확정 전·확정", "→|기본값 근로계약|id|source_contract_id|등록 때 한 번 반영", "→|등록 관리자|id|created_by|"], 0, 40),
        E("schedule_history", "근무스케줄 변경 이력", "work_schedule_histories", "history",
          ["#|변경 이력 ID|id|history_id|", "→|근무스케줄|id|schedule_id|", "|변경 유형|enum|change_type|등록·수정·삭제", "|변경 전 값|json|before_value|", "|변경 후 값|json|after_value|", "|변경 주체|id|changed_by|", "|변경 일시|datetime|changed_at|"], 0, 368),
        E("staff_member", "직원 레코드", "staff_members", "entity",
          ["#|직원 레코드 ID|id|staff_member_id|", "→|계정|id|account_id|", "→|점포|id|store_id|", "|재직 상태|enum|employment_status|"], 1, 40),
        E("account", "계정", "accounts", "entity",
          ["#|계정 ID|id|account_id|", "|이메일 아이디|text|email|"], 1, 256),
        E("consent", "위치정보 동의", "location_consents", "entity",
          ["#|동의 ID|id|consent_id|", "→|계정|id|account_id|", "|동의 문구 버전|text|terms_version|", "|동의 일시|datetime|agreed_at|첫 출퇴근 등록 때", "|철회 일시|datetime|withdrawn_at|"], 1, 432),
        E("attendance", "출퇴근 기록", "attendance_records", "focal",
          ["#|출퇴근 기록 ID|id|attendance_id|", "→|직원 레코드|id|staff_member_id|", "→|근무지|id|store_id|여럿이면 가장 가까운 곳", "|구분|enum|kind|출근·퇴근", "|기록 시각|datetime|recorded_at|기기 시각", "|서버 수신 시각|datetime|received_at|확정 기준", "|위치 판정 결과|enum|location_result|반경 안·확인 필요", "|판정 오차|int|accuracy_m|좌표는 저장 안 함", "|계약 미체결 경고|bool|unsigned_warning|경고 후 허용", "→|짝 출근 기록|id|clock_in_id|퇴근일 때"], 2, 40),
        E("correction", "출퇴근 보정 이력", "attendance_corrections", "history",
          ["#|보정 이력 ID|id|correction_id|", "→|출퇴근 기록|id|attendance_id|", "|수정 전 값|json|before_value|", "|수정 후 값|json|after_value|", "|수정 사유|text|reason|필수", "→|수정 관리자|id|corrected_by|최근 3개월만", "|수정 일시|datetime|corrected_at|"], 2, 368),
        ref_store(3, 40, ["|좌표|geo|location|", "|근무지 반경|int|geofence_radius_m|기본 100m"]),
    ],
    [
        R("staff_member", "left", "schedule", "right", "1", "N", "", at_a=100, at_b=100),
        R("schedule", "bottom", "schedule_history", "top", "1", "N", ""),
        R("staff_member", "right", "attendance", "left", "1", "N", "", at_a=100, at_b=100),
        R("store", "left", "attendance", "right", "1", "N", "반경 판정", at_a=132, at_b=132),
        R("attendance", "bottom", "correction", "top", "1", "N", ""),
        R("staff_member", "bottom", "account", "top", "N", "0..1", ""),
        R("account", "bottom", "consent", "top", "1", "N", ""),
    ],
    [
        ("coral", "중심", "출퇴근은 GPS로 판정한다", ["근무지 반경은 공통 100m, 지하·실내는 관리자가 넓힌다", "오차가 반경보다 크면 등록은 받고 확인 필요로 표시한다", "위치 권한을 거부하면 등록하지 못한다"]),
        ("ink", "", "원본은 그대로, 보정은 따로", ["기록 시각은 서버 수신 시각으로 확정한다", "관리자 보정은 최근 3개월 이내, 사유와 전후 값을 남긴다", "근무스케줄은 확정 전으로 복사되고 확정할 때 알림이 나간다"]),
        ("muted", "미정", "남은 결정", ["위치정보 동의와 이용내역 통지가 법무 요건을 채우는지", "근무시간 외 보류의 기준을 근무스케줄로 볼지 영업시간으로 볼지 (NOTI-1)", "매장용 출퇴근 등록 앱과 QR 식별은 2차"]),
    ],
))

# ── 5. TO-DO ──────────────────────────────────────────────────────────────
DIAGRAMS.append(Diagram(
    "todo", "TO-DO", "TO-DO",
    "TO-DO는 특별업무 지시 전용이다. 개인 또는 근무지 전체에 배정하고 전체는 각자 수행과 한 명 수행 중 하나를 고른다. 각자 수행으로 만든 여러 건은 배정 그룹으로 묶여 한 건처럼 고치고 지운다.",
    [
        ref_store(0, 40),
        ref_admin(0, 256),
        E("todo", "TO-DO", "todos", "focal",
          ["#|TO-DO ID|id|todo_id|", "→|근무지|id|store_id|", "|배정 그룹 ID|id|assign_group_id|전체·각자 수행 묶음", "|제목|text|title|", "|내용|text|body|", "|배정 방식|enum|assign_mode|개인·전체, 등록 후 변경 불가", "|수행 방식|enum|perform_mode|각자·공유, 등록 후 변경 불가", "|수행 예정 날짜|date|due_on|필수, 과거 날짜 불가", "|수행 시간|time|due_time|선택", "|긴급 여부|bool|urgent|근무시간 외 즉시 푸시", "|수행 상태|enum|status|대기·진행 중·완료", "→|수행자|id|performed_by|공유 TO-DO", "|완료 일시|datetime|completed_at|", "→|등록 관리자|id|created_by|", "|등록일|datetime|created_at|"], 1, 40),
        E("assignee", "TO-DO 배정 대상", "todo_assignees", "entity",
          ["#→|TO-DO|id|todo_id|", "#→|직원 레코드|id|staff_member_id|퇴직자 배정 불가", "|완료 여부|bool|completed|", "|완료 시각|datetime|completed_at|"], 2, 40),
        E("staff_member", "직원 레코드", "staff_members", "entity",
          ["#|직원 레코드 ID|id|staff_member_id|", "→|점포|id|store_id|", "|재직 상태|enum|employment_status|"], 3, 40),
        E("todo_status", "TO-DO 상태 이력", "todo_status_histories", "history",
          ["#|상태 이력 ID|id|history_id|", "→|TO-DO|id|todo_id|", "|변경 전 상태|enum|from_status|", "|변경 후 상태|enum|to_status|", "|긴급 표시 변경|bool|urgent_changed|긴급 표시 이력", "|변경 주체|id|changed_by|", "|변경 일시|datetime|changed_at|"], 2, 280),
    ],
    [
        R("store", "right", "todo", "left", "1", "N", "근무지", at_a=112, at_b=112),
        R("admin", "right", "todo", "left", "1", "N", "등록", at_a=316, at_b=316),
        R("todo", "right", "assignee", "left", "1", "N", "", at_a=112, at_b=112),
        R("staff_member", "left", "assignee", "right", "1", "N", "", at_a=112, at_b=112),
        R("todo", "right", "todo_status", "left", "1", "N", "", at_a=380, at_b=380),
    ],
    [
        ("coral", "중심", "배정 방식이 행 수를 정한다", ["개인·각자 수행은 직원당 1건, 담당 직원 한 명", "공유는 1건에 대상 직원 여럿, 먼저 완료한 사람이 수행자", "배정 방식과 수행 방식은 등록 후 바꾸지 못한다"]),
        ("ink", "", "긴급은 알림에만 영향", ["긴급 표시는 근무시간 외 푸시 보류를 푸는 데만 쓴다", "상태는 직원이 자기 건만 바꾼다", "반복 설정은 없다, 정기 업무는 2차"]),
        ("muted", "미정", "남은 결정", ["WORK-3 공유 TO-DO 수행자 이름을 다른 직원에게 보여줄지"]),
    ],
))

# ── 6. 급여명세서 ─────────────────────────────────────────────────────────
DIAGRAMS.append(Diagram(
    "payroll", "급여명세서", "급여명세서",
    "근로계약과 출퇴근 기록을 참조해 초안을 만든다. 지급 항목은 시스템 계산값과 관리자 수정값을 나눠 두고 공제 항목은 미입력과 0을 구분한다. 검토 대기 사유가 붙은 명세서도 확인하면 확정할 수 있다.",
    [
        E("staff_member", "직원 레코드", "staff_members", "entity",
          ["#|직원 레코드 ID|id|staff_member_id|", "→|점포|id|store_id|", "|재직 상태|enum|employment_status|"], 0, 40),
        E("contract", "근로계약", "contracts", "entity",
          ["#|근로계약 ID|id|contract_id|", "|급여 조건|json|wage_terms|", "|연장·야간 가산 적용 여부|bool|overtime_premium|"], 0, 232),
        E("payslip", "급여명세서", "payslips", "focal",
          ["#|급여명세서 ID|id|payslip_id|", "→|직원 레코드|id|staff_member_id|같은 기간 중복 생성 차단", "→|근무지|id|store_id|", "→|참조 근로계약|id|contract_id|계약 없으면 초안 없음", "|급여 기간|date|period_start·period_end|", "|계약 유형|enum|contract_type|", "|출퇴근 참조 기간|date|attendance_from·to|", "|명세서 상태|enum|status|작성 중·검토 중·확정·발송 완료", "|지급 총액|money|gross_pay|", "|공제 총액|money|total_deduction|", "|실지급액|money|net_pay|", "|확정 일시|datetime|confirmed_at|", "→|확정 관리자|id|confirmed_by|"], 1, 40),
        E("item", "명세서 금액 항목", "payslip_items", "entity",
          ["#|항목 ID|id|item_id|", "→|급여명세서|id|payslip_id|", "|항목 구분|enum|category|지급·공제", "|항목 코드|enum|code|기본급·주휴·연장·고정 수당·4대보험·소득세·지방소득세", "|시스템 계산값|money|calculated_amount|지급 항목만", "|관리자 수정값|money|adjusted_amount|", "|입력 여부|bool|entered|공제 미입력과 0 구분"], 2, 40),
        E("reason", "검토 대기 사유", "payslip_review_reasons", "entity",
          ["#|사유 ID|id|reason_id|", "→|급여명세서|id|payslip_id|", "|사유|enum|reason|출퇴근 누락·계약 만료 후 기록·기간 중 계약 변경·공제 미입력", "|상세|text|detail|누락 일수 등", "|확인 일시|datetime|acknowledged_at|"], 2, 312),
        E("dispatch", "명세서 발송 이력", "payslip_dispatches", "history",
          ["#|발송 이력 ID|id|dispatch_id|", "→|급여명세서|id|payslip_id|", "|발송 채널|enum|channel|이메일·앱 푸시", "|발송 상태|enum|status|", "|발송 시각|datetime|sent_at|", "→|발송자|id|sent_by|"], 1, 436),
        E("payslip_status", "명세서 상태 이력", "payslip_status_histories", "history",
          ["#|상태 이력 ID|id|history_id|", "→|급여명세서|id|payslip_id|", "|변경 전 상태|enum|from_status|", "|변경 후 상태|enum|to_status|확정 취소는 검토 중으로", "|처리 주체|id|changed_by|", "|변경 일시|datetime|changed_at|"], 0, 436),
    ],
    [
        R("staff_member", "right", "payslip", "left", "1", "N", "", at_a=100, at_b=100),
        R("contract", "right", "payslip", "left", "1", "N", "산정 근거", at_a=292, at_b=292),
        R("payslip", "right", "item", "left", "1", "N", "", at_a=120, at_b=120),
        R("payslip", "right", "reason", "left", "1", "N", "", at_a=348, at_b=348),
        R("payslip", "bottom", "dispatch", "top", "1", "N", ""),
        R("payslip", "left", "payslip_status", "right", "1", "N", "", at_a=356, at_b=500, mid=328),
    ],
    [
        ("coral", "중심", "지급은 계산, 공제는 입력", ["기본급·주휴수당·연장수당은 시스템이 계산하고 관리자가 고친다", "4대보험·소득세·지방소득세는 관리자가 넣거나 지난 명세서에서 불러온다", "공제가 비어 있으면 확정하지 못한다"]),
        ("ink", "", "상태와 이력", ["상태는 작성 중·검토 중·확정·발송 완료 4종이다", "확정 취소는 발송 후에도 되고 검토 중으로 돌아간다", "명세서 데이터는 생성일부터 3년 보존한다"]),
        ("muted", "미정", "남은 결정", ["주휴·연장 계산식과 가산율은 노무사 검토 뒤 확정한다", "공제 항목을 행으로 둘지 고정 컬럼으로 둘지는 물리 설계에서 정한다"]),
    ],
))

# ── 7. 알림 ───────────────────────────────────────────────────────────────
DIAGRAMS.append(Diagram(
    "notify", "알림", "운영 알림과 직원 알림",
    "관리자 웹의 운영 알림과 직원 근무 앱의 직원 알림은 같은 알림 구조를 쓴다. 읽음은 수신자마다 따로 두고 발송은 채널별 이력으로 남긴다. TO-DO 배정 알림은 근무시간 외에 발송 예정 시각을 잡아 보류한다.",
    [
        E("notification", "알림", "notifications", "focal",
          ["#|알림 ID|id|notification_id|", "|알림 대상 구분|enum|audience|운영 알림·직원 알림", "|알림 유형|enum|type|운영 6종·직원 4종", "|관련 업무 유형|enum|related_type|문의사항·도입문의·근로계약 등", "|관련 업무 ID|id|related_id|", "|알림 내용|text|body|", "|중복 방지 키|text|dedupe_key|같은 사건·수신자 1회", "|긴급 여부|bool|urgent|", "|생성 시각|datetime|created_at|"], 0, 240),
        ref_admin(1, 40),
        E("recipient", "알림 수신", "notification_recipients", "entity",
          ["#|수신 ID|id|recipient_id|", "→|알림|id|notification_id|", "→|수신 계정|id|account_id|직원 알림", "→|수신 관리자|id|admin_id|운영 알림", "|읽음 여부|bool|is_read|", "|읽음 처리 시각|datetime|read_at|"], 1, 240),
        E("account", "계정", "accounts", "entity",
          ["#|계정 ID|id|account_id|", "|이메일 아이디|text|email|"], 1, 496),
        E("delivery", "알림 발송 이력", "notification_deliveries", "history",
          ["#|발송 이력 ID|id|delivery_id|", "→|알림 수신|id|recipient_id|", "|발송 채널|enum|channel|앱 푸시·알림톡·이메일", "|발송 예정 시각|datetime|scheduled_at|보류 시", "|발송 시각|datetime|sent_at|", "|발송 결과|enum|result|", "|대체 발송 여부|bool|is_fallback|푸시 실패 시 알림톡", "|묶음 발송 ID|id|batch_id|보류분 아침 묶음"], 2, 240),
        E("preference", "알림 수신 설정", "notification_preferences", "entity",
          ["#→|계정|id|account_id|", "#|알림 유형|enum|type|", "|수신 여부|bool|enabled|기본 켬, 계약·급여는 끌 수 없음", "|변경 시각|datetime|updated_at|"], 2, 512),
    ],
    [
        R("notification", "right", "recipient", "left", "1", "N", "", at_a=300, at_b=300),
        R("admin", "bottom", "recipient", "top", "0..1", "N", ""),
        R("recipient", "right", "delivery", "left", "1", "N", "", at_a=300, at_b=300),
        R("account", "top", "recipient", "bottom", "0..1", "N", ""),
        R("account", "right", "preference", "left", "1", "N", "", at_a=548, at_b=548),
    ],
    [
        ("coral", "중심", "알림 하나, 수신 여럿", ["읽음은 사람마다 따로라 수신 행에 둔다", "같은 사건으로 같은 사람에게 두 번 만들지 않는다", "처리했는지는 알림이 아니라 원래 업무의 상태가 안다"]),
        ("ink", "", "채널과 보류", ["운영 알림은 알림함과 이메일, 모바일 푸시는 없다", "직원 알림은 앱 푸시가 기본이고 놓치면 안 되는 것은 알림톡으로 대체한다", "보류된 TO-DO 알림은 다음 근무일 아침에 묶어서 보낸다"]),
        ("muted", "미정", "남은 결정", ["NOTI-1 근무시간 외의 기준 시각", "알림톡 대체 발송 범위와 발송 담당(업무 분배 미정)"]),
    ],
))

# ── 8. 고객지원·커뮤니티 ──────────────────────────────────────────────────
DIAGRAMS.append(Diagram(
    "support", "고객지원·커뮤니티", "고객지원과 커뮤니티",
    "플랫폼 관리자가 공지사항·FAQ를 쓰고 노출 대상을 정하면, 사용자는 자기가 대상인 글만 본다. 문의사항은 로그인한 관리자가, 도입문의는 비로그인 사용자가 남긴다. 둘 다 사용자 노출 답변과 운영자 내부 메모를 나눠 둔다.",
    [
        E("post", "공지사항·FAQ", "posts", "focal",
          ["#|게시물 ID|id|post_id|", "|콘텐츠 유형|enum|content_type|공지사항·FAQ", "|제목|text|title|", "|본문|text|body|", "|게시 상태|enum|status|임시저장·게시·비공개", "|공지사항 유형|enum|notice_type|점검·기능·약관·안내", "|게시 기간|date|publish_from·to|", "|상단 고정 여부|bool|pinned|공지사항만", "|FAQ 카테고리|enum|faq_category|FAQ만", "|삭제 일시|datetime|deleted_at|복구 가능, 무기한 보관", "→|최종 수정 관리자|id|updated_by|", "|최종 수정 일시|datetime|updated_at|"], 0, 40),
        E("audience", "노출 대상", "post_audiences", "entity",
          ["#→|게시물|id|post_id|", "#|대상 유형|enum|audience_type|비회원·회원·BP·점포·부가서비스", "|부가서비스 상품|enum|addon_code|부가서비스일 때"], 1, 40),
        E("attachment", "첨부파일", "post_attachments", "entity",
          ["#|첨부파일 ID|id|attachment_id|", "→|게시물|id|post_id|글당 5개", "|파일 이름|text|file_name|", "|파일 크기|int|size_bytes|10MB 이하", "|저장 위치|text|storage_key|", "|순서|int|sort_order|"], 1, 232),
        E("inquiry", "문의사항", "inquiries", "entity",
          ["#|문의사항 ID|id|inquiry_id|", "→|등록 관리자|id|created_by|본인 문의만 보임", "→|대상 BP·점포|id|scope_id|", "|문의 유형|enum|category|", "|제목|text|title|", "|문의 내용|text|body|", "|답변 상태|enum|status|접수·처리중·답변완료", "|운영자 내부 메모|text|internal_memo|사용자에게 안 보임", "|등록 시각|datetime|created_at|"], 2, 40),
        E("reply", "문의 답변", "inquiry_replies", "history",
          ["#|답변 ID|id|reply_id|", "→|문의사항|id|inquiry_id|답변 이력 전부 보관", "|답변 내용|text|body|", "→|답변 관리자|id|replied_by|", "|답변 시각|datetime|replied_at|"], 3, 40),
        ref_admin(2, 336),
        E("lead", "도입문의", "leads", "entity",
          ["#|도입문의 ID|id|lead_id|", "|문의자 이름|text|contact_name|", "|업종|enum|industry|목록 선택, 기타는 직접 입력", "|전화번호|text|phone|휴대전화 아닐 수 있음", "|이메일|text|email|접수 확인 발송", "|관심 서비스|enum|interests|매장운영·재무관리·프랜차이즈·기타", "|도입 예정 시기|enum|plan_period|목록 선택", "|문의 내용|text|body|", "|개인정보 동의 일시|datetime|privacy_agreed_at|필수", "|마케팅 동의 일시|datetime|marketing_agreed_at|선택", "|답변 상태|enum|status|", "|사용자 노출 답변|text|reply|이메일로 회신", "|운영자 내부 메모|text|internal_memo|", "|접수 일시|datetime|created_at|", "|상담 완료일|date|consulted_on|1년 뒤 파기"], 3, 300),
    ],
    [
        R("post", "right", "audience", "left", "1", "N", "", at_a=100, at_b=100),
        R("post", "right", "attachment", "left", "1", "0..5", "", at_a=292, at_b=292),
        R("inquiry", "right", "reply", "left", "1", "N", "", at_a=100, at_b=100),
        R("admin", "top", "inquiry", "bottom", "1", "N", "등록"),
    ],
    [
        ("coral", "중심", "노출 대상이 누가 보는지를 정한다", ["비회원이 들면 비로그인 홈까지 나간다", "개별 BP·점포는 고르지 않고 부가서비스만 상품별로 고른다", "직원 근무 앱에는 공지사항·FAQ를 노출하지 않는다"]),
        ("ink", "", "답변과 메모는 한 칸에 쓰지 않는다", ["문의사항은 답변 이력을 모두 남긴다", "도입문의는 계정이 없어 이메일로 회신하고 상담 완료 1년 뒤 파기한다", "동시에 저장하면 덮어쓰지 않고 최신 내용을 다시 보게 한다"]),
        ("muted", "", "1차에서 뺀 것", ["구독·청구·결제수단·정산 조회는 2차", "BP가 자기 조직에 쓰는 공지는 없다 (SUPPORT-3)"]),
    ],
))

KIND_TAG = {"focal": "CORE ENTITY", "entity": "ENTITY", "history": "HISTORY", "ref": "TEAM-1 REF"}


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
    if a[1] == b[1]:  # 가로선: 관계 수는 위, 이름은 아래
        cx = r4((a[0] + b[0]) / 2 - 2)
        if side == "above":
            return (cx - w / 2, a[1] - 8 - h, cx + w / 2, a[1] - 8)
        return (cx - w / 2, a[1] + 8, cx + w / 2, a[1] + 8 + h)
    cy = r4((a[1] + b[1]) / 2 - 2)  # 세로선: 관계 수는 오른쪽, 이름은 왼쪽
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
        if pre:
            o.append(t(x + 16, by, pre, 11, ACCENT if "#" in pre else MUTED, MONO, 600))
        o.append(t(x + 16 + (24 if pre == "#→" else 14 if pre else 0), by, f.name, 12, INK if "#" in pre else "#2b2e33", SANS,
                   600 if "#" in pre else 400))
        o.append(t(x + w - 16, by, f.type, 9, SOFT, MONO, anchor="end"))
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
    # 3) 표시 (박스 뒤에 그려 가려지지 않게. 박스와 겹치지 않는 것은 검사가 보장)
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
    items = [("focal", "중심 엔티티"), ("entity", "엔티티"), ("history", "이력"), ("ref", "1팀 소유 · 참조만")]
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
<p class="eyebrow">WHALE ERP · LOGICAL ERD · 1차 범위 · 3팀</p>
<h1>{esc(d.title)}</h1>
<p class="subtitle">{esc(d.subtitle)}</p>
</div>
<nav aria-label="ERD 영역">{nav}</nav>
<div class="diagram">
{svg}
</div>
<div class="cards">{"".join(cards)}</div>
{extra}
<div class="footer"><span>근거 · Manyfast 명세 dataSpec 2026-09-15 · front·staff 목업 확정 쟁점</span><span>docs/erd/_build.py 로 생성 · 손으로 고치지 말 것</span></div>
</div>
</body>
</html>
"""


def readme():
    L = ["# WHALE ERP 1차 논리 ERD", "",
         "3팀 1차 범위의 데이터를 엔티티와 관계로 정리한 **논리 모델**이다. 물리 설계(인덱스, 제약, 타입 세부)는 whale-erp-api 에서 정한다.", "",
         "## 보는 법", "",
         "- `index.html` 에서 개요를 보고, 위쪽 탭으로 영역별 상세로 넘어간다.",
         "- 박스 제목 옆 태그: `CORE ENTITY` 는 그 장의 중심, `HISTORY` 는 지우지 않는 이력, `TEAM-1 REF` 는 1팀 소유라 참조만 한다.",
         "- `#` 은 식별자, `→` 는 다른 엔티티 참조다. 선 끝의 `1`·`N`·`0..1` 은 관계 수다.",
         "- 속성 이름은 업무 용어집(whale-erp-v2/CLAUDE.md) 표기를 따른다. 제안 컬럼명은 아래 카탈로그에만 있다.", "",
         "## 다시 만들기", "",
         "```bash", "python3 docs/erd/_build.py", "```", "",
         "모델은 `_build.py` 안에 있다. HTML 과 이 README 는 그 결과물이라 직접 고치지 않는다. 스크립트가 박스 겹침, 선이 다른 박스를 지나는지, 표시 겹침, 4px 격자를 검사하고 어긋나면 실패한다.", "",
         "## 근거", "",
         "- Manyfast 기능·명세의 dataSpec 슬롯 (2026-09-15 11:16 읽음, 요구사항 6 · 기능 16 · 명세 26)",
         "- front `docs/mockup` 확정 쟁점: STAFF-1~16, HOME-2·4·5, SUPPORT-1~4, NOTIFY-1·2",
         "- staff `docs/mockup` 확정 쟁점: ATT-1~7, LOGIN-2·3, TAX-4·5, 알림 수신 설정", "",
         "## api 저장소와의 대응", "",
         "| 논리 엔티티 | api 현재 테이블 | 차이 |", "|---|---|---|",
         "| 계정 | `staff` | 이름이 겹친다. api 의 `staff` 는 직원 근무 앱 로그인 주체라 논리 모델의 **계정**에 해당한다. 논리 모델의 **직원 레코드**는 점포별 소속이라 별도 테이블(`staff_members` 등)이 필요하다. |",
         "| 관리자 계정 | `customers` | 1팀 소유. 역할·BP 연결은 1팀 설계를 따른다. |",
         "| 접속 상태 | 없음 (`refresh_token_hash` 한 칸) | 한 계정이 여러 기기에서 30일 유지하려면 접속 상태 테이블이 필요하다. api CLAUDE.md 도 같은 한계를 적어 두었다. |", "",
         "## 1팀과 맞닿는 곳", "",
         "- **점포·BP·관리자 계정**은 1팀 소유다. 3팀 엔티티는 식별자로 참조만 한다.",
         "- **근무지 좌표·반경**은 출퇴근 GPS 판정에 필요한 3팀 요구다. 1팀 점포 테이블에 넣을지, 3팀 확장 테이블로 둘지 정해야 한다.",
         "- **관리자 계정(`customers`)과 계정(`staff`)은 테이블을 나눈다.** 관리자이면서 직원인 사람은 없다. 관리자 계정은 BP 마스터가 사업자 회원가입으로 직접 만들고 그 아래 BP 관리자·가맹마스터·가맹관리자 계정은 만들어 준다. 계정은 초대받은 직원이 본인인증과 개인정보를 넣어 직접 가입한다. 두 테이블에 겹치는 속성은 이메일·비밀번호·잠금 정도라서 잠금과 핀 재설정 같은 로직은 테이블이 아니라 api 공통 모듈로 나눠 쓴다. (2026-09-15 재영 확인)",
         "- **관리자 역할과 권한 범위**는 1팀 권한 관리에서 정한다. 3팀 화면의 업무 범위는 그 결과를 따른다.", "",
         "## 아직 정하지 않은 것", "",
         "- 근무시간 외 알림 보류의 기준 시각 (NOTI-1)과 알림톡 대체 발송 범위",
         "- 배치·알림·알림톡/SMS·메일 발송의 담당과 발송 이력·재시도 저장 위치 (업무 분배 미정)",
         "- 신고 정보를 내 정보에서 조회·수정하는 방법",
         "- 공유 TO-DO 수행자 이름 공개 (WORK-3), 연결 보류 안내 범위 (JOIN-3), 이메일을 못 받는 직원 (LOGIN-8)",
         "- 위치정보 동의·주민등록번호 처리의 법무 검토, 주휴·연장 계산식과 보존·파기 기준의 노무 검토", ""]
    for d in DIAGRAMS[1:]:
        L += [f"## {d.title}", "", d.subtitle, ""]
        for e in d.entities.values():
            tag = {"focal": "중심", "entity": "엔티티", "history": "이력", "ref": "1팀 참조"}[e.kind]
            L += [f"### {e.name} `{e.table}` · {tag}", ""]
            if e.desc:
                L += [e.desc, ""]
            L += ["| 키 | 속성 | 논리 타입 | 제안 컬럼 | 비고 |", "|---|---|---|---|---|"]
            for f in e.fields:
                key = {"#": "PK", "→": "FK", "#→": "PK·FK"}.get(f.prefix, "")
                L.append(f"| {key} | {f.name} | {f.type} | `{f.column}` | {f.note} |")
            L.append("")
        L += ["**관계**", ""]
        for r in d.rels:
            a, b = d.entities[r.a].name, d.entities[r.b].name
            L.append(f"- {a} `{r.ca}` — `{r.cb}` {b}" + (f" · {r.label}" if r.label else ""))
        L.append("")
    return "\n".join(L)


def main():
    all_errs = []
    for d in DIAGRAMS:
        svg, errs, W = build_svg(d)
        all_errs += errs
        with open(os.path.join(OUT, f"{d.slug}.html"), "w", encoding="utf-8") as fh:
            fh.write(page(d, svg))
    with open(os.path.join(OUT, "README.md"), "w", encoding="utf-8") as fh:
        fh.write(readme())
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
