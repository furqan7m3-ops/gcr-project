import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { LockedAccountItem } from "../types";
import { LockedAccountRowActions } from "./locked-account-row-actions";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function LockedAccountsTable({ items }: { items: LockedAccountItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="text-right">Failed attempts</TableHead>
          <TableHead>Locked at</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium text-foreground">{item.name}</TableCell>
            <TableCell className="text-muted-foreground">{item.email}</TableCell>
            <TableCell className="text-right text-muted-foreground">
              {item.failedLoginAttempts}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {item.lockedAt ? dateFormatter.format(item.lockedAt) : "—"}
            </TableCell>
            <TableCell className="text-right">
              <LockedAccountRowActions account={item} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
