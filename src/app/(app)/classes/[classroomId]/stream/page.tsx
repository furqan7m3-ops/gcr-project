import { Megaphone } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";

export default function StreamPage() {
  return (
    <EmptyState
      icon={Megaphone}
      title="Stream is coming soon"
      description="Announcements and class updates will appear here in a future update."
    />
  );
}
