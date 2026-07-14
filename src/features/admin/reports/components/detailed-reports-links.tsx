import Link from "next/link";
import {
  ClipboardCheck,
  FileCheck,
  GraduationCap,
  School,
  UserRound,
  UserX,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface DetailedReportLink {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const links: DetailedReportLink[] = [
  {
    href: "/admin/reports/teacher-activity",
    title: "Teacher activity",
    description: "Classrooms managed, content created, and grading per teacher.",
    icon: GraduationCap,
  },
  {
    href: "/admin/reports/student-activity",
    title: "Student activity",
    description: "Submissions, grades, and participation per student.",
    icon: UserRound,
  },
  {
    href: "/admin/reports/assignment-completion",
    title: "Assignment completion",
    description: "Submission counts and completion rates per assignment.",
    icon: ClipboardCheck,
  },
  {
    href: "/admin/reports/submission-rates",
    title: "Submission rates",
    description: "How much expected work has been turned in, per classroom.",
    icon: FileCheck,
  },
  {
    href: "/admin/reports/classroom-activity",
    title: "Classroom activity",
    description: "Membership, content, and recent activity per classroom.",
    icon: School,
  },
  {
    href: "/admin/reports/inactive-users",
    title: "Inactive users",
    description: "Disabled accounts, or accounts with no recent activity.",
    icon: UserX,
  },
];

export function DetailedReportsLinks() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="flex items-start gap-3 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <link.icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-foreground">{link.title}</p>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
