import { Users } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";

export default function PeoplePage() {
  return (
    <EmptyState
      icon={Users}
      title="People is coming soon"
      description="The class roster and invite tools will appear here in a future update."
    />
  );
}
