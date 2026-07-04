const JWT = 'mock-sandbox-jwt-token-value.eyJpZCI6ImIwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMiIsImluc3RpdHV0aW9uX2lkIjoiYTAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwicm9sZSI6IkFkbWluIiwiZW1haWwiOiJkaXJlY3RvckBzaWV0LmVkdS5pbiJ9';

async function test() {
  try {
    const res = await fetch('http://localhost:4000/api/v1/admissions/siet-jodhpur', {
      headers: {
        'Authorization': `Bearer ${JWT}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('Response JSON:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Error hitting API:', err);
  }
}

test();
