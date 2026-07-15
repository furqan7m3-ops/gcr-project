"use client";

import { useEffect } from "react";

import { PageContainer } from "@/components/page/page-container";
import { ErrorState } from "@/components/states/error-state";

export default function ReviewError({
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
      <ErrorState
        title="Couldn't load the review queue"
        description="Something went wrong while loading your submissions to review."
        onRetry={reset}
      />
    </PageContainer>
  );
}
