"use server";

import { revalidatePath } from "next/cache";

import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { AuthError, requireUser } from "@/lib/auth/permissions";

import * as topicService from "../services/topic-service";
import type { ActionResult, TopicSummary } from "../types";
import {
  createTopicSchema,
  renameTopicSchema,
  reorderTopicsSchema,
  topicIdSchema,
} from "../validation/topic-schema";

function formDataToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

function toErrorResult<T>(error: unknown, fallbackMessage: string): ActionResult<T> {
  if (error instanceof AuthError || error instanceof ClassroomServiceError) {
    return { status: "error", message: error.message };
  }

  console.error(error);
  return { status: "error", message: fallbackMessage };
}

export async function createTopicAction(
  _prevState: ActionResult<TopicSummary> | null,
  formData: FormData,
): Promise<ActionResult<TopicSummary>> {
  try {
    const user = await requireUser();

    const parsed = createTopicSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const topic = await topicService.createTopic(parsed.data.classroomId, user, parsed.data.title);
    revalidatePath(`/classes/${parsed.data.classroomId}/classwork`);

    return { status: "success", data: topic };
  } catch (error) {
    return toErrorResult(error, "Couldn't create the topic. Please try again.");
  }
}

export async function renameTopicAction(
  _prevState: ActionResult<TopicSummary> | null,
  formData: FormData,
): Promise<ActionResult<TopicSummary>> {
  try {
    const user = await requireUser();

    const parsed = renameTopicSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const topic = await topicService.renameTopic(parsed.data.topicId, user, parsed.data.title);
    revalidatePath(`/classes/${parsed.data.classroomId}/classwork`);

    return { status: "success", data: topic };
  } catch (error) {
    return toErrorResult(error, "Couldn't rename the topic. Please try again.");
  }
}

export async function deleteTopicAction(
  classroomId: string,
  topicId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = topicIdSchema.safeParse({ topicId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid topic." };
    }

    await topicService.deleteTopic(parsed.data.topicId, user);
    revalidatePath(`/classes/${classroomId}/classwork`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't delete the topic. Please try again.");
  }
}

export async function reorderTopicsAction(
  classroomId: string,
  orderedTopicIds: string[],
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = reorderTopicsSchema.safeParse({ classroomId, orderedTopicIds });
    if (!parsed.success) {
      return { status: "error", message: "Invalid topic order." };
    }

    await topicService.reorderTopics(parsed.data.classroomId, user, parsed.data.orderedTopicIds);
    revalidatePath(`/classes/${classroomId}/classwork`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't save the new topic order. Please try again.");
  }
}
