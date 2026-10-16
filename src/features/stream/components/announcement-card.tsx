import { Pin } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AttachmentList } from "@/components/files/attachment-list";
import { ContentStatusBadge } from "@/features/scheduling/components/content-status-badge";
import { cn, getInitials } from "@/lib/utils";

import type { AnnouncementSummary } from "../types";
import { AnnouncementManagementMenu } from "./announcement-management-menu";
import { CommentThread } from "./comment-thread";

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

interface AnnouncementCardProps {
  announcement: AnnouncementSummary;
  classroomId: string;
  currentUser: { id: string; name: string; image: string | null };
  archived?: boolean;
}

export function AnnouncementCard({
  announcement,
  classroomId,
  currentUser,
  archived = false,
}: AnnouncementCardProps) {
  return (
    // Pinned posts get a gold left rule plus the "Pinned" label - enough to
    // stand out in the feed without tinting the whole card.
    <Card className={cn(announcement.isPinned && "border-l-4 border-l-gold")}>
      <CardHeader className="flex-row items-start gap-3 pb-3">
        <Avatar>
          {announcement.author.image ? (
            <AvatarImage src={announcement.author.image} alt={announcement.author.name} />
          ) : null}
          <AvatarFallback>{getInitials(announcement.author.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-sm font-semibold text-foreground">
            {announcement.author.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(announcement.createdAt)}
            {announcement.isEdited ? " · edited" : ""}
          </p>
        </div>
        {announcement.isPinned ? (
          <span
            className="flex shrink-0 items-center gap-1 rounded-md bg-gold-soft px-2 py-0.5 text-xs font-medium text-gold-foreground dark:text-gold"
            title="Pinned announcement"
          >
            <Pin className="h-3.5 w-3.5" aria-hidden />
            Pinned
          </span>
        ) : null}
        <ContentStatusBadge status={announcement.status} scheduledFor={announcement.scheduledFor} />
        {announcement.canManage ? (
          <AnnouncementManagementMenu classroomId={classroomId} announcement={announcement} />
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <p className="whitespace-pre-wrap text-sm text-foreground">{announcement.content}</p>

        <AttachmentList attachments={announcement.attachments} />

        <CommentThread
          classroomId={classroomId}
          announcementId={announcement.id}
          comments={announcement.comments}
          currentUser={currentUser}
          archived={archived}
        />
      </CardContent>
    </Card>
  );
}
