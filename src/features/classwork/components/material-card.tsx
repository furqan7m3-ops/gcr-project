import { ExternalLink, FileText, ImageIcon, Link2, Paperclip, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { MaterialType } from "@/generated/prisma/enums";

import type { MaterialSummary, TopicSummary } from "../types";
import { MaterialManagementMenu } from "./material-management-menu";

const TYPE_ICON: Record<MaterialType, LucideIcon> = {
  [MaterialType.DOCUMENT]: FileText,
  [MaterialType.LINK]: Link2,
  [MaterialType.VIDEO]: Video,
  [MaterialType.IMAGE]: ImageIcon,
  [MaterialType.OTHER]: Paperclip,
};

interface MaterialCardProps {
  material: MaterialSummary;
  classroomId: string;
  topics: TopicSummary[];
}

export function MaterialCard({ material, classroomId, topics }: MaterialCardProps) {
  const Icon = TYPE_ICON[material.type];

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-4 w-4 text-primary" aria-hidden />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-sm font-medium text-foreground">{material.title}</p>
          {material.description ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{material.description}</p>
          ) : null}
          {material.url ? (
            <a
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" aria-hidden />
              <span className="truncate">{material.url}</span>
            </a>
          ) : null}
          {material.attachments.length > 0 ? (
            <div className="mt-1 flex flex-col gap-1">
              {material.attachments.map((attachment) => (
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
          ) : null}
          <p className="text-xs text-muted-foreground">{material.authorName}</p>
        </div>

        {material.canManage ? (
          <MaterialManagementMenu classroomId={classroomId} material={material} topics={topics} />
        ) : null}
      </CardContent>
    </Card>
  );
}
