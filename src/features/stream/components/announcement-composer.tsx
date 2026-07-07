"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { createAnnouncementAction } from "../actions/stream-mutations";
import type { ActionResult, AnnouncementSummary } from "../types";

const initialState: ActionResult<AnnouncementSummary> | null = null;

export function AnnouncementComposer({ classroomId }: { classroomId: string }) {
  const [state, formAction, isPending] = useActionState(createAnnouncementAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) {
      return;
    }

    if (state.status === "success") {
      toast.success("Announcement posted");
      formRef.current?.reset();
    } else if (!state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state]);

  const fieldErrors = state?.status === "error" ? state.fieldErrors : undefined;

  return (
    <Card>
      <CardContent className="pt-6">
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="classroomId" value={classroomId} />
          <Textarea
            name="content"
            placeholder="Share something with your class…"
            rows={3}
            required
            maxLength={5000}
          />
          {fieldErrors?.content ? (
            <p className="text-xs text-destructive">{fieldErrors.content[0]}</p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Posting…" : "Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
