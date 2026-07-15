"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/permissions";
import { MaterialStatus } from "@/generated/prisma/enums";

import * as materialService from "../services/material-service";
import type { ActionResult, MaterialSummary } from "../types";
import {
  createMaterialSchema,
  materialIdSchema,
  updateMaterialSchema,
} from "../validation/material-schema";
import { extractUploadedFiles, formDataToObject, toErrorResult } from "./shared";

const STATUS_MAP = {
  DRAFT: MaterialStatus.DRAFT,
  SCHEDULED: MaterialStatus.SCHEDULED,
  PUBLISHED: MaterialStatus.PUBLISHED,
} as const;

export async function createMaterialAction(
  _prevState: ActionResult<MaterialSummary> | null,
  formData: FormData,
): Promise<ActionResult<MaterialSummary>> {
  try {
    const user = await requireUser();

    const parsed = createMaterialSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const material = await materialService.createMaterial(
      parsed.data.classroomId,
      user,
      {
        title: parsed.data.title,
        description: parsed.data.description,
        url: parsed.data.url,
        topicId: parsed.data.topicId,
      },
      extractUploadedFiles(formData),
      STATUS_MAP[parsed.data.status],
      parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : null,
    );
    revalidatePath(`/classes/${parsed.data.classroomId}/classwork`);

    return { status: "success", data: material };
  } catch (error) {
    return toErrorResult(error, "Couldn't create the material. Please try again.");
  }
}

export async function updateMaterialAction(
  _prevState: ActionResult<MaterialSummary> | null,
  formData: FormData,
): Promise<ActionResult<MaterialSummary>> {
  try {
    const user = await requireUser();

    const parsed = updateMaterialSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const material = await materialService.updateMaterial(
      parsed.data.materialId,
      user,
      {
        title: parsed.data.title,
        description: parsed.data.description,
        url: parsed.data.url,
        topicId: parsed.data.topicId,
      },
      extractUploadedFiles(formData),
    );
    revalidatePath(`/classes/${parsed.data.classroomId}/classwork`);

    return { status: "success", data: material };
  } catch (error) {
    return toErrorResult(error, "Couldn't update the material. Please try again.");
  }
}

export async function deleteMaterialAction(
  classroomId: string,
  materialId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = materialIdSchema.safeParse({ materialId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid material." };
    }

    await materialService.deleteMaterial(parsed.data.materialId, user);
    revalidatePath(`/classes/${classroomId}/classwork`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't delete the material. Please try again.");
  }
}

export async function removeMaterialAttachmentAction(
  classroomId: string,
  materialId: string,
  fileAttachmentId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = materialIdSchema.safeParse({ materialId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid material." };
    }

    await materialService.removeMaterialAttachment(parsed.data.materialId, fileAttachmentId, user);
    revalidatePath(`/classes/${classroomId}/classwork`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't remove that attachment. Please try again.");
  }
}
