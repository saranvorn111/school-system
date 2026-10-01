/**
 * Seeds roles, permissions and the first admin. Safe to run many times.
 *
 *   bun run db:seed          → roles + permissions + super admin
 *   bun run db:seed --demo   → also adds sample departments, courses, teachers, students
 */
import { and, eq, notInArray } from "drizzle-orm";
import { db } from "./index";
import * as s from "./schema";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLES,
  type RoleCode,
} from "../lib/auth/permissions";
import { hashPassword } from "../lib/auth/password";

// Demo accounts only exist when seeding with --demo. Change these before any real use.
const DEMO_TEACHER_PASSWORD = "Teacher@123";
const DEMO_STUDENT_PASSWORD = "Student@123";

async function seedRolesAndPermissions() {
  for (const [code, description] of Object.entries(PERMISSIONS)) {
    await db
      .insert(s.permissions)
      .values({ code, description })
      .onDuplicateKeyUpdate({ set: { description } });
  }
  for (const [code, name] of Object.entries(ROLES)) {
    await db.insert(s.roles).values({ code, name }).onDuplicateKeyUpdate({ set: { name } });
  }

  const allPerms = await db.select().from(s.permissions);
  const permId = new Map(allPerms.map((p) => [p.code, p.id]));
  const allRoles = await db.select().from(s.roles);

  // Make role_permissions match ROLE_PERMISSIONS exactly (adds, updates and removes).
  for (const role of allRoles) {
    const matrix = ROLE_PERMISSIONS[role.code as RoleCode] ?? {};
    const ids = Object.keys(matrix).map((p) => permId.get(p)!);

    if (ids.length) {
      await db
        .delete(s.rolePermissions)
        .where(and(eq(s.rolePermissions.roleId, role.id), notInArray(s.rolePermissions.permissionId, ids)));
    } else {
      await db.delete(s.rolePermissions).where(eq(s.rolePermissions.roleId, role.id));
    }
    for (const [perm, scope] of Object.entries(matrix)) {
      await db
        .insert(s.rolePermissions)
        .values({ roleId: role.id, permissionId: permId.get(perm)!, scope })
        .onDuplicateKeyUpdate({ set: { scope } });
    }
  }
  console.log(`✓ ${allRoles.length} roles, ${allPerms.length} permissions`);
  return new Map(allRoles.map((r) => [r.code as RoleCode, r.id]));
}

async function ensureUser(
  roleIds: Map<RoleCode, number>,
  role: RoleCode,
  data: { email: string; username: string; fullName: string; password: string },
) {
  const [existing] = await db.select().from(s.users).where(eq(s.users.email, data.email));
  let userId = existing?.id;
  if (!userId) {
    [{ id: userId }] = await db
      .insert(s.users)
      .values({
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        passwordHash: await hashPassword(data.password),
      })
      .$returningId();
  }
  await db
    .insert(s.userRoles)
    .values({ userId, roleId: roleIds.get(role)! })
    .onDuplicateKeyUpdate({ set: { userId } });
  return { userId, created: !existing };
}

async function seedAdmin(roleIds: Map<RoleCode, number>) {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env");
  const { created } = await ensureUser(roleIds, "ADMIN", {
    email,
    username: "admin",
    fullName: "Super Admin",
    password,
  });
  console.log(created ? `✓ admin created: ${email}` : `✓ admin exists: ${email}`);
}

async function seedDemo(roleIds: Map<RoleCode, number>) {
  const [anyDept] = await db.select().from(s.departments).limit(1);
  if (anyDept) {
    console.log("• demo data already present, skipped");
    return;
  }

  const [{ id: csId }] = await db
    .insert(s.departments)
    .values({ code: "CS", name: "Computer Science" })
    .$returningId();
  const [{ id: mathId }] = await db
    .insert(s.departments)
    .values({ code: "MATH", name: "Mathematics" })
    .$returningId();
  const [{ id: programId }] = await db
    .insert(s.programs)
    .values({ code: "BSCS", name: "Bachelor of Computer Science", departmentId: csId })
    .$returningId();

  const [{ id: yearId }] = await db
    .insert(s.academicYears)
    .values({ name: "2026-2027", startDate: "2026-09-01", endDate: "2027-08-31" })
    .$returningId();
  const [{ id: termId }] = await db
    .insert(s.terms)
    .values({
      academicYearId: yearId,
      name: "Semester 1",
      startDate: "2026-09-01",
      endDate: "2027-01-31",
      isCurrent: true,
    })
    .$returningId();

  const courseRows = [
    { code: "CS101", title: "Introduction to Programming", credits: 3, departmentId: csId },
    { code: "CS102", title: "Web Development", credits: 3, departmentId: csId },
    { code: "MATH101", title: "Calculus I", credits: 4, departmentId: mathId },
  ];
  const courseIds: number[] = [];
  for (const c of courseRows) {
    const [{ id }] = await db.insert(s.courses).values(c).$returningId();
    courseIds.push(id);
  }

  const teacherData = [
    { employeeId: "T0001", fullName: "Sok Dara", departmentId: csId },
    { employeeId: "T0002", fullName: "Chan Sophea", departmentId: mathId },
  ];
  const teacherIds: number[] = [];
  for (const t of teacherData) {
    const { userId } = await ensureUser(roleIds, "TEACHER", {
      email: `${t.employeeId.toLowerCase()}@school.local`,
      username: t.employeeId,
      fullName: t.fullName,
      password: DEMO_TEACHER_PASSWORD,
    });
    const [{ id }] = await db
      .insert(s.teachers)
      .values({ userId, employeeId: t.employeeId, departmentId: t.departmentId, title: "Lecturer" })
      .$returningId();
    teacherIds.push(id);
  }

  const studentNames = ["Vannak Chea", "Srey Leak", "Pisey Kim", "Rithy Heng", "Mealea Ouk"];
  const studentIds: number[] = [];
  for (const [i, fullName] of studentNames.entries()) {
    const code = `S2026${String(i + 1).padStart(3, "0")}`;
    const { userId } = await ensureUser(roleIds, "STUDENT", {
      email: `${code.toLowerCase()}@school.local`,
      username: code,
      fullName,
      password: DEMO_STUDENT_PASSWORD,
    });
    const [{ id }] = await db
      .insert(s.students)
      .values({ userId, studentCode: code, programId, admissionYear: 2026 })
      .$returningId();
    studentIds.push(id);
  }

  const sectionRows = [
    { courseId: courseIds[0], teacherId: teacherIds[0], dayOfWeek: 1, startTime: "08:00", endTime: "09:30", room: "A101" },
    { courseId: courseIds[1], teacherId: teacherIds[0], dayOfWeek: 3, startTime: "10:00", endTime: "11:30", room: "A102" },
    { courseId: courseIds[2], teacherId: teacherIds[1], dayOfWeek: 2, startTime: "13:00", endTime: "15:00", room: "B201" },
  ];
  for (const sec of sectionRows) {
    const [{ id: sectionId }] = await db
      .insert(s.sections)
      .values({ ...sec, termId, sectionCode: "A", capacity: 40 })
      .$returningId();
    await db.insert(s.enrollments).values(studentIds.map((studentId) => ({ sectionId, studentId })));
  }

  console.log(
    `✓ demo data: 2 departments, 3 courses, ${teacherIds.length} teachers, ${studentIds.length} students, 3 sections`,
  );
  console.log("  demo logins: usernames T0001/T0002 and S2026001…S2026005 (passwords are in db/seed.ts)");
}

async function main() {
  const roleIds = await seedRolesAndPermissions();
  await seedAdmin(roleIds);
  if (process.argv.includes("--demo")) await seedDemo(roleIds);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
