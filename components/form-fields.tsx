"use client";

import type { ComponentProps, ReactNode } from "react";
import { Controller, get, type FieldValues, type Path, type UseFormReturn } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/*
 * react-hook-form + shadcn Field wrappers. Errors come from two places and
 * show up in the same spot: the shared Zod schema (in the browser) and the
 * API's 422 fieldErrors (see useApiMutation's `form` option).
 */

type Base<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
};

function Wrapper<T extends FieldValues>({ form, name, label, description, className, children }: Base<T> & { children: ReactNode }) {
  const error = get(form.formState.errors, name) as { message?: string } | undefined;
  return (
    <Field data-invalid={!!error} className={className}>
      {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
      {children}
      {description && !error && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={[error]} />
    </Field>
  );
}

export function TextField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  className,
  ...input
}: Base<T> & Omit<ComponentProps<typeof Input>, "name" | "form">) {
  const invalid = !!get(form.formState.errors, name);
  return (
    <Wrapper form={form} name={name} label={label} description={description} className={className}>
      <Input id={name} aria-invalid={invalid} {...input} {...form.register(name)} />
    </Wrapper>
  );
}

export function TextareaField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  className,
  ...input
}: Base<T> & Omit<ComponentProps<typeof Textarea>, "name" | "form">) {
  const invalid = !!get(form.formState.errors, name);
  return (
    <Wrapper form={form} name={name} label={label} description={description} className={className}>
      <Textarea id={name} aria-invalid={invalid} {...input} {...form.register(name)} />
    </Wrapper>
  );
}

const NONE = "__none";

export type Option = { value: string | number; label: string };

/** shadcn Select bound to the form. `noneLabel` adds an empty choice for optional fields. */
export function SelectField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  className,
  options,
  placeholder = "Choose…",
  noneLabel,
  disabled,
}: Base<T> & { options: Option[]; placeholder?: string; noneLabel?: string; disabled?: boolean }) {
  return (
    <Wrapper form={form} name={name} label={label} description={description} className={className}>
      <Controller
        control={form.control}
        name={name}
        render={({ field, fieldState }) => (
          <Select
            value={field.value === "" || field.value == null ? (noneLabel ? NONE : "") : String(field.value)}
            onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
            disabled={disabled}
          >
            <SelectTrigger id={name} aria-invalid={fieldState.invalid} className="w-full" onBlur={field.onBlur}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {noneLabel && <SelectItem value={NONE}>{noneLabel}</SelectItem>}
              {options.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Wrapper>
  );
}
