"use client";

import { PlusIcon } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * A "create" button that opens its form in a popup, so lists keep the whole page.
 * The form is given `close` and calls it after a successful save. It is mounted
 * only while open, so it always starts empty.
 */
export function FormDialog({
  label,
  title,
  description,
  children,
  icon = <PlusIcon />,
  ...button
}: {
  label: string;
  title: string;
  description?: ReactNode;
  children: (close: () => void) => ReactNode;
  icon?: ReactNode;
} & Omit<ComponentProps<typeof Button>, "children" | "title">) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button {...button}>
          {icon}
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {open && children(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  );
}

/** Cancel + submit row for forms inside a FormDialog. */
export function DialogActions({ onCancel, pending, submitLabel }: { onCancel: () => void; pending: boolean; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}
