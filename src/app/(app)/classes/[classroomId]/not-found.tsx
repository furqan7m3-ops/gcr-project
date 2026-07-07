import Link from "next/link";
import { FolderX } from "lucide-react";

import { PageContainer } from "@/components/page/page-container";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";

export default function ClassroomNotFound() {
  return (
    <PageContainer>
      <EmptyState
        icon={FolderX}
        title="Class not found"
        description="This class doesn't exist, or you don't have access to it."
        action={
          <Button asChild>
            <Link href="/classes">Back to classes</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
