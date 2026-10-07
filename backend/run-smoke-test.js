import http from 'http';

async function runSmokeTest() {
  try {
    const email = `smoke${Date.now()}@test.com`;
    console.log('--- Registering User ---');
    const registerRes = await fetch('http://localhost:4000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password123!', displayName: 'Smoke Tester' }),
    });

    if (!registerRes.ok) throw new Error('Register failed: ' + (await registerRes.text()));

    const loginRes = await fetch('http://localhost:4000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password123!' }),
    });
    // actually register doesn't return accessToken, login does
    const authData = await loginRes.json();
    const token = authData.accessToken;
    console.log('Got Access Token:', token.substring(0, 20) + '...');

    console.log('--- Creating Birth Profile ---');
    const bpRes = await fetch('http://localhost:4000/api/v1/birth-profiles', {
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
    console.log('Birth Profile Created:', bpData.id);

    console.log('--- Creating Natal Chart (save=true) ---');
    const chartRes = await fetch(`http://localhost:4000/api/v1/charts/natal?save=true`, {
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

    console.log('Chart Created:', chartData.id);
    console.log('Interpretation Version:', chartData.interpretationVersion);
    console.log('Interpretations Count:', chartData.interpretations?.length);
    if (chartData.interpretations?.length > 0) {
      console.log('Sample Interpretation:', chartData.interpretations[0].subjectKey);
      console.log('Sample Text:', chartData.interpretations[0].bodyText.substring(0, 50) + '...');
    }

    console.log('--- Getting Natal Chart (GET /charts/:id) ---');
    const getRes = await fetch(`http://localhost:3000/api/v1/charts/${chartData.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getData = await getRes.json();
    console.log('GET Chart ID:', getData.id);
    console.log('GET Interpretation Version:', getData.interpretationVersion);
    console.log('GET Interpretations Count:', getData.interpretations?.length);

    console.log('--- Creating Natal Chart (Unknown Time, save=false) ---');
    const unknownRes = await fetch(`http://localhost:3000/api/v1/charts/natal?save=false`, {
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
    const unknownData = await unknownRes.json();
    console.log('Unknown Time Chart Houses length:', unknownData.houses?.length);
    console.log('Unknown Time Interpretations length:', unknownData.interpretations?.length);

    console.log('SUCCESS');
    process.exit(0);
  } catch (err) {
    console.error('FAILED', err);
    process.exit(1);
  }
}

runSmokeTest();
