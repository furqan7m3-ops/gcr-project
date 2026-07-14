import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { ActiveSessionItem } from "../types";
import { SessionRowActions } from "./session-row-actions";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function SessionsTable({ items }: { items: ActiveSessionItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>IP address</TableHead>
          <TableHead>Device</TableHead>
          <TableHead>Signed in</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{item.userName}</span>
                <span className="text-xs text-muted-foreground">{item.userEmail}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{item.ipAddress ?? "—"}</TableCell>
            <TableCell className="max-w-xs truncate text-muted-foreground">
              {item.userAgent ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {dateFormatter.format(item.createdAt)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {dateFormatter.format(item.expiresAt)}
            </TableCell>
            <TableCell className="text-right">
              <SessionRowActions session={item} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
