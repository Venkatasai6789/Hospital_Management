import express from 'express';
import axios from 'axios';

const router = express.Router();

const DISTRICT_COORDS = {
    Srivilliputhur: { lat: 9.512, lng: 77.634 },
    Virudhunagar: { lat: 9.585, lng: 77.957 },
    Madurai: { lat: 9.925, lng: 78.119 },
    Krishnankoil: { lat: 9.683, lng: 77.755 },
};

function getDistrictCoords(district) {
    return DISTRICT_COORDS[district] || DISTRICT_COORDS.Madurai;
}

function parseCoordinates(latRaw, lngRaw, district) {
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng, source: 'geolocation' };
    }
    const fallback = getDistrictCoords(district);
    return { ...fallback, source: 'district-fallback' };
}

function normalizeDistrictName(value) {
    const text = String(value || '').toLowerCase();
    if (text.includes('madurai')) return 'Madurai';
    if (text.includes('virudhunagar')) return 'Virudhunagar';
    if (text.includes('srivilliputhur')) return 'Srivilliputhur';
    if (text.includes('krishnankoil')) return 'Krishnankoil';
    return null;
}

async function reverseGeocodeDistrict(lat, lng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
        const { data } = await axios.get(url, {
            timeout: 8000,
            headers: {
                'User-Agent': 'MediConnect/1.0 (operations-signals)',
            },
        });

        const address = data?.address || {};
        const mapped =
            normalizeDistrictName(address.city_district) ||
            normalizeDistrictName(address.state_district) ||
            normalizeDistrictName(address.city) ||
            normalizeDistrictName(address.town) ||
            normalizeDistrictName(address.county);

        return mapped;
    } catch {
        return null;
    }
}

async function fetchWeatherSignal(lat, lng) {
    try {
        const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&timezone=Asia%2FKolkata`;
        const { data } = await axios.get(openMeteoUrl, { timeout: 8000 });
        const current = data.current || {};

        return {
            source: 'open-meteo',
            condition: `WMO-${current.weather_code ?? 'NA'}`,
            temperatureC: Math.round(current.temperature_2m ?? 30),
            humidity: Math.round(current.relative_humidity_2m ?? 65),
            windKph: Math.round(current.wind_speed_10m ?? 12),
            rainMm: Math.round(current.precipitation ?? 0),
        };
    } catch (error) {
        return {
            source: 'fallback',
            condition: 'Partly Cloudy',
            temperatureC: 31,
            humidity: 68,
            windKph: 14,
            rainMm: 2,
            error: error.message,
        };
    }
}

function aqiLabel(usAqi) {
    if (usAqi <= 50) return 'Good';
    if (usAqi <= 100) return 'Moderate';
    if (usAqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (usAqi <= 200) return 'Unhealthy';
    return 'Very Unhealthy';
}

async function fetchAirQualitySignal(lat, lng) {
    try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=pm10,pm2_5,us_aqi&timezone=Asia%2FKolkata`;
        const { data } = await axios.get(url, { timeout: 8000 });
        const current = data.current || {};
        const usAqi = Math.round(Number(current.us_aqi ?? 70));

        return {
            source: 'open-meteo-air-quality',
            usAqi,
            pm2_5: Math.round(Number(current.pm2_5 ?? 22)),
            pm10: Math.round(Number(current.pm10 ?? 41)),
            label: aqiLabel(usAqi),
        };
    } catch (error) {
        return {
            source: 'fallback',
            usAqi: 68,
            pm2_5: 24,
            pm10: 42,
            label: 'Moderate',
            error: error.message,
        };
    }
}

async function fetchNewsSignal(district) {
    try {
        const query = `${district} hospital OR medical OR festival OR weather`; // free GDELT doc search
        const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=5&format=json`;
        const { data } = await axios.get(url, { timeout: 9000 });
        const headlines = (data.articles || []).slice(0, 3).map((item) => item.title).filter(Boolean);

        if (headlines.length > 0) {
            return {
                source: 'gdelt',
                headlines,
            };
        }

        return {
            source: 'fallback',
            headlines: [
                `${district}: local gathering expected to increase evening ER load`,
                `Public advisory issued for hydration and fever screening in ${district}`,
            ],
        };
    } catch (error) {
        return {
            source: 'fallback',
            headlines: [`${district}: no live headlines available, using predicted civic-event signal`],
            error: error.message,
        };
    }
}

async function fetchEventSignal(district) {
    try {
        const { data } = await axios.get('https://date.nager.at/api/v3/NextPublicHolidays/IN', { timeout: 8000 });
        const events = (data || [])
            .slice(0, 3)
            .map((event) => `${event.localName || event.name} (${event.date})`)
            .filter(Boolean);

        if (events.length > 0) {
            return { source: 'nager.date', events };
        }

        const month = new Date().getMonth();
        const likelyFestival = month >= 2 && month <= 5 ? 'Temple festival crowd likely this week' : 'Weekend market crowd expected';
        return {
            source: 'fallback',
            events: [`${district}: ${likelyFestival}`],
        };
    } catch (error) {
        return {
            source: 'fallback',
            events: [`${district}: no external event feed available`],
            error: error.message,
        };
    }
}

async function fetchIstTimeSignal() {
    try {
        const { data } = await axios.get('https://worldtimeapi.org/api/timezone/Asia/Kolkata', { timeout: 7000 });
        return {
            source: 'worldtimeapi',
            timezone: data.timezone || 'Asia/Kolkata',
            iso: data.datetime || new Date().toISOString(),
            timeLabel: new Date(data.datetime || Date.now()).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata',
            }),
        };
    } catch (error) {
        const now = new Date();
        return {
            source: 'fallback',
            timezone: 'Asia/Kolkata',
            iso: now.toISOString(),
            timeLabel: now.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata',
            }),
            error: error.message,
        };
    }
}

async function fetchDiseaseSignal() {
    try {
        const { data } = await axios.get('https://disease.sh/v3/covid-19/countries/India?strict=true', { timeout: 8000 });
        const active = Math.max(0, Number(data.active || 0));
        const todayCases = Math.max(0, Number(data.todayCases || 0));
        const severity = todayCases > 3000 ? 'high' : todayCases > 1200 ? 'moderate' : 'low';

        return {
            source: 'disease.sh',
            summary: `India active surveillance cases: ${active.toLocaleString()}, new today: ${todayCases.toLocaleString()}`,
            active,
            todayCases,
            severity,
        };
    } catch (error) {
        return {
            source: 'fallback',
            summary: 'Seasonal fever and respiratory trend expected to stay moderate this week.',
            active: 0,
            todayCases: 0,
            severity: 'moderate',
            error: error.message,
        };
    }
}

async function fetchDiseaseTrendSeries() {
    try {
        const { data } = await axios.get('https://disease.sh/v3/covid-19/historical/India?lastdays=30', { timeout: 9000 });
        const timelineCases = data?.timeline?.cases || {};
        const timelineDeaths = data?.timeline?.deaths || {};

        const entries = Object.entries(timelineCases)
            .map(([dateLabel, cumulativeCases]) => ({
                dateLabel,
                cumulativeCases: Number(cumulativeCases || 0),
                cumulativeDeaths: Number(timelineDeaths[dateLabel] || 0),
            }))
            .sort((a, b) => new Date(a.dateLabel).getTime() - new Date(b.dateLabel).getTime());

        const series = entries.map((entry, index) => {
            const prev = index > 0 ? entries[index - 1].cumulativeCases : entry.cumulativeCases;
            const dailyCases = Math.max(0, entry.cumulativeCases - prev);
            return {
                date: entry.dateLabel,
                dailyCases,
                cumulativeCases: entry.cumulativeCases,
                cumulativeDeaths: entry.cumulativeDeaths,
            };
        });

        const rollingWindow = 7;
        const seriesWithAvg = series.map((item, index) => {
            const start = Math.max(0, index - rollingWindow + 1);
            const subset = series.slice(start, index + 1);
            const avg7 = Math.round(subset.reduce((sum, row) => sum + row.dailyCases, 0) / subset.length);
            return {
                ...item,
                avg7,
            };
        });

        const latest = seriesWithAvg[seriesWithAvg.length - 1] || { dailyCases: 0, avg7: 0 };
        const last3 = seriesWithAvg.slice(-3);
        const slope = last3.length > 1
            ? (last3[last3.length - 1].dailyCases - last3[0].dailyCases) / (last3.length - 1)
            : 0;
        const predictedNext24h = Math.max(
            0,
            Math.round((Number(latest.avg7 || latest.dailyCases || 0) * 0.78) + (slope * 0.22))
        );
        const pressureContributionPct = Math.max(
            0,
            Math.min(100, Math.round((predictedNext24h / 4000) * 100))
        );

        return {
            source: 'disease.sh-historical',
            metric: 'dailyCases',
            series: seriesWithAvg,
            predictedNext24h,
            pressureContributionPct,
        };
    } catch (error) {
        const today = new Date();
        const fallbackSeries = Array.from({ length: 14 }).map((_, idx) => {
            const d = new Date(today.getTime() - (13 - idx) * 24 * 60 * 60 * 1000);
            const dailyCases = 900 + Math.round(Math.sin(idx * 0.8) * 220) + (idx % 3) * 35;
            return {
                date: d.toLocaleDateString('en-US'),
                dailyCases,
                cumulativeCases: 0,
                cumulativeDeaths: 0,
                avg7: 0,
            };
        });

        const withAvg = fallbackSeries.map((item, index) => {
            const start = Math.max(0, index - 6);
            const subset = fallbackSeries.slice(start, index + 1);
            const avg7 = Math.round(subset.reduce((sum, row) => sum + row.dailyCases, 0) / subset.length);
            return { ...item, avg7 };
        });

        const latest = withAvg[withAvg.length - 1] || { dailyCases: 0, avg7: 0 };
        const last3 = withAvg.slice(-3);
        const slope = last3.length > 1
            ? (last3[last3.length - 1].dailyCases - last3[0].dailyCases) / (last3.length - 1)
            : 0;
        const predictedNext24h = Math.max(
            0,
            Math.round((Number(latest.avg7 || latest.dailyCases || 0) * 0.8) + (slope * 0.2))
        );
        const pressureContributionPct = Math.max(
            0,
            Math.min(100, Math.round((predictedNext24h / 4000) * 100))
        );

        return {
            source: 'fallback',
            metric: 'dailyCases',
            series: withAvg,
            predictedNext24h,
            pressureContributionPct,
            error: error.message,
        };
    }
}

function computeRiskScore({ weather, airQuality, news, events, disease, diseaseTrend }) {
    let score = 30;
    score += weather.rainMm > 2 ? 18 : 4;
    score += weather.windKph > 18 ? 8 : 3;
    score += airQuality.usAqi > 100 ? 12 : airQuality.usAqi > 60 ? 6 : 2;
    score += (news.headlines || []).length > 0 ? 8 : 0;
    score += (events.events || []).length > 0 ? 12 : 0;
    const recent = diseaseTrend?.series?.slice(-3) || [];
    const trendAvg = recent.length > 0 ? recent.reduce((sum, row) => sum + Number(row.dailyCases || 0), 0) / recent.length : 0;
    score += trendAvg > 2500 ? 12 : trendAvg > 1200 ? 7 : 3;
    score += disease.severity === 'moderate' ? 10 : 4;
    score += disease.severity === 'high' ? 6 : 0;
    return Math.max(0, Math.min(100, score));
}

router.get('/signals', async (req, res) => {
    try {
        const districtRequested = String(req.query.district || 'Madurai');
        const hospitalName = String(req.query.hospitalName || 'Hospital');
        const coords = parseCoordinates(req.query.lat, req.query.lng, districtRequested);
        const reverseDistrict = await reverseGeocodeDistrict(coords.lat, coords.lng);
        const district = reverseDistrict || districtRequested;

        const [weather, airQuality, news, events, disease, diseaseTrend, istTime] = await Promise.all([
            fetchWeatherSignal(coords.lat, coords.lng),
            fetchAirQualitySignal(coords.lat, coords.lng),
            fetchNewsSignal(district),
            fetchEventSignal(district),
            fetchDiseaseSignal(),
            fetchDiseaseTrendSeries(),
            fetchIstTimeSignal(),
        ]);

        const riskScore = computeRiskScore({ weather, airQuality, news, events, disease, diseaseTrend });
        const recommendation = riskScore >= 70
            ? `High pressure expected in ${hospitalName}. Move 2-3 staff to emergency triage and reserve ICU beds.`
            : `Stable pressure for ${hospitalName}. Maintain standard staffing and monitor hourly occupancy.`;

        res.json({
            district,
            hospitalName,
            fetchedAt: new Date().toISOString(),
            geo: {
                source: coords.source,
                lat: coords.lat,
                lng: coords.lng,
                district,
            },
            istTime,
            weather,
            airQuality,
            news,
            events,
            disease,
            diseaseTrend,
            riskScore,
            recommendation,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to load operations signals',
            message: error.message,
        });
    }
});

export default router;
