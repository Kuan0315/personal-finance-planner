const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const app = require('../server');

const User = require('../models/User');
const { createTestJWT } = require('./helpers/jwtHelper');

let mongod;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

describe('Profile Management - Functional Tests', () => {

  afterEach(async () => {
    await User.deleteMany({});
  });

  // FT-11 · Unauthorized Access
  test('FT-11: GET /api/users/profile returns 401 when no token', async () => {
    const res = await request(app).get('/api/users/profile');
    expect(res.status).toBe(401);
  });

  // FT-12 · Invalid Token
  test('FT-12: GET /api/users/profile rejects invalid token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer invalidtoken');

    expect([401, 403]).toContain(res.status);
  });

  // FT-13 · Update Without Auth
  test('FT-13: PUT /api/users/profile without token returns 401', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .send({ name: 'Hack Attempt' });

    expect(res.status).toBe(401);
  });

  // FT-14 · Change Password Wrong Old Password
  test('FT-14: POST /api/auth/change-password rejects invalid current password', async () => {
    const user = await User.create({
      name: 'User',
      email: 'wrong@test.com',
      password: '123456'
    });

    const token = createTestJWT(user._id);

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'wrongpass',
        newPassword: 'newpass123'
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Current password is incorrect');

    const updatedUser = await User.findById(user._id);
    const isStillOldPassword = await bcrypt.compare('123456', updatedUser.password);

    expect(isStillOldPassword).toBe(true);
  });

  // FT-15 · Delete Account Without Auth
  test('FT-15: DELETE /api/users/profile returns 401 without auth', async () => {
    const res = await request(app)
      .delete('/api/users/profile');

    expect(res.status).toBe(401);
  });

});