import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";

import { TodoBoard } from "@/features/todo/components/todo-board";
import { TodoClassroomFilter } from "@/features/todo/components/todo-classroom-filter";
import { getTodoBoard, getTodoClassroomOptions } from "@/features/todo/queries/todo-queries";
import { TODO_CATEGORIES, type TodoCategory } from "@/features/todo/types";

interface PageProps {
  searchParams: Promise<{ classroomId?: string; tab?: string }>;
}

export default async function TodoPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const classroomId = resolved.classroomId?.trim() || undefined;
  const initialTab = TODO_CATEGORIES.includes(resolved.tab as TodoCategory)
    ? (resolved.tab as TodoCategory)
    : undefined;

  const [items, classrooms] = await Promise.all([
    getTodoBoard({ classroomId }),
    getTodoClassroomOptions(),
  ]);

  return (
    <PageContainer>
      <SectionHeader
        title="To-do"
        description="Assignments across all your classes, organized by status."
      />
      <TodoClassroomFilter classrooms={classrooms} classroomId={classroomId} />
      <TodoBoard items={items} initialTab={initialTab} />
    </PageContainer>
  );
}
