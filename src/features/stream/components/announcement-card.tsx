import { MessageSquare, Paperclip } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";

import type { AnnouncementSummary } from "../types";

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "Just now";
  }
  if (diffMs < hour) {
    return `${Math.floor(diffMs / minute)}m ago`;
  }
  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)}h ago`;
  }
  if (diffMs < 7 * day) {
    return `${Math.floor(diffMs / day)}d ago`;
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function AnnouncementCard({ announcement }: { announcement: AnnouncementSummary }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start gap-3 pb-3">
        <Avatar>
          {announcement.author.image ? (
            <AvatarImage src={announcement.author.image} alt={announcement.author.name} />
          ) : null}
          <AvatarFallback>{getInitials(announcement.author.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-sm font-semibold text-foreground">
            {announcement.author.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(announcement.createdAt)}
            {announcement.isEdited ? " · edited" : ""}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <p className="whitespace-pre-wrap text-sm text-foreground">{announcement.content}</p>

        {announcement.attachments.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {announcement.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
              >
                <Paperclip className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{attachment.fileName}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
          <span>
            {announcement.commentCount === 0
              ? "No comments"
              : `${announcement.commentCount} comment${announcement.commentCount === 1 ? "" : "s"}`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
