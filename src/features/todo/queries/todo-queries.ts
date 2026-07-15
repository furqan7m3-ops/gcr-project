import { listActiveClassroomsForUser } from "@/features/classroom/services/classroom-service";
import { requireUser } from "@/lib/auth/permissions";

import * as todoService from "../services/todo-service";
import type { TodoAssignmentItem, TodoClassroomOption, TodoFilters } from "../types";

/** Server-only entry point for the /todo page (RSC). */
export async function getTodoBoard(filters: TodoFilters): Promise<TodoAssignmentItem[]> {
  const user = await requireUser();
  return todoService.getStudentTodoItems(user, filters);
}

/** Server-only entry point for the "All Classes" filter dropdown's options. */
export async function getTodoClassroomOptions(): Promise<TodoClassroomOption[]> {
  const user = await requireUser();
  return listActiveClassroomsForUser(user.id);
}
