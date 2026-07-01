import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, maskToken } from "./crypto";

describe("token encryption", () => {
  it("round-trips a token without storing plaintext", () => {
    const encrypted = encryptSecret("EAAB-example-token", "test-encryption-key");

    expect(encrypted).not.toContain("EAAB-example-token");
    expect(decryptSecret(encrypted, "test-encryption-key")).toBe("EAAB-example-token");
  });

  it("masks tokens for UI display", () => {
    expect(maskToken("EAAB1234567890abcd")).toBe("EAAB...abcd");
    expect(maskToken("short")).toBe("*****");
  });
});
