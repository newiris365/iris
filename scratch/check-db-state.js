/**
 * Check the current state of the Supabase database
 * - Lists all existing tables
 * - Lists all existing functions/RPCs
 * - Compares against what's in supabase_setup.sql
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://bxdfmlqzstwcsujdgejn.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4ZGZtbHF6c3R3Y3N1amRnZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY5NDI1NSwiZXhwIjoyMDk3MjcwMjU1fQ.fjEetR8U5JIz3YuFpz6m7TJK6gifRGhHiJxd7A8d1dM';

function supabaseRpc(functionName, body = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/rest/v1/rpc/${functionName}`, SUPABASE_URL);
    const postData = JSON.stringify(body);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function supabaseQuery(sql) {
  // Use the pg_meta API or a raw SQL RPC
  // We'll create a temporary function approach, or use the REST query approach
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Use the Supabase Management API to run SQL
function managementApiQuery(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/pg/query`, SUPABASE_URL);
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('=== Checking Supabase Database State ===\n');
  
  // Parse supabase_setup.sql to find all CREATE TABLE statements
  const sqlFile = fs.readFileSync(path.join(__dirname, '..', 'supabase_setup.sql'), 'utf8');
  
  // Extract table names from CREATE TABLE statements
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?["']?(\w+)["']?/gi;
  const expectedTables = new Set();
  let match;
  while ((match = tableRegex.exec(sqlFile)) !== null) {
    expectedTables.add(match[1].toLowerCase());
  }
  
  // Extract function names from CREATE FUNCTION/CREATE OR REPLACE FUNCTION
  const funcRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?["']?(\w+)["']?\s*\(/gi;
  const expectedFunctions = new Set();
  while ((match = funcRegex.exec(sqlFile)) !== null) {
    expectedFunctions.add(match[1].toLowerCase());
  }
  
  console.log(`Expected tables from SQL file: ${expectedTables.size}`);
  console.log(`Expected functions from SQL file: ${expectedFunctions.size}`);
  console.log('');
  
  // Try to query existing tables via the REST API
  // Method 1: Try querying information_schema via RPC
  console.log('--- Attempting to query database via REST API ---\n');
  
  // Let's try a simple select from a known table to see if connection works
  const testUrl = new URL('/rest/v1/institutions?select=id&limit=1', SUPABASE_URL);
  
  const testResult = await new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    };
    
    const req = https.request(testUrl, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
  
  console.log(`Test query (institutions): status=${testResult.status}`);
  if (testResult.status === 200) {
    console.log(`  Result: ${JSON.stringify(testResult.data).substring(0, 200)}`);
  } else {
    console.log(`  Error: ${JSON.stringify(testResult.data).substring(0, 500)}`);
  }
  console.log('');
  
  // Now try to check each expected table by doing a HEAD/count request
  console.log('--- Checking each expected table existence ---\n');
  
  const existingTables = [];
  const missingTables = [];
  
  const sortedTables = [...expectedTables].sort();
  
  for (const table of sortedTables) {
    try {
      const checkUrl = new URL(`/rest/v1/${table}?select=count&limit=0`, SUPABASE_URL);
      const result = await new Promise((resolve, reject) => {
        const options = {
          method: 'HEAD',
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Prefer': 'count=exact'
          }
        };
        
        const req = https.request(checkUrl, options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({ status: res.statusCode, count: res.headers['content-range'] });
          });
        });
        req.on('error', reject);
        req.end();
      });
      
      if (result.status === 200 || result.status === 206) {
        existingTables.push({ name: table, count: result.count });
      } else {
        missingTables.push(table);
      }
    } catch(e) {
      missingTables.push(table);
    }
  }
  
  console.log(`✅ EXISTING TABLES (${existingTables.length}/${sortedTables.length}):`);
  for (const t of existingTables) {
    console.log(`   ✓ ${t.name} (${t.count || 'unknown count'})`);
  }
  
  console.log('');
  
  if (missingTables.length > 0) {
    console.log(`❌ MISSING TABLES (${missingTables.length}):`);
    for (const t of missingTables) {
      console.log(`   ✗ ${t}`);
    }
  } else {
    console.log('🎉 ALL TABLES EXIST!');
  }
  
  console.log('');
  
  // Check functions by trying to call them (or checking via exec_sql if available)
  console.log('--- Checking RPC functions ---\n');
  
  // Try exec_sql first
  const execTest = await supabaseQuery("SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name");
  if (execTest.status === 200 && Array.isArray(execTest.data)) {
    const dbFunctions = new Set(execTest.data.map(r => r.routine_name.toLowerCase()));
    console.log(`Functions in database: ${dbFunctions.size}`);
    
    const missingFuncs = [...expectedFunctions].filter(f => !dbFunctions.has(f)).sort();
    const extraFuncs = [...dbFunctions].filter(f => !expectedFunctions.has(f)).sort();
    
    if (missingFuncs.length > 0) {
      console.log(`\n❌ MISSING FUNCTIONS (${missingFuncs.length}):`);
      for (const f of missingFuncs) {
        console.log(`   ✗ ${f}`);
      }
    } else {
      console.log('🎉 ALL EXPECTED FUNCTIONS EXIST!');
    }
    
    if (extraFuncs.length > 0) {
      console.log(`\nℹ️  EXTRA FUNCTIONS IN DB (${extraFuncs.length}, not in SQL file):`);
      for (const f of extraFuncs) {
        console.log(`   + ${f}`);
      }
    }
  } else {
    console.log(`Could not query functions via exec_sql RPC (status: ${execTest.status})`);
    console.log(`Response: ${JSON.stringify(execTest.data).substring(0, 300)}`);
    console.log('\nWill try checking individual RPC availability...');
    
    // Check a sample of important functions
    const sampleFunctions = [
      'get_auth_institution_id',
      'get_auth_user_role', 
      'place_canteen_order_atomic',
      'get_hostel_overview',
      'get_dashboard_stats'
    ];
    
    for (const fn of sampleFunctions) {
      try {
        const result = await supabaseRpc(fn, {});
        console.log(`   ${fn}: status=${result.status}`);
      } catch(e) {
        console.log(`   ${fn}: error - ${e.message}`);
      }
    }
  }
  
  console.log('\n=== Done ===');
}

main().catch(console.error);
