import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const deleteMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => ({
    delete: deleteMock
  })
}));

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    deleteMock.mockClear();
  });

  it("clears auth cookies", async () => {
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(deleteMock).toHaveBeenCalled();
  });
});
