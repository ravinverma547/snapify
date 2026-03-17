import request from "supertest";
import app from "../src/app";

describe("Health Check API", () => {
  it("should return 200 and status ok", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("uptime");
  });

  it("should return the root message", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain("Snapify Backend is Live!");
  });
});
