import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// 약관 본문(api 의 Markdown — 제목 ## · 문단 · 1. 목록 · GFM 표)을 그린다. 약관 전문 화면(/terms)과 약관 팝업(TermsLink)이 함께 쓴다.
// 원본 HTML 은 그리지 않는다(react-markdown 기본값, rehype-raw 를 붙이지 않는다). 글자 크기·색은 감싸는 쪽이 정한다.
// 표 모양은 예전 약관 팝업(데모 public.mjs termsBody)의 관리자 화면 표 그대로다.
const CELL = "border border-erp-thead-line px-[10px] py-[6px] text-left align-top";

// 본문의 ## 는 h3 로 그린다 — 화면·팝업의 약관 제목이 h2 다.
const COMPONENTS: Components = {
  h2: ({ children }) => <h3 className="mt-[12px] font-semibold first:mt-0">{children}</h3>,
  ol: ({ children }) => <ol className="list-decimal pl-[18px]">{children}</ol>,
  ul: ({ children }) => <ul className="list-disc pl-[18px]">{children}</ul>,
  table: ({ children }) => <table className="w-full border-collapse text-[13px]">{children}</table>,
  th: ({ children }) => <th className={`${CELL} bg-erp-thead-bg font-medium text-erp-thead-text`}>{children}</th>,
  td: ({ children }) => <td className={CELL}>{children}</td>,
};

export function TermsMarkdown({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <Markdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {content}
      </Markdown>
    </div>
  );
}
