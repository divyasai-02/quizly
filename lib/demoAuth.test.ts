import { describe, expect, it } from "vitest";
import { createDemoAuthToken, resolveDemoAuthToken } from "./demoAuth";

describe("demo auth tokens", () => {
  it("creates and resolves a professor session token", () => {
    const token = createDemoAuthToken({ id: "prof-john", roleKey: "professor" });
    expect(resolveDemoAuthToken(token)?.id).toBe("prof-john");
  });

  it("rejects a tampered role", () => {
    const token = createDemoAuthToken({ id: "student-arjun", roleKey: "student" });
    expect(resolveDemoAuthToken(token.replace(".student.", ".admin."))).toBeNull();
  });

  it("rejects an invalid user and signature", () => {
    expect(resolveDemoAuthToken("unknown.student.invalid")).toBeNull();
  });
});
