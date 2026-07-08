"use server";

import { revalidatePath } from "next/cache";

import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { AuthError, requireUser } from "@/lib/auth/permissions";

import * as materialService from "../services/material-service";
import type { FileMeta } from "../services/material-service";
import type { ActionResult, MaterialSummary } from "../types";
import {
  createMaterialSchema,
  materialIdSchema,
  updateMaterialSchema,
} from "../validation/material-schema";

function formDataToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }

  return result;
}

// FormData can carry real File entries alongside plain fields - the input picks
// those up under "files"; only their metadata is used, never the file bytes.
function extractFileMetas(formData: FormData): FileMeta[] {
  return formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0 && entry.name !== "")
    .map((file) => ({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    }));
}

function toErrorResult<T>(error: unknown, fallbackMessage: string): ActionResult<T> {
  if (error instanceof AuthError || error instanceof ClassroomServiceError) {
    return { status: "error", message: error.message };
  }

  console.error(error);
  return { status: "error", message: fallbackMessage };
}

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
      extractFileMetas(formData),
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

    const material = await materialService.updateMaterial(parsed.data.materialId, user, {
      title: parsed.data.title,
      description: parsed.data.description,
      url: parsed.data.url,
      topicId: parsed.data.topicId,
    });
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
