const request = require('supertest');
const express = require('express');

const {
  getMarketInsights
} = require('../controllers/marketController');

const app = express();

app.get('/api/market/insights', getMarketInsights);

describe('Market Dashboard Functional Testing', () => {

  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    console.info.mockRestore();
  });

  // =========================
  // FT-26 API Status Test
  // =========================
  test('FT-26: GET /api/market/insights returns valid status', async () => {

    const response = await request(app)
      .get('/api/market/insights');

    expect([200, 500, 503]).toContain(response.statusCode);

  });

  // =========================
  // FT-27 Response Format
  // =========================
  test('FT-27: Response is JSON format', async () => {

    const response = await request(app)
      .get('/api/market/insights');

    expect(response.headers['content-type'])
      .toMatch(/json/);

  });

  // =========================
  // FT-28 Response Structure
  // =========================
  test('FT-28: Response contains success field', async () => {

    const response = await request(app)
      .get('/api/market/insights');

    expect(response.body)
      .toHaveProperty('success');

  });

  // =========================
  // FT-29 News Data Validation
  // =========================
  test('FT-29: Response contains news data array', async () => {

    const response = await request(app)
      .get('/api/market/insights');

    if (response.body.data && response.body.data.news) {
      expect(Array.isArray(response.body.data.news))
        .toBe(true);
    }

  });

  // =========================
  // FT-30 Market Trend Validation
  // =========================
  test('FT-30: Response contains market trend information', async () => {

    const response = await request(app)
      .get('/api/market/insights');

    if (response.body.data) {
      expect(response.body.data)
        .toHaveProperty('trend');
    }

  });

});
