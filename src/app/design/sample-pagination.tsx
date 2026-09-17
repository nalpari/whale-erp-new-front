"use client";

import { useState } from "react";
import { Pagination } from "@/components/common";

// 샘플 페이지는 서버 컴포넌트라 onPageChange 를 넘길 수 없어, 현재 페이지를 여기서 쥔다.
export function SamplePagination({ totalPages }: { totalPages: number }) {
  const [page, setPage] = useState(1);
  return <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />;
}
