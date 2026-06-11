const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");

const app = require("../server");
const User = require("../models/User");

let mongoServer;

/**
 * Generate JWT token for testing
 */
const createTestJWT = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "testsecret",
    { expiresIn: "1h" }
  );
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("4.2 Profile Management Integration Testing", () => {

  /**
   * IT-13
   */
  test("IT-13: Get profile successfully (API + Database)", async () => {

    const user = await User.create({
      name: "Alice",
      email: "alice@test.com",
      password: "123456",
      phone: "0123456789",
    });

    const token = createTestJWT(user._id);

    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Alice");
    expect(res.body.email).toBe("alice@test.com");
    expect(res.body.password).toBeUndefined();
  });

  /**
   * IT-14
   */
  test("IT-14: Update profile (API + Database)", async () => {

    const user = await User.create({
      name: "Alice",
      email: "alice@test.com",
      password: "123456",
    });

    const token = createTestJWT(user._id);

    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Alice Updated",
        city: "Kuala Lumpur",
      });

    expect(res.status).toBe(200);

    const updatedUser = await User.findById(user._id);

    expect(updatedUser.name).toBe("Alice Updated");
    expect(updatedUser.city).toBe("Kuala Lumpur");
  });

  /**
   * IT-15
   */
  test("IT-15: Retrieve updated profile", async () => {

    const user = await User.create({
      name: "Updated User",
      email: "update@test.com",
      password: "123456",
      city: "Johor Bahru",
    });

    const token = createTestJWT(user._id);

    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated User");
    expect(res.body.city).toBe("Johor Bahru");
  });

  /**
   * IT-16
   */
  test("IT-16: Delete profile (API + Database)", async () => {

    const user = await User.create({
      name: "Delete User",
      email: "delete@test.com",
      password: "123456",
    });

    const token = createTestJWT(user._id);

    const res = await request(app)
      .delete("/api/users/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  /**
   * IT-17
   */
  test("IT-17: Deleted profile is removed from database", async () => {

    const user = await User.create({
      name: "Delete User",
      email: "delete@test.com",
      password: "123456",
    });

    const token = createTestJWT(user._id);

    await request(app)
      .delete("/api/users/profile")
      .set("Authorization", `Bearer ${token}`);

    const deletedUser = await User.findById(user._id);

    expect(deletedUser).toBeNull();
  });

});