const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const authRoutes = require('../routes/authRoutes');
const goalRoutes = require('../routes/goalRoutes');
const User = require('../models/User');
const Goal = require('../models/Goal');
const { createTestJWT } = require('./helpers/jwtHelper');

let mongod;
let app;
let token;
let userId;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-key';
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = express();
  app.use(bodyParser.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/goals', goalRoutes);
});

// Setup: Create a user and generate token for all integration tests
beforeEach(async () => {
  await User.deleteMany({});
  await Goal.deleteMany({});
  
  const user = await User.create({ name: 'Test User', email: 'test@test.com', password: 'password123' });
  userId = user._id;
  token = createTestJWT(userId);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Goal Module Integration Tests', () => {

  // IT-16: Create Goal
  test('IT-16: Should create goal and save to database', async () => {
    const res = await request(app).post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Car', target: 20000, monthly: 500 });
    
    expect(res.status).toBe(201);
    const goalInDb = await Goal.findOne({ name: 'Car' });
    expect(goalInDb).not.toBeNull();
    expect(goalInDb.user.toString()).toBe(userId.toString());
  });

  // IT-17: Get All Goals
  test('IT-17: Get All Goals (API + Database)', async () => {
    await Goal.create({ user: userId, name: 'Travel', target: 5000, monthly: 200 });
    const res = await request(app).get('/api/goals')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  // IT-18: Get Single Goal by ID
  test('IT-18: Get Single Goal by ID (API + Database)', async () => {
    const goal = await Goal.create({ user: userId, name: 'Retirement', target: 100000, monthly: 1000 });
    const res = await request(app).get(`/api/goals/${goal._id}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Retirement');
  });

  // IT-19: Update Goal
  test('IT-19: Update Goal (API + Database)', async () => {
    const goal = await Goal.create({ user: userId, name: 'Study', target: 1000, monthly: 100 });
    const res = await request(app).put(`/api/goals/${goal._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ target: 1500 });
    
    expect(res.status).toBe(200);
    const updated = await Goal.findById(goal._id);
    expect(updated.target).toBe(1500);
  });

  // IT-20: Delete Goal
  test('IT-20: Delete Goal (API + Database)', async () => {
    const goal = await Goal.create({ user: userId, name: 'DeleteMe', target: 100, monthly: 10 });
    const res = await request(app).delete(`/api/goals/${goal._id}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    const deleted = await Goal.findById(goal._id);
    expect(deleted).toBeNull();
  });
});