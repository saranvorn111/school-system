"use client";

import { useState } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useApiMutation } from "@/hooks/use-api";
import type { GradeStatus } from "@/lib/constants";

/** Approve / publish / send back / reopen — for reviewers (grade:approve, grade:publish). */
export function GradeReview({ sectionId, status }: { sectionId: number; status: GradeStatus }) {
  const [note, setNote] = useState("");
  const base = `/api/sections/${sectionId}/grades`;
  const approve = useApiMutation(`${base}/approve`, { success: "Grades approved." });
  const publish = useApiMutation(`${base}/publish`, { success: "Grades published to students." });
  const reject = useApiMutation<{ note: string }>(`${base}/reject`, {
    success: "Grades sent back to the teacher.",
    onSuccess: () => setNote(""),
  });
  const reopen = useApiMutation<{ note: string }>(`${base}/reopen`, {
    success: "Grades reopened. The teacher can now correct them.",
    onSuccess: () => setNote(""),
  });

  if (status === "draft") return <p className="text-sm text-muted-foreground">The teacher hasn&apos;t submitted grades yet.</p>;
  if (status === "published") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Grades are published and visible to students.</p>
        <div className="space-y-2 border-t pt-4">
          <Field>
            <FieldLabel htmlFor="reopen-note">Reopen for correction</FieldLabel>
            <Textarea id="reopen-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why do the grades need to change?" rows={2} />
          </Field>
          <ConfirmButton
            variant="outline"
            size="sm"
            title="Reopen published grades?"
            description="The grades go back to draft so the teacher can correct them. Students will not see these grades until they are approved and published again."
            confirmLabel="Reopen grades"
            disabled={!note.trim()}
            pending={reopen.isPending}
            onConfirm={() => reopen.mutate({ note })}
          >
            Reopen grades
          </ConfirmButton>
        </div>
      </div>
    );
  }

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
