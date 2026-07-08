"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  deleteTopicAction,
  renameTopicAction,
  reorderTopicsAction,
} from "../actions/topic-mutations";
import type { TopicSummary } from "../types";
import { CreateTopicDialog } from "./create-topic-dialog";
import { TopicEmptyState } from "./topic-empty-state";
import { TopicRow } from "./topic-row";

type TopicAction =
  | { type: "set"; topics: TopicSummary[] }
  | { type: "add"; topic: TopicSummary }
  | { type: "remove"; topicId: string }
  | { type: "rename"; topicId: string; title: string };

function topicsReducer(state: TopicSummary[], action: TopicAction): TopicSummary[] {
  switch (action.type) {
    case "set":
      return action.topics;
    case "add":
      return [...state, action.topic];
    case "remove":
      return state.filter((topic) => topic.id !== action.topicId);
    case "rename":
      return state.map((topic) =>
        topic.id === action.topicId ? { ...topic, title: action.title } : topic,
      );
    default:
      return state;
  }
}

interface TopicListProps {
  classroomId: string;
  topics: TopicSummary[];
  canManage: boolean;
}

export function TopicList({ classroomId, topics, canManage }: TopicListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [optimisticTopics, applyOptimistic] = useOptimistic(topics, topicsReducer);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = optimisticTopics.findIndex((topic) => topic.id === active.id);
    const newIndex = optimisticTopics.findIndex((topic) => topic.id === over.id);
    const reordered = arrayMove(optimisticTopics, oldIndex, newIndex);

    startTransition(async () => {
      applyOptimistic({ type: "set", topics: reordered });

      const result = await reorderTopicsAction(
        classroomId,
        reordered.map((topic) => topic.id),
      );

      if (result.status === "success") {
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleCreated() {
    // The dialog already awaited the create action, so `topics` on the server is
    // already correct - just refresh. (Splicing it in optimistically here too raced
    // with this refresh and briefly rendered the same topic twice.)
    router.refresh();
  }

  function handleRename(topicId: string, title: string) {
    startTransition(async () => {
      applyOptimistic({ type: "rename", topicId, title });

      const formData = new FormData();
      formData.set("classroomId", classroomId);
      formData.set("topicId", topicId);
      formData.set("title", title);

      const result = await renameTopicAction(null, formData);

      if (result.status === "success") {
        setEditingTopicId(null);
        toast.success("Topic renamed");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDelete(topicId: string) {
    startTransition(async () => {
      applyOptimistic({ type: "remove", topicId });

      const result = await deleteTopicAction(classroomId, topicId);

      if (result.status === "success") {
        toast.success("Topic deleted");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus /> Create topic
          </Button>
          <CreateTopicDialog
            classroomId={classroomId}
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreated={handleCreated}
          />
        </div>
      ) : null}

      {optimisticTopics.length === 0 ? (
        <TopicEmptyState canManage={canManage} />
      ) : canManage ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={optimisticTopics.map((topic) => topic.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-2">
              {optimisticTopics.map((topic) => (
                <TopicRow
                  key={topic.id}
                  topic={topic}
                  canManage
                  sortable
                  isEditing={editingTopicId === topic.id}
                  onStartEdit={() => setEditingTopicId(topic.id)}
                  onCancelEdit={() => setEditingTopicId(null)}
                  onSaveEdit={(title) => handleRename(topic.id, title)}
                  onDelete={() => handleDelete(topic.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="flex flex-col gap-2">
          {optimisticTopics.map((topic) => (
            <TopicRow key={topic.id} topic={topic} canManage={false} />
          ))}
        </ul>
      )}
    </div>
  );
}
