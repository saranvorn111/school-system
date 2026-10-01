import { describe, expect, test } from "bun:test";
import { computeGpa, scoreToGrade } from "@/lib/grading";
import { isValidRange, slotsOverlap } from "@/lib/schedule";
import { ROLE_PERMISSIONS, widestScope } from "@/lib/auth/permissions";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("grading", () => {
  test("maps scores to letters at the boundaries", () => {
    expect(scoreToGrade(100).letter).toBe("A");
    expect(scoreToGrade(85).letter).toBe("A");
    expect(scoreToGrade(84.99).letter).toBe("B+");
    expect(scoreToGrade(50).letter).toBe("C");
    expect(scoreToGrade(39.5).letter).toBe("F");
    expect(scoreToGrade(0).point).toBe(0);
  });

  test("rejects scores outside 0–100", () => {
    expect(() => scoreToGrade(101)).toThrow();
    expect(() => scoreToGrade(-1)).toThrow();
    expect(() => scoreToGrade(NaN)).toThrow();
  });

  test("GPA is weighted by credits", () => {
    expect(computeGpa([])).toBeNull();
    expect(computeGpa([{ credits: 3, gradePoint: 4 }, { credits: 1, gradePoint: 2 }])).toBe(3.5);
  });
});

describe("schedule", () => {
  const mon9 = { dayOfWeek: 1, startTime: "09:00", endTime: "10:30" };

  test("detects overlapping slots on the same day", () => {
    expect(slotsOverlap(mon9, { dayOfWeek: 1, startTime: "10:00", endTime: "11:00" })).toBe(true);
    expect(slotsOverlap(mon9, { dayOfWeek: 1, startTime: "08:00", endTime: "12:00" })).toBe(true);
  });

  test("back-to-back or other-day slots don't clash", () => {
    expect(slotsOverlap(mon9, { dayOfWeek: 1, startTime: "10:30", endTime: "12:00" })).toBe(false);
    expect(slotsOverlap(mon9, { dayOfWeek: 2, startTime: "09:00", endTime: "10:30" })).toBe(false);
  });

  test("validates time ranges", () => {
    expect(isValidRange("08:00", "09:30")).toBe(true);
    expect(isValidRange("09:30", "08:00")).toBe(false);
    expect(isValidRange("24:00", "25:00")).toBe(false);
    expect(isValidRange("8:00", "09:00")).toBe(false);
  });
});

describe("permission matrix", () => {
  test("teachers and students cannot manage users or approve grades", () => {
    for (const role of ["TEACHER", "STUDENT"] as const) {
      expect(ROLE_PERMISSIONS[role]["user:create"]).toBeUndefined();
      expect(ROLE_PERMISSIONS[role]["grade:approve"]).toBeUndefined();
      expect(ROLE_PERMISSIONS[role]["grade:publish"]).toBeUndefined();
    }
  });

  test("teachers are limited to assigned classes, students to their own records", () => {
    expect(ROLE_PERMISSIONS.TEACHER["grade:enter"]).toBe("assigned");
    expect(ROLE_PERMISSIONS.STUDENT["grade:read"]).toBe("own");
    expect(ROLE_PERMISSIONS.STUDENT["grade:enter"]).toBeUndefined();
    expect(ROLE_PERMISSIONS.STUDENT["attendance:mark"]).toBeUndefined();
  });

  test("the widest scope wins when a user has several roles", () => {
    expect(widestScope("own", "global")).toBe("global");
    expect(widestScope("global", "assigned")).toBe("global");
    expect(widestScope(undefined, "own")).toBe("own");
  });
});

describe("password hashing", () => {
  test("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("Secret123");
    expect(hash).not.toContain("Secret123");
    expect(await verifyPassword("Secret123", hash)).toBe(true);
    expect(await verifyPassword("secret123", hash)).toBe(false);
  });
});
