/// <reference types="node" />
/* eslint-disable no-console */
import assert from 'assert';

async function runSmokeTest() {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

  try {
    const email = `smoke${Date.now()}@test.com`;
    console.log('--- Registering User ---');
    const registerRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password123!', displayName: 'Smoke Tester' }),
    });

    if (!registerRes.ok) throw new Error('Register failed: ' + (await registerRes.text()));

    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password123!' }),
    });

    assert(loginRes.ok, 'Login must succeed');
    const authData = await loginRes.json();
    const token = authData.accessToken;
    assert(token, 'Must return accessToken');
    console.log('Got Access Token:', token.substring(0, 20) + '...');

    console.log('--- Creating Birth Profile ---');
    const bpRes = await fetch(`${BASE_URL}/api/v1/birth-profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        label: 'Smoke Profile',
        birthDate: '1995-05-15',
        birthTime: '08:30:00',
        isBirthTimeKnown: true,
        birthLocation: {
          placeName: 'Hanoi',
          latitude: 21.0285,
          longitude: 105.8542,
          historicalTimezoneId: 'Asia/Ho_Chi_Minh',
        },
      }),
    });

    if (!bpRes.ok) throw new Error('BP failed: ' + (await bpRes.text()));
    const bpData = await bpRes.json();
    assert(bpData.id, 'Must return BirthProfile ID');
    console.log('Birth Profile Created:', bpData.id);

    console.log('--- Creating Natal Chart (save=true) ---');
    const chartRes = await fetch(`${BASE_URL}/api/v1/charts/natal?save=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        birthProfileId: bpData.id,
        houseSystem: 'Placidus',
        includeOptionalPoints: [],
      }),
    });

    if (!chartRes.ok) throw new Error('Chart failed: ' + (await chartRes.text()));
    const chartData = await chartRes.json();

    assert(chartData.id, 'Chart must have an ID');
    assert.strictEqual(chartData.interpretationVersion, '1.0', 'interpretationVersion must be 1.0');
    assert.strictEqual(chartData.interpretations?.length, 21, 'Should have 21 interpretations');

    console.log('Chart Created:', chartData.id);
    console.log('Interpretation Version:', chartData.interpretationVersion);
    console.log('Interpretations Count:', chartData.interpretations?.length);
    console.log('Sample Interpretation:', chartData.interpretations[0].subjectKey);
    console.log('Sample Text:', chartData.interpretations[0].bodyText.substring(0, 50) + '...');

    console.log('--- Getting Natal Chart (GET /charts/:id) ---');
    const getRes = await fetch(`${BASE_URL}/api/v1/charts/${chartData.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(getRes.ok, 'GET Chart must succeed');
    const getData = await getRes.json();
    assert.strictEqual(getData.id, chartData.id, 'GET ID must match POST ID');
    assert.strictEqual(
      getData.interpretationVersion,
      '1.0',
      'GET interpretationVersion must be 1.0',
    );
    assert.strictEqual(
      getData.interpretations?.length,
      21,
      'GET must also have 21 interpretations',
    );

    console.log('GET Chart ID:', getData.id);
    console.log('GET Interpretation Version:', getData.interpretationVersion);
    console.log('GET Interpretations Count:', getData.interpretations?.length);

    console.log('--- Getting Non-Existent Chart (404) ---');
    const notFoundId = '00000000-0000-0000-0000-000000000000';
    const notFoundRes = await fetch(`${BASE_URL}/api/v1/charts/${notFoundId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(notFoundRes.status, 404, 'Must return 404');
    const notFoundData = await notFoundRes.json();
    assert(!notFoundData.details?.stack, 'Must not leak internal stack traces');
    console.log('GET 404 handled correctly');

    console.log('--- Creating Natal Chart (Unknown Time, save=false) ---');
    const unknownRes = await fetch(`${BASE_URL}/api/v1/charts/natal?save=false`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        birthData: {
          birthDate: '1995-05-15',
          isBirthTimeKnown: false,
          birthLocation: {
            placeName: 'Hanoi',
            latitude: 21.0285,
            longitude: 105.8542,
            historicalTimezoneId: 'Asia/Ho_Chi_Minh',
          },
        },
        houseSystem: 'Placidus',
        includeOptionalPoints: [],
      }),
    });

    assert(unknownRes.ok, 'Unknown time chart must succeed');
    const unknownData = await unknownRes.json();
    assert.strictEqual(unknownData.houses?.length, 0, 'Houses must be empty');
    assert.strictEqual(unknownData.angles?.length, 0, 'Angles must be empty');
    assert.strictEqual(
      unknownData.interpretations?.length,
      10,
      'Only PlanetInSign (10) should be present',
    );

    console.log('Unknown Time Chart Houses length:', unknownData.houses?.length);
    console.log('Unknown Time Interpretations length:', unknownData.interpretations?.length);

    console.log('SUCCESS');
    process.exit(0);
  } catch (err) {
    console.error('FAILED', err);
    process.exit(1);
  }
}

runSmokeTest().catch(console.error);
