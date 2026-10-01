# -*- coding: utf-8 -*-
"""정의 파일 본보기. WHALE ERP 3팀의 「TO-DO」 모듈을 그대로 옮겨 놓았다.

모듈 하나에 파일 하나다. 파이썬 파일이지만 실제로는 자료만 담는다.
자기 프로젝트에 쓸 때는 이 파일을 베껴 MODULE·TRACK·SPECS·T 를 자기 것으로 바꾼다.

  MODULE  Plane 모듈 이름과 똑같이 적는다. 모듈은 Plane 에 먼저 만들어 둔다
  TRACK   이 모듈의 모든 작업에 함께 붙는 영역 라벨. Plane 에 먼저 만들어 둔다

SPECS — Manyfast 명세 하나에 항목 하나. 최상위 작업이 된다
  key     external_id. 겹치지 않게. "spec-" 을 앞에 붙여 개발 작업과 갈라 둔다
  name    Plane 에 보일 이름 = Manyfast 명세 이름 그대로
  mf      Manyfast 명세 ID. 없으면 빼도 된다 (명세가 없는 묶음 작업)
  layers  이 명세가 걸치는 층 목록 → 라벨이 된다
  html    명세를 두세 문장으로 줄인 것

T — 개발 작업. 명세 하나를 층과 화면으로 쪼갠 것
  key     external_id. 선행을 걸 때 이 키로 가리킨다
  spec    부모가 될 명세의 name
  name    하는 일. 층 접두는 러너가 붙이므로 여기 적지 않는다
  layer   웹 · 앱 · API · 확인 (run_module.py 맨 위에서 자기 층으로 바꾼다)
  pr      urgent · high · medium · low
  after   선행 작업의 key 목록. 먼저 만든 다른 모듈의 키도 쓸 수 있다
  done    완료 조건. 명세 슬롯의 문장을 그 작업 몫만 골라 옮긴다.
          확정된 쟁점은 문장 끝에 쟁점 번호를 괄호로 붙인다
"""
MODULE = "TO-DO"
TRACK = "근무"

SPECS = [
 dict(key="spec-TO-DO 관리", name="TO-DO 관리", mf="S-NIAGGB", layers=["웹", "앱"],
   html="<p>관리자는 정규 근무 외의 특별업무를 TO-DO로 지시한다. 개인 또는 근무지 전체 직원에게 배정하고, "
        "전체 배정이면 각자 수행인지 한 명 수행인지를 등록할 때 고른다. 수행 예정 날짜는 필수이고 시간은 "
        "선택이며 긴급 표시를 할 수 있다. 직원은 자기에게 배정된 TO-DO의 수행 상태를 바꾼다.</p>"),
]

T = [
 dict(key="todo-api-model", spec="TO-DO 관리", name="TO-DO 데이터 구조와 배정 그룹",
      layer="API", pr="urgent", after=[],
   done=["TO-DO에 제목·내용·근무지·배정 방식·수행 방식·수행 예정 날짜·수행 시간·긴급 여부·수행 상태·등록일·등록 관리자를 저장한다.",
         "개인과 각자 수행은 담당 직원 하나를, 공유는 대상 직원 목록과 수행자를 저장한다.",
         "전체·각자 수행으로 만든 TO-DO는 같은 배정 그룹으로 묶어 한 건처럼 고치고 지울 수 있다.",
         "수행 상태는 대기·진행 중·완료 셋이다."]),
 dict(key="todo-api-write", spec="TO-DO 관리", name="TO-DO 등록·수정·삭제",
      layer="API", pr="high", after=["todo-api-model"],
   done=["개인(한 명 이상)과 근무지 전체를 배정 대상으로 받는다.",
         "전체 배정이면 수행 방식을 각자 수행과 한 명 수행 중에서 받고, 등록 뒤에는 바꾸지 못한다.",
         "각자 수행은 대상마다 1건, 한 명 수행은 공유 1건을 만든다.",
         "수행 예정 날짜가 비었거나 오늘보다 이전이면 막는다. 전체 배정 대상이 없어도 막는다.",
         "퇴직한 직원에게는 배정하지 못한다."]),
 dict(key="todo-api-list", spec="TO-DO 관리", name="TO-DO 목록 조회",
      layer="API", pr="high", after=["todo-api-model"],
   done=["상태와 담당 직원으로 거른다. 근무지 범위는 업무 범위를 따르고 따로 받지 않는다.",
         "수행 예정 일시 오름차순으로 주고 같은 일시에서는 긴급을 앞에 둔다.",
         "페이지 번호로 나누고 페이지당 20·50·100을 받는다. 기본은 20이다.",
         "전체·대기·진행 중·완료 건수를 함께 준다."]),
 dict(key="todo-api-state", spec="TO-DO 관리", name="TO-DO 상태 변경과 공유 선점",
      layer="API", pr="high", after=["todo-api-model"],
   done=["담당 직원과 관리자가 상태를 바꾼다.",
         "공유 TO-DO는 먼저 저장된 완료만 인정하고, 늦은 쪽에는 이미 완료됐다고 알린다.",
         "완료한 사람과 완료 일시를 남긴다."]),
 dict(key="todo-web-list", spec="TO-DO 관리", name="TO-DO 관리 목록 화면",
      layer="웹", pr="high", after=["todo-api-list"],
   done=["전체·대기·진행 중·완료 건수를 위에 요약한다.",
         "상태와 담당 직원으로 거르고, 근무지 필터는 화면에 두지 않는다.",
         "담당·근무지·항목·수행 예정 일시·긴급·상태·등록일을 목록에 보인다.",
         "공유 TO-DO가 완료되면 수행자와 완료 일시를 함께 보인다."]),
 dict(key="todo-app-list", spec="TO-DO 관리", name="근무 화면 TO-DO 탭",
      layer="앱", pr="high", after=["todo-api-list"],
   done=["근무 화면 안의 TO-DO 탭에서 자기 TO-DO를 본다. 하단 탭을 따로 두지 않는다(WORK-2).",
         "수행 예정 일시 순으로 보이고 긴급을 앞에 둔다.",
         "홈의 TO-DO 카드 바로가기로 이 탭에 들어온다(HOME-1)."]),
 dict(key="todo-perm", spec="TO-DO 관리", name="TO-DO 권한과 업무 범위 점검",
      layer="확인", pr="medium", after=["todo-api-write", "todo-api-list"],
   done=["BP 관리자와 가맹관리자는 소속 점포 범위만 다룬다.",
         "범위 밖 직원의 TO-DO에는 접근하지 못한다.",
         "직원은 자기 TO-DO만 보고 상태만 바꾼다."]),
]
