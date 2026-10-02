"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import type { ReactNode } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { FormDialog } from "@/components/form-dialog";
import { useApiMutation } from "@/hooks/use-api";

/**
 * Edit (pencil) and delete (bin) buttons for one table row.
 * Edit opens the same form as "create", pre-filled. Delete asks first; the API
 * refuses (409) while other records still use this one and the reason is shown as a toast.
 */
export function RowActions({
  name,
  editTitle,
  deletePath,
  children,
}: {
  /** What the row is called, e.g. "CS — Computer Science". Used in the dialogs. */
  name: string;
  editTitle: string;
  /** e.g. `/api/departments/3` */
  deletePath: string;
  /** The edit form; call `close` after a successful save. */
  children: (close: () => void) => ReactNode;
}) {
  const remove = useApiMutation(deletePath, { method: "DELETE", success: `${name} deleted.` });
  return (
    <div className="flex justify-end gap-1">
      <FormDialog label={`Edit ${name}`} title={editTitle} icon={<PencilIcon />} iconOnly variant="ghost" size="icon-sm">
        {children}
      </FormDialog>
      <ConfirmButton
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${name}`}
        title={`Delete ${name}?`}
        confirmLabel="Delete"
        description="This can't be undone. It is only allowed when nothing else uses this record."
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate(undefined)}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2Icon />
      </ConfirmButton>
    </div>
  );
}
