const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const goalRoutes = require('../routes/goalRoutes');
const User = require('../models/User');
const Goal = require('../models/Goal');
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
  app.use('/api/goals', goalRoutes);
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

describe('Goals Functional Tests', () => {
  test('FT-16: Returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/goals');
    expect(res.status).toBe(401);
  });

  test('FT-17: Creates goal successfully', async () => {
    const user = await User.create({ name: 'Post User', email: 'post@test.com', password: '123456' });
    const token = createTestJWT(user._id);

    const goalData = { name: 'Emergency Fund', target: 8000, monthly: 300 };
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send(goalData);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name', 'Emergency Fund');
    expect(res.body).toHaveProperty('target', 8000);
  });

  test('FT-18: GET /api/goals returns array with created goal', async () => {
    const user = await User.create({ name: 'List User', email: 'list@test.com', password: '123456' });
    const token = createTestJWT(user._id);
    await Goal.create({ user: user._id, name: 'Vacation', target: 5000, savings: 1000, monthly: 200 });

    const res = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty('name', 'Vacation');
  });

  test('FT-19: Update goal successfully', async () => {
    const user = await User.create({ name: 'Upd User', email: 'upd@test.com', password: '123456' });
    const token = createTestJWT(user._id);
    const goal = await Goal.create({ user: user._id, name: 'Old Name', target: 2000 });

    const res = await request(app)
      .put(`/api/goals/${goal._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'New Name');
  });

  test('FT-20: Delete goal successfully', async () => {
    const user = await User.create({ name: 'Del User', email: 'del@test.com', password: '123456' });
    const token = createTestJWT(user._id);
    const goal = await Goal.create({ user: user._id, name: 'To Delete', target: 1000 });

    const res = await request(app)
      .delete(`/api/goals/${goal._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');

    const resGet = await request(app)
      .get(`/api/goals/${goal._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resGet.status).toBe(404);
  });
});
