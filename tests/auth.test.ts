import request from "supertest";
import app from "../src/app";

describe("Auth API", () => {
  it("should fail login with incorrect credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "nonexistent@example.com",
        password: "wrongpassword"
      });
    
    // Based on our ApiResponse logic, this should return a non-success status
    expect(res.statusCode).not.toEqual(200);
    expect(res.body).toHaveProperty("success", false);
  });

  it("should fail to access protected routes without token", async () => {
    const res = await request(app).get("/api/v1/friends/list");
    expect(res.statusCode).toEqual(401);
  });
});
