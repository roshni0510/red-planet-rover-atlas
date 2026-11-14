import { describe, expect, it } from "vitest";
import { api, endpointStatus, ENDPOINTS, REQUEST_FIELDS } from "@/services/api";

// Contract rule: the frontend must not call endpoints or send request formats
// that have not been agreed with the backend team.
describe("API contract guard", () => {
  it("only the agreed assistant endpoint has a path", () => {
    const defined = Object.entries(ENDPOINTS).filter(([, v]) => v).map(([k]) => k);
    expect(defined).toEqual(["assistant"]);
    expect(ENDPOINTS.assistant).toBe("/api/assistant");
  });

  it("refuses to call an endpoint that is not agreed yet", async () => {
    expect(endpointStatus("mission")).toBe("endpoint_pending");
    await expect(api.getMission()).rejects.toMatchObject({ kind: "endpoint_pending" });
  });

  it("refuses to calculate a route while the request format is not agreed", async () => {
    expect(Object.values(REQUEST_FIELDS.route).every((v) => v === null)).toBe(true);
    await expect(api.calculateRoute({ start: "a", destination: "b" })).rejects.toBeTruthy();
  });

  it("refuses to send an assistant question while its request field is not agreed", async () => {
    await expect(api.askAssistant("hello")).rejects.toMatchObject({ kind: "request_format_pending" });
  });
});
