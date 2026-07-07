"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/states/error-state";

export default function StreamError({
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
      title="Couldn't load the stream"
      description="Something went wrong while loading announcements for this class."
      onRetry={reset}
    />
  );
}
