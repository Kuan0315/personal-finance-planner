const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const roiRoutes = require('../routes/roiRoutes');
const User = require('../models/User');
const RoiCalculation = require('../models/RoiCalculation');

let mongod;
let app;

beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

    // Support running integration tests against a real MongoDB instance
    // Set USE_REAL_DB=true and MONGO_URI to use a real DB. Otherwise use in-memory MongoDB.
    if (process.env.USE_REAL_DB === 'true') {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI must be set when USE_REAL_DB=true');
        await mongoose.connect(uri);
    } else {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
    }

    // build express app with real routes + middleware
    app = express();
    app.use(bodyParser.json());
    // mount routes under /roi
    app.use('/roi', roiRoutes);
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
});

afterEach(async () => {
    // clear db between tests
    const collections = Object.keys(mongoose.connection.collections);
    for (const collName of collections) {
        await mongoose.connection.collections[collName].deleteMany({});
    }
});

describe('ROI Integration tests (real DB)', () => {
    test('INT-01 create user, save roi, get history', async () => {
        // create a user
        const user = await User.create({ name: 'Test', email: 't@test.com', password: 'password' });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const payload = { mode: 'simple', principal: 1000, monthlyContribution: 0, annualInterestRate: 5, durationInYears: 1, invested: 1000, futureValue: 1050, profit: 50, gainPercentage: 5, timeLineData: {} };

        const resSave = await request(app)
            .post('/roi/save')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(resSave.status).toBe(201);
        expect(resSave.body).toHaveProperty('_id');

        const resHistory = await request(app)
            .get(`/roi/history/${user._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(resHistory.status).toBe(200);
        expect(Array.isArray(resHistory.body)).toBe(true);
        expect(resHistory.body.length).toBe(1);
    });

    test('INT-02 delete roi record as owner', async () => {
        const user = await User.create({ name: 'Owner', email: 'o@test.com', password: 'password' });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const roi = await RoiCalculation.create({ userId: user._id, mode: 'simple', initialInvestment: 500, monthlyContribution: 0, annualInterestRate: 2, durationInYears: 1, invested: 500, futureValue: 510, profit: 10, gainPercentage: 2, timeLineData: {} });

        const res = await request(app)
            .delete(`/roi/delete/${roi._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
    });
});
