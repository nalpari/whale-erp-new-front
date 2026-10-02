#!/usr/bin/env python3
"""WHALE ERP 1팀 1차 물리 모델과 ERD 페이지 생성기.

논리 모델의 원본은 README.md 카탈로그다. 이 파일은 카탈로그 표를 읽어
PostgreSQL 물리 모델로 바꾸고, 다음을 만든다. `python3 _build.py` 가 이 파일을 부른다.

  *.html      영역별 ERD 한 장에 논리 · 물리 · 논리+물리 세 보기 (물리·논리+물리 보기 아래 테이블 정의)
  schema.sql  CREATE TABLE · 제약 · 인덱스 · 주석

물리 규칙 (네이밍 규칙 2장 + whale-erp-api 마이그레이션 형식)
  - 기본키는 논리 이름 그대로 `{참조 단수}_id integer GENERATED ALWAYS AS IDENTITY` (네이밍 규칙 2026-10-02).
    공통코드(`code_groups`·`code_items`)는 코드 PK, 매핑·1:1 테이블은 FK 를 묶은 PK 다.
  - 외래키는 `{참조 단수}_id integer`. 등록자·수정자·변경자는 admin_accounts.id 를 본다.
  - 시각은 timestamptz(6), 참·거짓은 NOT NULL boolean.
  - 글자 수·형식 제한은 컬럼 타입이 아니라 CHECK 제약으로 건다 (`{table}_{col}_{조건}`).
  - 공통코드 값 컬럼(`*_code`)은 text 이고 FK 를 걸지 않는다 (복합키라서).
  - 논리 타입 enum 은 PostgreSQL enum 타입으로 만든다 (네이밍 규칙 「상태 값」).
  - 물리 결정은 아래 PHYS · REQUIRED · UNIQUES · CHECKS 에 모아 둔다. 카탈로그를 고친 뒤 다시 돌린다.
"""
import os
import re
import sys

sys.dont_write_bytecode = True  # _build 를 불러와도 __pycache__ 를 남기지 않는다
import _build as L  # 그리기·검사 함수를 논리 ERD 와 같이 쓴다

HERE = os.path.dirname(os.path.abspath(__file__))


# ─── 카탈로그 읽기 ──────────────────────────────────────────────────────────
class LCol:
    def __init__(self, key, attr, ltype, col, note):
        self.key, self.attr, self.ltype, self.col, self.note = key, attr, ltype, col, note


class LTable:
    def __init__(self, name, table, kind, section):
        self.name, self.table, self.kind, self.section = name, table, kind, section
        self.cols = []
        self.desc = []


SECTION_SLUG = {"인증·계정": "auth", "점포관리": "store", "BP 마스터 계정 관리": "bp",
                "환경설정 & 시스템관리": "system", "3팀 참조 엔티티": "ref"}


def read_catalog():
    tables, cur, section = {}, None, None
    with open(os.path.join(HERE, "README.md"), encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n").rstrip("\r")
            m = re.match(r"^## (.+)$", line)
            if m:
                section, cur = SECTION_SLUG.get(m.group(1).strip()), None
                continue
            m = re.match(r"^### (.+?) `([a-z_]+)` · (.+)$", line)
            if m:
                cur = LTable(m.group(1), m.group(2), m.group(3).strip(), section)
                tables[cur.table] = cur
                continue
            if cur is None:
                continue
            if line.startswith("|"):
                cells = [c.strip() for c in line.strip("|").split("|")]
                if len(cells) < 5 or cells[0] == "키" or set(cells[0]) <= {"-"} and cells[1].startswith("-"):
                    continue
                col = cells[3].strip("`")
                if not re.match(r"^[a-z_0-9]+$", col):
                    continue
                cur.cols.append(LCol(cells[0], cells[1], cells[2], col, " | ".join(cells[4:]).strip()))
            elif line and not line.startswith("**") and not line.startswith("- ") and not cur.cols:
                cur.desc.append(line)
    return tables


# ─── 물리 결정 ──────────────────────────────────────────────────────────────
# 논리 PK 를 그대로 두는 테이블 (코드 PK · 복합 PK · 1:1)
KEEP_PK = {"code_groups", "code_items", "admin_store_mappings", "role_group_menus",
           "holiday_store_mappings", "holiday_excluded_stores", "store_business_profiles"}

# FK 컬럼 → 참조 (테이블, 컬럼)
FK_TARGET = {
    "bp_code_id": ("bp_codes", None),
    "admin_account_id": ("admin_accounts", None),
    "manager_admin_account_id": ("admin_accounts", None),
    "created_by": ("admin_accounts", None),
    "updated_by": ("admin_accounts", None),
    "changed_by": ("admin_accounts", None),
    "sent_by": ("admin_accounts", None),
    "store_id": ("stores", None),
    "role_group_id": ("role_groups", None),
    "menu_id": ("menus", None),
    "parent_menu_id": ("menus", None),
    "bp_holiday_id": ("bp_holidays", None),
    "origin_bp_holiday_id": ("bp_holidays", None),
    "terms_version_id": ("terms_versions", None),
    "terms_of_use_version_id": ("terms_versions", None),
    "privacy_version_id": ("terms_versions", None),
    "temporary_password_id": ("temporary_passwords", None),
}
FK_IN_TABLE = {("code_items", "group_code"): ("code_groups", "group_code"),
               ("code_items", "bp_code"): ("bp_codes", "bp_code")}

# enum 타입: (테이블, 컬럼) → (타입 이름, 값들). 값 이름은 이 문서가 제안한다.
ENUMS = {
    ("temporary_passwords", "purpose"): ("temporary_password_purpose", ["TEMPORARY", "INITIAL", "RESET"],
                                         "임시비밀번호 · 초기비밀번호 · 비밀번호초기화"),
    ("admin_login_logs", "failure_reason"): ("login_failure_reason", ["PASSWORD_MISMATCH", "LOCKED", "INACTIVE", "WITHDRAWN"],
                                             "불일치 · 잠금 · 미사용 · 탈퇴"),
    ("terms_agreement_logs", "channel"): ("terms_agreement_channel", ["SIGNUP", "FIRST_LOGIN", "REAGREEMENT", "TERMS_CHANGED"],
                                          "회원가입 · 최초 로그인 · 재동의 · 약관변경"),
    ("mail_send_logs", "result"): ("process_result", ["SUCCEEDED", "FAILED"], "성공 · 실패"),
    ("public_holiday_synchronization_logs", "result"): ("process_result", ["SUCCEEDED", "FAILED"], "성공 · 실패"),
    ("code_groups", "status"): ("use_status", ["ACTIVE", "INACTIVE"], "사용 · 사용중지"),
    ("code_items", "status"): ("use_status", ["ACTIVE", "INACTIVE"], "사용 · 사용중지"),
    ("menus", "status"): ("use_status", ["ACTIVE", "INACTIVE"], "사용 · 사용중지"),
    ("bp_holidays", "repeat_end_type"): ("repeat_end_type", ["NONE", "UNTIL_DATE", "COUNT"], "없음 · 날짜 · 횟수"),
    ("store_image_files", "file_type"): ("store_image_file_type", ["JPG", "PNG"], "JPG · PNG"),
    ("public_holidays", "source"): ("public_holiday_source", ["RULE", "PUBLIC_API"], "규칙 계산 · 공식 API"),
}

# 타입·기본값 개별 지정
PHYS = {
    ("stores", "latitude"): {"type": "numeric(8,6)"},
    ("stores", "longitude"): {"type": "numeric(9,6)"},
    ("store_floors", "floor_area_pyeong"): {"type": "numeric(8,1)"},
    ("store_floors", "floor_area_sqm"): {"type": "numeric(10,2)"},
    ("stores", "is_location_applied"): {"default": "true"},
    ("bp_codes", "account_status_code"): {"default": None},
    ("admin_accounts", "failed_login_count"): {"default": "0"},
    ("code_groups", "status"): {"default": "'ACTIVE'"},
    ("code_items", "status"): {"default": "'ACTIVE'"},
    ("menus", "status"): {"default": "'ACTIVE'"},
    ("code_groups", "sort_order"): {"default": "0"},
    ("code_items", "sort_order"): {"default": "0"},
    ("menus", "sort_order"): {"default": "0"},
    ("public_holiday_synchronization_logs", "created_count"): {"default": "0"},
    ("public_holiday_synchronization_logs", "updated_count"): {"default": "0"},
    ("public_holiday_synchronization_logs", "deleted_count"): {"default": "0"},
    ("public_holiday_synchronization_logs", "failed_count"): {"default": "0"},
    ("admin_login_logs", "attempted_at"): {"default": "CURRENT_TIMESTAMP"},
    ("admin_change_histories", "changed_at"): {"default": "CURRENT_TIMESTAMP"},
    ("store_change_histories", "changed_at"): {"default": "CURRENT_TIMESTAMP"},
    ("bp_change_histories", "changed_at"): {"default": "CURRENT_TIMESTAMP"},
    ("bp_holiday_change_histories", "changed_at"): {"default": "CURRENT_TIMESTAMP"},
    ("mail_send_logs", "sent_at"): {"default": "CURRENT_TIMESTAMP"},
    ("terms_agreement_logs", "agreed_at"): {"default": "CURRENT_TIMESTAMP"},
    ("public_holiday_synchronization_logs", "synchronized_at"): {"default": "CURRENT_TIMESTAMP"},
    ("temporary_passwords", "issued_at"): {"default": "CURRENT_TIMESTAMP"},
    ("admin_sessions", "issued_at"): {"default": "CURRENT_TIMESTAMP"},
}

# NOT NULL (PK·boolean·created_at·updated_at 은 자동). 나머지는 NULL 허용.
REQUIRED = {
    "terms_versions": ["terms_type_code", "version", "title", "content", "effective_date"],
    "bp_codes": ["bp_code", "account_status_code", "trade_name"],
    "admin_accounts": ["login_id", "bp_code_id", "password_hash", "role_type_code", "role_group_id",
                       "failed_login_count", "join_path_code", "account_status_code"],
    "admin_sessions": ["admin_account_id", "access_token_hash", "refresh_token_hash", "refresh_last_used_at",
                       "issued_at", "expires_at"],
    "temporary_passwords": ["admin_account_id", "password_hash", "issued_at", "expires_at", "purpose"],
    "admin_login_logs": ["attempted_at"],
    "admin_change_histories": ["admin_account_id", "field", "changed_at"],
    "terms_agreement_logs": ["admin_account_id", "terms_version_id", "agreed_at", "channel"],
    "mail_send_logs": ["mail_type_code", "from_email", "to_email", "subject", "body", "result", "sent_at"],
    "stores": ["store_code", "bp_code_id", "store_type_code", "name", "store_status_code"],
    "store_floors": ["store_id"],
    "store_image_files": ["store_id", "file_name", "file_type", "size_bytes", "storage_key"],
    "store_business_profiles": ["store_id"],
    "store_change_histories": ["store_id", "field", "changed_at", "retain_end_date"],
    "admin_store_mappings": ["admin_account_id", "store_id"],
    "bp_change_histories": ["bp_code_id", "field", "changed_at"],
    "role_groups": ["role_code", "bp_code_id", "role_type_code", "name"],
    "role_group_menus": ["role_group_id", "menu_id"],
    "code_groups": ["group_code", "group_name", "manage_owner_code", "status", "sort_order"],
    "code_items": ["group_code", "item_code", "bp_code", "label", "manage_owner_code", "status", "sort_order"],
    "menus": ["menu_code", "service_code", "name", "sort_order", "depth", "status"],
    "bp_holidays": ["bp_code_id", "holiday_type_code", "start_date", "name"],
    "holiday_store_mappings": ["bp_holiday_id", "store_id"],
    "holiday_excluded_stores": ["bp_holiday_id", "store_id", "effective_start_date"],
    "bp_holiday_change_histories": ["bp_holiday_id", "field", "changed_at"],
    "public_holidays": ["holiday_date", "year", "name", "source"],
    "public_holiday_synchronization_logs": ["year", "synchronized_at", "created_count", "updated_count", "deleted_count",
                                 "failed_count", "result"],
}

# 고유 제약: (테이블, 컬럼들, 조건 또는 None, 설명)
UNIQUES = [
    ("bp_codes", ["bp_code"], None, "BP 코드 고유"),
    ("bp_codes", ["is_platform"], '"is_platform"', "플랫폼 BP 는 한 행만"),
    ("bp_codes", ["biz_registration_number"],
     "\"is_platform\" = false AND \"is_deleted\" = false AND \"account_status_code\" <> 'WITHDRAWN'",
     "탈퇴·삭제되지 않은 고객 BP 끼리 고유 — ACCOUNT_STATUS 의 탈퇴 코드 값이 정해지면 조건을 맞춘다"),
    ("admin_accounts", ["login_id"], None, "탈퇴·삭제 포함 고유"),
    ("admin_accounts", ["email"], "\"is_deleted\" = false AND \"account_status_code\" <> 'WITHDRAWN'",
     "사용·미사용 계정 간 고유 — 탈퇴 코드 값이 정해지면 조건을 맞춘다"),
    ("terms_versions", ["terms_type_code", "version"], None, "약관 유형별 버전 고유"),
    ("stores", ["store_code"], None, "점포코드 고유"),
    ("store_image_files", ["store_id"], '"is_deleted" = false', "삭제되지 않은 대표 이미지는 점포당 하나"),
    ("role_groups", ["role_code"], None, "권한 코드 고유"),
    ("menus", ["menu_code"], None, "메뉴 코드 고유"),
    ("public_holidays", ["holiday_date"], None, "한 날짜에 한 건"),
]
# NULLS NOT DISTINCT 가 필요한 고유 제약 (PostgreSQL 15+)
UNIQUES_NND = [
    ("role_groups", ["bp_code_id", "manager_admin_account_id", "name"], '"is_deleted" = false',
     "같은 BP·같은 관리계정ID 안 권한명 고유. 관리계정이 없는 그룹끼리도 겹치지 않게 NULLS NOT DISTINCT"),
]

# CHECK 제약: (테이블, 이름 접미, 식)
CHECKS = [
    ("bp_codes", "bp_code_format", "\"bp_code\" ~ '^BP[0-9]{6}$'"),
    ("bp_codes", "trade_name_length", "char_length(\"trade_name\") BETWEEN 1 AND 50"),
    ("bp_codes", "biz_category_length", "char_length(\"biz_category\") <= 50"),
    ("bp_codes", "biz_item_length", "char_length(\"biz_item\") <= 50"),
    ("admin_accounts", "login_id_format", "\"login_id\" ~ '^[A-Za-z0-9]{4,20}$'"),
    ("admin_accounts", "name_length", "char_length(\"name\") BETWEEN 2 AND 20"),
    ("admin_accounts", "phone_format", "\"phone\" ~ '^[0-9]{10,11}$'"),
    ("admin_accounts", "email_lower", "\"email\" = lower(\"email\")"),
    ("admin_accounts", "withdraw_reason_detail_length", "char_length(\"withdraw_reason_detail\") <= 500"),
    ("admin_accounts", "failed_login_count_nonnegative", "\"failed_login_count\" >= 0"),
    ("stores", "store_code_format", "\"store_code\" ~ '^ST[0-9]{6}$'"),
    ("stores", "name_length", "char_length(\"name\") BETWEEN 1 AND 50"),
    ("stores", "phone_format", "\"phone\" ~ '^[0-9]{9,11}$'"),
    ("stores", "latitude_range", "\"latitude\" BETWEEN -90 AND 90"),
    ("stores", "longitude_range", "\"longitude\" BETWEEN -180 AND 180"),
    ("store_floors", "seat_count_nonnegative", "\"seat_count\" >= 0"),
    ("store_floors", "floor_area_pyeong_nonnegative", "\"floor_area_pyeong\" >= 0"),
    ("store_floors", "floor_area_sqm_nonnegative", "\"floor_area_sqm\" >= 0"),
    ("store_image_files", "size_bytes_range", "\"size_bytes\" BETWEEN 1 AND 5242880"),
    ("store_business_profiles", "biz_ceo_phone_format", "\"biz_ceo_phone\" ~ '^[0-9]{10,11}$'"),
    ("store_business_profiles", "biz_category_length", "char_length(\"biz_category\") <= 50"),
    ("store_business_profiles", "biz_item_length", "char_length(\"biz_item\") <= 50"),
    ("role_groups", "role_code_format", "\"role_code\" ~ '^[A-Z]{2}[0-9]{6}$'"),
    ("code_groups", "group_code_format", "\"group_code\" ~ '^[A-Z][A-Z0-9_]*$'"),
    ("code_items", "item_code_format", "\"item_code\" ~ '^[A-Z0-9_]{1,20}$'"),
    ("menus", "menu_code_format", "\"menu_code\" ~ '^MN[0-9]{6}$'"),
    ("menus", "depth_range", "\"depth\" BETWEEN 1 AND 3"),
    ("bp_holidays", "name_length", "char_length(\"name\") BETWEEN 1 AND 30"),
    ("bp_holidays", "end_date_after_start", "\"end_date\" >= \"start_date\""),
    ("bp_holidays", "repeat_count_positive", "\"repeat_count\" > 0"),
    ("public_holidays", "year_range", "\"year\" BETWEEN 2000 AND 2100"),
    ("public_holiday_synchronization_logs", "counts_nonnegative",
     "\"created_count\" >= 0 AND \"updated_count\" >= 0 AND \"deleted_count\" >= 0 AND \"failed_count\" >= 0"),
]

# 조회용 인덱스 (FK 중 목록·이력 조회에 쓰는 것). 고유 제약이 앞머리를 덮으면 두지 않는다.
INDEXES = [
    ("admin_accounts", ["bp_code_id"]), ("admin_accounts", ["role_group_id"]),
    ("admin_sessions", ["admin_account_id"]), ("temporary_passwords", ["admin_account_id"]),
    ("admin_login_logs", ["admin_account_id", "attempted_at"]),
    ("admin_change_histories", ["admin_account_id", "changed_at"]),
    ("terms_agreement_logs", ["admin_account_id"]), ("mail_send_logs", ["admin_account_id", "sent_at"]),
    ("stores", ["bp_code_id"]), ("store_floors", ["store_id"]),
    ("store_change_histories", ["store_id", "changed_at"]),
    ("admin_store_mappings", ["store_id"]),
    ("bp_change_histories", ["bp_code_id", "changed_at"]),
    ("role_group_menus", ["menu_id"]),
    ("code_items", ["bp_code"]),
    ("menus", ["parent_menu_id"]),
    ("bp_holidays", ["bp_code_id", "start_date"]),
    ("holiday_store_mappings", ["store_id"]), ("holiday_excluded_stores", ["store_id"]),
    ("bp_holiday_change_histories", ["bp_holiday_id", "changed_at"]),
    ("public_holidays", ["year"]),
]


# ─── 물리 모델 ──────────────────────────────────────────────────────────────
class PCol:
    def __init__(self, table, lc):
        self.lc = lc
        self.pk = "PK" in lc.key
        self.fk = "FK" in lc.key
        name = lc.col
        self.name = name
        self.ref = FK_IN_TABLE.get((table, name)) or (FK_TARGET.get(name) if self.fk else None)
        if self.fk and not self.ref:
            raise SystemExit(f"{table}.{name}: FK 참조 대상을 FK_TARGET 에 적어야 한다")
        o = PHYS.get((table, lc.col), {})
        self.enum = ENUMS.get((table, lc.col))
        t = lc.ltype
        if "type" in o:
            self.type = o["type"]
        elif self.enum:
            self.type = self.enum[0]
        else:
            self.type = {"id": "integer", "text": "text", "code": "text", "hash": "text", "bool": "boolean",
                         "datetime": "timestamptz(6)", "date": "date", "int": "integer",
                         "decimal": "numeric"}[t]
        self.identity = self.pk and not self.fk and lc.ltype == "id" and table not in KEEP_PK
        req = REQUIRED.get(table, [])
        self.notnull = (self.pk or t == "bool" or lc.col in ("created_at", "updated_at") or lc.col in req)
        if "default" in o:
            self.default = o["default"]
        elif t == "bool":
            self.default = "false"
        elif lc.col in ("created_at", "updated_at"):
            self.default = "CURRENT_TIMESTAMP"
        else:
            self.default = None


class PTable:
    def __init__(self, lt):
        self.lt = lt
        self.name = lt.table
        self.cols = [PCol(lt.table, c) for c in lt.cols]
        self.pk = [c.name for c in self.cols if c.pk]


def build_model(cat):
    model = {t: PTable(lt) for t, lt in cat.items() if lt.section != "ref"}
    for t in model.values():  # FK 가 가리키는 컬럼은 참조 테이블의 기본키다
        for c in t.cols:
            if c.ref and c.ref[1] is None:
                c.ref = (c.ref[0], model[c.ref[0]].pk[0])
    return model


# ─── SQL ───────────────────────────────────────────────────────────────────
def q(s):
    return f'"{s}"'


def sql_text(s):
    return "'" + s.replace("'", "''") + "'"


def build_sql(model):
    o = ["-- WHALE ERP 1팀 1차 물리 스키마 (PostgreSQL 15+)",
         "-- _build_physical.py 가 README.md 카탈로그에서 만든다. 손으로 고치지 말 것.",
         "-- whale-erp-api 로 옮길 때는 마이그레이션 SQL 로 나눠 넣는다. CHECK 제약과 부분 고유 인덱스는",
         "-- Prisma 스키마 언어로 표현되지 않으므로 마이그레이션 SQL 에만 남는다.",
         "-- 3팀 소유 테이블(accounts, staff_members)은 만들지 않는다.", ""]
    # enum
    seen = {}
    for (t, c), (name, vals, ko) in ENUMS.items():
        seen.setdefault(name, (vals, ko))
    o.append("-- ── enum ──")
    for name, (vals, ko) in seen.items():
        o.append(f"CREATE TYPE {q(name)} AS ENUM ({', '.join(sql_text(v) for v in vals)});  -- {ko}")
    o.append("")
    # tables
    for t in model.values():
        o.append(f"-- {t.lt.name}")
        o.append(f"CREATE TABLE {q(t.name)} (")
        lines = []
        for c in t.cols:
            s = f"    {q(c.name)} {c.type.upper() if not c.enum else q(c.type)}"
            if c.identity:
                s += " GENERATED ALWAYS AS IDENTITY"
            if c.notnull:
                s += " NOT NULL"
            if c.default is not None:
                s += f" DEFAULT {c.default}"
            lines.append(s)
        lines.append("")
        lines.append(f"    CONSTRAINT {q(t.name + '_pkey')} PRIMARY KEY ({', '.join(q(p) for p in t.pk)})")
        o.append(",\n".join(lines).replace(",\n,\n", ",\n\n").replace("\n,\n", "\n\n"))
        o.append(");")
        o.append("")
    # checks
    o.append("-- ── CHECK 제약 ──")
    for t, suffix, expr in CHECKS:
        o.append(f"ALTER TABLE {q(t)} ADD CONSTRAINT {q(t + '_' + suffix)} CHECK ({expr});")
    o.append("")
    # unique
    o.append("-- ── 고유 제약 ──")
    for t, cols, where, note in UNIQUES:
        name = f"{t}_{'_'.join(cols)}_key"
        s = f"CREATE UNIQUE INDEX {q(name)} ON {q(t)} ({', '.join(q(c) for c in cols)})"
        if where:
            s += f" WHERE {where}"
        o.append(f"{s};  -- {note}")
    for t, cols, where, note in UNIQUES_NND:
        name = f"{t}_{'_'.join(cols)}_key"
        o.append(f"CREATE UNIQUE INDEX {q(name)} ON {q(t)} ({', '.join(q(c) for c in cols)}) NULLS NOT DISTINCT"
                 f" WHERE {where};  -- {note}")
    o.append("")
    # fk
    o.append("-- ── 외래키 (모두 ON DELETE RESTRICT — 삭제는 논리 삭제다) ──")
    for t in model.values():
        for c in t.cols:
            if c.ref:
                rt, rc = c.ref
                o.append(f"ALTER TABLE {q(t.name)} ADD CONSTRAINT {q(t.name + '_' + c.name + '_fkey')} "
                         f"FOREIGN KEY ({q(c.name)}) REFERENCES {q(rt)} ({q(rc)}) ON DELETE RESTRICT ON UPDATE NO ACTION;")
    o.append("")
    o.append("-- ── 조회 인덱스 ──")
    for t, cols in INDEXES:
        o.append(f"CREATE INDEX {q(t + '_' + '_'.join(cols) + '_idx')} ON {q(t)} ({', '.join(q(c) for c in cols)});")
    o.append("")
    o.append("-- ── 주석 ──")
    for t in model.values():
        o.append(f"COMMENT ON TABLE {q(t.name)} IS {sql_text(t.lt.name)};")
        for c in t.cols:
            txt = c.lc.attr + (f" — {c.lc.note}" if c.lc.note else "")
            o.append(f"COMMENT ON COLUMN {q(t.name)}.{q(c.name)} IS {sql_text(txt)};")
    o.append("")
    return "\n".join(o)


# ─── 그림 ──────────────────────────────────────────────────────────────────
GAP_X = 120
GAP_Y = 64
VIEW_W = {"physical": 300, "both": 540}  # 논리+물리 보기는 속성명·컬럼명·타입이 한 줄에 들어간다
VIEW_LABEL = {"logical": "논리", "physical": "물리", "both": "논리+물리"}


def col_x(view, i):
    return 40 + i * (VIEW_W[view] + GAP_X)


# 영역별 배치: 엔티티 id → 열. 같은 열 안의 순서는 논리 ERD 의 세로 순서다. 관계는 논리 ERD 의 것을 따른다.
# full 은 모든 컬럼을 그리고, 나머지는 PK·고유 코드·이름만 그린다.
LAYOUT = {
    "index": {"cols": {"store": 0, "admin_account": 1, "role_group": 2, "code_group": 2, "menu": 3, "code_item": 3},
              "full": set()},
    "auth": {"cols": {"session": 0, "temp_pw": 0, "terms_ver": 0, "terms_hist": 0, "admin_account": 1,
                      "login_hist": 2, "bp_code": 2, "change_hist": 2, "mail_hist": 3},
             "full": {"session", "temp_pw", "terms_ver", "terms_hist", "admin_account", "login_hist", "bp_code",
                      "change_hist", "mail_hist"}},
    "store": {"cols": {"bp_code_ref": 0, "store_floor": 0, "admin_account_sub": 0, "store": 1, "store_hist": 2,
                       "store_image": 2, "mapping": 2, "store_biz": 3},
              "full": {"store", "store_floor", "store_hist", "store_image", "mapping", "store_biz"}},
    "bp": {"cols": {"bp_code": 0, "store": 0, "bp_hist": 1, "admin_account_sub": 1, "account_ref": 2, "staff_ref": 2},
           "full": {"bp_code", "bp_hist"}},
    "system": {"cols": {"role_group": 0, "code_group": 0, "role_menu": 1, "code_item": 1, "menu": 2,
                        "holiday_hist": 2, "public_holiday": 2, "holiday": 3, "holiday_store": 3,
                        "holiday_except": 3, "sync_hist": 3},
               "full": {"role_group", "code_group", "role_menu", "code_item", "menu", "holiday_hist",
                        "public_holiday", "holiday", "holiday_store", "holiday_except", "sync_hist"}},
}

# 관계 연결점·꺾는 위치 지정 (영역, 관계 순번) → dict. 자동 배치로 선이 박스를 지나갈 때만 쓴다.
# 세로 좌표(at_a·at_b)는 두 보기가 같다. 꺾는 x(mid)는 (열, 그 열 박스 오른쪽에서 떨어진 거리) 로 적는다.
REL_FIX = {
    ("auth", 7): {"at_a": 264, "at_b": 264},   # 관리자 계정 → 메일 발송 이력: 로그인 이력과 BP 코드 사이로
    ("store", 2): {"at_a": 120, "at_b": 120},  # 점포 → 점포 변경 이력: 곧게
    ("store", 3): {"at_a": 304, "at_b": 304},  # 점포 → 점포 사업자정보: 변경 이력과 대표 이미지 사이로
    ("store", 4): {"mid": (1, 52)},            # 점포 → 대표 이미지 / 관리자 점포 매핑: 세로선이 겹치지 않게
    ("store", 5): {"mid": (1, 76)},
    ("system", 4): {"mid": (2, GAP_X - 32)},   # BP 휴일 → 휴일 예외 점포: 두 박스 왼쪽 바깥으로 돈다
}

COMPACT_KEEP = {"bp_code", "store_code", "role_code", "menu_code", "login_id", "name", "trade_name",
                "group_code", "item_code", "role_type_code", "store_type_code", "account_status_code"}


def phys_type(c):
    return c.type + ("" if c.notnull else "?")


def ref_rows(lent):
    """3팀 참조 엔티티는 논리 ERD 박스를 그대로 쓴다. (접두, 속성명, 컬럼, 타입)"""
    out = []
    for f in lent.fields:
        name = f.column
        typ = {"id": "integer", "text": "text", "enum": "enum"}.get(f.type, f.type)
        out.append((f.prefix, f.name, name, typ))
    return out


def rows_for(lent, model, full):
    if lent.kind == "ref" or lent.table not in model:
        return ref_rows(lent)
    t = model[lent.table]
    cols = t.cols if full else [c for c in t.cols if c.pk or c.name in COMPACT_KEEP]
    return [(("#" if c.pk else "") + ("→" if c.ref else ""), c.lc.attr, c.name, phys_type(c)) for c in cols]


def view_entity(lent, view, col, model, full):
    rows = rows_for(lent, model, full)
    if view == "physical":
        specs = [f"{p}|{c}|{t}|{c}|" for p, a, c, t in rows]
    else:  # 논리+물리: 이름 칸에 속성명, 컬럼명은 combo_entity_svg 가 따로 그린다
        specs = [f"{p}|{a}|{t}|{c}|" for p, a, c, t in rows]
    e = L.Entity(lent.id, lent.name, lent.table, lent.kind, specs, 0, 0)
    e.x, e.w = col_x(view, col), VIEW_W[view]
    e.combo = view == "both"
    return e


def view_diagrams(model, view):
    out = []
    for ld in L.DIAGRAMS:
        lay = LAYOUT[ld.slug]
        ents = [view_entity(ld.entities[eid], view, lay["cols"][eid], model, eid in lay["full"]) for eid in ld.order]
        by_col = {}
        for e, eid in zip(ents, ld.order):
            by_col.setdefault(e.x, []).append((ld.entities[eid].y, e))
        for lst in by_col.values():
            y = 40
            for _, e in sorted(lst, key=lambda p: p[0]):
                e.y = y
                y = L.r4(y + e.h + GAP_Y)
        rels = []
        for i, r in enumerate(ld.rels):
            fix = REL_FIX.get((ld.slug, i), {})
            mid = fix.get("mid")
            if mid is not None:
                mid = col_x(view, mid[0]) + VIEW_W[view] + mid[1]
            rels.append(L.Rel(r.a, fix.get("sa", r.sa), r.b, fix.get("sb", r.sb), r.ca, r.cb, r.label,
                              at_a=fix.get("at_a"), at_b=fix.get("at_b"), mid=mid,
                              label_side=fix.get("label_side", r.label_side)))
        out.append(L.Diagram(ld.slug, ld.nav, ld.title, ld.subtitle, ents, rels, ld.cards, ld.catalog_intro))
    return out


ATTR_W = 0  # 논리+물리 보기의 속성명 칸 폭. main 에서 정한다


def combo_entity_svg(e):
    """논리+물리 보기 박스: 접두 · 속성명 · 컬럼명 · 타입. 논리 박스 그리기에 컬럼명만 더한다."""
    svg = L._orig_entity_svg(e)
    add = []
    for i, f in enumerate(e.fields):
        by = e.y + L.HEAD_H + 24 + L.ROW_H * i
        add.append(L.t(e.x + 16 + 24 + ATTR_W, by, f.column, 11, L.INK if "#" in f.prefix else L.MUTED, L.MONO))
    return svg[:-len("</g>")] + "\n".join(add) + "\n</g>"


def combo_check(d):
    errs = []
    for e in d.entities.values():
        for f in e.fields:
            need = 16 + 24 + ATTR_W + L.text_w(f.column, 11, 0.62) + 12 + L.text_w(f.type, 9, 0.62) + 16
            if need > e.w:
                errs.append(f"{d.slug}: {e.id}.{f.column} 가 박스 폭을 넘음 ({need:.0f}>{e.w})")
    return errs


def view_svg(d, view):
    svg, errs, _ = L.build_svg(d)
    if view == "both":
        errs = [x for x in errs if "박스 폭을 넘음" not in x] + combo_check(d)
    # 한 페이지에 SVG 가 셋이라 id 가 겹치지 않게 보기 이름을 붙인다
    svg = svg.replace(f"erd-{d.slug}-", f"erd-{d.slug}-{view}-").replace('id="ent-', f'id="{view}-ent-')
    if view != "logical":
        svg = svg.replace(" 논리 ERD.", " 물리 ERD." if view == "physical" else " 논리·물리 ERD.")
    return svg, [f"[{VIEW_LABEL[view]}] {x}" for x in errs]


# ─── HTML ──────────────────────────────────────────────────────────────────
EXTRA_CSS = """
.view-btns{display:inline-flex;border:1px solid var(--rule-solid);border-radius:6px;overflow:hidden;background:var(--paper)}
.view-btns button{font-family:var(--sans);font-size:12.5px;font-weight:500;padding:5px 14px;border:0;border-right:1px solid var(--rule-solid);background:var(--paper);color:var(--muted);cursor:pointer}
.view-btns button:last-child{border-right:0}
.view-btns button:hover{color:var(--ink)}
.view-btns button[aria-pressed="true"]{color:var(--accent);background:var(--accent-tint)}
.view-btns button:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.nav-row .tools{display:flex;gap:12px;align-items:center;margin-left:auto}
.nav-row .tools .key-btns{margin-left:0}
.v{display:none}
body[data-view="logical"] .v-logical,body[data-view="physical"] .v-physical,body[data-view="both"] .v-both{display:block}
body[data-view="logical"] .phys-only{display:none}
.view-note{font-size:13px;color:var(--muted);margin:0 0 12px}
table.spec{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;background:var(--paper)}
table.spec th,table.spec td{border-bottom:1px solid var(--rule);padding:6px 10px;text-align:left;vertical-align:top}
table.spec th{font-family:var(--mono);font-size:10px;letter-spacing:.12em;color:var(--muted);font-weight:500;background:var(--paper-2)}
table.spec td.c{font-family:var(--mono);font-size:12px;white-space:nowrap}
table.spec td.n{color:var(--muted)}
.spec-wrap{overflow-x:auto}
.tbl{background:var(--paper);border:1px solid var(--rule-solid);border-radius:6px;padding:16px 20px;margin-top:16px}
.tbl h3{font-size:15px;font-weight:600;margin-bottom:2px}
.tbl h3 code{font-family:var(--mono);font-size:13px;color:var(--accent);margin-left:8px}
.tbl p.k{font-family:var(--mono);font-size:11.5px;color:var(--muted);margin-top:8px;line-height:1.7}
"""

VIEW_JS = """
<script>
(function(){
var views=['logical','physical','both'],body=document.body;
function pick(){var h=location.hash.slice(1);if(views.indexOf(h)>=0)return h;
try{var s=localStorage.getItem('erd-team1-view');if(views.indexOf(s)>=0)return s}catch(e){}return 'logical'}
function apply(v){body.setAttribute('data-view',v);
document.querySelectorAll('.view-btns button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.view===v?'true':'false')});
document.querySelectorAll('nav[aria-label="ERD 영역"] a, .index-list a').forEach(function(a){a.href=a.getAttribute('href').split('#')[0]+(v==='logical'?'':'#'+v)});
try{localStorage.setItem('erd-team1-view',v)}catch(e){}}
document.querySelectorAll('.view-btns button').forEach(function(b){b.addEventListener('click',function(){
var v=b.dataset.view;apply(v);history.replaceState(null,'',v==='logical'?location.pathname:'#'+v)})});
window.addEventListener('hashchange',function(){apply(pick())});
apply(pick());
})();
</script>
"""

VIEW_NOTE = {
    "logical": "",
    "physical": "PostgreSQL 테이블·컬럼·타입이다. 타입 끝 ? 는 NULL 허용이다. 등록자·수정자(created_by·updated_by) 외래키는 모든 테이블에 있어 선을 생략한다.",
    "both": "논리 속성명 옆에 물리 컬럼명과 타입을 함께 보인다. 타입 끝 ? 는 NULL 허용이다.",
}


# 그림 끌어 옮기기: 마우스로 그림을 잡고 끌면 가로는 그림 영역이, 세로는 페이지가 스크롤된다.
# 1팀 ERD 모든 장에 붙인다.
DRAG_PAN_SLUGS = {"index", "auth", "store", "bp", "system"}
DRAG_PAN_CSS = """
.diagram.pan{cursor:grab}
.diagram.pan.dragging{cursor:grabbing;user-select:none}
"""
DRAG_PAN_JS = """
<script>
(function(){
var d=document.querySelector('.diagram');if(!d)return;
d.classList.add('pan');
var on=false,moved=false,sx=0,sy=0,sl=0,wy=0;
d.addEventListener('pointerdown',function(e){
if(e.button!==0||e.pointerType==='touch')return;
on=true;moved=false;sx=e.clientX;sy=e.clientY;sl=d.scrollLeft;wy=window.scrollY;
});
window.addEventListener('pointermove',function(e){
if(!on)return;
var dx=e.clientX-sx,dy=e.clientY-sy;
if(!moved&&Math.abs(dx)+Math.abs(dy)<4)return;
if(!moved){moved=true;d.classList.add('dragging');try{d.setPointerCapture(e.pointerId)}catch(_){}}
d.scrollLeft=sl-dx;window.scrollTo(window.scrollX,wy-dy);e.preventDefault();
});
function end(){if(!on)return;on=false;d.classList.remove('dragging')}
window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
d.addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);
d.addEventListener('dragstart',function(e){e.preventDefault()});
})();
</script>
"""


def esc(s):
    return L.esc(s)


def home_tables(slug, model):
    if slug == "index":
        return []
    return [t for t in model.values() if t.lt.section == slug]


def spec_html(t):
    rows = []
    for c in t.cols:
        key = " · ".join(x for x in (("PK" if c.pk else ""), ("FK" if c.ref else "")) if x)
        ref = f"→ {c.ref[0]}.{c.ref[1]}" if c.ref else ""
        dflt = "IDENTITY" if c.identity else (c.default or "")
        note = c.lc.note
        if c.ref:  # 참조 칸에 이미 나오는 "xxx FK" 문구는 뺀다
            note = re.sub(r"^[a-z_]+(\.[a-z_]+)? FK(, ?|$)", "", note).strip()
        if c.enum:
            note = (note + " · " if note else "") + " · ".join(c.enum[1])
        rows.append(f"<tr><td class='c'>{esc(key)}</td><td class='c'>{esc(c.name)}</td><td class='c'>{esc(c.type)}</td>"
                    f"<td class='c'>{'NOT NULL' if c.notnull else ''}</td><td class='c'>{esc(dflt)}</td>"
                    f"<td>{esc(c.lc.attr)}</td><td class='n'>{esc(' '.join(x for x in (ref, note) if x))}</td></tr>")
    extras = []
    for tt, cols, where, note in UNIQUES + UNIQUES_NND:
        if tt == t.name:
            extras.append(f"UNIQUE ({', '.join(cols)})" + (f" WHERE {where}" if where else "") + f" — {note}")
    for tt, suffix, expr in CHECKS:
        if tt == t.name:
            extras.append(f"CHECK {t.name}_{suffix}: {expr}")
    for tt, cols in INDEXES:
        if tt == t.name:
            extras.append(f"INDEX {t.name}_{'_'.join(cols)}_idx ({', '.join(cols)})")
    k = "".join(f"{esc(x)}<br>" for x in extras)
    return (f"<div class='tbl' id='t-{t.name}'><h3>{esc(t.lt.name)}<code>{esc(t.name)}</code></h3>"
            "<div class='spec-wrap'><table class='spec'><thead><tr><th>KEY</th><th>COLUMN</th><th>TYPE</th><th>NULL</th>"
            f"<th>DEFAULT</th><th>속성</th><th>참조 · 비고</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div>"
            f"{'<p class=k>' + k + '</p>' if k else ''}</div>")


def page(d, svgs, model):
    marker = "<!--SVGS-->"
    html = L.page(d, marker)
    blocks = []
    for view, svg in svgs.items():
        note = f'<p class="view-note">{esc(VIEW_NOTE[view])}</p>' if VIEW_NOTE[view] else ""
        blocks.append(f'<div class="v v-{view}">{note}{svg}</div>')
    html = html.replace(marker, "\n".join(blocks))
    html = html.replace("WHALE ERP · LOGICAL ERD", "WHALE ERP · LOGICAL · PHYSICAL ERD")
    html = html.replace("</style>", EXTRA_CSS + "</style>", 1)
    html = html.replace("<body>", '<body data-view="logical">', 1)
    btns = "".join(f'<button type="button" aria-pressed="{"true" if v == "logical" else "false"}" data-view="{v}">'
                   f"{VIEW_LABEL[v]}</button>" for v in ("logical", "physical", "both"))
    # 보기 버튼과 PK·FK 버튼을 한 묶음(.tools)으로 오른쪽에 둔다
    html = html.replace('<div class="key-btns"',
                        f'<div class="tools"><div class="view-btns" role="group" aria-label="보기">{btns}</div>'
                        '<div class="key-btns"', 1)
    html = html.replace('</div>\n</div>\n<div class="diagram">', '</div>\n</div>\n</div>\n<div class="diagram">', 1)
    tables = home_tables(d.slug, model)
    extra = ""
    if tables:
        extra = '<div class="phys-only"><h2>테이블 정의</h2>' + "".join(spec_html(t) for t in tables) + "</div>"
    if d.slug == "index":
        extra = ('<div class="phys-only"><h2>스키마</h2><p class="subtitle">CREATE TABLE·제약·인덱스·주석은 '
                 '<a href="schema.sql">schema.sql</a> 에 있다. 영역 장의 물리·논리+물리 보기 아래에 테이블 정의가 있다.</p></div>')
    html = html.replace('<div class="footer">', extra + '\n<div class="footer">', 1)
    html = html.replace("</body>", VIEW_JS + "</body>", 1)
    if d.slug in DRAG_PAN_SLUGS:
        html = html.replace("</style>", DRAG_PAN_CSS + "</style>", 1)
        html = html.replace("</body>", DRAG_PAN_JS + "</body>", 1)
    return html


def main():
    global ATTR_W
    cat = read_catalog()
    model = build_model(cat)
    with open(os.path.join(HERE, "schema.sql"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(build_sql(model))

    views = {"logical": L.DIAGRAMS, "physical": view_diagrams(model, "physical"), "both": view_diagrams(model, "both")}
    ATTR_W = L.r4(max(L.text_w(f.name, 12) for d in views["both"] for e in d.entities.values() for f in e.fields))
    L._orig_entity_svg = L.entity_svg
    L.entity_svg = lambda e: combo_entity_svg(e) if getattr(e, "combo", False) else L._orig_entity_svg(e)
    errs = []
    try:
        for i, d in enumerate(L.DIAGRAMS):
            svgs = {}
            for view, ds in views.items():
                svg, e = view_svg(ds[i], view)
                svgs[view] = svg
                errs += e
            with open(os.path.join(HERE, f"{d.slug}.html"), "w", encoding="utf-8", newline="\n") as fh:
                fh.write(page(d, svgs, model))
    finally:
        L.entity_svg = L._orig_entity_svg
    n_ent = len({e.table for d in L.DIAGRAMS for e in d.entities.values()})
    ncol = sum(len(t.cols) for t in model.values())
    print(f"ERD {len(L.DIAGRAMS)}장(논리·물리·논리+물리) · 고유 엔티티 {n_ent}개 · 물리 테이블 {len(model)}개 · 컬럼 {ncol}개 생성")
    if errs:
        print(f"\n검사 실패 {len(errs)}건")
        for e in errs:
            print("  -", e)
        return 1
    print("검사 통과")
    return 0


if __name__ == "__main__":
    sys.exit(main())
