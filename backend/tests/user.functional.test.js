const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const authRoutes = require('../routes/authRoutes');
const User = require('../models/User');
const { createTestJWT } = require('./helpers/jwtHelper');

let mongod;
let app;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(bodyParser.json());
  app.use('/api/auth', authRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  const collections = Object.keys(mongoose.connection.collections);
  for (const collName of collections) {
    await mongoose.connection.collections[collName].deleteMany({});
  }
});

// ─── 3.1 User Management (Auth) – Functional Tests ───────────────────────────
describe('User Management - Functional Tests', () => {

  // FT-01 · Register – Success
  test('FT-01: POST /api/auth/register creates a new user and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: '123456' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('email', 'alice@test.com');
  });

  // FT-02 · Register – Duplicate Email
  test('FT-02: POST /api/auth/register returns 400 for duplicate email', async () => {
    await User.create({ name: 'Alice', email: 'alice@test.com', password: '123456' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice Again', email: 'alice@test.com', password: 'abcdef' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'User already exists');
  });

  // FT-03 · Register – Missing Fields
  test('FT-03: POST /api/auth/register returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: '', password: '' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Please provide all fields');
  });

  // FT-04 · Login – Success
  test('FT-04: POST /api/auth/login returns 200 with token for valid credentials', async () => {
    await User.create({ name: 'Bob', email: 'bob@test.com', password: '123456' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@test.com', password: '123456' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('email', 'bob@test.com');
  });

  // FT-05 · Login – Wrong Password
  test('FT-05: POST /api/auth/login returns 401 for incorrect password', async () => {
    await User.create({ name: 'Bob', email: 'bob@test.com', password: '123456' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@test.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid password');
  });

  // FT-06 · Login – Email Not Found
  test('FT-06: POST /api/auth/login returns 401 for unregistered email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: '123456' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid email');
  });

  // FT-07 · Forgot Password – Email Not Found
  test('FT-07: POST /api/auth/forgot-password returns 404 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost@test.com' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'There is no user with that email');
  });

  // FT-08 · Reset Password – Invalid Token
  test('FT-08: PUT /api/auth/reset-password/:token returns 400 for invalid token', async () => {
    const res = await request(app)
      .put('/api/auth/reset-password/invalidtoken123')
      .send({ password: 'newpassword123' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid or expired token');
  });

  // FT-09 · Change Password – No Auth Token
  test('FT-09: POST /api/auth/change-password returns 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .send({ currentPassword: '123456', newPassword: 'newpass123' });

    expect(res.status).toBe(401);
  });

  // FT-10 · Change Password – Wrong Current Password
  test('FT-10: POST /api/auth/change-password returns 401 for wrong current password', async () => {
    const user = await User.create({ name: 'Carol', email: 'carol@test.com', password: '123456' });
    const token = createTestJWT(user._id);

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrongpass', newPassword: 'newpass123' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Current password is incorrect');
  });
});