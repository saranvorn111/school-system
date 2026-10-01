"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiQuery } from "@/hooks/use-api";
import type { ApiData } from "@/lib/api/client";
import type { getTerms } from "@/lib/services/academics";

export type Terms = ApiData<typeof getTerms>;

export function useTerms() {
  const query = useApiQuery<Terms>("/api/terms");
  const terms = query.data ?? [];
  const current = terms.find((t) => t.isCurrent) ?? terms[0];
  return { terms, current, isPending: query.isPending };
}

/** Picks a term; `value` undefined means "the current term". */
export function TermSelect({ value, onChange }: { value?: number; onChange: (termId: number) => void }) {
  const { terms, current } = useTerms();
  const selected = value ?? current?.id;
  if (!terms.length) return null;
  return (
    <Select value={selected ? String(selected) : undefined} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Choose a term" />
      </SelectTrigger>
      <SelectContent>
        {terms.map((t) => (
          <SelectItem key={t.id} value={String(t.id)}>
            {t.yearName} · {t.name}
            {t.isCurrent ? " (current)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
