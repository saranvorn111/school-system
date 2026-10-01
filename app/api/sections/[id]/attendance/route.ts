import { idParam, readBody, readQuery, route } from "@/lib/api/handler";
import { getAttendanceSheet, saveAttendance } from "@/lib/services/attendance";
import { attendanceQuery, attendanceSaveSchema } from "@/lib/validation/sections";

/** GET /api/sections/:id/attendance?date=YYYY-MM-DD — the sheet for one day (default today). */
export const GET = route(async ({ req, user, params }) =>
  getAttendanceSheet(user, idParam(params), readQuery(req, attendanceQuery).date),
);

/** PUT /api/sections/:id/attendance — { date, records: [{ studentId, status, note }] } */
export const PUT = route(async ({ req, user, params }) => saveAttendance(user, idParam(params), await readBody(req, attendanceSaveSchema)));
