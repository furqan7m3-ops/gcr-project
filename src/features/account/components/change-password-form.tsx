"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/types/action-result";

import { changePasswordAction } from "../actions/change-password";

const initialState: ActionResult<undefined> | null = null;

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  return (
    <SessionProvider>
      <ChangePasswordFormInner forced={forced} />
    </SessionProvider>
  );
}

function ChangePasswordFormInner({ forced }: { forced: boolean }) {
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialState);
  const router = useRouter();
  const { update } = useSession();

  useEffect(() => {
    if (!state) {
      return;
    }

    if (state.status === "success") {
      toast.success("Password updated.");
      void update().then(() => {
        router.replace("/dashboard");
        router.refresh();
      });
    } else if (!state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state]);

  const fieldErrors = state?.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="forced" value={forced ? "true" : "false"} />
      {forced ? (
        <p className="text-sm text-muted-foreground">
          An administrator requires you to set a new password before continuing.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
          />
          {fieldErrors?.currentPassword ? (
            <p className="text-xs text-destructive">{fieldErrors.currentPassword[0]}</p>
          ) : null}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          autoFocus={forced}
        />
        {fieldErrors?.newPassword ? (
          <p className="text-xs text-destructive">{fieldErrors.newPassword[0]}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        {fieldErrors?.confirmPassword ? (
          <p className="text-xs text-destructive">{fieldErrors.confirmPassword[0]}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
