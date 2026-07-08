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
import type { MaterialSummary, TopicSummary } from "../types";
import { CreateTopicDialog } from "./create-topic-dialog";
import { MaterialFormDialog } from "./material-form-dialog";
import { MaterialList } from "./material-list";
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
  materials: MaterialSummary[];
  canManage: boolean;
}

export function TopicList({ classroomId, topics, materials, canManage }: TopicListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [createTopicOpen, setCreateTopicOpen] = useState(false);
  const [createMaterialOpen, setCreateMaterialOpen] = useState(false);
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

  function handleTopicCreated() {
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

  const ungroupedMaterials = materials.filter((material) => !material.topicId);
  const isEmpty = optimisticTopics.length === 0 && materials.length === 0;

  function renderTopic(topic: TopicSummary, sortable: boolean) {
    const topicMaterials = materials.filter((material) => material.topicId === topic.id);

    return (
      <div key={topic.id} className="flex flex-col gap-2">
        <TopicRow
          topic={topic}
          canManage={canManage}
          sortable={sortable}
          isEditing={editingTopicId === topic.id}
          onStartEdit={() => setEditingTopicId(topic.id)}
          onCancelEdit={() => setEditingTopicId(null)}
          onSaveEdit={(title) => handleRename(topic.id, title)}
          onDelete={() => handleDelete(topic.id)}
        />
        <div className="pl-6">
          <MaterialList
            materials={topicMaterials}
            classroomId={classroomId}
            topics={optimisticTopics}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage ? (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreateTopicOpen(true)}>
            <Plus /> Create topic
          </Button>
          <Button size="sm" onClick={() => setCreateMaterialOpen(true)}>
            <Plus /> Add material
          </Button>
          <CreateTopicDialog
            classroomId={classroomId}
            open={createTopicOpen}
            onOpenChange={setCreateTopicOpen}
            onCreated={handleTopicCreated}
          />
          <MaterialFormDialog
            mode="create"
            classroomId={classroomId}
            topics={optimisticTopics}
            open={createMaterialOpen}
            onOpenChange={setCreateMaterialOpen}
          />
        </div>
      ) : null}

      {isEmpty ? (
        <TopicEmptyState canManage={canManage} />
      ) : (
        <>
          {optimisticTopics.length > 0 ? (
            canManage ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={optimisticTopics.map((topic) => topic.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-4">
                    {optimisticTopics.map((topic) => renderTopic(topic, true))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="flex flex-col gap-4">
                {optimisticTopics.map((topic) => renderTopic(topic, false))}
              </div>
            )
          ) : null}

          {ungroupedMaterials.length > 0 ? (
            <div className="flex flex-col gap-2">
              {optimisticTopics.length > 0 ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  General
                </p>
              ) : null}
              <MaterialList
                materials={ungroupedMaterials}
                classroomId={classroomId}
                topics={optimisticTopics}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
