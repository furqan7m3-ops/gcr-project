"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/permissions";

import * as submissionService from "../services/submission-service";
import type {
  ActionResult,
  PrivateCommentSummary,
  SubmissionReviewDetail,
  SubmissionView,
} from "../types";
import {
  classroomAssignmentIdSchema,
  deletePrivateCommentSchema,
  gradeInputSchema,
  privateCommentSchema,
  removeAttachmentSchema,
  studentSubmissionIdSchema,
  submissionMutationSchema,
} from "../validation/submission-schema";
import { extractFileMetas, formDataToObject, toErrorResult } from "./shared";

function classworkPath(classroomId: string, assignmentId: string) {
  return `/classes/${classroomId}/classwork/${assignmentId}`;
}

function submissionReviewPath(classroomId: string, assignmentId: string, studentId: string) {
  return `${classworkPath(classroomId, assignmentId)}/submissions/${studentId}`;
}

// A private comment or a return can be triggered from either the student's own
// assignment page or the teacher's review page - refresh both, plus the
// teacher's submission list, since its counts may have changed too.
function revalidateSubmissionPaths(classroomId: string, assignmentId: string, studentId: string) {
  revalidatePath(classworkPath(classroomId, assignmentId));
  revalidatePath(`${classworkPath(classroomId, assignmentId)}/submissions`);
  revalidatePath(submissionReviewPath(classroomId, assignmentId, studentId));
}

export async function saveSubmissionDraftAction(
  formData: FormData,
): Promise<ActionResult<SubmissionView>> {
  try {
    const user = await requireUser();

    const parsed = submissionMutationSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const view = await submissionService.createOrUpdateSubmission(
      parsed.data.assignmentId,
      user,
      { textAnswer: parsed.data.textAnswer },
      extractFileMetas(formData),
    );
    revalidatePath(classworkPath(parsed.data.classroomId, parsed.data.assignmentId));

    return { status: "success", data: view };
  } catch (error) {
    return toErrorResult(error, "Couldn't save your draft. Please try again.");
  }
}

export async function submitAssignmentAction(
  formData: FormData,
): Promise<ActionResult<SubmissionView>> {
  try {
    const user = await requireUser();

    const parsed = submissionMutationSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const view = await submissionService.submitSubmission(
      parsed.data.assignmentId,
      user,
      { textAnswer: parsed.data.textAnswer },
      extractFileMetas(formData),
    );
    revalidatePath(classworkPath(parsed.data.classroomId, parsed.data.assignmentId));

    return { status: "success", data: view };
  } catch (error) {
    return toErrorResult(error, "Couldn't turn in your assignment. Please try again.");
  }
}

export async function unsubmitAssignmentAction(
  classroomId: string,
  assignmentId: string,
): Promise<ActionResult<SubmissionView>> {
  try {
    const user = await requireUser();

    const parsed = classroomAssignmentIdSchema.safeParse({ classroomId, assignmentId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid assignment." };
    }

    const view = await submissionService.unsubmitSubmission(parsed.data.assignmentId, user);
    revalidatePath(classworkPath(parsed.data.classroomId, parsed.data.assignmentId));

    return { status: "success", data: view };
  } catch (error) {
    return toErrorResult(error, "Couldn't unsubmit your work. Please try again.");
  }
}

export async function removeSubmissionAttachmentAction(
  classroomId: string,
  assignmentId: string,
  submissionId: string,
  fileAttachmentId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const idsParsed = classroomAssignmentIdSchema.safeParse({ classroomId, assignmentId });
    const attachmentParsed = removeAttachmentSchema.safeParse({ submissionId, fileAttachmentId });
    if (!idsParsed.success || !attachmentParsed.success) {
      return { status: "error", message: "Invalid attachment." };
    }

    await submissionService.removeSubmissionAttachment(
      attachmentParsed.data.submissionId,
      attachmentParsed.data.fileAttachmentId,
      user,
    );
    revalidatePath(classworkPath(idsParsed.data.classroomId, idsParsed.data.assignmentId));

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't remove that attachment. Please try again.");
  }
}

export async function createPrivateCommentAction(
  classroomId: string,
  assignmentId: string,
  studentId: string,
  content: string,
): Promise<ActionResult<PrivateCommentSummary>> {
  try {
    const user = await requireUser();

    const parsed = privateCommentSchema.safeParse({
      classroomId,
      assignmentId,
      studentId,
      content,
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please write a comment first.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const comment = await submissionService.createPrivateComment(
      parsed.data.classroomId,
      parsed.data.assignmentId,
      parsed.data.studentId,
      user,
      parsed.data.content,
    );
    revalidateSubmissionPaths(
      parsed.data.classroomId,
      parsed.data.assignmentId,
      parsed.data.studentId,
    );

    return { status: "success", data: comment };
  } catch (error) {
    return toErrorResult(error, "Couldn't post your comment. Please try again.");
  }
}

export async function deletePrivateCommentAction(
  classroomId: string,
  assignmentId: string,
  studentId: string,
  commentId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = deletePrivateCommentSchema.safeParse({
      classroomId,
      assignmentId,
      studentId,
      commentId,
    });
    if (!parsed.success) {
      return { status: "error", message: "Invalid comment." };
    }

    await submissionService.deletePrivateComment(parsed.data.commentId, user);
    revalidateSubmissionPaths(
      parsed.data.classroomId,
      parsed.data.assignmentId,
      parsed.data.studentId,
    );

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't delete your comment. Please try again.");
  }
}

// Handles both a plain (ungraded) return and a graded one - if a grade was
// already set via gradeSubmissionAction/updateGradeAction, returning locks
// it and stamps gradedAt; otherwise it just marks the work reviewed.
export async function returnGradedSubmissionAction(
  classroomId: string,
  assignmentId: string,
  studentId: string,
): Promise<ActionResult<SubmissionReviewDetail>> {
  try {
    const user = await requireUser();

    const parsed = studentSubmissionIdSchema.safeParse({ classroomId, assignmentId, studentId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid submission." };
    }

    const detail = await submissionService.returnSubmission(
      parsed.data.classroomId,
      parsed.data.assignmentId,
      parsed.data.studentId,
      user,
    );
    revalidateSubmissionPaths(
      parsed.data.classroomId,
      parsed.data.assignmentId,
      parsed.data.studentId,
    );

    return { status: "success", data: detail };
  } catch (error) {
    return toErrorResult(error, "Couldn't return this submission. Please try again.");
  }
}

async function gradeSubmission(
  classroomId: string,
  assignmentId: string,
  studentId: string,
  grade: number,
  feedback: string | undefined,
): Promise<ActionResult<SubmissionReviewDetail>> {
  try {
    const user = await requireUser();

    const parsed = gradeInputSchema.safeParse({
      classroomId,
      assignmentId,
      studentId,
      grade,
      feedback,
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const detail = await submissionService.setSubmissionGrade(
      parsed.data.classroomId,
      parsed.data.assignmentId,
      parsed.data.studentId,
      user,
      { grade: parsed.data.grade, feedback: parsed.data.feedback },
    );
    revalidateSubmissionPaths(
      parsed.data.classroomId,
      parsed.data.assignmentId,
      parsed.data.studentId,
    );

    return { status: "success", data: detail };
  } catch (error) {
    return toErrorResult(error, "Couldn't save the grade. Please try again.");
  }
}

// gradeSubmissionAction and updateGradeAction are intentionally identical -
// both are the initial-entry and edit-before-return moments of the same
// underlying upsert, named separately to match the two UI actions they back.
export async function gradeSubmissionAction(
  classroomId: string,
  assignmentId: string,
  studentId: string,
  grade: number,
  feedback: string | undefined,
): Promise<ActionResult<SubmissionReviewDetail>> {
  return gradeSubmission(classroomId, assignmentId, studentId, grade, feedback);
}

export async function updateGradeAction(
  classroomId: string,
  assignmentId: string,
  studentId: string,
  grade: number,
  feedback: string | undefined,
): Promise<ActionResult<SubmissionReviewDetail>> {
  return gradeSubmission(classroomId, assignmentId, studentId, grade, feedback);
}
