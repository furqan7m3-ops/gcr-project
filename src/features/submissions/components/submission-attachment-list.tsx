import { Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AttachedFileSummary } from "@/lib/file-attachments";

interface SubmissionAttachmentListProps {
  attachments: AttachedFileSummary[];
  pendingFiles: File[];
  editable: boolean;
  removingAttachmentId?: string | null;
  onRemoveAttachment?: (attachmentId: string) => void;
  onRemovePendingFile?: (index: number) => void;
}

export function SubmissionAttachmentList({
  attachments,
  pendingFiles,
  editable,
  removingAttachmentId,
  onRemoveAttachment,
  onRemovePendingFile,
}: SubmissionAttachmentListProps) {
  if (attachments.length === 0 && pendingFiles.length === 0) {
    return <p className="text-xs text-muted-foreground">No files attached.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center gap-1.5 text-sm text-foreground"
          title="File contents aren't stored yet - this is metadata only."
        >
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{attachment.fileName}</span>
          {editable && onRemoveAttachment ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              disabled={removingAttachmentId === attachment.id}
              onClick={() => onRemoveAttachment(attachment.id)}
              aria-label={`Remove ${attachment.fileName}`}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </Button>
          ) : null}
        </div>
      ))}

      {pendingFiles.map((file, index) => (
        <div
          key={`pending-${file.name}-${index}`}
          className="flex items-center gap-1.5 text-sm text-foreground"
        >
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{file.name}</span>
          <span className="text-xs text-muted-foreground">(not saved yet)</span>
          {onRemovePendingFile ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => onRemovePendingFile(index)}
              aria-label={`Remove ${file.name}`}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
