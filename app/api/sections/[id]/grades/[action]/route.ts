import { notFound } from "@/lib/api/errors";
import { idParam, readBody, route } from "@/lib/api/handler";
import { approveGrades, publishGrades, rejectGrades, submitGrades } from "@/lib/services/grades";
import { gradeReviewSchema } from "@/lib/validation/sections";

/**
 * POST /api/sections/:id/grades/submit   (teacher)
 * POST /api/sections/:id/grades/approve  (reviewer)
 * POST /api/sections/:id/grades/reject   (reviewer, body: { note })
 * POST /api/sections/:id/grades/publish  (reviewer)
 */
export const POST = route(async ({ req, user, params }) => {
  const sectionId = idParam(params);
  switch (params.action) {
    case "submit":
      return submitGrades(user, sectionId);
    case "approve":
      return approveGrades(user, sectionId);
    case "reject":
      return rejectGrades(user, sectionId, (await readBody(req, gradeReviewSchema)).note);
    case "publish":
      return publishGrades(user, sectionId);
    default:
      throw notFound();
  }
});
