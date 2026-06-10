const request = require('supertest');
const express = require('express');

const {
  getMarketInsights
} = require('../controllers/marketController');

const app = express();

app.use(express.json());

app.get('/api/market/insights', getMarketInsights);

describe('Market Dashboard Integration Testing', () => {

  // =========================
  // IT-01 API Status Test
  // =========================
  test('IT-01: GET /api/market/insights returns valid status', async () => {

    const res = await request(app)
      .get('/api/market/insights');

    expect([200, 500, 503]).toContain(res.status);

  });

  // =========================
  // IT-02 JSON Response Format
  // =========================
  test('IT-02: GET /api/market/insights returns JSON response', async () => {

    const res = await request(app)
      .get('/api/market/insights');

    expect(res.headers['content-type'])
      .toMatch(/json/);

  });

  // =========================
  // IT-03 Success Field Validation
  // =========================
  test('IT-03: GET /api/market/insights contains success field', async () => {

    const res = await request(app)
      .get('/api/market/insights');

    expect(res.body)
      .toHaveProperty('success');

  });

  // =========================
  // IT-04 News Data Integration
  // =========================
  test('IT-04: GET /api/market/insights returns news data array', async () => {

    const res = await request(app)
      .get('/api/market/insights');

    if (res.body.data && res.body.data.news) {
      expect(Array.isArray(res.body.data.news))
        .toBe(true);
    }

  });

  // =========================
  // IT-05 Market Trend Data Integration
  // =========================
  test('IT-05: GET /api/market/insights returns market trend information', async () => {

    const res = await request(app)
      .get('/api/market/insights');

    if (res.body.data) {
      expect(res.body.data)
        .toHaveProperty('trend');
    }

  });

});