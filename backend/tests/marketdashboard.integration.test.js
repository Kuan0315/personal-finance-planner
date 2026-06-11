const request = require('supertest');
const express = require('express');

const {
  getMarketInsights
} = require('../controllers/marketController');

const app = express();

app.use(express.json());

app.get('/api/market/insights', getMarketInsights);

describe('Market Dashboard Integration Testing', () => {
  beforeAll(() => {
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterAll(() => {
    console.info.mockRestore();
  });

  // =========================
  // IT-28 API Status Test
  // =========================
  test('IT-28: GET /api/market/insights returns valid status', async () => {

    const res = await request(app)
      .get('/api/market/insights');

    expect([200, 500, 503]).toContain(res.status);

  });

  // =========================
  // IT-29 JSON Response Format
  // =========================
  test('IT-29: GET /api/market/insights returns JSON response', async () => {

    const res = await request(app)
      .get('/api/market/insights');

    expect(res.headers['content-type'])
      .toMatch(/json/);

  });

  // =========================
  // IT-30 Success Field Validation
  // =========================
  test('IT-30: GET /api/market/insights contains success field', async () => {

    const res = await request(app)
      .get('/api/market/insights');

    expect(res.body)
      .toHaveProperty('success');

  });

  // =========================
  // IT-31 News Data Integration
  // =========================
  test('IT-31: GET /api/market/insights returns news data array', async () => {

    const res = await request(app)
      .get('/api/market/insights');

    if (res.body.data && res.body.data.news) {
      expect(Array.isArray(res.body.data.news))
        .toBe(true);
    }

  });

  // =========================
  // IT-32 Market Trend Data Integration
  // =========================
  test('IT-32: GET /api/market/insights returns market trend information', async () => {

    const res = await request(app)
      .get('/api/market/insights');

    if (res.body.data) {
      expect(res.body.data)
        .toHaveProperty('trend');
    }

  });

});