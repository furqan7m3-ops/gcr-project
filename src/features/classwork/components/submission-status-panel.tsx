import { ClipboardCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SubmissionStatusPanelProps {
  canManage: boolean;
  studentCount: number;
}

export function SubmissionStatusPanel({ canManage, studentCount }: SubmissionStatusPanelProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <ClipboardCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
        <CardTitle>{canManage ? "Submissions" : "Your work"}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {canManage ? (
          <p className="text-sm text-foreground">
            0 of {studentCount} student{studentCount === 1 ? "" : "s"} submitted
          </p>
        ) : (
          <Badge variant="outline" className="w-fit">
            Not submitted
          </Badge>
        )}
        <p className="text-xs text-muted-foreground">Turning in work isn&apos;t available yet.</p>
      </CardContent>
    </Card>
  );
}
