import { Paperclip } from "lucide-react";

import type { AttachedFileSummary } from "@/lib/file-attachments";

interface AssignmentAttachmentsProps {
  attachments: AttachedFileSummary[];
  className?: string;
}

export function AssignmentAttachments({ attachments, className }: AssignmentAttachmentsProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={className ?? "flex flex-col gap-1"}>
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          title="File contents aren't stored yet - this is metadata only."
        >
          <Paperclip className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{attachment.fileName}</span>
        </div>
      ))}
    </div>
  );
}
