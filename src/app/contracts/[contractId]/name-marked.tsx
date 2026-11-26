// 재발송 확인창 문장 안의 직원 이름을 굵게(600) + 밑줄로 — 누구에게 다시 보내는지 바로 보이게(2026-11-19 사용자 지정).
// 문장은 send-model 의 글자 그대로 두고(테스트가 글자를 본다) 그리는 쪽에서 이름의 첫 자리만 감싼다. 이름이 없거나 문장에 없으면 그대로다.
export function NameMarked({ line, name }: { line: string; name: string | null | undefined }) {
  const at = name ? line.indexOf(name) : -1;
  if (!name || at < 0) return <>{line}</>;
  return (
    <>
      {line.slice(0, at)}
      <u className="font-semibold">{name}</u>
      {line.slice(at + name.length)}
    </>
  );
}
