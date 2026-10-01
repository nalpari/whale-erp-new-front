---
name: Whale ERP
description: 2026 Whale ERP 1차수정 Figma 를 그대로 옮긴 관리자 화면 디자인 시스템
colors:
  ink: "#3c4046"
  brand: "#6b7988"
  brand-soft: "#8f9eaf"
  label: "#888888"
  muted: "#999999"
  link: "#366fe3"
  nav: "#282f37"
  sub: "#53606f"
  thead-text: "#858b94"
  thead-bg: "#f8f9fb"
  thead-line: "#e9edf5"
  field-line: "#ededee"
  button-line: "#e5e5e5"
  panel-line: "#edeef1"
  divider: "#eeeeee"
  subtle: "#f0f1f3"
  bar: "#f0f2f3"
  bar-line: "#e6e7ea"
  on: "#5e8ce9"
  on-bg: "#f4f9ff"
  off: "#ef6363"
  off-bg: "#fff1f1"
typography:
  display:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "normal"
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    letterSpacing: "-0.025em"
  label:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    letterSpacing: "-0.025em"
rounded:
  sharp: "2px"
  panel: "4px"
  popup: "12px"
  pill: "100px"
spacing:
  hair: "6px"
  tight: "10px"
  row: "12px"
  gap: "18px"
  page: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "#ffffff"
    rounded: "{rounded.sharp}"
    padding: "0 24px"
    height: "34px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
  button-soft:
    backgroundColor: "{colors.brand-soft}"
    textColor: "#ffffff"
    rounded: "{rounded.sharp}"
    height: "34px"
  button-off:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sharp}"
    height: "34px"
  field:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.sharp}"
    height: "34px"
    padding: "0 10px"
    typography: "{typography.body}"
  field-focus:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
  table-head:
    backgroundColor: "{colors.thead-bg}"
    textColor: "{colors.thead-text}"
    height: "42px"
    typography: "{typography.body}"
  table-row:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    height: "46px"
  badge-on:
    backgroundColor: "{colors.on-bg}"
    textColor: "{colors.on}"
    rounded: "{rounded.sharp}"
    padding: "2px 4px"
  badge-off:
    backgroundColor: "{colors.off-bg}"
    textColor: "{colors.off}"
    rounded: "{rounded.sharp}"
    padding: "2px 4px"
  panel:
    backgroundColor: "#ffffff"
    rounded: "{rounded.panel}"
    padding: "24px"
  popup:
    backgroundColor: "#ffffff"
    rounded: "{rounded.sharp}"
    padding: "23px"
---

# Design System: Whale ERP

## Overview

**Creative North Star: "조용한 작업대"**

하루 여덟 시간을 들여다보는 관리자 화면이다. 화면이 말을 걸면 안 되고, 눈에 띄는 것은 데이터여야 한다.
그래서 이 시스템은 색을 거의 쓰지 않는다. 바탕은 흰색과 아주 옅은 회청색(#f8f9fb) 두 장뿐이고,
강조색조차 채도가 낮은 회청색(#6b7988)이다. 빨강과 파랑은 상태 배지와 링크에만 허락된다.

밀도는 높다. 입력칸 34px, 표 줄 46px, 머리글 42px로 한 화면에 열 줄 이상이 들어간다.
여백으로 숨을 틔우는 대신 1px 선과 아주 옅은 바탕 차이로 영역을 나눈다.
모서리는 2px — 거의 각이 살아 있고, 둥근 모양은 헤더의 알약형 컨트롤처럼 "지금 조작할 수 있는 것"에만 쓴다.

움직임은 150~260ms로 짧고, 전부 같은 감속 곡선(`cubic-bezier(0.23,1,0.32,1)`)을 쓴다.
떠오르는 것은 아래에서 위로 4~6px 올라오고, 사라지는 것은 더 빠르게 접힌다.
모든 전환은 `prefers-reduced-motion` 에서 꺼진다.

**Key Characteristics:**
- 회청색 한 가지로 끌고 가는 저채도 팔레트
- 2px 각진 모서리, 1px 선으로 나눈 영역
- 34px / 42px / 46px 로 고정된 높이 체계
- Pretendard 400·500·600·800 네 단계만 사용
- 색은 상태를 말할 때만 등장(운영·미운영·링크·위험)

## Colors

도구 색은 전부 회색 계열이고, 색이 들어가는 순간은 그 자체로 의미가 있다.

### Primary
- **회청 브랜드** (#6b7988): 기본 버튼 바탕, 선택된 날짜, 활성 링크 호버. 화면당 서너 군데를 넘지 않는다.
- **연회청** (#8f9eaf): 보조 버튼(삭제·수정)과 짙은 메뉴 줄 위 활성 글자.

### Secondary
- **상태 파랑** (#5e8ce9) / **연한 파랑 바탕** (#f4f9ff): 운영 중 배지.
- **상태 빨강** (#ef6363) / **연한 빨강 바탕** (#fff1f1): 미운영 배지. 위험 메뉴 글자는 #e93737.
- **링크 파랑** (#366fe3): 상세로 들어가는 글자 링크와 첨부 파일 이름. 버튼 모양에는 쓰지 않는다.

### Neutral
- **먹색** (#3c4046): 본문 글자 기본값.
- **라벨 회색** (#888888): 폼 라벨, 표의 왼쪽 항목 칸, 플레이스홀더.
- **빈 값 회색** (#999999): 데이터가 없을 때의 안내 문구.
- **표 머리 회색** (#858b94) / **표 머리 바탕** (#f8f9fb) / **표 선** (#e9edf5): 목록과 상세 표.
- **짙은 메뉴** (#282f37) / **2depth 글자** (#53606f): 헤더의 1depth 줄과 그 아래 줄.
- **선 4종** — 입력칸 #ededee, 버튼 #e5e5e5, 패널 #edeef1, 구분선 #eeeeee: 쓰임이 다르면 선 색도 다르다.

### Named Rules
**The 두 바탕 규칙.** 바탕은 흰색과 #f8f9fb 둘뿐이다. 영역을 나눌 때 새 회색을 만들지 말고 선을 쓴다.

**The 색은 상태다 규칙.** 파랑과 빨강은 상태·링크·위험에만 쓴다. 장식으로 색을 올리지 않는다.

## Typography

**Body Font:** Pretendard (저장소에 담은 400·500·600·800, 폴백 -apple-system → Apple SD Gothic Neo → Malgun Gothic)

**Character:** 한 벌로 전부 해결한다. 크기와 굵기만 바꿔 위계를 만들고, 자간은 전역 -0.025em 으로 좁혀 숫자와 한글이 같은 리듬으로 붙는다.

### Hierarchy
- **Display** (600, 22px): 페이지 제목 줄. 화면당 하나.
- **Headline** (600, 18px): 카드 안의 묶음 제목("전자 계약서").
- **Title** (600, 16px): 헤더 1depth 메뉴, 상세 표의 제목 줄(500).
- **Body** (400, 14px): 입력칸, 표 본문, 버튼(500). 화면의 대부분.
- **Label** (500, 15px): 헤더 오른쪽 컨트롤과 사용자 이름. 폼 라벨은 14px 500.
- **Caption** (400, 12~13.5px): 2depth 메뉴(13.5px), 로고 아랫줄·요일 머리(12px).

### Named Rules
**The 네 굵기 규칙.** 400·500·600·800 외에는 쓰지 않는다. 800 은 로고 한 곳뿐이다.

## Layout

화면은 `100dvh` 안에서 끝난다. body 는 스크롤하지 않고, 넘치는 것은 목록·필터·상세 카드 안에서만 스크롤한다.
가로는 1720px 아래로 줄어들면 바깥 영역이 가로로 스크롤한다.

세로 구성은 고정이다 — 헤더 흰 줄 70px, 짙은 메뉴 줄 52px, 2depth 줄 41px(열릴 때만), 페이지 제목 줄 59px,
그 아래가 본문이고 본문 여백은 사방 24px 이다.

본문은 왼쪽 필터(펼침 226px / 접힘 76px, 안쪽 내용 188px 고정)와 오른쪽 목록으로 나뉘고 사이 간격은 12px 이다.
등록 패널은 오른쪽에서 464px 로 밀려 나오며, 목록 위에 겹친다.

간격은 6 / 10 / 12 / 18 / 24 다섯 단계만 쓴다. 6 은 버튼 사이, 12 는 줄 사이, 18 은 묶음 사이, 24 는 화면 여백이다.

### Named Rules
**The 한 화면 규칙.** 새 화면도 `100dvh` 안에서 끝낸다. 길어지면 본문 영역에 스크롤을 주고 머리말은 고정한다.

## Elevation & Depth

기본은 완전히 평평하다. 깊이는 그림자가 아니라 1px 선과 바탕 차이로 만든다.
그림자는 "떠 있는 것"에만 붙는다 — 드롭다운과 달력 팝업의 `0 2px 6px rgba(40,47,55,0.08)` 하나뿐이고,
그 외의 카드·패널·표에는 그림자가 없다.

### Named Rules
**The 뜬 것만 그림자 규칙.** 문서 흐름에 놓인 것은 선으로, 위에 뜬 것만 그림자로 구분한다.

## Shapes

모서리는 2px 가 기본이다(버튼, 입력칸, 배지, 표, 팝업). 큰 면을 감싸는 카드와 패널만 4px 로 아주 조금 더 둥글다.
헤더의 점포 선택칸·서비스 바로가기·알림·사용자 아이콘은 완전한 알약형(100px)이라, 조작하는 것과 담는 것이 모양으로 갈린다.
드롭다운 목록은 그 알약형을 받아 12px 로 둥글고, 안쪽 항목은 8px 이다.

테두리는 늘 1px 이고, 호버로 색만 바뀐다. 두께가 변하면 요소가 흔들리므로 처음부터 같은 색 테두리를 깔아 둔다.

## Components

### Buttons
- **Shape:** 거의 각진 모서리(2px), 높이 34px, 좌우 여백 24px, 14px 500.
- **Primary:** 회청 바탕(#6b7988)에 흰 글자. 저장·검색·목록처럼 그 줄의 주 동작.
- **Soft:** 연회청 바탕(#8f9eaf). 삭제·수정처럼 주 동작 옆에 서는 것.
- **Off:** 옅은 회색 바탕(#f0f1f3)에 먹색 글자. 취소.
- **Hover:** 세 종류 모두 흰 바탕 + 브랜드 테두리 + 먹색 글자로 바뀐다(150ms). 테두리를 처음부터 같은 색으로 깔아 크기가 변하지 않는다.
- **링크 버튼:** `href` 를 주면 같은 모양으로 링크가 된다. 생김새는 버튼이고 하는 일이 이동일 때만.

### Inputs / Fields
- **Style:** 흰 바탕, 1px #ededee 테두리, 2px 모서리, 높이 34px, 왼쪽 여백 10px, 14px.
- **Focus:** 포커스 링 대신 테두리만 브랜드색으로 바뀐다(150ms). 캐럿과 아웃라인을 `!` 로 고정해 앱 전역 스타일에 덮이지 않는다.
- **Select:** 같은 껍데기에 오른쪽 30px 화살표 아이콘.
- **Textarea:** 같은 껍데기에 높이만 늘리고 안쪽 여백 16/12, 줄간 1.6.
- **Checkbox / Radio:** 20px 사각/원. 체크 표시는 150ms 동안 살짝 커지며 나타난다.
- **DateField:** 직접 칠 수 있는 입력칸 + 달력 버튼. 날짜판은 네이티브 `popover` 로 최상위 레이어에 띄운다.

### Cards / Containers
- **Corner Style:** 4px.
- **Background:** 흰색. 바깥 본문 바탕은 #f8f9fb.
- **Border:** 1px #edeef1. 그림자 없음.
- **Internal Padding:** 24~25px, 안쪽 묶음 사이 간격 24px.

### Tables
- **머리글:** #f8f9fb 바탕, #858b94 글자, 높이 42px, 가운데 정렬.
- **본문 줄:** 흰 바탕, 높이 46px, 아래쪽 1px #e9edf5 선. 셀은 넘치면 말줄임.
- **빈 상태:** 92px 한 줄에 "데이터가 없습니다."를 #999999 로 가운데 둔다.
- **상세 표(DetailTable):** 같은 선·같은 바탕을 쓰되 가로로 눕힌다. 왼쪽 라벨 180px 고정(#888888), 오른쪽 값 칸이 남는 폭. 한 칸에 값이 여럿이면 11px 세로선(#d9d9d9)으로 나눈다.

### Navigation
- **헤더:** 흰 줄에 로고와 오른쪽 컨트롤, 그 아래 #282f37 짙은 줄에 1depth 메뉴(16px 600 흰 글자, 호버 #8f9eaf).
- **2depth:** 1depth 를 누르면 41px 줄이 펼쳐진다(200ms, grid 행 높이 전환). 메뉴를 바꾸면 120ms 로 흐려졌다 180ms 로 나타난다.
- **페이지 제목 줄:** 흰 바탕에 22px 600 제목, 아래 1px #e6e7ea.

### Badges
- 2px 모서리, 14px 500, 상하 2 좌우 4. 운영은 파랑 계열(최소 폭 44px), 미운영은 빨강 계열.

### Popups
- 흰 바탕, 1px #ebebeb, 2px 모서리, 안쪽 23px(테두리 1px 을 더해 Figma 의 24 를 맞춘다).
- **fold:** 위에서부터 펼쳐지고 아래에서부터 말린다(열기 260ms / 닫기 180ms).
- **fade:** 투명도만 바꾼다(200ms / 150ms). 꼬리(8px 회전 사각형)를 붙일 수 있다.
- 항상 마운트해 두고 전환으로 여닫아, 연타해도 현재 상태에서 방향만 바뀐다.

### Slide Panel (signature)
오른쪽에서 464px 패널이 밀려 나온다(등록·수정). 열리면 목록 위에 겹치고, 닫히면 화면 밖에 선다.
부모는 `relative` + `overflow-x-clip` 이어야 하고, 닫혀 있는 동안 `inert` 로 포커스가 들어가지 않는다.
Esc 는 가장 안쪽 팝업부터 닫고, 닫히면 포커스가 열었던 버튼으로 돌아온다.

## Do's and Don'ts

### Do:
- **Do** 색은 `--color-erp-*` 토큰에서 가져온다. Figma 에 한 번만 나오는 색(#ebebeb 팝업 테두리, #e93737 위험, #d9d9d9 값 구분선)은 쓰는 자리에 직접 적고 이유를 주석으로 남긴다.
- **Do** 높이를 34(컨트롤) / 42(머리글) / 46(표 줄) 중에서 고른다.
- **Do** 전환은 150ms, 펼침은 200~260ms, `cubic-bezier(0.23,1,0.32,1)` 하나로 맞춘다.
- **Do** 호버에서 색만 바꾼다. 테두리는 같은 색으로 미리 깔아 둔다.
- **Do** 새 화면도 `ErpRoot` 안에 둔다. 밝은 테마·글꼴·스크롤바가 거기서만 적용된다.
- **Do** 스크롤은 필요한 영역에만 준다. body 는 스크롤하지 않는다.

### Don't:
- **Don't** 공통 컴포넌트에 `className`·`style` 을 넘기지 않는다. 폭과 자리는 감싸는 쪽이 정한다.
- **Don't** 새 회색을 만들지 않는다. 바탕은 흰색과 #f8f9fb 둘뿐이다.
- **Don't** 카드·표·패널에 그림자를 넣지 않는다. 그림자는 떠 있는 팝업 하나의 값만 쓴다.
- **Don't** 모서리를 8px 이상으로 둥글리지 않는다. 알약형(100px)은 헤더의 조작 요소 전용이다.
- **Don't** 색만으로 상태를 말하지 않는다. 배지는 글자("운영"/"미운영")를 함께 둔다.
- **Don't** 글자 굵기를 네 단계 밖에서 쓰지 않는다.
