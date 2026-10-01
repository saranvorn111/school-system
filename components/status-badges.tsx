import { Badge } from "@/components/ui/badge";
import type { AttendanceStatus, GradeStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const tone = {
  gray: "bg-muted text-muted-foreground",
  green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  yellow: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  red: "bg-destructive/10 text-destructive",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
} as const;

export type Tone = keyof typeof tone;

export function ToneBadge({ tone: t, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <Badge variant="secondary" className={cn(tone[t], "capitalize", className)}>
      {children}
    </Badge>
  );
}

const gradeTone: Record<GradeStatus, Tone> = { draft: "gray", submitted: "yellow", approved: "blue", published: "green" };
export function GradeStatusBadge({ status }: { status: GradeStatus }) {
  return <ToneBadge tone={gradeTone[status]}>Grades: {status}</ToneBadge>;
}

const attendanceTone: Record<AttendanceStatus, Tone> = { present: "green", late: "yellow", absent: "red", excused: "gray" };
export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  return <ToneBadge tone={attendanceTone[status]}>{status}</ToneBadge>;
}

export function UserStatusBadge({ status, locked }: { status: string; locked?: boolean }) {
  return (
    <span className="inline-flex gap-1">
      <ToneBadge tone={status === "active" ? "green" : "red"}>{status}</ToneBadge>
      {locked && <ToneBadge tone="yellow">locked</ToneBadge>}
    </span>
  );
}
