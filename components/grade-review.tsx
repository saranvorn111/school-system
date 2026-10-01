"use client";

import { useState } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useApiMutation } from "@/hooks/use-api";
import type { GradeStatus } from "@/lib/constants";

/** Approve / publish / send back — for reviewers (grade:approve, grade:publish). */
export function GradeReview({ sectionId, status }: { sectionId: number; status: GradeStatus }) {
  const [note, setNote] = useState("");
  const base = `/api/sections/${sectionId}/grades`;
  const approve = useApiMutation(`${base}/approve`, { success: "Grades approved." });
  const publish = useApiMutation(`${base}/publish`, { success: "Grades published to students." });
  const reject = useApiMutation<{ note: string }>(`${base}/reject`, {
    success: "Grades sent back to the teacher.",
    onSuccess: () => setNote(""),
  });

  if (status === "draft") return <p className="text-sm text-muted-foreground">The teacher hasn&apos;t submitted grades yet.</p>;
  if (status === "published") return <p className="text-sm text-muted-foreground">Grades are published and visible to students.</p>;

  return (
    <div className="space-y-5">
      {status === "submitted" && (
        <Button onClick={() => approve.mutate(undefined)} disabled={approve.isPending}>
          Approve grades
        </Button>
      )}
      {status === "approved" && (
        <ConfirmButton
          title="Publish grades?"
          description="Students will see these grades immediately."
          confirmLabel="Publish"
          onConfirm={() => publish.mutate(undefined)}
          pending={publish.isPending}
        >
          Publish to students
        </ConfirmButton>
      )}

      <div className="space-y-2 border-t pt-4">
        <Field>
          <FieldLabel htmlFor="review-note">Send back to teacher</FieldLabel>
          <Textarea id="review-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What needs to be fixed?" rows={2} />
        </Field>
        <Button variant="outline" size="sm" disabled={!note.trim() || reject.isPending} onClick={() => reject.mutate({ note })}>
          Return to draft
        </Button>
      </div>
    </div>
  );
}
