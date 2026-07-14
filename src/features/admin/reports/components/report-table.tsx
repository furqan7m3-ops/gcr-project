import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { ReportColumn, SortDirection } from "../detailed-types";

interface ReportTableProps<Row> {
  columns: ReportColumn<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;
  sortField: string;
  sortDir: SortDirection;
  buildSortHref: (field: string) => string;
  formatCell: (row: Row, key: Extract<keyof Row, string>) => ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
}

export function ReportTable<Row>({
  columns,
  rows,
  getRowId,
  sortField,
  sortDir,
  buildSortHref,
  formatCell,
  emptyTitle,
  emptyDescription,
}: ReportTableProps<Row>) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column.key}
              className={column.align === "right" ? "text-right" : undefined}
            >
              <Link
                href={buildSortHref(column.key)}
                className={cn(
                  "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                  column.align === "right" && "justify-end",
                )}
              >
                {column.label}
                {sortField === column.key ? (
                  sortDir === "asc" ? (
                    <ArrowUp className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDown className="h-3.5 w-3.5" />
                  )
                ) : (
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                )}
              </Link>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={getRowId(row)}>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                className={column.align === "right" ? "text-right" : undefined}
              >
                {formatCell(row, column.key)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
