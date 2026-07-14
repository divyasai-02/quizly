import { describe, expect, it } from "vitest";
import { createSessionToken, readSessionToken } from "./session";

describe("auth session tokens", () => {
  it("creates and reads a valid session token", async () => {
    const token = await createSessionToken({ userId: "student-arjun", roleKey: "student" });
    const payload = await readSessionToken(token);

    expect(payload?.userId).toBe("student-arjun");
    expect(payload?.roleKey).toBe("student");
  });

  it("rejects a tampered token", async () => {
    const token = await createSessionToken({ userId: "prof-john", roleKey: "professor" });
    expect(await readSessionToken(`${token}tampered`)).toBeNull();
  });
});
