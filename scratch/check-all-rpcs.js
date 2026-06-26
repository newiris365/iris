const fs = require('fs');
const path = require('path');

function getFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        results = results.concat(getFiles(fullPath, ext));
      }
    } else {
      if (ext.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const srcFiles = getFiles(path.join(__dirname, '../src'), ['.ts', '.tsx', '.js', '.jsx']);

// 1. Get all called RPC functions in source code
const calledRpcs = new Set();
srcFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  // Regex to find .rpc('function_name')
  const rpcRegex = /\.rpc\(\s*['"]([\w_-]+)['"]/g;
  let match;
  while ((match = rpcRegex.exec(content)) !== null) {
    calledRpcs.add(match[1].toLowerCase());
  }
});

console.log(`Found ${calledRpcs.size} unique RPC function calls in source code.`);

// 2. Parse defined functions in supabase_setup.sql
const sqlContent = fs.readFileSync(path.join(__dirname, '../supabase_setup.sql'), 'utf8');
const definedRpcs = new Set();
const functionRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([a-zA-Z0-9_-]+)/gi;
let match;
while ((match = functionRegex.exec(sqlContent)) !== null) {
  definedRpcs.add(match[1].toLowerCase());
}

console.log(`Found ${definedRpcs.size} unique functions defined in supabase_setup.sql.`);

// 3. Find gaps
const missingRpcs = [];
for (const rpc of calledRpcs) {
  if (!definedRpcs.has(rpc)) {
    missingRpcs.push(rpc);
  }
}

console.log('\n--- RPC Analysis Results ---');
if (missingRpcs.length === 0) {
  console.log('✅ Success: All called RPC functions are defined in supabase_setup.sql!');
} else {
  console.log(`❌ Missing RPC functions (${missingRpcs.length}):`);
  missingRpcs.sort().forEach(rpc => {
    console.log(`  - ${rpc}`);
  });
}
