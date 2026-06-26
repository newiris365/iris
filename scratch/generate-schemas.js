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

const srcFiles = getFiles(path.join(__dirname, '../src'), ['.ts', '.js']);

// 1. Get defined tables from supabase_setup_min.sql
const sqlContent = fs.readFileSync(path.join(__dirname, '../supabase_setup.sql'), 'utf8');
const sqlLines = sqlContent.split('\n');
const definedTables = new Set();
sqlLines.forEach(line => {
  const match = line.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-zA-Z0-9_-]+)/i);
  if (match) {
    definedTables.add(match[1].toLowerCase());
  }
});

// 2. Scan controllers for Supabase queries
const tableColumns = new Map(); // table_name -> Set of columns

srcFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all matches of: symbol.from('table') where symbol is NOT 'storage'
  // We use a regex that matches: (\w+)\s*\.\s*from\s*\(\s*['"]([\w-]+)['"]\s*\)
  const fromRegex = /(\w+)\s*\.\s*from\s*\(\s*['"]([\w-]+)['"]\s*\)/g;
  let match;
  while ((match = fromRegex.exec(content)) !== null) {
    const caller = match[1];
    const tableName = match[2];
    const fromIndex = match.index;
    
    // Skip if it is a storage call
    if (caller === 'storage') {
      console.log(`Skipping storage bucket reference: ${tableName} in ${path.basename(filePath)}`);
      continue;
    }
    
    if (!tableColumns.has(tableName)) {
      tableColumns.set(tableName, new Set());
    }
    
    // Look ahead 1000 characters for select, insert, update, upsert
    const lookAhead = content.slice(fromIndex, fromIndex + 1000);
    
    // Look for select
    const selectMatch = lookAhead.match(/\.select\(['"]([^'"]+)['"]\)/);
    if (selectMatch) {
      const cols = selectMatch[1];
      cols.split(',').forEach(col => {
        col = col.trim();
        if (col && !col.includes('(') && !col.includes(')') && col !== '*' && !col.includes(':')) {
          tableColumns.get(tableName).add(col);
        }
      });
    }
    
    // Look for insert, update, upsert
    const writeMatch = lookAhead.match(/\.(insert|update|upsert)\(\s*([^\)]+)\)/s);
    if (writeMatch) {
      const body = writeMatch[2].trim();
      
      if (body.startsWith('{') || body.includes('{')) {
        const colonRegex = /(\w+)\s*:/g;
        let colonMatch;
        while ((colonMatch = colonRegex.exec(body)) !== null) {
          tableColumns.get(tableName).add(colonMatch[1]);
        }
        
        const bracesMatch = body.match(/\{([^\}]+)\}/);
        if (bracesMatch) {
          const contents = bracesMatch[1];
          contents.split(',').forEach(part => {
            part = part.trim();
            if (part && !part.includes(':') && /^\w+$/.test(part)) {
              tableColumns.get(tableName).add(part);
            }
          });
        }
      }
    }
  }
});

// Clean and map table columns to database types
const missingTables = [];
for (const [table, cols] of tableColumns.entries()) {
  if (!definedTables.has(table.toLowerCase())) {
    missingTables.push({
      name: table,
      columns: Array.from(cols).sort()
    });
  }
}

missingTables.sort((a, b) => a.name.localeCompare(b.name));

console.log(`Found ${missingTables.length} missing tables with column lists after filtering storage.`);

fs.writeFileSync(
  path.join(__dirname, 'missing-tables-schemas.json'),
  JSON.stringify(missingTables, null, 2),
  'utf8'
);
console.log('Wrote missing-tables-schemas.json successfully.');
