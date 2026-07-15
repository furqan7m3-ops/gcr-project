"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PublishMode = "DRAFT" | "PUBLISHED" | "SCHEDULED";

interface PublishControlsProps {
  mode: PublishMode;
  onModeChange: (mode: PublishMode) => void;
  scheduledFor: string;
  onScheduledForChange: (value: string) => void;
  fieldError?: string;
  disabled?: boolean;
  publishLabel?: string;
}

/**
 * Shared Draft / Publish now / Schedule for later create-time control,
 * reused as-is inside the announcement, assignment, and material create
 * forms. Renders a hidden "status" field plus, when Schedule is chosen, a
 * datetime-local "scheduledFor" field - both picked up by formData on submit.
 */
export function PublishControls({
  mode,
  onModeChange,
  scheduledFor,
  onScheduledForChange,
  fieldError,
  disabled,
  publishLabel = "Publish",
}: PublishControlsProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "DRAFT" ? "default" : "outline"}
          onClick={() => onModeChange("DRAFT")}
          disabled={disabled}
        >
          Save as draft
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "PUBLISHED" ? "default" : "outline"}
          onClick={() => onModeChange("PUBLISHED")}
          disabled={disabled}
        >
          {publishLabel} now
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "SCHEDULED" ? "default" : "outline"}
          onClick={() => onModeChange("SCHEDULED")}
          disabled={disabled}
        >
          Schedule for later
        </Button>
      </div>

      {mode === "SCHEDULED" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="scheduledFor">Publish date &amp; time</Label>
          <Input
            id="scheduledFor"
            name="scheduledFor"
            type="datetime-local"
            value={scheduledFor}
            onChange={(event) => onScheduledForChange(event.target.value)}
            required
          />
          {fieldError ? <p className="text-xs text-destructive">{fieldError}</p> : null}
        </div>
      ) : null}

      <input type="hidden" name="status" value={mode} />
    </div>
  );
}
