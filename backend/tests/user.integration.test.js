const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const userRoutes = require('../routes/userRoutes');
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
  app.use('/api/users', userRoutes);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  const collections = Object.keys(mongoose.connection.collections);
  for (const collName of collections) {
    await mongoose.connection.collections[collName].deleteMany({});
  }
}, 10000); 

// ─── 3.2 User Profile Management – Integration Tests ─────────────────────────
describe('User Profile Management - Integration Tests', () => {

  // IT-01 · Get Profile – Success
  test('IT-01: GET /api/users/profile returns 200 with user data for authenticated user', async () => {
    const user = await User.create({
      name: 'Alice',
      email: 'alice@test.com',
      password: '123456',
      phone: '0123456789',
      occupation: 'Engineer',
    });
    const token = createTestJWT(user._id);

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email', 'alice@test.com');
    expect(res.body).toHaveProperty('name', 'Alice');
    expect(res.body).toHaveProperty('phone', '0123456789');
    expect(res.body).toHaveProperty('occupation', 'Engineer');
    expect(res.body).not.toHaveProperty('password');
  });

  // IT-02 · Get Profile – No Auth Token
  test('IT-02: GET /api/users/profile returns 401 when no token is provided', async () => {
    const res = await request(app)
      .get('/api/users/profile');

    expect(res.status).toBe(401);
  });

  // IT-03 · Get Profile – Invalid Token
  test('IT-03: GET /api/users/profile returns 401 for an invalid JWT token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer invalidtoken123');

    expect(res.status).toBe(401);
  });

  // IT-04 · Update Profile – Success
  test('IT-04: PUT /api/users/profile returns 200 and updates user fields', async () => {
    const user = await User.create({
      name: 'Bob',
      email: 'bob@test.com',
      password: '123456',
    });
    const token = createTestJWT(user._id);

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Bob Updated',
        phone: '0987654321',
        city: 'Kuala Lumpur',
        country: 'Malaysia',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Bob Updated');
    expect(res.body).toHaveProperty('phone', '0987654321');
    expect(res.body).toHaveProperty('city', 'Kuala Lumpur');
    expect(res.body).toHaveProperty('country', 'Malaysia');
  });

  // IT-05 · Update Profile – Persisted to Database
  test('IT-05: PUT /api/users/profile persists changes to the database', async () => {
    const user = await User.create({
      name: 'Carol',
      email: 'carol@test.com',
      password: '123456',
    });
    const token = createTestJWT(user._id);

    await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Carol Updated', occupation: 'Designer' });

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.name).toBe('Carol Updated');
    expect(updatedUser.occupation).toBe('Designer');
  });

  // IT-06 · Update Profile – No Auth Token
  test('IT-06: PUT /api/users/profile returns 401 when no token is provided', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .send({ name: 'Ghost' });

    expect(res.status).toBe(401);
  });

  // IT-07 · Update Profile – Partial Update Preserves Existing Fields
  test('IT-07: PUT /api/users/profile partial update does not overwrite unspecified fields', async () => {
    const user = await User.create({
      name: 'Dave',
      email: 'dave@test.com',
      password: '123456',
      phone: '0111111111',
      city: 'Penang',
    });
    const token = createTestJWT(user._id);

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dave Updated' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Dave Updated');
    expect(res.body).toHaveProperty('phone', '0111111111');
    expect(res.body).toHaveProperty('city', 'Penang');
  });

  // IT-08 · Delete Profile – Success
  test('IT-08: DELETE /api/users/profile returns 200 and removes the user account', async () => {
    const user = await User.create({
      name: 'Eve',
      email: 'eve@test.com',
      password: '123456',
    });
    const token = createTestJWT(user._id);

    const res = await request(app)
      .delete('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'User account deleted successfully');
  });

  // IT-09 · Delete Profile – Removed from Database
  test('IT-09: DELETE /api/users/profile permanently removes user from the database', async () => {
    const user = await User.create({
      name: 'Frank',
      email: 'frank@test.com',
      password: '123456',
    });
    const token = createTestJWT(user._id);

    await request(app)
      .delete('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });

  // IT-10 · Delete Profile – No Auth Token
  test('IT-10: DELETE /api/users/profile returns 401 when no token is provided', async () => {
    const res = await request(app)
      .delete('/api/users/profile');

    expect(res.status).toBe(401);
  });

  // IT-11 · Get Profile – All Fields Returned
  test('IT-11: GET /api/users/profile returns all profile fields when fully populated', async () => {
    const user = await User.create({
      name: 'Grace',
      email: 'grace@test.com',
      password: '123456',
      phone: '0199999999',
      occupation: 'Doctor',
      dob: new Date('1990-05-15'),
      address: '123 Main St',
      city: 'Johor Bahru',
      country: 'Malaysia',
    });
    const token = createTestJWT(user._id);

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'Grace',
      email: 'grace@test.com',
      phone: '0199999999',
      occupation: 'Doctor',
      address: '123 Main St',
      city: 'Johor Bahru',
      country: 'Malaysia',
    });
    expect(res.body).toHaveProperty('dob');
    expect(res.body).not.toHaveProperty('password');
  });

  // IT-12 · Update Profile – Email Update
  test('IT-12: PUT /api/users/profile allows updating the email address', async () => {
    const user = await User.create({
      name: 'Hank',
      email: 'hank@test.com',
      password: '123456',
    });
    const token = createTestJWT(user._id);

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'hank.new@test.com' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email', 'hank.new@test.com');
  });
});