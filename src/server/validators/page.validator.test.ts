import { describe, expect, it } from "vitest";
import { createFacebookPageSchema, updateFacebookPageSchema } from "./page.validator";

describe("page validation", () => {
  it("requires an access token when creating a Page", () => {
    const result = createFacebookPageSchema.safeParse({
      pageId: "test_page_001",
      name: "Test Page"
    });

    expect(result.success).toBe(false);
  });

  it("allows token invalid status on update", () => {
    const result = updateFacebookPageSchema.safeParse({
      status: "TOKEN_INVALID"
    });

    expect(result.success).toBe(true);
  });
});
