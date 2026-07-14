import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { contentTypeLabels, statusBadgeVariant, statusLabels } from "../lib/moderation-display";
import type { ModerationItem } from "../types";
import { ModerationRowActions } from "./moderation-row-actions";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function ModerationTable({ items }: { items: ModerationItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Content</TableHead>
          <TableHead>Classroom</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="text-muted-foreground">
              {contentTypeLabels[item.contentType]}
            </TableCell>
            <TableCell className="max-w-xs truncate text-foreground">{item.title}</TableCell>
            <TableCell className="text-muted-foreground">{item.classroomTitle}</TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-foreground">{item.authorName}</span>
                <span className="text-xs text-muted-foreground">{item.authorEmail}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={statusBadgeVariant[item.moderationStatus]}>
                {statusLabels[item.moderationStatus]}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {dateFormatter.format(item.createdAt)}
            </TableCell>
            <TableCell className="text-right">
              <ModerationRowActions item={item} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
