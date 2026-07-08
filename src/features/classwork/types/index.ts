export type { ActionResult } from "@/types/action-result";

export interface TopicSummary {
  id: string;
  title: string;
  position: number;
  /** Whether the current viewer may create/rename/delete/reorder topics. */
  canManage: boolean;
}
