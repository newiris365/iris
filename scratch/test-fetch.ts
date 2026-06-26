import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('Testing raw fetch to Supabase URL:', url);

async function testFetch() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: { apikey: key },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    console.log('Response Status:', res.status);
    console.log('Response OK:', res.ok);
    const text = await res.text();
    console.log('Response Text (first 200 chars):', text.substring(0, 200));
  } catch (err: any) {
    console.error('Fetch failed with error:', err.message || err);
  }
}

testFetch();
