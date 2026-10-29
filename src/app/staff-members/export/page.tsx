import { Button, PageBar } from "@/components/common";
import { ExportScreen } from "./export-screen";

// 직원 자료 일괄 저장(WHALEERP-337 · 운영 정책 RET-09). 목업 docs/mockup/staff/export.html 의 배치를 공통 컴포넌트로 옮겼다.
// 업무 범위는 탭 안(헤더)에만 있어 화면(클라이언트)이 읽고, 미리 보기 · 지난 요청은 BFF, 요청 · 내려받기는 서버 액션(actions.ts)이다.
// 직원 정보 관리 메뉴 아래 주소라 메뉴 권한 확인은 그 메뉴로 지난다. 역할(BP 마스터 · 가맹마스터)은 화면이 가리고 api 가 403 으로 막는다.
export default function StaffExportPage() {
  return (
    <>
      <PageBar title="직원 자료 일괄 저장">
        <Button variant="off" href="/staff-members">
          목록
        </Button>
      </PageBar>
      <ExportScreen />
    </>
  );
}
