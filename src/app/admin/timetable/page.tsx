import Link from "next/link";

import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { Button } from "@/components/ui/button";

import { ClashList } from "@/features/timetable/components/clash-list";
import { listActiveRooms, listClashes } from "@/features/timetable/services/timetable-service";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminTimetablePage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const filter = resolved.status === "all" ? "all" : "pending";

  const [clashes, rooms] = await Promise.all([listClashes(filter), listActiveRooms()]);

  return (
    <PageContainer>
      <SectionHeader
        title="Timetable clashes"
        description="Teachers requested a slot that the section already has a class in. Move the blocked class to a free slot to resolve it."
        breadcrumbs={[{ label: "Timetable clashes" }]}
        breadcrumbsHomeHref="/admin"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={filter === "all" ? "/admin/timetable" : "/admin/timetable?status=all"}>
              {filter === "all" ? "Show pending only" : "Show all"}
            </Link>
          </Button>
        }
      />
      <ClashList clashes={clashes} rooms={rooms} />
    </PageContainer>
  );
}
