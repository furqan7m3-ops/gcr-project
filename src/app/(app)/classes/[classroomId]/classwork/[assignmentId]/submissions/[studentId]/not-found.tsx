import Link from "next/link";
import { UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";

export default function SubmissionReviewNotFound() {
  return (
    <EmptyState
      icon={UserX}
      title="Submission not found"
      description="This student isn't enrolled in this class, or you don't have access to their submission."
      action={
        <Button asChild>
          <Link href="/classes">Back to classes</Link>
        </Button>
      }
    />
  );
}
