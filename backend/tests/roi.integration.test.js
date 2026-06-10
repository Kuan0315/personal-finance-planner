const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const roiRoutes = require('../routes/roiRoutes');
const User = require('../models/User');
const RoiCalculation = require('../models/RoiCalculation');
const { createTestJWT } = require('./helpers/jwtHelper');

let mongod;
let app;

beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

    if (process.env.USE_REAL_DB === 'true') {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI must be set when USE_REAL_DB=true');
        await mongoose.connect(uri);
    } else {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
    }

    app = express();
    app.use(express.json());
    app.use('/api/roi', roiRoutes);
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

describe('ROI Integration tests (real DB)', () => {
    test('INT-01: save roi -> returns 201 and roi created', async () => {
        const user = await User.create({ name: 'Int ROI', email: 'roi1@test.com', password: 'pass' });
        const token = createTestJWT(user._id);

        const res = await request(app)
            .post('/api/roi/save')
            .set('Authorization', `Bearer ${token}`)
            .send({
                mode: 'simple',
                principal: 1000,
                monthlyContribution: 0,
                annualInterestRate: 5,
                durationInYears: 1,
                invested: 1000,
                futureValue: 1050,
                profit: 50,
                gainPercentage: 5,
                timeLineData: {},
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body).toHaveProperty('mode', 'simple');
    });

    test('INT-02: get roi history -> returns 200 and correct data', async () => {
        const user = await User.create({ name: 'Int History', email: 'roi2@test.com', password: 'pass' });
        const token = createTestJWT(user._id);

        await RoiCalculation.create({
            userId: user._id,
            mode: 'simple',
            initialInvestment: 1000,
            monthlyContribution: 0,
            annualInterestRate: 5,
            durationInYears: 1,
            invested: 1000,
            futureValue: 1050,
            profit: 50,
            gainPercentage: 5,
            timeLineData: {},
        });

        const res = await request(app)
            .get(`/api/roi/history/${user._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toHaveProperty('mode', 'simple');
    });

    test('INT-03: delete roi -> returns 200 and record removed', async () => {
        const user = await User.create({ name: 'Int Delete', email: 'roi3@test.com', password: 'pass' });
        const token = createTestJWT(user._id);

        const roi = await RoiCalculation.create({
            userId: user._id,
            mode: 'simple',
            initialInvestment: 500,
            monthlyContribution: 0,
            annualInterestRate: 3,
            durationInYears: 1,
            invested: 500,
            futureValue: 515,
            profit: 15,
            gainPercentage: 3,
            timeLineData: {},
        });

        const res = await request(app)
            .delete(`/api/roi/delete/${roi._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');

        const check = await RoiCalculation.findById(roi._id);
        expect(check).toBeNull();
    });

    test('INT-04: get roi history for another user -> returns 401', async () => {
        const userA = await User.create({ name: 'User A', email: 'roi4a@test.com', password: 'pass' });
        const userB = await User.create({ name: 'User B', email: 'roi4b@test.com', password: 'pass' });
        const token = createTestJWT(userA._id);

        const res = await request(app)
            .get(`/api/roi/history/${userB._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'Unauthorized');
    });

    test('INT-05: bulk delete roi -> returns 200 and deletedCount', async () => {
        const user = await User.create({ name: 'Int Bulk', email: 'roi5@test.com', password: 'pass' });
        const token = createTestJWT(user._id);

        const roi1 = await RoiCalculation.create({
            userId: user._id,
            mode: 'simple',
            initialInvestment: 1000,
            monthlyContribution: 0,
            annualInterestRate: 5,
            durationInYears: 1,
            invested: 1000,
            futureValue: 1050,
            profit: 50,
            gainPercentage: 5,
            timeLineData: {},
        });

        const roi2 = await RoiCalculation.create({
            userId: user._id,
            mode: 'compound',
            initialInvestment: 2000,
            monthlyContribution: 100,
            annualInterestRate: 7,
            durationInYears: 2,
            invested: 4400,
            futureValue: 5000,
            profit: 600,
            gainPercentage: 13.6,
            timeLineData: {},
        });

        const res = await request(app)
            .delete('/api/roi/history')
            .set('Authorization', `Bearer ${token}`)
            .send({ ids: [roi1._id.toString(), roi2._id.toString()] });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('deletedCount', 2);
    });
});
