"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/states/error-state";

export default function ClassworkError({
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
    <ErrorState
      title="Couldn't load Classwork"
      description="Something went wrong while loading topics for this class."
      onRetry={reset}
    />
  );
}
