import express from 'express';
import request from 'supertest';
import dotenv from 'dotenv';
import operationsRoutes from './routes/operations.js';

dotenv.config();

const OPTIONAL_KEYS = ['WEATHER_API_KEY', 'NEWS_API_KEY', 'EVENTS_API_KEY'];

function assertField(value, fieldName) {
    if (value === undefined || value === null) {
        throw new Error(`Missing required field: ${fieldName}`);
    }
}

async function runSignalsTest() {
    const app = express();
    app.use(express.json());
    app.use('/api/operations', operationsRoutes);

    const endpoint = '/api/operations/signals';

    const response = await request(app)
        .get(endpoint)
        .query({
            hospitalName: 'Government Hospital Srivilliputhur',
            district: 'Srivilliputhur',
            lat: 9.512,
            lng: 77.634,
        })
        .expect(200);

    const payload = response.body;

    assertField(payload.hospitalName, 'hospitalName');
    assertField(payload.district, 'district');
    assertField(payload.fetchedAt, 'fetchedAt');

    assertField(payload.geo, 'geo');
    assertField(payload.geo.lat, 'geo.lat');
    assertField(payload.geo.lng, 'geo.lng');

    assertField(payload.istTime, 'istTime');
    assertField(payload.istTime.timeLabel, 'istTime.timeLabel');

    assertField(payload.weather, 'weather');
    assertField(payload.weather.temperatureC, 'weather.temperatureC');
    assertField(payload.weather.humidity, 'weather.humidity');

    assertField(payload.airQuality, 'airQuality');
    assertField(payload.airQuality.usAqi, 'airQuality.usAqi');

    assertField(payload.news, 'news');
    if (!Array.isArray(payload.news.headlines) || payload.news.headlines.length === 0) {
        throw new Error('news.headlines should contain at least one item');
    }

    assertField(payload.events, 'events');
    if (!Array.isArray(payload.events.events) || payload.events.events.length === 0) {
        throw new Error('events.events should contain at least one item');
    }

    assertField(payload.disease, 'disease');
    assertField(payload.disease.summary, 'disease.summary');

    assertField(payload.diseaseTrend, 'diseaseTrend');
    if (!Array.isArray(payload.diseaseTrend.series) || payload.diseaseTrend.series.length === 0) {
        throw new Error('diseaseTrend.series should contain at least one item');
    }
    assertField(payload.diseaseTrend.series[0].date, 'diseaseTrend.series[0].date');
    assertField(payload.diseaseTrend.series[0].dailyCases, 'diseaseTrend.series[0].dailyCases');
    assertField(payload.diseaseTrend.predictedNext24h, 'diseaseTrend.predictedNext24h');
    assertField(payload.diseaseTrend.pressureContributionPct, 'diseaseTrend.pressureContributionPct');

    assertField(payload.riskScore, 'riskScore');
    if (typeof payload.riskScore !== 'number' || payload.riskScore < 0 || payload.riskScore > 100) {
        throw new Error('riskScore should be a number between 0 and 100');
    }

    assertField(payload.recommendation, 'recommendation');

    console.log('✅ Operations signals endpoint validation passed');
    console.log(`   District: ${payload.district}`);
    console.log(`   Geo source: ${payload.geo.source}`);
    console.log(`   IST source: ${payload.istTime.source}`);
    console.log(`   Weather source: ${payload.weather.source}`);
    console.log(`   Air quality source: ${payload.airQuality.source}`);
    console.log(`   News source: ${payload.news.source}`);
    console.log(`   Events source: ${payload.events.source}`);
    console.log(`   Disease source: ${payload.disease.source}`);
    console.log(`   Disease trend source: ${payload.diseaseTrend.source}`);
    console.log(`   Predicted next 24h: ${payload.diseaseTrend.predictedNext24h}`);
    console.log(`   Disease pressure contribution: ${payload.diseaseTrend.pressureContributionPct}%`);
    console.log(`   Risk score: ${payload.riskScore}`);

    console.log('\n🔑 Optional API key status:');
    for (const key of OPTIONAL_KEYS) {
        const present = Boolean(process.env[key]);
        console.log(`   ${key}: ${present ? 'configured' : 'not set (free fallback path active)'}`);
    }
}

runSignalsTest().catch((error) => {
    console.error('❌ Operations signals test failed');
    console.error(error.message);
    process.exit(1);
});
