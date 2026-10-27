// 입력칸 아래 오류 문구(FieldMessage)와 폼 전체에 걸친 실패 띠(FailedBand). password-change-panel.tsx 가 처음
// 만들었고, withdraw-panel.tsx 가 그대로 베껴 쓰던 것을 두 번째로 쓰는 화면이 생겨 공통 컴포넌트로 올렸다
// (password-input.tsx 를 common 으로 올린 것과 같은 이유, 2026-10-27).

export function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[13px] leading-[1.5] text-erp-off">
      {message}
    </p>
  );
}

export function FailedBand({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off">
      {message}
    </div>
  );
}
