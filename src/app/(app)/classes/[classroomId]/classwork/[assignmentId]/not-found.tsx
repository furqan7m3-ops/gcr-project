import Link from "next/link";
import { ClipboardX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";

export default function AssignmentNotFound() {
  return (
    <EmptyState
      icon={ClipboardX}
      title="Assignment not found"
      description="This assignment doesn't exist, or you don't have access to it."
      action={
        <Button asChild>
          <Link href="/classes">Back to classes</Link>
        </Button>
      }
    />
  );
}
