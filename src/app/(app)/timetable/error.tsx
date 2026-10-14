"use client";

import { useEffect } from "react";

import { PageContainer } from "@/components/page/page-container";
import { ErrorState } from "@/components/states/error-state";

export default function TimetableError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer>
      <ErrorState onRetry={reset} />
    </PageContainer>
  );
}
