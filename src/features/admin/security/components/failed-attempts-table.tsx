import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { FailedLoginAttemptItem } from "../types";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function FailedAttemptsTable({ items }: { items: FailedLoginAttemptItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>IP address</TableHead>
          <TableHead>Device</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="text-foreground">{item.email}</TableCell>
            <TableCell className="text-muted-foreground">{item.userName ?? "Unknown"}</TableCell>
            <TableCell className="text-muted-foreground">{item.ipAddress ?? "—"}</TableCell>
            <TableCell className="max-w-xs truncate text-muted-foreground">
              {item.userAgent ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {dateFormatter.format(item.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
