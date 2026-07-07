import { ClipboardList } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";

export default function ClassworkPage() {
  return (
    <EmptyState
      icon={ClipboardList}
      title="Classwork is coming soon"
      description="Topics, assignments, and materials will appear here in a future update."
    />
  );
}
